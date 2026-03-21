-- Phase 3.5: Add phone_number column to the patients table
-- Run this in the Supabase SQL Editor

ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '';
