-- Public website lead capture (SEO fix bundle, 2026-11-06).
--
-- Until now every public intake form on integrityrealtystl.com simulated
-- its submission in the browser (a setTimeout, a success toast, and the
-- data was discarded). This table is where those forms actually land:
-- anonymous INSERT-only from the website, admin-only reads, and a handled
-- stamp for the follow-up workflow. Payloads stay JSONB so each form's
-- existing fields land verbatim without a schema per form.

CREATE TABLE public.public_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_kind text NOT NULL CHECK (form_kind IN (
    'buyer', 'investor', 'seller', 'sellfast',
    'wholesaler', 'network_partner', 'contact'
  )),
  payload jsonb NOT NULL,
  page_path text,
  handled_at timestamptz,
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.public_leads ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a lead; nobody anonymous may read one.
CREATE POLICY public_leads_insert_public
  ON public.public_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff (admin role) read and work the queue.
CREATE POLICY public_leads_read_admin
  ON public.public_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY public_leads_update_admin
  ON public.public_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Supabase default privileges would otherwise hand anon/authenticated a
-- wider set than intended; revoke first, then grant exactly what's used.
REVOKE ALL ON public.public_leads FROM anon, authenticated, service_role;
GRANT INSERT ON public.public_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.public_leads TO authenticated;
GRANT ALL ON public.public_leads TO service_role;
