-- Master Hospitals Seed Script (Jaipur + Jodhpur)
-- Run this in Supabase SQL Editor to sync your driver/hospital dashboards.

-- 1. Ensure contact_number exists
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT 'Not Available';

-- 2. Clear out old dummy hospitals (optional, un-comment if you want a clean slate)
-- TRUNCATE TABLE public.hospitals CASCADE;

-- 3. Insert specific Jaipur & Jodhpur Hospitals
INSERT INTO public.hospitals (name, location, capacity, contact_number)
VALUES
  -- JAIPUR HOSPITALS (Longitude ~75)
  ('Balaji Soni Hospital', ST_SetSRID(ST_MakePoint(75.573, 26.811), 4326), 150, '+91 141 399 9555'),
  ('Jaipur Vatika Hospital', ST_SetSRID(ST_MakePoint(75.647, 26.829), 4326), 100, '+91 96365 61225'),
  ('Manas Hospital', ST_SetSRID(ST_MakePoint(75.733, 26.896), 4326), 200, '+91 141 235 8127'),
  ('Manipal Hospital Jaipur', ST_SetSRID(ST_MakePoint(75.780, 26.960), 4326), 250, '+91 91166 56540'),
  ('Manidweep Hospital', ST_SetSRID(ST_MakePoint(75.543, 26.816), 4326), 80, '+91 98283 44443'),
  ('Bhardwaj Hospital', ST_SetSRID(ST_MakePoint(75.543, 26.821), 4326), 120, '+91 92516 58019'),
  ('Agrawal Heart & General Hospital', ST_SetSRID(ST_MakePoint(75.542, 26.818), 4326), 150, '+91 141 286 4608'),

  -- JODHPUR HOSPITALS (Longitude ~73)
  ('JMCH (JIET Medical College & Hospital)', ST_SetSRID(ST_MakePoint(73.0426116, 26.1491351), 4326), 150, '+91 99500 59980'),
  ('Vyas Hospital (Vyas Medicity)', ST_SetSRID(ST_MakePoint(73.0591422, 26.1954483), 4326), 100, '+91 291 295 9108'),
  ('AIIMS Jodhpur (Emergency & Trauma Centre)', ST_SetSRID(ST_MakePoint(73.0077446, 26.2387222), 4326), 200, '+91 291 274 8200'),
  ('Medipulse Hospital', ST_SetSRID(ST_MakePoint(73.008562, 26.233819), 4326), 150, '+91 82393 45635'),
  ('Induscare Super Specialty Hospital', ST_SetSRID(ST_MakePoint(73.0534601, 26.1394314), 4326), 150, 'Emergency Walk-In'),
  ('Kudi Hospital', ST_SetSRID(ST_MakePoint(73.0434968, 26.1921105), 4326), 100, 'Emergency Walk-In')

ON CONFLICT DO NOTHING;
