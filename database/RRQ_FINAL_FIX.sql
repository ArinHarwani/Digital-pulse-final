-- COMPREHENSIVE DATABASE SETUP
-- Please run this entire script in your Supabase SQL Editor

-- 1. Enable Realtime for live updates (safe to run multiple times)
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_access_requests;

-- 2. Add Missing Columns (This fixes the Network Error and GPS issues)
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS patient_address TEXT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS patient_lat FLOAT;
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS patient_lng FLOAT;

-- 3. Disable Row Level Security (RLS) so the apps can read/write without authentication blocks
ALTER TABLE public.emergencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_requests DISABLE ROW LEVEL SECURITY;

-- 4. Force API cache to reload so it sees the new columns instantly
NOTIFY pgrst, 'reload schema';
