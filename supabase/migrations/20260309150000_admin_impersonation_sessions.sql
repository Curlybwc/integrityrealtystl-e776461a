-- Phase 3: explicit admin impersonation support-view sessions (not auth token impersonation)

CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_impersonation_sessions_admin_idx
  ON public.admin_impersonation_sessions (admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS admin_impersonation_sessions_target_idx
  ON public.admin_impersonation_sessions (target_user_id, started_at DESC);

ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_impersonation_sessions_select_admin_only ON public.admin_impersonation_sessions;
CREATE POLICY admin_impersonation_sessions_select_admin_only
ON public.admin_impersonation_sessions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_impersonation_sessions_insert_admin_only ON public.admin_impersonation_sessions;
CREATE POLICY admin_impersonation_sessions_insert_admin_only
ON public.admin_impersonation_sessions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_impersonation_sessions_update_admin_only ON public.admin_impersonation_sessions;
CREATE POLICY admin_impersonation_sessions_update_admin_only
ON public.admin_impersonation_sessions
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.admin_start_impersonation(
  _target_user_id uuid,
  _reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_session_id uuid;
  existing_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  IF _reason IS NULL OR btrim(_reason) = '' THEN
    RAISE EXCEPTION 'reason is required';
  END IF;

  SELECT id INTO existing_id
  FROM public.admin_impersonation_sessions
  WHERE admin_user_id = auth.uid()
    AND ended_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'active impersonation already exists';
  END IF;

  INSERT INTO public.admin_impersonation_sessions (
    admin_user_id,
    target_user_id,
    reason
  ) VALUES (
    auth.uid(),
    _target_user_id,
    _reason
  )
  RETURNING id INTO new_session_id;

  INSERT INTO public.admin_audit_log (
    actor_user_id,
    target_user_id,
    action_type,
    target_table,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    _target_user_id,
    'impersonation_start',
    'admin_impersonation_sessions',
    new_session_id::text,
    jsonb_build_object('reason', _reason)
  );

  RETURN new_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_end_impersonation(
  _session_id uuid,
  _revoked boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  UPDATE public.admin_impersonation_sessions
  SET
    ended_at = now(),
    revoked_at = CASE WHEN _revoked THEN now() ELSE revoked_at END
  WHERE id = _session_id
    AND admin_user_id = auth.uid()
    AND ended_at IS NULL
  RETURNING target_user_id INTO target_id;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'active impersonation session not found';
  END IF;

  INSERT INTO public.admin_audit_log (
    actor_user_id,
    target_user_id,
    action_type,
    target_table,
    target_id,
    metadata
  ) VALUES (
    auth.uid(),
    target_id,
    'impersonation_stop',
    'admin_impersonation_sessions',
    _session_id::text,
    jsonb_build_object('revoked', _revoked)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_start_impersonation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_end_impersonation(uuid, boolean) TO authenticated;
