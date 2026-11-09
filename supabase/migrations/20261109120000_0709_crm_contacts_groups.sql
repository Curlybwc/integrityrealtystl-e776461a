-- 07.09 Slim CRM Landing 1: Contacts + Groups.
-- One record per person, consolidated from multiple sources with a
-- provenance row per arrival (never a duplicate pair); tag groups and
-- rule groups; Do Not Contact suppression enforced at the data layer —
-- the crm_sendable_contacts view excludes DNC contacts by construction,
-- so no sendable selection built on it can include one.
-- Spec: slim-crm-spec.md §§1-2 (07.09 Agent CRM & Communications).
-- The consent table ships its SHAPE in Landing 1 so Landing 2's
-- SimpleTexting opt-in-evidence import has a home; the import itself
-- and all sending are Landing 2.

CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  company TEXT,
  mailing_address TEXT,
  notes TEXT,
  -- Suppression flag: set/cleared only together with membership in a
  -- suppression-kind group (the lib writes both in one operation).
  do_not_contact BOOLEAN NOT NULL DEFAULT false,
  -- Soft merge: a merged-away record points at the winner and drops out
  -- of every selection; unmerge clears this. Nothing is ever deleted.
  merged_into_id UUID REFERENCES public.crm_contacts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_contacts_active_idx
  ON public.crm_contacts (display_name) WHERE merged_into_id IS NULL;

-- Reachable addresses/numbers. Normalized values drive dedupe matching
-- (spec §1: match on phone + email).
CREATE TABLE public.crm_contact_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('phone', 'email')),
  value_raw TEXT NOT NULL,
  value_normalized TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_textable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, kind, value_normalized)
);
CREATE INDEX crm_contact_methods_match_idx
  ON public.crm_contact_methods (kind, value_normalized);

-- Provenance: one row per source arrival. The same person arriving from
-- two sources is ONE contact carrying both rows; a bad import can be
-- found and undone by source.
CREATE TABLE public.crm_contact_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL CHECK (source_kind IN (
    'phone', 'google', 'gmail', 'simpletexting', 'website', 'manual'
  )),
  source_account TEXT,
  source_ref TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, source_kind, source_account, source_ref)
);

-- Facts rule groups evaluate against (lease status, property, voucher,
-- trade, ...). Each fact carries the source that asserted it.
CREATE TABLE public.crm_contact_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, fact_key, fact_value)
);
CREATE INDEX crm_contact_facts_lookup_idx
  ON public.crm_contact_facts (fact_key, fact_value);

-- Consent records (TCPA gate, spec §4). Landing 1 creates the shape:
-- per number/channel — source, date/time, exact wording agreed, and the
-- opt-out timestamp. Landing 2 fills it (incl. the hard-gated
-- SimpleTexting opt-in-evidence import) and enforces it at send time.
CREATE TABLE public.crm_contact_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  method_id UUID REFERENCES public.crm_contact_methods(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  basis TEXT NOT NULL CHECK (basis IN (
    'lease', 'application', 'express_written', 'representation',
    'operational', 'simpletexting_import', 'website_signup'
  )),
  source TEXT NOT NULL,
  wording TEXT NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL,
  opt_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_contact_consent_contact_idx
  ON public.crm_contact_consent (contact_id, channel);

CREATE TABLE public.crm_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('tag', 'rule', 'suppression')),
  -- Rule groups only: a JSON list of {fact_key, op, value} clauses,
  -- op IN ('eq','neq','exists'); ALL clauses must match (AND).
  rule JSONB,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'rule') = (rule IS NOT NULL))
);

-- Tag/suppression membership (rule-group membership is computed, never
-- stored). Joining/leaving also writes a crm_contact_events row.
CREATE TABLE public.crm_group_members (
  group_id UUID NOT NULL REFERENCES public.crm_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, contact_id)
);

-- Append-only timeline: every event on the person (spec §§1-2).
CREATE TABLE public.crm_contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  event TEXT NOT NULL CHECK (event IN (
    'created', 'source_added', 'merged', 'unmerged',
    'group_joined', 'group_left', 'dnc_set', 'dnc_cleared',
    'consent_recorded', 'consent_opt_out'
  )),
  actor_id UUID REFERENCES auth.users(id),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_contact_events_contact_idx
  ON public.crm_contact_events (contact_id, created_at DESC);

