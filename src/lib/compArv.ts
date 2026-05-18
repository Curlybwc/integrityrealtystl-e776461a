// Pure comp-ARV engine. Runs on both server (edge function) and client (local recompute).
import type {
  Comp,
  CompAdjustments,
  CompArvResult,
  CompTier,
  ConfidenceDriver,
  EligibilityStage,
  FallbackStep,
  FinishTier,
  LocalOverrides,
  ScoreBreakdown,
  ScoredComp,
  Subject,
} from "@/types/compArv";

// ---------- distance ----------
export function haversineMi(
  a: { lat?: number; long?: number },
  b: { lat?: number; long?: number },
): number {
  if (a.lat == null || a.long == null || b.lat == null || b.long == null) {
    return Number.POSITIVE_INFINITY;
  }
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.long - a.long);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ---------- distress / remarks ----------
const SOFT_REMARK_PATTERNS = [
  /\bas[- ]?is\b/i,
  /\bestate sale\b/i,
  /\binvestor\b/i,
  /\bTLC\b/i,
  /\bcash only\b/i,
  /\bhandyman\b/i,
  /\bfixer\b/i,
];

const HARD_DISTRESS_STATUSES = new Set([
  "reo",
  "foreclosure",
  "short sale",
  "auction",
]);

function detectSoftFlags(remarks?: string): string[] {
  if (!remarks) return [];
  const out: string[] = [];
  for (const p of SOFT_REMARK_PATTERNS) {
    const m = p.exec(remarks);
    if (m) out.push(m[0]);
  }
  return out;
}

function isHardDistress(comp: Comp): boolean {
  if (!comp.lastStatus) return false;
  return HARD_DISTRESS_STATUSES.has(comp.lastStatus.toLowerCase().trim());
}

// ---------- eligibility ----------

const STRONG_DISTANCE_MI = 0.5;
const MAX_DISTANCE_MI = 1.0;
const STRONG_RECENCY_DAYS = 183;
const MAX_RECENCY_DAYS = 365;

function monthsBetween(a: Date, b: Date): number {
  return Math.abs((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

interface Eligibility {
  stage: EligibilityStage;
  fallbackStepsUsed: FallbackStep["step"][];
  excludeReason?: string;
}

function evaluateEligibility(
  subject: Subject,
  comp: Comp,
  distanceMi: number,
): Eligibility {
  const steps: FallbackStep["step"][] = [];

  // Hard exclusions
  if (isHardDistress(comp)) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `Distress status: ${comp.lastStatus}` };
  }
  if (distanceMi > MAX_DISTANCE_MI) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `>1.0 mi (${distanceMi.toFixed(2)})` };
  }
  const soldDate = comp.soldDate ? new Date(comp.soldDate) : null;
  const ageDays = soldDate ? (Date.now() - soldDate.getTime()) / 86400000 : Number.POSITIVE_INFINITY;
  if (!soldDate || ageDays > MAX_RECENCY_DAYS) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `Sale >12 mo old` };
  }
  if (Math.abs(comp.beds - subject.beds) > 1) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `Bed diff >1` };
  }
  if (Math.abs(comp.baths - subject.baths) > 1) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `Bath diff >1` };
  }
  const sqftPct = subject.sqft > 0 ? Math.abs(comp.sqft - subject.sqft) / subject.sqft : 1;
  if (sqftPct > 0.25) {
    return { stage: "excluded", fallbackStepsUsed: [], excludeReason: `Sqft diff >25%` };
  }

  // Strong-pool checks
  const distOk = distanceMi <= STRONG_DISTANCE_MI;
  const recOk = ageDays <= STRONG_RECENCY_DAYS;
  const bedOk = comp.beds === subject.beds;
  const bathOk = comp.baths === subject.baths;
  const styleOk =
    !subject.style ||
    !comp.style ||
    comp.style.toLowerCase() === subject.style.toLowerCase() ||
    (subject.stories != null && comp.stories === subject.stories);
  const schoolOk =
    !subject.schoolDistrict ||
    !comp.schoolDistrict ||
    comp.schoolDistrict.toLowerCase() === subject.schoolDistrict.toLowerCase();
  const subOk =
    !subject.subdivision ||
    !comp.subdivision ||
    comp.subdivision.toLowerCase() === subject.subdivision.toLowerCase();
  const tightSqft =
    subject.sqft > 0 &&
    (Math.abs(comp.sqft - subject.sqft) <= 200 || sqftPct <= 0.15);

  if (distOk && recOk && bedOk && bathOk && styleOk && schoolOk && subOk && tightSqft) {
    return { stage: "strong", fallbackStepsUsed: [] };
  }

  // Fallback — record which relaxations were required
  if (!distOk && distanceMi <= 0.75) steps.push("distance_0_75");
  else if (!distOk) steps.push("distance_1_0");
  if (!subOk) steps.push("loosen_neighborhood");
  if (!bathOk) steps.push("bath_pm1");
  if (!bedOk) steps.push("bed_pm1");
  if (!tightSqft) steps.push("sqft_pm25");
  if (!recOk && ageDays <= 274) steps.push("recency_9mo");
  else if (!recOk) steps.push("recency_12mo");
  if (!styleOk) steps.push("cross_style");

  return { stage: "fallback", fallbackStepsUsed: steps };
}

