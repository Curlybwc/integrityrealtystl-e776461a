CREATE OR REPLACE FUNCTION public.refund_ai_quota(p_user_id uuid, p_month_key text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ai_analysis_quota
  SET count = GREATEST(count - 1, 0)
  WHERE user_id = p_user_id
    AND month_key = p_month_key
  RETURNING count;
$$;

REVOKE ALL ON FUNCTION public.refund_ai_quota(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_quota(uuid, text) TO service_role;
