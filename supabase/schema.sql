create schema if not exists public;

create extension if not exists "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

create table if not exists public.searches (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz,
  topic text not null,
  subreddits text[], -- Used as HN tags for hackernews
  time_range text not null,
  min_upvotes integer not null default 0,
  sort_by text not null,
  client_fingerprint text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  -- Retry tracking for pg_cron
  retry_count integer not null default 0,
  last_retry_at timestamptz,
  next_retry_at timestamptz
);

create table if not exists public.search_results (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade unique,
  total_mentions integer,
  total_posts_considered integer,
  total_comments_considered integer,
  source_subreddits text[], -- Deprecated, use source_tags
  source_tags text[]
);

create table if not exists public.pain_points (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade,
  title text not null,
  subreddit text not null, -- Used as source tag for hackernews
  mentions_count integer not null default 0,
  severity_score numeric check (severity_score >= 0 and severity_score <= 10)
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
  tokens_used integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================================
-- OBSERVABILITY & COST TRACKING TABLES
-- ============================================================================

create table if not exists public.job_logs (
  id bigserial primary key,
  search_id uuid references public.searches(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  level text not null default 'info' check (level in ('info', 'error', 'warn')),
  message text not null,
  context jsonb
);

create table if not exists public.api_usage (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid references public.searches(id) on delete cascade,
  service text not null, -- 'gemini', 'openai', etc.
  tokens_used integer,
  estimated_cost_usd numeric(10, 6),
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Search events: incremental streaming of progress via Supabase Realtime
create table if not exists public.search_events (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid not null references public.searches(id) on delete cascade,
  phase text not null check (phase in ('stories', 'comments', 'analysis')),
  event_type text not null check (event_type in ('story_discovered', 'comment_discovered', 'phase_progress')),
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_search_events_search_id_created_at
  on public.search_events (search_id, created_at);

-- Searches: Composite index for cache lookup by normalized parameters
create index if not exists idx_searches_cache_lookup
  on public.searches (lower(topic), time_range, min_upvotes, sort_by)
  where status = 'completed';

-- Searches: Recent searches feed
create index if not exists idx_searches_created_at
  on public.searches (created_at desc)
  where status = 'completed';

-- Searches: Status filtering (for retry jobs)
create index if not exists idx_searches_status
  on public.searches (status, created_at)
  where status in ('pending', 'processing');

-- Searches: Retry tracking
create index if not exists idx_searches_retry
  on public.searches (next_retry_at)
  where status in ('pending', 'processing') and retry_count < 3;

-- Search results: Foreign key lookup
create index if not exists idx_search_results_search_id
  on public.search_results (search_id);

-- Pain points: Foreign key lookup + ordering
create index if not exists idx_pain_points_search_id
  on public.pain_points (search_id, severity_score desc nulls last);

-- Pain point quotes: Foreign key lookup + ordering
create index if not exists idx_pain_point_quotes_pain_point_id
  on public.pain_point_quotes (pain_point_id, upvotes desc);

-- AI analyses: Foreign key lookup
create index if not exists idx_ai_analyses_search_id
  on public.ai_analyses (search_id);

-- Job logs: Search lookup + time-based filtering
create index if not exists idx_job_logs_search_id
  on public.job_logs (search_id, created_at desc);

create index if not exists idx_job_logs_level
  on public.job_logs (level, created_at desc)
  where level = 'error';

-- API usage: Cost tracking and analytics
create index if not exists idx_api_usage_search_id
  on public.api_usage (search_id);

create index if not exists idx_api_usage_created_at
  on public.api_usage (created_at desc);

create index if not exists idx_api_usage_service
  on public.api_usage (service, created_at desc);

-- ============================================================================
-- PUBLIC VIEWS FOR SAFE DATA ACCESS
-- ============================================================================

-- Recent searches overview (excludes internal fields)
create or replace view public.public_search_overview as
select
  s.id as search_id,
  s.created_at,
  s.completed_at,
  s.topic,
  s.time_range,
  s.min_upvotes,
  s.sort_by,
  s.status,
  sr.total_mentions,
  sr.total_posts_considered,
  sr.total_comments_considered,
  sr.source_tags,
  (select count(*) from public.pain_points pp where pp.search_id = s.id) as pain_point_count
from public.searches s
left join public.search_results sr on sr.search_id = s.id
where s.status = 'completed'
order by s.created_at desc;

-- Popular searches (last 7 days)
create or replace view public.popular_searches as
select
  topic,
  count(*) as search_count,
  max(created_at) as last_searched,
  avg(extract(epoch from (completed_at - created_at))) as avg_duration_seconds
from public.searches
where created_at > now() - interval '7 days'
  and status = 'completed'
group by topic
having count(*) > 1
order by search_count desc, last_searched desc
limit 20;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to find duplicate/similar searches
create or replace function public.find_similar_search(
  p_topic text,
  p_time_range text,
  p_min_upvotes integer,
  p_sort_by text,
  p_max_age_minutes integer default 60
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_search_id uuid;
begin
  select id into v_search_id
  from public.searches
  where lower(topic) = lower(p_topic)
    and time_range = p_time_range
    and min_upvotes = p_min_upvotes
    and sort_by = p_sort_by
    and status = 'completed'
    and created_at > now() - (p_max_age_minutes || ' minutes')::interval
  order by created_at desc
  limit 1;
  
  return v_search_id;
end;
$$;

-- Function to get search with all related data
create or replace function public.get_complete_search(p_search_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'search', row_to_json(s.*),
    'results', row_to_json(sr.*),
    'painPoints', (
      select jsonb_agg(row_to_json(pp.*))
      from public.pain_points pp
      where pp.search_id = p_search_id
    ),
    'quotes', (
      select jsonb_agg(row_to_json(q.*))
      from public.pain_point_quotes q
      join public.pain_points pp on pp.id = q.pain_point_id
      where pp.search_id = p_search_id
    ),
    'analysis', row_to_json(ai.*)
  )
  into v_result
  from public.searches s
  left join public.search_results sr on sr.search_id = s.id
  left join public.ai_analyses ai on ai.search_id = s.id
  where s.id = p_search_id;
  
  return v_result;
end;
$$;

-- Function to clean up old failed searches
create or replace function public.cleanup_old_searches(p_days_old integer default 7)
returns integer
language plpgsql
security definer
as $$
declare
  v_deleted_count integer;
begin
  with deleted as (
    delete from public.searches
    where status = 'failed'
      and created_at < now() - (p_days_old || ' days')::interval
    returning id
  )
  select count(*) into v_deleted_count from deleted;
  
  return v_deleted_count;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.searches enable row level security;
alter table public.search_results enable row level security;
alter table public.pain_points enable row level security;
alter table public.pain_point_quotes enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.job_logs enable row level security;
alter table public.api_usage enable row level security;
alter table public.search_events enable row level security;

-- ============================================================================
-- RLS POLICIES: searches
-- ============================================================================

drop policy if exists searches_select_public on public.searches;
create policy searches_select_public
  on public.searches
  for select
  using (true); -- Public read access

drop policy if exists searches_insert_service_role on public.searches;
create policy searches_insert_service_role
  on public.searches
  for insert
  with check (auth.role() = 'service_role');

drop policy if exists searches_update_service_role on public.searches;
create policy searches_update_service_role
  on public.searches
  for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists searches_delete_service_role on public.searches;
create policy searches_delete_service_role
  on public.searches
  for delete
  using (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: search_results
-- ============================================================================

drop policy if exists search_results_select_public on public.search_results;
create policy search_results_select_public
  on public.search_results
  for select
  using (true);

drop policy if exists search_results_write_service_role on public.search_results;
create policy search_results_write_service_role
  on public.search_results
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: pain_points
-- ============================================================================

drop policy if exists pain_points_select_public on public.pain_points;
create policy pain_points_select_public
  on public.pain_points
  for select
  using (true);

drop policy if exists pain_points_write_service_role on public.pain_points;
create policy pain_points_write_service_role
  on public.pain_points
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: pain_point_quotes
-- ============================================================================

drop policy if exists pain_point_quotes_select_public on public.pain_point_quotes;
create policy pain_point_quotes_select_public
  on public.pain_point_quotes
  for select
  using (true);

drop policy if exists pain_point_quotes_write_service_role on public.pain_point_quotes;
create policy pain_point_quotes_write_service_role
  on public.pain_point_quotes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: ai_analyses
-- ============================================================================

drop policy if exists ai_analyses_select_public on public.ai_analyses;
create policy ai_analyses_select_public
  on public.ai_analyses
  for select
  using (true);

drop policy if exists ai_analyses_write_service_role on public.ai_analyses;
create policy ai_analyses_write_service_role
  on public.ai_analyses
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: job_logs (service role only)
-- ============================================================================

drop policy if exists job_logs_service_role_only on public.job_logs;
create policy job_logs_service_role_only
  on public.job_logs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: api_usage (service role only)
-- ============================================================================

drop policy if exists api_usage_service_role_only on public.api_usage;
create policy api_usage_service_role_only
  on public.api_usage
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- RLS POLICIES: search_events
-- ============================================================================

drop policy if exists search_events_select_public on public.search_events;
create policy search_events_select_public
  on public.search_events
  for select
  using (true);

drop policy if exists search_events_write_service_role on public.search_events;
create policy search_events_write_service_role
  on public.search_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Trigger to set completed_at when status changes to 'completed'
create or replace function public.set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'completed' and OLD.status != 'completed' then
    NEW.completed_at = now();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trigger_set_completed_at on public.searches;
create trigger trigger_set_completed_at
  before update on public.searches
  for each row
  execute function public.set_completed_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

comment on table public.searches is 'User-initiated searches with parameters and status tracking';
comment on table public.search_results is 'Aggregated metadata from HN scraping';
comment on table public.pain_points is 'Identified pain themes from AI analysis';
comment on table public.pain_point_quotes is 'Supporting quotes for each pain point';
comment on table public.ai_analyses is 'AI-generated summaries and product ideas';
comment on table public.job_logs is 'Internal job execution logs (service role only)';
comment on table public.api_usage is 'API cost tracking for budgeting (service role only)';
comment on table public.search_events is 'Incremental per-search events for realtime progress (stories, comments, analysis)';

comment on column public.searches.subreddits is 'Array of HN tags (e.g., story, ask_hn, show_hn)';
comment on column public.searches.retry_count is 'Number of retry attempts for failed jobs';
comment on column public.searches.next_retry_at is 'Scheduled time for next retry (exponential backoff)';

comment on function public.find_similar_search is 'Find an existing completed search with same parameters';
comment on function public.get_complete_search is 'Fetch a search with all related data in one JSON object';
comment on function public.cleanup_old_searches is 'Delete failed searches older than N days';

