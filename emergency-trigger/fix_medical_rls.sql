-- Drop the restrictive policies that rely on auth.uid()
drop policy if exists "Users can view their own medical profile" on public.medical_profiles;
drop policy if exists "Users can insert their own medical profile" on public.medical_profiles;
drop policy if exists "Users can update their own medical profile" on public.medical_profiles;

-- Create permissive policies (since we are handling auth manually in the prototype)
create policy "Enable read access for all users"
  on public.medical_profiles for select
  using (true);

create policy "Enable insert access for all users"
  on public.medical_profiles for insert
  with check (true);

create policy "Enable update access for all users"
  on public.medical_profiles for update
  using (true);
