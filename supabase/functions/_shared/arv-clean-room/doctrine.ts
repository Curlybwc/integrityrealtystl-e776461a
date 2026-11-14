// ARV v2 — "market model" valuation layer (pure, no I/O).
//
// Replaces v1's similarity-weighted median. The owner's model:
//   1. Sold data mixes a saleable market and a distressed market. Separate
//      them first; distressed sales are excluded, never averaged in.
//   2. ARV is the standard renovated price, read off the SHAPE of the top of
//      the saleable comp set — never a mean or median of the set.
//   3. Comps come from a fixed ladder (0.25 mi -> 0.5 mi -> relax bed/bath),
//      with basement and split-level as hard filters and lone outliers removed.
//   4. Anchor at the supported top; adjust DOWN only, for subject deficits.
//   5. Always report value, support count, and the next supported level down.
//
// v1's condition evidence (assessCondition / detectFlips) is reused only to
// EXCLUDE distressed sales. It does not grade or weight anything here.

import { assessCondition, detectFlips, haversineKm } from "./engine.ts";
import type { ConditionAssessment, Property, SoldComp } from "./types.ts";

const KM_PER_MILE = 1.609344;

export interface DoctrineOptions {
  /** Valuation date (ISO). Only sales contracted before it are used. Default: now. */
  asOf?: string;
  excludeMls?: string[];
  /** "Clustered tightly at the top": within this many dollars. Owner's figure. */
  clusterTolerance?: number;
  /** A comp this far above the next is "lone" and does not set value. UNCALIBRATED. */
  significantGap?: number;
  /** A lone comp this far above the pack is an outlier and is excluded. Owner's figure (low end of $30-40K). */
  outlierGap?: number;
  /** Good comp = within this many sq ft of the subject. Owner's figure. */
  sqftBand?: number;
  minComps?: number;
  /** Price change per bedroom / per full bath when a relaxed (±1) comp is adjusted. UNCALIBRATED. */
  bedAdjustPct?: number;
  bathAdjustPct?: number;
  /** Apply downward-only subject-deficit adjustments (size, garage). Default true. */
  applyDeficits?: boolean;
  /** Deficit magnitudes. UNCALIBRATED (carried over from v1's priors). */
  sizeElasticity?: number;
  garageDeficitPct?: number;
}

export const DOCTRINE_DEFAULTS = {
  clusterTolerance: 5_000,
  significantGap: 15_000,
  outlierGap: 30_000,
  sqftBand: 200,
  minComps: 3,
  bedAdjustPct: 0.03,
  bathAdjustPct: 0.03,
  applyDeficits: true,
  sizeElasticity: 0.6,
  garageDeficitPct: 0.025,
};

export type CompRole =
  | "supports-value" // in the top range that sets the value
  | "unconfirmed-high" // lone sale above the supported level; does not set value
  | "outlier-excluded" // lone sale >= outlierGap above the pack; removed from the set
  | "supports-step-down"
  | "below"; // saleable comp below the supported levels

export interface DoctrineComp {
  comp: SoldComp;
  distanceMiles: number;
  condition: ConditionAssessment;
  /** Sold price, adjusted only if this is a relaxed (±1 bed/bath) comp. */
  price: number;
  adjustments: string[];
  role: CompRole;
}

export type TopShape =
  | "tight-cluster" // >=3 comps within clusterTolerance at the top -> low end of cluster
  | "top-two" // two comps agree at the top -> between them
  | "none";

export interface SupportedLevel {
  /** Level read from the comps, before subject-deficit adjustments. */
  anchor: number;
  /** Anchor after downward-only deficit adjustments. */
  value: number;
  shape: TopShape;
  /** How many comps support this range. */
  supportCount: number;
  deficits: string[];
}

export interface LadderStep {
  label: string;
  radiusMiles: number;
  relaxed: boolean;
  goodComps: number;
  outliersExcluded: number;
}

export interface DoctrineValuation {
  subject: Property;
  asOf: string;
  /** The ARV, or null when the market gives no supported value. */
  value: number | null;
  /** REQUIRED OUTPUT: how many comps support the top range that sets `value`. */
  supportCount: number;
  /** REQUIRED OUTPUT: next supported level down (null if there is none). */
  stepDown: SupportedLevel | null;
  /** What loan math should use: `value` with >=3 supporting comps, else the step-down. */
  loanBasis: { value: number | null; basis: "value" | "step-down" | "none"; reason: string };
  top: SupportedLevel | null;
  /** Highest non-outlier sale in the comp set — the market's observed ceiling. */
  observedCeiling: number | null;
  noValueReason: string | null;
  /** Comp set of the ladder step used, highest price first (includes excluded outliers). */
  comps: DoctrineComp[];
  ladder: LadderStep[];
  stepUsed: LadderStep | null;
  populations: {
    poolSize: number;
    saleable: number;
    distressedExcluded: number;
    /** Distressed sales inside the search radius, for review. */
    distressedNearby: { comp: SoldComp; distanceMiles: number; signals: string[] }[];
  };
  notes: string[];
}

