/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Clean-room ARV method — orchestrator: fetch nearest sold records from
// Repliers page by page, stop as soon as the engine has enough renovated comps.

import { doctrineRadiusKm, valueByDoctrine } from "./doctrine.ts";
import type { DoctrineOptions, DoctrineValuation } from "./doctrine.ts";
import { DEFAULTS, haversineKm, normalizeProperty, normalizeSold, valueFromPool } from "./engine.ts";
import { RepliersClient } from "./repliers.ts";
import type { ArvOptions, ArvResult, Property, SoldComp } from "./types.ts";

export * from "./types.ts";
export { RepliersClient } from "./repliers.ts";
export { normalizeProperty, valueFromPool } from "./engine.ts";
export { valueByDoctrine } from "./doctrine.ts";
export type { DoctrineComp, DoctrineOptions, DoctrineValuation, FinishGrade, GradeReads, SupportedLevel } from "./doctrine.ts";

export interface SubjectInput {
  /** Look the subject up in Repliers (active or off-market listing). */
  mlsNumber?: string;
  /** ...or describe it directly. `overrides` also patches a looked-up subject. */
  overrides?: Partial<Property>;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export async function resolveSubject(client: RepliersClient, input: SubjectInput): Promise<Property> {
  let subject: Property | null = null;
  if (input.mlsNumber) {
    const listing = await client.getListing(input.mlsNumber);
    if (!listing) throw new Error(`Listing ${input.mlsNumber} not found in Repliers`);
    subject = normalizeProperty(listing);
    if (!subject) throw new Error(`Listing ${input.mlsNumber} has no coordinates`);
  }
  const merged = {
    mlsNumber: null, address: "", addressKey: null, zip: null, subdivision: null,
    sqft: null, beds: null, baths: null, yearBuilt: null, levels: null, garageSpaces: null,
    hasBasement: null, style: "Single Family Residence", propertyType: "Residential",
    listPrice: null, remarks: "",
    ...(subject ?? {}), ...(input.overrides ?? {}),
  } as Property;
  if (!Number.isFinite(merged.lat) || !Number.isFinite(merged.lng)) {
    throw new Error("Subject needs an mlsNumber or lat/lng");
  }
  return merged;
}

export async function estimateArv(
  client: RepliersClient,
  input: SubjectInput,
  options: ArvOptions = {},
): Promise<ArvResult> {
  const o = { ...DEFAULTS, ...options };
  const subject = await resolveSubject(client, input);
  const asOf = o.asOf ?? new Date().toISOString();
  const asOfDate = new Date(asOf);
  const minSold = new Date(asOfDate);
  minSold.setUTCMonth(minSold.getUTCMonth() - o.lookbackMonths);
  const maxSold = new Date(asOfDate.getTime() - 86_400_000);

  const warnings: string[] = [];
  const pool: SoldComp[] = [];
  let pagesFetched = 0;
  let totalMatches = 0;
  // Server-side band is a little wider than the engine's, because the server
  // filters on living area while the engine prefers above-grade area.
  const band = o.sqftTolerance + 0.1;

  for (let page = 1; page <= o.maxPages; page++) {
    const res = await client.searchSold({
      lat: subject.lat, lng: subject.lng, radiusKm: o.maxRadiusKm,
      minSoldDate: isoDay(minSold), maxSoldDate: isoDay(maxSold),
      minSqft: subject.sqft ? subject.sqft * (1 - band) : undefined,
      maxSqft: subject.sqft ? subject.sqft / (1 - band) : undefined,
      style: subject.style, propertyType: subject.propertyType,
      pageNum: page,
    });
    pagesFetched++;
    totalMatches = res.count;
    if (res.unrecognizedParams.length) warnings.push(`Repliers ignored params: ${res.unrecognizedParams.join(", ")}`);
    for (const l of res.listings) {
      const c = normalizeSold(l);
      if (c) pool.push(c);
    }
    if (page >= res.numPages) break;
    // Nearest-first paging: stop once the closest N records already contain enough renovated comps.
    const v = valueFromPool({ subject, pool, options: { ...options, asOf } });
    if (v.method === "renovated-comps" && v.selectedComps.length >= o.targetComps) break;
  }

  const valuation = valueFromPool({ subject, pool, options: { ...options, asOf } });
  if (totalMatches > pool.length && valuation.method !== "renovated-comps") {
    warnings.push(`Only the nearest ${pool.length} of ${totalMatches} matching sales were examined (page cap).`);
  }
  return {
    ...valuation,
    diagnostics: { apiCalls: pagesFetched + (input.mlsNumber ? 1 : 0), pagesFetched, totalMatches, warnings },
  };
}

/** Value many subjects with bounded concurrency (shares the client's request cache). */
export async function estimateArvBatch(
  client: RepliersClient,
  inputs: SubjectInput[],
  options: ArvOptions = {},
  concurrency = 4,
): Promise<(ArvResult | { error: string; input: SubjectInput })[]> {
  const out: (ArvResult | { error: string; input: SubjectInput })[] = new Array(inputs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (next < inputs.length) {
      const i = next++;
      try {
        out[i] = await estimateArv(client, inputs[i], options);
      } catch (e) {
        out[i] = { error: e instanceof Error ? e.message : String(e), input: inputs[i] };
      }
    }
  }));
  return out;
}

// ---------------------------------------------------------------------------
// v2: same retrieval, market-model ("doctrine") valuation layer.
// ---------------------------------------------------------------------------

