/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
import { describe, expect, it } from "vitest";
import { valueByDoctrine } from "../../supabase/functions/_shared/arv-clean-room/doctrine.ts";
import { normalizeSold } from "../../supabase/functions/_shared/arv-clean-room/engine.ts";

const LAT = 38.58, LNG = -90.26;
const MILE_LAT = 1 / 69.05; // degrees of latitude per mile

let seq = 0;
function sold(price: number, over: { miles?: number; beds?: number; baths?: number; sqft?: number; basement?: "1" | "0"; levels?: string; remarks?: string; raw?: any; garage?: string } = {}) {
  seq++;
  return normalizeSold({
    mlsNumber: `M${seq}`, type: "Sale", lastStatus: "Sld", soldPrice: price, soldDate: "2026-08-01T00:00:00.000-00:00",
    address: { streetNumber: String(seq), streetName: "Main", city: "St Louis", zip: "63116", addressKey: `k${seq}` },
    map: { latitude: LAT + (over.miles ?? 0.1) * MILE_LAT, longitude: LNG },
    details: { sqft: String(over.sqft ?? 1000), numBedrooms: over.beds ?? 3, yearBuilt: "1955", style: "Single Family Residence", propertyType: "Residential", description: over.remarks ?? "" },
    raw: { BathroomsFull: String(over.baths ?? 1), BathroomsHalf: "0", BasementYN: over.basement ?? "1", Levels: over.levels ?? "One", GarageSpaces: over.garage, ...over.raw },
  })!;
}
const subject = (over: any = {}) => ({
  mlsNumber: "SUBJ", address: "subject", addressKey: "subj", zip: "63116", subdivision: null, lat: LAT, lng: LNG,
  sqft: 1000, beds: 3, baths: 1, yearBuilt: 1955, levels: "One", garageSpaces: null, hasBasement: true,
  style: "Single Family Residence", propertyType: "Residential", listPrice: null, remarks: "", ...over,
});
const run = (prices: any[], subj: any = {}, options: any = {}) =>
  valueByDoctrine({ subject: subject(subj), pool: prices, options: { asOf: "2026-11-01T00:00:00Z", applyDeficits: false, ...options } });

describe("ARV v2 market model — reading the top", () => {
  it("3+ comps clustered within $5K at the top: low end of the cluster", () => {
    const r = run([sold(250000), sold(248000), sold(246000), sold(220000), sold(180000)]);
    expect(r.value).toBe(246000);
    expect(r.top?.shape).toBe("tight-cluster");
    expect(r.supportCount).toBe(3);
    expect(r.loanBasis.basis).toBe("value");
  });

  it("two comps above the third: between the top two, and loan math steps down", () => {
    const r = run([sold(250000), sold(244000), sold(220000), sold(218000)]);
    expect(r.value).toBe(247000);
    expect(r.supportCount).toBe(2);
    expect(r.stepDown?.value).toBe(219000);
    expect(r.loanBasis).toMatchObject({ basis: "step-down", value: 219000 });
  });

  it("a lone comp well above the next does not set value", () => {
    const r = run([sold(270000), sold(250000), sold(248000), sold(247000)]);
    expect(r.value).toBe(247000);
    expect(r.comps.find((c) => c.price === 270000)?.role).toBe("unconfirmed-high");
  });

  it("a lone comp $30K+ above the pack is excluded as an outlier", () => {
    const r = run([sold(300000), sold(250000), sold(248000), sold(247000)]);
    expect(r.comps[0].role).toBe("outlier-excluded");
    expect(r.value).toBe(247000);
    expect(r.observedCeiling).toBe(250000);
  });

  it("two high sales confirm each other and are not outliers", () => {
    const r = run([sold(300000), sold(298000), sold(250000), sold(248000)]);
    expect(r.value).toBe(299000);
    expect(r.supportCount).toBe(2);
  });

  it("fewer than 3 good comps: no value, and it says so", () => {
    const r = run([sold(250000), sold(248000)]);
    expect(r.value).toBeNull();
    expect(r.supportCount).toBe(0);
    expect(r.noValueReason).toMatch(/Fewer than 3/);
    expect(r.loanBasis.basis).toBe("none");
  });

  it("3 comps that all stand alone: no supported level", () => {
    const r = run([sold(250000), sold(225000), sold(200000)]);
    expect(r.value).toBeNull();
    expect(r.noValueReason).toMatch(/no two of them agree/);
  });

  it("never averages: many low saleable comps do not pull the value down", () => {
    const low = Array.from({ length: 10 }, () => sold(150000));
    expect(run([sold(250000), sold(249000), sold(248000), ...low]).value).toBe(248000);
  });
});

