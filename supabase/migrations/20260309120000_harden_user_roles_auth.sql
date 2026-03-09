-- Phase 1 auth hardening for portal-style roles

-- Clean up rows that would violate new constraints
DELETE FROM public.user_roles WHERE user_id IS NULL;
DELETE FROM public.user_roles
WHERE role NOT IN ('investor', 'wholesaler', 'partner', 'admin');

-- De-duplicate user/role pairs before adding uniqueness
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, role
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked r
WHERE ur.id = r.id
  AND r.row_num > 1;

-- Hard constraints
ALTER TABLE public.user_roles
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_role_check'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_role_check
      CHECK (role IN ('investor', 'wholesaler', 'partner', 'admin'));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_role_key
  ON public.user_roles (user_id, role);

-- Helper functions for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- RLS policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_self_or_admin ON public.user_roles;
CREATE POLICY user_roles_select_self_or_admin
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS user_roles_insert_admin_only ON public.user_roles;
CREATE POLICY user_roles_insert_admin_only
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS user_roles_update_admin_only ON public.user_roles;
CREATE POLICY user_roles_update_admin_only
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS user_roles_delete_admin_only ON public.user_roles;
CREATE POLICY user_roles_delete_admin_only
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));