const isSplit = (levels: string | null) => !!levels && /split/i.test(levels);
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const round500 = (n: number) => Math.round(n / 500) * 500;
const medianOf = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2;
};

interface Level {
  anchor: number;
  shape: TopShape;
  supporters: DoctrineComp[];
  unconfirmed: DoctrineComp[];
  rest: DoctrineComp[];
}

/**
 * Read the supported level off the top of a price-descending comp list.
 *  - A comp more than `significantGap` above the next is lone: it does not set
 *    value; keep walking down.
 *  - Once two adjacent comps agree: if >=3 sit within `clusterTolerance` of the
 *    higher one, value = low end of that cluster; otherwise value = between
 *    the top two.
 * Returns null when no two sales agree (no supported level).
 */
export function readSupportedLevel(sorted: DoctrineComp[], o: { clusterTolerance: number; significantGap: number }): Level | null {
  const unconfirmed: DoctrineComp[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const p = sorted[i].price;
    if (p - sorted[i + 1].price > o.significantGap) {
      unconfirmed.push(sorted[i]);
      continue;
    }
    const tight = sorted.slice(i).filter((c) => p - c.price <= o.clusterTolerance);
    const shape: TopShape = tight.length >= 3 ? "tight-cluster" : "top-two";
    const anchor = shape === "tight-cluster" ? tight[tight.length - 1].price : (p + sorted[i + 1].price) / 2;
    // Supporters: everything from the top of this level down to `clusterTolerance`
    // below the anchor, and never fewer than the pair that defines it.
    const supporters = sorted.slice(i).filter((c, k) => k < 2 || c.price >= anchor - o.clusterTolerance);
    const rest = sorted.slice(i + supporters.length);
    return { anchor, shape, supporters, unconfirmed, rest };
  }
  return null;
}

/** Downward-only adjustments for where the subject falls short of the comps that set the level. */
function applyDeficits(subject: Property, level: Level, o: typeof DOCTRINE_DEFAULTS): SupportedLevel {
  let value = level.anchor;
  const deficits: string[] = [];
  if (o.applyDeficits) {
    const sq = level.supporters.map((c) => c.comp.sqft).filter((x): x is number => !!x);
    if (subject.sqft && sq.length) {
      const med = medianOf(sq);
      if (subject.sqft < med) {
        const f = (subject.sqft / med) ** o.sizeElasticity;
        deficits.push(`smaller than supporting comps (${subject.sqft} vs median ${Math.round(med)} sq ft): ${((f - 1) * 100).toFixed(1)}%`);
        value *= f;
      }
    }
    const g = level.supporters.map((c) => c.comp.garageSpaces).filter((x): x is number => x !== null);
    if (subject.garageSpaces === 0 && g.length && g.filter((x) => x > 0).length * 2 > g.length) {
      deficits.push(`no garage; most supporting comps have one: -${(o.garageDeficitPct * 100).toFixed(1)}%`);
      value *= 1 - o.garageDeficitPct;
    }
  }
  return {
    anchor: round500(level.anchor), value: round500(value), shape: level.shape,
    supportCount: level.supporters.length, deficits,
  };
}

