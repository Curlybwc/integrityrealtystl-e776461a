export type FailureKind = "transient" | "permanent";
export type FailureStage = "vision" | "pricing" | "writeback" | "worker";

export class RepairPipelineError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    readonly stage: FailureStage,
    readonly status?: number,
  ) {
    super(message);
    this.name = "RepairPipelineError";
  }
}

export type RepairQueueRow = {
  id: string;
  is_active: boolean;
  analysis_status: string;
  attempt_count: number;
  updated_at: string;
  created_at: string;
  priority: number;
  evidence_snapshot?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type RepairFailureDetail = {
  provider: string;
  stage: FailureStage;
  kind: FailureKind;
  message: string;
  status?: number;
  at: string;
};

export type RepairQueueDependencies<Rules> = {
  now: () => Date;
  getStaleAnalyzing: (cutoff: string) => Promise<RepairQueueRow[]>;
  reap: (row: RepairQueueRow, patch: Record<string, unknown>) => Promise<{ data: RepairQueueRow | null; error: unknown | null }>;
  getCandidates: (limit: number, excludeIds: string[]) => Promise<RepairQueueRow[]>;
  claim: (row: RepairQueueRow) => Promise<{ data: RepairQueueRow | null; error: unknown | null }>;
  writeAttempt: (row: RepairQueueRow, patch: Record<string, unknown>) => Promise<{ data: RepairQueueRow | null; error: unknown | null }>;
  getRules: () => Promise<{ rules: Rules; pricingVersion: number } | null>;
  callVision: (snapshot: Record<string, unknown>) => Promise<unknown>;
  priceRepairs: (observations: unknown, sqft: number, baths: number, rules: Rules) => {
    line_items: Record<string, number>;
    total: number;
    gut_rehab_mode: boolean;
  };
  maxAttempts: number;
  staleMinutes: number;
  batchSize?: number;
  logger?: Pick<Console, "error">;
};

export type RepairQueueResult = {
  id: string;
  status: string;
  total?: number;
};

export function positiveIntegerSetting(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : String(error);
}

function classifyFailure(stage: FailureStage, error: unknown, at: Date): RepairFailureDetail {
  const typed = error instanceof RepairPipelineError ? error : null;
  const status = typed?.status;
  const kind: FailureKind = stage === "pricing"
    ? "permanent"
    : stage === "writeback" || stage === "worker"
    ? "transient"
    : status === undefined || status === 408 || status === 429 || status >= 500
    ? "transient"
    : "permanent";
  const message = errorMessage(error).replace(/\s+/g, " ").trim().slice(0, 1000);
  return {
    provider: typed?.provider ?? (stage === "vision" ? "lovable_ai_gateway" : "internal"),
    stage,
    kind,
    message,
    ...(status === undefined ? {} : { status }),
    at: at.toISOString(),
  };
}

function failureReason(detail: RepairFailureDetail): string {
  return `${detail.stage}: ${detail.message}`.slice(0, 300);
}

function failurePatch(detail: RepairFailureDetail, attemptCount: number, maxAttempts: number) {
  return {
    analysis_status: detail.kind === "transient" && attemptCount < maxAttempts ? "pending" : "failed",
    failure_reason: failureReason(detail),
    failure_kind: detail.kind,
    failure_detail: detail,
  };
}

function log(logger: Pick<Console, "error">, message: string, id: string, error?: unknown) {
  logger.error(message, id, error);
}

export async function processRepairQueue<Rules>(
  deps: RepairQueueDependencies<Rules>,
): Promise<RepairQueueResult[]> {
  const logger = deps.logger ?? console;
  const batchSize = deps.batchSize ?? 3;
  const now = deps.now();
  const cutoff = new Date(now.getTime() - deps.staleMinutes * 60_000).toISOString();

  const reapedIds = new Set<string>();
  for (const row of await deps.getStaleAnalyzing(cutoff)) {
    const detail = classifyFailure("worker", new Error("Analysis worker stalled or was interrupted"), now);
    const patch = failurePatch(detail, row.attempt_count, deps.maxAttempts);
    const { data, error } = await deps.reap(row, patch);
    if (error) log(logger, "stale analysis reap failed", row.id, error);
    else if (!data) log(logger, "stale analysis reap skipped; claim changed", row.id);
    else reapedIds.add(row.id);
  }

  const rules = await deps.getRules();
  if (!rules) throw new Error("No active pricing rules");

  const candidates = await deps.getCandidates(batchSize * 3, [...reapedIds]);
  const claimed: RepairQueueRow[] = [];
  for (const candidate of candidates) {
    if (claimed.length >= batchSize) break;
    const { data, error } = await deps.claim(candidate);
    if (error) {
      log(logger, "repair analysis claim failed", candidate.id, error);
      continue;
    }
    if (!data) {
      log(logger, "repair analysis claim skipped; another worker owns it", candidate.id);
      continue;
    }
    claimed.push(data);
  }

  const results: RepairQueueResult[] = [];
  for (const row of claimed) {
    const snapshot = row.evidence_snapshot ?? {};
    let observations: unknown;
    try {
      observations = await deps.callVision(snapshot);
    } catch (error) {
      const detail = classifyFailure("vision", error, deps.now());
      const { data, error: writeError } = await deps.writeAttempt(
        row,
        failurePatch(detail, row.attempt_count, deps.maxAttempts),
      );
      if (writeError) log(logger, "repair analysis failure write failed", row.id, writeError);
      else if (data) results.push({ id: row.id, status: data.analysis_status });
      else log(logger, "repair analysis failure write skipped; claim changed", row.id);
      continue;
    }

    let priced: ReturnType<RepairQueueDependencies<Rules>["priceRepairs"]>;
    try {
      priced = deps.priceRepairs(
        observations,
        Number(snapshot.sqft ?? 0),
        Number(snapshot.baths ?? 0),
        rules.rules,
      );
    } catch (error) {
      const detail = classifyFailure("pricing", error, deps.now());
      const { data, error: writeError } = await deps.writeAttempt(
        row,
        failurePatch(detail, row.attempt_count, deps.maxAttempts),
      );
      if (writeError) log(logger, "repair analysis failure write failed", row.id, writeError);
      else if (data) results.push({ id: row.id, status: data.analysis_status });
      else log(logger, "repair analysis failure write skipped; claim changed", row.id);
      continue;
    }

    const { data: completed, error: completionError } = await deps.writeAttempt(row, {
      analysis_status: "complete",
      observations,
      line_items: priced.line_items,
      total_repair_estimate: priced.total,
      gut_rehab_mode: priced.gut_rehab_mode,
      pricing_version: rules.pricingVersion,
      engine_version: "repair-engine-v2",
      model: "google/gemini-2.5-flash",
      photo_count_analyzed: Math.min(12, ((snapshot.photo_urls as unknown[]) ?? []).length),
      analyzed_at: deps.now().toISOString(),
      failure_reason: null,
      failure_kind: null,
      failure_detail: null,
    });
    if (completionError) {
      const error = new RepairPipelineError(
        `Unable to write completed analysis: ${errorMessage(completionError)}`,
        "internal",
        "writeback",
      );
      const detail = classifyFailure("writeback", error, deps.now());
      const { data, error: writeError } = await deps.writeAttempt(
        row,
        failurePatch(detail, row.attempt_count, deps.maxAttempts),
      );
      if (writeError) log(logger, "repair analysis failure write failed", row.id, writeError);
      else if (data) results.push({ id: row.id, status: data.analysis_status });
      else log(logger, "repair analysis failure write skipped; claim changed", row.id);
    } else if (completed) {
      results.push({ id: row.id, status: "complete", total: priced.total });
    } else {
      log(logger, "repair analysis completion skipped; claim changed", row.id);
    }
  }
  return results;
}
