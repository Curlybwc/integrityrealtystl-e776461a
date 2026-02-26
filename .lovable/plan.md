

# Plan: Add Debug Logging and Redeploy Edge Function

## Findings

Both RAW REPLIERS LISTING log statements are **already present** in the deployed code at:
- **Line 198-200**: `fetchSingleZip` path
- **Line 303-305**: single-ZIP path

The logs not appearing suggests the function may not have been redeployed after the last edit, or Cloud logs are truncating large payloads.

## Changes

### `supabase/functions/fetch-mls-listings/index.ts`

**1. fetchSingleZip path (after line 196)**

Insert a debug marker immediately after `const data = await response.json();`:

```typescript
  const data = await response.json();
  console.log("DEBUG: After Repliers JSON parse (fetchSingleZip)");
  console.log(`ZIP ${zip}: count=${data.count}, listings=${(data.listings || []).length}`);
```

No other changes to this block — the RAW REPLIERS LISTING log on lines 198-200 stays as-is.

**2. Single-ZIP path (after line 301)**

Insert a debug marker immediately after `const data = await response.json();`:

```typescript
      const data = await response.json();
      console.log("DEBUG: After Repliers JSON parse (single-ZIP)");
      console.log(`Repliers response: count=${data.count}, ...`);
```

No other changes — the RAW REPLIERS LISTING log on lines 303-305 stays as-is.

## What this confirms

After redeployment, running a search should show:
1. `DEBUG: After Repliers JSON parse (...)` — proves the code path executed
2. `RAW REPLIERS LISTING [0]: {...}` — the full raw payload

If only the DEBUG line appears but not the RAW line, the payload is being truncated by the log system, and we may need to log specific fields instead of the full JSON.

## Files NOT modified
- Normalization logic, response structure, frontend code