export function valueByDoctrine(input: { subject: Property; pool: SoldComp[]; options?: DoctrineOptions }): DoctrineValuation {
  const { subject, pool } = input;
  const o = { ...DOCTRINE_DEFAULTS, ...(input.options ?? {}) };
  const asOf = input.options?.asOf ?? new Date().toISOString();
  const asOfDay = asOf.slice(0, 10);
  const excluded = new Set([...(input.options?.excludeMls ?? []), ...(subject.mlsNumber ? [subject.mlsNumber] : [])]);
  const notes: string[] = [];

  // ---- data hygiene: de-dupe, drop the subject itself and anything after the valuation date ----
  const seen = new Set<string>();
  const usable = pool.filter((c) => {
    const k = c.mlsNumber ?? `${c.addressKey}|${c.contractDate}`;
    if (seen.has(k)) return false;
    seen.add(k);
    if (c.mlsNumber && excluded.has(c.mlsNumber)) return false;
    if (subject.addressKey && c.addressKey === subject.addressKey) return false;
    if (c.contractDate >= asOfDay) return false;
    return c.soldPrice >= 5000;
  });

  // ---- 1. separate the populations ----
  const { uplift, buyLegs } = detectFlips(usable);
  const saleable: { c: SoldComp; cond: ConditionAssessment; mi: number }[] = [];
  const distressed: { comp: SoldComp; distanceMiles: number; signals: string[] }[] = [];
  for (const c of usable) {
    const cond = assessCondition(c, c.mlsNumber ? uplift.get(c.mlsNumber) : null);
    const mi = haversineKm(subject.lat, subject.lng, c.lat, c.lng) / KM_PER_MILE;
    const buyLeg = !!c.mlsNumber && buyLegs.has(c.mlsNumber);
    if (cond.tier === "distressed" || buyLeg) {
      distressed.push({ comp: c, distanceMiles: mi, signals: buyLeg ? [...cond.signals, "bought, then resold much higher (pre-rehab purchase)"] : cond.signals });
    } else saleable.push({ c, cond, mi });
  }

  // ---- 3. comp selection ladder ----
  const split = isSplit(subject.levels);
  const steps: { label: string; radiusMiles: number; relaxed: boolean }[] = split
    ? [
      { label: "0.25 mi, same bed/bath, split-level only", radiusMiles: 0.25, relaxed: false },
      { label: "0.5 mi, same bed/bath, split-level only", radiusMiles: 0.5, relaxed: false },
      { label: "1 mi, same bed/bath, split-level only", radiusMiles: 1, relaxed: false },
      { label: "1 mi, ±1 bed/bath (adjusted), split-level only", radiusMiles: 1, relaxed: true },
    ]
    : [
      { label: "0.25 mi, same bed/bath", radiusMiles: 0.25, relaxed: false },
      { label: "0.5 mi, same bed/bath", radiusMiles: 0.5, relaxed: false },
      { label: "0.5 mi, ±1 bed/bath (adjusted)", radiusMiles: 0.5, relaxed: true },
    ];
  const maxRadius = steps[steps.length - 1].radiusMiles;

  if (subject.sqft === null) notes.push("Subject square footage unknown: the ±200 sq ft test could not be applied.");
  if (subject.beds === null || subject.baths === null) notes.push("Subject bed or bath count unknown: the same-bed/bath test could not be fully applied.");
  if (subject.hasBasement === null) notes.push("Subject basement status unknown: the basement hard filter could not be applied.");

  const passesFixed = (c: SoldComp) => {
    if (subject.sqft !== null && (c.sqft === null || Math.abs(c.sqft - subject.sqft) > o.sqftBand)) return false;
    // Basement is a hard filter (applied both ways; a comp of unknown status cannot be verified).
    if (subject.hasBasement !== null && c.hasBasement !== subject.hasBasement) return false;
    // Split level is its own style (applied both ways).
    if (isSplit(c.levels) !== split) return false;
    return true;
  };
  const bedBath = (c: SoldComp, relaxed: boolean) => {
    const tol = relaxed ? 1 : 0;
    if (subject.beds !== null && (c.beds === null || Math.abs(c.beds - subject.beds) > tol)) return false;
    if (subject.baths !== null && (c.baths === null || Math.abs(c.baths - subject.baths) > tol)) return false;
    return true;
  };

  const build = (step: { radiusMiles: number; relaxed: boolean }): DoctrineComp[] =>
    saleable
      .filter((s) => s.mi <= step.radiusMiles && passesFixed(s.c) && bedBath(s.c, step.relaxed))
      .map((s) => {
        let price = s.c.soldPrice;
        const adjustments: string[] = [];
        const dBed = subject.beds !== null && s.c.beds !== null ? subject.beds - s.c.beds : 0;
        const dBath = subject.baths !== null && s.c.baths !== null ? subject.baths - s.c.baths : 0;
        if (dBed) {
          price *= 1 + o.bedAdjustPct * dBed;
          adjustments.push(`${s.c.beds} -> ${subject.beds} beds: ${dBed > 0 ? "+" : ""}${(o.bedAdjustPct * dBed * 100).toFixed(1)}%`);
        }
        if (dBath) {
          price *= 1 + o.bathAdjustPct * dBath;
          adjustments.push(`${s.c.baths} -> ${subject.baths} baths: ${dBath > 0 ? "+" : ""}${(o.bathAdjustPct * dBath * 100).toFixed(1)}%`);
        }
        return { comp: s.c, distanceMiles: s.mi, condition: s.cond, price, adjustments, role: "below" as CompRole };
      })
      .sort((a, b) => b.price - a.price);

  /** A lone top comp >= outlierGap above the pack is excluded (repeat while it holds). */
  const stripOutliers = (set: DoctrineComp[]) => {
    const kept = [...set];
    const out: DoctrineComp[] = [];
    while (kept.length >= 2 && kept[0].price - kept[1].price >= o.outlierGap) {
      const x = kept.shift()!;
      x.role = "outlier-excluded";
      out.push(x);
    }
    return { kept, out };
  };

  const ladder: LadderStep[] = [];
  let stepUsed: LadderStep | null = null;
  let good: DoctrineComp[] = [];
  let outliers: DoctrineComp[] = [];
  for (const step of steps) {
    const { kept, out } = stripOutliers(build(step));
    const rec: LadderStep = { ...step, goodComps: kept.length, outliersExcluded: out.length };
    ladder.push(rec);
    good = kept;
    outliers = out;
    if (kept.length >= o.minComps) {
      stepUsed = rec;
      break;
    }
  }

  // ---- 2. read the top; 4. deficits; 5. support + step-down ----
  let top: SupportedLevel | null = null;
  let stepDown: SupportedLevel | null = null;
  let noValueReason: string | null = null;

  if (!stepUsed) {
    noValueReason = `Fewer than ${o.minComps} good comps even at the widest step (${good.length} found within ${maxRadius} mi). No supported value.`;
  } else {
    const level = readSupportedLevel(good, o);
    if (!level) {
      noValueReason = `${good.length} good comps, but no two of them agree within ${usd(o.significantGap)} — every sale stands alone, so no level is supported.`;
    } else {
      for (const c of level.unconfirmed) c.role = "unconfirmed-high";
      for (const c of level.supporters) c.role = "supports-value";
      top = applyDeficits(subject, level, o);
      const below = readSupportedLevel(level.rest, o);
      if (below) {
        for (const c of below.supporters) c.role = "supports-step-down";
        stepDown = applyDeficits(subject, below, o);
      }
      if (level.unconfirmed.length) {
        notes.push(`${level.unconfirmed.length} sale(s) above the value (${level.unconfirmed.map((c) => usd(c.price)).join(", ")}) stand alone and do not set it; a second sale at that level would.`);
      }
      if (level.supporters.some((c) => c.adjustments.length)) notes.push("The value rests partly on ±1 bed/bath comps whose prices were adjusted with uncalibrated percentages.");
      const eraOdd = level.supporters.filter((c) => c.comp.newConstruction || (subject.yearBuilt && c.comp.yearBuilt && Math.abs(subject.yearBuilt - c.comp.yearBuilt) > 40));
      if (eraOdd.length) notes.push(`${eraOdd.length} supporting comp(s) are new construction or 40+ years different in age from the subject; the model has no age filter, so check them.`);
    }
  }
  if (outliers.length) notes.push(`${outliers.length} lone sale(s) ${usd(o.outlierGap)}+ above the pack excluded as outliers (${outliers.map((c) => usd(c.price)).join(", ")}).`);

  const value = top?.value ?? null;
  const supportCount = top?.supportCount ?? 0;
  let loanBasis: DoctrineValuation["loanBasis"];
  if (value === null) loanBasis = { value: null, basis: "none", reason: "No supported value." };
  else if (supportCount >= 3) loanBasis = { value, basis: "value", reason: `${supportCount} comps support the top range.` };
  else if (stepDown) loanBasis = { value: stepDown.value, basis: "step-down", reason: `Only ${supportCount} comps support the top range; use the next supported level.` };
  else loanBasis = { value: null, basis: "none", reason: `Only ${supportCount} comps support the top range and there is no supported level below it.` };

  const comps = [...outliers, ...good];
  return {
    subject, asOf, value, supportCount, stepDown, loanBasis, top,
    observedCeiling: good.length ? good[0].price : null,
    noValueReason, comps, ladder, stepUsed,
    populations: {
      poolSize: usable.length, saleable: saleable.length, distressedExcluded: distressed.length,
      distressedNearby: distressed.filter((d) => d.distanceMiles <= maxRadius).sort((a, b) => a.distanceMiles - b.distanceMiles),
    },
    notes,
  };
}

/** Widest radius (km) the ladder can reach for this subject — tells the fetch loop when to stop paging. */
export function doctrineRadiusKm(subject: Property): number {
  return (isSplit(subject.levels) ? 1 : 0.5) * KM_PER_MILE;
}
