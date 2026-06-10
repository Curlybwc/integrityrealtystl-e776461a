
DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  phone text,
  sms_opt_in boolean,
  email_opt_in boolean,
  baa_status public.baa_status,
  baa_signed_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.full_name, p.phone, p.sms_opt_in, p.email_opt_in,
         p.baa_status, p.baa_signed_at, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;
