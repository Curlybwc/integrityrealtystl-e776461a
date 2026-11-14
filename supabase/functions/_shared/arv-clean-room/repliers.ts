/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Minimal Repliers client for the clean-room ARV method.
//
// Behaviour verified against live responses (Nov 2026, MARIS feed):
//  - Auth: `REPLIERS-API-KEY` header.
//  - `resultsPerPage` is silently capped at 100; `pageNum` pages are stable
//    under `sortBy=distanceAsc` when lat/long/radius are given.
//  - `radius` is in kilometres. No distance field is returned.
//  - `status=U&lastStatus=Sld&type=sale` isolates closed sales (status=U alone
//    also returns leases, expired and terminated listings).
//  - `minSoldDate`/`maxSoldDate` filter on `soldDate`, which is the
//    contract/off-market date; the true closing date is `raw.CloseDate`.
//  - `fields=` supports nested paths incl. individual `raw.*` MLS fields and
//    cuts a 100-record page from ~640 KB to ~60 KB.
//  - Unknown params are reported in `unrecognizedParams`, not rejected.
//  - `fields=raw` on its own returns raw-only records; naming normalized paths
//    and individual `raw.*` paths together (as COMP_FIELDS does) returns both.
//  - `minSqft`/`maxSqft` filter on living area, which includes finished
//    basement; above-grade area is only in raw. `minBedrooms`/`maxBedrooms` work.
//  - Rate limit: `x-ratelimit-limit: 1800` per ~60 s window on the search
//    endpoints, exhausted after roughly 300 page requests in a few minutes of
//    back-to-back backtests; 429 responses carry `retry-after`, which the
//    client now waits out.

const BASE = "https://api.repliers.io";

export const COMP_FIELDS = [
  "mlsNumber", "type", "lastStatus", "listPrice", "soldPrice", "soldDate",
  "address", "map.latitude", "map.longitude",
  "details.sqft", "details.numBedrooms", "details.numBathrooms", "details.numBathroomsHalf",
  "details.yearBuilt", "details.style", "details.propertyType", "details.description",
  "details.basement1", "details.numGarageSpaces",
  "raw.CloseDate", "raw.PropertyCondition", "raw.SpecialListingConditions", "raw.BuyerFinancing",
  "raw.ConcessionsAmount", "raw.AboveGradeFinishedArea", "raw.Levels", "raw.SubdivisionName",
  "raw.GarageSpaces", "raw.BasementYN", "raw.BathroomsFull", "raw.BathroomsHalf",
  "raw.NewConstructionYN",
  // Added in the third revision, for the style preference (owner ruling 3).
  "raw.ArchitecturalStyle",
  // Added in v4: above-grade area under the key the MLS search uses, and school district.
  "raw.AboveGradeFinishedAreaSrchSqFt", "raw.SchoolDistrict",
].join(",");

export interface RepliersClientOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface SoldSearch {
  lat: number;
  lng: number;
  radiusKm: number;
  minSoldDate: string; // YYYY-MM-DD
  maxSoldDate?: string;
  minSqft?: number;
  maxSqft?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  style?: string | null;
  propertyType?: string | null;
  pageNum?: number;
}

export interface SoldPage {
  listings: any[];
  page: number;
  numPages: number;
  count: number;
  unrecognizedParams: string[];
}

export class RepliersClient {
  calls = 0;
  private apiKey: string;
  private fetchImpl: typeof fetch;
  private maxRetries: number;
  private timeoutMs: number;
  private cache = new Map<string, Promise<any>>();

  constructor(opts: RepliersClientOptions) {
    if (!opts.apiKey) throw new Error("REPLIERS_API_KEY is not configured");
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.maxRetries = opts.maxRetries ?? 3;
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  /** GET with retry on 429/5xx and per-instance memoisation of identical URLs. */
  private get(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    return this.getUrl(url.toString());
  }

  private getUrl(key: string): Promise<any> {
    const hit = this.cache.get(key);
    if (hit) return hit;
    const p = this.fetchWithRetry(key);
    this.cache.set(key, p);
    p.catch(() => this.cache.delete(key));
    return p;
  }

  private async fetchWithRetry(url: string): Promise<any> {
    let lastErr: unknown;
    // Verified live: a 429 carries `retry-after` (seconds, up to ~60) and the
    // search endpoints share a per-minute budget separate from other calls.
    let waitMs: number | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, waitMs ?? 400 * 2 ** attempt));
      waitMs = null;
      this.calls++;
      try {
        const resp = await this.fetchImpl(url, {
          headers: { "REPLIERS-API-KEY": this.apiKey, Accept: "application/json" },
          signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(this.timeoutMs) : undefined,
        });
        if (resp.status === 429 || resp.status >= 500) {
          const retryAfter = Number(resp.headers?.get?.("retry-after"));
          if (resp.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) waitMs = Math.min(retryAfter, 65) * 1000 + 500;
          lastErr = new Error(`Repliers ${resp.status}`);
          continue;
        }
        if (!resp.ok) {
          const body = (await resp.text()).slice(0, 200);
          throw Object.assign(new Error(`Repliers ${resp.status}: ${body}`), { fatal: true });
        }
        return await resp.json();
      } catch (err) {
        if ((err as any)?.fatal) throw err;
        lastErr = err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("Repliers request failed");
  }

  /**
   * One listing by MLS number, any status, with the same trimmed field set as
   * comps. Verified live: the search endpoint defaults to status=A only, so
   * both statuses must be requested; and unlike /listings/{mls} it can return
   * individual `raw.*` fields.
   */
  async getListing(mlsNumber: string): Promise<any | null> {
    const url = new URL(BASE + "/listings");
    url.searchParams.set("mlsNumber", mlsNumber);
    url.searchParams.append("status", "A");
    url.searchParams.append("status", "U");
    url.searchParams.set("resultsPerPage", "1");
    url.searchParams.set("fields", COMP_FIELDS);
    const d = await this.getUrl(url.toString());
    return d?.listings?.[0] ?? null;
  }

  /** One page (<=100) of closed sales around a point, nearest first. */
  async searchSold(q: SoldSearch): Promise<SoldPage> {
    const params: Record<string, string> = {
      status: "U",
      lastStatus: "Sld",
      type: "sale",
      lat: String(q.lat),
      long: String(q.lng),
      radius: String(q.radiusKm),
      minSoldDate: q.minSoldDate,
      sortBy: "distanceAsc",
      resultsPerPage: "100",
      pageNum: String(q.pageNum ?? 1),
      fields: COMP_FIELDS,
    };
    if (q.maxSoldDate) params.maxSoldDate = q.maxSoldDate;
    if (q.minSqft) params.minSqft = String(Math.floor(q.minSqft));
    if (q.maxSqft) params.maxSqft = String(Math.ceil(q.maxSqft));
    if (q.minBedrooms !== undefined) params.minBedrooms = String(q.minBedrooms);
    if (q.maxBedrooms !== undefined) params.maxBedrooms = String(q.maxBedrooms);
    if (q.style) params.style = q.style;
    if (q.propertyType) params.propertyType = q.propertyType;
    const d = await this.get("/listings", params);
    return {
      listings: Array.isArray(d?.listings) ? d.listings : [],
      page: d?.page ?? 1,
      numPages: d?.numPages ?? 1,
      count: d?.count ?? 0,
      unrecognizedParams: d?.unrecognizedParams ?? [],
    };
  }
}
