// ARV market-model valuation layer (pure, no I/O) — third revision.
//
// The owner's model:
//   1. Sold data mixes a saleable market and a distressed market. Separate
//      them first — by evidence, then by relative price; distressed sales are
//      excluded, never averaged in.
//   2. ARV is the standard renovated price, read off the SHAPE of the top of
//      the saleable comp set — never a mean or median of the set.
//   3. Comps come from a fixed ladder. Bedroom count never relaxes. Baths may
//      relax last, and never across the 1-bath line. Basement and split level
//      are hard filters. Within a step, style-matched comps come first.
//   4. Anchor at the supported top; adjust DOWN only, for subject deficits.
//   5. Always report value, support count, and the next supported level down.
//
// The condition evidence (assessCondition / detectFlips) is used only to
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
  /** A comp this far above the next is "lone" and does not set value. Owner-confirmed. */
  significantGap?: number;
  /** A lone comp this far above the pack is an outlier and is excluded. Owner's figure. */
  outlierGap?: number;
  /** Good comp = within this many sq ft of the subject. Owner's figure. */
  sqftBand?: number;
  minComps?: number;
  /** Bath difference allowed at the "similar baths" steps and at the relaxed step. */
  similarBathTolerance?: number;
  relaxedBathTolerance?: number;
  /** Price change per full bath of difference (within the same side of the 1-bath line). UNCALIBRATED. */
  bathAdjustPct?: number;
  /**
   * Relative-price screen: a saleable comp priced this fraction (or more) below
   * the low end of the supported top range belongs to the distressed market.
   * UNCALIBRATED.
   */
  distressGapPct?: number;
  /** Try each ladder step with style-matched comps only before admitting other styles. Default true. */
  stylePreference?: boolean;
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
  similarBathTolerance: 0.5,
  relaxedBathTolerance: 1,
  bathAdjustPct: 0.03,
  distressGapPct: 0.25,
  stylePreference: true,
  applyDeficits: true,
  sizeElasticity: 0.6,
  garageDeficitPct: 0.025,
};

export type CompRole =
  | "supports-value" // in the top range that sets the value
  | "unconfirmed-high" // lone sale above the supported level; does not set value
  | "outlier-excluded" // lone sale >= outlierGap above the pack; removed from the set
  | "supports-step-down"
  | "below" // saleable comp below the supported levels
  | "price-screened"; // far below the supported top: distressed market by relative price

