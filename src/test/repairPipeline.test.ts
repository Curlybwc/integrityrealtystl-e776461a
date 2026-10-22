import { describe, expect, it, vi } from "vitest";
import { resolveExistingRepairAnalysis } from "../../supabase/functions/_shared/repair-enqueue";
import {
  processRepairQueue,
  positiveIntegerSetting,
  RepairPipelineError,
  type RepairQueueDependencies,
  type RepairQueueRow,
} from "../../supabase/functions/_shared/repair-queue";

const NOW = new Date("2026-10-19T15:00:00Z");

function repairRow(id: string, overrides: Partial<RepairQueueRow> = {}): RepairQueueRow {
  return {
    id,
    is_active: true,
    analysis_status: "pending",
    attempt_count: 0,
    updated_at: "2026-10-19T14:00:00.000Z",
    created_at: `2026-10-19T14:${id.padStart(2, "0")}:00.000Z`,
    priority: 2,
    evidence_snapshot: { sqft: 1200, baths: 2, photo_urls: [], id },
    ...overrides,
  };
}

function workerHarness(initial: RepairQueueRow[], options: {
  vision?: () => Promise<unknown>;
  failCompletion?: boolean;
  beforeClaim?: (row: RepairQueueRow) => void;
  maxAttempts?: number;
} = {}) {
  const rows = new Map(initial.map((row) => [row.id, { ...row }]));
  const vision = vi.fn(options.vision ?? (async () => ({ kitchen: {} })));
  const completionWrites: string[] = [];
  const processedVision: string[] = [];
  const dependencies: RepairQueueDependencies<Record<string, never>> = {
    now: () => new Date(NOW),
    staleMinutes: 15,
    maxAttempts: options.maxAttempts ?? 3,
    getStaleAnalyzing: async (cutoff) => [...rows.values()].filter(
      (row) => row.is_active && row.analysis_status === "analyzing" && row.updated_at <= cutoff,
    ),
    reap: async (read, patch) => {
      const row = rows.get(read.id);
      if (!row || !row.is_active || row.analysis_status !== "analyzing" || row.attempt_count !== read.attempt_count) {
        return { data: null, error: null };
      }
      Object.assign(row, patch);
      return { data: row, error: null };
    },
    getCandidates: async (limit, excludeIds) => [...rows.values()]
      .filter((row) => row.is_active && row.analysis_status === "pending" && !excludeIds.includes(row.id))
      .sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at))
      .slice(0, limit),
    claim: async (read) => {
      options.beforeClaim?.(read);
      const row = rows.get(read.id);
      if (!row || !row.is_active || row.analysis_status !== "pending" || row.attempt_count !== read.attempt_count) {
        return { data: null, error: null };
      }
      Object.assign(row, { analysis_status: "analyzing", attempt_count: row.attempt_count + 1 });
      return { data: row, error: null };
    },
    writeAttempt: async (read, patch) => {
      const row = rows.get(read.id);
      if (!row || row.analysis_status !== "analyzing" || row.attempt_count !== read.attempt_count) {
        return { data: null, error: null };
      }
      if (patch.analysis_status === "complete") {
        completionWrites.push(read.id);
        if (options.failCompletion) {
          options.failCompletion = false;
          return { data: null, error: new Error("database unavailable") };
        }
      }
      Object.assign(row, patch);
      return { data: row, error: null };
    },
    getRules: async () => ({ rules: {}, pricingVersion: 1 }),
    callVision: async (snapshot) => {
      processedVision.push(String(snapshot.id));
      return vision();
    },
    priceRepairs: () => ({ line_items: {}, total: 123, gut_rehab_mode: false }),
    logger: { error: vi.fn() },
  };
  return { rows, dependencies, vision, completionWrites, processedVision };
}

