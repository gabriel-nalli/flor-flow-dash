
CREATE OR REPLACE FUNCTION public.try_collect_lead(p_lead_id uuid, p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Serialize access to this lead
  PERFORM pg_advisory_xact_lock(hashtext('lead_collect_' || p_lead_id::text));

  -- Check if already assigned
  IF EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = p_lead_id AND assigned_to IS NOT NULL
  ) THEN
    RETURN false;
  END IF;

  -- Assign the lead
  UPDATE public.leads
  SET assigned_to = p_user_id::uuid,
      last_action_at = now()
  WHERE id = p_lead_id;

  RETURN true;
END;
$$;
