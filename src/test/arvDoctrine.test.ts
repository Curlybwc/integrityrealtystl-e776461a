/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
import { describe, expect, it } from "vitest";
import { valueByDoctrine } from "../../supabase/functions/_shared/arv-clean-room/doctrine.ts";
import { normalizeSold } from "../../supabase/functions/_shared/arv-clean-room/engine.ts";

const LAT = 38.58, LNG = -90.26;
const MILE_LAT = 1 / 69.05; // degrees of latitude per mile

let seq = 0;
function sold(price: number, over: { miles?: number; beds?: number; baths?: number; sqft?: number; basement?: "1" | "0"; levels?: string; remarks?: string; raw?: any; garage?: string; arch?: string } = {}) {
  seq++;
  return normalizeSold({
    mlsNumber: `M${seq}`, type: "Sale", lastStatus: "Sld", soldPrice: price, soldDate: "2026-08-01T00:00:00.000-00:00",
    address: { streetNumber: String(seq), streetName: "Main", city: "St Louis", zip: "63116", addressKey: `k${seq}` },
    map: { latitude: LAT + (over.miles ?? 0.1) * MILE_LAT, longitude: LNG },
    details: { sqft: String(over.sqft ?? 1000), numBedrooms: over.beds ?? 3, yearBuilt: "1955", style: "Single Family Residence", propertyType: "Residential", description: over.remarks ?? "" },
    raw: { BathroomsFull: String(Math.floor(over.baths ?? 1)), BathroomsHalf: (over.baths ?? 1) % 1 ? "1" : "0", ArchitecturalStyle: over.arch, BasementYN: over.basement ?? "1", Levels: over.levels ?? "One", GarageSpaces: over.garage, ...over.raw },
  })!;
}
const subject = (over: any = {}) => ({
  mlsNumber: "SUBJ", address: "subject", addressKey: "subj", zip: "63116", subdivision: null, lat: LAT, lng: LNG,
  sqft: 1000, beds: 3, baths: 1, yearBuilt: 1955, levels: "One", garageSpaces: null, hasBasement: true,
  style: "Single Family Residence", propertyType: "Residential", listPrice: null, remarks: "", ...over,
});
const run = (prices: any[], subj: any = {}, options: any = {}) =>
  valueByDoctrine({ subject: subject(subj), pool: prices, options: { asOf: "2026-11-01T00:00:00Z", applyDeficits: false, timeAdjust: false, ...options } });

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

  it("walks the ladder: 0.25 mi, then 0.5 mi, then baths ±1 — and bedrooms never relax", () => {
    const quarter = run([sold(250000), sold(249000), sold(248000), sold(300000, { miles: 0.4 })]);
    expect(quarter.stepUsed?.radiusMiles).toBe(0.25);
    expect(quarter.value).toBe(248000);

    const half = run([sold(250000), sold(249000), sold(248000, { miles: 0.4 }), sold(400000, { miles: 0.8 })]);
    expect(half.stepUsed).toMatchObject({ radiusMiles: 0.5, bathTolerance: 0.5 });

    // Different bedroom counts never make a good comp, however many there are.
    const beds = run([sold(250000), sold(249000), sold(248000, { beds: 2 }), sold(247000, { beds: 4 }), sold(246000, { beds: 2 })]);
    expect(beds.value).toBeNull();
    expect(beds.noValueReason).toMatch(/Fewer than 3/);
    expect(beds.comps.every((c) => c.comp.beds === 3)).toBe(true);
    expect(beds.contextComps.map((c) => c.comp.beds).sort()).toEqual([2, 2, 4]);
  });

  it("relaxes baths last, with adjusted prices, among 2 / 2.5 / 3", () => {
    const r = run([sold(300000, { baths: 2 }), sold(299000, { baths: 2 }), sold(310000, { baths: 3 })], { baths: 2 });
    expect(r.stepUsed).toMatchObject({ radiusMiles: 0.5, bathTolerance: 1 });
    const three = r.comps.find((c) => c.comp.baths === 3)!;
    expect(three.price).toBeCloseTo(310000 * 0.97);
    expect(three.adjustments).toHaveLength(1);
    // "Similar baths" (a half bath apart) is allowed before relaxing.
    const similar = run([sold(300000, { baths: 2 }), sold(299000, { baths: 2 }), sold(298000, { baths: 2.5 })], { baths: 2 });
    expect(similar.stepUsed?.bathTolerance).toBe(0.5);
  });

  it("never crosses the 1-bath line in either direction", () => {
    const oneBath = [sold(250000), sold(249000)];
    // 1-bath subject: 1.5- and 2-bath comps are never admitted.
    const a = run([...oneBath, sold(260000, { baths: 1.5 }), sold(261000, { baths: 2 })]);
    expect(a.value).toBeNull();
    expect(a.comps.every((c) => c.comp.baths === 1)).toBe(true);
    // 2-bath subject never drops to a 1-bath comp; 1.5 is on its side of the line.
    const b = run([sold(300000, { baths: 2 }), sold(299000, { baths: 2 }), sold(200000, { baths: 1 }), sold(199000, { baths: 1 })], { baths: 2 });
    expect(b.value).toBeNull();
    const c = run([sold(300000, { baths: 2 }), sold(299000, { baths: 2 }), sold(290000, { baths: 1.5 })], { baths: 2 });
    expect(c.value).not.toBeNull();
    // 1.5-bath subject does not take a 1-bath comp either.
    const d = run([sold(300000, { baths: 1.5 }), sold(299000, { baths: 1.5 }), sold(298000, { baths: 1 })], { baths: 1.5 });
    expect(d.value).toBeNull();
  });

  it("screens out a lower cluster far below the supported top, from value and step-down", () => {
    const r = run([sold(150000), sold(150000), sold(149500), sold(121000), sold(85000), sold(75000)]);
    expect(r.value).toBe(149500);
    expect(r.supportCount).toBe(3);
    expect(r.stepDown).toBeNull(); // $85K/$75K agree with each other but are distressed-market by relative price
    expect(r.comps.filter((c) => c.role === "price-screened").map((c) => c.price)).toEqual([85000, 75000]);
    expect(r.comps.find((c) => c.price === 121000)?.role).toBe("below");
    expect(r.stepUsed?.goodComps).toBe(4);
    // Relative, not absolute: the same shape at 3x the prices screens the same sales.
    const big = run([sold(450000), sold(450000), sold(448500), sold(255000), sold(225000)], {}, { clusterTolerance: 5000 });
    expect(big.comps.filter((c) => c.role === "price-screened")).toHaveLength(2);
    // A step-down within the gap survives.
    const near = run([sold(250000), sold(249000), sold(248000), sold(225000), sold(224000)]);
    expect(near.stepDown?.value).toBe(224500);
  });

  it("price-screened sales do not count toward the 3 good comps", () => {
    const r = run([sold(250000), sold(249000), sold(120000), sold(118000)]);
    expect(r.value).toBeNull();
    expect(r.noValueReason).toMatch(/Fewer than 3/);
  });

  it("prefers same-storeys comps within a step; the MLS style term is ignored unless switched back on", () => {
    const subj = { levels: "One", archStyle: "Ranch" };
    const ranch = () => [sold(250000, { arch: "Ranch" }), sold(249000, { arch: "Ranch,Traditional" }), sold(248000, { arch: "Ranch" })];
    // v4 default: a one-storey "Bungalow" is style-matched; a two-storey is not.
    const a = run([...ranch(), sold(270000, { arch: "Bungalow" }), sold(269500, { arch: "Bungalow" }), sold(300000, { levels: "Two" }), sold(299000, { levels: "Two" })], subj);
    expect(a.stepUsed).toMatchObject({ radiusMiles: 0.25, styleMatchedOnly: true });
    expect(a.value).toBe(270000); // midpoint 269,750, rounded to the nearest $500
    // v3 behaviour behind its flag: the differing style term excludes the Bungalows.
    const b = run([...ranch(), sold(270000, { arch: "Bungalow" }), sold(269500, { arch: "Bungalow" })], subj, { styleTermPreference: true });
    expect(b.value).toBe(248000);
    // Too few matched: other storeys are admitted at the same step, not skipped for a wider one.
    const c = run([...ranch().slice(0, 2), sold(248000, { levels: "Two" }), sold(300000, { miles: 0.4 })], subj);
    expect(c.stepUsed).toMatchObject({ radiusMiles: 0.25, styleMatchedOnly: false });
  });

  it("trends comp prices by age at the named monthly rate, capped at 12 months", () => {
    const r = run([sold(250000), sold(249000), sold(248000)], {}, { timeAdjust: true });
    // Comps contracted 2026-08-01, valued 2026-11-01: ~3.02 months at 0.4%/month.
    expect(r.comps[0].price).toBeGreaterThan(250000 * 1.0119);
    expect(r.comps[0].price).toBeLessThan(250000 * 1.0123);
    expect(r.comps[0].adjustments[0]).toMatch(/^time:/);
    const off = run([sold(250000), sold(249000), sold(248000)]);
    expect(off.comps[0].price).toBe(250000);
    const old = run([sold(250000), sold(249000), sold(248000)], {}, { timeAdjust: true, asOf: "2028-11-01T00:00:00Z" });
    expect(old.comps[0].price).toBeCloseTo(250000 * 1.048, 0);
  });

  it("prefers same-school-district comps within a step, never as a filter", () => {
    const subj = { schoolDistrict: "Affton" };
    const sd = (price: number, district: string, o: any = {}) => sold(price, { ...o, raw: { SchoolDistrict: district } });
    const pool = () => [sd(250000, "Affton"), sd(249000, "Affton"), sd(248000, "Affton"), sd(280000, "Lindbergh"), sd(279000, "Lindbergh")];
    const on = run(pool(), subj, { districtPreference: true });
    expect(on.stepUsed).toMatchObject({ radiusMiles: 0.25, sameDistrictOnly: true });
    expect(on.value).toBe(248000);
    expect(run(pool(), subj).value).toBe(279500); // preference off: all qualifying comps
    // Too few same-district comps: others are admitted at the SAME step; the ladder does not widen or relax for district.
    const thin = run([sd(250000, "Affton"), sd(249000, "Lindbergh"), sd(248000, "Lindbergh"), sd(400000, "Affton", { miles: 0.4 }), sd(399000, "Affton", { miles: 0.4 })], subj, { districtPreference: true });
    expect(thin.stepUsed).toMatchObject({ radiusMiles: 0.25, sameDistrictOnly: false });
    expect(thin.value).toBe(248000);
  });

  it("reads the value at each finish grade and warns on over-improvement", () => {
    const reno = { raw: { PropertyCondition: "Updated/Remodeled" } };
    const pool = () => [sold(250000, reno), sold(249000, reno), sold(248000, reno), sold(200000), sold(199000), sold(198000)];
    const r = run(pool(), {}, { intendedGrade: "retail" });
    expect(r.value).toBe(248000);
    expect(r.gradeReads?.retail.value).toBe(248000);
    expect(r.gradeReads?.rental.value).toBe(198000);
    expect(r.gradeReads?.atIntended).toBe(r.gradeReads?.retail);
    expect(r.gradeReads?.overImprovementWarning).toBeNull();
    const flat = run([sold(250000, reno), sold(249000, reno), sold(248000, reno), sold(250000), sold(249500), sold(249000)], {}, { intendedGrade: "rental" });
    expect(flat.gradeReads?.overImprovementWarning).toMatch(/Over-improvement/);
    expect(run(pool()).gradeReads).toBeUndefined();
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
