
DO $$
DECLARE
  demo_uid uuid;
BEGIN
  SELECT id INTO demo_uid FROM auth.users WHERE email = 'demo@platform.com';

  IF demo_uid IS NULL THEN
    demo_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', demo_uid, 'authenticated', 'authenticated',
      'demo@platform.com', crypt('demo123', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo Investor"}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), demo_uid,
      jsonb_build_object('sub', demo_uid::text, 'email', 'demo@platform.com'),
      'email', demo_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (demo_uid, 'investor'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
