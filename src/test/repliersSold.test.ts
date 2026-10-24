import { describe, expect, it, vi } from "vitest";
import { fetchSoldListings } from "../../supabase/functions/_shared/repliers-sold";
import { createFetchSoldListingsHandler } from "../../supabase/functions/_shared/fetch-sold-listings-handler";
import { getSoldReportCounty, getSoldReportWindow, validateSoldReportRange } from "../../supabase/functions/_shared/sold-report";

const request = { county: "St. Charles County", fromDate: "2026-09-19", toDate: "2026-10-18" };
const listing = (mlsNumber: string, overrides: Record<string, unknown> = {}) => ({
  mlsNumber, status: "U", lastStatus: "Sld", class: "Residential", type: "Sale", soldDate: "2026-10-10T00:00:00.000Z",
  address: { streetNumber: "123", streetName: "Main", streetSuffix: "St", city: "St. Charles", state: "MO", zip: "63301" },
  ...overrides,
});
const response = (listings: unknown[], page = 1, numPages = 1, count = listings.length) =>
  new Response(JSON.stringify({ listings, page, numPages, count }), { status: 200 });
const emptyResponse = () => response([], 1, 0, 0);
const zipAndPage = (url: string | URL | Request) => {
  const parsed = new URL(String(url));
  return { zip: parsed.searchParams.get("zip"), page: Number(parsed.searchParams.get("pageNum")), parsed };
};

describe("sold-report window and county configuration", () => {
  it("uses exactly N UTC calendar dates including today across a year boundary", () => {
    expect(getSoldReportWindow(7, new Date("2026-01-03T23:59:59Z"))).toEqual({ fromDate: "2025-12-28", toDate: "2026-01-03" });
    expect(() => getSoldReportWindow(0)).toThrow();
    expect(() => getSoldReportWindow(1.5)).toThrow();
    expect(() => validateSoldReportRange("2026-02-30", "2026-03-05")).toThrow();
    expect(() => validateSoldReportRange("2026-10-18", "2026-09-19")).toThrow();
    expect(() => getSoldReportCounty("unknown")).toThrow();
  });
});

