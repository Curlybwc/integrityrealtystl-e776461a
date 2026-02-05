
# MLS Deal Screener System - Implementation Plan

## Overview
Build an admin-only backend and buyer-facing portal for an investor deal screening system that auto-screens MLS listings against Turnkey and BRRRR strategies, with admin override capabilities and role-based access control.

---

## Phase 1: Enable Backend Infrastructure

### 1.1 Enable Lovable Cloud
This system requires persistent data storage, user authentication, and role-based access control. Lovable Cloud (Supabase integration) must be enabled first.

### 1.2 Database Schema

**Tables to create:**

**user_roles** (for role-based access)
```text
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- role: enum (admin, investor, wholesaler)
- unique constraint on (user_id, role)
```

**deals** (main deal table)
```text
Identifiers:
- id: uuid (primary key)
- source_type: enum (MLS, WHOLESALER)
- mls_listing_id: text (nullable, for MLS only)

Property Info:
- address, city, state, zip: text
- beds, baths: integer
- sqft: integer
- year_built: integer
- property_type: text
- photo_urls: text[] (array of URLs)

MLS Fields:
- list_price: integer
- mls_status: enum (Active, Pending, Sold, Unknown)
- last_mls_sync_at: timestamp

System Estimates (auto-calculated):
- rent_system: integer
- arv_system: integer
- rehab_tier_system: enum (Light, Medium, Heavy)

Admin Overrides (never overwritten by sync):
- rent_override: integer (nullable)
- arv_override: integer (nullable)
- rehab_tier_override: enum (nullable)

Computed/Effective Values:
- rent_effective: integer
- arv_effective: integer
- rehab_tier_effective: enum
- rehab_est_effective: integer

Metrics:
- rent_to_price_pct: decimal
- all_in_pct_of_arv: decimal

Screening Results:
- passes_turnkey: boolean
- passes_brrrr: boolean
- strategy: enum (None, Turnkey, BRRRR, Both)
- buyer_visible: boolean

Admin Workflow:
- reviewed: boolean (default false)
- reviewed_at: timestamp
- notes: text
- removed_reason: text (nullable)

Wholesaler Fields:
- wholesaler_owner_id: uuid (references auth.users)
- wholesaler_status: enum (Available, UnderContract, Sold)

Timestamps:
- created_at, updated_at: timestamp
```

**screening_config** (global configuration)
```text
- id: uuid
- rehab_rate_light: integer (default 15)
- rehab_rate_medium: integer (default 30)
- rehab_rate_heavy: integer (default 50)
- turnkey_min_rtp: decimal (default 0.0135)
- turnkey_min_arv_pct: decimal (default 0.80)
- turnkey_max_arv_pct: decimal (default 1.00)
- brrrr_min_rtp: decimal (default 0.013)
- brrrr_max_all_in_pct: decimal (default 0.75)
```

### 1.3 Row-Level Security Policies
```text
- Admins: Full CRUD on all deals
- Investors/Buyers: SELECT only where buyer_visible = true
- Wholesalers: CRUD on own deals (source_type = WHOLESALER AND wholesaler_owner_id = auth.uid())
```

### 1.4 Database Functions
- `has_role(user_id, role)` - Security definer function for role checking
- `compute_deal_metrics(deal_id)` - Trigger function to recalculate metrics
- `update_effective_values()` - Trigger on insert/update to compute effective values and pass/fail

---

## Phase 2: Authentication & Role System

### 2.1 Admin Login Page
- New route: `/admin-login`
- Separate from investor login
- Demo credentials for testing

### 2.2 Auth Context Enhancement
- Create `useAuth` hook that checks user role
- Protect admin routes with role verification using database function
- Never store role in localStorage (security requirement)

---

## Phase 3: Admin Portal UI

### 3.1 Admin Layout
- New component: `AdminPortalLayout.tsx`
- Sidebar navigation: Dashboard, Deal Pot, Settings
- Route: `/admin/*`

### 3.2 Admin Deal Pot (Spreadsheet View)
Main page: `/admin/deal-pot`

**Tabs:**
- Passing Unreviewed (default) - `buyer_visible = true AND reviewed = false`
- Passing Reviewed - `buyer_visible = true AND reviewed = true`
- Removed - `removed_reason IS NOT NULL`
- Archived Sold - `mls_status = Sold OR wholesaler_status = Sold`

**Table Columns:**
| Column | Editable | Notes |
|--------|----------|-------|
| Photo thumbnail | Click opens viewer | First photo from array |
| Address | No | Full address display |
| ZIP | No | |
| Beds | No | |
| Sqft | No | |
| List Price | No | Formatted currency |
| MLS Status | No | Badge (Active/Pending/Sold) |
| Strategy | No | Badge (Turnkey/BRRRR/Both) |
| Rehab Tier | Yes | Dropdown (Light/Medium/Heavy) |
| Rent Effective | Yes | Inline number input |
| ARV Effective | Yes | Inline number input |
| Rent/Price % | No | Calculated, color-coded |
| All-In % ARV | No | Calculated, color-coded |
| Notes | Yes | Text input |

**Visual Indicators:**
- Unreviewed rows: Gray/tinted background
- Reviewed rows: Normal background
- Mark as reviewed when: Photo viewer opened OR any override edited

