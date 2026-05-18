
# Phase 2 — My Saved Deals

Persistent investor-owned underwriting workspaces built on top of the existing deal detail page. Snapshot-copy model, explicit Save / Update. No CRM scope.

## 1. Data model (Supabase)

New table `saved_deals` (one row per investor + property):

- `user_id` (uuid) — owner
- `property_key` (text) — `mls:<mls_id>` for MLS/Alerts, `wholesale:<deal_id>` for wholesaler deals. Unique with `user_id`.
- `source_type` (text), `source_tags` (text[]) — e.g. `["MLS","Deal Alert"]`
- `mls_listing_id` (text, nullable)
- `address`, `city`, `state`, `zip`
- `beds`, `baths`, `sqft`, `year_built`, `property_type`
- `list_price_at_save` (numeric)
- `remarks_snapshot` (text)
- `photo_urls` (text[]) — snapshot at save time
- `underwriting` (jsonb): `{ arv, expected_rent, total_repairs, repair_breakdown: LineItems, rehab_tier, mao, rent_to_price_pct, all_in_pct_of_arv, passes_turnkey, passes_brrrr, passes_flip }`
- `notes` (text)
- `evidence_hash_at_save` (text, nullable) — links to the repair_analyses row that seeded the breakdown
- `saved_at`, `updated_at`

RLS: investor reads/writes only own rows. Admins read all. Unique index `(user_id, property_key)`.

No new tables for scenarios, pipelines, tasks, reminders, or activity.

## 2. Persistence helpers

New `src/lib/savedDeals.ts`:

- `buildSnapshotFromDeal(deal, underwriting)` — pure function
- `diffUnderwriting(current, saved)` — returns boolean + changed-field list
- `recomputeMetrics(price, arv, rent, repairs)` — central math (reuses formulas from `screening.ts`; no duplicated thresholds)

New hook `src/hooks/useSavedDeals.tsx`:

- `savedByPropertyKey: Map<string, SavedDeal>`
- `isSaved(propertyKey)`, `getSaved(propertyKey)`
- `saveDeal(snapshot)`, `updateSaved(id, snapshot)`, `unsaveDeal(id)`
- React Query backed; invalidates after mutations.

## 3. Detail page enhancements

`src/pages/portal/PortalDealDetail.tsx` becomes the primary underwriting workspace. Extract underwriting UI into a new component `src/components/portal/DealUnderwritingPanel.tsx` to keep the file tidy.

Underwriting panel contents (drop-in, replaces the read-only Financial Snapshot card):

- Editable inputs: ARV, Expected Rent, Total Repairs
- Collapsible "View/Edit Repair Breakdown" (uses existing `RepairBreakdownPanel` in edit mode; line items: kitchen, baths, flooring, paint_drywall, roof, hvac, water_heater, plumbing_stack, appliances, dumpsters, foundation, basement, landscaping, windows, misc_reserve, gut)
- Editing a line recalculates `total_repairs`; editing any field recalculates MAO / Rent-to-Price / All-In % live
- Notes textarea
- Save bar (sticky bottom of panel):
  - If not saved: **Save Deal** (heart icon)
  - If saved + no diff: **Saved ✓** (disabled-looking) + **Unsave**
  - If saved + diff: **Update Saved Deal** (primary) + "You have unsaved underwriting changes" hint + **Discard changes**
- Confirm dialog on Update when there are diffs; confirm dialog on Unsave if notes or non-default underwriting exist

In-session edits live in local component state. They are not persisted unless Save / Update is clicked. Leaving the page discards them — acceptable.

## 4. Discovery grid changes (minimal)

`PortalMlsDeals.tsx`, `PortalWholesaleDeals.tsx`, `PortalDealAlerts.tsx`:

- Add a small heart button overlay on each card (top-right of image, next to status badge)
- Filled heart + "Saved" tooltip if `isSaved(propertyKey)`
- Click toggles: if not saved, saves with the deal's current effective underwriting; if saved, navigates to the saved deal detail (no destructive toggle from the grid — unsave is detail-page only to avoid accidents)

No other grid redesign.

## 5. New Saved Deals destination

