

# Fix Plan: Resolve All Build Errors

There are **three categories** of errors breaking the build. Here's the minimal fix for each:

## 1. Fix component import paths (4 files)

Components exist at `src/components/portal/` but pages import from `src/components/portal/investor/` (a path that doesn't exist).

| File | Bad import | Fix to |
|------|-----------|--------|
| `src/pages/portal/PortalAnalyzer.tsx` | `@/components/portal/investor/DealAnalyzer` | `@/components/portal/DealAnalyzer` |
| `src/pages/portal/PortalResources.tsx` | `@/components/portal/investor/UtilityAllowanceCalculator` | `@/components/portal/UtilityAllowanceCalculator` |
| `src/pages/portal/PortalSearchAnalyzer.tsx` | `@/components/portal/investor/BatchAnalysisTable` | `@/components/portal/BatchAnalysisTable` |
| `src/pages/portal/PortalSection8Calculator.tsx` | `@/components/portal/investor/Section8Calculator` | `@/components/portal/Section8Calculator` |

## 2. Fix AdminPortalLayout.tsx — undefined `user` variable

Lines 121/124 reference `user.name` and `user.email` but no `user` variable is declared. The layout uses `session` from Supabase auth. Fix: replace `user.name` with `session?.user?.email?.split("@")[0] ?? "Admin"` and `user.email` with `session?.user?.email ?? ""`.

## 3. Fix admin pages referencing non-existent DB tables/functions

These pages reference tables (`portal_access_requests`, `admin_audit_log`, `profiles`) and RPC functions (`admin_list_users`, `admin_review_access_request`, etc.) that don't exist in the database. Two options:

**Option A (recommended):** Replace the Supabase calls with placeholder/stub implementations that show "Coming soon" or empty states, so the pages render without errors. This unblocks the build immediately.

**Option B:** Remove the broken admin pages from routing entirely and restore the original admin portal routes (Dashboard, Deal Pot, MLS Import, Settings only).

## 4. Fix edge function type errors

In `supabase/functions/fetch-mls-listings/index.ts`, two `catch` blocks use untyped error variables. Fix: cast to `(e as Error).message` on lines 73 and 329.

## Summary

| Change | Files affected |
|--------|---------------|
| Fix import paths | 4 page files |
| Fix `user` variable | `AdminPortalLayout.tsx` |
| Stub or remove broken admin pages | `AdminApprovals.tsx`, `AdminAuditLog.tsx`, `AdminUsers.tsx`, `AdminUserDetail.tsx` + `App.tsx` routes |
| Fix edge function types | `fetch-mls-listings/index.ts` |

This is purely a build-fix pass — no new features, no schema changes.

