

# Plan: Add Raw Repliers Listing Logging

## Summary
Add temporary discovery logging to dump the first raw listing object in both code paths. No flags, no state, no logic changes.

## Changes

### `supabase/functions/fetch-mls-listings/index.ts`

**1. `fetchSingleZip` function (after line 197)**

After the existing `console.log` for ZIP count, insert:

```typescript
if (data?.listings?.length > 0) {
  console.log("RAW REPLIERS LISTING [0]:", JSON.stringify(data.listings[0], null, 2));
}
```

**2. Single-ZIP path (after line 299)**

After the existing `console.log` for Repliers response, insert:

```typescript
if (data?.listings?.length > 0) {
  console.log("RAW REPLIERS LISTING [0]:", JSON.stringify(data.listings[0], null, 2));
}
```

## Files NOT modified
- Normalization logic
- Response structure
- Frontend code
- Routing or screening

