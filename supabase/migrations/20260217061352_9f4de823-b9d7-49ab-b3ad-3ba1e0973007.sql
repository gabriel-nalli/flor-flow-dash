
-- Remove FK constraint so mock UUIDs can be used without needing auth.users
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_assigned_to_fkey;