export interface DoctrineComp {
  comp: SoldComp;
  distanceMiles: number;
  condition: ConditionAssessment;
  /** Sold price, adjusted only for a bath-count difference. */
  price: number;
  adjustments: string[];
  /** Same Levels and (where both are known) an overlapping MLS architectural style. */
  styleMatch: boolean;
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
  bathTolerance: number;
  /** True when only style-matched comps were admitted at this step. */
  styleMatchedOnly: boolean;
  goodComps: number;
  outliersExcluded: number;
  priceScreened: number;
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
  /** Comp set of the ladder step used, highest price first (includes excluded outliers and price-screened sales). */
  comps: DoctrineComp[];
  /**
   * CONTEXT ONLY: saleable sales within the widest radius that pass every test
   * except bedroom count (±1 bedroom). Never used for the value, the support
   * count or the step-down.
   */
  contextComps: DoctrineComp[];
  ladder: LadderStep[];
  stepUsed: LadderStep | null;
  populations: {
    poolSize: number;
    saleable: number;
    distressedExcluded: number;
    /** Distressed-by-evidence sales inside the search radius, for review. */
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
/** The 1-bath line: one bath vs more than one is a value break, not a gradient. */
const bathSide = (baths: number) => (baths <= 1 ? 1 : 2);
const styleTokens = (s: string | null | undefined) =>
  (s ?? "").split(",").map((t) => t.trim().toLowerCase()).filter((t) => t && t !== "other");

export function isStyleMatch(subject: Property, c: Property): boolean {
  const levelsKnown = !!subject.levels && !!c.levels;
  const a = styleTokens(subject.archStyle), b = styleTokens(c.archStyle);
  const archKnown = a.length > 0 && b.length > 0;
  if (!levelsKnown && !archKnown) return false;
  if (levelsKnown && subject.levels !== c.levels) return false;
  if (archKnown && !a.some((t) => b.includes(t))) return false;
  return true;
}

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

interface StepDef {
  label: string;
  radiusMiles: number;
  bathTolerance: number;
  styleMatchedOnly: boolean;
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

  // ---- 1a. separate the populations by evidence ----
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
  const tag = split ? ", split-level only" : "";
  const sim = `same beds, similar baths${tag}`;
  const rel = `same beds, baths ±${o.relaxedBathTolerance}${tag}`;
  const base: Omit<StepDef, "styleMatchedOnly">[] = split
    ? [
      { label: `0.25 mi, ${sim}`, radiusMiles: 0.25, bathTolerance: o.similarBathTolerance },
      { label: `0.5 mi, ${sim}`, radiusMiles: 0.5, bathTolerance: o.similarBathTolerance },
      { label: `1 mi, ${sim}`, radiusMiles: 1, bathTolerance: o.similarBathTolerance },
      { label: `1 mi, ${rel}`, radiusMiles: 1, bathTolerance: o.relaxedBathTolerance },
    ]
    : [
      { label: `0.25 mi, ${sim}`, radiusMiles: 0.25, bathTolerance: o.similarBathTolerance },
      { label: `0.5 mi, ${sim}`, radiusMiles: 0.5, bathTolerance: o.similarBathTolerance },
      { label: `0.5 mi, ${rel}`, radiusMiles: 0.5, bathTolerance: o.relaxedBathTolerance },
    ];
  // Style is a preference: each step is tried with style-matched comps only, then with all.
  const subjectHasStyle = o.stylePreference && (!!subject.levels || styleTokens(subject.archStyle).length > 0);
  const steps: StepDef[] = base.flatMap((s) =>
    subjectHasStyle
      ? [{ ...s, label: `${s.label}, style-matched`, styleMatchedOnly: true }, { ...s, label: `${s.label}, any style`, styleMatchedOnly: false }]
      : [{ ...s, label: `${s.label}, any style`, styleMatchedOnly: false }]
  );
  const maxRadius = base[base.length - 1].radiusMiles;

  if (subject.sqft === null) notes.push("Subject square footage unknown: the ±200 sq ft test could not be applied.");
  if (subject.beds === null) notes.push("Subject bedroom count unknown: the same-beds test could not be applied.");
  if (subject.baths === null) notes.push("Subject bath count unknown: the bath tests and the 1-bath line could not be applied.");
  if (subject.hasBasement === null) notes.push("Subject basement status unknown: the basement hard filter could not be applied.");
  if (!subjectHasStyle && o.stylePreference) notes.push("Subject style unknown: the style preference could not be applied.");

  const passesFixed = (c: SoldComp) => {
    if (subject.sqft !== null && (c.sqft === null || Math.abs(c.sqft - subject.sqft) > o.sqftBand)) return false;
    // Basement is a hard filter (applied both ways; a comp of unknown status cannot be verified).
    if (subject.hasBasement !== null && c.hasBasement !== subject.hasBasement) return false;
    // Split level is its own style (applied both ways).
    if (isSplit(c.levels) !== split) return false;
    return true;
  };
  /** Baths within tolerance and on the same side of the 1-bath line. */
  const bathsOk = (c: SoldComp, tol: number) => {
    if (subject.baths === null) return true;
    if (c.baths === null) return false;
    return bathSide(c.baths) === bathSide(subject.baths) && Math.abs(c.baths - subject.baths) <= tol;
  };
  const sameBeds = (c: SoldComp) => subject.beds === null || c.beds === subject.beds;

  const toComp = (s: { c: SoldComp; cond: ConditionAssessment; mi: number }): DoctrineComp => {
    let price = s.c.soldPrice;
    const adjustments: string[] = [];
    const dBath = subject.baths !== null && s.c.baths !== null ? subject.baths - s.c.baths : 0;
    if (dBath) {
      price *= 1 + o.bathAdjustPct * dBath;
      adjustments.push(`${s.c.baths} -> ${subject.baths} baths: ${dBath > 0 ? "+" : ""}${(o.bathAdjustPct * dBath * 100).toFixed(1)}%`);
    }
    return { comp: s.c, distanceMiles: s.mi, condition: s.cond, price, adjustments, styleMatch: isStyleMatch(subject, s.c), role: "below" };
  };

  const build = (step: StepDef): DoctrineComp[] =>
    saleable
      .filter((s) => s.mi <= step.radiusMiles && passesFixed(s.c) && sameBeds(s.c) && bathsOk(s.c, step.bathTolerance))
      .map(toComp)
      .filter((c) => !step.styleMatchedOnly || c.styleMatch)
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

  // ---- walk the ladder; 1b. relative-price screen; 2. read the top ----
  const ladder: LadderStep[] = [];
  let stepUsed: LadderStep | null = null;
  let good: DoctrineComp[] = [];
  let outliers: DoctrineComp[] = [];
  let screened: DoctrineComp[] = [];
  let level: Level | null = null;
  let scattered = false;

  for (const step of steps) {
    const { kept, out } = stripOutliers(build(step));
    let lvl: Level | null = null;
    let scr: DoctrineComp[] = [];
    let remaining = kept;
    if (kept.length >= o.minComps) {
      lvl = readSupportedLevel(kept, o);
      if (lvl) {
        // A saleable-by-evidence sale far below the supported top is a distressed-market
        // sale: exclude it from the comp count, the value and the step-down.
        const floor = lvl.supporters[lvl.supporters.length - 1].price * (1 - o.distressGapPct);
        scr = lvl.rest.filter((c) => c.price < floor);
        if (scr.length) {
          for (const c of scr) c.role = "price-screened";
          lvl = { ...lvl, rest: lvl.rest.filter((c) => c.price >= floor) };
          remaining = kept.filter((c) => c.role !== "price-screened");
        }
      }
    }
    const rec: LadderStep = { ...step, goodComps: remaining.length, outliersExcluded: out.length, priceScreened: scr.length };
    ladder.push(rec);
    good = remaining;
    outliers = out;
    screened = scr;
    level = lvl;
    scattered = kept.length >= o.minComps && !lvl;
    if (remaining.length >= o.minComps) {
      stepUsed = rec;
      break;
    }
  }

  // ---- 4. deficits; 5. support + step-down ----
  let top: SupportedLevel | null = null;
  let stepDown: SupportedLevel | null = null;
  let noValueReason: string | null = null;

  if (!stepUsed) {
    noValueReason = `Fewer than ${o.minComps} good comps even at the widest step (${good.length} found within ${maxRadius} mi with the same bedroom count). No supported value.`;
  } else if (scattered || !level) {
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
    if (level.supporters.some((c) => c.adjustments.length)) notes.push("The value rests partly on comps with a different bath count whose prices were adjusted with an uncalibrated percentage.");
    const mism = level.supporters.filter((c) => !c.styleMatch).length;
    if (mism && subjectHasStyle) notes.push(`${mism} of ${level.supporters.length} supporting comps are not style-matched (too few style-matched comps at this step).`);
    const eraOdd = level.supporters.filter((c) => c.comp.newConstruction || (subject.yearBuilt && c.comp.yearBuilt && Math.abs(subject.yearBuilt - c.comp.yearBuilt) > 40));
    if (eraOdd.length) notes.push(`${eraOdd.length} supporting comp(s) are new construction or 40+ years different in age from the subject; the model has no age filter, so check them.`);
  }
  if (outliers.length) notes.push(`${outliers.length} lone sale(s) ${usd(o.outlierGap)}+ above the pack excluded as outliers (${outliers.map((c) => usd(c.price)).join(", ")}).`);
  if (screened.length) notes.push(`${screened.length} sale(s) ${(o.distressGapPct * 100).toFixed(0)}%+ below the supported top treated as distressed-market by relative price and excluded (${screened.map((c) => usd(c.price)).join(", ")}).`);

  const value = top?.value ?? null;
  const supportCount = top?.supportCount ?? 0;
  let loanBasis: DoctrineValuation["loanBasis"];
  if (value === null) loanBasis = { value: null, basis: "none", reason: "No supported value." };
  else if (supportCount >= 3) loanBasis = { value, basis: "value", reason: `${supportCount} comps support the top range.` };
  else if (stepDown) loanBasis = { value: stepDown.value, basis: "step-down", reason: `Only ${supportCount} comps support the top range; use the next supported level.` };
  else loanBasis = { value: null, basis: "none", reason: `Only ${supportCount} comps support the top range and there is no supported level below it.` };

  // Context only: ±1 bedroom, otherwise passing the widest step's tests. Never used above.
  const contextComps = subject.beds === null ? [] : saleable
    .filter((s) => s.mi <= maxRadius && passesFixed(s.c) && s.c.beds !== null && Math.abs(s.c.beds - (subject.beds as number)) === 1 && bathsOk(s.c, o.relaxedBathTolerance))
    .map(toComp)
    .sort((a, b) => b.price - a.price);

  const comps = [...outliers, ...good, ...screened];
  return {
    subject, asOf, value, supportCount, stepDown, loanBasis, top,
    observedCeiling: good.length ? good[0].price : null,
    noValueReason, comps, contextComps, ladder, stepUsed,
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
