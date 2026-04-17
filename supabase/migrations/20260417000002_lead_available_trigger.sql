-- Trigger function: calls send-push-notification edge function when a lead arrives unassigned
-- send-push-notification has verify_jwt=false so no auth header needed
CREATE OR REPLACE FUNCTION public.notify_lead_available()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NULL THEN
    PERFORM net.http_post(
      url := 'https://vnrfzgbqiagxidcaeanr.supabase.co/functions/v1/send-push-notification',
      body := jsonb_build_object('lead_id', NEW.id, 'lead_nome', NEW.nome),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block lead insertion if push fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_available ON public.leads;
CREATE TRIGGER on_lead_available
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_lead_available();
