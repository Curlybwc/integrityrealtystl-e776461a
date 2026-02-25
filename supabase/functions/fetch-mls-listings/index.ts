import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function mapStatus(status: string | undefined): string {
  if (!status) return "Unknown";
  const s = status.toUpperCase();
  if (s === "A" || s === "ACTIVE" || s === "NEW") return "Active";
  if (s === "P" || s === "PENDING" || s === "CONDITIONAL") return "Pending";
  if (s === "S" || s === "SOLD" || s === "CLOSED") return "Sold";
  return "Unknown";
}

function normalizeListing(listing: any) {
  const address = listing.address || {};
  const details = listing.details || {};
  const photos = listing.images || listing.photos || [];
  const raw = listing.raw || {};
  const aboveGradeSqft = raw.AboveGradeFinishedAreaSrchSqFt;

  return {
    mls_listing_id: listing.mlsNumber || listing.listingId || listing.id,
    address: `${address.streetNumber || ""} ${address.streetName || ""} ${address.streetSuffix || ""}`.trim(),
    city: address.city || "",
    state: address.state || "MO",
    zip: address.zip || address.postalCode || "",
    beds: parseInt(details.numBedrooms || details.bedrooms || "0", 10),
    baths: parseInt(details.numBathrooms || details.bathrooms || "0", 10),
    sqft: parseInt(aboveGradeSqft || details.sqft || details.squareFeet || details.area || "0", 10),
    below_grade_sqft: parseInt(raw.BelowGradeFinishedAreaSrchSqFt || "0", 10),
    year_built: details.yearBuilt ? parseInt(details.yearBuilt, 10) : undefined,
    property_type: details.propertyType || listing.type || "Single Family",
    list_price: parseFloat(listing.listPrice || "0"),
    mls_status: mapStatus(listing.status),
    photo_urls: Array.isArray(photos)
      ? photos.slice(0, 10).map((p: any) => {
          const path = typeof p === "string" ? p : p.url || p.photoUrl || "";
          if (!path) return "";
          return path.startsWith("http") ? path : `https://cdn.repliers.io/${path}`;
        }).filter(Boolean)
      : [],
    raw: listing,
  };
}

function buildRepliersUrl(params: Record<string, string>, singleZip?: string): URL {
  const url = new URL("https://api.repliers.io/listings");

  if (singleZip) url.searchParams.set("zip", singleZip);
  else if (params.zip) url.searchParams.set("zip", params.zip);

  if (params.city) url.searchParams.set("city", params.city);
  if (params.minPrice) url.searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) url.searchParams.set("maxPrice", params.maxPrice);
  if (params.minBeds) url.searchParams.set("minBedrooms", params.minBeds);
  if (params.maxBeds) url.searchParams.set("maxBedrooms", params.maxBeds);
  if (params.minBaths) url.searchParams.set("minBaths", params.minBaths);
  if (params.minSqft) url.searchParams.set("minSqft", params.minSqft);
  if (params.maxSqft) url.searchParams.set("maxSqft", params.maxSqft);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.class) url.searchParams.set("class", params.class);
  if (params.pageNum) url.searchParams.set("pageNum", params.pageNum);
  if (params.resultsPerPage) url.searchParams.set("resultsPerPage", params.resultsPerPage);

  if (!params.class) url.searchParams.set("class", "residential");
  if (!params.type) url.searchParams.set("type", "Sale");
  if (!params.status) url.searchParams.set("status", "A");
  if (!params.resultsPerPage) url.searchParams.set("resultsPerPage", "50");

  return url;
}

async function fetchSingleZip(apiKey: string, params: Record<string, string>, zip: string) {
  const url = buildRepliersUrl(params, zip);
  console.log(`Fetching ZIP ${zip}: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    headers: { "REPLIERS-API-KEY": apiKey, "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Repliers error for ZIP ${zip}: ${response.status} ${errorText}`);
    return { listings: [], count: 0 };
  }

  const data = await response.json();
  console.log(`ZIP ${zip}: count=${data.count}, listings=${(data.listings || []).length}`);
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REPLIERS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "REPLIERS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(req.url);
    let params: Record<string, string> = {};
    if (req.method === "POST") {
      params = await req.json();
    } else {
      searchParams.forEach((value, key) => { params[key] = value; });
    }

    // Single-listing lookup by MLS number
    if (params.mlsNumber) {
      const mlsUrl = `https://api.repliers.io/listings/${params.mlsNumber}`;
      console.log(`Fetching single listing: ${mlsUrl}`);
      const mlsResp = await fetch(mlsUrl, {
        headers: { "REPLIERS-API-KEY": apiKey, "Content-Type": "application/json" },
      });
      if (!mlsResp.ok) {
        const errText = await mlsResp.text();
        console.error(`Single listing error: ${mlsResp.status} ${errText}`);
        return new Response(
          JSON.stringify({ error: `Repliers returned ${mlsResp.status}`, details: errText }),
          { status: mlsResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const mlsData = await mlsResp.json();
      console.log(`Single listing raw keys: ${Object.keys(mlsData).join(", ")}`);
      console.log(`Single listing raw JSON: ${JSON.stringify(mlsData).substring(0, 3000)}`);
      const listing = normalizeListing(mlsData);
      return new Response(
        JSON.stringify({ count: 1, page: 1, numPages: 1, listings: [listing] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Multi-ZIP support: split and fetch in parallel
    const zipValue = params.zip || "";
    const zips = zipValue.includes(",")
      ? zipValue.split(",").map((z) => z.trim()).filter(Boolean)
      : [];

    let listings: any[];
    let totalCount: number;

    if (zips.length > 1) {
      console.log(`Multi-ZIP search: ${zips.join(", ")}`);
      const results = await Promise.all(zips.map((z) => fetchSingleZip(apiKey, params, z)));

      // Merge and deduplicate by mls_listing_id
      const seen = new Set<string>();
      const merged: any[] = [];
      for (const result of results) {
        for (const raw of result.listings || []) {
          const normalized = normalizeListing(raw);
          if (!seen.has(normalized.mls_listing_id)) {
            seen.add(normalized.mls_listing_id);
            merged.push(normalized);
          }
        }
      }

      // Filter out leases that slip through
      listings = merged.filter((l: any) => !l.property_type?.toLowerCase().includes("lease"));
      totalCount = listings.length;
      console.log(`Multi-ZIP merged: ${totalCount} unique listings (leases excluded)`);
    } else {
      // Single ZIP (or no ZIP) — original behavior
      const repliersUrl = buildRepliersUrl(params);
      console.log(`Fetching from Repliers: ${repliersUrl.toString()}`);

      const response = await fetch(repliersUrl.toString(), {
        headers: { "REPLIERS-API-KEY": apiKey, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Repliers API error: ${response.status} ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Repliers API returned ${response.status}`, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      console.log(`Repliers response: count=${data.count}, page=${data.page}, numPages=${data.numPages}, listings=${(data.listings || []).length}`);

      listings = (data.listings || []).map(normalizeListing)
        .filter((l: any) => !l.property_type?.toLowerCase().includes("lease"));
      totalCount = listings.length;
    }

    return new Response(
      JSON.stringify({
        count: totalCount,
        page: 1,
        numPages: 1,
        listings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
