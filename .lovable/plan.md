

# Plan: Use Above-Grade Sqft from Repliers Raw Data

## Context

Repliers confirmed that MLS raw fields are available via the `raw` object. The field `raw.AboveGradeFinishedAreaSrchSqFt` gives us above-grade square footage, which aligns with appraisal standards and our project's preference (per existing memory). Currently we use `details.sqft` which may include basement or non-living area.

## Changes

### 1. `supabase/functions/fetch-mls-listings/index.ts` — `normalizeListing`

**Request the raw fields:** Add `fields` param to the Repliers URL in `buildRepliersUrl` to ensure the raw object is included in the response. By default Repliers returns the raw object, so this may already work without specifying `fields`. We will access it defensively.

**Update sqft extraction (line 31):**

Current:
```typescript
sqft: parseInt(details.sqft || details.squareFeet || details.area || "0", 10),
```

New priority order:
```typescript
const raw = listing.raw || {};
const aboveGradeSqft = raw.AboveGradeFinishedAreaSrchSqFt;

sqft: parseInt(aboveGradeSqft || details.sqft || details.squareFeet || details.area || "0", 10),
```

Above-grade takes priority. Falls back to `details.sqft` if the raw field is null or missing. This is a single-line change in the normalization function.

**Also expose below-grade for future use (optional):**
Add `below_grade_sqft` to the normalized output:
```typescript
below_grade_sqft: parseInt(raw.BelowGradeFinishedAreaSrchSqFt || "0", 10),
```

This is informational only — not used in screening calculations — but useful for the deal detail view and analyzer.

### 2. `src/hooks/useMlsSearch.tsx` — MlsListing interface

Add optional field:
```typescript
below_grade_sqft?: number;
```

The `sqft` field continues to represent above-grade (primary) square footage. No interface name change needed.

### 3. No changes to screening.ts or UI components

The `sqft` field flows through the existing pipeline unchanged. All downstream consumers (screening, rehab cost calculation, ARV estimation) automatically use the corrected above-grade value. No UI changes needed unless we want to display below-grade sqft somewhere.

## What This Fixes

A property with 1,000 sqft above grade and 800 sqft finished basement currently reports 1,800 sqft (or whatever `details.sqft` contains). With this change, it correctly reports 1,000 sqft for rehab and ARV calculations, preventing inflated rehab estimates and skewed valuations.

## Risk

Low. The raw field may be null for some listings (Repliers said it depends on MLS data). The fallback chain (`details.sqft`) handles this gracefully.

