import { describe, expect, it } from "vitest";
import {
  listingServiceError,
  shapeSingleListing,
} from "../../supabase/functions/_shared/public-listing-response";

describe("public listing response", () => {
  it("keeps display fields and removes the raw upstream record", () => {
    const listing = {
      address: "123 Main St",
      list_price: 250000,
      beds: 3,
      baths: 2,
      sqft: 1400,
      photo_urls: ["https://example.test/photo.jpg"],
      remarks: "Well maintained",
      sold_date: "2026-01-01",
      list_date: "2025-12-01",
      mls_status: "Sold",
      raw: { privateField: "do-not-return", nested: { raw: { secret: true } } },
    };
    const publicListing = shapeSingleListing(listing, true);

    expect(publicListing).toMatchObject({
      address: listing.address,
      list_price: listing.list_price,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      photo_urls: listing.photo_urls,
      remarks: listing.remarks,
      sold_date: listing.sold_date,
      list_date: listing.list_date,
      mls_status: listing.mls_status,
    });
    expect(JSON.stringify(publicListing)).not.toMatch(/"raw"\s*:/);
    expect(listing.raw).toBeDefined();
  });

  it("preserves the raw field for authenticated single-listing responses", () => {
    const listing = { address: "123 Main St", raw: { sourceField: "kept" } };
    expect(shapeSingleListing(listing, false)).toBe(listing);
    expect(shapeSingleListing(listing, false)).toHaveProperty("raw", listing.raw);
  });

  it.each(["comps", "single", "search"])("returns only a generic status error for %s failures", () => {
    const response = listingServiceError(500);
    expect(response).toEqual({ error: "Listing service returned 500" });
    expect(JSON.stringify(response)).not.toContain("unique-upstream-marker");
    expect("details" in response).toBe(false);
  });
});
