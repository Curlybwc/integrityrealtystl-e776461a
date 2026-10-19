-- Generic client report schedules. Report-specific settings live in config, not table columns.
CREATE TABLE public.client_email_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  source_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(config) = 'object'),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  send_mode TEXT NOT NULL DEFAULT 'automatic' CHECK (send_mode IN ('automatic', 'manual')),
  file_format TEXT NOT NULL DEFAULT 'xlsx' CHECK (file_format IN ('xlsx', 'csv')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.client_email_schedule_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.client_email_schedules(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_from DATE,
  period_to DATE,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  status TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(detail) = 'object'),
  CHECK (period_from IS NULL OR period_to IS NULL OR period_from <= period_to)
);

COMMENT ON COLUMN public.client_email_schedule_sends.sent_at IS
  'Execution timestamp for all outcomes; status = sent identifies accepted email delivery.';
COMMENT ON COLUMN public.client_email_schedule_sends.detail IS
  'Generic execution metadata, including cadenceBucket and provider/source deduplication identifiers.';

CREATE INDEX client_email_schedule_sends_schedule_time_idx
  ON public.client_email_schedule_sends (schedule_id, sent_at DESC);
CREATE INDEX client_email_schedule_sends_successful_window_idx
  ON public.client_email_schedule_sends (schedule_id, period_to)
  WHERE status = 'sent';

-- Configured delivery attempts claim the bucket before any external request.
-- Failures and interrupted deliveries are not automatically retried, avoiding duplicates
-- after ambiguous provider responses. Unconfigured previews omit cadenceBucket and
-- leave delivery eligible when Resend is configured later in the same bucket.
CREATE UNIQUE INDEX client_email_schedule_sends_cadence_bucket_key
  ON public.client_email_schedule_sends (schedule_id, (detail ->> 'cadenceBucket'))
  WHERE detail ? 'cadenceBucket';

ALTER TABLE public.client_email_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_email_schedule_sends ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_email_schedules FROM anon, authenticated;
REVOKE ALL ON public.client_email_schedule_sends FROM anon, authenticated;
GRANT SELECT ON public.client_email_schedules TO authenticated;
GRANT UPDATE (is_active) ON public.client_email_schedules TO authenticated;
GRANT SELECT ON public.client_email_schedule_sends TO authenticated;
GRANT ALL ON public.client_email_schedules TO service_role;
GRANT ALL ON public.client_email_schedule_sends TO service_role;

CREATE POLICY "Admins can view client email schedules"
  ON public.client_email_schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can pause or resume client email schedules"
  ON public.client_email_schedules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view client email schedule sends"
  ON public.client_email_schedule_sends FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.client_email_schedules (
  id, client_name, client_email, source_type, config, cadence, send_mode, file_format, is_active
) VALUES (
  'db82dccd-e9fa-4606-befa-902c57d88041',
  'Mark Parkinson',
  'mparkinson@sccmo.org',
  'sold_report',
  '{"county":"St. Charles County","lookbackDays":30}'::jsonb,
  'monthly',
  'automatic',
  'xlsx',
  true
);

-- Supabase Vault must contain service_role_key for the target project before the wake can run.
-- Never put that credential in this migration or browser configuration. RESEND_API_KEY belongs
-- in the edge-function secrets; without it, the runner builds the file and records a dry run.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

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
          WHERE name = 'service_role_key'
          ORDER BY created_at DESC LIMIT 1
        )
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    )
    WHERE EXISTS (
      SELECT 1 FROM vault.decrypted_secrets
      WHERE name = 'service_role_key' AND length(decrypted_secret) > 0
    );
  $cron$
);
