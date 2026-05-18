
# Phase 1 Repair Estimation — Remaining Checklist

Scope is strictly the 6 priorities in the request. No investor workspaces, CRM, billing, or price/ARV-derived rehab tiers.

## 1. Search/list integration

**`src/lib/repairAnalysis.ts`** — add `getRepairAnalysesForListings(mlsIds: string[])` that batch-fetches active rows from `repair_analyses` keyed by `mls_listing_id`. Returns `Map<mlsId, RepairAnalysisRow>`.

**`src/components/portal/BatchAnalysisTable.tsx`**
- On rows load: hydrate cache map via the batch fetch above.
- For each row, derive `repairState`:
  - `complete` → use `total_repair_estimate` for MAO
  - `pending` / `queued` → show "Analyzing repairs…" chip, hide MAO + strategy badges
  - `quota_blocked` → "Quota reached" chip, hide MAO + strategy badges
  - `failed` → "Repair analysis failed" chip (tooltip with failure_reason), hide MAO + strategy badges
  - `missing` → auto-enqueue via `analyze-repairs` (debounced batch call, max N parallel, respect quota response)
- Replace existing rehab tier column display with "Repairs" column showing `$total` or status chip.
- Realtime: subscribe once to `repair_analyses` filtered by the page's visible mls_listing_ids; update map on change.

**`src/pages/portal/PortalSearchAnalyzer.tsx`** (or wherever the analyzer header lives)
- Add a quota chip: "AI repair analysis: X / 200 this month" sourced from `ai_analysis_quota` for current user. Turns warning color at ≥80%, destructive at 100%.

## 2. Explicit screening state

**`src/lib/screening.ts`**
- Add `analysis_pending: boolean` to the screening result type.
- Compute `analysis_pending = repair_analysis_status !== 'complete' && rehab_est_override == null`.
- When `analysis_pending` is true: skip MAO, RTP, ARV%, deal-tier badges; return them as `null` (not zero, not estimated).
- Remove any remaining code paths that infer rehab from price, ARV, or discount.
- `rehab_est_effective = rehab_est_override ?? repair_analysis.total_repair_estimate ?? null`.

Callers (`BatchAnalysisTable`, `DealAnalyzer`, `ListingCard`) read `analysis_pending` to decide whether to render MAO/strategy UI.

## 3. Admin pricing visibility

**`src/components/admin-portal/AdminSettings.tsx`** — mount the existing `RepairPricingEditor` under a "Repair Pricing Library" section (admin-gated already by route). No new logic.

## 4. Remove legacy rehab tier UI

**`src/components/portal/DealAnalyzer.tsx`**
- Remove the Light/Medium/Heavy rehab tier `<Select>` and any handlers writing to a tier field.
- Keep the manual dollar override input (`rehab_est_override`).
- Repair section renders: `RepairBreakdownPanel` (AI) + dollar override input. That's it.
- Remove dead imports / tier constants.

Search for and remove any remaining `rehab_tier` references in UI only (do not touch unrelated history/persistence fields if they exist for legacy data).

## 5. Admin global override

**New edge function `supabase/functions/admin-override-repair-analysis/index.ts`**
- Auth: verify caller has admin role via `has_role`.
- Input (Zod): `{ mls_listing_id, line_items: Record<string, number>, gut_rehab_mode?: boolean, notes?: string }`.
- Recompute `total_repair_estimate = sum(line_items)`.
- Update the active `repair_analyses` row in place; set `overridden_by = caller`, `overridden_at = now()`, `analysis_status = 'complete'`.
- Return updated row.

**`src/components/admin-portal/AdminDealPot.tsx`** — inline editor on a deal row:
- Expand row → show current line items as editable number inputs + gut-rehab toggle.
- Save → invoke `admin-override-repair-analysis`.
- Show "Overridden by {admin} on {date}" badge when `overridden_at` present.

## 6. Background automation

**Cron** (via `supabase--insert` SQL, not migration — contains URL/anon key):
- Enable `pg_cron`, `pg_net` if needed.
- Schedule `process-repair-queue` every 2 minutes.

**Ingestion hook** — in the existing daily Repliers harvest edge function, after inserting/updating a listing, call `analyze-repairs` with `requested_by = null` and a `source: 'system_core'` flag so it bypasses user quota and populates the shared cache. Add a `system_core` branch in `analyze-repairs` that skips `ai_analysis_quota` writes.

## Files

**New**
- `supabase/functions/admin-override-repair-analysis/index.ts`

**Edit**
- `src/lib/repairAnalysis.ts` (batch fetch)
- `src/lib/screening.ts` (analysis_pending)
- `src/components/portal/BatchAnalysisTable.tsx`
- `src/components/portal/DealAnalyzer.tsx` (drop tier dropdown)
- `src/pages/portal/PortalSearchAnalyzer.tsx` (quota chip)
- `src/components/admin-portal/AdminSettings.tsx` (mount editor)
- `src/components/admin-portal/AdminDealPot.tsx` (override editor)
- `supabase/functions/analyze-repairs/index.ts` (system_core branch)
- Daily harvest edge function (enqueue hook)

**SQL (via insert tool, not migration)**
- pg_cron schedule for `process-repair-queue`

## Order of execution

1. `screening.ts` analysis_pending (foundation for #1)
2. `repairAnalysis.ts` batch fetch + `BatchAnalysisTable` hydration/states
3. Quota chip in PortalSearchAnalyzer
4. Mount RepairPricingEditor
5. Remove legacy tier dropdown in DealAnalyzer
6. admin-override edge function + AdminDealPot editor
7. Cron + ingestion hook last

## AI interface isolation

`process-repair-queue` already wraps Gemini behind a single `callVisionModel()` function. Keep that boundary; do not leak provider specifics into pricing or screening code.
