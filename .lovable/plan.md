

# Plan: ArcGIS Sqft Supplementation with Safety Refinements

## Summary

All seven refinements from ChatGPT are sound and align with the existing plan. Here is the final implementation plan incorporating every point.

## Changes

### 1. `supabase/functions/fetch-mls-listings/index.ts`

Add the following new code to the edge function:

**a) St. Louis County ZIP set (constant)**
```typescript
const STL_COUNTY_ZIPS = new Set([
  "63005","63011","63017","63021","63025","63026","63031","63033","63034","63040",
  "63042","63043","63044","63074","63088","63114","63117","63119","63121","63122",
  "63123","63124","63125","63126","63127","63128","63129","63130","63131","63132",
  "63133","63134","63135","63136","63137","63138","63140","63141","63143","63144","63146"
]);
```

**b) Address normalization function**

Uppercases the address, then applies a USPS abbreviation map (SAINT->ST, LANE->LN, DRIVE->DR, STREET->ST, ROAD->RD, AVENUE->AVE, BOULEVARD->BLVD, CIRCLE->CIR, COURT->CT, PLACE->PL, TERRACE->TER, TRAIL->TRL, PARKWAY->PKWY, HIGHWAY->HWY). Replaces each word-boundary match.

**c) `lookupCountySqft(address, zip)` function**

Two-step query with 2-second timeout via `AbortController`:

1. **Exact match first**: `where=PROP_ADD='{NORMALIZED}'`
2. **If zero results, LIKE fallback**: `where=PROP_ADD LIKE '%{NORMALIZED}%'`
3. **If result count != 1, return null** (ambiguous or no match)
4. **If exactly 1 result with RESQFT > 0**, return `{ resqft, yearblt }`
5. **On any error or timeout, return null** (graceful degradation)

```text
Endpoint: https://services2.arcgis.com/w657bnjzrjguNyOy/arcgis/rest/services/
          STLCO_STC_Parcels_SFD/FeatureServer/0/query
Params:   outFields=RESQFT,YEARBLT&f=json&resultRecordCount=3
```

**d) Post-processing step after all listings are normalized**

Before the final `return new Response(...)`, add:

```text
1. Filter listings where sqft === 0 AND zip is in STL_COUNTY_ZIPS
2. Cap at 10 listings max
3. Call lookupCountySqft for each via Promise.all (concurrency cap = 10)
4. For each successful result:
   - Set listing.sqft = result.resqft
   - Set listing.sqft_source = "public_record"
   - If listing.year_built is missing and result.yearblt exists, backfill it
5. For all other listings: set listing.sqft_source = "mls"
```

This runs for both the single-ZIP and multi-ZIP code paths, inserted right before the final response.

**Key safety rules enforced:**
- Never overwrites non-zero MLS sqft
- 2-second AbortController timeout per ArcGIS request
- Max 10 concurrent ArcGIS lookups
- Exact match attempted before LIKE fallback
- Multiple matches treated as ambiguous (returns null)
- Any failure silently skips (listing keeps sqft=0, source="mls")

### 2. `src/hooks/useMlsSearch.tsx`

Add `sqft_source?: "mls" | "public_record"` to the `MlsListing` interface.

### 3. `src/components/portal/ListingCard.tsx`

Two changes:
- When `sqft === 0`: display "N/A" instead of "0" in the Bd/Ba/Sf line
- When `sqft_source === "public_record"`: append a small "(PR)" indicator after the sqft value

Line 82 changes from:
```
{l.beds}/{l.baths}/{l.sqft?.toLocaleString()}
```
to:
```
{l.beds}/{l.baths}/{l.sqft ? `${l.sqft.toLocaleString()}${l.sqft_source === 'public_record' ? ' (PR)' : ''}` : 'N/A'}
```

The `ListingCardProps` interface gains `sqft_source?: string`.

### 4. `src/components/portal/BatchAnalysisTable.tsx`

Same pattern in table view (line 257):
- Show "N/A" when sqft is 0
- Show "(PR)" suffix when `sqft_source === "public_record"`

## Files NOT Modified

- `src/lib/screening.ts` -- no changes to thresholds, rehab tiers, rates, or logic
- Database schema -- no new tables or columns
- `supabase/config.toml` -- no changes
- No new secrets needed (ArcGIS endpoint is public, no API key)

## Risk Assessment

- **Low risk**: ArcGIS is free, public, keyless. All failures are silent.
- **Performance**: Only fires for 0-sqft County listings (small minority). 2s timeout prevents blocking. Worst case adds ~500ms for a batch of 10 lookups.
- **Scope limitation**: St. Louis County only. City, St. Charles, and Jefferson County listings with missing sqft will show "N/A" until those county endpoints are discovered and added.