export interface DoctrineResult extends DoctrineValuation {
  diagnostics: { apiCalls: number; pagesFetched: number; totalMatches: number; warnings: string[] };
}

export type RetrievalBasis =
  /** v4 (default): radius + same beds, NO server-side sqft cap; ±200 above-grade sq ft is tested client-side. */
  | "above-grade-client"
  /** v3 and earlier: 3.2 km radius with a ±40% server-side band on living area (which includes finished basement). Kept only so the defect fix can be ablated. */
  | "living-area-band";

export interface PoolFetch {
  /** Raw Repliers records (trimmed field set), nearest first. */
  listings: any[];
  pagesFetched: number;
  totalMatches: number;
  warnings: string[];
}

/**
 * Pull the sold records the comp ladder can use around a subject.
 *
 * Defect fixed in v4: the old query capped size server-side on Repliers'
 * living-area figure, which counts finished basement, while the ladder tests
 * above-grade area — so qualifying comps with finished basements never
 * arrived. The default basis now pulls by radius (the widest the ladder can
 * reach) and bedroom count only.
 */
export async function fetchDoctrinePool(
  client: RepliersClient,
  subject: Property,
  asOf: string,
  basis: RetrievalBasis = "above-grade-client",
): Promise<PoolFetch> {
  const asOfDate = new Date(asOf);
  const minSold = new Date(asOfDate);
  minSold.setUTCMonth(minSold.getUTCMonth() - DEFAULTS.lookbackMonths);
  const maxSold = new Date(asOfDate.getTime() - 86_400_000);
  const needKm = doctrineRadiusKm(subject);
  const legacy = basis === "living-area-band";
  const band = DEFAULTS.sqftTolerance + 0.1;
  const maxPages = legacy ? DEFAULTS.maxPages : 6;

  const out: PoolFetch = { listings: [], pagesFetched: 0, totalMatches: 0, warnings: [] };
  let reached = false;
  for (let page = 1; page <= maxPages; page++) {
    const res = await client.searchSold({
      lat: subject.lat, lng: subject.lng,
      radiusKm: legacy ? DEFAULTS.maxRadiusKm : Math.round(needKm * 1.03 * 1000) / 1000,
      minSoldDate: isoDay(minSold), maxSoldDate: isoDay(maxSold),
      minSqft: legacy && subject.sqft ? subject.sqft * (1 - band) : undefined,
      maxSqft: legacy && subject.sqft ? subject.sqft / (1 - band) : undefined,
      minBedrooms: !legacy && subject.beds !== null ? subject.beds : undefined,
      maxBedrooms: !legacy && subject.beds !== null ? subject.beds : undefined,
      style: subject.style, propertyType: subject.propertyType,
      pageNum: page,
    });
    out.pagesFetched++;
    out.totalMatches = res.count;
    if (res.unrecognizedParams.length) out.warnings.push(`Repliers ignored params: ${res.unrecognizedParams.join(", ")}`);
    out.listings.push(...res.listings);
    const last = res.listings[res.listings.length - 1];
    const lastKm = last ? haversineKm(subject.lat, subject.lng, Number(last.map?.latitude), Number(last.map?.longitude)) : Infinity;
    if (page >= res.numPages || (legacy && lastKm > needKm)) {
      reached = true;
      break;
    }
  }
  if (!reached) out.warnings.push(`Page cap hit before the search covered ${(needKm / 1.609344).toFixed(2)} mi; some comps inside the radius were not examined.`);
  // Guard for the raw/normalized trap: every record must carry both.
  const lacking = out.listings.filter((l) => !(l?.soldPrice && l?.raw && typeof l.raw === "object" && l?.details)).length;
  if (lacking) out.warnings.push(`${lacking} of ${out.listings.length} records lack normalized or raw fields.`);
  return out;
}

export async function estimateArvV2(
  client: RepliersClient,
  input: SubjectInput,
  options: DoctrineOptions & { retrievalBasis?: RetrievalBasis } = {},
): Promise<DoctrineResult> {
  const subject = await resolveSubject(client, input);
  const asOf = options.asOf ?? new Date().toISOString();
  const { retrievalBasis, ...doctrineOptions } = options;
  const fetched = await fetchDoctrinePool(client, subject, asOf, retrievalBasis);
  const pool = fetched.listings.map(normalizeSold).filter((c): c is SoldComp => !!c);
  const valuation = valueByDoctrine({ subject, pool, options: { ...doctrineOptions, asOf } });
  return {
    ...valuation,
    diagnostics: {
      apiCalls: fetched.pagesFetched + (input.mlsNumber ? 1 : 0), pagesFetched: fetched.pagesFetched,
      totalMatches: fetched.totalMatches, warnings: fetched.warnings,
    },
  };
}

/** Value many subjects with v2, bounded concurrency. */
export async function estimateArvV2Batch(
  client: RepliersClient,
  inputs: SubjectInput[],
  options: DoctrineOptions & { retrievalBasis?: RetrievalBasis } = {},
  concurrency = 4,
): Promise<(DoctrineResult | { error: string; input: SubjectInput })[]> {
  const out: (DoctrineResult | { error: string; input: SubjectInput })[] = new Array(inputs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, inputs.length) }, async () => {
    while (next < inputs.length) {
      const i = next++;
      try {
        out[i] = await estimateArvV2(client, inputs[i], options);
      } catch (e) {
        out[i] = { error: e instanceof Error ? e.message : String(e), input: inputs[i] };
      }
    }
  }));
  return out;
}
