

# Plan: Add Single-Listing Lookup to Debug & Find Sqft Field

## Problem

150 Saint Daniel Lane (MLS #26006837) is active on MARIS at $115k, 3 bed, ZIP 63031, but Repliers is not returning it in search results for that ZIP. Without seeing the raw Repliers data for this listing, we cannot identify which field contains the 864 sqft value, and we cannot determine why it's being excluded from search results.

## Root Cause Hypotheses

1. **Class mismatch**: Our edge function hardcodes `class=residential`. If Repliers classifies this listing differently, it would be excluded from all searches.
2. **Repliers indexing delay**: The listing may not be fully indexed yet.
3. **ZIP mismatch**: The listing's ZIP in Repliers' system may differ from MARIS.

## Changes

### 1. `supabase/functions/fetch-mls-listings/index.ts` — Add single-listing lookup

Add support for a `mlsNumber` parameter. When provided, fetch directly from Repliers' single-listing endpoint (`GET /listings/{mlsNumber}`) instead of the search endpoint. This bypasses all search filters (class, type, status, ZIP) and returns the full raw listing data.

```typescript
// If mlsNumber is provided, fetch single listing directly
if (params.mlsNumber) {
  const url = `https://api.repliers.io/listings/${params.mlsNumber}`;
  const response = await fetch(url, {
    headers: { "REPLIERS-API-KEY": apiKey, "Content-Type": "application/json" },
  });
  const data = await response.json();
  const listing = normalizeListing(data);
  return Response with { count: 1, page: 1, numPages: 1, listings: [listing] }
}
```

This lets us:
- Fetch MLS #26006837 directly and inspect ALL raw fields to find where 864 lives
- See what `class`, `status`, and `zip` Repliers has for this listing
- Diagnose why it's not appearing in search results

### 2. `src/hooks/useMlsSearch.tsx` — Add `mlsNumber` to search params

Add optional `mlsNumber` field to `MlsSearchParams` interface so the frontend can trigger single-listing lookups.

### 3. No UI changes in this step

This is a diagnostic step. Once we can see the full raw data for 26006837, we'll know:
- Which field contains 864 (could be `details.sqft`, `raw.LivingAreaSrchSqFt`, `raw.TotalFinishedAreaSrchSqFt`, or another raw field)
- Why the listing is excluded from search results
- Whether we need to adjust our `class` filter or sqft fallback chain

## Impact

Low risk. Adds an optional code path that only activates when `mlsNumber` is explicitly provided. Does not affect existing search behavior.

