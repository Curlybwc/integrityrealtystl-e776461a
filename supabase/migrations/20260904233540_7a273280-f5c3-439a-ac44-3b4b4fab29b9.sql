-- Investor alert preferences
CREATE TABLE public.alert_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  min_price INTEGER,
  max_price INTEGER,
  zip_codes TEXT[] NOT NULL DEFAULT '{}',
  strategies TEXT[] NOT NULL DEFAULT '{}',
  min_beds INTEGER,
  sources TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_preferences TO authenticated;
GRANT ALL ON public.alert_preferences TO service_role;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own alert preferences"
ON public.alert_preferences FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view alert preferences"
ON public.alert_preferences FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Browser/phone push subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Log of alerts sent
CREATE TABLE public.deal_alerts_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_key TEXT NOT NULL,
  deal_address TEXT,
  deal_price INTEGER,
  deal_zip TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  push_sent INTEGER NOT NULL DEFAULT 0,
  sms_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deal_alerts_sent TO authenticated;
GRANT ALL ON public.deal_alerts_sent TO service_role;
ALTER TABLE public.deal_alerts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sent deal alerts"
ON public.deal_alerts_sent FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_alert_preferences_updated_at
BEFORE UPDATE ON public.alert_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();