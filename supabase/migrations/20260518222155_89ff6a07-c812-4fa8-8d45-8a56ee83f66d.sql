
-- Archive the price-drop test listing so we can re-enqueue under low quota
UPDATE public.repair_analyses
SET is_active = false
WHERE mls_listing_id = '26020781' AND is_active = true;

-- Set test user quota to a tripping state (used >= limit)
INSERT INTO public.ai_analysis_quota (user_id, month_key, count, monthly_limit)
VALUES ('8f094d20-e913-4f22-bf7a-4f5bcebf90a9', to_char(now(), 'YYYY-MM'), 2, 2)
ON CONFLICT (user_id, month_key)
DO UPDATE SET count = 2, monthly_limit = 2, updated_at = now();