describe("ARV v2 market model — populations and comp selection", () => {
  it("excludes distressed sales before anything else", () => {
    const r = run([
      sold(250000), sold(249000), sold(248000),
      sold(90000, { remarks: "Investor special, needs work, sold as-is, cash only." }),
      sold(80000, { raw: { SpecialListingConditions: "Auction", BuyerFinancing: "Cash" } }),
    ]);
    expect(r.populations.distressedExcluded).toBe(2);
    expect(r.comps).toHaveLength(3);
    expect(r.stepDown).toBeNull();
  });

  it("walks the ladder: 0.25 mi, then 0.5 mi, then ±1 bed/bath with adjusted prices", () => {
    const quarter = run([sold(250000), sold(249000), sold(248000), sold(300000, { miles: 0.4 })]);
    expect(quarter.stepUsed?.radiusMiles).toBe(0.25);
    expect(quarter.value).toBe(248000);

    const half = run([sold(250000), sold(249000), sold(248000, { miles: 0.4 }), sold(400000, { miles: 0.8 })]);
    expect(half.stepUsed).toMatchObject({ radiusMiles: 0.5, relaxed: false });

    const relaxed = run([sold(250000), sold(249000), sold(240000, { beds: 2 }), sold(400000, { beds: 5 })]);
    expect(relaxed.stepUsed?.relaxed).toBe(true);
    const adj = relaxed.comps.find((c) => c.comp.beds === 2)!;
    expect(adj.price).toBeCloseTo(240000 * 1.03);
    expect(adj.adjustments).toHaveLength(1);
    expect(relaxed.comps.some((c) => c.comp.beds === 5)).toBe(false);
  });

  it("applies ±200 sq ft, basement and split-level as hard filters", () => {
    const pool = () => [sold(250000), sold(249000), sold(248000)];
    expect(run([...pool(), sold(400000, { sqft: 1250 }), sold(400000, { sqft: 1240 })]).value).toBe(248000);
    expect(run([...pool(), sold(400000, { basement: "0" }), sold(399000, { basement: "0" })]).value).toBe(248000);
    expect(run([...pool(), sold(400000, { levels: "Multi/Split" }), sold(399000, { levels: "Multi/Split" })]).value).toBe(248000);
    // No-basement subject takes only no-basement comps.
    expect(run(pool(), { hasBasement: false }).value).toBeNull();
    // Split-level subject: split comps only, out to 1 mile.
    const splits = [sold(260000, { levels: "Multi/Split", miles: 0.9 }), sold(259000, { levels: "Multi/Split", miles: 0.8 }), sold(258000, { levels: "Multi/Split", miles: 0.7 })];
    const r = run([...pool(), ...splits], { levels: "Multi/Split" });
    expect(r.stepUsed?.radiusMiles).toBe(1);
    expect(r.value).toBe(258000);
  });

  it("adjusts down only, for subject deficits against the supporting comps", () => {
    const pool = [sold(250000, { sqft: 1150, garage: "1" }), sold(249000, { sqft: 1150, garage: "1" }), sold(248000, { sqft: 1150, garage: "1" })];
    const small = run(pool, { garageSpaces: 0 }, { applyDeficits: true });
    expect(small.top?.anchor).toBe(248000);
    expect(small.value).toBeLessThan(248000);
    expect(small.top?.deficits).toHaveLength(2);
    const bigger = run([sold(250000, { sqft: 900 }), sold(249000, { sqft: 900 }), sold(248000, { sqft: 900 })], { garageSpaces: 2 }, { applyDeficits: true });
    expect(bigger.value).toBe(248000); // superior subject is never adjusted above the supported top
  });
});
