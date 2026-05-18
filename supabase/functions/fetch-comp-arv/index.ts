// Comp-based ARV endpoint.
// Calls fetch-mls-listings (mode=comps), then runs the comp-ARV engine server-side.
// Engine logic is duplicated here to keep the function self-contained.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type FinishTier = "rental" | "standard" | "premium";
type CompTier = "Strong" | "Good" | "Fallback" | "WeakSupport" | "Excluded";
type EligibilityStage = "strong" | "fallback" | "excluded";

interface Subject {
  zip: string;
  lat?: number;
  long?: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  style?: string;
  stories?: number;
  subdivision?: string;
  schoolDistrict?: string;
  garageBays?: number;
  basementFinishedSqft?: number;
  intendedFinish?: FinishTier;
}

interface RawComp {
  mls_listing_id: string;
  address: string;
  zip: string;
  lat?: number;
  long?: number;
  sold_price?: number;
  sold_date?: string;
  list_price?: number;
  days_on_market?: number;
  beds: number;
  baths: number;
  sqft: number;
  year_built?: number;
  style?: string;
  stories?: number;
  subdivision?: string;
  school_district?: string;
  garage_bays?: number;
  basement_finished_sqft?: number;
  last_status?: string;
  remarks?: string;
}

function haversineMi(a: { lat?: number; long?: number }, b: { lat?: number; long?: number }) {
  if (a.lat == null || a.long == null || b.lat == null || b.long == null) return Number.POSITIVE_INFINITY;
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.long - a.long);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const HARD = new Set(["reo", "foreclosure", "short sale", "auction"]);

