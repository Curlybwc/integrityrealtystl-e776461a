
# Phase 1: Evidence-Based Repair Estimation (Revised)

Replaces price/ARV/discount-driven `estimateRehabTier` with photo+remarks evidence from MLS, analyzed by OpenAI Vision in an edge function, priced deterministically by an admin-editable pricing library, cached globally per listing version, and surfaced as a single repair number that feeds MAO.

## 1. Schema

### `repair_pricing_rules` (admin-editable, versioned)
- `id`, `version` int, `is_active` bool, `created_by`, `created_at`
- `rules` jsonb — keyed library (cost per cabinet, kitchen fallback, kitchen light, full_bath_replace, half_bath_replace, bath_refresh, roof_per_square, flooring_per_sqft, paint_drywall_per_sqft, hvac, water_heater, appliances{stove,fridge,microwave,dishwasher}, dumpster, plumbing_stack, foundation_reserve, basement_water_reserve, landscaping, misc_reserve, gut_per_sqft_low/high, gut thresholds)
- RLS: read = any authenticated; write = admin only.

### `repair_analyses` (shared cache; one active per listing version)
- `id`, `mls_listing_id` text, `evidence_hash` text, `is_active` bool
- `analysis_status`: `pending | analyzing | complete | failed | quota_blocked`
- `observations` jsonb (raw AI output)
- `line_items` jsonb (priced breakdown)
- `total_repair_estimate` numeric
- `gut_rehab_mode` bool
- `pricing_version` int
- `engine_version` text, `model` text
- `photo_count_analyzed` int, `evidence_snapshot` jsonb
- `requested_by` uuid (audit), `priority` int (1=admin/system, 2=user), `failure_reason` text
- **Override fields (in-place, no separate table):** `overridden_by` uuid null, `overridden_at` timestamptz null
- `created_at`, `updated_at`, `analyzed_at`
- Indexes: partial unique `(mls_listing_id) where is_active`, `(analysis_status, priority, created_at desc)` for worker queue.
- RLS: read = any authenticated; insert/update = service role + admin override path.

### `ai_analysis_quota`
- `user_id`, `month_key` (`YYYY-MM`), `count` int, `monthly_limit` int default 200, `updated_at`
- Unique `(user_id, month_key)`. Read own / admin all.

## 2. Edge functions

### `analyze-repairs` (POST, JWT-verified)
Input: `{ mlsListingId, source: 'user'|'admin'|'system_core' }`.
1. Load listing snapshot.
2. Compute `evidence_hash`. If active row with same hash and status `complete|pending|analyzing` → return it (idempotent — no new row, no requeue).
3. If status `failed` with same hash and older than retry window → allow re-enqueue.
4. **Quota for `source='user'`:** check `ai_analysis_quota` for current month.
   - If exceeded: **look up existing active `quota_blocked` row for this mls_listing_id from this user in current month**. If found → return it. Otherwise insert one `quota_blocked` row (no quota increment, no enqueue) and return.
5. Otherwise insert active row `status='pending'`, set priority (1 admin/system, 2 user), increment quota when `source='user'`, fire-and-forget invoke `process-repair-queue`, return pending row.

### `process-repair-queue` (service-role internal)
Worker pulls up to N pending rows ordered by `priority asc, created_at desc`:
1. Mark `analyzing`.
2. Fetch listing photos. **Cap at 12 max** — prefer kitchen/bath/exterior/basement/main living by title heuristics; else first 12. **Pass existing MLS image URLs directly to OpenAI** (`image_url`). No server-side resizing in Phase 1.
3. Single OpenAI Vision call (`gpt-4o-mini` default, configurable) with `response_format: json_schema` enforcing the observations schema. Includes remarks, sqft, beds, baths, basement, year_built in the user prompt.
4. Validate with Zod. On failure → `status='failed'`, `failure_reason`.
5. Run deterministic `priceRepairs(observations, sqft, mlsBaths, rules)` → line items + total. Apply remarks suppressors (new roof/hvac/furnace/water heater zero those lines unless contradicted by photos). Cap bath scope count by MLS baths. Gut-rehab branch when `gut_rehab_severity='high'`: ignore line items, use `gut_per_sqft * sqft` plus foundation/basement reserves if flagged.
6. Persist line_items, total, `gut_rehab_mode`, `pricing_version`, `analyzed_at`, `status='complete'`.

### `admin-update-repair-pricing` (admin only)
Insert new pricing version with `is_active=true`, flip prior active false. Existing analyses untouched.

### `admin-override-repair-analysis` (admin only)
**In-place update of the active analysis row.** Updates `line_items`, `total_repair_estimate`, sets `overridden_by`, `overridden_at`. No separate history table in Phase 1.

## 3. Material change / re-analysis

Re-analysis happens **only when `evidence_hash` differs**:
- sorted photo URL list (or count + first/last filename)
- normalized remarks (lowercased, whitespace-collapsed, first 2000 chars)
- sqft, beds, baths, basement flag

Price/DOM/status changes never alter the hash. **No manual refresh UI in DealAnalyzer.** Re-analysis is automatic when the next `analyze-repairs` call detects a hash mismatch (it then archives the old row `is_active=false` and inserts a new pending row).

## 4. Frontend changes

### `src/lib/screening.ts`
- Remove price-derived tier from screening gates.
- `rehab_est_effective` = `rehab_est_override ?? repair_analysis.total_repair_estimate ?? null`.
- When null: return `analysis_pending: true`; do **not** compute MAO, all_in_pct_of_arv, passes_flip/brrrr/turnkey, or buyer_visible.
- `rehab_tier_effective` becomes informational, not a gate.