// ---------- scoring ----------

function scoreComp(subject: Subject, comp: Comp, distanceMi: number, elig: Eligibility): ScoreBreakdown {
  // Distance: 18 max, linear to 1.0 mi
  const distance = Math.max(0, 18 * (1 - Math.min(1, distanceMi / 1.0)));

  // School district: 14 if same, 0 otherwise (penalty applied below)
  const schoolDistrict =
    subject.schoolDistrict && comp.schoolDistrict
      ? comp.schoolDistrict.toLowerCase() === subject.schoolDistrict.toLowerCase()
        ? 14
        : 0
      : 7;

  // Subdivision: 14 if same, partial if unknown
  const subdivision =
    subject.subdivision && comp.subdivision
      ? comp.subdivision.toLowerCase() === subject.subdivision.toLowerCase()
        ? 14
        : 0
      : 7;

  // Beds: 10 exact, 4 ±1
  const bedDiff = Math.abs(comp.beds - subject.beds);
  const beds = bedDiff === 0 ? 10 : bedDiff === 1 ? 4 : 0;

  // Baths: 10 exact, 3 ±1
  const bathDiff = Math.abs(comp.baths - subject.baths);
  const baths = bathDiff === 0 ? 10 : bathDiff <= 1 ? 3 : 0;

  // Sqft: 9 with band
  const sqftPct = subject.sqft > 0 ? Math.abs(comp.sqft - subject.sqft) / subject.sqft : 1;
  const sqft = Math.max(0, 9 * (1 - Math.min(1, sqftPct / 0.25)));

  // Style: 9 if same, 0 cross
  const styleOk =
    !subject.style ||
    !comp.style ||
    comp.style.toLowerCase() === subject.style.toLowerCase() ||
    (subject.stories != null && comp.stories === subject.stories);
  const style = styleOk ? 9 : 0;

  // Recency: 8, linear to 12 months
  const ageMo = comp.soldDate ? monthsBetween(new Date(comp.soldDate), new Date()) : 12;
  const recency = Math.max(0, 8 * (1 - Math.min(1, ageMo / 12)));

  // Condition similarity: 5 default
  let condition = 3;
  if (subject.intendedFinish && comp.inferredFinish) {
    condition = subject.intendedFinish === comp.inferredFinish ? 5 : 2;
  }

  // Utility (basement/garage): 3
  const garageDiff = Math.abs((comp.garageBays ?? 0) - (subject.garageBays ?? 0));
  const utility = Math.max(0, 3 - garageDiff);

  // Penalties
  let penalties = 0;
  if (subject.schoolDistrict && comp.schoolDistrict &&
      comp.schoolDistrict.toLowerCase() !== subject.schoolDistrict.toLowerCase()) penalties += 15;
  if (!styleOk) penalties += 12;
  if (bathDiff >= 1) penalties += 10;
  if (bedDiff >= 1) penalties += 10;
  if (sqftPct > 0.20) penalties += 8;
  penalties += elig.fallbackStepsUsed.length * 5;
  if (!comp.schoolDistrict) penalties += 5;
  if (!comp.style) penalties += 5;
  if (!comp.sqft) penalties += 5;

  const total = Math.max(
    0,
    distance + schoolDistrict + subdivision + beds + baths + sqft + style + recency + condition + utility - penalties,
  );

  return { distance, schoolDistrict, subdivision, beds, baths, sqft, style, recency, condition, utility, penalties, total };
}

