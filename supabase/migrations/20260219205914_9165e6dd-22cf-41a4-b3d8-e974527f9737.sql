-- Migrate Carol Souza's leads from hardcoded ID to real auth ID
UPDATE leads SET assigned_to = '35f6566d-194b-4852-a148-7d29fc197c3c' WHERE assigned_to = '00000000-0000-0000-0000-000000000003';

-- Also migrate lead_actions user_id if any reference the old ID
UPDATE lead_actions SET user_id = '35f6566d-194b-4852-a148-7d29fc197c3c' WHERE user_id = '00000000-0000-0000-0000-000000000003';