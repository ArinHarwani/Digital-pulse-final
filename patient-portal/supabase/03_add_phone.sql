-- ============================================================
-- FILE 03: Add Phone Number Column
-- Run this THIRD in Supabase SQL Editor
-- (Safe to skip if you ran 01_schema.sql fresh — it's already included)
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