function assignTier(stage: EligibilityStage, score: number, fallbackCount: number, hardExclude: boolean): CompTier {
  if (hardExclude) return "Excluded";
  if (score < 40) return "Excluded";
  if (stage === "strong" && score >= 80) return "Strong";
  if (stage === "strong" && score >= 65) return "Good";
  if (stage === "fallback" && score >= 80 && fallbackCount <= 1) return "Good";
  if (stage === "fallback" && score >= 55) return "Fallback";
  if (score >= 40) return "WeakSupport";
  return "Excluded";
}

// ---------- adjustments ----------

const ADJ = {
  bed: 5000,
  bath: 4000,
  garagePerBay: 6000,
  basementPerSf: 25,
  timePctPerMo: 0.003,
  timePctCap: 0.06,
  finishPct: { rental: -0.10, standard: 0, premium: 0.08 } as Record<FinishTier, number>,
};

function computeAdjustments(
  subject: Subject,
  comp: Comp,
  intendedFinish: FinishTier,
  compFinish: FinishTier | undefined,
  locationPct: number,
): CompAdjustments {
  const compPerSf = comp.sqft > 0 ? comp.soldPrice / comp.sqft : 0;
  // Cap sqft adjustment to 50% of comp $/sf delta
  const sqftDelta = subject.sqft - comp.sqft;
  const sqftAdjRaw = sqftDelta * compPerSf;
  const cap = Math.abs(comp.soldPrice) * 0.5;
  const sqft = Math.max(-cap, Math.min(cap, sqftAdjRaw));

  const beds = (subject.beds - comp.beds) * ADJ.bed;
  const baths = (subject.baths - comp.baths) * ADJ.bath;
  const garage = ((subject.garageBays ?? 0) - (comp.garageBays ?? 0)) * ADJ.garagePerBay;
  const basement = ((subject.basementFinishedSqft ?? 0) - (comp.basementFinishedSqft ?? 0)) * ADJ.basementPerSf;

  // Time adjustment relative to today
  const ageMo = comp.soldDate ? monthsBetween(new Date(comp.soldDate), new Date()) : 0;
  const timePct = Math.min(ADJ.timePctCap, ageMo * ADJ.timePctPerMo);
  const time = comp.soldPrice * timePct;

  // Condition: subject intended finish vs comp's finish
  const subjFinishPct = ADJ.finishPct[intendedFinish] ?? 0;
  const compFinishPct = compFinish ? (ADJ.finishPct[compFinish] ?? 0) : 0;
  const condition = comp.soldPrice * (subjFinishPct - compFinishPct);

  const location = comp.soldPrice * locationPct;

  const adjustedValue = Math.max(0, comp.soldPrice + sqft + beds + baths + garage + basement + time + condition + location);
  const adjustedPerSf = subject.sqft > 0 ? adjustedValue / subject.sqft : 0;

  return { sqft, beds, baths, garage, basement, time, condition, location, adjustedValue, adjustedPerSf };
}