describe("repair analysis enqueue recovery", () => {
  it("requeues a failed analysis with unchanged evidence without charging quota or inserting", async () => {
    const old = {
      id: "same-row",
      evidence_hash: "hash-a",
      analysis_status: "failed",
      failure_reason: "vision: gateway unavailable",
      failure_kind: "transient",
      failure_detail: { message: "gateway unavailable" },
      attempt_count: 3,
      requested_by: "first-user",
      priority: 2,
    };
    let quotaCount = 11;
    const insert = vi.fn();
    const requeue = vi.fn(async (id: string) => ({
      data: {
        ...old,
        id,
        analysis_status: "pending",
        failure_reason: null,
        failure_kind: null,
        failure_detail: null,
        attempt_count: 0,
      },
      error: null,
    }));
    const resolution = await resolveExistingRepairAnalysis(old, "hash-a", {
      requeue,
      getActive: vi.fn(async () => null),
      archive: vi.fn(async () => {}),
    });

    if (resolution.kind === "continue") {
      quotaCount++;
      insert();
    }
    expect(resolution).toMatchObject({
      kind: "return",
      kickWorker: true,
      analysis: {
        id: "same-row",
        analysis_status: "pending",
        failure_reason: null,
        failure_kind: null,
        failure_detail: null,
        attempt_count: 0,
        requested_by: "first-user",
        priority: 2,
      },
    });
    expect(requeue).toHaveBeenCalledWith("same-row");
    expect(quotaCount).toBe(11);
    expect(insert).not.toHaveBeenCalled();
  });

  it("archives changed evidence and proceeds to charge and enqueue a new row", async () => {
    const old = { id: "old", evidence_hash: "hash-a", analysis_status: "complete", is_active: true };
    const archive = vi.fn(async () => { old.is_active = false; });
    const resolution = await resolveExistingRepairAnalysis(old, "hash-b", {
      requeue: vi.fn(async () => ({ data: null, error: null })),
      getActive: vi.fn(async () => old),
      archive,
    });
    const newRow = { id: "new", evidence_hash: "hash-b" };
    let quotaCount = 11;
    if (resolution.kind === "continue") quotaCount++;

    expect(resolution.kind).toBe("continue");
    expect(old.is_active).toBe(false);
    expect(archive).toHaveBeenCalledWith("old");
    expect(quotaCount).toBe(12);
    expect(newRow).toMatchObject({ id: "new", evidence_hash: "hash-b" });
  });

  it.each(["complete", "pending", "analyzing"] as const)("returns a same-evidence %s analysis unchanged", async (status) => {
    const old = { id: status, evidence_hash: "hash-a", analysis_status: status };
    const requeue = vi.fn();
    const resolution = await resolveExistingRepairAnalysis(old, "hash-a", {
      requeue,
      getActive: vi.fn(),
      archive: vi.fn(),
    });
    expect(resolution).toEqual({ kind: "return", analysis: old, kickWorker: false });
    expect(requeue).not.toHaveBeenCalled();
  });
});

