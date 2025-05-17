create table if not exists analyzed_articles (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  title text not null,
  content text not null,
  author text,
  published_date timestamp with time zone,
  source text,
  summary text,
  key_points text[],
  categories text[],
  tags text[],
  analysis_status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  user_id uuid references auth.users(id)
);

-- Create indexes
create index if not exists analyzed_articles_url_idx on analyzed_articles(url);
create index if not exists analyzed_articles_user_id_idx on analyzed_articles(user_id);
create index if not exists analyzed_articles_analysis_status_idx on analyzed_articles(analysis_status);

-- Enable RLS
alter table analyzed_articles enable row level security;

-- Create policies
create policy "Users can view their own analyzed articles"
  on analyzed_articles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analyzed articles"
  on analyzed_articles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own analyzed articles"
  on analyzed_articles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own analyzed articles"
  on analyzed_articles for delete
  using (auth.uid() = user_id); 