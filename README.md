# Find Startup Ideas - Hacker News Pain Miner

> Discover validated product ideas by mining real pain points from Hacker News discussions.

A production-ready tool that analyzes Hacker News conversations to extract customer complaints, pain points, and market opportunities using AI-powered clustering.

## Features

- **Real-time HN Analysis** - Search any topic and get instant insights from thousands of discussions
- **AI-Powered Clustering** - Gemini 2.0 Flash analyzes and groups pain points by theme
- **Smart Caching** - Redis-backed caching for lightning-fast repeated searches
- **Rate Limiting** - IP-based and topic-based rate limiting to prevent abuse
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
npm install
# or
pnpm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy:

   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - publishable key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)

3. Run the database schema:

   - Go to **SQL Editor** in Supabase dashboard
   - Copy contents from `supabase/migrations/schema.sql`
   - Execute the SQL

4. Set up RLS policies (already included in schema.sql)

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
npm run dev
# or
pnpm dev
# or
yarn dev
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