-- Merge audit: a merge is never silent or destructive. The snapshot
-- holds everything unmerge needs to restore the loser as it was.
CREATE TABLE public.crm_merge_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES public.crm_contacts(id),
  loser_id UUID NOT NULL REFERENCES public.crm_contacts(id),
  matched_on JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES auth.users(id),
  loser_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES auth.users(id)
);

-- THE sendable selection. Every send path in Landing 2+ selects from
-- this view, never from crm_contacts directly: a contact is sendable
-- only when it is active (not merged away), not flagged DNC, and not a
-- member of any suppression-kind group. Exclusion is by construction.
CREATE VIEW public.crm_sendable_contacts AS
SELECT c.*
FROM public.crm_contacts c
WHERE c.merged_into_id IS NULL
  AND c.do_not_contact = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.crm_group_members m
    JOIN public.crm_groups g ON g.id = m.group_id
    WHERE m.contact_id = c.id AND g.kind = 'suppression'
  );

-- Starting groups (spec §2 table). Rule definitions evaluate over
-- crm_contact_facts; per-property tenant groups are created as
-- properties appear (rule {property_id eq <id>} + active lease).
INSERT INTO public.crm_groups (name, kind, rule, is_system) VALUES
  ('Tenants — current', 'rule', '[{"fact_key":"lease_status","op":"eq","value":"active"}]'::jsonb, true),
  ('Tenants — Section 8', 'rule', '[{"fact_key":"lease_status","op":"eq","value":"active"},{"fact_key":"housing_voucher","op":"exists"}]'::jsonb, true),
  ('Tenants — past', 'rule', '[{"fact_key":"lease_status","op":"eq","value":"ended"}]'::jsonb, true),
  ('Applicants & prospects', 'tag', NULL, true),
  ('Investors — active buyers', 'tag', NULL, true),
  ('Investors — out of state', 'tag', NULL, true),
  ('Sellers & listing prospects', 'tag', NULL, true),
  ('Wholesalers', 'tag', NULL, true),
  ('Vendors & partners', 'tag', NULL, true),
  ('Team', 'tag', NULL, true),
  ('Family & personal', 'tag', NULL, true),
  ('Do Not Contact', 'suppression', NULL, true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_merge_audit ENABLE ROW LEVEL SECURITY;

-- Named-role revokes BEFORE grants (default privileges survive a
-- grant-only migration; service_role included because its grant on the
-- append-only tables is narrower than ALL).
REVOKE ALL ON public.crm_contacts FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_contact_methods FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_contact_sources FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_contact_facts FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_contact_consent FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_groups FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_group_members FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_contact_events FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_merge_audit FROM anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE ON public.crm_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contact_methods TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.crm_contact_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contact_facts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_contact_consent TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_groups TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.crm_group_members TO authenticated;
GRANT SELECT, INSERT ON public.crm_contact_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_merge_audit TO authenticated;
GRANT SELECT ON public.crm_sendable_contacts TO authenticated;

GRANT ALL ON public.crm_contacts TO service_role;
GRANT ALL ON public.crm_contact_methods TO service_role;
GRANT ALL ON public.crm_contact_sources TO service_role;
GRANT ALL ON public.crm_contact_facts TO service_role;
GRANT ALL ON public.crm_contact_consent TO service_role;
GRANT ALL ON public.crm_groups TO service_role;
GRANT ALL ON public.crm_group_members TO service_role;
GRANT SELECT, INSERT ON public.crm_contact_events TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_merge_audit TO service_role;
GRANT SELECT ON public.crm_sendable_contacts TO service_role;

-- Staff-only surface: admins manage the CRM (Jen + Samantha are the
-- full users per the authority matrix); nobody else sees contact data.
CREATE POLICY "Admins manage CRM contacts"
  ON public.crm_contacts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM contact methods"
  ON public.crm_contact_methods FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM contact sources"
  ON public.crm_contact_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM contact facts"
  ON public.crm_contact_facts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM contact consent"
  ON public.crm_contact_consent FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM groups"
  ON public.crm_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM group members"
  ON public.crm_group_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read CRM contact events"
  ON public.crm_contact_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins append CRM contact events"
  ON public.crm_contact_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM merge audit"
  ON public.crm_merge_audit FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
