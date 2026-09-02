import type { CompArvResult, CompTier, ScoredComp } from "@/types/compArv";

export interface CompEvidenceRow {
  comp: ScoredComp;
  weight: number;
  weightPct: number;
  influenceValue: number;
  relevanceReasons: string[];
  caveats: string[];
}

function driverSet(result: CompArvResult): { comps: ScoredComp[]; multipliers: Map<string, number> } {
  const strong = result.comps.filter((c) => c.included && c.tier === "Strong");
  const good = result.comps.filter((c) => c.included && c.tier === "Good");
  const fallback = result.comps.filter((c) => c.included && c.tier === "Fallback");
  const multipliers = new Map<string, number>();

  if (strong.length >= 3) {
    strong.forEach((c) => multipliers.set(c.comp.id, 1));
    return { comps: strong, multipliers };
  }
  if (strong.length + good.length >= 3) {
    strong.forEach((c) => multipliers.set(c.comp.id, 2));
    good.forEach((c) => multipliers.set(c.comp.id, 1));
    return { comps: [...strong, ...good], multipliers };
  }
  if (strong.length + good.length + fallback.length >= 3) {
    strong.forEach((c) => multipliers.set(c.comp.id, 2));
    good.forEach((c) => multipliers.set(c.comp.id, 1));
    fallback.forEach((c) => multipliers.set(c.comp.id, 0.5));
    return { comps: [...strong, ...good, ...fallback], multipliers };
  }
  return { comps: [], multipliers };
}

function relevanceReasons(c: ScoredComp): string[] {
  const reasons: string[] = [];
  if (c.distanceMi !== Number.POSITIVE_INFINITY) reasons.push(`${c.distanceMi.toFixed(2)} mi from subject`);
  if (c.score.schoolDistrict > 7) reasons.push("same school district");
  if (c.score.subdivision > 7) reasons.push("same subdivision/neighborhood");
  if (c.score.beds >= 10) reasons.push("matching bedroom count");
  if (c.score.baths >= 10) reasons.push("matching bathroom count");
  if (c.score.sqft >= 7) reasons.push("similar finished square footage");
  if (c.score.style >= 9) reasons.push("similar style/story profile");
  if (c.score.recency >= 6) reasons.push("recent sale");
  if (c.score.condition >= 5) reasons.push("similar finish/condition");
  return reasons;
}

function caveats(c: ScoredComp): string[] {
  const out: string[] = [];
  if (c.fallbackStepsUsed.length) out.push(`Fallback used: ${c.fallbackStepsUsed.join(", ")}`);
  if (c.reviewFlags.length) out.push(`Remarks need review: ${c.reviewFlags.join(", ")}`);
  if (c.score.penalties > 0) out.push(`${Math.round(c.score.penalties)} scoring penalty points`);
  if (!c.comp.schoolDistrict) out.push("school district missing from comp data");
  if (!c.comp.sqft) out.push("finished square footage missing from comp data");
  if (c.excludeReason) out.push(c.excludeReason);
  return out;
}

export function buildCompEvidence(result: CompArvResult): CompEvidenceRow[] {
  const { comps, multipliers } = driverSet(result);
  const rawWeights = comps.map((c) => Math.max(1, c.score.total) * (multipliers.get(c.comp.id) ?? 1));
  const sum = rawWeights.reduce((a, b) => a + b, 0);

  return comps.map((comp, i) => {
    const weight = sum > 0 ? rawWeights[i] / sum : 0;
    return {
      comp,
      weight,
      weightPct: weight * 100,
      influenceValue: comp.adjustments.adjustedValue * weight,
      relevanceReasons: relevanceReasons(comp),
      caveats: caveats(comp),
    };
  });
}

export function explainTier(tier: CompTier): string {
  switch (tier) {
    case "Strong": return "Primary supporting comp";
    case "Good": return "Good supporting comp";
    case "Fallback": return "Used because stronger comp support was insufficient";
    case "WeakSupport": return "Reference only; not normally used in ARV";
    case "Excluded": return "Excluded from ARV";
  }
}
