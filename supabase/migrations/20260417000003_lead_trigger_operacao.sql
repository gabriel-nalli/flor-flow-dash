-- Atualiza trigger da tabela leads (Thaylor) para enviar o nome da operação
CREATE OR REPLACE FUNCTION public.notify_lead_available()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NULL THEN
    PERFORM net.http_post(
      url := 'https://vnrfzgbqiagxidcaeanr.supabase.co/functions/v1/send-push-notification',
      body := jsonb_build_object('lead_id', NEW.id, 'lead_nome', NEW.nome, 'operacao', 'Thaylor'),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_available ON public.leads;
CREATE TRIGGER on_lead_available
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_lead_available();

-- Trigger na tabela leads_alicia (Alicia)
CREATE OR REPLACE FUNCTION public.notify_lead_alicia_available()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NULL THEN
    PERFORM net.http_post(
      url := 'https://vnrfzgbqiagxidcaeanr.supabase.co/functions/v1/send-push-notification',
      body := jsonb_build_object('lead_id', NEW.id, 'lead_nome', NEW.nombre, 'operacao', 'Alicia'),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_alicia_available ON public.leads_alicia;
CREATE TRIGGER on_lead_alicia_available
  AFTER INSERT ON public.leads_alicia
  FOR EACH ROW EXECUTE FUNCTION public.notify_lead_alicia_available();
