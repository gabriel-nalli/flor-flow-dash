
-- Allow authenticated users to insert leads
CREATE POLICY "authenticated_insert_leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);
