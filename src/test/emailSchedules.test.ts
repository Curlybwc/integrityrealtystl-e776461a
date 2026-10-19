import { describe, expect, it, vi } from "vitest";
import {
  getScheduleCadenceBucket,
  getSoldSchedulePlan,
  processEmailSchedule,
  soldScheduleCoverNote,
  type EmailSchedule,
  type ScheduleDependencies,
  type ScheduleRunResult,
  type SoldSchedulePlan,
} from "../../supabase/functions/_shared/email-schedules";
import type { SoldRow } from "../../supabase/functions/_shared/sold-report";

const schedule: EmailSchedule = {
  id: "test-schedule",
  client_name: "Mark Parkinson",
  client_email: "mparkinson@example.org",
  source_type: "sold_report",
  config: { county: "St. Charles County", lookbackDays: 30 },
  cadence: "monthly",
  send_mode: "automatic",
  file_format: "xlsx",
  is_active: true,
  created_at: "2026-10-19T00:00:00Z",
};

const row: SoldRow = {
  address: "123 Main St",
  city: "St. Charles",
  state: "MO",
  zip: "63301",
  soldDate: "2026-10-18",
  mlsNumber: "MLS-1",
};

function harness() {
  const claims = new Set<string>();
  const outcomes: ScheduleRunResult[] = [];
  const attempts = new Map<string, { key: string; plan: SoldSchedulePlan | null }>();
  const records: (ScheduleRunResult & { periodTo: string | null })[] = [];
  const deps: ScheduleDependencies = {
    now: new Date("2026-10-19T12:00:00Z"),
    emailConfigured: true,
    latestSuccessfulPeriodTo: vi.fn(async () =>
      records.filter((record) => record.status === "sent" && record.periodTo !== null)
        .map((record) => record.periodTo!).sort().pop() ?? null),
    claim: vi.fn(async (current, bucket, plan) => {
      const key = `${current.id}/${bucket}`;
      if (claims.has(key)) return null;
      claims.add(key);
      const id = `attempt-${attempts.size + 1}`;
      attempts.set(id, { key, plan });
      return id;
    }),
    successfulSends: vi.fn(async (_id, fromDate) => records.filter((record) => record.periodTo !== null && record.periodTo >= fromDate)),
    fetchRows: vi.fn(async () => [row]),
    buildFile: vi.fn(() => ({ filename: "sold-report.xlsx", contentType: "application/xlsx", bytes: new Uint8Array([1, 2, 3]) })),
    isStillActive: vi.fn(async () => true),
    deliver: vi.fn(async () => "provider-1"),
    finish: vi.fn(async (id, result) => {
      const attempt = attempts.get(id)!;
      outcomes.push(result);
      records.push({ ...result, periodTo: attempt.plan?.toDate ?? null });
      // Model the partial unique index: only a successful log update that removes
      // cadenceBucket releases a claim, never a failed finish() write.
      if (!("cadenceBucket" in result.detail)) claims.delete(attempt.key);
    }),
    recordUnclaimed: vi.fn(async (_schedule, _plan, result) => { outcomes.push(result); }),
  };
  return { deps, claims, outcomes };
}