// ---------- tier-first ARV ----------

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function selectDriverSet(comps: ScoredComp[]): { set: ScoredComp[]; tier: CompTier; multipliers: Map<string, number> } {
  const strong = comps.filter((c) => c.included && c.tier === "Strong");
  const good = comps.filter((c) => c.included && c.tier === "Good");
  const fallback = comps.filter((c) => c.included && c.tier === "Fallback");
  const mult = new Map<string, number>();

  if (strong.length >= 3) {
    strong.forEach((c) => mult.set(c.comp.id, 1));
    return { set: strong, tier: "Strong", multipliers: mult };
  }
  if (strong.length + good.length >= 3) {
    strong.forEach((c) => mult.set(c.comp.id, 2));
    good.forEach((c) => mult.set(c.comp.id, 1));
    return { set: [...strong, ...good], tier: strong.length ? "Strong" : "Good", multipliers: mult };
  }
  if (strong.length + good.length + fallback.length >= 3) {
    strong.forEach((c) => mult.set(c.comp.id, 2));
    good.forEach((c) => mult.set(c.comp.id, 1));
    fallback.forEach((c) => mult.set(c.comp.id, 0.5));
    return { set: [...strong, ...good, ...fallback], tier: "Fallback", multipliers: mult };
  }
  return { set: [], tier: "Excluded", multipliers: mult };
}

// ---------- main entry ----------