describe("Repliers sold reports", () => {
  it("the request asks for the sold-date sort", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const parsed = new URL(String(url));
      expect(parsed.searchParams.get("sortBy")).toBe("soldDateDesc");
      for (const key of ["type", "minSoldDate", "maxSoldDate", "minClosedDate", "maxClosedDate"]) {
        expect(parsed.searchParams.has(key)).toBe(false);
      }
      return emptyResponse();
    });
    await fetchSoldListings(request, "test-key", fetcher);
    expect(fetcher).toHaveBeenCalled();
  });

  it("fetches all ZIPs and every page with sold residential filters, retaining one row per MLS number", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const { zip, page, parsed } = zipAndPage(url);
      expect(parsed.searchParams.get("status")).toBe("U");
      expect(parsed.searchParams.get("lastStatus")).toBe("Sld");
      expect(parsed.searchParams.get("class")).toBe("residential");
      expect(parsed.searchParams.get("zip")).toBe(zip);
      expect(parsed.searchParams.get("resultsPerPage")).toBe("100");
      expect(parsed.searchParams.get("pageNum")).toBe(String(page));
      for (const key of ["type", "minSoldDate", "maxSoldDate", "minClosedDate", "maxClosedDate"]) {
        expect(parsed.searchParams.has(key)).toBe(false);
      }
      expect(init?.headers).toHaveProperty("REPLIERS-API-KEY", "test-key");
      expect(parsed.searchParams.has("repliers_api_key")).toBe(false);
      if (zip === "63301") return page === 1
        ? response([listing("A"), listing("B")], 1, 2, 3)
        : response([listing("C")], 2, 2, 3);
      if (zip === "63303") return response([listing("A")]);
      return emptyResponse();
    });
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows.map((row) => row.mlsNumber)).toEqual(["A", "B", "C"]);
    expect(new Set(fetcher.mock.calls.map(([url]) => zipAndPage(url).zip)).size).toBe(getSoldReportCounty(request.county).zips.length);
    expect(fetcher.mock.calls.some(([url]) => zipAndPage(url).page === 2)).toBe(true);
  });

  it("normalizes soldDate with raw.CloseDate fallback and excludes dates, ZIPs, states and statuses outside the report", async () => {
    const records = [
      listing("sold", { raw: { CloseDate: "2026-10-18" }, address: { streetNumber: 12, streetDirection: "N", streetName: "Main", streetSuffix: "Ave", unitNumber: "2B", city: "St Charles", state: "mo", zip: "63301-1234" } }),
      listing("raw-only", { soldDate: undefined, raw: { CloseDate: "2026-10-11T00:00:00Z" } }),
      listing("fallback", { soldDate: "invalid", raw: { CloseDate: "2026-10-12" } }),
      listing("closed-only", { soldDate: undefined, closedDate: "2026-10-13" }),
      listing("null-raw", { soldDate: undefined, raw: null }),
      listing("array-raw", { soldDate: undefined, raw: [{ CloseDate: "2026-10-14" }] }),
      listing("string-raw", { soldDate: undefined, raw: "2026-10-15" }),
      listing("old", { soldDate: "2026-09-18" }),
      listing("future", { soldDate: "2026-10-19" }),
      listing("no-date", { soldDate: undefined }),
      listing("bad-date", { soldDate: "2026-02-30" }),
      listing("other-zip", { address: { streetNumber: "1", streetName: "X", city: "St Louis", state: "MO", zip: "63101" } }),
      listing("other-state", { address: { streetNumber: "1", streetName: "X", city: "X", state: "IL", zip: "63301" } }),
      listing("active", { status: "A" }),
      listing("leased", { lastStatus: "Lsd" }),
      listing("commercial", { class: "commercial" }),
      listing("no-mls", { mlsNumber: undefined }),
    ];
    const fetcher = vi.fn(async (url: string | URL | Request) => zipAndPage(url).zip === "63301" ? response(records) : emptyResponse());
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows.map((row) => row.mlsNumber)).toEqual(["fallback", "raw-only", "sold"]);
    expect(rows.find((row) => row.mlsNumber === "raw-only")?.soldDate).toBe("2026-10-11");
    expect(rows.find((row) => row.mlsNumber === "sold")).toEqual({
      address: "12 N Main Ave #2B", city: "St Charles", state: "MO", zip: "63301", soldDate: "2026-10-10", mlsNumber: "sold",
    });
  });

  it("accepts a payload shaped like the live Repliers response", async () => {
    const live = listing("LIVE1", { class: "ResidentialProperty", address: { streetNumber: "5", streetName: "Oak", streetSuffix: "Dr", city: "St. Charles", state: "Missouri", zip: "63301" } });
    const fetcher = vi.fn(async (url: string | URL | Request) => zipAndPage(url).zip === "63301" ? response([live]) : emptyResponse());
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows).toEqual([{ address: "5 Oak Dr", city: "St. Charles", state: "MO", zip: "63301", soldDate: "2026-10-10", mlsNumber: "LIVE1" }]);
  });

  it("stops paging a ZIP after a page entirely older than the window", async () => {
    const old = (id: string) => listing(id, { soldDate: "2026-01-01T00:00:00.000Z" });
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      return page === 1 ? response([listing("N1"), old("O1")], 1, 50, 5000)
        : page === 2 ? response([old("O2"), old("O3")], 2, 50, 5000)
        : response([listing("NEVER")], page, 50, 5000);
    });
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows.map((row) => row.mlsNumber)).toEqual(["N1"]);
    expect(fetcher.mock.calls.map(([url]) => zipAndPage(url)).filter((c) => c.zip === "63301").map((c) => c.page)).toEqual([1, 2]);
  });

  it("an out-of-order page disables early stop for that ZIP", async () => {
    const old = (id: string, soldDate: string) => listing(id, { soldDate });
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      if (page === 1) return response([old("O1", "2026-09-18")], 1, 3, 3);
      if (page === 2) return response([listing("N1")], 2, 3, 3);
      return response([old("O2", "2026-09-17")], 3, 3, 3);
    });
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows.map((row) => row.mlsNumber)).toEqual(["N1"]);
    expect(fetcher.mock.calls.map(([url]) => zipAndPage(url)).filter((c) => c.zip === "63301").map((c) => c.page)).toEqual([1, 2, 3]);
  });

  it("collects in-window rows across multiple pages", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      return response([listing(`P${page}A`), listing(`P${page}B`)], page, 3, 6);
    });
    const rows = await fetchSoldListings(request, "test-key", fetcher);
    expect(rows.map((row) => row.mlsNumber).sort()).toEqual(["P1A", "P1B", "P2A", "P2B", "P3A", "P3B"]);
  });

  it("still throws on an inconsistent page mid-walk", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      return page === 1 ? response([listing("A")], 1, 3, 3) : response([listing("B")], 2, 4, 3);
    });
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow();
  });

  it("rejects upstream failures rather than returning a partial report", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      return page === 1 ? response([listing("A")], 1, 2, 2) : new Response("upstream", { status: 503 });
    });
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow("HTTP 503");
  });

  it.each([
    { name: "missing pagination metadata", makeResponse: () => new Response(JSON.stringify({ listings: [listing("A")] })) },
    { name: "an incomplete count", makeResponse: () => response([listing("A")], 1, 1, 2) },
    { name: "a repeated page number", makeResponse: () => response([listing("A")], 2, 2, 2) },
  ])("rejects $name", async ({ makeResponse }) => {
    const fetcher = vi.fn(async (url: string | URL | Request) => zipAndPage(url).zip === "63301" ? makeResponse() : emptyResponse());
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow();
  });

  it("rejects repeated page contents even if the provider increments the page number", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      return zip === "63301" ? response([listing("A")], page, 2, 2) : emptyResponse();
    });
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow("repeated a page");
  });

  it("rejects overlapping pages even when the raw result count matches", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      const { zip, page } = zipAndPage(url);
      if (zip !== "63301") return emptyResponse();
      return response(page === 1 ? [listing("A"), listing("B")] : [listing("B"), listing("C")], page, 2, 4);
    });
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow("repeated a listing within a ZIP");
  });

  it("rejects duplicate MLS numbers within one page instead of concealing an incomplete result", async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => zipAndPage(url).zip === "63301"
      ? response([listing("A"), listing("A")], 1, 1, 2)
      : emptyResponse());
    await expect(fetchSoldListings(request, "test-key", fetcher)).rejects.toThrow("repeated a listing within a ZIP");
  });
});

