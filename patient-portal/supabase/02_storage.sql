-- ============================================================
-- FILE 02: Storage Setup
-- MedAssist — Supabase Storage bucket for medical report uploads
-- Run this SECOND in Supabase SQL Editor
-- ============================================================

-- Create a public storage bucket for uploaded medical files (PDFs, images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('record_uploads', 'record_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files
CREATE POLICY IF NOT EXISTS "Public Upload Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'record_uploads');

-- Allow anyone to read/download files
CREATE POLICY IF NOT EXISTS "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'record_uploads');

-- Allow anyone to delete files
CREATE POLICY IF NOT EXISTS "Public Delete Access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'record_uploads');
