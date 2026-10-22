export type ExistingRepairAnalysis = {
  id: string;
  evidence_hash: string;
  analysis_status: string;
  [key: string]: unknown;
};

export type ExistingAnalysisResolution =
  | { kind: "continue" }
  | { kind: "return"; analysis: ExistingRepairAnalysis; kickWorker: boolean };

export type ExistingAnalysisDependencies = {
  requeue: (id: string) => Promise<{ data: ExistingRepairAnalysis | null; error: unknown | null }>;
  getActive: (id: string) => Promise<ExistingRepairAnalysis | null>;
  archive: (id: string) => Promise<void>;
};

const DEDUPE_STATUSES = ["complete", "pending", "analyzing", "quota_blocked"];

export async function resolveExistingRepairAnalysis(
  existing: ExistingRepairAnalysis | null,
  evidenceHash: string,
  deps: ExistingAnalysisDependencies,
): Promise<ExistingAnalysisResolution> {
  if (!existing) return { kind: "continue" };
  if (existing.evidence_hash !== evidenceHash) {
    await deps.archive(existing.id);
    return { kind: "continue" };
  }
  if (DEDUPE_STATUSES.includes(existing.analysis_status)) {
    return { kind: "return", analysis: existing, kickWorker: false };
  }
  if (existing.analysis_status !== "failed") return { kind: "continue" };

  const { data, error } = await deps.requeue(existing.id);
  if (error) throw error;
  if (data) return { kind: "return", analysis: data, kickWorker: true };

  const current = await deps.getActive(existing.id);
  if (current && DEDUPE_STATUSES.includes(current.analysis_status)) {
    return { kind: "return", analysis: current, kickWorker: false };
  }
  return { kind: "continue" };
}
