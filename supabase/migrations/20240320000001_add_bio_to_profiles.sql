-- Add bio column to profiles table
alter table public.profiles
add column if not exists bio text;
 
-- Update existing rows to have empty bio
update public.profiles
set bio = ''
where bio is null; 