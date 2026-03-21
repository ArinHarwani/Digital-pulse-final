-- Run this in your Supabase SQL Editor to create the missing 'users' table

create table public.users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique not null,
  password text not null, -- stored in plain text for this prototype as per request
  name text,
  phone text,
  family_phone text,
  current_latitude float8,
  current_longitude float8,
  current_address text,
  last_location_update timestamp with time zone,
  profile_complete boolean default false,
  saved_locations jsonb default '[]'::jsonb
);

-- Enable RLS just in case, but allow public access for this prototype if needed or add policies
alter table public.users enable row level security;

create policy "Enable read access for all users" on public.users for select using (true);
create policy "Enable insert access for all users" on public.users for insert with check (true);
create policy "Enable update access for all users" on public.users for update using (true);
