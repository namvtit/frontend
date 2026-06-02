-- Stock Market MVP — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Watchlist items
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  name text,
  asset_type text default 'stock',
  exchange text,
  created_at timestamptz default now(),
  unique(user_id, symbol)
);

alter table public.watchlist_items enable row level security;

create policy "Users can view own watchlist"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on public.watchlist_items for delete
  using (auth.uid() = user_id);

-- Saved news
create table if not exists public.saved_news (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  news_id text,
  symbol text,
  title text not null,
  source text,
  url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table public.saved_news enable row level security;

create policy "Users can view own saved news"
  on public.saved_news for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved news"
  on public.saved_news for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved news"
  on public.saved_news for delete
  using (auth.uid() = user_id);

-- Recent symbols
create table if not exists public.recent_symbols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  symbol text not null,
  name text,
  viewed_at timestamptz default now(),
  unique(user_id, symbol)
);

alter table public.recent_symbols enable row level security;

create policy "Users can view own recent symbols"
  on public.recent_symbols for select
  using (auth.uid() = user_id);

create policy "Users can insert own recent symbols"
  on public.recent_symbols for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recent symbols"
  on public.recent_symbols for update
  using (auth.uid() = user_id);

create policy "Users can delete own recent symbols"
  on public.recent_symbols for delete
  using (auth.uid() = user_id);

-- User preferences
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_sectors text[] default '{}',
  risk_level text default 'medium',
  preferred_assets text[] default '{stock}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
