-- Create files table
create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null,
  size integer not null,
  url text not null,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.files enable row level security;

-- Create policies for files
create policy "Public files are viewable by everyone"
  on files for select
  using (is_public = true);

create policy "Users can view their own private files"
  on files for select
  using (
    is_public = false
    and auth.uid() = user_id
  );

create policy "Users can insert their own files"
  on files for insert
  with check (
    auth.uid() = user_id
    and is_public = false
  );

create policy "Admin can insert public files"
  on files for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  );

create policy "Users can update their own private files"
  on files for update
  using (
    is_public = false
    and auth.uid() = user_id
  );

create policy "Admin can update any file"
  on files for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  );

create policy "Users can delete their own private files"
  on files for delete
  using (
    is_public = false
    and auth.uid() = user_id
  );

create policy "Admin can delete any file"
  on files for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  );

-- Create function to update timestamps
create or replace function public.update_files_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating timestamps
create trigger update_files_timestamp
  before update on files
  for each row execute procedure public.update_files_timestamp();

-- Create storage bucket for files
insert into storage.buckets (id, name, public)
values ('files', 'files', true);

-- Set up storage policies for the files bucket
create policy "Public files are viewable by everyone"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and exists (
      select 1 from files
      where files.url like '%' || storage.objects.name
      and files.is_public = true
    )
  );

create policy "Users can view their own private files"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and exists (
      select 1 from files
      where files.url like '%' || storage.objects.name
      and files.is_public = false
      and files.user_id = auth.uid()
    )
  );

create policy "Users can upload their own files"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

create policy "Admin can upload public files"
  on storage.objects for insert
  with check (
    bucket_id = 'files'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  );

create policy "Users can update their own private files"
  on storage.objects for update
  using (
    bucket_id = 'files'
    and exists (
      select 1 from files
      where files.url like '%' || storage.objects.name
      and files.is_public = false
      and files.user_id = auth.uid()
    )
  );

create policy "Admin can update any file"
  on storage.objects for update
  using (
    bucket_id = 'files'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  );

create policy "Users can delete their own private files"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and exists (
      select 1 from files
      where files.url like '%' || storage.objects.name
      and files.is_public = false
      and files.user_id = auth.uid()
    )
  );

create policy "Admin can delete any file"
  on storage.objects for delete
  using (
    bucket_id = 'files'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.username = 'rmrayakar2004'
    )
  ); 