function monthsAgo(iso?: string) {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function inferFinish(c: RawComp, neighborhoodMedianPerSf: number): FinishTier {
  const ppsf = c.sqft > 0 && c.sold_price ? c.sold_price / c.sqft : 0;
  if (!ppsf || !neighborhoodMedianPerSf) return "standard";
  const ratio = ppsf / neighborhoodMedianPerSf;
  if (ratio >= 1.15) return "premium";
  if (ratio <= 0.85) return "rental";
  return "standard";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const subject: Subject = body.subject;
    if (!subject?.zip || !subject?.sqft || subject.beds == null) {
      return new Response(JSON.stringify({ error: "subject {zip, sqft, beds} required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const compsResp = await fetch(`${supabaseUrl}/functions/v1/fetch-mls-listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ mode: "comps", subject }),
    });
    if (!compsResp.ok) {
      const t = await compsResp.text();
      return new Response(JSON.stringify({ error: "comps fetch failed", details: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const compsJson = await compsResp.json();
    const raw: RawComp[] = (compsJson.listings || []).filter((c: RawComp) => c.sold_price && c.sold_price > 0);

    // Neighborhood median $/sf for finish inference
    const ppsfs = raw.map((c) => (c.sqft > 0 && c.sold_price ? c.sold_price! / c.sqft : 0)).filter((v) => v > 0).sort((a, b) => a - b);
    const median = ppsfs.length ? ppsfs[Math.floor(ppsfs.length / 2)] : 0;

    // Map to engine's Comp shape
    const comps = raw.map((c) => ({
      id: c.mls_listing_id,
      address: c.address,
      zip: c.zip,
      lat: c.lat,
      long: c.long,
      soldPrice: c.sold_price ?? 0,
      soldDate: c.sold_date ?? "",
      listPrice: c.list_price,
      daysOnMarket: c.days_on_market,
      beds: c.beds,
      baths: c.baths,
      sqft: c.sqft,
      yearBuilt: c.year_built,
      style: c.style,
      stories: c.stories,
      subdivision: c.subdivision,
      schoolDistrict: c.school_district,
      garageBays: c.garage_bays,
      basementFinishedSqft: c.basement_finished_sqft,
      lastStatus: c.last_status,
      remarks: c.remarks,
      inferredFinish: inferFinish(c, median),
      finishConfirmed: false,
    }));

    // Inline engine call — duplicate of src/lib/compArv.ts buildCompArv
    const result = runEngine(subject, comps);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-comp-arv error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ---- engine (mirror of src/lib/compArv.ts) ----

const SOFT_PATTERNS = [/\bas[- ]?is\b/i, /\bestate sale\b/i, /\binvestor\b/i, /\bTLC\b/i, /\bcash only\b/i, /\bhandyman\b/i, /\bfixer\b/i];

function runEngine(subject: Subject, rawComps: any[]) {
  const intendedFinish: FinishTier = subject.intendedFinish ?? "standard";
  const scored: any[] = [];
  const excluded: any[] = [];

  for (const c of rawComps) {
    const distanceMi = haversineMi(subject, c);
    const elig = evalElig(subject, c, distanceMi);
    const reviewFlags = (c.remarks ? SOFT_PATTERNS.filter((p) => p.test(c.remarks)).map((p) => String(p)) : []);
    const adjustments = adjust(subject, c, intendedFinish);

    if (elig.stage === "excluded") {
      excluded.push({
        comp: c, distanceMi, stage: "excluded", tier: "Excluded" as CompTier,
        score: { total: 0 }, adjustments, fallbackStepsUsed: [], reviewFlags, excludeReason: elig.reason, included: false,
      });
      continue;
    }
    const sb = score(subject, c, distanceMi, elig);
    const tier = assignTier(elig.stage, sb.total, elig.steps.length);
    scored.push({
      comp: c, distanceMi, stage: elig.stage, tier, score: sb, adjustments,
      fallbackStepsUsed: elig.steps, reviewFlags,
      included: tier === "Strong" || tier === "Good" || tier === "Fallback",
    });
  }

  scored.sort((a, b) => b.score.total - a.score.total);
  const driver = pickDriverSet(scored);

  let arv: any = null;
  if (driver.set.length >= 3) {
    const values = driver.set.map((c: any) => c.adjustments.adjustedValue);
    const weights = driver.set.map((c: any) => (driver.mult[c.comp.id] ?? 1) * Math.max(1, c.score.total));
    const wSum = weights.reduce((a: number, b: number) => a + b, 0);
    const likely = values.reduce((acc: number, v: number, i: number) => acc + v * weights[i], 0) / wSum;
    const sorted = [...values].sort((a, b) => a - b);
    const pct = (p: number) => {
      const idx = (sorted.length - 1) * p;
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    arv = { conservative: Math.round(pct(0.25)), likely: Math.round(likely), aggressive: Math.round(pct(0.75)) };
  }

  // Confidence
  const drivers: any[] = [];
  let confidence = 100;
  const inc = driver.set.length;
  if (inc < 5) { const d = -5 * Math.max(0, 5 - inc); confidence += d; drivers.push({ label: `Only ${inc} comps in driver set`, delta: d }); }
  if (inc > 0) {
    const avg = driver.set.reduce((a: number, c: any) => a + c.score.total, 0) / inc;
    if (avg < 55) { confidence -= 30; drivers.push({ label: "Avg score <55", delta: -30 }); }
    else if (avg < 70) { confidence -= 15; drivers.push({ label: "Avg score <70", delta: -15 }); }
  }
  const districts = new Set(driver.set.map((c: any) => c.comp.schoolDistrict?.toLowerCase()).filter(Boolean));
  if (districts.size > 1) { confidence -= 10; drivers.push({ label: "Spans >1 school district", delta: -10 }); }
  const stepSet = new Set<string>();
  driver.set.forEach((c: any) => c.fallbackStepsUsed.forEach((s: string) => stepSet.add(s)));
  if (stepSet.size) { const d = -5 * stepSet.size; confidence += d; drivers.push({ label: `${stepSet.size} fallback expansion(s)`, delta: d }); }
  if (!subject.schoolDistrict) { confidence -= 5; drivers.push({ label: "Subject school district unknown", delta: -5 }); }
  if (driver.tier === "Fallback") { confidence = Math.min(confidence, 55); drivers.push({ label: "Driven by Fallback tier (cap 55)", delta: 0 }); }
  else if (driver.tier === "Good") { confidence = Math.min(confidence, 80); drivers.push({ label: "Driven by Good tier (cap 80)", delta: 0 }); }
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  const confidenceBand = confidence >= 85 ? "Strong" : confidence >= 70 ? "Reasonable" : confidence >= 50 ? "Use Caution" : "Weak Support";

  const tierCounts: Record<string, number> = { Strong: 0, Good: 0, Fallback: 0, WeakSupport: 0, Excluded: excluded.length };
  scored.forEach((c) => { tierCounts[c.tier]++; });

  return {
    subject, arv, confidence, confidenceBand, drivers,
    tierCounts, driverTier: driver.tier,
    comps: scored, excluded,
    fallbackUsed: [...stepSet].map((s) => ({ step: s, label: s })),
    reasons: arv ? [] : ["Fewer than 3 usable comps."],
  };
}

function evalElig(subject: Subject, c: any, distanceMi: number) {
  const steps: string[] = [];
  if (c.lastStatus && HARD.has(String(c.lastStatus).toLowerCase().trim())) {
    return { stage: "excluded" as const, steps: [], reason: `Distress: ${c.lastStatus}` };
  }
  if (distanceMi > 1.0) return { stage: "excluded" as const, steps: [], reason: ">1.0 mi" };
  const ageMo = monthsAgo(c.soldDate);
  if (ageMo > 12) return { stage: "excluded" as const, steps: [], reason: "Sale >12mo" };
  if (Math.abs(c.beds - subject.beds) > 1) return { stage: "excluded" as const, steps: [], reason: "Bed diff >1" };
  if (Math.abs(c.baths - subject.baths) > 1) return { stage: "excluded" as const, steps: [], reason: "Bath diff >1" };
  const sqftPct = subject.sqft > 0 ? Math.abs(c.sqft - subject.sqft) / subject.sqft : 1;
  if (sqftPct > 0.25) return { stage: "excluded" as const, steps: [], reason: "Sqft diff >25%" };

  const distOk = distanceMi <= 0.5;
  const recOk = ageMo <= 6;
  const bedOk = c.beds === subject.beds;
  const bathOk = c.baths === subject.baths;
  const styleOk = !subject.style || !c.style || c.style.toLowerCase() === subject.style.toLowerCase()
    || (subject.stories != null && c.stories === subject.stories);
  const schoolOk = !subject.schoolDistrict || !c.schoolDistrict
    || c.schoolDistrict.toLowerCase() === subject.schoolDistrict.toLowerCase();
  const subOk = !subject.subdivision || !c.subdivision
    || c.subdivision.toLowerCase() === subject.subdivision.toLowerCase();
  const tightSqft = subject.sqft > 0 && (Math.abs(c.sqft - subject.sqft) <= 200 || sqftPct <= 0.15);

  if (distOk && recOk && bedOk && bathOk && styleOk && schoolOk && subOk && tightSqft) {
    return { stage: "strong" as const, steps: [] };
  }
  if (!distOk && distanceMi <= 0.75) steps.push("distance_0_75");
  else if (!distOk) steps.push("distance_1_0");
  if (!subOk) steps.push("loosen_neighborhood");
  if (!bathOk) steps.push("bath_pm1");
  if (!bedOk) steps.push("bed_pm1");
  if (!tightSqft) steps.push("sqft_pm25");
  if (!recOk && ageMo <= 9) steps.push("recency_9mo");
  else if (!recOk) steps.push("recency_12mo");
  if (!styleOk) steps.push("cross_style");
  return { stage: "fallback" as const, steps };
}

function score(subject: Subject, c: any, distanceMi: number, elig: any) {
  const distance = Math.max(0, 18 * (1 - Math.min(1, distanceMi / 1.0)));
  const schoolDistrict = subject.schoolDistrict && c.schoolDistrict
    ? (c.schoolDistrict.toLowerCase() === subject.schoolDistrict.toLowerCase() ? 14 : 0) : 7;
  const subdivision = subject.subdivision && c.subdivision
    ? (c.subdivision.toLowerCase() === subject.subdivision.toLowerCase() ? 14 : 0) : 7;
  const bedDiff = Math.abs(c.beds - subject.beds);
  const beds = bedDiff === 0 ? 10 : bedDiff === 1 ? 4 : 0;
  const bathDiff = Math.abs(c.baths - subject.baths);
  const baths = bathDiff === 0 ? 10 : bathDiff <= 1 ? 3 : 0;
  const sqftPct = subject.sqft > 0 ? Math.abs(c.sqft - subject.sqft) / subject.sqft : 1;
  const sqft = Math.max(0, 9 * (1 - Math.min(1, sqftPct / 0.25)));
  const styleOk = !subject.style || !c.style || c.style.toLowerCase() === subject.style.toLowerCase()
    || (subject.stories != null && c.stories === subject.stories);
  const style = styleOk ? 9 : 0;
  const ageMo = monthsAgo(c.soldDate);
  const recency = Math.max(0, 8 * (1 - Math.min(1, ageMo / 12)));
  let condition = 3;
  if (subject.intendedFinish && c.inferredFinish) condition = subject.intendedFinish === c.inferredFinish ? 5 : 2;
  const garageDiff = Math.abs((c.garageBays ?? 0) - (subject.garageBays ?? 0));
  const utility = Math.max(0, 3 - garageDiff);
  let penalties = 0;
  if (subject.schoolDistrict && c.schoolDistrict && c.schoolDistrict.toLowerCase() !== subject.schoolDistrict.toLowerCase()) penalties += 15;
  if (!styleOk) penalties += 12;
  if (bathDiff >= 1) penalties += 10;
  if (bedDiff >= 1) penalties += 10;
  if (sqftPct > 0.20) penalties += 8;
  penalties += elig.steps.length * 5;
  if (!c.schoolDistrict) penalties += 5;
  if (!c.style) penalties += 5;
  if (!c.sqft) penalties += 5;
  const total = Math.max(0, distance + schoolDistrict + subdivision + beds + baths + sqft + style + recency + condition + utility - penalties);
  return { distance, schoolDistrict, subdivision, beds, baths, sqft, style, recency, condition, utility, penalties, total };
}

function assignTier(stage: EligibilityStage, score: number, fallbackCount: number): CompTier {
  if (score < 40) return "Excluded";
  if (stage === "strong" && score >= 80) return "Strong";
  if (stage === "strong" && score >= 65) return "Good";
  if (stage === "fallback" && score >= 80 && fallbackCount <= 1) return "Good";
  if (stage === "fallback" && score >= 55) return "Fallback";
  if (score >= 40) return "WeakSupport";
  return "Excluded";
}

const ADJ = {
  bed: 5000, bath: 4000, garagePerBay: 6000, basementPerSf: 25,
  timePctPerMo: 0.003, timePctCap: 0.06,
  finishPct: { rental: -0.10, standard: 0, premium: 0.08 } as Record<FinishTier, number>,
};

function adjust(subject: Subject, c: any, intendedFinish: FinishTier) {
  const compPerSf = c.sqft > 0 ? c.soldPrice / c.sqft : 0;
  const sqftDelta = subject.sqft - c.sqft;
  const sqftAdjRaw = sqftDelta * compPerSf;
  const cap = Math.abs(c.soldPrice) * 0.5;
  const sqft = Math.max(-cap, Math.min(cap, sqftAdjRaw));
  const beds = (subject.beds - c.beds) * ADJ.bed;
  const baths = (subject.baths - c.baths) * ADJ.bath;
  const garage = ((subject.garageBays ?? 0) - (c.garageBays ?? 0)) * ADJ.garagePerBay;
  const basement = ((subject.basementFinishedSqft ?? 0) - (c.basementFinishedSqft ?? 0)) * ADJ.basementPerSf;
  const ageMo = monthsAgo(c.soldDate);
  const time = c.soldPrice * Math.min(ADJ.timePctCap, ageMo * ADJ.timePctPerMo);
  const subjFinish = ADJ.finishPct[intendedFinish] ?? 0;
  const compFinish = c.inferredFinish ? (ADJ.finishPct[c.inferredFinish] ?? 0) : 0;
  const condition = c.soldPrice * (subjFinish - compFinish);
  const location = 0;
  const adjustedValue = Math.max(0, c.soldPrice + sqft + beds + baths + garage + basement + time + condition + location);
  const adjustedPerSf = subject.sqft > 0 ? adjustedValue / subject.sqft : 0;
  return { sqft, beds, baths, garage, basement, time, condition, location, adjustedValue, adjustedPerSf };
}

function pickDriverSet(scored: any[]) {
  const strong = scored.filter((c) => c.included && c.tier === "Strong");
  const good = scored.filter((c) => c.included && c.tier === "Good");
  const fallback = scored.filter((c) => c.included && c.tier === "Fallback");
  const mult: Record<string, number> = {};
  if (strong.length >= 3) { strong.forEach((c) => (mult[c.comp.id] = 1)); return { set: strong, tier: "Strong" as CompTier, mult }; }
  if (strong.length + good.length >= 3) {
    strong.forEach((c) => (mult[c.comp.id] = 2));
    good.forEach((c) => (mult[c.comp.id] = 1));
    return { set: [...strong, ...good], tier: (strong.length ? "Strong" : "Good") as CompTier, mult };
  }
  if (strong.length + good.length + fallback.length >= 3) {
    strong.forEach((c) => (mult[c.comp.id] = 2));
    good.forEach((c) => (mult[c.comp.id] = 1));
    fallback.forEach((c) => (mult[c.comp.id] = 0.5));
    return { set: [...strong, ...good, ...fallback], tier: "Fallback" as CompTier, mult };
  }
  return { set: [] as any[], tier: "Excluded" as CompTier, mult };
}
