
# Onboarding Requirements & Tiered Access

Every portal user must complete contact info + consents before full access. Investor & Buyer users additionally need a signed Buyer's Agency Agreement (BAA) on file via Dotloop.

## Required profile fields (all portals)

- **Cell phone** — collected, formatted, NOT SMS-verified. Stored as E.164.
- **SMS opt-in** — checkbox with explicit consent language: "I agree to receive deal alerts and transaction-related text messages from Integrity Realty STL. Msg & data rates may apply. Reply STOP to opt out." Timestamp + IP recorded.
- **Email opt-in** — checkbox: "I agree to receive deal alerts, market updates, and transaction emails." Timestamp + IP recorded. (Email itself already required for signup.)
- **Full name** (already collected via signup).

Wholesalers and Partners only need the above — no BAA.

## BAA requirement (Investor + Buyer only)

- Sent and signed via **Dotloop** using the single admin account model already in place.
- Profile tracks `baa_status`: `not_sent` → `sent` → `signed` → `verified` (admin confirms).
- Dotloop webhook (or admin manual mark-as-signed fallback) flips status when the user signs.
- Signed PDF reference (Dotloop loop ID + document ID) stored on the profile for audit.

## Tiered access model (Investor + Buyer)

Three states, enforced by a new `useAccessTier()` hook + RLS where applicable:

| Tier | Trigger | What they can do |
|------|---------|---------|
| **Preview** | Logged in, contact info incomplete | See dashboard/UI shell, browse deal cards (blurred address + photos), see Analyzer/MLS Search UI but limited to **5 total runs**, see Resources |
| **Browse** | Phone + both opt-ins complete, BAA not yet signed | Full deal browsing (addresses, photos), unlimited Analyzer + MLS Search, see contractor network |
| **Full** | BAA signed + admin approved | Save Deal, Submit Offer, Request Walkthrough, Bid Request, Deal Alerts SMS broadcast, Section 8/Utility calculators with save |

Wholesalers & Partners use a simpler two-state model (Preview → Full) — Full unlocks once contact info + opt-ins are complete (no BAA gate).

### Search/Analyzer 5-run quota
- New `analyzer_usage` table counts runs per user (analyzer + MLS search combined).
- Counter enforced in the existing `useMlsSearch` and `DealAnalyzer` flows.
- When the user hits 5, a paywall-style card replaces results: "You've used your 5 preview analyses. Complete your profile to unlock unlimited access."
- Counter does NOT reset — it's a lifetime preview cap. Admin can reset from user detail page.

## UI changes

- **Onboarding Wizard** (`/portal/onboarding`) — 3 steps: Contact Info → Consents → BAA (skipped for non-buyer portals). Shown on first login and accessible from sidebar until complete.
- **Top banner** on portal layouts — non-dismissable progress strip: "Complete your profile to unlock full access (2 of 3 steps done)" with CTA.
- **Action buttons** (Save Deal, Submit Offer, etc.) — check tier; if blocked, show a popover: "Sign your Buyer's Agency Agreement to use this feature" + button to open onboarding.
- **Deal cards in Preview tier** — addresses shown as "1234 ████ ████, St. Louis, MO ████" and photos lightly blurred with overlay "Complete profile to view".
- **Admin Users page** — adds columns: Phone, SMS opt-in, Email opt-in, BAA status. Filters for "Awaiting BAA" and "Preview only".
- **Admin User Detail** — buttons: "Send BAA via Dotloop", "Mark BAA signed manually", "Reset preview quota".

## Backend changes

### Profile schema additions
- `phone` (text, E.164)
- `sms_opt_in` (bool), `sms_opt_in_at` (timestamptz), `sms_opt_in_ip` (text)
- `email_opt_in` (bool), `email_opt_in_at` (timestamptz), `email_opt_in_ip` (text)
- `baa_status` (enum: `not_required`, `not_sent`, `sent`, `signed`, `verified`)
- `baa_dotloop_loop_id` (text), `baa_dotloop_document_id` (text), `baa_signed_at` (timestamptz)
- `access_tier` (computed view or function: `preview` | `browse` | `full`)

### New table: `analyzer_usage`
- `user_id`, `tool` (`analyzer` | `mls_search` | `comp_arv`), `ran_at`
- RLS: users can read their own count; only edge functions can insert.
- Helper RPC `get_preview_runs_remaining(user_id)`.

### New table: `consent_log`
- Append-only audit of every opt-in change with timestamp, IP, user-agent, consent text version.
- Required for TCPA compliance defense if SMS consent is ever challenged.

### Edge functions
- `dotloop-send-baa` — admin-triggered, creates a Dotloop loop with the user as buyer party, attaches BAA template, sends for signature.
- `dotloop-baa-webhook` — receives Dotloop signing events, updates `baa_status`.
- `track-analyzer-usage` — increments counter, returns remaining; called by Analyzer/MLS Search before running.

### RLS tightening
- `saved_deals` insert policy now requires `access_tier = 'full'`.
- Walkthrough/offer/bid tables get the same gate.

## Open items needing your input later (not blocking this build)

1. **Dotloop BAA template ID** — I'll add a placeholder secret `DOTLOOP_BAA_TEMPLATE_ID`; you'll paste the actual ID from your Dotloop loop templates once we wire it up.
2. **Dotloop API credentials** — secret `DOTLOOP_API_KEY` (we'll add when wiring the edge function).
3. **Exact SMS consent wording** — I'll use TCPA-safe boilerplate; your attorney may want to tweak.
4. **What "admin approved" means after BAA** — auto-promote to Full when BAA verified, or require a second manual approval click? Defaulting to auto-promote on BAA verified.

## Build order

1. Migration: profile fields, `analyzer_usage`, `consent_log`, `access_tier` function, tighten RLS
2. `useAccessTier` hook + `useAnalyzerQuota` hook
3. Onboarding wizard pages + consent components
4. Portal layout progress banner
5. Gating on Save/Submit/Walkthrough/Bid buttons
6. Preview-tier blur/redaction on deal cards
7. Quota enforcement in Analyzer + MLS Search
8. Admin Users columns + filters + "Send BAA / Mark Signed / Reset Quota" actions
9. Dotloop edge function stubs (real wiring blocked on credentials)
