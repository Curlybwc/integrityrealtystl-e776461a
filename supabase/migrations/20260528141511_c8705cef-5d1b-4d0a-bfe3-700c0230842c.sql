INSERT INTO public.user_roles (user_id, role)
SELECT id, 'wholesaler'::app_role FROM auth.users WHERE email = 'demo@platform.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'partner'::app_role FROM auth.users WHERE email = 'demo@platform.com'
ON CONFLICT (user_id, role) DO NOTHING;