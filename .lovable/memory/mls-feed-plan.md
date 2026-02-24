# Daily Property Harvest – Implementation Plan

## 1. Database Table: `deals`

### Columns
- `id` uuid PK (default gen_random_uuid())
- `mls_number` text UNIQUE
- `address` text
- `city` text
- `state` text (default 'MO')
- `postal_code` text
- `list_price` numeric
- `beds` integer
- `baths` numeric
- `sqft` integer
- `year_built` integer
- `property_type` text
- `mls_status` text
- `photo_urls` text[]
- `strategy` text (None/Turnkey/BRRRR/Both)
- `passes_turnkey` boolean
- `passes_brrrr` boolean
- `rent_effective` numeric
- `arv_effective` numeric
- `rehab_tier` text
- `rehab_est` numeric
- `rent_to_price_pct` numeric
- `all_in_pct_of_arv` numeric
- `is_active` boolean (default true)
- `first_seen_at` timestamptz (default now())
- `last_seen_at` timestamptz (default now())
- `created_at` timestamptz (default now())
- `updated_at` timestamptz (default now())

### Indexes
- mls_number (unique)
- is_active
- postal_code
- mls_status

### RLS
- Public read for active deals (no auth required)

---

## 2. Edge Function: `daily-mls-harvest`

### Search Criteria
- ZIP codes: 63031, 63032, 63033, 63034, 63130, 63132, 63134, 63042, 63074, 63114, 63135
- Max price: $120,000
- Min bedrooms: 3
- Class: residential
- Status: Active + Pending
- Sort: price ascending

### Behavior
- Handles pagination (loop all pages)
- Filters out excluded cities post-fetch: Country Club Hills, Dellwood, Pagedale, Pine Lawn
- Inlines screening math from screening.ts (ARV lookup, rent estimates, rehab tier, strategy evaluation)
- Inlines ZIP data from stlZipData.ts (only target ZIPs)
- Upserts passing deals (Turnkey or BRRRR); skips failures
- Lifecycle cleanup: deactivates deals not seen in current run or with Closed/Expired/Withdrawn status
- Returns: { totalFetched, totalPassed, totalUpserted, totalDeactivated }

### Technical Constraints
- Cannot import from src/ in Deno — all logic must be inlined
- Repliers API params: `minBedrooms`, `maxPrice`, `zip`, `class`, `status`

---

## 3. Cron Schedule
- Daily at 5:00 AM Central (11:00 UTC)
- Uses pg_cron + pg_net extensions
- Calls the daily-mls-harvest edge function via HTTP

---

## 4. Frontend: `/deals` Page
- Shows only `is_active = true` deals
- Displays: Address, Price, Beds/Baths, ZIP, Strategy badge, Projected Rent, ARV Estimate, Rent-to-Price %, Status
- Sorted by `rent_to_price_pct` DESC
- Uses TanStack Query + Supabase client SDK (not /api/deals)

---

## 5. Admin Trigger
- "Run Harvest Now" button on Admin Dashboard
- Manually invokes daily-mls-harvest edge function
- Displays summary results

---

## Technical Notes
- `rent_to_price_pct` used instead of `cash_on_cash` (not in screening engine)
- Screening logic and ZIP data must be inlined in edge function
- Repliers API param names differ from ChatGPT prompt names
