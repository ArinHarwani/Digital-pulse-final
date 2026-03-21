-- Create a table for storing detailed medical profiles linked to users
create table public.medical_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  aadhaar_number text unique, -- Aadhar as a potential lookup key
  blood_group text,
  height text,
  weight text,
  allergies text,
  past_operations text,
  medical_conditions text,
  important_medical_info text, -- "Any important medical detail..."
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.medical_profiles enable row level security;

-- Policies
create policy "Users can view their own medical profile"
  on public.medical_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own medical profile"
  on public.medical_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own medical profile"
  on public.medical_profiles for update
  using (auth.uid() = user_id);
