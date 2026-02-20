
-- Remove fictional lead actions
DELETE FROM public.lead_actions WHERE lead_id IN (
  '299dbc72-1daf-465c-9a4b-2ed2c41b75e4',
  'ae9a70bb-5bae-4f00-b930-97c951939799',
  '4c1f1449-bf53-43b4-9f12-fcb47eae98ce',
  '31c34f00-bddc-4706-8203-cae4c781379b',
  'af6381a2-c8d9-44f4-acf3-3a00229b8326',
  '629eeed0-bf08-4d43-b192-f218bab47e1f',
  '92b820c4-f4fd-4e13-ad2c-15c0b3d487fa',
  '4fdacfd3-0e55-42b7-81af-23cc5763e312',
  'f41cdf27-04be-40c3-8d89-f0086ca3ea71',
  '55bf642f-a39b-489a-97d7-8e9079e102a7'
);

-- Remove fictional leads (bulk-inserted seed data)
DELETE FROM public.leads WHERE id IN (
  '299dbc72-1daf-465c-9a4b-2ed2c41b75e4',
  'ae9a70bb-5bae-4f00-b930-97c951939799',
  '4c1f1449-bf53-43b4-9f12-fcb47eae98ce',
  '31c34f00-bddc-4706-8203-cae4c781379b',
  'af6381a2-c8d9-44f4-acf3-3a00229b8326',
  '629eeed0-bf08-4d43-b192-f218bab47e1f',
  '92b820c4-f4fd-4e13-ad2c-15c0b3d487fa',
  '4fdacfd3-0e55-42b7-81af-23cc5763e312',
  'f41cdf27-04be-40c3-8d89-f0086ca3ea71',
  '55bf642f-a39b-489a-97d7-8e9079e102a7'
);
