-- Phase 4: single-account Dotloop integration (company-managed only)

CREATE TABLE IF NOT EXISTS public.company_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE CHECK (provider = 'dotloop'),
  connected boolean NOT NULL DEFAULT false,
  connected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at timestamptz,
  account_label text,
  last_sync_at timestamptz,
  access_token_expires_at timestamptz,
  health_status text,
  error_metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_integrations_dotloop_singleton_idx
  ON public.company_integrations ((provider))
  WHERE provider = 'dotloop';

ALTER TABLE public.company_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_integrations_select_admin_only ON public.company_integrations;
CREATE POLICY company_integrations_select_admin_only
ON public.company_integrations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS company_integrations_insert_admin_only ON public.company_integrations;
CREATE POLICY company_integrations_insert_admin_only
ON public.company_integrations
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS company_integrations_update_admin_only ON public.company_integrations;
CREATE POLICY company_integrations_update_admin_only
ON public.company_integrations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.dotloop_tokens (
  provider text PRIMARY KEY CHECK (provider = 'dotloop'),
  access_token text NOT NULL,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS private.dotloop_oauth_states (
  state text PRIMARY KEY,
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA private FROM authenticated;
