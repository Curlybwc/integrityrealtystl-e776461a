-- 07.09 Slim CRM Landing 3: Pipelines + Admin Pool + Scheduled Calls.
-- Spec: slim-crm-spec.md §§3+5. Pipeline place is a fact on the
-- contact's record with provenance, never a separate list. New leads
-- land in the Admin Pool: crm_visible_contacts is the permission-shaped
-- read path — admins (Jen + Samantha) see everything; an agent sees
-- ONLY contacts with an active assignment to them, so an unassigned
-- lead does not exist for that login, not even as a count. Bookings
-- cannot be confirmed without an agenda (CHECK + the booking path);
-- a call's record is complete only with its dated transcript
-- (crm_incomplete_calls surfaces the rest). Calls and the booking page
-- ship DARK: flags off, no voice enabled, no page routed.

-- Timeline learns the Landing-3 event kinds.
ALTER TABLE public.crm_contact_events
  DROP CONSTRAINT crm_contact_events_event_check;
ALTER TABLE public.crm_contact_events
  ADD CONSTRAINT crm_contact_events_event_check CHECK (event IN (
    'created', 'source_added', 'merged', 'unmerged',
    'group_joined', 'group_left', 'dnc_set', 'dnc_cleared',
    'consent_recorded', 'consent_opt_out',
    'lead_received', 'assigned', 'unassigned',
    'pipeline_placed', 'pipeline_moved',
    'call_booked', 'call_completed', 'transcript_filed'
  ));

INSERT INTO public.crm_feature_flags (key, enabled) VALUES
  ('calls_enabled', false),
  ('booking_page_live', false)
ON CONFLICT (key) DO NOTHING;

-- The two pipelines (spec §3 — just two to start; tenants get NO
-- pipeline, their stages live in the lease system).
CREATE TABLE public.crm_pipelines (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stages JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.crm_pipelines (key, name, stages) VALUES
  ('investor_buyers', 'Investor buyers', '[
    {"key":"new","label":"New"},
    {"key":"talking","label":"Talking"},
    {"key":"wants_saved","label":"Wants saved"},
    {"key":"getting_deals","label":"Getting deals","next_step_task":"No reply in 7 days → follow-up task"},
    {"key":"under_contract","label":"Under contract"},
    {"key":"closed","label":"Closed"},
    {"key":"repeat_buyer","label":"Repeat buyer"}
  ]'::jsonb),
  ('sellers', 'Sellers', '[
    {"key":"new","label":"New"},
    {"key":"talking","label":"Talking"},
    {"key":"valuation_sent","label":"Valuation sent","next_step_task":"No reply in 7 days → follow-up task"},
    {"key":"listing_prep","label":"Listing prep"},
    {"key":"live","label":"Live"},
    {"key":"under_contract","label":"Under contract"},
    {"key":"closed","label":"Closed"}
  ]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- A contact's place on a pipeline: one row per contact per pipeline,
-- with the source that put them there (provenance, per spec §3).
CREATE TABLE public.crm_pipeline_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  pipeline_key TEXT NOT NULL REFERENCES public.crm_pipelines(key),
  stage TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  actor_id UUID REFERENCES auth.users(id),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, pipeline_key)
);

-- Assignment is an explicit act with a trail: who assigned, when, from
-- what source. Active = unassigned_at IS NULL.
CREATE TABLE public.crm_lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  source TEXT NOT NULL DEFAULT 'admin_pool',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ
);
CREATE INDEX crm_lead_assignments_active_idx
  ON public.crm_lead_assignments (assignee_id) WHERE unassigned_at IS NULL;

-- THE permission-shaped read path for contacts. Admins see all; an
-- agent sees only their actively-assigned contacts. Every list and
-- every count an agent's surface shows must come through this view —
-- an unassigned lead is absent from its rows AND its counts.
CREATE VIEW public.crm_visible_contacts AS
SELECT c.*
FROM public.crm_contacts c
WHERE public.has_role(auth.uid(), 'admin')
   OR EXISTS (
     SELECT 1 FROM public.crm_lead_assignments a
     WHERE a.contact_id = c.id
       AND a.assignee_id = auth.uid()
       AND a.unassigned_at IS NULL
   );

-- Scheduled calls (spec §5): a booking is a request until the agenda
-- check passes — agenda AND questions are required by the table itself.
CREATE TABLE public.crm_call_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  agenda TEXT NOT NULL CHECK (char_length(btrim(agenda)) > 0),
  questions TEXT NOT NULL CHECK (char_length(btrim(questions)) > 0),
  requested_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'website',
  brief TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A call: outbound from the desktop in the CRM. The transcript is the
-- record (Jen will not listen to recordings); its DATE is first-class.
CREATE TABLE public.crm_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.crm_call_bookings(id),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound')),
  transport TEXT NOT NULL,
  transport_ref TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  recording_ref TEXT,
  transcript TEXT,
  transcript_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Untranscribed calls surface as INCOMPLETE — the record says so.
CREATE VIEW public.crm_incomplete_calls AS
SELECT *
FROM public.crm_calls
WHERE transcript IS NULL;

ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_call_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_calls ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.crm_pipelines FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_pipeline_places FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_lead_assignments FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_call_bookings FROM anon, authenticated, service_role;
REVOKE ALL ON public.crm_calls FROM anon, authenticated, service_role;

GRANT SELECT ON public.crm_pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_pipeline_places TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_lead_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_call_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_calls TO authenticated;
GRANT SELECT ON public.crm_visible_contacts TO authenticated;
GRANT SELECT ON public.crm_incomplete_calls TO authenticated;

GRANT SELECT ON public.crm_pipelines TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_pipeline_places TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_lead_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_call_bookings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.crm_calls TO service_role;
GRANT SELECT ON public.crm_visible_contacts TO service_role;
GRANT SELECT ON public.crm_incomplete_calls TO service_role;

CREATE POLICY "Admins read CRM pipelines"
  ON public.crm_pipelines FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM pipeline places"
  ON public.crm_pipeline_places FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM lead assignments"
  ON public.crm_lead_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM call bookings"
  ON public.crm_call_bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage CRM calls"
  ON public.crm_calls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
