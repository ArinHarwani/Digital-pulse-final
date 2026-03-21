-- Phase 6: Medicines Tracker
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_key TEXT NOT NULL REFERENCES patients(unique_key) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT DEFAULT '',
    frequency TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public read/insert/delete for MVP
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON medicines FOR SELECT TO public USING (true);
CREATE POLICY "Public Insert" ON medicines FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public Delete" ON medicines FOR DELETE TO public USING (true);
