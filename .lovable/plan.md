## Goal
Replace the ZIP-heuristic `arv_system` in screening with a comp-based ARV computed from Repliers sold comps. Keep the existing screening workflow, formulas, repair logic, and UI shells intact — only swap the source of system ARV and add a collapsible "Show comps" panel. Comp selection is a **strict two-stage process** (strong-pool first, controlled fallback) and ARV is built **tier-first**, not by flat numeric rank.

## Files to change
1. `supabase/functions/fetch-mls-listings/index.ts` — add a `mode: "comps"` branch (sold-only Repliers search around subject lat/long with bracketed beds/baths/sqft/recency). Returns normalized comps with: soldPrice, soldDate, listDate, DOM, lat/long, address, beds, baths, sqft (above grade), yearBuilt, style/stories, subdivision, schoolDistrict, basement/garage/lot, `lastStatus`, remarks. Existing search behavior untouched.
2. **New** `supabase/functions/fetch-comp-arv/index.ts` — single endpoint called by the client. Takes subject; calls Repliers; runs eligibility → strong-pool scoring → tier-first selection → adjustments → ARV bands → confidence; returns `{ arv:{conservative,likely,aggressive}, confidence, tierCounts, comps[], excluded[], fallbackUsed[], reasons }`. Server-side keeps the key off the client.
3. **New** `src/lib/compArv.ts` — pure TS module duplicating the engine for local re-runs on user edits (include/exclude, adjustment tweaks). Hook calls server once, then this module re-scores locally.
4. **New** `src/types/compArv.ts` — `Comp`, `CompScore`, `CompTier`, `CompArvResult`, `Adjustments`, `ConfidenceBreakdown`.
5. **New** `src/hooks/useCompArv.tsx` — `{ result, isLoading, error, run(subject), recompute(localOverrides) }`.
6. `src/lib/screening.ts` —
   - Keep `estimateSystemArv` as **heuristic fallback only** (internal rename `estimateSystemArvHeuristic`, thin export retained).
   - Extend `Deal` with optional `arv_comp?`, `arv_confidence?` (0–100), `arv_source?: "comps" | "heuristic"`.
   - `createDeal` uses `arv_comp` when present → `arv_system = arv_comp`, `arv_source = "comps"`; else heuristic. Downstream math (`arv_effective`, `passes_flip/brrrr/turnkey`, `strategy`, `buyer_visible`) is **unchanged**.
7. `src/components/portal/DealAnalyzer.tsx` — fire `useCompArv.run()` once subject is valid, feed `arv_comp + arv_confidence` into the existing screening call. Compact strip: `System ARV $X · Confidence 78 (Reasonable) · Source: Comps · [Show comps ▾]`. If `arv_override` set, badge `User ARV driving screening`.
8. **New** `src/components/portal/CompArvPanel.tsx` — collapsible. Sections: *Tier summary* (Strong/Good/Fallback counts), *Included comps* (address, dist, beds/baths, style, sqft, sold $, $/sf, adjusted $, tier badge, score, include/exclude), expandable row showing score breakdown + adjustments, *Excluded comps* (with reason chip), *Confidence drivers*, *ARV bands*. Edits → `useCompArv.recompute()`.
9. `src/components/portal/BatchAnalysisTable.tsx` — fire `fetch-comp-arv` per row with concurrency cap 4. Show ARV/Conf cell. No inline comp panel.
10. `src/pages/portal/PortalSearchAnalyzer.tsx` — pass comp ARV through to existing DealAnalyzer / batch view. No top-level UI change.
11. `src/hooks/useMlsSearch.tsx` — unchanged.
12. `supabase/migrations/*` — none in phase 1. Local state + sessionStorage.

## Data flow
```text
Subject inputs (analyzer)
        │
        ▼
useCompArv.run(subject)
        │
        ▼
supabase.functions.invoke("fetch-comp-arv")
        │  ├─► fetch-mls-listings (mode:"comps") ─► Repliers /listings (sold)
        │  └─► lib/compArv: eligibility → strong pool → tier-first → adjust → bands → confidence
        ▼
{ arv, confidence, tierCounts, comps, excluded, fallbackUsed }
        │
        ├─► DealAnalyzer → createDeal({arv_comp, arv_confidence}) → unchanged screening math
        └─► CompArvPanel (collapsed) → user edits → useCompArv.recompute() (local)
```

