-- Add 'age' column if it doesn't exist
ALTER TABLE public.medical_profiles 
ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 0;

-- Ensure RLS policies allow updates (just in case)
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile" 
ON public.medical_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.medical_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read medical profiles" 
ON public.medical_profiles FOR SELECT 
USING (true);
