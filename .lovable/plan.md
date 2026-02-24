

# Fix: Multi-ZIP Search Support

## Problem
The Repliers API does not accept comma-separated ZIP codes in a single `zip` parameter. When you search "63031,63130,63134,63135", the API returns 0 results because it treats the whole string as one invalid ZIP. Single-ZIP searches work fine (63031 with maxPrice 130000 returned 1 result).

## Solution
Update the edge function to detect comma-separated ZIPs, split them, and make parallel API calls for each ZIP -- then combine and deduplicate the results before returning them.

## Changes

### 1. Edge Function: `supabase/functions/fetch-mls-listings/index.ts`
- Detect if `params.zip` contains commas
- If so, split into individual ZIPs and fire a parallel `fetch` for each one
- Merge all listing arrays, deduplicate by `mlsNumber`
- Sum up `count`, recalculate `numPages` based on combined results
- Single-ZIP searches continue to work exactly as before (no behavior change)

### 2. Fix Console Warnings
- **`src/components/portal/BatchAnalysisTable.tsx`** -- The component doesn't need `forwardRef`; the warning is likely from how it's rendered. Will ensure no ref is being passed to it.
- **`src/components/portal/ListingPhotoModal.tsx`** -- Same ref warning fix.

## Technical Detail

The edge function change looks roughly like this:

```text
If zip contains commas:
  Split into ["63031", "63130", "63134", "63135"]
  For each zip, build the same Repliers URL but with a single zip
  Await all fetches in parallel (Promise.all)
  Merge listings arrays
  Deduplicate by mlsNumber
  Return combined result
Else:
  Existing single-request logic (unchanged)
```

This keeps the API contract identical from the frontend's perspective -- no changes needed to `useMlsSearch` or `PortalSearchAnalyzer`.

