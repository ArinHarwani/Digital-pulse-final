-- SQL Definitions for Phase 2: MedAssist Database Setup
-- Run these in the Supabase SQL Editor

-- Table: patients
CREATE TABLE patients (
  email TEXT NOT NULL,
  unique_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  blood_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: medical_records
CREATE TABLE medical_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_key TEXT REFERENCES patients(unique_key) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Allow completely public access for this MVP (Hackathon purpose)
CREATE POLICY "Enable read access for all users" ON patients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON medical_records FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON medical_records FOR INSERT WITH CHECK (true);
