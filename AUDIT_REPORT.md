# Reliability / Fragility / Consistency Audit

## Executive summary
- The app is currently structured as a frontend-heavy mock/demo with hard-coded auth behavior for protected areas, minimal runtime data validation, and very limited automated test coverage.
- Highest confirmed break risks are around portal access control consistency, data persistence edge cases in local mock state, and untyped/unvalidated API payload handling.
- Several risks are acceptable for mockups but fragile if this is expected to run in production.

## Highest-risk breakpoints

### 1) Portal auth is inconsistent and effectively bypassed in multiple portal layouts
- **Severity:** high
- **Confidence:** confirmed
- **Files:**
  - `src/components/portal/InvestorPortalLayout.tsx`
  - `src/components/wholesaler-portal/WholesalerPortalLayout.tsx`
  - `src/components/partner-portal/PartnerPortalLayout.tsx`
  - `src/components/admin-portal/AdminPortalLayout.tsx`
- **Code smell / weakness:**
  - Investor and wholesaler layouts use a mock hook where `isAuthenticated` is hardcoded `true`.
  - Partner and admin layouts do not perform any auth guard at all.
- **Why risky:**
  - Route-level access behavior is contradictory across portals and can create accidental open access assumptions in production.
- **Smallest safe fix:**
  - Create one shared `usePortalAuth` adapter with explicit mock mode flag (`VITE_ENABLE_MOCK_AUTH`) and consistent guard behavior across all portal layouts.
- **Apply now?:** yes (low-risk, high-value for consistency).
- **Regression test to add:**
  - Router test: unauthenticated user redirected from `/portal`, `/wholesaler-portal`, `/partner-portal`, `/admin`.

### 2) Deals persistence skips saving empty arrays
- **Severity:** medium
- **Confidence:** confirmed
- **File:** `src/hooks/useDeals.tsx`
- **Code smell / weakness:** saves are conditional on `deals.length > 0`.
- **Why risky:** if all deals are removed/reset to empty intentionally, latest state is not persisted and stale localStorage can reappear.
- **Smallest safe fix:** remove `deals.length > 0` guard and save any loaded state after initial load.
- **Apply now?:** yes.
- **Regression test to add:**
  - Hook test: setting deals to `[]` persists empty array to localStorage.

### 3) Edge function logs raw listing payloads and partial JSON
- **Severity:** medium
- **Confidence:** confirmed
- **File:** `supabase/functions/fetch-mls-listings/index.ts`
- **Code smell / weakness:** extensive `console.log` of raw listing objects and large JSON snippets.
- **Why risky:** noisy logs, potential leakage of data to function logs, difficult production observability.
- **Smallest safe fix:** gate verbose logs behind an env flag (`DEBUG_MLS_LOGS`) and keep only structured summary logs by default.
- **Apply now?:** yes.
- **Regression test to add:**
  - Edge-function unit/integration test (or static check) ensuring default response path does not call verbose logging.

## Inconsistencies / contradictions

### 4) Login pages imply auth, but portal access logic is not truly connected
- **Severity:** medium
- **Confidence:** confirmed
- **Files:**
  - `src/pages/Login.tsx`
  - `src/pages/WholesalerLogin.tsx`
  - `src/pages/PartnerLogin.tsx`
  - `src/pages/AdminLogin.tsx`
  - portal layout files above
- **Code smell / weakness:** login flows simulate credential checks/toasts but no shared session state is consumed by portals.
- **Why risky:** UX and architecture intent diverge; future edits likely drift.
- **Smallest safe fix:** centralize temporary mock session in one client store/context and read it in all portal guards.
- **Apply now?:** yes, if portal routes are intended to be protected.
- **Regression test to add:**
  - Login sets session state; logout clears it; protected route respects state.

### 5) Dual lockfiles (`package-lock.json`, `bun.lock`, `bun.lockb`)
- **Severity:** low
- **Confidence:** confirmed
- **Files:** root lockfiles
- **Code smell / weakness:** mixed package-manager artifacts.
- **Why risky:** dependency drift and irreproducible CI/local installs.
- **Smallest safe fix:** choose one package manager and remove other lockfiles.
- **Apply now?:** likely yes, after team decision.
- **Regression test to add:**
  - CI check that only approved lockfile exists.

## Type-safety / null-safety issues

### 6) `any` usage in API error handling and listing normalization
- **Severity:** medium
- **Confidence:** confirmed
- **Files:**
  - `src/hooks/useMlsSearch.tsx`
  - `supabase/functions/fetch-mls-listings/index.ts`
