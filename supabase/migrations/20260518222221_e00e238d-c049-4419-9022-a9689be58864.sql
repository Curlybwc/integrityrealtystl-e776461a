
-- Restore quota
UPDATE public.ai_analysis_quota
SET monthly_limit = 200, count = 4, updated_at = now()
WHERE user_id = '8f094d20-e913-4f22-bf7a-4f5bcebf90a9'
  AND month_key = to_char(now(), 'YYYY-MM');

-- Remove the quota_blocked sentinel
UPDATE public.repair_analyses
SET is_active = false
WHERE mls_listing_id = '26020781'
  AND analysis_status = 'quota_blocked'
  AND is_active = true;

-- Re-activate the original completed analysis for 26020781
UPDATE public.repair_analyses
SET is_active = true
WHERE id = '125ec50b-75bb-4f98-829d-7893ee0b2ac2';
