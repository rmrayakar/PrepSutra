-- Enable Row Level Security on news_articles table
alter table news_articles enable row level security;

-- Allow users to delete their own news articles
create policy "Users can delete their own news articles"
  on news_articles for delete
  using (auth.uid() = user_id); 