## Two-stage comp selection (revised, stricter)

### Stage 1 — Strong-pool eligibility (run first, no fallback yet)
A comp enters the **strong pool** only if **all** of the following hold:
- Sold, class=residential, same broad property type
- Distance ≤ **0.5 mi**
- Sold within last **6 months**
- **Exact bedroom match**
- **Exact bathroom match**
- **Same style / story count** (ranch=ranch, 2-story=2-story, split=split)
- Same school district (when subject school district is known)
- Same subdivision/neighborhood when subject's is known
- Sqft within tighter of **±200 sqft or ±15%**
- Not flagged as confirmed non-arms-length (see "Soft exclusions" below — only **hard** flags exclude here)

Hard exclusions (Stage 1 and Stage 2): `lastStatus` in `{REO, Foreclosure, Short Sale, Auction}` from Repliers, or sale-type/financing fields that confirm distress. Family/inter-investor transfers when explicitly flagged.

### Stage 2 — Controlled fallback (only when strong pool has < 3 comps)
Expand in this fixed order, stopping as soon as we reach 3+ Good-or-better comps. Each expansion is recorded in `fallbackUsed[]` and reduces confidence.
1. Widen distance 0.5 → 0.75 mi
2. Widen distance 0.75 → 1.0 mi (**never auto-expand past 1.0 mi**)
3. Allow same subdivision unknown / loosen neighborhood match
4. Allow ±1 bathroom mismatch
5. Allow ±1 bedroom mismatch
6. Allow sqft up to ±25% (still capped well below current heuristic)
7. Extend recency 6 → 9 months
8. Extend recency 9 → 12 months
9. Allow cross-style as last resort

Hard caps that never relax automatically: > 1.0 mi, > 12 mo, > ±1 bed, > ±1 bath, cross property-type, hard distress flags.

## Tier-first ARV selection (replaces "top N by score")

Each surviving comp gets a **tier label** based on which stage it qualified in plus its score:
- **Strong** — passed Stage 1 and score ≥ 80
- **Good** — passed Stage 1 with score 65–79, OR passed Stage 2 with score ≥ 80 *and* at most one fallback step used
- **Fallback** — passed Stage 2 with score 55–79, or required 2+ fallback steps
- **Weak Support** — score 40–54
- **Excluded** — < 40 or hard-exclusion flag

**ARV is built tier-first, not score-first:**
- If **≥ 3 Strong** comps → use Strong only (target 3–5). Good/Fallback comps are shown for transparency but do not influence ARV.
- Else if Strong + Good combined ≥ 3 → use Strong + Good (Strong weighted ~2× Good).
- Else if Strong + Good + Fallback ≥ 3 → use those, with Fallback weighted ~0.5× Good.
- Else → return no comp ARV; DealAnalyzer falls back to heuristic and badges low confidence.

Within the chosen tier set: weighted mean of adjusted values (weights = score × tier multiplier) = **Likely ARV**. **Conservative** = 25th percentile, **Aggressive** = 75th percentile of adjusted values. Likely ARV drives screening.

## Weighted score (0–100) — used for ranking within a tier, not for tier assignment
Rebalanced to give style/stories real weight and to demote ZIP relative to neighborhood/school:

- Distance: **18**
- School district match: **14**
- Subdivision / neighborhood match: **14**  *(beats ZIP — same-neighborhood-bordering-ZIP can outrank farther-same-ZIP)*
- Bedrooms (exact vs ±1): **10**
- Bathrooms (exact vs ±1): **10**
- Square footage: **9**
- **Style / story count: 9** *(broken out; no longer bundled with year built)*
- Sale recency: **8**
- Condition / finish similarity: **5**  *(reduced — finish certainty is often weak)*
- Basement / garage / lot utility: **3**

ZIP match is a tiebreaker only — it does not get its own weight. Subdivision/neighborhood always outranks bare ZIP.

