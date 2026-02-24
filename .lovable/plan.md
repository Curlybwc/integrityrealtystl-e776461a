

# Fix RTP Ratio + Smart Rehab Tier Estimation

## Overview
Two changes to the screening logic:
1. **RTP Ratio fix** -- Change from Rent / List Price to Rent / All-In Price (price + repairs)
2. **Smart rehab tier** -- Auto-estimate rehab level based on price-to-ARV ratio (before repairs)

## Rehab Tier Logic

| Price / ARV (no rehab) | Estimated Tier | Cost/sqft |
|---|---|---|
| 90%+ | Turnkey | $5 |
| 80% - 90% | Light | $15 |
| 60% - 80% | Medium | $30 |
| Under 60% | Heavy | $50 |

This eliminates the "always Light" default and replaces it with a market-signal-based estimate. No circular dependency -- raw price/ARV determines the tier, then that tier feeds into the all-in calculation.

## Technical Changes

### 1. `src/lib/screening.ts`

- **`estimateRehabTier`** -- Change signature to accept `list_price` and `arv` instead of `year_built`. Compute `price / arv` ratio and return the appropriate tier based on the thresholds above.

- **`computeDealMetrics`** -- 
  - Before computing rehab, call `estimateRehabTier(list_price, arv_effective)` to get the system tier (unless an override exists)
  - Change `rent_to_price_pct` from `rent / list_price` to `rent / (list_price + rehab_est)` (the all-in price)
  - Update Turnkey and BRRRR screening thresholds to use the new RTP definition

- **`createDeal`** -- Update the call to `estimateRehabTier` to pass price and ARV instead of year_built

### 2. `src/components/portal/BatchAnalysisTable.tsx`
- Update the call to `estimateRehabTier` to pass `list_price` and `arv_system` instead of `year_built`

### 3. `src/pages/portal/PortalSearchAnalyzer.tsx`
- Update disclaimer text to explain the new rehab estimation logic (based on price-to-ARV ratio, not a flat default)

### 4. `src/components/portal/ListingCard.tsx`
- Ensure RTP Ratio tooltip/label reflects "Rent / All-In Price" definition

## Example: 6247 Evergreen
- Price: $59,000, ARV: $109,125 → price/ARV = 54% → **Heavy** tier
- Rehab: ~860sf x $50 = $43,000
- All-in: $102,000
- All-in % of ARV: 93% (fails BRRRR's 75% max)
- This correctly identifies it as a heavy rehab that doesn't pencil for BRRRR -- much more accurate than assuming Light

