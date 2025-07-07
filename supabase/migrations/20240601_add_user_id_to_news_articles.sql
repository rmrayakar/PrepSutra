-- Add user_id column to news_articles
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='news_articles' and column_name='user_id'
  ) then
    alter table news_articles add column user_id uuid references auth.users(id);
  end if;
end $$;

-- Enable RLS (if not already enabled)
alter table news_articles enable row level security;

-- Allow users to delete their own news articles
create policy if not exists "Users can delete their own news articles"
  on news_articles for delete
  using (auth.uid() = user_id); 