### 3.3 Photo Viewer Modal
- Carousel using existing photo_urls array
- Quick-edit panel:
  - Rehab tier dropdown
  - Rent override input
  - ARV override input
- Pass/fail indicators for each strategy
- Current buyer visibility status
- Opening this modal marks deal as reviewed

### 3.4 Screening Logic Implementation

**Turnkey Pass Criteria:**
```text
rent_effective / list_price >= 0.0135
AND list_price / arv_effective BETWEEN 0.80 AND 1.00
AND mls_status != Sold
```

**BRRRR Pass Criteria:**
```text
rent_effective / list_price >= 0.013
AND (list_price + rehab_est_effective) / arv_effective <= 0.75
```

**Strategy Assignment:**
```text
Both: passes_turnkey AND passes_brrrr
Turnkey: passes_turnkey only
BRRRR: passes_brrrr only
None: neither passes
```

**Buyer Visibility:**
```text
buyer_visible = (strategy != None)
  AND (mls_status != Sold)
  AND (wholesaler_status != Sold for wholesaler deals)
  AND (removed_reason IS NULL)
```

**Auto-Removal:**
When admin edits cause strategy to become None:
- Set `buyer_visible = false`
- Set `removed_reason = 'failed_after_admin_override'`
- Deal moves to Removed tab

---

## Phase 4: Enhanced Buyer Portal

### 4.1 Update PortalDeals.tsx
- Fetch only `buyer_visible = true` deals from database
- Add strategy filter: All, Turnkey, BRRRR, Both
- Remove "Jen's Pick" concept (replaced by strategy badges)
- Show strategy badges instead of deal type

### 4.2 Update PortalDealDetail.tsx
- Pull deal from database by ID
- Show only buyer-visible fields (no override controls)
- Photo gallery with carousel
- Existing "Open in Analyzer" functionality preserved

### 4.3 Buyer UI Fields (Read-Only)
```text
- Address, City, ZIP
- Beds, Baths, Sqft
- List Price
- Est. Rent (rent_effective)
- Est. ARV (arv_effective)
- Status (Active/Under Contract)
- Strategy badge
- Photos
```

---

## Phase 5: Wholesaler Portal Enhancements

### 5.1 Update WholesalerAddDeal
- Set `source_type = 'WHOLESALER'`
- Set `wholesaler_owner_id = auth.uid()`
- Capture all required fields
- Submit goes through screening automatically

### 5.2 Wholesaler Deal Management
- List own deals with status
- Add "Mark Under Contract" button
- Cannot edit screening fields (rent, ARV, rehab tier) - admin only
- Deal goes through same screening as MLS deals

---

## Phase 6: MLS Integration Preparation

### 6.1 Edge Function: Import Deals
- Endpoint for bulk import (future MLS API integration)
- Normalize fields to deal schema
- Compute system estimates using existing ZIP data
- Run through screening

### 6.2 Edge Function: Refresh Deals
- Update MLS fields only (status, price, photos)
- NEVER overwrite admin overrides
- Re-run screening after refresh
- Handle status transitions (Active -> Pending -> Sold)

**Protected Fields (never overwritten):**
- rent_override
- arv_override
- rehab_tier_override
- reviewed, reviewed_at
- notes
- removed_reason

---

## Technical Considerations

### Leveraging Existing Code
- Use existing `stlZipData.ts` for rent/ARV estimates
- Use existing `REPAIR_COSTS_PER_SF` for rehab calculations
- Extend existing portal layouts pattern
- Follow established authentication patterns

### File Structure
```text
src/
├── components/
│   └── admin-portal/
│       ├── AdminPortalLayout.tsx
│       ├── DealPotTable.tsx
│       ├── DealPhotoViewer.tsx
│       └── AdminDealRow.tsx
├── pages/
│   ├── AdminLogin.tsx
│   └── admin-portal/
│       ├── AdminDashboard.tsx
│       ├── AdminDealPot.tsx
│       └── AdminSettings.tsx
├── hooks/
│   ├── useAuth.tsx (enhanced)
│   └── useDeals.tsx
└── lib/
    └── screening.ts (screening logic)
```

### Database Triggers
Set up Postgres triggers to:
1. Auto-compute effective values when overrides change
2. Auto-compute metrics (RTP, All-In %)
3. Auto-evaluate pass/fail flags
4. Auto-set buyer_visible based on strategy and status

---

## Implementation Order

1. **Enable Lovable Cloud** - Required first
2. **Create database schema** - Tables, enums, functions
3. **Set up RLS policies** - Role-based security
4. **Build Admin Login** - Authentication flow
5. **Build Admin Layout** - Sidebar, navigation
6. **Build Deal Pot Table** - Core admin functionality
7. **Build Photo Viewer** - With quick edit
8. **Implement Screening Logic** - Pass/fail calculations
9. **Update Buyer Portal** - Connect to real data
10. **Update Wholesaler Portal** - Status management
11. **Create Edge Functions** - MLS sync preparation

---

## Dependencies
- Lovable Cloud (Supabase) must be enabled
- No external MLS API initially - manual import or future integration
- Uses existing ZIP code data for estimates
