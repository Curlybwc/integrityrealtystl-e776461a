

## Analysis of Build Errors

There are two distinct issues breaking the preview:

### Issue 1: Wrong import paths referencing a non-existent `investor` subdirectory

The build errors show four files importing from `@/components/portal/investor/...` but no such subdirectory exists. The components live directly in `@/components/portal/`. The files on disk currently show correct imports, which suggests a prior edit introduced the wrong paths and may not have been saved, or there's a build cache mismatch. Either way, these imports must use:
- `@/components/portal/DealAnalyzer` (not `investor/DealAnalyzer`)
- `@/components/portal/UtilityAllowanceCalculator` (not `investor/...`)
- `@/components/portal/BatchAnalysisTable` (not `investor/...`)
- `@/components/portal/Section8Calculator` (not `investor/...`)

**Affected files:** `PortalAnalyzer.tsx`, `PortalResources.tsx`, `PortalSearchAnalyzer.tsx`, `PortalSection8Calculator.tsx`

### Issue 2: `useUserRoles.ts` cannot find `user_roles` table in generated types

The hook queries `.from("user_roles")` but `src/integrations/supabase/types.ts` has empty table definitions (`[_ in never]: never`). The `user_roles` table migration exists but types were never regenerated.

**Fix:** Create the `user_roles` table via the migration tool (if not already applied), then the types will auto-regenerate. Alternatively, if the migration has already run, just triggering a types regeneration will resolve it.

### Plan

1. **Verify and fix all four import paths** in the portal page files to point to `@/components/portal/` (no `investor/` subdirectory).
2. **Apply the `user_roles` table migration** so the database schema includes the table and generated types update automatically.
3. **Rebuild** — these two fixes should clear all six build errors and restore the preview.

No other code changes needed for this fix.

