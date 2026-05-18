-- Saved deals: investor-owned snapshot underwriting workspaces
CREATE TABLE public.saved_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_key text NOT NULL,
  source_type text NOT NULL,
  source_tags text[] NOT NULL DEFAULT '{}',
  mls_listing_id text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT 'MO',
  zip text NOT NULL,
  beds numeric,
  baths numeric,
  sqft numeric,
  year_built integer,
  property_type text,
  list_price_at_save numeric,
  remarks_snapshot text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  underwriting jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  evidence_hash_at_save text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_key)
);

CREATE INDEX idx_saved_deals_user ON public.saved_deals(user_id);
CREATE INDEX idx_saved_deals_property_key ON public.saved_deals(property_key);

ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own saved deals"
  ON public.saved_deals FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own saved deals"
  ON public.saved_deals FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own saved deals"
  ON public.saved_deals FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own saved deals"
  ON public.saved_deals FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all saved deals"
  ON public.saved_deals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_saved_deals_updated_at
  BEFORE UPDATE ON public.saved_deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();