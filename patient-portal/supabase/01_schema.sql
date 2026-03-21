-- ============================================================
-- FILE 01: Main Database Schema
-- MedAssist — patients + medical_records tables
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

-- Table: patients (stores user profiles)
CREATE TABLE IF NOT EXISTS patients (
  email        TEXT NOT NULL,
  unique_key   TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  age          INTEGER DEFAULT 0,
  blood_type   TEXT DEFAULT 'Unknown',
  phone_number TEXT DEFAULT '',
  medical_conditions TEXT[] DEFAULT '{}',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Table: medical_records (stores uploaded lab reports / prescriptions)
CREATE TABLE IF NOT EXISTS medical_records (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_key TEXT REFERENCES patients(unique_key) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  date        TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Row Level Security (allow public access for Hackathon MVP)
ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public SELECT patients"        ON patients        FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public INSERT patients"        ON patients        FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public UPDATE patients"        ON patients        FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Public DELETE patients"        ON patients        FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Public SELECT medical_records" ON medical_records FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public INSERT medical_records" ON medical_records FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public DELETE medical_records" ON medical_records FOR DELETE USING (true);
