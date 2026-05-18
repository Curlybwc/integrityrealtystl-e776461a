
-- =========================================================
-- repair_pricing_rules
-- =========================================================
CREATE TABLE public.repair_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX repair_pricing_rules_version_uniq
  ON public.repair_pricing_rules (version);
CREATE UNIQUE INDEX repair_pricing_rules_active_uniq
  ON public.repair_pricing_rules (is_active) WHERE is_active = true;

ALTER TABLE public.repair_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read pricing rules"
  ON public.repair_pricing_rules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins insert pricing rules"
  ON public.repair_pricing_rules FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update pricing rules"
  ON public.repair_pricing_rules FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed v1 default rules
INSERT INTO public.repair_pricing_rules (version, is_active, rules)
VALUES (1, true, '{
  "cost_per_cabinet": 250,
  "kitchen_fallback_replace": 9500,
  "kitchen_light_rehab": 2800,
  "countertop_per_cabinet": 180,
  "full_bath_replace": 6500,
  "half_bath_replace": 3200,
  "bath_partial": 3800,
  "bath_refresh": 1200,
  "roof_per_square": 425,
  "roof_overhead_multiplier": 1.2,
  "flooring_per_sqft": 4.5,
  "paint_drywall_per_sqft": 2.25,
  "drywall_widespread_per_sqft": 4.0,
  "hvac_replace": 7500,
  "water_heater_replace": 1400,
  "appliances": {"stove": 600, "fridge": 700, "microwave": 300, "dishwasher": 400},
  "dumpster": 1000,
  "plumbing_stack_replace": 2700,
  "foundation_reserve_monitor": 2500,
  "foundation_reserve_major": 15000,
  "basement_water_reserve_minor": 1500,
  "basement_water_reserve_major": 6000,
  "landscaping_light": 600,
  "landscaping_heavy": 2500,
  "misc_reserve": 1500,
  "window_replace_each": 550,
  "gut_per_sqft_partial": 50,
  "gut_per_sqft_high": 75
}'::jsonb);

-- =========================================================
-- repair_analyses
-- =========================================================
CREATE TABLE public.repair_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_listing_id text NOT NULL,
  evidence_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  analysis_status text NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending','analyzing','complete','failed','quota_blocked')),
  observations jsonb,
  line_items jsonb,
  total_repair_estimate numeric,
  gut_rehab_mode boolean NOT NULL DEFAULT false,
  pricing_version integer,
  engine_version text,
  model text,
  photo_count_analyzed integer,
  evidence_snapshot jsonb,
  requested_by uuid,
  priority integer NOT NULL DEFAULT 2,
  failure_reason text,
  overridden_by uuid,
  overridden_at timestamptz,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX repair_analyses_active_uniq
  ON public.repair_analyses (mls_listing_id) WHERE is_active = true;
CREATE INDEX repair_analyses_queue_idx
  ON public.repair_analyses (priority, created_at DESC)
  WHERE analysis_status IN ('pending','analyzing');
CREATE INDEX repair_analyses_user_blocked_idx
  ON public.repair_analyses (requested_by, mls_listing_id)
  WHERE analysis_status = 'quota_blocked' AND is_active = true;

ALTER TABLE public.repair_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read repair_analyses"
  ON public.repair_analyses FOR SELECT
  TO authenticated USING (true);

-- Admins may override line items / total in place
CREATE POLICY "Admins update repair_analyses"
  ON public.repair_analyses FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Inserts and worker updates flow through service role (edge functions)

CREATE TRIGGER repair_analyses_updated_at
  BEFORE UPDATE ON public.repair_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.repair_analyses;
ALTER TABLE public.repair_analyses REPLICA IDENTITY FULL;

-- =========================================================
-- ai_analysis_quota
-- =========================================================
CREATE TABLE public.ai_analysis_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_key text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  monthly_limit integer NOT NULL DEFAULT 200,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

ALTER TABLE public.ai_analysis_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own quota"
  ON public.ai_analysis_quota FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read all quota"
  ON public.ai_analysis_quota FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update quota"
  ON public.ai_analysis_quota FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ai_analysis_quota_updated_at
  BEFORE UPDATE ON public.ai_analysis_quota
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
