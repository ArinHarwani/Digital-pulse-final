-- FINAL RRQ UNIFIED SCHEMA --
-- MUST RUN THIS IN MEDASSIST SUPABASE SQL EDITOR --

-- Enable PostGIS extension for map routing
CREATE EXTENSION IF NOT EXISTS postgis;

-- 0. Update MedAssist users table (Run this to add the relative contact field if patients table exists)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS relative_phone TEXT;

-- 1. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location GEOMETRY(Point, 4326),
    capacity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ambulances Table
CREATE TABLE IF NOT EXISTS public.ambulances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_name TEXT NOT NULL,
    plate_number TEXT,
    current_location GEOMETRY(Point, 4326),
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Emergencies Table (The core link, now uses MedAssist Key)
CREATE TABLE IF NOT EXISTS public.emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medassist_key TEXT NOT NULL, -- The magical link to patient records
    patient_name TEXT DEFAULT 'Unknown',
    emergency_type TEXT DEFAULT 'other',
    status TEXT DEFAULT 'pending',
    patient_location GEOMETRY(Point, 4326) NOT NULL,
    assigned_ambulance_id UUID REFERENCES public.ambulances(id),
    target_hospital_id UUID REFERENCES public.hospitals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 60-Second Auto-Override Protocol Logs
CREATE TABLE IF NOT EXISTS public.data_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medassist_key TEXT NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id),
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, DENIED
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS for emergencies (Disable or open for hackathon dev)
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Allow all insert hospitals" ON public.hospitals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update hospitals" ON public.hospitals FOR UPDATE USING (true);

CREATE POLICY "Allow all select ambulances" ON public.ambulances FOR SELECT USING (true);
CREATE POLICY "Allow all insert ambulances" ON public.ambulances FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update ambulances" ON public.ambulances FOR UPDATE USING (true);

CREATE POLICY "Allow all select emergencies" ON public.emergencies FOR SELECT USING (true);
CREATE POLICY "Allow all insert emergencies" ON public.emergencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update emergencies" ON public.emergencies FOR UPDATE USING (true);

CREATE POLICY "Allow all select accesses" ON public.data_access_requests FOR SELECT USING (true);
CREATE POLICY "Allow all insert accesses" ON public.data_access_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update accesses" ON public.data_access_requests FOR UPDATE USING (true);
