-- The cron_wake_token Vault secret is created out-of-band at apply time with a random value.
-- Until it exists, the job's gate makes every wake a no-op and the RPC returns NULL, so the token path stays closed.
CREATE OR REPLACE FUNCTION public.get_cron_wake_token()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets
  WHERE name = 'cron_wake_token'
  ORDER BY created_at DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_cron_wake_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_wake_token() TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('run-client-email-schedules-daily');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'run-client-email-schedules-daily',
  '0 11 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://fsznhcezaglcosbfdfxp.supabase.co/functions/v1/run-email-schedules',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'cron_wake_token'
          ORDER BY created_at DESC LIMIT 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    )
    WHERE EXISTS (
      SELECT 1 FROM vault.decrypted_secrets
      WHERE name = 'cron_wake_token' AND length(decrypted_secret) > 0
    );
  $cron$
);