describe("repair analysis queue worker", () => {
  it("requeues a stale analyzing row below the attempt limit", async () => {
    const harness = workerHarness([
      repairRow("stale", { analysis_status: "analyzing", attempt_count: 1, updated_at: "2026-10-19T14:44:00Z" }),
    ]);
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("stale")).toMatchObject({
      analysis_status: "pending",
      attempt_count: 1,
      failure_kind: "transient",
      failure_detail: {
        provider: "internal",
        stage: "worker",
        kind: "transient",
        message: "Analysis worker stalled or was interrupted",
      },
      failure_reason: "worker: Analysis worker stalled or was interrupted",
    });
    expect(harness.vision).not.toHaveBeenCalled();
  });

  it("fails a stale analyzing row at the attempt limit with its failure details", async () => {
    const harness = workerHarness([
      repairRow("stale", { analysis_status: "analyzing", attempt_count: 3, updated_at: "2026-10-19T14:44:00Z" }),
    ]);
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("stale")).toMatchObject({
      analysis_status: "failed",
      failure_kind: "transient",
      failure_detail: { stage: "worker", message: "Analysis worker stalled or was interrupted" },
    });
  });

  it("leaves a fresh analyzing row alone", async () => {
    const fresh = repairRow("fresh", { analysis_status: "analyzing", attempt_count: 1, updated_at: "2026-10-19T14:59:00Z" });
    const harness = workerHarness([fresh]);
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("fresh")).toEqual(fresh);
    expect(harness.vision).not.toHaveBeenCalled();
  });

  it("never processes the same row twice across overlapping worker runs", async () => {
    const harness = workerHarness(Array.from({ length: 4 }, (_, index) => repairRow(`row-${index}`)));
    const [first, second] = await Promise.all([
      processRepairQueue(harness.dependencies),
      processRepairQueue(harness.dependencies),
    ]);
    expect(harness.vision).toHaveBeenCalledTimes(4);
    expect(harness.completionWrites).toHaveLength(4);
    expect(first.map(({ id }) => id).filter((id) => second.some((row) => row.id === id))).toEqual([]);
    expect(new Set(harness.processedVision).size).toBe(4);
  });

  it("claims up to the batch size when a candidate is claimed by another worker mid-pass", async () => {
    let raced = false;
    const harness = workerHarness(Array.from({ length: 5 }, (_, index) => repairRow(`row-${index}`)), {
      beforeClaim: (candidate) => {
        if (!raced && candidate.id === "row-1") {
          raced = true;
          const row = harness.rows.get(candidate.id)!;
          row.analysis_status = "analyzing";
          row.attempt_count++;
        }
      },
    });
    const results = await processRepairQueue(harness.dependencies);
    expect(results).toHaveLength(3);
    expect(harness.vision).toHaveBeenCalledTimes(3);
  });

  it("processes the oldest pending row first within a priority", async () => {
    const harness = workerHarness([
      repairRow("newest", { created_at: "2026-10-19T14:03:00Z" }),
      repairRow("oldest", { created_at: "2026-10-19T14:01:00Z" }),
      repairRow("middle", { created_at: "2026-10-19T14:02:00Z" }),
      repairRow("higher-priority", { priority: 1, created_at: "2026-10-19T14:05:00Z" }),
    ]);
    await processRepairQueue(harness.dependencies);
    expect(harness.processedVision).toEqual(["higher-priority", "oldest", "middle"]);
  });

  it("records a gateway 429 as transient and retries the row", async () => {
    const harness = workerHarness([repairRow("row-1")], {
      vision: async () => { throw new RepairPipelineError("AI gateway 429: Rate limit reached", "lovable_ai_gateway", "vision", 429); },
    });
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("row-1")).toMatchObject({
      analysis_status: "pending",
      attempt_count: 1,
      failure_kind: "transient",
      failure_detail: {
        provider: "lovable_ai_gateway",
        stage: "vision",
        kind: "transient",
        status: 429,
        message: "AI gateway 429: Rate limit reached",
      },
      failure_reason: "vision: AI gateway 429: Rate limit reached",
    });
  });

  it("records a gateway 400 as permanent and fails the row immediately", async () => {
    const harness = workerHarness([repairRow("row-1")], {
      vision: async () => { throw new RepairPipelineError("AI gateway 400: Bad request", "lovable_ai_gateway", "vision", 400); },
    });
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("row-1")).toMatchObject({
      analysis_status: "failed",
      failure_kind: "permanent",
      failure_detail: { stage: "vision", status: 400, kind: "permanent" },
    });
  });

  it("records a gateway timeout as transient", async () => {
    const harness = workerHarness([repairRow("row-1")], {
      vision: async () => { throw new RepairPipelineError("AI gateway 408: Request timeout", "lovable_ai_gateway", "vision", 408); },
    });
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("row-1")).toMatchObject({
      analysis_status: "pending",
      failure_kind: "transient",
      failure_detail: { stage: "vision", status: 408, kind: "transient" },
    });
  });

  it("fails on a transient error at the final attempt and preserves its detail", async () => {
    const harness = workerHarness([repairRow("row-1", { attempt_count: 2 })], {
      vision: async () => { throw new RepairPipelineError("AI gateway 503: unavailable", "lovable_ai_gateway", "vision", 503); },
    });
    await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("row-1")).toMatchObject({
      analysis_status: "failed",
      attempt_count: 3,
      failure_kind: "transient",
      failure_detail: { status: 503, message: "AI gateway 503: unavailable" },
    });
  });

  it("records failed completion writes as transient writeback failures", async () => {
    const harness = workerHarness([repairRow("row-1")], { failCompletion: true });
    const results = await processRepairQueue(harness.dependencies);
    expect(harness.rows.get("row-1")).toMatchObject({
      analysis_status: "pending",
      failure_kind: "transient",
      failure_detail: {
        provider: "internal",
        stage: "writeback",
        kind: "transient",
        message: "Unable to write completed analysis: database unavailable",
      },
    });
    expect(results).toMatchObject([{ id: "row-1", status: "pending" }]);
    expect(results).not.toContainEqual(expect.objectContaining({ status: "complete" }));
  });

  it("uses defaults for missing or invalid positive integer settings", () => {
    expect(positiveIntegerSetting(undefined, 3)).toBe(3);
    expect(positiveIntegerSetting("invalid", 15)).toBe(15);
    expect(positiveIntegerSetting("0", 15)).toBe(15);
    expect(positiveIntegerSetting("5", 3)).toBe(5);
  });
});
