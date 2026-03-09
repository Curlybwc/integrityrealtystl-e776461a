-- Phase 2: admin user/access control center schema + admin RPCs

-- Shared updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.set_row_updated_at();

-- Portal access requests
CREATE TABLE IF NOT EXISTS public.portal_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL CHECK (requested_role IN ('investor', 'wholesaler', 'partner', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_access_requests_user_id_idx
  ON public.portal_access_requests (user_id);
CREATE INDEX IF NOT EXISTS portal_access_requests_status_idx
  ON public.portal_access_requests (status);

DROP TRIGGER IF EXISTS portal_access_requests_set_updated_at ON public.portal_access_requests;
CREATE TRIGGER portal_access_requests_set_updated_at
BEFORE UPDATE ON public.portal_access_requests
FOR EACH ROW
EXECUTE PROCEDURE public.set_row_updated_at();

-- Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_table text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx ON public.admin_audit_log (actor_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx ON public.admin_audit_log (target_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;
CREATE POLICY profiles_select_self_or_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_insert_self_or_admin ON public.profiles;
CREATE POLICY profiles_insert_self_or_admin
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_access_requests_select_self_or_admin ON public.portal_access_requests;
CREATE POLICY portal_access_requests_select_self_or_admin
ON public.portal_access_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_access_requests_insert_self_or_admin ON public.portal_access_requests;
CREATE POLICY portal_access_requests_insert_self_or_admin
ON public.portal_access_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS portal_access_requests_update_admin_only ON public.portal_access_requests;
CREATE POLICY portal_access_requests_update_admin_only
ON public.portal_access_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_audit_log_select_admin_only ON public.admin_audit_log;
CREATE POLICY admin_audit_log_select_admin_only
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS admin_audit_log_insert_admin_only ON public.admin_audit_log;
CREATE POLICY admin_audit_log_insert_admin_only
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Auto-provision profile rows for new users
CREATE OR REPLACE FUNCTION public.ensure_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.ensure_profile_for_new_user();

-- Admin helper RPCs
CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL, _status text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  phone text,
  company text,
  profile_status text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[],
  approval_status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email,
    p.display_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.company,
    p.status,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(
      ARRAY(
        SELECT ur.role
        FROM public.user_roles ur
        WHERE ur.user_id = u.id
        ORDER BY ur.role
      ),
      ARRAY[]::text[]
    ) AS roles,
    (
      SELECT par.status
      FROM public.portal_access_requests par
      WHERE par.user_id = u.id
      ORDER BY par.created_at DESC
      LIMIT 1
    ) AS approval_status
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE
    public.is_admin(auth.uid())
    AND (
      _search IS NULL
      OR COALESCE(u.email, '') ILIKE ('%' || _search || '%')
      OR COALESCE(p.display_name, '') ILIKE ('%' || _search || '%')
      OR COALESCE(p.first_name, '') ILIKE ('%' || _search || '%')
      OR COALESCE(p.last_name, '') ILIKE ('%' || _search || '%')
      OR COALESCE(p.company, '') ILIKE ('%' || _search || '%')
      OR COALESCE(p.phone, '') ILIKE ('%' || _search || '%')
    )
    AND (_status IS NULL OR p.status = _status)
  ORDER BY u.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_profile(
  _target_user_id uuid,
  _display_name text,
  _first_name text,
  _last_name text,
  _email text,
  _phone text,
  _company text,
  _address_line1 text,
  _address_line2 text,
  _city text,
  _state text,
  _postal_code text,
  _notes text,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  INSERT INTO public.profiles (
    user_id, display_name, first_name, last_name, email, phone, company,
    address_line1, address_line2, city, state, postal_code, notes, status
  ) VALUES (
    _target_user_id, _display_name, _first_name, _last_name, _email, _phone, _company,
    _address_line1, _address_line2, _city, _state, _postal_code, _notes, _status
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    address_line1 = EXCLUDED.address_line1,
    address_line2 = EXCLUDED.address_line2,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    postal_code = EXCLUDED.postal_code,
    notes = EXCLUDED.notes,
    status = EXCLUDED.status;

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
    'profile_edit',
    'profiles',
    _target_user_id::text,
    jsonb_build_object('status', _status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_target_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  IF _role NOT IN ('investor', 'wholesaler', 'partner', 'admin') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

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
    'role_grant',
    'user_roles',
    _target_user_id::text,
    jsonb_build_object('role', _role)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_target_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role = _role;

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
    'role_revoke',
    'user_roles',
    _target_user_id::text,
    jsonb_build_object('role', _role)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_status(_target_user_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  IF _status NOT IN ('pending', 'active', 'disabled', 'archived') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  INSERT INTO public.profiles (user_id, status)
  VALUES (_target_user_id, _status)
  ON CONFLICT (user_id)
  DO UPDATE SET status = EXCLUDED.status;

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
    'status_change',
    'profiles',
    _target_user_id::text,
    jsonb_build_object('status', _status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_review_access_request(
  _request_id uuid,
  _decision text,
  _admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_row public.portal_access_requests%ROWTYPE;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  IF _decision NOT IN ('approved', 'denied') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT * INTO request_row
  FROM public.portal_access_requests
  WHERE id = _request_id;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'request not found';
  END IF;

  UPDATE public.portal_access_requests
  SET
    status = _decision,
    admin_notes = _admin_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = _request_id;

  IF _decision = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (request_row.user_id, request_row.requested_role)
    ON CONFLICT (user_id, role) DO NOTHING;
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
    request_row.user_id,
    'approval_decision',
    'portal_access_requests',
    _request_id::text,
    jsonb_build_object(
      'decision', _decision,
      'requested_role', request_row.requested_role,
      'admin_notes', _admin_notes
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_access_request(uuid, text, text) TO authenticated;
