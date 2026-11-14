/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
import { describe, expect, it } from "vitest";
import {
  assessCondition, detectFlips, haversineKm, normalizeSold, valueFromPool, weightedQuantile,
} from "../../supabase/functions/_shared/arv-clean-room/engine.ts";
import { estimateArv, RepliersClient } from "../../supabase/functions/_shared/arv-clean-room/index.ts";

const SUBJECT = { lat: 38.58, lng: -90.26 };

function listing(over: Record<string, any> = {}) {
  const { raw, details, ...rest } = over;
  return {
    mlsNumber: over.mlsNumber ?? String(Math.random()).slice(2, 10),
    type: "Sale", lastStatus: "Sld", soldPrice: 200000, soldDate: "2026-08-01T00:00:00.000-00:00",
    address: { streetNumber: "1", streetName: "Main", streetSuffix: "St", city: "St Louis", zip: "63116", addressKey: `k${Math.random()}` },
    map: { latitude: SUBJECT.lat + 0.001, longitude: SUBJECT.lng },
    details: { sqft: "1000", numBedrooms: 3, numBathrooms: 1, yearBuilt: "1925", style: "Single Family Residence", propertyType: "Residential", description: "", ...details },
    raw: { CloseDate: "2026-08-30", ...raw },
    ...rest,
  };
}
const subject = () => ({
  mlsNumber: "SUBJ", address: "subject", addressKey: "subj", zip: "63116", subdivision: null,
  ...SUBJECT, sqft: 1000, beds: 3, baths: 1, yearBuilt: 1925, levels: null, garageSpaces: null,
  hasBasement: null, style: "Single Family Residence", propertyType: "Residential", listPrice: 90000, remarks: "",
});
const RENO = { raw: { PropertyCondition: "Updated/Remodeled" } };
const opts = { asOf: "2026-11-01T00:00:00Z" };

