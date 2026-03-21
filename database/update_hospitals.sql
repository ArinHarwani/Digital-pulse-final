-- 1. Add contact_number to hospitals table
ALTER TABLE public.hospitals 
ADD COLUMN IF NOT EXISTS contact_number TEXT DEFAULT 'Not Available';

-- 2. Prevent accidental duplicate seeding if run multiple times
-- Optionally, you can CLEAR existing hospitals to replace them cleanly:
-- TRUNCATE TABLE public.hospitals CASCADE; 
-- (Uncomment above if you want to wipe old data first, but be careful as it cascades to emergencies)

-- 3. Insert the new 6 Jodhpur Hospitals
INSERT INTO public.hospitals (name, location, capacity, contact_number)
VALUES
  (
    'JMCH (JIET Medical College & Hospital)', 
    ST_SetSRID(ST_MakePoint(73.0426116, 26.1491351), 4326), 
    150, 
    '+91 99500 59980'
  ),
  (
    'Vyas Hospital (Vyas Medicity)', 
    ST_SetSRID(ST_MakePoint(73.0591422, 26.1954483), 4326), 
    100, 
    '+91 291 295 9108'
  ),
  (
    'AIIMS Jodhpur (Emergency & Trauma Centre)', 
    ST_SetSRID(ST_MakePoint(73.0077446, 26.2387222), 4326), 
    200, 
    '+91 291 274 8200'
  ),
  (
    'Medipulse Hospital', 
    ST_SetSRID(ST_MakePoint(73.008562, 26.233819), 4326), 
    150, 
    '+91 82393 45635'
  ),
  (
    'Induscare Super Specialty Hospital', 
    ST_SetSRID(ST_MakePoint(73.0534601, 26.1394314), 4326), 
    150, 
    'Emergency Walk-In'
  ),
  (
    'Kudi Hospital', 
    ST_SetSRID(ST_MakePoint(73.0434968, 26.1921105), 4326), 
    100, 
    'Emergency Walk-In'
  );
