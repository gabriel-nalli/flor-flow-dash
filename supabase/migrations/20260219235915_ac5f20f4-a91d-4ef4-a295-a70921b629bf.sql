
-- Drop the restrictive policy we just created
DROP POLICY IF EXISTS "authenticated_insert_leads" ON public.leads;

-- Create a PERMISSIVE policy that allows anyone to insert leads
CREATE POLICY "anyone_can_insert_leads"
ON public.leads
FOR INSERT
WITH CHECK (true);
