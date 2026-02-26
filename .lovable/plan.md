

# Plan: Open Portal Listings in New Tab

## Changes

### 1. `src/components/portal/ListingCard.tsx`

- Remove `useNavigate` import and `navigate` usage
- Replace the `<div className="relative cursor-pointer" onClick={...}>` wrapper (line 41) with an `<a>` tag that opens in a new tab:
  ```tsx
  <a
    href={`/portal/listing/${l.mls_listing_id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="relative block"
  >
  ```
- Close with `</a>` instead of `</div>`

### 2. `src/components/portal/BatchAnalysisTable.tsx`

- Remove `useNavigate` and the `goToListing` function (lines 59, 131-133)
- Replace the camera `<button>` in table view (lines 240-248) with an `<a>` tag:
  ```tsx
  <a
    href={`/portal/listing/${l.mls_listing_id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
    title="View listing"
  >
  ```
- Remove `onPhotoClick` prop from `<ListingCard>` (line 198) since ListingCard handles its own navigation now

### What stays the same

- Public routes untouched
- Backend, screening, analyzer logic untouched
- All other portal components untouched

