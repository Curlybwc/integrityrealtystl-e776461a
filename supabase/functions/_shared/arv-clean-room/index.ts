// Clean-room ARV method — orchestrator: fetch nearest sold records from
// Repliers page by page, stop as soon as the engine has enough renovated comps.

import { DEFAULTS, normalizeProperty, normalizeSold, valueFromPool } from "./engine.ts";
import { RepliersClient } from "./repliers.ts";
import type { ArvOptions, ArvResult, Property, SoldComp } from "./types.ts";

export * from "./types.ts";
export { RepliersClient } from "./repliers.ts";
export { normalizeProperty, valueFromPool } from "./engine.ts";

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
