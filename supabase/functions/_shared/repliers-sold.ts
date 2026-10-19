import { getSoldReportCounty, isSoldReportDate, validateSoldReportRange, type SoldRow } from "./sold-report.ts";

export interface SoldReportRequest {
  county: string;
  fromDate: string;
  toDate: string;
}

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject => value !== null && typeof value === "object" && !Array.isArray(value);
const stringValue = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

function soldCalendarDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const day = value.trim().slice(0, 10);
  return isSoldReportDate(day) ? day : undefined;
}

function normalizeSoldListing(value: unknown, request: SoldReportRequest, zips: Set<string>): SoldRow | null {
  if (!isObject(value) || !isObject(value.address)) return null;
  const address = value.address;
  const soldDate = soldCalendarDate(value.soldDate) ?? soldCalendarDate(value.closedDate);
  const zip = stringValue(address.zip || address.postalCode).slice(0, 5);
  const state = stringValue(address.state).toUpperCase();
  const mlsNumber = stringValue(value.mlsNumber);
  const street = [address.streetNumber, address.streetDirection, address.streetName, address.streetSuffix]
    .map(stringValue).filter(Boolean).join(" ");
  const unit = stringValue(address.unitNumber);
  const city = stringValue(address.city);
  if (!soldDate || soldDate < request.fromDate || soldDate > request.toDate ||
      !zips.has(zip) || !["MO", "MISSOURI"].includes(state) || !mlsNumber || !street || !city) return null;

  // Preserve the API's sold/residential filters defensively if it returns status
  // metadata. Some MLS response projections omit these fields altogether.
  if (value.status != null && stringValue(value.status).toUpperCase() !== "U") return null;
  if (value.lastStatus != null && stringValue(value.lastStatus).toLowerCase() !== "sld") return null;
  if (value.class != null && stringValue(value.class).toLowerCase() !== "residential") return null;
  if (value.type != null && stringValue(value.type).toLowerCase() !== "sale") return null;

  return { address: unit ? `${street} #${unit}` : street, city, state: "MO", zip, soldDate, mlsNumber };
}

/** Fetch every page for every configured ZIP; any upstream failure rejects the
 * whole export so a partial report cannot be mistaken for a complete one. */
export async function fetchSoldListings(
  request: SoldReportRequest,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<SoldRow[]> {
  const county = getSoldReportCounty(request.county);
  validateSoldReportRange(request.fromDate, request.toDate);
  if (!apiKey) throw new Error("Sold listing service is not configured");
  const zips = new Set<string>(county.zips);
  const rows = new Map<string, SoldRow>();
  let nextZip = 0;
  let failed = false;

  const worker = async () => {
    while (!failed && nextZip < county.zips.length) {
      const zip = county.zips[nextZip++];
      let page = 1;
      let numPages: number | undefined;
      let expectedCount: number | undefined;
      let received = 0;
      const pageFingerprints = new Set<string>();
      const zipMlsNumbers = new Set<string>();
      do {
        if (failed) return;
        const url = new URL("https://api.repliers.io/listings");
        const params = {
          zip, status: "U", lastStatus: "Sld", class: "residential", type: "Sale",
          minSoldDate: request.fromDate, maxSoldDate: request.toDate,
          pageNum: String(page), resultsPerPage: "100",
        };
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let data: unknown;
        try {
          const response = await fetcher(url.toString(), {
            headers: { "REPLIERS-API-KEY": apiKey, "Content-Type": "application/json" },
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(`Sold listing provider returned HTTP ${response.status}`);
          data = await response.json();
        } finally {
          clearTimeout(timeout);
        }
        if (!isObject(data) || !Array.isArray(data.listings) || !Number.isInteger(data.page) || data.page !== page ||
            !Number.isInteger(data.numPages) || (data.numPages as number) < 0 ||
            !Number.isInteger(data.count) || (data.count as number) < 0) {
          throw new Error("Sold listing provider returned invalid pagination");
        }
        const currentPages = data.numPages as number;
        const currentCount = data.count as number;
        if ((currentCount > 0 && currentPages < page) ||
            (currentCount === 0 && (currentPages > 1 || data.listings.length > 0)) ||
            (numPages !== undefined && numPages !== currentPages) ||
            (expectedCount !== undefined && expectedCount !== currentCount)) {
          throw new Error("Sold listing results changed or pagination is incomplete; retry the report");
        }
        numPages = currentPages;
        expectedCount = currentCount;
        if (currentCount > 0 && data.listings.length === 0) {
          throw new Error("Sold listing provider returned an empty page before all results were received");
        }
        const fingerprint = JSON.stringify(data.listings);
        if (data.listings.length > 0 && pageFingerprints.has(fingerprint)) {
          throw new Error("Sold listing provider repeated a page; export is incomplete");
        }
        pageFingerprints.add(fingerprint);
        received += data.listings.length;
        for (const listing of data.listings) {
          // A moving result set can repeat part of a previous page while still
          // matching count. Reject overlap within this ZIP rather than silently
          // deduplicating it and potentially omitting another sold listing.
          const mlsNumber = isObject(listing) ? stringValue(listing.mlsNumber) : "";
          if (mlsNumber && zipMlsNumbers.has(mlsNumber)) {
            throw new Error("Sold listing provider repeated a listing within a ZIP; retry the report");
          }
          if (mlsNumber) zipMlsNumbers.add(mlsNumber);
          const row = normalizeSoldListing(listing, request, zips);
          if (row) rows.set(row.mlsNumber, row);
        }
        page++;
      } while (page <= (numPages ?? 0));
      if (received !== expectedCount) throw new Error("Sold listing provider returned an incomplete result count");
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, county.zips.length) }, () => worker().catch((error) => {
    failed = true;
    throw error;
  })));
  return [...rows.values()].sort((a, b) => b.soldDate.localeCompare(a.soldDate) || a.address.localeCompare(b.address) || a.mlsNumber.localeCompare(b.mlsNumber));
}
