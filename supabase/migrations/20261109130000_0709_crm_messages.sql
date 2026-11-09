-- 07.09 Slim CRM Landing 2: Messages + the number (data layer).
-- Templates (never a blank box), the append-only per-send audit log,
-- the one-timeline message store + Needs Reply queue, and the feature
-- flags that keep every send surface DARK until the TCPA consent gate's
-- three executed proofs pass and Jen approves the first real send.
-- Spec: slim-crm-spec.md §§4+6. Consent records live in
-- crm_contact_consent (Landing 1); suppression lives in the Landing 1
-- DNC data layer (crm_sendable_contacts). This migration adds NO
-- provider keys and enables NO sending.

-- Feature flags: sending ships dark, by construction.
CREATE TABLE public.crm_feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.crm_feature_flags (key, enabled) VALUES
  ('sms_sending', false),
  ('email_sending', false)
ON CONFLICT (key) DO NOTHING;

-- Templates: sending opens the right template for where you are, filled
-- in from the record (spec §4). Placeholders use {{name}} syntax and a
-- render that cannot resolve every placeholder refuses to send.
CREATE TABLE public.crm_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  message_class TEXT NOT NULL CHECK (message_class IN ('transactional', 'marketing')),
  subject TEXT,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.crm_message_templates (key, channel, message_class, subject, body) VALUES
  ('tenant_move_in', 'sms', 'transactional', NULL,
   'Hi {{first_name}}, welcome to {{property_address}}! Move-in is {{move_in_date}}. Reply here with any questions. — Integrity Realty STL'),
  ('rent_reminder', 'sms', 'transactional', NULL,
   'Hi {{first_name}}, a friendly reminder: rent of {{amount}} for {{property_address}} is due {{due_date}}. — Integrity Realty STL'),
  ('late_fee_notice', 'sms', 'transactional', NULL,
   'Hi {{first_name}}, rent for {{property_address}} was due {{due_date}}; a late fee now applies. Your balance is {{balance}}. Please reach out so we can help. — Integrity Realty STL'),
  ('maintenance_follow_up', 'sms', 'transactional', NULL,
   'Hi {{first_name}}, following up on the {{issue_summary}} at {{property_address}} — is everything working now? — Integrity Realty STL'),
  ('investor_deal_alert', 'sms', 'marketing', NULL,
   'New deal: {{property_address}} — {{beds}}bd/{{baths}}ba, asking {{price}}. Reply for the full packet. — Integrity Realty STL'),
  ('seller_follow_up', 'email', 'transactional',
   'Following up on {{property_address}}',
   'Hi {{first_name}}, following up on your home at {{property_address}}. When you are ready, we can walk through next steps together. — Jen Bahr, Integrity Realty STL'),
  ('call_confirmation', 'email', 'transactional',
   'Your call is booked for {{call_time}}',
   'Hi {{first_name}}, your call is booked for {{call_time}}. We will call you at the number you gave us. Your agenda is on file — talk soon. — Integrity Realty STL')
ON CONFLICT (key) DO NOTHING;

-- Per-send audit (TCPA gate part 3): EVERY send attempt writes exactly
-- one row — sent, blocked, or failed — carrying the destination, the
-- consent basis relied on (NULL when the attempt was blocked before a
-- basis could be relied on), the blocked reason, and the message class.
-- Append-only: no UPDATE or DELETE grants.
CREATE TABLE public.crm_message_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  destination TEXT NOT NULL,
  template_key TEXT,
  body_rendered TEXT NOT NULL,
  message_class TEXT NOT NULL CHECK (message_class IN ('transactional', 'marketing')),
  consent_id UUID REFERENCES public.crm_contact_consent(id),
  consent_basis TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'blocked', 'failed')),
  blocked_reason TEXT CHECK (blocked_reason IN (
    'channel_disabled', 'do_not_contact', 'no_consent_record', 'opted_out',
    'marketing_requires_express_written', 'group_send_unapproved',
    'quiet_hours', 'template_unresolved', 'not_sendable'
  )),
  provider TEXT,
  provider_message_id TEXT,
  approved_by UUID REFERENCES auth.users(id),
  group_id UUID REFERENCES public.crm_groups(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_message_sends_contact_idx
  ON public.crm_message_sends (contact_id, created_at DESC);

-- One timeline: inbound and outbound messages with a person, in one
-- store (spec §4). Inbound rows that need an answer carry needs_reply.
CREATE TABLE public.crm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  body TEXT NOT NULL,
  send_id UUID REFERENCES public.crm_message_sends(id),
  needs_reply BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX crm_messages_contact_idx
  ON public.crm_messages (contact_id, created_at DESC);

-- The Needs Reply queue (07.09-owned; Ezzie projects it, never copies).
CREATE VIEW public.crm_needs_reply AS
SELECT m.*
FROM public.crm_messages m
JOIN public.crm_contacts c ON c.id = m.contact_id
WHERE m.direction = 'inbound'
  AND m.needs_reply = true
  AND m.replied_at IS NULL
  AND c.merged_into_id IS NULL;

ALTER TABLE public.crm_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_message_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;

-- Named-role revokes BEFORE grants (standing ACL rule; service_role
-- included because its grant on the append-only audit is narrower).
REVOKE ALL ON public.crm_feature_flags FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_message_templates FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_message_sends FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_messages FROM anon, authenticated, service_role;

GRANT SELECT, UPDATE ON public.crm_feature_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_message_templates TO authenticated;
GRANT SELECT, INSERT ON public.crm_message_sends TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_messages TO authenticated;
GRANT SELECT ON public.crm_needs_reply TO authenticated;

GRANT SELECT, UPDATE ON public.crm_feature_flags TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_message_templates TO service_role;
GRANT SELECT, INSERT ON public.crm_message_sends TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_messages TO service_role;
GRANT SELECT ON public.crm_needs_reply TO service_role;

CREATE POLICY "Admins manage CRM feature flags"
  ON public.crm_feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM templates"
  ON public.crm_message_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read CRM send audit"
  ON public.crm_message_sends FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins append CRM send audit"
  ON public.crm_message_sends FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM messages"
  ON public.crm_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
