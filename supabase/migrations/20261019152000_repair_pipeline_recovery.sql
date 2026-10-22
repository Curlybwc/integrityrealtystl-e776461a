ALTER TABLE public.repair_analyses
  ADD COLUMN attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN failure_kind text,
  ADD COLUMN failure_detail jsonb;

ALTER TABLE public.repair_analyses
  ADD CONSTRAINT repair_analyses_failure_kind_check
  CHECK (failure_kind IS NULL OR failure_kind IN ('transient', 'permanent'));
