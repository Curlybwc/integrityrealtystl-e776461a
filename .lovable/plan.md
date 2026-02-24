

# MLS Search and Batch Analyzer

## Overview
A new page where admins or investors can enter custom MLS search criteria (ZIP codes, price range, bedrooms, etc.), pull back live results from the Repliers API, and then batch-run every result through the screening engine -- instantly seeing which listings pass Turnkey, BRRRR, Both, or None.

## How It Works

1. **Search Form** -- The user fills in fields like ZIP code(s), min/max price, min bedrooms, min baths, status (Active, Pending, etc.). They hit "Search" and results come back from the MLS feed.

2. **Batch Screening** -- Every returned listing is automatically run through the same Turnkey/BRRRR screening logic already in the codebase. Each listing gets a strategy badge, rent estimate, ARV estimate, rent-to-price ratio, and all-in % of ARV.

3. **Results Table** -- A sortable table showing all results with columns for address, price, beds/baths/sqft, strategy badge, estimated rent, ARV, rent-to-price %, and all-in % ARV. Passing deals are highlighted; failing deals are shown but visually dimmed.

4. **Single-Deal Drill-Down** -- Click any row to open it in the existing Deal Analyzer with all fields pre-populated, so the user can tweak inputs (rehab tier, manual ARV, etc.) for deeper analysis.

## What Gets Built

### 1. New Page: Portal Search Analyzer (`src/pages/portal/PortalSearchAnalyzer.tsx`)
- Search form at top with fields: ZIP code (text input, supports single or comma-separated), min/max price, min beds, min baths, status dropdown
- "Search MLS" button that calls the existing `fetch-mls-listings` edge function via the `useMlsSearch` hook
- Pagination controls (the edge function already supports `pageNum`)
- Results count and summary stats (e.g., "14 of 47 listings pass screening")

### 2. New Component: Batch Results Table (`src/components/portal/BatchAnalysisTable.tsx`)
- Takes the raw MLS results and runs each through `computeDealMetrics` from `screening.ts`
- Columns: Address, City, ZIP, Price, Beds, Baths, Sqft, Strategy (badge), Est. Rent, ARV, RTP%, All-In % ARV
- Color-coded: green rows for passing deals, dimmed for failures
- Sortable by price, RTP%, strategy
- "Analyze" link on each row that opens the Deal Analyzer with query params pre-filled

### 3. Route Registration (`src/App.tsx`)
- Add route: `/portal/search-analyzer` pointing to the new page

### 4. Navigation Update (`src/components/portal/InvestorPortalLayout.tsx`)
- Add "Search & Analyze" link in the Tools section of the portal sidebar

## Technical Details

- **No new edge function needed** -- reuses the existing `fetch-mls-listings` function and the existing `useMlsSearch` hook
- **No database changes** -- this is a live search tool; results are not persisted (the Daily Harvest handles persistence separately)
- **Screening runs client-side** -- imports `computeDealMetrics`, `estimateSystemRent`, `estimateSystemArv`, `estimateRehabTier` from `screening.ts` to process each listing in the browser
- **Deal Analyzer integration** -- each row links to `/portal/analyzer?address=...&zip=...&beds=...&price=...` using the existing URL-param auto-populate feature already built into `DealAnalyzer`

### Files to Create
- `src/pages/portal/PortalSearchAnalyzer.tsx` -- page with search form + results
- `src/components/portal/BatchAnalysisTable.tsx` -- results table with inline screening

### Files to Modify
- `src/App.tsx` -- add route
- `src/components/portal/InvestorPortalLayout.tsx` -- add sidebar link