## Penalties (subtract from score AND from confidence)
- Different school district: **−15**
- Cross-style / different story count: **−12**
- Bath mismatch (allowed only in fallback): **−10**
- Bed mismatch (allowed only in fallback): **−10**
- Sqft delta > 20%: **−8**
- Confirmed non-arms-length (hard flag): excluded entirely
- Soft remarks signal (`as-is`, `estate sale`, `investor`, `TLC`, `cash only`, `handyman`): **−5 review-flag**, *not auto-exclude*. UI shows a "Review: distress language" chip. Only excludes if combined with another distress signal (e.g. `lastStatus=Foreclosure`, sale price < 70% of neighborhood median).
- Each fallback step that brought this comp in: **−5**
- Missing key field (school district, style, sqft): **−5 each**

## Condition / finish handling (cautious)
- Subject inputs (editable in CompArvPanel): current condition, **intended after-repair condition**, rehab quality tier (rental-grade / standard retail / premium retail).
- Comp condition is **inferred** from list price vs neighborhood median $/sf, sold-vs-list ratio, DOM, and remarks keywords. This is explicitly labeled "inferred" in the UI and is **editable per comp**.
- Adjustment: Rental −10%, Standard 0%, Premium +8% applied to comp's adjusted value.
- **Confidence rule:** if condition was inferred (not user-confirmed) for ≥ half of included comps, subtract **−10 from confidence** and tag drivers list with "Finish certainty weak".

## Adjustments (applied to comp sold price → adjusted comp value)
- Sqft delta × adjusted $/sf — capped at **50% of comp's $/sf** to avoid runaway.
- Bed delta × $5k (configurable).
- Bath delta × $4k per half-bath (configurable).
- Garage delta × $6k per bay.
- Basement finish delta × $25/sf finished.
- Time adjustment: 0.3%/mo since sale, capped 6%.
- Condition/finish: per tier above, editable.
- Location/stigma: editable −/+%.

## Confidence (0–100)
Start at 100, subtract:
- Fewer than 5 included comps: −5 per missing (down to 3)
- Avg score < 70: −15; avg score < 55: −30 (instead, not additive)
- Top comps span > 1 school district: −10
- Spread of adjusted values > 20%: −10
- Each fallback expansion used: −5
- No fully arms-length sales among top 3: −15
- Subject school district unknown: −5
- Finish certainty weak (see Condition rule): −10
- Tier-driven floor: if ARV is built from Fallback-tier-only, **cap confidence at 55**. If from Good tier only, cap at 80. Strong tier has no cap.

Bands: ≥85 Strong, 70–84 Reasonable, 50–69 Use Caution, <50 Weak Support.

If confidence < 50 OR < 3 usable comps → DealAnalyzer uses `estimateSystemArvHeuristic` and badges "Heuristic ARV — low comp support".

## API / schema impact
- New edge function `fetch-comp-arv` (default `verify_jwt = false`, same pattern as `fetch-mls-listings`).
- `fetch-mls-listings` gains a `mode=comps` branch; existing behavior unchanged.
- No DB migrations in phase 1. `src/integrations/supabase/types.ts` untouched.
- Phase 2 (deferred): `comp_reports` table for persistent comp selections, overrides, notes.

## Implementation order
1. Types + pure logic (`src/types/compArv.ts`, `src/lib/compArv.ts`) + unit tests in `src/test/compArv.test.ts` covering: strong-pool selection, fallback ordering, tier-first ARV, penalty math, confidence caps.
2. Extend `fetch-mls-listings` with sold-comp search; add `fetch-comp-arv`.
3. `useCompArv` hook.
4. Wire `DealAnalyzer`: feed `arv_comp` into existing screening, add ARV/confidence strip + Show comps trigger.
5. Build `CompArvPanel` (read-only first; then include/exclude + adjustment + condition edits via `recompute`).
6. `BatchAnalysisTable` per-row ARV with concurrency cap.
7. Extend `Deal` fields; keep heuristic as fallback in `screening.ts`.

## Out of scope (phase 2)
Persistent comp reports, admin overrides table, server-side comp cache beyond short in-memory LRU, photo-vision condition inference, external school-district lookups when Repliers lacks them.