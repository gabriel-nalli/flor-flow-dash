
-- Allow anonymous insert and update on webinar_metrics (app uses profile selector without real auth)
CREATE POLICY "anon_insert_webinar_metrics"
ON public.webinar_metrics
FOR INSERT
WITH CHECK (true);

CREATE POLICY "anon_update_webinar_metrics"
ON public.webinar_metrics
FOR UPDATE
USING (true);