- **Code smell / weakness:** catches typed as `any`; listing normalization accepts `any` and assumes nested keys.
- **Why risky:** silent runtime shape mismatch and hidden undefined behavior.
- **Smallest safe fix:** use `unknown` in catches, narrow with guards, and add a zod schema (or lightweight validator) around function response before state updates.
- **Apply now?:** yes for frontend; likely yes for edge function.
- **Regression test to add:**
  - malformed payload test verifies graceful fallback + typed error state.

## Data-fetching and async risks

### 7) No cancellation/race handling in MLS search hook
- **Severity:** medium
- **Confidence:** likely inference
- **File:** `src/hooks/useMlsSearch.tsx`
- **Code smell / weakness:** overlapping search calls can race and latest UI may receive older response.
- **Why risky:** stale result rendering under rapid query changes.
- **Smallest safe fix:** track request token/id and ignore stale responses.
- **Apply now?:** yes if search can be triggered rapidly.
- **Regression test to add:**
  - simulated slow-fast request race where latest request wins.

### 8) ArcGIS enrichment timeout is fixed and global assumptions are hardcoded
- **Severity:** low
- **Confidence:** likely inference
- **File:** `supabase/functions/fetch-mls-listings/index.ts`
- **Code smell / weakness:** fixed 2s timeout and hardcoded zip list.
- **Why risky:** intermittent enrichment inconsistency and maintenance drift.
- **Smallest safe fix:** constants with comments + fallback telemetry counter.
- **Apply now?:** optional.
- **Regression test to add:**
  - timeout path returns valid listings with `sqft_source: "mls"`.

## Routing / navigation / access-flow risks

### 9) Path naming/portal behavior differs by audience with no shared guard abstraction
- **Severity:** low
- **Confidence:** confirmed
- **Files:** `src/App.tsx` + portal layout files
- **Code smell / weakness:** route structure is clear, but protection behavior differs by portal implementation.
- **Why risky:** future route additions may miss guard logic.
- **Smallest safe fix:** shared `ProtectedPortalRoute` wrapper.
- **Apply now?:** yes.
- **Regression test to add:**
  - route matrix test for all protected prefixes.

## Supabase / edge-function risks

### 10) Missing evidence for RLS/auth coupling and deploy-time env validation
- **Severity:** high (if production)
- **Confidence:** missing runtime evidence
- **Files:**
  - `src/integrations/supabase/client.ts`
  - `supabase/config.toml`
  - `supabase/functions/fetch-mls-listings/index.ts`
- **Missing evidence needed:**
  - actual Supabase project RLS policies,
  - function secrets configuration in deployed environments,
  - client auth/session usage expectations.
- **Smallest safe fix:** add deployment checklist + startup config assertions.
- **Apply now?:** yes for checklist/assertions; RLS changes require project access.
- **Regression test to add:**
  - CI smoke test for required env vars in build/deploy pipeline.

## Maintainability / duplication / dead code

### 11) Duplicate toast hook paths may confuse imports
- **Severity:** low
- **Confidence:** confirmed
- **Files:**
  - `src/hooks/use-toast.ts`
  - `src/components/ui/use-toast.ts`
- **Code smell / weakness:** two similarly named hooks create import ambiguity.
- **Why risky:** accidental mixed usage, inconsistent behavior over time.
- **Smallest safe fix:** consolidate to one source and re-export from a single path.
- **Apply now?:** yes.
- **Regression test to add:**
  - lint rule/path alias test preventing duplicate hook source usage.

## Test gaps
- Current tests are minimal and do not cover routing guards, form auth flows, hook persistence, or edge-function parsing behaviors.
- Priority missing tests:
  1. Protected route redirects.
  2. Login/session mock state round-trip.
  3. `useDeals` localStorage persistence edge cases.
  4. `useMlsSearch` error/race handling.
  5. Edge function normalization of partial payloads.

## Recommended fix order
1. Unify/enable deterministic portal auth guards.
2. Fix `useDeals` persistence edge case.
3. Add focused tests for auth + deals hook.
4. Harden MLS hook typing/race handling.
5. Reduce edge-function log verbosity and add payload-shape guards.
6. Clean package manager lockfile strategy.

## Confirmed vs likely vs missing-evidence index
- **Confirmed:** #1, #2, #3, #4, #5, #6, #9, #11
- **Likely inference:** #7, #8
- **Missing runtime evidence:** #10
