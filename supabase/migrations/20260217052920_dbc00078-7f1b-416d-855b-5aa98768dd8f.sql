
-- Helper function for role checking (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id;
$$;

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "auth_insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- LEAD_ACTIONS RLS
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_lead_actions" ON public.lead_actions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'ADMIN') WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "user_insert_own_actions" ON public.lead_actions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_select_own_actions" ON public.lead_actions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_select_actions_on_assigned_leads" ON public.lead_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_actions.lead_id AND leads.assigned_to = auth.uid()));

-- DAILY_CHECKLISTS RLS
ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_checklists" ON public.daily_checklists FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'ADMIN') WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "user_all_own_checklists" ON public.daily_checklists FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- FIX LEADS POLICIES (replace restrictive with permissive)
DROP POLICY IF EXISTS "Admins can do everything" ON public.leads;
DROP POLICY IF EXISTS "Admins can do everything " ON public.leads;
DROP POLICY IF EXISTS "Users view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users view assigned leads " ON public.leads;

CREATE POLICY "admin_all_leads" ON public.leads FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'ADMIN') WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "user_select_assigned_leads" ON public.leads FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY "user_update_assigned_leads" ON public.leads FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());