export function buildCompArv(
  subject: Subject,
  rawComps: Comp[],
  overrides: LocalOverrides = {},
): CompArvResult {
  const intendedFinish: FinishTier = overrides.intendedFinish ?? subject.intendedFinish ?? "standard";
  const locationPct = overrides.locationAdjustmentPct ?? 0;

  const scored: ScoredComp[] = [];
  const excluded: ScoredComp[] = [];

  for (const c of rawComps) {
    const distanceMi = haversineMi(subject, c);
    const elig = evaluateEligibility(subject, c, distanceMi);
    const reviewFlags = detectSoftFlags(c.remarks);
    const compFinish = overrides.finishByComp?.[c.id] ?? c.inferredFinish;
    const adjustments = computeAdjustments(subject, c, intendedFinish, compFinish, locationPct);

    if (elig.stage === "excluded") {
      const sb = scoreComp(subject, c, distanceMi, { stage: "fallback", fallbackStepsUsed: [] });
      excluded.push({
        comp: c,
        distanceMi,
        stage: "excluded",
        tier: "Excluded",
        score: sb,
        adjustments,
        fallbackStepsUsed: [],
        reviewFlags,
        excludeReason: elig.excludeReason,
        included: false,
      });
      continue;
    }

    const sb = scoreComp(subject, c, distanceMi, elig);
    const tier = assignTier(elig.stage, sb.total, elig.fallbackStepsUsed.length, false);
    const userInclude = overrides.includeIds?.[c.id];

    scored.push({
      comp: c,
      distanceMi,
      stage: elig.stage,
      tier,
      score: sb,
      adjustments,
      fallbackStepsUsed: elig.fallbackStepsUsed,
      reviewFlags,
      included: userInclude !== undefined ? userInclude : tier === "Strong" || tier === "Good" || tier === "Fallback",
    });
  }

  // Sort included comps by score desc
  scored.sort((a, b) => b.score.total - a.score.total);

  // Pick driver tier set
  const { set: driverSet, tier: driverTier, multipliers } = selectDriverSet(scored);

  let arv: CompArvResult["arv"] = null;
  if (driverSet.length >= 3) {
    const values = driverSet.map((c) => c.adjustments.adjustedValue);
    const weights = driverSet.map((c) => (multipliers.get(c.comp.id) ?? 1) * Math.max(1, c.score.total));
    const wSum = weights.reduce((a, b) => a + b, 0);
    const likely = values.reduce((acc, v, i) => acc + v * weights[i], 0) / wSum;
    const conservative = percentile(values, 0.25);
    const aggressive = percentile(values, 0.75);
    arv = { conservative: Math.round(conservative), likely: Math.round(likely), aggressive: Math.round(aggressive) };
  }

  // Tier counts
  const tierCounts: Record<CompTier, number> = {
    Strong: 0, Good: 0, Fallback: 0, WeakSupport: 0, Excluded: 0,
  };
  scored.forEach((c) => { tierCounts[c.tier]++; });
  excluded.forEach(() => { tierCounts.Excluded++; });

  // Fallback steps aggregate
  const stepLabels: Record<FallbackStep["step"], string> = {
    distance_0_75: "Expanded radius to 0.75 mi",
    distance_1_0: "Expanded radius to 1.0 mi",
    loosen_neighborhood: "Loosened neighborhood match",
    bath_pm1: "Allowed ±1 bathroom",
    bed_pm1: "Allowed ±1 bedroom",
    sqft_pm25: "Allowed ±25% sqft",
    recency_9mo: "Extended recency to 9 months",
    recency_12mo: "Extended recency to 12 months",
    cross_style: "Allowed cross-style",
  };
  const stepSet = new Set<FallbackStep["step"]>();
  driverSet.forEach((c) => c.fallbackStepsUsed.forEach((s) => stepSet.add(s)));
  const fallbackUsed: FallbackStep[] = [...stepSet].map((s) => ({ step: s, label: stepLabels[s] }));

  // Confidence
  const drivers: ConfidenceDriver[] = [];
  let confidence = 100;

  const includedCount = driverSet.length;
  if (includedCount < 5) {
    const d = -5 * Math.max(0, 5 - includedCount);
    confidence += d;
    drivers.push({ label: `Only ${includedCount} comps in driver set`, delta: d });
  }
  if (includedCount > 0) {
    const avg = driverSet.reduce((a, c) => a + c.score.total, 0) / includedCount;
    if (avg < 55) { confidence -= 30; drivers.push({ label: "Avg comp score <55", delta: -30 }); }
    else if (avg < 70) { confidence -= 15; drivers.push({ label: "Avg comp score <70", delta: -15 }); }
  }
  const districts = new Set(driverSet.map((c) => c.comp.schoolDistrict?.toLowerCase()).filter(Boolean));
  if (districts.size > 1) { confidence -= 10; drivers.push({ label: "Spans >1 school district", delta: -10 }); }
  if (includedCount > 0 && arv) {
    const vals = driverSet.map((c) => c.adjustments.adjustedValue);
    const spread = (Math.max(...vals) - Math.min(...vals)) / arv.likely;
    if (spread > 0.20) { confidence -= 10; drivers.push({ label: "Adjusted-value spread >20%", delta: -10 }); }
  }
  if (fallbackUsed.length) {
    const d = -5 * fallbackUsed.length;
    confidence += d;
    drivers.push({ label: `${fallbackUsed.length} fallback expansion(s)`, delta: d });
  }
  if (!subject.schoolDistrict) { confidence -= 5; drivers.push({ label: "Subject school district unknown", delta: -5 }); }
  // Finish certainty weak
  const inferredCount = driverSet.filter((c) => !c.comp.finishConfirmed).length;
  if (driverSet.length > 0 && inferredCount / driverSet.length >= 0.5) {
    confidence -= 10;
    drivers.push({ label: "Finish certainty weak", delta: -10 });
  }
  // Tier floor caps
  if (driverTier === "Fallback") {
    confidence = Math.min(confidence, 55);
    drivers.push({ label: "Driven by Fallback tier (cap 55)", delta: 0 });
  } else if (driverTier === "Good") {
    confidence = Math.min(confidence, 80);
    drivers.push({ label: "Driven by Good tier (cap 80)", delta: 0 });
  }
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  const confidenceBand: CompArvResult["confidenceBand"] =
    confidence >= 85 ? "Strong" : confidence >= 70 ? "Reasonable" : confidence >= 50 ? "Use Caution" : "Weak Support";

  const reasons: string[] = [];
  if (!arv) reasons.push("Fewer than 3 usable comps — falling back to heuristic ARV.");
  if (driverTier === "Strong") reasons.push("ARV driven by Strong tier only.");
  else if (driverTier === "Good") reasons.push("ARV driven by Strong + Good tier.");
  else if (driverTier === "Fallback") reasons.push("ARV required Fallback tier comps.");

  return {
    subject,
    arv,
    confidence,
    confidenceBand,
    drivers,
    tierCounts,
    driverTier,
    comps: scored,
    excluded,
    fallbackUsed,
    reasons,
  };
}

// Convenience for clients: re-run on local overrides without re-fetching comps
export function recomputeWithOverrides(
  result: CompArvResult,
  overrides: LocalOverrides,
): CompArvResult {
  const allComps = [...result.comps, ...result.excluded].map((s) => s.comp);
  return buildCompArv(result.subject, allComps, overrides);
}
