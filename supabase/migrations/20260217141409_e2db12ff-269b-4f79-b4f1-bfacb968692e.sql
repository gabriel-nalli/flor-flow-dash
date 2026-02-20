
-- Trigger to auto-set webinar_date_tag on INSERT when origem = 'webinar'
CREATE OR REPLACE FUNCTION public.set_webinar_date_tag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.origem = 'webinar' AND (NEW.webinar_date_tag IS NULL OR NEW.webinar_date_tag = '') THEN
    NEW.webinar_date_tag := 'Webinar ' || to_char(COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_set_webinar_date_tag
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.set_webinar_date_tag();

-- Backfill existing webinar leads that have null webinar_date_tag
UPDATE public.leads
SET webinar_date_tag = 'Webinar ' || to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM')
WHERE origem = 'webinar' AND (webinar_date_tag IS NULL OR webinar_date_tag = '');
