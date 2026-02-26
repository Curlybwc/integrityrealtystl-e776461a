

# Plan: Separate Listing Detail into Base Component + Two Pages

## Architecture

```text
ListingDetailBase (pure brokerage UI)
  ├── PublicListingPage    → /listing/:mlsNumber     (base only)
  └── InvestorListingPage  → /portal/listing/:mlsNumber (base + investor analysis)
```

## Files to Create

### 1. `src/components/listing/ListingDetailBase.tsx`

Extract all brokerage UI from the current `ListingDetail.tsx` into a reusable component that accepts a `RawListing` prop. Contains:
- Price, address, beds/baths/sqft, status, DOM
- Photo carousel with thumbnails
- Description card
- Property details grid (year built, lot size, taxes, garage, heating, cooling, sewer, water, basement, stories, sqft source)
- Agent/office sidebar
- Quick facts sidebar
- Back button with `goBack` callback prop

No investor logic. No screening imports. No strategy badges. No analyze buttons.

**Props interface:**
```typescript
interface ListingDetailBaseProps {
  listing: RawListing;
  onBack: () => void;
}
```

The `RawListing` interface will be exported from this file for reuse.

### 2. `src/pages/PublicListingPage.tsx`

Replaces the current `ListingDetail.tsx`. This page:
- Fetches listing via `useQuery` + `fetch-mls-listings` edge function (same logic as current)
- Renders loading/error states wrapped in `<Layout>`
- Renders `<ListingDetailBase listing={listing} onBack={goBack} />`
- `goBack` falls back to `"/"` if no history
- Zero investor logic

### 3. `src/pages/portal/InvestorListingPage.tsx`

New page for `/portal/listing/:mlsNumber`. This page:
- Same fetch logic as PublicListingPage
- Renders `<ListingDetailBase listing={listing} onBack={goBack} />`
- `goBack` falls back to `"/portal/search-analyzer"`
- Below the base component, renders a collapsible "Investor Analysis" section containing:
  - Strategy badges (Flip / BRRRR / Turnkey)
  - Metrics grid (Est. Rent, ARV, RTP Ratio, All-In %)
  - "Open Full Analyzer" button linking to `/portal/analyzer?...` in new tab
- Uses `Collapsible` from Radix, collapsed by default
- Wrapped in `<Layout>` (not the portal sidebar layout, since the route is nested under the portal layout in App.tsx)

**Note:** Since `/portal/listing/:mlsNumber` is nested inside the `<InvestorPortalLayout>` route in App.tsx, InvestorListingPage should NOT wrap itself in `<Layout>` — it will already have the portal sidebar. It should just render content directly.

## Files to Modify

### 4. `src/App.tsx`

- Change import: `ListingDetail` → `PublicListingPage`
- Change import: `PortalListingDetail` → `InvestorListingPage`
- Route `/listing/:mlsNumber` → `<PublicListingPage />`
- Route `listing/:mlsNumber` (under portal) → `<InvestorListingPage />`

### 5. `src/components/portal/ListingCard.tsx` (line 41)

Change navigation from:
```typescript
navigate(`/listing/${l.mls_listing_id}`, { state: { fromPortal: true } })
```
to:
```typescript
navigate(`/portal/listing/${l.mls_listing_id}`)
```

No `state` param needed.

### 6. `src/components/portal/BatchAnalysisTable.tsx` (line 132)

Change `goToListing` from:
```typescript
navigate(`/listing/${l.mls_listing_id}`, { state: { fromPortal: true } });
```
to:
```typescript
navigate(`/portal/listing/${l.mls_listing_id}`);
```

## Files to Delete

### 7. `src/pages/ListingDetail.tsx`

Replaced by `PublicListingPage.tsx` + `ListingDetailBase.tsx`. Will be removed.

## What is NOT changed

- No backend/edge function changes
- No screening logic changes
- No database changes
- No auth changes
- No new API costs

