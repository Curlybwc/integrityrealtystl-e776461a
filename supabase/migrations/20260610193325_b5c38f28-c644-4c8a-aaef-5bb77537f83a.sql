
-- 1. BAA status enum
DO $$ BEGIN
  CREATE TYPE public.baa_status AS ENUM ('not_required', 'not_sent', 'sent', 'signed', 'verified');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS sms_opt_in_ip text,
  ADD COLUMN IF NOT EXISTS email_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_opt_in_ip text,
  ADD COLUMN IF NOT EXISTS baa_status public.baa_status NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS baa_dotloop_loop_id text,
  ADD COLUMN IF NOT EXISTS baa_dotloop_document_id text,
  ADD COLUMN IF NOT EXISTS baa_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS baa_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS baa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS preview_quota_limit integer NOT NULL DEFAULT 5;

-- 3. analyzer_usage table
CREATE TABLE IF NOT EXISTS public.analyzer_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL CHECK (tool IN ('analyzer','mls_search','comp_arv')),
  context jsonb DEFAULT '{}'::jsonb,
  ran_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analyzer_usage_user_ran_at_idx ON public.analyzer_usage(user_id, ran_at DESC);

GRANT SELECT ON public.analyzer_usage TO authenticated;
GRANT ALL ON public.analyzer_usage TO service_role;
ALTER TABLE public.analyzer_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own analyzer usage" ON public.analyzer_usage;
CREATE POLICY "Users read own analyzer usage" ON public.analyzer_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all analyzer usage" ON public.analyzer_usage;
CREATE POLICY "Admins read all analyzer usage" ON public.analyzer_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. consent_log table
CREATE TABLE IF NOT EXISTS public.consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('sms','email','baa')),
  granted boolean NOT NULL,
  consent_text text NOT NULL,
  consent_version text NOT NULL DEFAULT 'v1',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS consent_log_user_idx ON public.consent_log(user_id, created_at DESC);

GRANT SELECT ON public.consent_log TO authenticated;
GRANT ALL ON public.consent_log TO service_role;
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own consents" ON public.consent_log;
CREATE POLICY "Users read own consents" ON public.consent_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all consents" ON public.consent_log;
CREATE POLICY "Admins read all consents" ON public.consent_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Access tier function: 'preview' | 'browse' | 'full'
CREATE OR REPLACE FUNCTION public.get_access_tier(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
  is_buyer_side boolean;
  is_admin boolean;
  contact_complete boolean;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN RETURN 'preview'; END IF;

  is_admin := public.has_role(_user_id, 'admin');
  IF is_admin THEN RETURN 'full'; END IF;

  is_buyer_side := public.has_role(_user_id, 'investor');
  contact_complete := p.phone IS NOT NULL AND length(trim(p.phone)) >= 10
                      AND p.sms_opt_in = true AND p.email_opt_in = true;

  -- Wholesalers & Partners: contact complete = full
  IF NOT is_buyer_side THEN
    IF contact_complete THEN RETURN 'full'; ELSE RETURN 'preview'; END IF;
  END IF;

  -- Buyer-side (investor): need contact + signed BAA
  IF NOT contact_complete THEN RETURN 'preview'; END IF;
  IF p.baa_status IN ('signed','verified') THEN RETURN 'full'; END IF;
  RETURN 'browse';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_access_tier(uuid) TO authenticated, service_role;

-- 6. Preview runs remaining helper
CREATE OR REPLACE FUNCTION public.get_preview_runs_remaining(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
  cap integer;
  tier text;
BEGIN
  tier := public.get_access_tier(_user_id);
  IF tier <> 'preview' THEN RETURN 999999; END IF;
  SELECT COALESCE(preview_quota_limit, 5) INTO cap FROM public.profiles WHERE id = _user_id;
  SELECT count(*) INTO used FROM public.analyzer_usage WHERE user_id = _user_id;
  RETURN GREATEST(cap - used, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_preview_runs_remaining(uuid) TO authenticated, service_role;

-- 7. Tighten saved_deals insert: require full tier
DROP POLICY IF EXISTS "Users insert own saved deals" ON public.saved_deals;
DROP POLICY IF EXISTS "Authenticated can insert saved_deals" ON public.saved_deals;
CREATE POLICY "Full tier users insert own saved deals" ON public.saved_deals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.get_access_tier(auth.uid()) = 'full');

-- 8. Auto-set baa_status to not_sent when investor role granted
CREATE OR REPLACE FUNCTION public.set_baa_status_on_investor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'investor' THEN
    UPDATE public.profiles
    SET baa_status = CASE WHEN baa_status = 'not_required' THEN 'not_sent'::public.baa_status ELSE baa_status END
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_baa_status_on_investor ON public.user_roles;
CREATE TRIGGER trg_set_baa_status_on_investor
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_baa_status_on_investor_role();

-- 9. Backfill existing investors to not_sent
UPDATE public.profiles p
SET baa_status = 'not_sent'
WHERE baa_status = 'not_required'
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'investor');
