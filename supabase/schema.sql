-- Supabase schema for Remine backend
-- Step 2 of the backend architecture plan:
-- - Core tables for searches and analyses
-- - Indexes for performance
-- - RLS policies for public read + service-role-only writes

create schema if not exists public;

create extension if not exists "uuid-ossp";

-- Core tables

create table if not exists public.searches (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  topic text not null,
  subreddits text[],
  time_range text not null,
  min_upvotes integer not null default 0,
  sort_by text not null,
  client_fingerprint text,
  status text not null default 'pending',
  error_message text
);

create table if not exists public.search_results (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade,
  total_mentions integer,
  total_posts_considered integer,
  total_comments_considered integer,
  source_subreddits text[],
  source_tags text[]
);

create table if not exists public.pain_points (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade,
  title text not null,
  subreddit text not null,
  mentions_count integer not null default 0,
  severity_score numeric
);

create table if not exists public.pain_point_quotes (
  id uuid primary key default uuid_generate_v4(),
  pain_point_id uuid not null references public.pain_points(id) on delete cascade,
  quote_text text not null,
  author_handle text,
  upvotes integer not null default 0,
  permalink text not null
);

create table if not exists public.ai_analyses (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade unique,
  summary text not null,
  problem_clusters jsonb not null,
  product_ideas jsonb not null,
  model text,
  tokens_used integer
);

-- Optional job logs table for observability

create table if not exists public.job_logs (
  id bigserial primary key,
  search_id uuid references public.searches(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  level text not null default 'info',
  message text not null,
  context jsonb
);

-- Indexes for performance

create index if not exists idx_searches_topic_params
  on public.searches (lower(topic), time_range, min_upvotes, sort_by);

create index if not exists idx_searches_created_at
  on public.searches (created_at desc);

create index if not exists idx_search_results_search_id
  on public.search_results (search_id);

create index if not exists idx_pain_points_search_id
  on public.pain_points (search_id);

create index if not exists idx_pain_point_quotes_pain_point_id
  on public.pain_point_quotes (pain_point_id);

create index if not exists idx_ai_analyses_search_id
  on public.ai_analyses (search_id);

-- Public view for recent searches (no internal fields)

create or replace view public.public_search_overview as
select
  s.id as search_id,
  s.created_at,
  s.topic,
  s.time_range,
  s.min_upvotes,
  s.sort_by,
  sr.total_mentions,
  sr.total_posts_considered,
  sr.total_comments_considered,
  sr.source_subreddits,
  sr.source_tags
from public.searches s
left join public.search_results sr on sr.search_id = s.id;

-- Row Level Security (RLS)

alter table public.searches enable row level security;
alter table public.search_results enable row level security;
alter table public.pain_points enable row level security;
alter table public.pain_point_quotes enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.job_logs enable row level security;

-- searches: public read, service-role writes only

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'searches'
      and policyname = 'searches_select_public'
  ) then
    create policy searches_select_public
      on public.searches
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'searches'
      and policyname = 'searches_write_service_role'
  ) then
    create policy searches_write_service_role
      on public.searches
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- search_results: public read, service-role writes only

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'search_results'
      and policyname = 'search_results_select_public'
  ) then
    create policy search_results_select_public
      on public.search_results
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'search_results'
      and policyname = 'search_results_write_service_role'
  ) then
    create policy search_results_write_service_role
      on public.search_results
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- pain_points: public read, service-role writes only

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pain_points'
      and policyname = 'pain_points_select_public'
  ) then
    create policy pain_points_select_public
      on public.pain_points
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pain_points'
      and policyname = 'pain_points_write_service_role'
  ) then
    create policy pain_points_write_service_role
      on public.pain_points
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- pain_point_quotes: public read, service-role writes only

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pain_point_quotes'
      and policyname = 'pain_point_quotes_select_public'
  ) then
    create policy pain_point_quotes_select_public
      on public.pain_point_quotes
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pain_point_quotes'
      and policyname = 'pain_point_quotes_write_service_role'
  ) then
    create policy pain_point_quotes_write_service_role
      on public.pain_point_quotes
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- ai_analyses: public read, service-role writes only

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_analyses'
      and policyname = 'ai_analyses_select_public'
  ) then
    create policy ai_analyses_select_public
      on public.ai_analyses
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_analyses'
      and policyname = 'ai_analyses_write_service_role'
  ) then
    create policy ai_analyses_write_service_role
      on public.ai_analyses
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

-- job_logs: service-role only (no public read)

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'job_logs'
      and policyname = 'job_logs_write_service_role'
  ) then
    create policy job_logs_write_service_role
      on public.job_logs
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

