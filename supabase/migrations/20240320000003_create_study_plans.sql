-- Create study_plans table
create table if not exists public.study_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  start_date timestamp with time zone not null default timezone('Asia/Kolkata'::text, now()),
  end_date timestamp with time zone,
  created_at timestamp with time zone default timezone('Asia/Kolkata'::text, now()) not null,
  updated_at timestamp with time zone default timezone('Asia/Kolkata'::text, now()) not null
);

-- Create study_tasks table
create table if not exists public.study_tasks (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.study_plans on delete cascade not null,
  title text not null,
  description text,
  due_date timestamp with time zone,
  priority text check (priority in ('low', 'medium', 'high')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  created_at timestamp with time zone default timezone('Asia/Kolkata'::text, now()) not null,
  updated_at timestamp with time zone default timezone('Asia/Kolkata'::text, now()) not null
);

-- Create function to update timestamps
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('Asia/Kolkata'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updating timestamps
create trigger update_study_plans_timestamp
  before update on study_plans
  for each row execute procedure public.update_timestamp();

create trigger update_study_tasks_timestamp
  before update on study_tasks
  for each row execute procedure public.update_timestamp();

-- Enable Row Level Security
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;

-- Create policies for study_plans
create policy "Users can view their own study plans"
  on study_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own study plans"
  on study_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own study plans"
  on study_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own study plans"
  on study_plans for delete
  using (auth.uid() = user_id);

-- Create policies for study_tasks
create policy "Users can view tasks from their study plans"
  on study_tasks for select
  using (
    exists (
      select 1 from study_plans
      where study_plans.id = study_tasks.plan_id
      and study_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert tasks to their study plans"
  on study_tasks for insert
  with check (
    exists (
      select 1 from study_plans
      where study_plans.id = study_tasks.plan_id
      and study_plans.user_id = auth.uid()
    )
  );

create policy "Users can update tasks from their study plans"
  on study_tasks for update
  using (
    exists (
      select 1 from study_plans
      where study_plans.id = study_tasks.plan_id
      and study_plans.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks from their study plans"
  on study_tasks for delete
  using (
    exists (
      select 1 from study_plans
      where study_plans.id = study_tasks.plan_id
      and study_plans.user_id = auth.uid()
    )
  );

-- Create function to update study_plan_count in profiles
create or replace function public.handle_study_plan_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles
    set study_plan_count = study_plan_count + 1
    where id = new.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles
    set study_plan_count = study_plan_count - 1
    where id = old.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Create triggers for study_plan_count
create trigger on_study_plan_insert
  after insert on study_plans
  for each row execute procedure public.handle_study_plan_count();

create trigger on_study_plan_delete
  after delete on study_plans
  for each row execute procedure public.handle_study_plan_count(); 