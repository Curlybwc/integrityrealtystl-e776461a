# Memory: integrations/repliers-mls-api
Updated: 2026-02-24

## Repliers MLS API Reference

### Base URL
`https://api.repliers.io`

### Authentication
- **Header (recommended):** `REPLIERS-API-KEY: {key}`
- **Query param:** `?repliers_api_key={key}`
- Our key is stored as Cloud secret `REPLIERS_API_KEY`, used in edge function `fetch-mls-listings`

### Endpoints

#### Search Listings: `GET /listings`
Returns paginated listing results. Key query parameters:

**Location filters:**
- `city` (array) — filter by one or more cities
- `zip` / `postalCode` — filter by ZIP
- `area` — geographical area/region
- `neighborhood` (array) — filter by neighborhood
- `district` — geographical district
- `lat`, `long`, `radius` (km) — radius search
- `map` — geoJSON polygon boundary filter

**Price filters:**
- `minPrice`, `maxPrice` (int32)
- `minSoldPrice`, `maxSoldPrice`

**Property characteristics:**
- `minBedrooms`, `maxBedrooms` (int32) — original floorplan bedrooms
- `minBedroomsPlus`, `maxBedroomsPlus` — additional bedrooms (basement, attic)
- `minBedroomsTotal`, `maxBedroomsTotal` — combined total
- `minBaths`, `maxBaths` (int32)
- `minSqft`, `maxSqft` (int32) — excludes listings without sqft data
- `minYearBuilt`, `maxYearBuilt`
- `minStories`, `maxStories`
- `propertyType` (array) — e.g. house, condo, townhouse
- `class` (array) — `residential`, `condo`, `commercial`
- `type` — Sale, Lease

**Status filters:**
- `status` — `A` (Active), `U` (Unavailable/Sold), `P` (Pending). Default returns all.
- `lastStatus` (array) — `Sus`, `Exp`, `Sld`, `Ter`, `Dft`, `Lsd`, `Sc`, etc.

**Date filters:**
- `listDate`, `minListDate`, `maxListDate`
- `minSoldDate`, `maxSoldDate`
- `minUpdatedOn`, `maxUpdatedOn`
- `minClosedDate`, `maxClosedDate`

**Pagination:**
- `pageNum` (int32) — page number (1-indexed)
- `resultsPerPage` (int32) — listings per page
- Response includes: `page`, `numPages`, `pageSize`, `count`

**Sorting:**
- `sortBy` — e.g. `updatedOnDesc` (default), `listPriceAsc`, `listPriceDesc`, `distanceAsc`, `distanceDesc` (requires lat/long/radius)

**Performance:**
- `fields` — limit response fields, e.g. `fields=listPrice,soldPrice,images[5]`
- `hasImages` (boolean) — filter listings with/without images
- `listings` (boolean) — if false, omit listings array (useful for stats/aggregates only)

**Other useful params:**
- `search` — full-text keyword search
- `boardId` (array) — filter by MLS board (only needed for multi-MLS accounts)
- `lastPriceChangeType` — `decrease` or `increase`
- `minDaysOnMarket`, `maxDaysOnMarket`

#### Get Single Listing: `GET /listings/{mlsNumber}`
Returns expanded listing detail including comparables and MLS history.
- `boardId` (int32) — required only for multi-MLS accounts

### Response Structure (Search)
```json
{
  "page": 1,
  "numPages": 802,
  "pageSize": 100,
  "count": 80198,
  "listings": [
    {
      "mlsNumber": "W9012677",
      "resource": "Property:2381",
      "status": "A",
      "class": "Residential",
      "type": "Sale",
      "listPrice": "150000.00",
      "address": {
        "streetNumber": "123",
        "streetName": "Main",
        "streetSuffix": "St",
        "city": "St Louis",
        "state": "MO",
        "zip": "63130"
      },
      "details": {
        "numBedrooms": "3",
        "numBathrooms": "2",
        "sqft": "1500",
        "yearBuilt": "1960",
        "propertyType": "Detached"
      },
      "images": ["url1", "url2", ...],
      ...
    }
  ]
}
```

### Our Edge Function Mapping
The `fetch-mls-listings` edge function maps Repliers fields to our Deal schema:
- `mlsNumber` → `mls_listing_id`
- `address.*` → `address`, `city`, `state`, `zip`
- `details.numBedrooms` → `beds`
- `details.numBathrooms` → `baths`
- `details.sqft` → `sqft`
- `details.yearBuilt` → `year_built`
- `details.propertyType` → `property_type`
- `listPrice` → `list_price`
- `status` → `mls_status` (mapped: A→Active, P→Pending, S/U→Sold)
- `images` → `photo_urls` (first 10)

### Status Code Mapping
- `A` / `ACTIVE` / `NEW` → "Active"
- `P` / `PENDING` / `CONDITIONAL` → "Pending"  
- `S` / `SOLD` / `CLOSED` / `U` → "Sold"

### Docs Links
- API Reference: https://docs.repliers.io/reference/getting-started-with-your-api
- Auth Guide: https://help.repliers.com/en/article/repliers-api-authentication-guide-1pmm1p2/
- Search/Filter Guide: https://help.repliers.com/en/article/searching-filtering-and-pagination-guide-1q1n7x0/
- Single Listing: https://docs.repliers.io/reference/get-a-listing
