
-- Table to store manual webinar metrics per webinar date tag
CREATE TABLE public.webinar_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_tag text NOT NULL UNIQUE,
  attendees integer NOT NULL DEFAULT 0,
  stayed_until_pitch integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_metrics ENABLE ROW LEVEL SECURITY;

-- Only admin can manage webinar metrics
CREATE POLICY "admin_all_webinar_metrics"
ON public.webinar_metrics
FOR ALL
USING (get_user_role(auth.uid()) = 'ADMIN'::user_role)
WITH CHECK (get_user_role(auth.uid()) = 'ADMIN'::user_role);

-- Everyone can read
CREATE POLICY "anon_read_webinar_metrics"
ON public.webinar_metrics
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_webinar_metrics_updated_at
BEFORE UPDATE ON public.webinar_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
