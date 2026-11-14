/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Clean-room ARV method — pure valuation engine (no I/O).
//
// Pipeline: normalise -> condition tier -> hard filters -> similarity ->
// price adjustments -> weighted-median ARV from the most similar RENOVATED sales.

import type {
  Adjustment, ArvMethod, ArvOptions, ArvResult, ConditionAssessment, ConditionTier,
  Property, ScoredComp, SoldComp,
} from "./types.ts";

export const DEFAULTS = {
  lookbackMonths: 12,
  maxRadiusKm: 3.2, // ~2 miles
  maxPages: 3,
  targetComps: 6,
  minComps: 3,
  sizeElasticity: 0.6,
  sqftTolerance: 0.3,
  // Off by default: in backtests the pool-estimated trend added noise, not accuracy.
  useTrend: false,
  conditionWeighting: true,
};

// ---------- small helpers ----------

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round = (x: number, to = 1) => Math.round(x / to) * to;

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLng = (bLng - aLng) * r;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function monthsBetween(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / (86_400_000 * 30.4375);
}

/** Weighted quantile with linear interpolation between weighted midpoints. */
export function weightedQuantile(values: number[], weights: number[], q: number): number {
  const idx = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const total = idx.reduce((s, i) => s + weights[i], 0);
  if (idx.length === 1 || total <= 0) return values[idx[0]];
  let cum = 0;
  const pos: number[] = [];
  for (const i of idx) {
    pos.push((cum + weights[i] / 2) / total);
    cum += weights[i];
  }
  if (q <= pos[0]) return values[idx[0]];
  for (let k = 1; k < idx.length; k++) {
    if (q <= pos[k]) {
      const t = (q - pos[k - 1]) / (pos[k] - pos[k - 1] || 1);
      return values[idx[k - 1]] + t * (values[idx[k]] - values[idx[k - 1]]);
    }
  }
  return values[idx[idx.length - 1]];
}

const median = (xs: number[]) => weightedQuantile(xs, xs.map(() => 1), 0.5);

// ---------- normalisation ----------

function formatAddress(a: any): string {
  if (!a) return "";
  const street = [a.streetNumber, a.streetDirectionPrefix, a.streetName, a.streetSuffix, a.streetDirection]
    .filter(Boolean).join(" ");
  const unit = a.unitNumber ? ` #${a.unitNumber}` : "";
  return `${street}${unit}, ${a.city ?? ""} ${a.zip ?? ""}`.trim();
}

/** Map a Repliers listing (any status) to a Property. Returns null without coordinates. */
export function normalizeProperty(l: any): Property | null {
  const lat = num(l?.map?.latitude);
  const lng = num(l?.map?.longitude);
  if (lat === null || lng === null || (lat === 0 && lng === 0)) return null;
  const d = l.details ?? {};
  const raw = l.raw ?? {};
  const aboveGrade = num(raw.AboveGradeFinishedArea);
  const living = num(d.sqft);
  const sqft = aboveGrade && aboveGrade > 200 ? aboveGrade : living && living > 200 ? living : null;
  const full = num(raw.BathroomsFull);
  const half = num(raw.BathroomsHalf) ?? num(d.numBathroomsHalf) ?? 0;
  const baths = full !== null ? full + 0.5 * half : num(d.numBathrooms) !== null
    ? (num(d.numBathrooms) as number) + 0.5 * half : null;
  const basementYN = raw.BasementYN;
  const hasBasement = basementYN === "1" || basementYN === 1 ? true
    : basementYN === "0" || basementYN === 0 ? false
    : d.basement1 ? !/^none$/i.test(String(d.basement1)) : null;
  return {
    mlsNumber: l.mlsNumber ?? null,
    address: formatAddress(l.address),
    addressKey: l.address?.addressKey ?? null,
    zip: l.address?.zip ?? null,
    subdivision: (raw.SubdivisionName ?? l.address?.neighborhood ?? null) || null,
    lat, lng, sqft,
    beds: num(d.numBedrooms),
    baths,
    yearBuilt: num(d.yearBuilt),
    levels: raw.Levels ?? null,
    garageSpaces: num(raw.GarageSpaces) ?? num(d.numGarageSpaces),
    hasBasement,
    style: d.style ?? null,
    propertyType: d.propertyType ?? null,
    listPrice: num(l.listPrice),
    remarks: String(d.description ?? ""),
  };
}

