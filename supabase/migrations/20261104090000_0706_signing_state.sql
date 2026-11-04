-- 07.06 Packet INT-07.06-2: normalized signing state.
-- Durable signature-request records behind the provider abstraction.
-- The BAA profile columns from 20260610193325 stay as business metadata;
-- baa_dotloop_* remain read-only history (spec stub registry) and are
-- NOT altered here. Provider completion is the only path to 'signed'
-- (the bridge lives in _shared/signing/state.ts); 'verified' stays a
-- staff mark in admin-update-baa.

CREATE TABLE public.signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'baa' CHECK (kind IN ('baa')),
  provider TEXT NOT NULL,
  provider_document_id TEXT,
  status TEXT NOT NULL DEFAULT 'prepared' CHECK (status IN (
    'prepared', 'sent', 'partially_signed', 'completed',
    'declined', 'revoked', 'expired'
  )),
  template_ref TEXT,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX signature_requests_provider_document_key
  ON public.signature_requests (provider, provider_document_id)
  WHERE provider_document_id IS NOT NULL;
CREATE INDEX signature_requests_owner_idx
  ON public.signature_requests (owner_id, created_at DESC);

CREATE TABLE public.signature_request_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'signer',
  signer_order INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX signature_request_signers_request_idx
  ON public.signature_request_signers (request_id);

-- Append-only provider event log; the webhook writer lands in Packet 3.
CREATE TABLE public.signature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  provider_event TEXT NOT NULL,
  normalized_status TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX signature_events_request_idx
  ON public.signature_events (request_id, created_at);

-- Provider binding for the BAA flow (new columns; legacy Dotloop columns
-- are left exactly as they are).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS baa_provider TEXT,
  ADD COLUMN IF NOT EXISTS baa_signing_request_id UUID
    REFERENCES public.signature_requests(id);

ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_request_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.signature_requests FROM anon, authenticated;
REVOKE ALL ON public.signature_request_signers FROM anon, authenticated;
REVOKE ALL ON public.signature_events FROM anon, authenticated;
-- Reads only for clients: all writes flow through edge functions running
-- as service_role, so a client can never fabricate a signing state.
GRANT SELECT ON public.signature_requests TO authenticated;
GRANT SELECT ON public.signature_request_signers TO authenticated;
GRANT SELECT ON public.signature_events TO authenticated;
GRANT ALL ON public.signature_requests TO service_role;
GRANT ALL ON public.signature_request_signers TO service_role;
GRANT ALL ON public.signature_events TO service_role;

CREATE POLICY "Owners can view their own signature requests"
  ON public.signature_requests FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view signers of their own requests"
  ON public.signature_request_signers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.signature_requests r
    WHERE r.id = request_id
      AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "Owners can view events of their own requests"
  ON public.signature_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.signature_requests r
    WHERE r.id = request_id
      AND (r.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));
