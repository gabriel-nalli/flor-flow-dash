
-- Allow anon read access for MVP (no auth)
CREATE POLICY "anon_read_leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "anon_read_profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "anon_read_lead_actions" ON public.lead_actions FOR SELECT USING (true);
CREATE POLICY "anon_read_checklists" ON public.daily_checklists FOR SELECT USING (true);

-- Allow anon write for MVP
CREATE POLICY "anon_insert_lead_actions" ON public.lead_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "anon_update_checklists" ON public.daily_checklists FOR UPDATE USING (true);
CREATE POLICY "anon_insert_checklists" ON public.daily_checklists FOR INSERT WITH CHECK (true);
