-- ============================================================
-- FILE 04: Add Medical Conditions Column
-- Run this FOURTH in Supabase SQL Editor
-- (Safe to skip if you ran 01_schema.sql fresh — it's already included)
-- ============================================================

-- Stores an array of pre-existing conditions e.g. ['Diabetes', 'Asthma']
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}';