Route: `/portal/investor/deals/saved` → new page `PortalSavedDeals.tsx`.

- Added to `PortalDealsHub` as a 4th hub card ("My Saved Deals", count = saved rows)
- Same trading-card layout as MLS Deals (reuses the card markup — extract `DealCard` from `PortalMlsDeals` into `src/components/portal/DealCard.tsx` so MLS / Wholesale / Alerts / Saved all share it)
- Card shows: primary saved photo, address, beds/baths/sqft, key metrics from the saved underwriting snapshot, saved date, source tags
- Click → opens detail page in "saved view" mode (loads from `saved_deals` instead of live deal source)
- Lightweight controls: search (address/city/zip), sort (saved date, price, address), filter by source tag + zip

Detail page routing: extend `PortalDealDetail` to accept either a live deal id or a saved-deal id. Use route `deals/saved/:savedId` so saved view is unambiguous and survives the source listing disappearing.

## 6. Deal Analyzer pass-through

`src/components/portal/DealAnalyzer.tsx` + `PortalAnalyzer.tsx`:

- Add `mlsId` and `sourceTags` to the property details form/state
- "Open in Deal Analyzer" links from detail page pass current (possibly edited) underwriting + `mlsId` + tags via query string

No major Analyzer expansion. Analyzer remains the secondary manual tool.

## 7. Check MLS Updates

On saved-deal detail page only:

- Button "Check MLS Updates" → calls existing single-listing Repliers fetch (already used in search)
- Renders a small diff card: status, list price, DOM, photo count, remarks-change indicator
- Does NOT mutate saved underwriting, does NOT re-run AI, does NOT change photos
- Investor can manually copy values into editable fields if desired, then Update Saved Deal

## 8. Out of scope (explicitly excluded)

Pipelines, kanban, reminders, messaging, tasks, activity feed, follow-up automation, multiple scenarios per property, branching versions, autosave, subscription/billing, reference-plus-overrides syncing, full Analyzer rebuild.

## Technical notes

```text
saved_deals (user_id, property_key UNIQUE) ──┐
                                             │
PortalDealDetail ──┬── live mode  (deal from useDeals)
                   └── saved mode (row from useSavedDeals)
                                             │
DealUnderwritingPanel ── local edit state ───┤
                                             ├── Save / Update / Unsave
DealCard (shared) ─── heart toggle ──────────┘
```

Reused: existing screening math, `RepairBreakdownPanel`, action buttons, status badges, photo gallery, formatters.

New files:
- `supabase/migrations/<ts>_saved_deals.sql`
- `src/lib/savedDeals.ts`
- `src/hooks/useSavedDeals.tsx`
- `src/components/portal/DealCard.tsx` (extracted)
- `src/components/portal/DealUnderwritingPanel.tsx`
- `src/components/portal/SaveDealBar.tsx`
- `src/pages/portal/PortalSavedDeals.tsx`

Edited:
- `PortalDealDetail.tsx` (live + saved modes, integrate underwriting panel)
- `PortalDealsHub.tsx` (4th card)
- `PortalMlsDeals.tsx`, `PortalWholesaleDeals.tsx`, `PortalDealAlerts.tsx` (use shared DealCard + heart)
- `App.tsx` (new routes: `deals/saved`, `deals/saved/:savedId`)
- `InvestorPortalLayout.tsx` — no change required; Deals hub already in nav
- `DealAnalyzer.tsx` + `PortalAnalyzer.tsx` (mlsId + sourceTags pass-through)

## Acceptance check
- Save from each of MLS / Wholesale / Alerts grids ✓
- My Saved Deals hub destination + grid ✓
- Snapshot persistence (survives MLS change) ✓
- One copy per investor/property (unique constraint) ✓
- Detail-page underwriting editing + collapsible repair breakdown ✓
- Auto-recalc of totals & metrics ✓
- Explicit Save / Update Saved Deal with unsaved-changes prompt ✓
- Action buttons + Analyzer/Section 8 links preserved ✓
- Check MLS Updates without overwriting underwriting ✓
- Search/sort/filter on Saved Deals ✓
- Deal Analyzer remains manual/secondary; gains mlsId + tags ✓
- No CRM scope introduced ✓
