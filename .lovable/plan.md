

# Store MLS Feed Plan in Project Memory

## What
Save the approved Daily Property Harvest implementation plan to `.lovable/memory/mls-feed-plan.md` so it persists as a reference for all future development.

## File to Create
**`.lovable/memory/mls-feed-plan.md`**

Contents will include the full approved plan covering:

### 1. Database Table: `deals`
- All columns (mls_number, address, city, postal_code, list_price, beds, baths, sqft, year_built, mls_status, strategy, passes_turnkey, passes_brrrr, rent_effective, arv_effective, rehab_tier, rehab_est, rent_to_price_pct, all_in_pct_of_arv, is_active, first_seen_at, last_seen_at, photo_urls, etc.)
- Indexes on mls_number, is_active, postal_code, mls_status
- Public read RLS for active deals

### 2. Edge Function: `daily-mls-harvest`
- Calls Repliers API with hardcoded search criteria:
  - ZIP codes: 63031, 63032, 63033, 63034, 63130, 63132, 63134, 63042, 63074, 63114, 63135
  - Max price: $120,000, min bedrooms: 3, class: residential, status: Active + Pending
  - Sort by price ascending
- Handles pagination
- Filters out excluded cities: Country Club Hills, Dellwood, Pagedale, Pine Lawn
- Inlines screening math from screening.ts and ZIP data from stlZipData.ts (cannot import src/ in Deno)
- Upserts passing deals, skips failing ones
- Lifecycle cleanup: deactivates deals not seen in current run, or with Closed/Expired/Withdrawn status
- Returns summary: totalFetched, totalPassed, totalUpserted, totalDeactivated

### 3. Cron Schedule
- Daily at 5:00 AM Central (11:00 UTC) via pg_cron + pg_net

### 4. Frontend: `/deals` Page
- Shows only `is_active = true` deals
- Displays: Address, Price, Beds/Baths, ZIP, Strategy badge, Projected Rent, ARV Estimate, Rent-to-Price %, Status
- Sorted by rent_to_price_pct DESC
- Uses TanStack Query + database client SDK (not /api/deals)

### 5. Admin Trigger
- "Run Harvest Now" button on Admin Dashboard
- Manually invokes daily-mls-harvest and shows summary

### Technical Notes
- rent_to_price_pct used instead of cash_on_cash (which doesn't exist in screening engine)
- Screening logic and ZIP data must be inlined in edge function (Deno can't import from src/)
- Repliers API params: use `minBedrooms`, `maxPrice`, `zip`, `class`, `status` (not the names from the ChatGPT prompt)

## No Other Changes
This is a memory-only save. No code changes.

