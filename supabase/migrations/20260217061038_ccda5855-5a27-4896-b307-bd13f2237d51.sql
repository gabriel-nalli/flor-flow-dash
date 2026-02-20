
CREATE OR REPLACE FUNCTION public.try_collect_lead(p_lead_id uuid, p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('lead_collect_' || p_lead_id::text));

  IF EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = p_lead_id AND assigned_to IS NOT NULL
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.leads
  SET assigned_to = NULL,
      last_action_at = now()
  WHERE id = p_lead_id;

  RETURN true;
END;
$$;
