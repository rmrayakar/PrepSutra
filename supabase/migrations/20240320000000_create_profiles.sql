-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update their own profile." on profiles;
drop policy if exists "Users can delete their own profile." on profiles;

-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create profiles table with constraints
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  study_plan_count integer default 0 check (study_plan_count >= 0),
  notes_count integer default 0 check (notes_count >= 0),
  quiz_count integer default 0 check (quiz_count >= 0)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can delete their own profile."
  on profiles for delete
  using ( auth.uid() = id );

-- Create function to handle new user creation with error handling
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Check if profile already exists
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  -- Insert new profile with error handling
  begin
    insert into public.profiles (
      id,
      email,
      full_name,
      username,
      avatar_url,
      created_at,
      updated_at,
      study_plan_count,
      notes_count,
      quiz_count
    )
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', ''),
      coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
      coalesce(new.raw_user_meta_data->>'avatar_url', ''),
      now(),
      now(),
      0,
      0,
      0
    );
  exception
    when others then
      -- Log the error
      raise warning 'Error creating profile for user %: %', new.id, SQLERRM;
      -- Still return new to allow auth to complete
      return new;
  end;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updating updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at(); 