describe("arv-clean-room engine", () => {
  it("computes distance and weighted quantiles", () => {
    expect(haversineKm(38.58, -90.26, 38.589, -90.26)).toBeCloseTo(1.0, 1);
    expect(weightedQuantile([1, 2, 3], [1, 1, 1], 0.5)).toBe(2);
    expect(weightedQuantile([100, 200], [3, 1], 0.5)).toBeLessThan(150);
  });

  it("tiers condition from MLS fields and remarks, blind to price", () => {
    const tier = (o: any) => assessCondition(normalizeSold(listing(o))!).tier;
    expect(tier(RENO)).toBe("renovated");
    expect(tier({ details: { description: "Completely renovated with new kitchen, quartz counters." } })).toBe("renovated");
    expect(tier({ details: { description: "Investor special, needs work. Sold as-is, cash only." } })).toBe("distressed");
    expect(tier({ raw: { PropertyCondition: "Fixer" } })).toBe("distressed");
    expect(tier({ details: { description: "Charming bungalow close to parks." } })).toBe("average");
    expect(tier({ soldPrice: 900000 })).toBe("average");
  });

  it("detects a flip inside the pool and demotes the purchase leg", () => {
    const key = { streetNumber: "9", streetName: "Flip", city: "St Louis", zip: "63116", addressKey: "9flip" };
    const buy = normalizeSold(listing({ mlsNumber: "BUY", soldPrice: 80000, soldDate: "2026-02-01", address: key }))!;
    const sell = normalizeSold(listing({ mlsNumber: "SELL", soldPrice: 210000, soldDate: "2026-09-01", address: key }))!;
    const { uplift, buyLegs } = detectFlips([buy, sell]);
    expect(uplift.get("SELL")).toBeCloseTo(2.625);
    expect(buyLegs.has("BUY")).toBe(true);
    expect(assessCondition(sell, uplift.get("SELL")).tier).toBe("renovated");
  });

  it("values from renovated comps only and ignores distressed sales", () => {
    const pool = [
      listing({ ...RENO, soldPrice: 200000 }), listing({ ...RENO, soldPrice: 210000 }),
      listing({ ...RENO, soldPrice: 190000 }), listing({ ...RENO, soldPrice: 205000 }),
      listing({ soldPrice: 60000, raw: { PropertyCondition: "Fixer" } }),
      listing({ soldPrice: 70000, details: { description: "Investor special needs work" } }),
      listing({ soldPrice: 140000 }),
    ].map((l) => normalizeSold(l)!);
    const r = valueFromPool({ subject: subject(), pool, options: opts });
    expect(r.method).toBe("renovated-comps");
    expect(r.selectedComps).toHaveLength(4);
    expect(r.selectedComps.every((c) => c.condition.tier === "renovated")).toBe(true);
    expect(r.arv).toBeGreaterThanOrEqual(195000);
    expect(r.arv).toBeLessThanOrEqual(207000);
    expect(r.market.tierCounts).toEqual({ renovated: 4, average: 1, distressed: 2 });
  });

  it("excludes the subject's own sale, future sales, wrong size and wrong style", () => {
    const pool = [
      listing({ ...RENO, mlsNumber: "SUBJ" }),
      listing({ ...RENO, soldDate: "2026-12-01" }),
      listing({ ...RENO, details: { sqft: "2500" } }),
      listing({ ...RENO, details: { style: "2-4 Units" } }),
      listing({ ...RENO, address: { addressKey: "subj", zip: "63116" } }),
    ].map((l) => normalizeSold(l)!);
    const r = valueFromPool({ subject: subject(), pool, options: opts });
    expect(r.market.eligible).toBe(0);
    expect(r.method).toBe("insufficient-data");
    expect(r.arv).toBeNull();
  });

  it("adjusts for size and concessions, and prefers closer comps", () => {
    const big = normalizeSold(listing({ ...RENO, mlsNumber: "BIG", details: { sqft: "1250" }, raw: { ...RENO.raw, ConcessionsAmount: "5000.00" } }))!;
    const near = normalizeSold(listing({ ...RENO, mlsNumber: "NEAR" }))!;
    const far = normalizeSold(listing({ ...RENO, mlsNumber: "FAR", map: { latitude: SUBJECT.lat + 0.02, longitude: SUBJECT.lng } }))!;
    const r = valueFromPool({ subject: subject(), pool: [big, near, far], options: opts });
    const by = Object.fromEntries(r.selectedComps.map((c) => [c.comp.mlsNumber, c]));
    expect(by.BIG.netPrice).toBe(195000);
    expect(by.BIG.adjustedPrice).toBeLessThan(195000);
    expect(by.NEAR.similarity).toBeGreaterThan(by.FAR.similarity);
    expect(r.selectedComps[0].comp.mlsNumber).toBe("NEAR");
  });

  it("falls back to the upper quantile when renovated evidence is thin", () => {
    const pool = [100, 120, 140, 160, 180].map((k) => normalizeSold(listing({ soldPrice: k * 1000 }))!);
    const r = valueFromPool({ subject: subject(), pool, options: opts });
    expect(r.method).toBe("upper-quantile-fallback");
    expect(r.arv).toBeGreaterThan(140000);
    expect(r.confidence).toBeLessThan(70);
  });
});

describe("arv-clean-room orchestration", () => {
  it("pages nearest-first and stops once enough renovated comps are found", async () => {
    const urls: string[] = [];
    const fetchImpl = (async (url: string, init: any) => {
      urls.push(url);
      expect(init.headers["REPLIERS-API-KEY"]).toBe("test-key");
      const page = Number(new URL(url).searchParams.get("pageNum"));
      const listings = Array.from({ length: 100 }, () => listing(page === 1 ? RENO : {}));
      return new Response(JSON.stringify({ listings, page, numPages: 5, count: 500, unrecognizedParams: [] }));
    }) as unknown as typeof fetch;
    const client = new RepliersClient({ apiKey: "test-key", fetchImpl, maxRetries: 0 });
    const r = await estimateArv(client, { overrides: subject() }, opts);
    expect(urls).toHaveLength(1);
    const q = new URL(urls[0]).searchParams;
    expect(q.get("status")).toBe("U");
    expect(q.get("lastStatus")).toBe("Sld");
    expect(q.get("sortBy")).toBe("distanceAsc");
    expect(q.get("maxSoldDate")).toBe("2026-10-31");
    expect(q.get("minSoldDate")).toBe("2025-11-01");
    expect(r.method).toBe("renovated-comps");
    expect(r.diagnostics.pagesFetched).toBe(1);
  });
});
