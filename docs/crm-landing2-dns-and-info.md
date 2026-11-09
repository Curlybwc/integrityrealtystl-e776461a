# Landing 2 — prepared DNS record set + info@ setup (NOT applied)

Status: **prepared only.** Changing DNS on integrityrealtystl.com and
creating the info@ alias are Jen-gated acts named in the Landing 2
first report. Nothing in this document has been applied. Values that a
provider generates at verification time are marked GENERATED — they
cannot be written down before the account act happens.

## 1. info@integrityrealtystl.com (receive side)

- Google Workspace Admin → Users/Groups: create `info@` as a **group**
  (or alias on Jen's mailbox) delivering to Jen and Samantha. No new
  paid seat. Send-as from Gmail can be added per user afterwards.
- Send side needs no mailbox: Resend sends from info@ once the domain
  is verified (section 2), with replies routed to Jen.

## 2. Resend domain verification (send subdomain)

Resend verifies a **sending subdomain** so campaign bounces can never
damage the main domain's reputation (spec §6). At verification Resend
generates these records for `send.integrityrealtystl.com` — add exactly
what the Resend dashboard shows:

| Type | Host | Value | Notes |
|---|---|---|---|
| TXT | `send` | GENERATED (SPF for the subdomain) | from Resend |
| MX | `send` | GENERATED (feedback-smtp endpoint, priority 10) | from Resend |
| TXT | `resend._domainkey.send` | GENERATED (DKIM public key) | from Resend |
| TXT | `_dmarc.send` | `v=DMARC1; p=none;` | optional, Resend suggests |

## 3. Root domain: SPF + Google DKIM + DMARC (open since 2026-10-24)

The root domain today has no SPF and no Google DKIM record, which
hurts jen@ deliverability. Resend sends from the subdomain, so the
root SPF stays Google-only:

| Type | Host | Value |
|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.google.com -all` |
| TXT | `google._domainkey` | GENERATED — enable DKIM in Google Workspace Admin (Admin → Apps → Google Workspace → Gmail → Authenticate email), then publish the key it shows |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:jen@integrityrealtystl.com` |

Start DMARC at `p=none` (monitor only); tighten to `quarantine` after
two clean weeks of reports.

## 4. Apply order

1. Jen-gated: Resend free account created → domain added → records in
   section 2 generated.
2. Jen-gated: info@ group created in Workspace; DKIM enabled in
   Workspace (generates the section 3 key).
3. Jen-gated: all records published at the registrar in one sitting.
4. Maven verifies: Resend shows Verified; SPF/DKIM/DMARC resolve via
   DNS lookup; a Workspace-sent message passes DKIM alignment.
