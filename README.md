# Find Startup Ideas - Hacker News Pain Miner

> Discover validated product ideas by mining real pain points from Hacker News discussions.

A production-ready tool that analyzes Hacker News conversations to extract customer complaints, pain points, and market opportunities using AI-powered clustering.

## Features

- **Real-time HN Analysis** - Search any topic and get instant insights from thousands of discussions
- **AI-Powered Clustering** - Gemini 2.0 Flash analyzes and groups pain points by theme
- **Smart Caching** - Redis-backed caching for lightning-fast repeated searches
- **Rate Limiting** - Global (60/min), per-IP (3/min, 10/day), and topic-based rate limiting
- **Queue Backup** - pg_cron picks up failed/stuck searches every minute
- **Auto-Retry** - Failed searches retry up to 3 times with exponential backoff
- **Advanced Filters** - Filter by HN tags, time range, upvotes, and sort order

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes, Supabase Edge Functions (Deno)
- **Database:** Supabase (PostgreSQL)
- **Caching:** Upstash Redis
- **Data Validation:** Zod
- **AI:** Google Gemini 2.0 Flash
- **Data Source:** Algolia Hacker News API
- **Deployment:** Vercel (frontend), Supabase (backend workers)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- **pnpm** installed (`npm install -g pnpm` or enable via [Corepack](https://nodejs.org/api/corepack.html))
- A Supabase account (free tier works)
- An Upstash Redis account (free tier works)
- A Google AI Studio API key (Gemini)
- Git installed

## Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/aay6ush/reminer.git
cd reminer
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:

   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

3. Run the database schema:

   - Go to **SQL Editor** in Supabase dashboard
   - Copy contents from `supabase/schema.sql`
   - Execute the SQL

4. Run the queue processing setup (pg_cron + pg_net for resilience):

   - Go to **SQL Editor** in Supabase dashboard
   - Copy contents from `supabase/migrations/20250124_add_queue_processing.sql`
   - Execute the SQL

5. Set up the config table for pg_cron (required on free tier - ALTER DATABASE has permission restrictions):

   - Go to **SQL Editor** in Supabase dashboard
   - Run the following SQL, replacing `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` with your actual values:

   ```sql
   -- Create config table for pg_cron (free tier compatible)
   CREATE TABLE IF NOT EXISTS app_config (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

   CREATE POLICY app_config_service_role_read ON app_config
     FOR SELECT USING (auth.role() = 'service_role');

   -- Insert your configuration (REPLACE THE PLACEHOLDERS!)
   INSERT INTO app_config (key, value) VALUES
     ('supabase_url', 'https://YOUR_PROJECT_REF.supabase.co'),
     ('service_role_key', 'YOUR_SERVICE_ROLE_KEY')
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
   ```

6. Update the queue function to read from app_config (required - the migration uses current_setting which fails on free tier):

   - Go to **SQL Editor** in Supabase dashboard
   - Run the following SQL to fix the `process_pending_searches` function:

   ```sql
   CREATE OR REPLACE FUNCTION process_pending_searches()
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   DECLARE
     v_search RECORD;
     v_count INTEGER := 0;
     v_max_concurrent INTEGER := 3;
     v_supabase_url TEXT;
     v_service_role_key TEXT;
   BEGIN
     SELECT value INTO v_supabase_url FROM app_config WHERE key = 'supabase_url';
     SELECT value INTO v_service_role_key FROM app_config WHERE key = 'service_role_key';

     IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
       RAISE WARNING '[process_pending_searches] Missing config in app_config table';
       RETURN;
     END IF;

     FOR v_search IN
       SELECT id FROM searches
       WHERE status = 'pending' AND retry_count < 3
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
       ORDER BY created_at ASC LIMIT v_max_concurrent
       FOR UPDATE SKIP LOCKED
     LOOP
       UPDATE searches SET status = 'processing', last_retry_at = NOW() WHERE id = v_search.id;
       v_count := v_count + 1;

       PERFORM net.http_post(
         v_supabase_url || '/functions/v1/scrape_and_analyze',
         jsonb_build_object('searchId', v_search.id),
         '{}',
         jsonb_build_object(
           'Authorization', 'Bearer ' || v_service_role_key,
           'Content-Type', 'application/json'
         )
       );
     END LOOP;
   END;
   $$;
   ```

7. RLS policies are already included in schema.sql

8. Enable Realtime for live search updates:
   - Go to **Database → Tables** in the Supabase dashboard
   - Enable "Realtime" for these tables:
     - `ai_analyses`
     - `pain_point_quotes`
     - `pain_points`
     - `search_events`
     - `search_results`
     - `searches`

**Verify Supabase setup:**

```sql
-- Run in SQL Editor to verify (both counts should be 2)
SELECT 'Cron Jobs' as check_type, COUNT(*)::text as count FROM cron.job WHERE active = true AND jobname LIKE '%search%'
UNION ALL
SELECT 'Config Table', COUNT(*)::text FROM app_config;
```

### 4. Set Up Upstash Redis

1. Create a new database at [upstash.com](https://upstash.com)
2. Copy your REST URL and token:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN

### 5. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (GEMINI_API_KEY)

### 6. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Optional: Configure model (default: gemini-2.5-flash-lite)
# GEMINI_MODEL=gemini-1.5-flash
```

### 7. Deploy Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy scrape_and_analyze

# Set edge function secrets
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set UPSTASH_REDIS_REST_URL=your_redis_url
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 8. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing

This is a test project, but if you want to fork and improve:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project however you'd like.