describe("fetch-sold-listings authorization", () => {
  const post = (body: unknown = request, authorization?: string) => new Request("https://example.test/fetch-sold-listings", {
    method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body),
  });
  const setup = (authenticated = true, isAdmin = true) => {
    const fetchListings = vi.fn(async () => []);
    const rpc = vi.fn(async () => ({ data: isAdmin, error: null }));
    const createCallerClient = vi.fn(() => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: authenticated ? { id: "admin-id" } : null }, error: null })) }, rpc,
    }));
    const handler = createFetchSoldListingsHandler({ createCallerClient, getApiKey: () => "server-only", fetchListings });
    return { handler, fetchListings, createCallerClient, rpc };
  };

  it("denies missing/invalid sessions and non-admin users before any Repliers call", async () => {
    const missing = setup();
    expect((await missing.handler(post())).status).toBe(401);
    expect(missing.createCallerClient).not.toHaveBeenCalled();
    const invalid = setup(false);
    expect((await invalid.handler(post(request, "Bearer invalid"))).status).toBe(401);
    expect(invalid.rpc).not.toHaveBeenCalled();
    const member = setup(true, false);
    expect((await member.handler(post(request, "Bearer member"))).status).toBe(403);
    expect(member.fetchListings).not.toHaveBeenCalled();
  });

  it("answers CORS preflight without authentication or an upstream call", async () => {
    const { handler, createCallerClient, fetchListings } = setup();
    const result = await handler(new Request("https://example.test/fetch-sold-listings", { method: "OPTIONS" }));
    expect(result.status).toBe(200);
    expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(result.headers.get("Access-Control-Allow-Headers")).toContain("authorization");
    expect(createCallerClient).not.toHaveBeenCalled();
    expect(fetchListings).not.toHaveBeenCalled();
  });

  it("uses the authenticated caller's admin role and validates inputs before fetching", async () => {
    const { handler, rpc, fetchListings } = setup();
    expect((await handler(post({ ...request, county: "Unknown" }, "Bearer admin"))).status).toBe(400);
    expect(fetchListings).not.toHaveBeenCalled();
    const result = await handler(post(request, "Bearer admin"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ rows: [], count: 0 });
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "admin-id", _role: "admin" });
    expect(fetchListings).toHaveBeenCalledWith(request, "server-only");
  });
});
