-- Run this in your Supabase SQL Editor to finalize the database for the Driver and Hospital apps

-- 1. Add Readable Address column to emergencies
ALTER TABLE public.emergencies ADD COLUMN IF NOT EXISTS patient_address TEXT;

-- 2. Make sure Realtime is enabled (in case it was missed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_access_requests;

-- 3. Ensure RLS is open for the hackathon
ALTER TABLE public.emergencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_requests DISABLE ROW LEVEL SECURITY;
