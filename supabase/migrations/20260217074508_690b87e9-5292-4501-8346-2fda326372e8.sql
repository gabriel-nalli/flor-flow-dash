
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "admin_all_checklists" ON public.daily_checklists;
DROP POLICY IF EXISTS "anon_insert_checklists" ON public.daily_checklists;
DROP POLICY IF EXISTS "anon_read_checklists" ON public.daily_checklists;
DROP POLICY IF EXISTS "anon_update_checklists" ON public.daily_checklists;
DROP POLICY IF EXISTS "user_all_own_checklists" ON public.daily_checklists;

-- Recreate as PERMISSIVE policies
CREATE POLICY "anyone_can_read_checklists"
ON public.daily_checklists FOR SELECT
USING (true);

CREATE POLICY "anyone_can_insert_checklists"
ON public.daily_checklists FOR INSERT
WITH CHECK (true);

CREATE POLICY "anyone_can_update_checklists"
ON public.daily_checklists FOR UPDATE
USING (true);

CREATE POLICY "anyone_can_delete_checklists"
ON public.daily_checklists FOR DELETE
USING (true);
