-- Phase 7: Medical History Intake
-- Run this in the Supabase SQL Editor

ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}';
