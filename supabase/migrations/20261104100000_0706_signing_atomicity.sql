-- 07.06 Packet INT-07.06-2 fix round (gate P1s on PR #36):
-- (1) Serialize the BAA idempotency check BEFORE the provider send: a
--     claim row in status 'prepared' now reserves the (owner, kind)
--     slot, and this partial unique index lets exactly one open request
--     exist per owner+kind — a concurrent second send fails its claim
--     insert instead of racing past the already-sent check.
-- (2) Make the post-send writes atomic: complete_baa_send performs the
--     request completion + signer insert + profile update in ONE
--     transaction, so a failure (e.g. signer insert) can never leave a
--     committed request row with no signers or a half-marked profile.

CREATE UNIQUE INDEX IF NOT EXISTS signature_requests_one_open_per_owner_kind
  ON public.signature_requests (owner_id, kind)
  WHERE status IN ('prepared', 'sent', 'partially_signed');

CREATE OR REPLACE FUNCTION public.complete_baa_send(
  p_request_id UUID,
  p_provider TEXT,
  p_provider_document_id TEXT,
  p_signer_name TEXT,
  p_signer_email TEXT,
  p_sent_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  UPDATE public.signature_requests
  SET status = 'sent',
      provider = p_provider,
      provider_document_id = p_provider_document_id,
      updated_at = now()
  WHERE id = p_request_id
    AND status IN ('prepared', 'sent', 'partially_signed')
  RETURNING owner_id INTO v_owner_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'signature request % is not in a completable state', p_request_id;
  END IF;

  INSERT INTO public.signature_request_signers (request_id, name, email, role, signer_order, status)
  SELECT p_request_id, p_signer_name, p_signer_email, 'Buyer', 1, 'pending'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.signature_request_signers s
    WHERE s.request_id = p_request_id AND s.email = p_signer_email
  );

  UPDATE public.profiles
  SET baa_status = 'sent',
      baa_sent_at = p_sent_at,
      baa_provider = p_provider,
      baa_signing_request_id = p_request_id
  WHERE id = v_owner_id;
END;
$$;

-- Service-role only: clients must never complete a send directly.
REVOKE ALL ON FUNCTION public.complete_baa_send(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_baa_send(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  TO service_role;
