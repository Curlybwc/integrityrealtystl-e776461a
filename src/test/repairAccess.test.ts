import { describe, expect, it, vi } from "vitest";
import {
  enqueueWithQuota,
  getQuotaBlockedAnalysis,
  resolveRepairSource,
} from "../../supabase/functions/_shared/repair-access";

describe("repair request access and quota", () => {
  it("downgrades a non-admin admin claim and applies quota with user priority", async () => {
    const source = await resolveRepairSource("admin", "user-a", "listing-a", async () => false, vi.fn());
    let quotaCount = 0;
    let insertedPriority = 0;
    const result = await enqueueWithQuota({
      claim: async () => ++quotaCount,
      insert: async () => {
        insertedPriority = source === "user" ? 2 : 1;
        return { data: { id: "pending" }, error: null };
      },
      refund: async () => {},
      onExhausted: async () => ({ id: "blocked" }),
      logRefundFailure: vi.fn(),
    });

    expect(source).toBe("user");
    expect(quotaCount).toBe(1);
    expect(insertedPriority).toBe(2);
    expect(result).toMatchObject({ kind: "insert", data: { id: "pending" } });
  });

  it("honors a verified admin without requiring a quota claim", async () => {
    const source = await resolveRepairSource("admin", "admin-a", "listing-a", async () => true);
    const claim = vi.fn(async () => 1);
    let insertedPriority = 0;

    if (source === "user") await claim();
    else insertedPriority = source === "admin" ? 1 : 2;

    expect(source).toBe("admin");
    expect(claim).not.toHaveBeenCalled();
    expect(insertedPriority).toBe(1);
  });

  it.each([
    "ADMIN",
    "Admin",
    "admin ",
    { source: "admin" },
    ["admin"],
    undefined,
  ])("does not let a non-exact source claim skip user access rules (%j)", async (claim) => {
    const source = await resolveRepairSource(claim, "user-a", "listing-a", vi.fn(async () => true));
    expect(source).toBe("user");
  });

  it("downgrades an admin claim when the role lookup fails and logs only caller and listing IDs", async () => {
    const warn = vi.fn();
    const source = await resolveRepairSource(
      "admin",
      "user-a",
      "listing-a",
      async () => { throw new Error("role lookup failed"); },
      warn,
    );
    expect(source).toBe("user");
    expect(warn).toHaveBeenCalledWith("Unverified admin source downgraded", {
      userId: "user-a",
      mlsListingId: "listing-a",
    });
  });

  it("serializes concurrent claims at the monthly limit", async () => {
    let count = 199;
    let lock = Promise.resolve();
    const claim = async () => {
      let release!: () => void;
      const previous = lock;
      lock = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try {
        if (count >= 200) return null;
        count += 1;
        return count;
      } finally {
        release();
      }
    };
    const inserted: string[] = [];
    const makeEnqueue = (listingId: string) => enqueueWithQuota({
      claim,
      insert: async () => {
        inserted.push(listingId);
        return { data: { id: listingId }, error: null };
      },
      refund: async () => {},
      onExhausted: async () => ({ id: `${listingId}-blocked` }),
      logRefundFailure: vi.fn(),
    });

    const results = await Promise.all([makeEnqueue("listing-a"), makeEnqueue("listing-b")]);

    expect(count).toBe(200);
    expect(inserted).toHaveLength(1);
    expect(results.filter((result) => result.kind === "exhausted")).toHaveLength(1);
    expect(results.filter((result) => result.kind === "insert")).toHaveLength(1);
  });

  it("returns exhausted without changing the count or inserting at the limit", async () => {
    const quotaRows = new Map([["user-a:2026-10", { count: 200, monthly_limit: 200 }]]);
    const claim = async () => {
      const key = "user-a:2026-10";
      const row = quotaRows.get(key);
      if (!row) {
        quotaRows.set(key, { count: 1, monthly_limit: 200 });
        return 1;
      }
      if (row.count >= row.monthly_limit) return null;
      row.count += 1;
      return row.count;
    };

    expect(await claim()).toBeNull();
    expect(quotaRows.get("user-a:2026-10")).toEqual({ count: 200, monthly_limit: 200 });
  });

  it("refunds a successful claim when the pending insert fails", async () => {
    let count = 9;
    const result = await enqueueWithQuota({
      claim: async () => ++count,
      insert: async () => ({ data: null, error: new Error("insert failed") }),
      refund: async (claimedCount) => { count = Math.max(0, claimedCount - 1); },
      onExhausted: async () => ({ id: "blocked" }),
      logRefundFailure: vi.fn(),
    });

    expect(count).toBe(9);
    expect(result.kind).toBe("insert");
    if (result.kind === "insert") expect(result.error).toEqual(new Error("insert failed"));
  });

  it("refunds the claim when the pending insert throws", async () => {
    let count = 3;
    const logRefundFailure = vi.fn();
    const result = await enqueueWithQuota({
      claim: async () => ++count,
      insert: async () => { throw new Error("connection lost"); },
      refund: async (claimedCount) => { count = Math.max(0, claimedCount - 1); },
      onExhausted: async () => ({ id: "blocked" }),
      logRefundFailure,
    });

    expect(count).toBe(3);
    expect(result.kind).toBe("insert");
    if (result.kind === "insert") expect(result.error).toEqual(new Error("connection lost"));
    expect(logRefundFailure).not.toHaveBeenCalled();
  });

  it("does not displace another user's active live analysis for an exhausted caller", async () => {
    const otherRow = {
      id: "other-pending",
      requested_by: "user-b",
      analysis_status: "pending",
      is_active: true,
    };
    const archiveDisplaceable = vi.fn(async () => {});
    const insertSentinel = vi.fn(async () => ({ data: null, error: null }));
    const result = await getQuotaBlockedAnalysis({
      findOwnSentinel: async () => null,
      archiveDisplaceable,
      findOtherLiveAnalysis: async () => otherRow,
      insertSentinel,
      findActiveAnalysis: async () => otherRow,
    });

    expect(result).toBe(otherRow);
    expect(otherRow.is_active).toBe(true);
    expect(archiveDisplaceable).toHaveBeenCalledOnce();
    expect(insertSentinel).not.toHaveBeenCalled();
  });

  it("archives the caller's stale row and inserts a quota sentinel", async () => {
    const rows = [{
      id: "own-failed",
      requested_by: "user-a",
      analysis_status: "failed",
      is_active: true,
    }];
    const sentinel = { id: "own-sentinel", requested_by: "user-a", analysis_status: "quota_blocked", is_active: true };
    const result = await getQuotaBlockedAnalysis({
      findOwnSentinel: async () => null,
      archiveDisplaceable: async () => {
        for (const row of rows) {
          if (row.requested_by === "user-a" || ["failed", "quota_blocked"].includes(row.analysis_status)) {
            row.is_active = false;
          }
        }
      },
      findOtherLiveAnalysis: async () => null,
      insertSentinel: async () => ({ data: sentinel, error: null }),
      findActiveAnalysis: async () => null,
    });

    expect(rows[0].is_active).toBe(false);
    expect(result).toBe(sentinel);
  });

  it("rereads and returns the active row when sentinel insertion loses a unique-index race", async () => {
    const racedRow = { id: "raced-sentinel", is_active: true };
    const result = await getQuotaBlockedAnalysis({
      findOwnSentinel: async () => null,
      archiveDisplaceable: async () => {},
      findOtherLiveAnalysis: async () => null,
      insertSentinel: async () => ({ data: null, error: new Error("unique violation") }),
      findActiveAnalysis: async () => racedRow,
    });
    expect(result).toBe(racedRow);
  });

  it("rereads after a thrown sentinel insert failure", async () => {
    const racedRow = { id: "raced-sentinel", is_active: true };
    const result = await getQuotaBlockedAnalysis({
      findOwnSentinel: async () => null,
      archiveDisplaceable: async () => {},
      findOtherLiveAnalysis: async () => null,
      insertSentinel: async () => { throw new Error("unique violation"); },
      findActiveAnalysis: async () => racedRow,
    });
    expect(result).toBe(racedRow);
  });
});
