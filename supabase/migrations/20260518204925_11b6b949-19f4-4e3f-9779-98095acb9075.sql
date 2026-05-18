
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.comp_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_key text NOT NULL,
  mls_listing_id text,
  address text,
  zip text,
  created_by uuid NOT NULL,
  last_refreshed_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'current',
  is_active boolean NOT NULL DEFAULT true,
  engine_version text,
  scoring_version text,
  subject jsonb NOT NULL,
  search_criteria jsonb,
  result jsonb NOT NULL,
  arv_conservative numeric,
  arv_likely numeric,
  arv_aggressive numeric,
  confidence integer,
  confidence_band text,
  driver_tier text,
  included_comp_count integer NOT NULL DEFAULT 0,
  strong_comp_count integer NOT NULL DEFAULT 0,
  good_comp_count integer NOT NULL DEFAULT 0,
  fallback_comp_count integer NOT NULL DEFAULT 0,
  excluded_comp_count integer NOT NULL DEFAULT 0,
  fallback_used boolean NOT NULL DEFAULT false,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX comp_reports_active_uniq
  ON public.comp_reports (property_key) WHERE is_active;
CREATE INDEX comp_reports_property_refreshed_idx
  ON public.comp_reports (property_key, refreshed_at DESC);
CREATE INDEX comp_reports_mls_idx ON public.comp_reports (mls_listing_id);
CREATE INDEX comp_reports_status_idx ON public.comp_reports (status);

ALTER TABLE public.comp_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read comp_reports"
  ON public.comp_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert comp_reports"
  ON public.comp_reports FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authenticated can archive active comp_reports"
  ON public.comp_reports FOR UPDATE TO authenticated
  USING (is_active = true)
  WITH CHECK (is_active = false AND last_refreshed_by = auth.uid());

CREATE TRIGGER update_comp_reports_updated_at
  BEFORE UPDATE ON public.comp_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.comp_report_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.comp_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE INDEX comp_report_overrides_user_idx
  ON public.comp_report_overrides (user_id, report_id);

ALTER TABLE public.comp_report_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own overrides"
  ON public.comp_report_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users insert own overrides"
  ON public.comp_report_overrides FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own overrides"
  ON public.comp_report_overrides FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users delete own overrides"
  ON public.comp_report_overrides FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_comp_report_overrides_updated_at
  BEFORE UPDATE ON public.comp_report_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
