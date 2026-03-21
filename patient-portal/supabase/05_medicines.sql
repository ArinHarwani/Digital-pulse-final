-- ============================================================
-- FILE 05: Medicines Tracker Table
-- Run this FIFTH (LAST) in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS medicines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_key TEXT NOT NULL REFERENCES patients(unique_key) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    dosage      TEXT DEFAULT '',
    frequency   TEXT DEFAULT '',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (allow public access for Hackathon MVP)
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public SELECT medicines" ON medicines FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public INSERT medicines" ON medicines FOR INSERT TO public WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public DELETE medicines" ON medicines FOR DELETE TO public USING (true);