export function normalizeSold(l: any): SoldComp | null {
  const base = normalizeProperty(l);
  const soldPrice = num(l?.soldPrice);
  if (!base || !soldPrice || soldPrice <= 0 || !l.soldDate) return null;
  if (l.lastStatus && l.lastStatus !== "Sld") return null;
  if (l.type && String(l.type).toLowerCase() !== "sale") return null;
  const raw = l.raw ?? {};
  return {
    ...base,
    soldPrice,
    concessions: Math.max(0, num(raw.ConcessionsAmount) ?? 0),
    contractDate: String(l.soldDate).slice(0, 10),
    closeDate: raw.CloseDate ? String(raw.CloseDate).slice(0, 10) : null,
    propertyCondition: raw.PropertyCondition ?? null,
    specialConditions: raw.SpecialListingConditions ?? null,
    buyerFinancing: raw.BuyerFinancing ? String(raw.BuyerFinancing).trim() : null,
    newConstruction: raw.NewConstructionYN === "1" || raw.NewConstructionYN === 1,
  };
}

// ---------- condition tiering ----------

const STRONG_RENO = /\b(renovat(ed|ion)|remodel(ed|led)?|rehabbed|gut rehab|fully rehab|complete(ly)? (rehab|updated|redone)|updated throughout|total(ly)? (rehab|updated|redone))\b/i;
const SOFT_POSITIVE: [RegExp, string][] = [
  [/\bupdated\b/i, "updated"],
  [/\b(brand )?new(er)? (kitchen|cabinets|counter ?tops?|appliances)\b/i, "new kitchen"],
  [/\b(brand )?new(er)? (roof|hvac|furnace|a\/?c|windows|electric(al)?|plumbing|water heater)\b/i, "new systems"],
  [/\b(brand )?new(er)? (floor(s|ing)?|carpet|paint|bath(room)?s?)\b/i, "new finishes"],
  [/\b(granite|quartz)\b/i, "stone counters"],
  [/\bstainless\b/i, "stainless"],
  [/\bmove[- ]?in[- ]?ready\b/i, "move-in ready"],
  [/\bturn[- ]?key\b/i, "turnkey"],
  [/\b(lvp|luxury vinyl)\b/i, "LVP"],
];
const NEGATIVE: [RegExp, number, string][] = [
  [/\b(needs?|needing|in need of) (some |a little |lots of |major |minor |your )?(work|tlc|updating|updates?|repairs?|rehab|renovation|attention|love)\b/i, 2, "needs work"],
  [/\btlc\b/i, 1.5, "TLC"],
  [/\bhandy ?man\b/i, 2, "handyman"],
  [/\bfixer\b/i, 2, "fixer"],
  [/\bcash only\b/i, 2, "cash only"],
  [/\b(rehab|renovation|investment|flip) (opportunity|project|candidate)\b/i, 2, "rehab opportunity"],
  [/\bbring your (own )?(contractor|vision|ideas|tools|imagination|hammer|finishing touches)\b/i, 2, "bring your vision"],
  [/\bsweat equity\b/i, 2, "sweat equity"],
  [/\b(fire damaged?|shell|gutted|condemned|uninhabitable)\b/i, 2.5, "shell/damage"],
  [/\binvestor'?s?\b/i, 1.5, "investor-targeted"],
  [/\b(sold|selling|sell|sells|conveyed|being sold|offered) (strictly )?(in )?(its |it's )?(current |present )?['"“]?as[- ]?is\b/i, 1, "sold as-is"],
  [/\bno (repairs|inspections?|warranties)\b|\bseller (will|to) (make|do|provide) no\b/i, 1, "no repairs"],
  [/\b(estate sale|probate|foreclos\w+|bank[- ]owned|reo|short sale|wholesale)\b/i, 1.5, "estate/REO"],
  [/\bpotential\b/i, 0.5, "\"potential\""],
];

/**
 * Classify the condition a property SOLD in, from MLS structured fields first
 * and listing remarks second. Deliberately price-blind so that price cannot
 * leak into which comps are called "renovated".
 */
export function assessCondition(c: SoldComp, flipUplift?: number | null): ConditionAssessment {
  let score = 0;
  const signals: string[] = [];
  const add = (delta: number, label: string) => {
    score += delta;
    signals.push(`${delta > 0 ? "+" : ""}${delta} ${label}`);
  };

  const pc = (c.propertyCondition ?? "").toLowerCase();
  const fixer = /fixer|needs|poor|tear/.test(pc);
  const updated = /updated|remodel|new construction|excellent/.test(pc);
  if (updated && !fixer) add(3, `MLS condition: ${c.propertyCondition}`);
  else if (fixer && !updated) add(-3, `MLS condition: ${c.propertyCondition}`);

  const slc = (c.specialConditions ?? "").toLowerCase();
  if (/auction|probate|real estate owned|reo|short sale|foreclos|bankruptcy|hud/.test(slc)) {
    add(-2, `special conditions: ${c.specialConditions}`);
  } else if (/as is/.test(slc)) add(-1, "listed as-is");

  const fin = (c.buyerFinancing ?? "").toLowerCase();
  if (fin === "cash") add(-0.75, "cash buyer");
  else if (fin === "fha" || fin === "va") add(0.75, `${c.buyerFinancing} financing (appraised/inspected)`);

  if (c.newConstruction) add(3, "new construction");

  const text = c.remarks;
  let pos = 0;
  const posHits: string[] = [];
  if (STRONG_RENO.test(text)) { pos += 2; posHits.push("renovated/remodeled"); }
  for (const [re, label] of SOFT_POSITIVE) if (re.test(text)) { pos += 0.75; posHits.push(label); }
  pos = Math.min(pos, 3);
  let neg = 0;
  const negHits: string[] = [];
  for (const [re, w, label] of NEGATIVE) if (re.test(text)) { neg += w; negHits.push(label); }
  neg = Math.min(neg, 4);
  if (pos) add(pos, `remarks: ${posHits.join(", ")}`);
  if (neg) add(-neg, `remarks: ${negHits.join(", ")}`);

  if (flipUplift && flipUplift >= 1.35) add(3, `resold at ${flipUplift.toFixed(2)}x a prior sale in the window (flip)`);

  const tier: ConditionTier = score >= 2 ? "renovated" : score <= -1.5 ? "distressed" : "average";
  return { tier, score: round(score, 0.25), signals };
}

/**
 * Flip detection from the pool itself (no extra API calls): the same address
 * sold earlier in the window for much less. Returns uplift ratio per mlsNumber
 * and the set of mlsNumbers that were the low "buy" leg.
 */
export function detectFlips(pool: SoldComp[]) {
  const byAddr = new Map<string, SoldComp[]>();
  for (const c of pool) {
    if (!c.addressKey) continue;
    (byAddr.get(c.addressKey) ?? byAddr.set(c.addressKey, []).get(c.addressKey)!).push(c);
  }
  const uplift = new Map<string, number>();
  const buyLegs = new Set<string>();
  for (const sales of byAddr.values()) {
    if (sales.length < 2) continue;
    sales.sort((a, b) => a.contractDate.localeCompare(b.contractDate));
    for (let i = 1; i < sales.length; i++) {
      const ratio = sales[i].soldPrice / sales[i - 1].soldPrice;
      if (ratio >= 1.35 && sales[i].mlsNumber && sales[i - 1].mlsNumber) {
        uplift.set(sales[i].mlsNumber!, ratio);
        buyLegs.add(sales[i - 1].mlsNumber!);
      }
    }
  }
  return { uplift, buyLegs };
}

// ---------- market trend ----------

/** OLS slope of ln($/sqft) on sale age, shrunk toward 0 and clamped. Fraction per month. */
export function estimateMonthlyTrend(points: { ageMonths: number; ppsf: number }[]): number {
  const pts = points.filter((p) => p.ppsf > 0 && Number.isFinite(p.ppsf));
  const n = pts.length;
  if (n < 25) return 0;
  const mx = pts.reduce((s, p) => s + p.ageMonths, 0) / n;
  const my = pts.reduce((s, p) => s + Math.log(p.ppsf), 0) / n;
  let sxy = 0, sxx = 0;
  for (const p of pts) {
    sxy += (p.ageMonths - mx) * (Math.log(p.ppsf) - my);
    sxx += (p.ageMonths - mx) ** 2;
  }
  if (sxx < 1e-9) return 0;
  // Older sales cheaper => negative slope vs age => positive appreciation.
  const appreciation = -(sxy / sxx);
  return clamp(appreciation * (n / (n + 60)), -0.01, 0.01);
}

// ---------- scoring ----------

interface Ctx {
  subject: Property;
  asOf: string;
  trend: number;
  beta: number;
  sqftTol: number;
}

/** Hard eligibility: returns a reason string when the sale cannot be a comp. */
export function ineligibleReason(c: SoldComp, ctx: Ctx, excluded: Set<string>): string | null {
  const s = ctx.subject;
  if (c.mlsNumber && excluded.has(c.mlsNumber)) return "excluded";
  if (s.addressKey && c.addressKey === s.addressKey) return "same address as subject";
  if (c.contractDate >= ctx.asOf.slice(0, 10)) return "sold after valuation date";
  if (!c.sqft) return "no square footage";
  if (s.sqft) {
    const ratio = c.sqft / s.sqft;
    if (ratio < 1 - ctx.sqftTol || ratio > 1 / (1 - ctx.sqftTol)) return "size outside band";
  }
  if (s.style && c.style && s.style !== c.style) return "different property style";
  if (s.beds !== null && c.beds !== null && Math.abs(s.beds - c.beds) > 2) return "bedroom count too different";
  if (s.yearBuilt && c.yearBuilt) {
    const bothPrewar = s.yearBuilt < 1945 && c.yearBuilt < 1945;
    if (!bothPrewar && Math.abs(s.yearBuilt - c.yearBuilt) > 40) return "different construction era";
  }
  if (c.soldPrice < 5000) return "non-market price";
  return null;
}

export function scoreComp(c: SoldComp, condition: ConditionAssessment, ctx: Ctx): ScoredComp {
  const s = ctx.subject;
  const distanceKm = haversineKm(s.lat, s.lng, c.lat, c.lng);
  const ageMonths = Math.max(0, monthsBetween(c.contractDate, ctx.asOf));

  // Penalties: each is "how many units unlike the subject"; similarity = 100*exp(-sum/3).
  const p: Record<string, number> = {};
  p.distance = distanceKm / 0.8; // 1 unit per half mile
  if (s.sqft && c.sqft) p.size = Math.abs(Math.log(c.sqft / s.sqft)) / 0.15;
  if (s.beds !== null && c.beds !== null) p.beds = 0.5 * Math.abs(s.beds - c.beds);
  if (s.baths !== null && c.baths !== null) p.baths = 0.5 * Math.abs(s.baths - c.baths);
  if (s.yearBuilt && c.yearBuilt) p.age = Math.min(2, Math.abs(s.yearBuilt - c.yearBuilt) / 25);
  p.recency = ageMonths / 6;
  if (s.levels && c.levels && s.levels !== c.levels) p.levels = 0.4;
  if (s.zip && c.zip && s.zip !== c.zip) p.zip = 0.5;
  if (s.subdivision && c.subdivision &&
    s.subdivision.toLowerCase() === c.subdivision.toLowerCase()) p.subdivision = -0.5;
  if (s.garageSpaces !== null && c.garageSpaces !== null &&
    (s.garageSpaces > 0) !== (c.garageSpaces > 0)) p.garage = 0.3;
  if (s.hasBasement !== null && c.hasBasement !== null && s.hasBasement !== c.hasBasement) p.basement = 0.4;
  const total = Math.max(0, Object.values(p).reduce((a, b) => a + b, 0));
  const similarity = 100 * Math.exp(-total / 3);

  // Adjust the comp's net price to what it would be as the subject, today.
  const netPrice = c.soldPrice - c.concessions;
  const adjustments: Adjustment[] = [];
  if (c.concessions > 0) adjustments.push({ label: `seller concessions -$${c.concessions.toLocaleString("en-US")}`, factor: netPrice / c.soldPrice });
  if (ctx.trend !== 0 && ageMonths > 0.5) {
    adjustments.push({ label: `market trend ${(ctx.trend * 100).toFixed(2)}%/mo x ${ageMonths.toFixed(1)} mo`, factor: Math.exp(ctx.trend * ageMonths) });
  }
  if (s.sqft && c.sqft && s.sqft !== c.sqft) {
    adjustments.push({ label: `size ${c.sqft} -> ${s.sqft} sqft`, factor: (s.sqft / c.sqft) ** ctx.beta });
  }
  if (s.baths !== null && c.baths !== null && s.baths !== c.baths) {
    adjustments.push({ label: `baths ${c.baths} -> ${s.baths}`, factor: 1 + 0.03 * clamp(s.baths - c.baths, -2, 2) });
  }
  if (s.garageSpaces !== null && c.garageSpaces !== null && (s.garageSpaces > 0) !== (c.garageSpaces > 0)) {
    adjustments.push({ label: s.garageSpaces > 0 ? "subject has garage" : "comp has garage", factor: s.garageSpaces > 0 ? 1.025 : 0.975 });
  }
  const physical = adjustments.slice(c.concessions > 0 ? 1 : 0).reduce((f, a) => f * a.factor, 1);
  const adjustedPrice = netPrice * clamp(physical, 0.75, 1.25);

  return {
    comp: c, condition, distanceKm, ageMonths, similarity, penalties: p,
    netPrice, adjustments, adjustedPrice,
    grossAdjustmentPct: Math.abs(adjustedPrice / netPrice - 1),
    selected: false,
  };
}

// ---------- valuation ----------

export interface ValuationInput {
  subject: Property;
  pool: SoldComp[];
  options?: ArvOptions;
}

export type Valuation = Omit<ArvResult, "diagnostics">;

export function valueFromPool({ subject, pool, options = {} }: ValuationInput): Valuation {
  const o = { ...DEFAULTS, ...options };
  const asOf = o.asOf ?? new Date().toISOString();
  const excluded = new Set([...(o.excludeMls ?? []), ...(subject.mlsNumber ? [subject.mlsNumber] : [])]);
  const notes: string[] = [];

  // De-duplicate by MLS number.
  const seen = new Set<string>();
  const unique = pool.filter((c) => {
    const k = c.mlsNumber ?? `${c.addressKey}|${c.contractDate}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const baseCtx: Ctx = { subject, asOf, trend: 0, beta: o.sizeElasticity, sqftTol: o.sqftTolerance };
  const eligible = unique.filter((c) => !ineligibleReason(c, baseCtx, excluded));
  const { uplift, buyLegs } = detectFlips(eligible);

  const assessed = eligible.map((c) => {
    const cond = assessCondition(c, c.mlsNumber ? uplift.get(c.mlsNumber) : null);
    if (c.mlsNumber && buyLegs.has(c.mlsNumber) && cond.tier !== "distressed") {
      return { c, cond: { tier: "distressed" as ConditionTier, score: Math.min(cond.score, -1.5), signals: [...cond.signals, "bought then resold much higher in the window (pre-rehab purchase)"] } };
    }
    return { c, cond };
  });

  const trend = !o.useTrend ? 0 : estimateMonthlyTrend(
    assessed.filter((a) => a.cond.tier !== "distressed").map((a) => ({
      ageMonths: Math.max(0, monthsBetween(a.c.contractDate, asOf)),
      ppsf: a.c.soldPrice / (a.c.sqft as number),
    })),
  );
  const ctx: Ctx = { ...baseCtx, trend };
  const scored = assessed.map((a) => scoreComp(a.c, a.cond, ctx)).sort((a, b) => b.similarity - a.similarity);

  const tierCounts: Record<ConditionTier, number> = { renovated: 0, average: 0, distressed: 0 };
  for (const s of scored) tierCounts[s.condition.tier]++;
  const nonDistressed = scored.filter((s) => s.condition.tier !== "distressed");
  const medianPpsf = nonDistressed.length
    ? median(nonDistressed.map((s) => s.comp.soldPrice / (s.comp.sqft as number))) : null;

  // Primary: the most similar RENOVATED sales.
  const MIN_SIM = 12;
  const renovated = scored.filter((s) => s.condition.tier === "renovated" && s.similarity >= MIN_SIM);
  let method: ArvMethod;
  let selected: ScoredComp[];
  let arv: number | null = null, low: number | null = null, high: number | null = null;

  if (!subject.sqft) notes.push("Subject square footage unknown — no size filter or size adjustment applied.");

  if (renovated.length >= o.minComps) {
    method = "renovated-comps";
    selected = renovated.slice(0, o.targetComps);
    const v = selected.map((s) => s.adjustedPrice);
    // Stronger renovation evidence (score 2 -> 4+) counts for more than a marginal call.
    const w = selected.map((s) => s.similarity * (o.conditionWeighting ? clamp(s.condition.score / 4, 0.5, 1) : 1));
    arv = weightedQuantile(v, w, 0.5);
    low = weightedQuantile(v, w, 0.2);
    high = weightedQuantile(v, w, 0.8);
  } else {
    // Fallback: too few sales evidenced as renovated. Take the upper part of the
    // distribution of the most similar non-distressed sales, on the premise that
    // a fully renovated house sells near the top of its micro-market.
    const candidates = nonDistressed.filter((s) => s.similarity >= MIN_SIM).slice(0, 12);
    if (candidates.length >= o.minComps) {
      method = "upper-quantile-fallback";
      const v = candidates.map((s) => s.adjustedPrice);
      const w = candidates.map((s) => s.similarity);
      arv = weightedQuantile(v, w, 0.8);
      low = weightedQuantile(v, w, 0.65);
      high = weightedQuantile(v, w, 0.95);
      // Show the comps that actually drive an upper-quantile figure: the top half by adjusted price.
      const cut = weightedQuantile(v, w, 0.5);
      selected = candidates.filter((s) => s.adjustedPrice >= cut);
      notes.push(`Only ${renovated.length} nearby sale(s) had evidence of renovation; ARV is the 80th percentile of ${candidates.length} similar non-distressed sales instead.`);
    } else {
      method = "insufficient-data";
      selected = [];
      notes.push("Fewer than the minimum number of usable sold comps were found.");
    }
  }
  for (const s of selected) s.selected = true;

  // Confidence heuristic.
  let confidence = 0;
  if (arv !== null && selected.length) {
    const n = selected.length;
    const spread = (high! - low!) / arv;
    const avgDist = selected.reduce((s, c) => s + c.distanceKm, 0) / n;
    const avgAdj = selected.reduce((s, c) => s + c.grossAdjustmentPct, 0) / n;
    const avgAge = selected.reduce((s, c) => s + c.ageMonths, 0) / n;
    confidence = 100;
    confidence -= method === "upper-quantile-fallback" ? 30 : 0;
    confidence -= Math.max(0, o.targetComps - n) * 6;
    confidence -= clamp((spread - 0.15) * 100, 0, 30);
    confidence -= clamp((avgDist - 0.6) * 15, 0, 20);
    confidence -= clamp((avgAdj - 0.05) * 150, 0, 15);
    confidence -= clamp((avgAge - 6) * 2, 0, 10);
    if (!subject.sqft) confidence -= 20;
    confidence = clamp(Math.round(confidence), 5, 95);
    if (spread > 0.3) notes.push(`Selected comps disagree widely (20th-80th percentile spread ${(spread * 100).toFixed(0)}% of ARV).`);
    if (avgDist > 1.2) notes.push(`Selected comps average ${(avgDist * 0.621).toFixed(1)} mi away — neighbourhood match is weak.`);
    if (medianPpsf && subject.sqft && arv / subject.sqft > medianPpsf * 2.2) {
      notes.push("ARV $/sqft is more than 2.2x the local median for similar homes — verify the renovated comps are truly comparable.");
    }
  }

  const others = scored.filter((s) => !s.selected).slice(0, 15);
  const radiusUsed = scored.length ? Math.max(...(selected.length ? selected : scored).map((s) => s.distanceKm)) : 0;

  return {
    subject, asOf, method,
    arv: arv === null ? null : round(arv, 500),
    arvLow: low === null ? null : round(low, 500),
    arvHigh: high === null ? null : round(high, 500),
    arvPerSqft: arv !== null && subject.sqft ? round(arv / subject.sqft, 1) : null,
    confidence, confidenceNotes: notes,
    selectedComps: selected, otherComps: others,
    market: {
      poolSize: unique.length, eligible: scored.length, tierCounts,
      medianPricePerSqft: medianPpsf === null ? null : round(medianPpsf, 1),
      monthlyTrend: trend, searchRadiusKmUsed: round(radiusUsed, 0.01),
    },
  };
}
