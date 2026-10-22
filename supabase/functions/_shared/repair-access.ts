export type RepairSource = "user" | "admin" | "system_core";

export async function resolveRepairSource(
  requestedSource: unknown,
  userId: string,
  mlsListingId: string,
  verifyAdmin: () => Promise<boolean>,
  warn: (message: string, details: { userId: string; mlsListingId: string }) => void = console.warn,
): Promise<RepairSource> {
  if (requestedSource !== "admin") return "user";

  try {
    if (await verifyAdmin()) return "admin";
  } catch {
    // A failed role lookup must never grant the requested privilege.
  }
  warn("Unverified admin source downgraded", { userId, mlsListingId });
  return "user";
}

export type QuotaInsertResult<T> = { data: T | null; error: unknown | null };

export type QuotaEnqueueResult<T> =
  | { kind: "exhausted"; analysis: T }
  | { kind: "insert"; data: T | null; error: unknown | null };

export async function enqueueWithQuota<T>(dependencies: {
  claim: () => Promise<number | null>;
  insert: () => Promise<QuotaInsertResult<T>>;
  refund: (claimedCount: number) => Promise<void>;
  onExhausted: () => Promise<T>;
  logRefundFailure: (error: unknown) => void;
}): Promise<QuotaEnqueueResult<T>> {
  const claimedCount = await dependencies.claim();
  if (claimedCount === null) {
    return { kind: "exhausted", analysis: await dependencies.onExhausted() };
  }

  let result: QuotaInsertResult<T>;
  try {
    result = await dependencies.insert();
  } catch (error) {
    result = { data: null, error };
  }
  if (!result.error && result.data) return { kind: "insert", ...result };

  try {
    await dependencies.refund(claimedCount);
  } catch (error) {
    try {
      dependencies.logRefundFailure(error);
    } catch {
      // Refund logging must not hide the original enqueue failure.
    }
  }
  return {
    kind: "insert",
    data: null,
    error: result.error ?? new Error("Pending analysis insert returned no row"),
  };
}

export async function getQuotaBlockedAnalysis<T>(dependencies: {
  findOwnSentinel: () => Promise<T | null>;
  archiveDisplaceable: () => Promise<void>;
  findOtherLiveAnalysis: () => Promise<T | null>;
  insertSentinel: () => Promise<QuotaInsertResult<T>>;
  findActiveAnalysis: () => Promise<T | null>;
}): Promise<T> {
  const existingSentinel = await dependencies.findOwnSentinel();
  if (existingSentinel) return existingSentinel;

  await dependencies.archiveDisplaceable();
  const otherLiveAnalysis = await dependencies.findOtherLiveAnalysis();
  if (otherLiveAnalysis) return otherLiveAnalysis;

  let inserted: QuotaInsertResult<T>;
  try {
    inserted = await dependencies.insertSentinel();
  } catch (error) {
    inserted = { data: null, error };
  }
  if (!inserted.error && inserted.data) return inserted.data;

  const activeAnalysis = await dependencies.findActiveAnalysis();
  if (activeAnalysis) return activeAnalysis;
  throw inserted.error ?? new Error("Unable to create quota-blocked analysis");
}