### New `src/lib/repairAnalysis.ts` + `src/hooks/useRepairAnalysis.tsx`
- Query active `repair_analyses` row by `mls_listing_id`. If missing, call `analyze-repairs`.
- Realtime subscription on `repair_analyses` row → flip pending → complete in UI.
- Helpers: `formatRepairBreakdown`, `isAnalysisPending`, `quotaState`.

### `src/pages/portal/PortalSearchAnalyzer.tsx` + `BatchAnalysisTable.tsx`
- Hydrate each row from cache.
- Complete → repair total, breakdown popover, MAO, screening badges.
- Pending/analyzing/failed/quota_blocked → "Repair Analysis Pending" (or quota message), hide MAO and strategy badges.
- On render of uncached rows, batch-enqueue via `analyze-repairs` (`source='user'`). Server enforces quota and dedupes blocked rows.
- Quota chip (`X / 200 this month`).

### `src/components/portal/DealAnalyzer.tsx`
- Replace Light/Medium/Heavy tier selector with read-only `RepairBreakdownPanel` driven by `useRepairAnalysis`.
- Keep manual dollar override (`rehab_est_override`) as-is.
- **No "Refresh analysis" button.**

### `src/pages/admin-portal/AdminSettings.tsx`
- New "Repair Pricing Library" section bound to active `repair_pricing_rules`. Save → new version.

### `src/pages/admin-portal/AdminDealPot.tsx`
- Inline line-item editor → `admin-override-repair-analysis` (updates active row in place).

## 5. Priority queue / ingestion

- Daily 5am Repliers harvest calls `analyze-repairs` with `source='system_core'` (priority=1) for newly ingested core-zip listings.
- `process-repair-queue` runs via 2-minute cron (priority 1 first) plus fire-and-forget kick from `analyze-repairs`.

## 6. OpenAI observations schema (Zod, strict JSON)

```
{
  kitchen: { condition: 'good'|'dated_oak'|'damaged'|'missing', cabinet_count_estimate?: number, scope: 'keep'|'light'|'replace' },
  bathrooms: [{ type: 'full'|'half', scope: 'keep'|'refresh'|'partial'|'replace' }],
  flooring: { pct_replace: 0..1, type_hint?: string },
  paint_drywall: { pct_paint: 0..1, drywall_damage: 'none'|'patching'|'widespread' },
  roof: { needs_replacement: bool, contradicted_by_photos: bool },
  hvac: { needs_replacement: bool, contradicted_by_photos: bool },
  water_heater: { needs_replacement: bool, contradicted_by_photos: bool },
  appliances_missing: ('stove'|'fridge'|'microwave'|'dishwasher')[],
  plumbing_stack: { failure_evidence: bool },
  foundation: { concern: 'none'|'monitor'|'major' },
  basement: { water_intrusion: 'none'|'minor'|'major', packed_with_contents: bool },
  cleanout: { dumpsters_estimate: number },
  landscaping: { scope: 'none'|'light'|'heavy' },
  windows: { obvious_failure_count: number },
  gut_rehab_severity: 'none'|'partial'|'high',
  remarks_signals: { new_roof: bool, new_hvac: bool, new_furnace: bool, new_water_heater: bool, cash_only: bool, full_rehab: bool, no_utilities: bool, sewer_problem: bool }
}
```
**No free-text `notes` field.**

## 7. Secrets

Requires `OPENAI_API_KEY` (will request via `add_secret` if missing at implementation time).

## 8. Acceptance verification

- Underpriced light-cosmetic property → low repair total, MAO independent of price.
- Trashed same-price property → high repair total, MAO drops, flip fails.
- "New roof" in remarks → roof line = $0.
- Hoarder photos → cleanout dumpsters scale with packed rooms.
- Price drop alone → MAO recalcs, no new AI call (verify `analyzed_at` unchanged).
- New photos → `evidence_hash` flips, new active row, old archived.
- User hits 200 cap, repeatedly searches same uncached listing → **one** `quota_blocked` row reused, not duplicated.
- Admin pricing update → only future analyses use new version.

## 9. Files

**New:**
- `supabase/migrations/<ts>_repair_estimation_phase1.sql`
- `supabase/functions/analyze-repairs/index.ts`
- `supabase/functions/process-repair-queue/index.ts`
- `supabase/functions/admin-update-repair-pricing/index.ts`
- `supabase/functions/admin-override-repair-analysis/index.ts`
- `src/lib/repairAnalysis.ts`
- `src/lib/repairPricing.ts` (shape mirrored in edge function — engine source-of-truth lives server-side)
- `src/hooks/useRepairAnalysis.tsx`
- `src/components/portal/RepairBreakdownPanel.tsx`
- `src/components/admin-portal/RepairPricingEditor.tsx`

**Modified:**
- `src/lib/screening.ts`
- `src/components/portal/DealAnalyzer.tsx`
- `src/components/portal/BatchAnalysisTable.tsx`
- `src/pages/portal/PortalSearchAnalyzer.tsx`
- `src/pages/admin-portal/AdminSettings.tsx`
- `src/pages/admin-portal/AdminDealPot.tsx`
- `src/hooks/useDeals.tsx`

**Untouched:** comp ARV engine, RTP/ARV% thresholds, MLS fetch logic core.
