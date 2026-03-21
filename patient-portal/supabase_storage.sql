-- SQL Definitions for Phase 3: Supabase Storage configuration
-- Run these in the Supabase SQL Editor

-- 1. Create a new Storage bucket called 'record_uploads'
INSERT INTO storage.buckets (id, name, public) VALUES ('record_uploads', 'record_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to upload files to this bucket (For MVP Hackathon simplicity)
CREATE POLICY "Public Upload Access" 
ON storage.objects FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'record_uploads');

-- 3. Allow public access to read files from this bucket
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'record_uploads');
