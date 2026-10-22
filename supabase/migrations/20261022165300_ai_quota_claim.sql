CREATE OR REPLACE FUNCTION public.claim_ai_quota(p_user_id uuid, p_month_key text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO public.ai_analysis_quota AS q (user_id, month_key, count)
  VALUES (p_user_id, p_month_key, 1)
  ON CONFLICT (user_id, month_key) DO UPDATE
    SET count = q.count + 1
    WHERE q.count < q.monthly_limit
  RETURNING q.count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ai_quota(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ai_quota(uuid, text) TO service_role;
