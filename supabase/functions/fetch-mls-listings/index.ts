import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    
    // Also accept POST body for complex queries
    let params: Record<string, string> = {};
    if (req.method === "POST") {
      params = await req.json();
    } else {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // Build Repliers API URL
    const repliersUrl = new URL("https://api.repliers.io/listings");

    // Map our params to Repliers params (using their exact parameter names)
    if (params.city) repliersUrl.searchParams.set("city", params.city);
    if (params.zip) repliersUrl.searchParams.set("zip", params.zip);
    if (params.minPrice) repliersUrl.searchParams.set("minPrice", params.minPrice);
    if (params.maxPrice) repliersUrl.searchParams.set("maxPrice", params.maxPrice);
    if (params.minBeds) repliersUrl.searchParams.set("minBedrooms", params.minBeds);
    if (params.maxBeds) repliersUrl.searchParams.set("maxBedrooms", params.maxBeds);
    if (params.minBaths) repliersUrl.searchParams.set("minBaths", params.minBaths);
    if (params.minSqft) repliersUrl.searchParams.set("minSqft", params.minSqft);
    if (params.maxSqft) repliersUrl.searchParams.set("maxSqft", params.maxSqft);
    if (params.status) repliersUrl.searchParams.set("status", params.status);
    if (params.type) repliersUrl.searchParams.set("type", params.type);
    if (params.class) repliersUrl.searchParams.set("class", params.class);
    if (params.pageNum) repliersUrl.searchParams.set("pageNum", params.pageNum);
    if (params.resultsPerPage) repliersUrl.searchParams.set("resultsPerPage", params.resultsPerPage);

    // Defaults
    if (!params.class) repliersUrl.searchParams.set("class", "residential");
    if (!params.status) repliersUrl.searchParams.set("status", "A");
    if (!params.resultsPerPage) repliersUrl.searchParams.set("resultsPerPage", "50");

    console.log(`Fetching from Repliers: ${repliersUrl.toString()}`);

    const response = await fetch(repliersUrl.toString(), {
      headers: {
        "REPLIERS-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
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

    // Normalize listings to our Deal-compatible format
    const listings = (data.listings || []).map((listing: any) => {
      const address = listing.address || {};
      const details = listing.details || {};
      const photos = listing.images || listing.photos || [];

      return {
        mls_listing_id: listing.mlsNumber || listing.listingId || listing.id,
        address: `${address.streetNumber || ""} ${address.streetName || ""} ${address.streetSuffix || ""}`.trim(),
        city: address.city || "",
        state: address.state || "MO",
        zip: address.zip || address.postalCode || "",
        beds: parseInt(details.numBedrooms || details.bedrooms || "0", 10),
        baths: parseInt(details.numBathrooms || details.bathrooms || "0", 10),
        sqft: parseInt(details.sqft || details.squareFeet || "0", 10),
        year_built: details.yearBuilt ? parseInt(details.yearBuilt, 10) : undefined,
        property_type: details.propertyType || listing.type || "Single Family",
        list_price: parseFloat(listing.listPrice || "0"),
        mls_status: mapStatus(listing.status),
        photo_urls: Array.isArray(photos)
          ? photos.slice(0, 10).map((p: any) => (typeof p === "string" ? p : p.url || p.photoUrl || ""))
          : [],
        raw: listing, // include raw data for debugging
      };
    });

    return new Response(
      JSON.stringify({
        count: data.count || listings.length,
        page: data.page || 1,
        numPages: data.numPages || 1,
        listings,
        // Include debug info
        _debug: {
          repliersUrl: repliersUrl.toString().replace(apiKey, "***"),
          rawCount: data.count,
          rawPage: data.page,
          rawNumPages: data.numPages,
          rawKeys: Object.keys(data),
        },
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

function mapStatus(status: string | undefined): string {
  if (!status) return "Unknown";
  const s = status.toUpperCase();
  if (s === "A" || s === "ACTIVE" || s === "NEW") return "Active";
  if (s === "P" || s === "PENDING" || s === "CONDITIONAL") return "Pending";
  if (s === "S" || s === "SOLD" || s === "CLOSED") return "Sold";
  return "Unknown";
}
