DROP POLICY IF EXISTS "Authenticated can read comp_reports" ON public.comp_reports;
CREATE POLICY "Investors and admins can read comp_reports" ON public.comp_reports
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'investor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated read repair_analyses" ON public.repair_analyses;
CREATE POLICY "Investors and admins can read repair_analyses" ON public.repair_analyses
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'investor') OR public.has_role(auth.uid(), 'admin'));