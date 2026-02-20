
-- Remove FK constraint so mock user_ids can be used without real auth.users entries
ALTER TABLE public.daily_checklists DROP CONSTRAINT IF EXISTS daily_checklists_user_id_fkey;

-- Also remove FK on profiles so mock profiles can be inserted
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Now insert mock profiles
INSERT INTO public.profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'ADMIN'),
  ('00000000-0000-0000-0000-000000000002', 'Carol B', 'VENDEDORA'),
  ('00000000-0000-0000-0000-000000000003', 'Carol Souza', 'VENDEDORA'),
  ('00000000-0000-0000-0000-000000000004', 'Maria', 'SDR'),
  ('00000000-0000-0000-0000-000000000005', 'Sabrina', 'SOCIAL_SELLER')
ON CONFLICT (id) DO NOTHING;
