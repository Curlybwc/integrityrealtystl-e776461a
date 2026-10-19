import { describe, expect, it, vi } from "vitest";
import {
  getScheduleCadenceBucket,
  processEmailSchedule,
  soldScheduleCoverNote,
  type EmailSchedule,
  type ScheduleDependencies,
  type ScheduleRunResult,
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
  const deps: ScheduleDependencies = {
    now: new Date("2026-10-19T12:00:00Z"),
    emailConfigured: true,
    claim: vi.fn(async (current, bucket) => {
      const key = `${current.id}/${bucket}`;
      if (claims.has(key)) return null;
      claims.add(key);
      return key;
    }),
    successfulSends: vi.fn(async () => outcomes),
    fetchRows: vi.fn(async () => [row]),
    buildFile: vi.fn(() => ({ filename: "sold-report.xlsx", contentType: "application/xlsx", bytes: new Uint8Array([1, 2, 3]) })),
    isStillActive: vi.fn(async () => true),
    deliver: vi.fn(async () => "provider-1"),
    finish: vi.fn(async (_id, result) => { outcomes.push(result); }),
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

  it("sends on the first wake and only one concurrent invocation can claim the period", async () => {
    const { deps, outcomes } = harness();
    const results = await Promise.all([processEmailSchedule(schedule, deps), processEmailSchedule(schedule, deps)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(deps.deliver).toHaveBeenCalledTimes(1);
    expect(deps.deliver).toHaveBeenCalledWith(schedule, expect.objectContaining({
      fromDate: "2026-09-20", toDate: "2026-10-19", format: "xlsx",
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
    const { deps } = harness();
    deps.emailConfigured = false;
    const result = await processEmailSchedule(schedule, deps);
    expect(deps.buildFile).toHaveBeenCalledTimes(1);
    expect(deps.deliver).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "ready_email_not_configured", rowCount: 1 });
    expect(result?.detail).not.toHaveProperty("mlsNumbers");
    // A missing key is a logged execution of this bucket, not an email retry every day.
    expect(await processEmailSchedule(schedule, deps)).toBeNull();
  });

  it("does not count dry-run rows as previously sent in a later bucket", async () => {
    const { deps } = harness();
    deps.emailConfigured = false;
    await processEmailSchedule(schedule, deps);
    deps.emailConfigured = true;
    deps.now = new Date("2026-11-01T12:00:00Z");
    const result = await processEmailSchedule(schedule, deps);
    expect(result?.status).toBe("sent");
    expect(deps.deliver).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for an empty source result", async () => {
    const { deps } = harness();
    vi.mocked(deps.fetchRows).mockResolvedValue([]);
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "no_new_matches", rowCount: 0 });
    expect(deps.buildFile).not.toHaveBeenCalled();
    expect(deps.deliver).not.toHaveBeenCalled();
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

  it("records delivery failure without an automatic retry in that bucket", async () => {
    const { deps } = harness();
    vi.mocked(deps.deliver).mockRejectedValue(new Error("Email delivery could not be confirmed"));
    expect(await processEmailSchedule(schedule, deps)).toMatchObject({ status: "failed", detail: { error: "Email delivery could not be confirmed" } });
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

  it("logs invalid source configuration without fetching or delivering", async () => {
    const { deps } = harness();
    const result = await processEmailSchedule({ ...schedule, source_type: "future_report" }, deps);
    expect(result).toMatchObject({ status: "failed", detail: { error: "Unsupported schedule source type" } });
    expect(deps.fetchRows).not.toHaveBeenCalled();
    expect(deps.deliver).not.toHaveBeenCalled();
  });

  it("includes the required cover note and signature", () => {
    const note = soldScheduleCoverNote(schedule, {
      county: "St. Charles County", lookbackDays: 30,
      fromDate: "2026-09-20", toDate: "2026-10-19", format: "xlsx",
    });
    expect(note).toContain("Hi Mark Parkinson,");
    expect(note).toContain("homes sold in St. Charles County over the last 30 days, with address and date sold");
    expect(note).toContain("adjust the list");
    expect(note).toContain("Jen Bahr\nIntegrity Realty STL\n636-789-1430");
  });
});
