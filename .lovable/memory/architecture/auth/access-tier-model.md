---
name: Access Tier Model
description: Three-tier portal access (preview/browse/full) gated by profile completeness and signed BAA
type: feature
---
# Access tier model

Every portal user has one of three access tiers, computed by the DB function `public.get_access_tier(user_id)`:

| Tier | Condition |
|------|-----------|
| `preview` | Logged in but missing phone, SMS opt-in, or email opt-in. Investor-side gets 5 lifetime analyzer/MLS-search runs (via `analyzer_usage` table + `get_preview_runs_remaining`). |
| `browse` | Contact + both opt-ins complete, but no signed BAA yet (investor-side only). Unlimited browsing/analysis, no save/offer/walkthrough/bid. |
| `full` | Signed BAA on file (`baa_status IN ('signed','verified')`) OR is a wholesaler/partner with contact complete OR is admin. |

Admins are always `full` regardless of profile state.

## Required at signup (`src/pages/Signup.tsx`)
Full name, email, cell phone (E.164, +1XXXXXXXXXX), password, SMS opt-in checkbox, email opt-in checkbox. Both opt-ins are hard-required. Consent rows logged to `consent_log` via `log-consent` edge function (captures IP server-side).

## Profile fields added
`phone`, `sms_opt_in` (+`_at`/`_ip`), `email_opt_in` (+`_at`/`_ip`), `baa_status` (enum), `baa_dotloop_loop_id`, `baa_dotloop_document_id`, `baa_sent_at`, `baa_signed_at`, `baa_verified_at`, `preview_quota_limit` (default 5).

## Frontend enforcement
- `useAccessTier()` — returns `{ tier, profile, contactComplete, needsBaa, isAdmin, isBuyerSide }`.
- `useAnalyzerQuota()` — `{ remaining, isExhausted, recordRun(tool) }`. Call `recordRun()` before running a search/analysis.
- `<AccessTierBanner portal=...>` — top banner shown on every non-full portal layout. Already wired into all 3 portal layouts.
- `<TierGuard requiredTier="full" portal="investor">` — wraps full pages (Submit Offer, Walkthrough, Bid Request).
- `<GatedAction requiredTier="full" portal="investor">` — wraps inline action buttons.
- `<PreviewQuotaGate>` + `<PreviewQuotaChip>` — used in analyzer/MLS-search pages to show remaining runs and the upsell card when exhausted.
- `SaveDealButton` shows a lock + popover for users below `full` tier.

## Backend enforcement
- `saved_deals` insert RLS requires `get_access_tier(auth.uid()) = 'full'`.
- `analyzer_usage` insert allowed for any signed-in user via service-role (counted but not capped at DB; cap is enforced via the `recordRun` flow that checks `get_preview_runs_remaining` first).
- Trigger `trg_set_baa_status_on_investor` flips `baa_status` from `not_required` to `not_sent` whenever the investor role is granted.

## Onboarding wizard
Route `/portal/<portal>/onboarding` (all 3 portals). Step 1 = contact + consents (always). Step 2 = BAA (investor only). User-initiated "Request BAA via Dotloop" sets `baa_status='not_sent'` for admin to follow up. Admin marks `sent`/`signed`/`verified` via the `admin-update-baa` edge function from Admin → Users.

## Dotloop integration (not yet wired)
Plan calls for `dotloop-send-baa` and `dotloop-baa-webhook` edge functions using the existing single-admin-account Dotloop model. Will require secrets `DOTLOOP_API_KEY` and `DOTLOOP_BAA_TEMPLATE_ID`. Until wired, the BAA workflow is fully manual through the admin UI.
