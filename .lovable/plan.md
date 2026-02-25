

# Plan: Add `rehab_est_override` and Centralize DealAnalyzer Math

## Summary

Two changes: (1) Add a `rehab_est_override` field to the Deal interface and wire it into `computeDealMetrics`, (2) Refactor `DealAnalyzer.tsx` to use `computeDealMetrics` instead of inline math. The UI interaction rule: changing the rehab tier dropdown populates the rehab dollars field; manually entering rehab dollars clears the tier dropdown back to "auto."

## Override Priority Rule

```text
User changes Rehab Tier dropdown
  → rehab_tier_override = selected tier
  → rehab_est_override = cleared (undefined)
  → dollars auto-calculate from tier × sqft

User types into Rehab Dollars field
  → rehab_est_override = entered value
  → rehab_tier_override = cleared (undefined)
  → tier display shows "Custom" or blank
  → dollars used as-is, tier logic skipped
```

This is a **mutually exclusive** override model. Only one can be active at a time. The last one the user touched wins.

## Changes

### 1. `src/lib/screening.ts` — Deal interface + computeDealMetrics

**Add field to Deal interface:**
- `rehab_est_override?: number` alongside existing `rehab_tier_override`

**Update `computeDealMetrics` (lines 177-179):**

Current:
```typescript
const rehabRate = getRehabRate(rehab_tier_effective, config);
const rehab_est_effective = (deal.sqft ?? 0) * rehabRate;
```

New:
```typescript
let rehab_est_effective: number;
if (deal.rehab_est_override && deal.rehab_est_override > 0) {
  // Manual dollar override — bypass tier calculation entirely
  rehab_est_effective = deal.rehab_est_override;
} else {
  const rehabRate = getRehabRate(rehab_tier_effective, config);
  rehab_est_effective = (deal.sqft ?? 0) * rehabRate;
}
```

No other changes to screening.ts. The function signature and return type stay the same.

### 2. `src/components/portal/DealAnalyzer.tsx` — Use `computeDealMetrics`

**Replace the inline `calculations` useMemo (lines 198-243)** with a call to `computeDealMetrics`. Map the DealAnalyzer's local state into a `Partial<Deal>` object:

```typescript
const calculations = useMemo(() => {
  const partialDeal: Partial<Deal> = {
    list_price: inputs.price,
    sqft: inputs.sqft,
    zip: inputs.zip,
    beds: inputs.beds,
    rent_system: getRentComp(inputs.zip, inputs.beds) || 0,
    arv_system: calculateArvQuick(inputs.zip, inputs.sqft) || 0,
    rent_override: inputs.isAvgRentManual ? inputs.avgRent : undefined,
    arv_override: inputs.manualArv > 0 ? inputs.manualArv : undefined,
    rehab_tier_override: inputs.rehabTierOverride,    // new field
    rehab_est_override: inputs.manualRepairs > 0 ? inputs.manualRepairs : undefined,
    mls_status: "Active",
  };

  const metrics = computeDealMetrics(partialDeal);

  // Additional display-only values (FMR, rent comp, etc.)
  const fmr = getFmr(inputs.zip, inputs.beds);
  const rentComp = getRentComp(inputs.zip, inputs.beds);
  const arvQuick = calculateArvQuick(inputs.zip, inputs.sqft);

  return { ...metrics, fmr, rentComp, arvQuick };
}, [inputs]);
```

**Update the DealInputs interface:**
- Remove `repairPreset` (replaced by the rehab tier concept from screening.ts)
- Add `rehabTierOverride?: RehabTier` (maps to the dropdown)
- Keep `manualRepairs` (maps to `rehab_est_override`)

**Update the Repair Preset dropdown** to use the four rehab tiers (Turnkey/$5, Light/$15, Medium/$30, Heavy/$50) instead of the old five-preset system. Add an "Auto" option that means "let price/ARV determine the tier."

**Wire the mutual-exclusion behavior:**
- When user selects a tier from dropdown: set `rehabTierOverride` to that tier, clear `manualRepairs` to 0
- When user types into manual repairs field: set `manualRepairs` to the value, clear `rehabTierOverride` to undefined

**Update results display** to use the new field names from `computeDealMetrics`:
- `repairEstimate` → `rehab_est_effective`
- `allIn` → computed from `list_price + rehab_est_effective`
- `percentArv` → `all_in_pct_of_arv` (note: this is all-in/ARV, not just price/ARV — slight change in meaning but more accurate)
- `likelyRtp` → `rent_to_price_pct`
- `offer75` → keep as local calculation: `arv * 0.75 - rehab` (display-only, not part of screening)
- `currentRtp` → keep as local calculation: `currentRent / price` (display-only)

### 3. `src/data/stlZipData.ts` — Cleanup

The old `RepairPreset`, `REPAIR_PRESET_LABELS`, and `getRepairEstimate` exports can be removed since the DealAnalyzer will now use screening.ts tiers. However, if `BatchAnalysisTable` or other components still import them, we keep them until those are migrated too. Will check usage and remove only if safe.

## What Does NOT Change

- `computeDealMetrics` function signature (still takes `Partial<Deal>`)
- `ScreeningConfig` and its defaults
- Turnkey/BRRRR evaluation logic
- `createDeal` / `updateDeal` functions
- Admin deal pipeline (mockDeals, useDeals hook)
- `BatchAnalysisTable` (separate migration later if needed)

## Technical Details

The mutual-exclusion override is handled entirely in the UI component state. `screening.ts` simply checks: if `rehab_est_override > 0`, use it; otherwise fall back to tier-based calculation. The function does not need to know about the UI interaction pattern — it just respects whichever override is present.

