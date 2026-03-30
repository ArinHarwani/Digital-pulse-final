-- 1. Enable Realtime Notifications for the Ambulance Driver System
-- If a table is not in this publication, standard Postgres_Changes listening fails silently!
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'emergencies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE emergencies;
  END IF;
END $$;

-- 2. Create the Storage Bucket for Patient Lab Reports & Medicines
INSERT INTO storage.buckets (id, name, public) 
VALUES ('record_uploads', 'record_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies to allow public Uploads and Downloads
-- Enable RLS for the storage objects table first (Standard procedure)
-- Note: Subapase storage.objects usually has RLS enabled by default now.

-- Allow anyone to upload a new physical file
CREATE POLICY "Allow public uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'record_uploads');

-- Allow anyone to view and download physical files 
CREATE POLICY "Allow public downloads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'record_uploads');

-- Allow anyone to delete files (helpful during testing)
CREATE POLICY "Allow public delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'record_uploads');
