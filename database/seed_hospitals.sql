-- Seed hospitals table with 5 Jaipur hospitals for demo
-- Run this in Supabase SQL Editor

INSERT INTO public.hospitals (name, location, capacity)
VALUES
  ('Mahatma Gandhi Hospital (MGH)', ST_SetSRID(ST_MakePoint(75.8550, 26.7690), 4326), 150),
  ('Bombay Hospital Jaipur', ST_SetSRID(ST_MakePoint(75.8600, 26.7850), 4326), 100),
  ('Narayana Multispeciality Hospital', ST_SetSRID(ST_MakePoint(75.8350, 26.8080), 4326), 200),
  ('RUHS College of Medical Sciences', ST_SetSRID(ST_MakePoint(75.8400, 26.8100), 4326), 300),
  ('Jeevan Rekha Superspeciality', ST_SetSRID(ST_MakePoint(75.8200, 26.8150), 4326), 80)
ON CONFLICT DO NOTHING;
