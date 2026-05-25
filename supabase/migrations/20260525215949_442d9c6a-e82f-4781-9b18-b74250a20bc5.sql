DROP POLICY IF EXISTS "Authenticated can archive active comp_reports" ON public.comp_reports;

CREATE POLICY "Users archive own active comp_reports"
ON public.comp_reports
FOR UPDATE
TO authenticated
USING (
  is_active = true
  AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  is_active = false
  AND last_refreshed_by = auth.uid()
);