describe("email schedule cadence and delivery", () => {
  it("uses UTC calendar months, Monday weeks, and individual days", () => {
    expect(getScheduleCadenceBucket("monthly", new Date("2026-11-01T00:00:00Z"))).toBe("monthly:2026-11");
    expect(getScheduleCadenceBucket("weekly", new Date("2026-10-18T23:59:59Z"))).toBe("weekly:2026-10-12");
    expect(getScheduleCadenceBucket("weekly", new Date("2026-10-19T00:00:00Z"))).toBe("weekly:2026-10-19");
    expect(getScheduleCadenceBucket("daily", new Date("2026-10-19T00:30:00+01:00"))).toBe("daily:2026-10-18");
  });

  it("covers every UTC date across consecutive monthly windows, including 31-day months and leap years", () => {
    const plans = Array.from({ length: 49 }, (_, month) =>
      getSoldSchedulePlan(schedule, new Date(Date.UTC(2026, month, 1, 11))));
    const covered = new Set<string>();
    for (const plan of plans) {
      for (const day = new Date(`${plan.fromDate}T00:00:00Z`); day.toISOString().slice(0, 10) <= plan.toDate; day.setUTCDate(day.getUTCDate() + 1)) {
        covered.add(day.toISOString().slice(0, 10));
      }
    }
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].fromDate <= plans[i - 1].toDate).toBe(true);
    }
    for (const day = new Date("2026-01-01T00:00:00Z"); day <= new Date("2030-01-01T00:00:00Z"); day.setUTCDate(day.getUTCDate() + 1)) {
      expect(covered.has(day.toISOString().slice(0, 10))).toBe(true);
    }
    const january = getSoldSchedulePlan(schedule, new Date("2027-01-01T11:00:00Z"));
    expect(january).toMatchObject({ fromDate: "2026-12-01", toDate: "2027-01-01", lookbackDays: 32 });
    expect("2026-12-02" >= january.fromDate && "2026-12-02" <= january.toDate).toBe(true);
  });

  it("preserves longer monthly lookbacks and the configured nonmonthly windows", () => {
    const now = new Date("2026-11-01T11:00:00Z");
    expect(getSoldSchedulePlan({ ...schedule, config: { county: "St. Charles County", lookbackDays: 60 } }, now))
      .toMatchObject({ fromDate: "2026-09-03", toDate: "2026-11-01", lookbackDays: 60 });
    expect(getSoldSchedulePlan({ ...schedule, cadence: "daily" }, now))
      .toMatchObject({ fromDate: "2026-10-03", toDate: "2026-11-01", lookbackDays: 30 });
  });

  it("anchors delayed reports to successful coverage and describes the expanded window accurately", () => {
    const plan = getSoldSchedulePlan(schedule, new Date("2026-12-05T11:00:00Z"), "2026-10-01");
    expect(plan).toMatchObject({ fromDate: "2026-10-01", toDate: "2026-12-05", lookbackDays: 66 });
    expect(soldScheduleCoverNote(schedule, plan)).toContain("over the last 66 days");
    // A recent or future watermark must not shorten the configured report window.
    expect(getSoldSchedulePlan(schedule, new Date("2026-11-01T11:00:00Z"), "2026-10-20").fromDate).toBe("2026-10-01");
  });

  it("sends on the first wake and only one concurrent invocation can claim the period", async () => {
    const { deps, outcomes } = harness();
    const results = await Promise.all([processEmailSchedule(schedule, deps), processEmailSchedule(schedule, deps)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(deps.deliver).toHaveBeenCalledTimes(1);
    expect(deps.deliver).toHaveBeenCalledWith(schedule, expect.objectContaining({
      fromDate: "2026-09-18", toDate: "2026-10-19", format: "xlsx",
    }), expect.any(Object), "schedule-test-schedule-monthly:2026-10");
    expect(outcomes[0]).toMatchObject({ status: "sent", rowCount: 1, detail: { mlsNumbers: ["MLS-1"], providerId: "provider-1" } });
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
  });

  it("becomes due in the next cadence bucket and excludes listings already emailed", async () => {
    const { deps, outcomes } = harness();
    await processEmailSchedule(schedule, deps);
    deps.now = new Date("2026-11-01T12:00:00Z");
    await processEmailSchedule(schedule, deps);
    expect(deps.deliver).toHaveBeenCalledTimes(1);
    expect(outcomes[1]).toMatchObject({ status: "no_new_matches", rowCount: 0 });
  });

  it("builds a file without emailing when Resend is not configured", async () => {
    const { deps, claims } = harness();
    deps.emailConfigured = false;
    const result = await processEmailSchedule(schedule, deps);
    expect(deps.buildFile).toHaveBeenCalledTimes(1);
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "ready_email_not_configured", rowCount: 1 });
    expect(result?.detail).not.toHaveProperty("mlsNumbers");
    expect(result?.detail).not.toHaveProperty("cadenceBucket");
    expect(result?.detail.previewCadenceBucket).toBe("monthly:2026-10");
    expect(deps.recordUnclaimed).toHaveBeenCalledWith(schedule, expect.any(Object), result);
    expect(deps.finish).not.toHaveBeenCalled();
    expect(deps.claim).not.toHaveBeenCalled();
    expect(claims.size).toBe(0);
    // Repeated unconfigured wakes remain previews, never delivery claims.
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "ready_email_not_configured" });
    expect(claims.size).toBe(0);
  });

  it("can deliver in the same bucket after Resend is configured, even with concurrent wakes", async () => {
    const { deps } = harness();
    deps.emailConfigured = false;
    await processEmailSchedule(schedule, deps);
    deps.emailConfigured = true;
    const results = await Promise.all([processEmailSchedule(schedule, deps), processEmailSchedule(schedule, deps)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.find(Boolean)?.status).toBe("sent");
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it.each(["empty", "failure"])("leaves the delivery bucket eligible after an unconfigured %s preview", async (outcome) => {
    const { deps, claims } = harness();
    deps.emailConfigured = false;
    if (outcome === "empty") vi.mocked(deps.fetchRows).mockResolvedValueOnce([]);
    else vi.mocked(deps.fetchRows).mockRejectedValueOnce(new Error("Unable to fetch sold listings"));
    const preview = await processEmailSchedule(schedule, deps);
    expect(preview?.status).toBe(outcome === "empty" ? "no_new_matches" : "failed");
    expect(preview?.detail).not.toHaveProperty("cadenceBucket");
    expect(claims.size).toBe(0);
    expect(deps.claim).not.toHaveBeenCalled();
    deps.emailConfigured = true;
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "sent" });
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for an empty source result", async () => {
    const { deps } = harness();
    vi.mocked(deps.fetchRows).mockResolvedValue([]);
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "no_new_matches", rowCount: 0 });
    expect(deps.buildFile).not.toHaveBeenCalled();
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
  });

  it("checks pause state again after fetching and before delivery", async () => {
    const { deps } = harness();
    vi.mocked(deps.isStillActive).mockResolvedValue(false);
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "skipped_paused" });
    expect(deps.deliver).not.toHaveBeenCalled();
  });

  it("ignores inactive and manual schedules without claiming or fetching", async () => {
    const { deps } = harness();
    expect(await processEmailSchedule({ ...schedule, is_active: false }, deps)).toBeNull();
    expect(await processEmailSchedule({ ...schedule, send_mode: "manual" }, deps)).toBeNull();
    expect(deps.claim).not.toHaveBeenCalled();
    expect(deps.fetchRows).not.toHaveBeenCalled();
  });

  it.each(["coverage", "history", "fetch", "build", "state"])("releases a pre-delivery %s failure so a later wake can retry the same bucket", async (phase) => {
    const { deps, claims } = harness();
    const error = new Error("Temporary pre-delivery outage");
    if (phase === "coverage") vi.mocked(deps.latestSuccessfulPeriodTo).mockRejectedValueOnce(error);
    if (phase === "history") vi.mocked(deps.successfulSends).mockRejectedValueOnce(error);
    if (phase === "fetch") vi.mocked(deps.fetchRows).mockRejectedValueOnce(error);
    if (phase === "build") vi.mocked(deps.buildFile).mockImplementationOnce(() => { throw error; });
    if (phase === "state") vi.mocked(deps.isStillActive).mockRejectedValueOnce(error);
    const failed = await processEmailSchedule(schedule, deps);
    expect(failed).toMatchObject({ status: "failed", detail: { releasedCadenceBucket: "monthly:2026-10" } });
    expect(failed?.detail).not.toHaveProperty("cadenceBucket");
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(claims.size).toBe(0);
    deps.now = new Date("2026-10-20T12:00:00Z");
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "sent" });
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it("releases a mid-run pause and covers the paused period after resuming later in the same month", async () => {
    const { deps } = harness();
    const rows = [
      { ...row, mlsNumber: "already-sent", soldDate: "2026-09-01" },
      { ...row, mlsNumber: "paused-early", soldDate: "2026-09-02" },
      { ...row, mlsNumber: "paused-later", soldDate: "2026-10-02" },
    ];
    vi.mocked(deps.fetchRows).mockImplementation(async (plan) => rows.filter((item) => item.soldDate >= plan.fromDate && item.soldDate <= plan.toDate));
    deps.now = new Date("2026-09-01T11:00:00Z");
    await processEmailSchedule(schedule, deps);
    deps.now = new Date("2026-10-01T11:00:00Z");
    vi.mocked(deps.isStillActive).mockResolvedValueOnce(false);
    const paused = await processEmailSchedule(schedule, deps);
    expect(paused).toMatchObject({ status: "skipped_paused", detail: { releasedCadenceBucket: "monthly:2026-10" } });
    expect(paused?.detail).not.toHaveProperty("cadenceBucket");
    deps.now = new Date("2026-10-12T11:00:00Z");
    const resumed = await processEmailSchedule(schedule, deps);
    expect(resumed).toMatchObject({ status: "sent", rowCount: 2, detail: { mlsNumbers: ["paused-early", "paused-later"] } });
    expect(deps.successfulSends).toHaveBeenLastCalledWith(schedule.id, "2026-09-01");
    expect(deps.fetchRows).toHaveBeenLastCalledWith(expect.objectContaining({ fromDate: "2026-09-01", toDate: "2026-10-12" }));
    expect(deps.deliver).toHaveBeenCalledTimes(2);
  });

  it("recovers an entire failed month's unsent band exactly once using expanded history and fetch windows", async () => {
    const { deps } = harness();
    const rows = [
      { ...row, mlsNumber: "boundary-sent", soldDate: "2026-10-01" },
      { ...row, mlsNumber: "missed-oct-2", soldDate: "2026-10-02" },
      { ...row, mlsNumber: "missed-oct-30", soldDate: "2026-10-30" },
      { ...row, mlsNumber: "new-nov-15", soldDate: "2026-11-15" },
    ];
    vi.mocked(deps.fetchRows).mockImplementation(async (plan) => rows.filter((item) => item.soldDate >= plan.fromDate && item.soldDate <= plan.toDate));
    deps.now = new Date("2026-10-01T11:00:00Z");
    await processEmailSchedule(schedule, deps);
    deps.now = new Date("2026-11-01T11:00:00Z");
    vi.mocked(deps.fetchRows).mockRejectedValueOnce(new Error("Repliers temporarily unavailable"));
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "failed", detail: { releasedCadenceBucket: "monthly:2026-11" } });
    deps.now = new Date("2026-12-01T11:00:00Z");
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "sent", rowCount: 3, detail: { mlsNumbers: ["missed-oct-2", "missed-oct-30", "new-nov-15"] } });
    expect(deps.successfulSends).toHaveBeenLastCalledWith(schedule.id, "2026-10-01");
    expect(deps.fetchRows).toHaveBeenLastCalledWith(expect.objectContaining({ fromDate: "2026-10-01", toDate: "2026-12-01", lookbackDays: 62 }));
    expect(vi.mocked(deps.claim).mock.calls[2][2]).toMatchObject({ fromDate: "2026-10-01", toDate: "2026-12-01" });
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
    deps.now = new Date("2027-01-01T11:00:00Z");
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "no_new_matches" });
    expect(deps.fetchRows).toHaveBeenLastCalledWith(expect.objectContaining({ fromDate: "2026-12-01", toDate: "2027-01-01" }));
    expect(deps.deliver).toHaveBeenCalledTimes(2);
  });

  it.each(["async rejection", "synchronous throw"])("retains the claim after a delivery %s without retrying", async (failure) => {
    const { deps } = harness();
    const error = new Error("Email delivery could not be confirmed");
    if (failure === "async rejection") vi.mocked(deps.deliver).mockRejectedValue(error);
    else vi.mocked(deps.deliver).mockImplementation(() => { throw error; });
    const failed = await processEmailSchedule(schedule, deps);
    expect(failed).toMatchObject({ status: "failed", detail: { cadenceBucket: "monthly:2026-10", error: error.message } });
    expect(failed?.detail).not.toHaveProperty("releasedCadenceBucket");
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it("surfaces a log write failure after email acceptance and keeps the claim", async () => {
    const { deps } = harness();
    vi.mocked(deps.finish).mockRejectedValue(new Error("Unable to record schedule outcome"));
    await expect(processEmailSchedule(schedule, deps)).rejects.toThrow("Unable to record schedule outcome");
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it("keeps the processing claim when recording a pre-delivery failure itself fails", async () => {
    const { deps } = harness();
    vi.mocked(deps.fetchRows).mockRejectedValue(new Error("Source unavailable"));
    vi.mocked(deps.finish).mockRejectedValue(new Error("Database unavailable"));
    await expect(processEmailSchedule(schedule, deps)).rejects.toThrow("Database unavailable");
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
    expect(deps.deliver).not.toHaveBeenCalled();
  });

  it("logs invalid source configuration without fetching or delivering", async () => {
    const { deps } = harness();
    const result = await processEmailSchedule({ ...schedule, source_type: "future_report" }, deps);
    expect(result).toMatchObject({ status: "failed", detail: { error: "Unsupported schedule source type" } });
    expect(deps.fetchRows).not.toHaveBeenCalled();
    expect(deps.deliver).not.toHaveBeenCalled();
  });

  it("includes the required cover note and signature", () => {
    const note = soldScheduleCoverNote(schedule, getSoldSchedulePlan(schedule, new Date("2026-10-19T12:00:00Z")));
    expect(note).toContain("Hi Mark Parkinson,");
    expect(note).toContain("homes sold in St. Charles County over the last 32 days, with address and date sold");
    expect(note).toContain("adjust the list");
    expect(note).toContain("Jen Bahr\nIntegrity Realty STL\n636-789-1430");
  });
});
