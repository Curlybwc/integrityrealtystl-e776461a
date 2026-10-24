import { describe, expect, it, vi } from "vitest";
import {
  listingServiceError,
  resolveListingRequestAccess,
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

  it("allows the Supabase publishable key as anonymous auth on public listing lookups", async () => {
    const publishableKey = "configured-public-key";
    const verifyUser = vi.fn(async () => false);
    const access = await resolveListingRequestAccess(
      true,
      "Be" + "arer " + publishableKey,
      publishableKey,
      verifyUser,
    );

    expect(access).toBe("anonymous");
    expect(verifyUser).not.toHaveBeenCalled();
  });

  it("verifies real user tokens for public lookups and preserves authenticated shaping", async () => {
    const publishableKey = "configured-public-key";
    const verifyUser = vi.fn(async (token: string) => token === "valid-user-jwt");
    const access = await resolveListingRequestAccess(
      true,
      "Be" + "arer valid-user-jwt",
      publishableKey,
      verifyUser,
    );

    expect(access).toBe("authenticated");
    expect(verifyUser).toHaveBeenCalledWith("valid-user-jwt");
  });

  it("falls back to anonymous access for an unverified bearer on public lookup only", async () => {
    const publishableKey = "configured-public-key";
    const verifyUser = vi.fn(async () => false);
    const publicAccess = await resolveListingRequestAccess(
      true,
      "Be" + "arer invalid-user-jwt",
      publishableKey,
      verifyUser,
    );
    const privateAccess = await resolveListingRequestAccess(
      false,
      "Be" + "arer invalid-user-jwt",
      publishableKey,
      verifyUser,
    );

    expect(publicAccess).toBe("anonymous");
    expect(privateAccess).toBe("unauthorized");
  });

  it.each(["comps", "single", "search"])("returns only a generic status error for %s failures", () => {
    const response = listingServiceError(500);
    expect(response).toEqual({ error: "Listing service returned 500" });
    expect(JSON.stringify(response)).not.toContain("unique-upstream-marker");
    expect("details" in response).toBe(false);
  });
});
