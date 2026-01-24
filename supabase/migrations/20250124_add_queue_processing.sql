-- Migration: Add Queue Processing for Resilience
-- This migration adds pg_cron and pg_net based queue processing
-- to handle search requests sequentially and prevent edge function overload.

-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- pg_cron is available on Supabase free tier
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net is required for HTTP calls from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- QUEUE PROCESSING FUNCTION
-- ============================================================================

-- Function to process pending searches from the queue
-- Called by pg_cron every minute to pick up and process pending searches
CREATE OR REPLACE FUNCTION process_pending_searches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search RECORD;
  v_count INTEGER := 0;
  v_max_concurrent INTEGER := 3;  -- Process max 3 searches at a time
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- Get configuration from Supabase vault or environment
  -- These should be set via: SELECT set_config('app.supabase_url', 'https://xxx.supabase.co', false);
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_role_key := current_setting('app.service_role_key', true);
  
  -- Skip if configuration is missing
  IF v_supabase_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE WARNING '[process_pending_searches] Missing app.supabase_url or app.service_role_key configuration';
    RETURN;
  END IF;

  -- Find pending searches that are ready to be processed
  -- Uses FOR UPDATE SKIP LOCKED to prevent race conditions
  FOR v_search IN
    SELECT id
    FROM searches
    WHERE status = 'pending'
      AND retry_count < 3
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at ASC
    LIMIT v_max_concurrent
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as processing before triggering edge function
    UPDATE searches
    SET status = 'processing',
        last_retry_at = NOW()
    WHERE id = v_search.id;
    
    v_count := v_count + 1;
    
    -- Invoke edge function via pg_net HTTP POST
    -- This is fire-and-forget; the edge function handles its own completion
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/scrape_and_analyze',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_role_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('searchId', v_search.id)::text
    );
    
    RAISE NOTICE '[process_pending_searches] Triggered edge function for search %', v_search.id;
  END LOOP;
  
  IF v_count > 0 THEN
    RAISE NOTICE '[process_pending_searches] Processed % pending searches', v_count;
  END IF;
END;
$$;

-- ============================================================================
-- CLEANUP FUNCTION FOR STALE PROCESSING SEARCHES
-- ============================================================================

-- Function to reset searches that have been stuck in 'processing' for too long
-- This handles edge function timeouts or crashes
CREATE OR REPLACE FUNCTION cleanup_stale_processing_searches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stale_timeout INTERVAL := '5 minutes';
  v_count INTEGER;
BEGIN
  -- Find searches stuck in 'processing' for more than 5 minutes
  -- and reset them to 'pending' for retry
  WITH stale_searches AS (
    UPDATE searches
    SET 
      status = 'pending',
      retry_count = retry_count + 1,
      next_retry_at = NOW() + (POWER(2, retry_count) * INTERVAL '1 minute'),
      error_message = 'Search timed out and will be retried'
    WHERE status = 'processing'
      AND last_retry_at < NOW() - v_stale_timeout
      AND retry_count < 3
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM stale_searches;
  
  IF v_count > 0 THEN
    RAISE NOTICE '[cleanup_stale_processing_searches] Reset % stale searches for retry', v_count;
  END IF;
  
  -- Mark searches that have exceeded max retries as failed
  UPDATE searches
  SET 
    status = 'failed',
    error_message = 'Search failed after maximum retry attempts'
  WHERE status = 'processing'
    AND last_retry_at < NOW() - v_stale_timeout
    AND retry_count >= 3;
END;
$$;

-- ============================================================================
-- SCHEDULE CRON JOBS
-- ============================================================================

-- Note: Supabase free tier pg_cron minimum interval is 1 minute
-- We schedule both the queue processor and cleanup to run every minute

-- Remove existing jobs if they exist (for idempotent migrations)
SELECT cron.unschedule('process-pending-searches') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-pending-searches');

SELECT cron.unschedule('cleanup-stale-searches')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-searches');

-- Schedule queue processing every minute
SELECT cron.schedule(
  'process-pending-searches',
  '* * * * *',  -- Every minute
  'SELECT process_pending_searches()'
);

-- Schedule cleanup of stale searches every 2 minutes
SELECT cron.schedule(
  'cleanup-stale-searches',
  '*/2 * * * *',  -- Every 2 minutes
  'SELECT cleanup_stale_processing_searches()'
);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to the service role
GRANT EXECUTE ON FUNCTION process_pending_searches() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_stale_processing_searches() TO service_role;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION process_pending_searches() IS 
'Processes pending searches from the queue. Called by pg_cron every minute. 
Picks up to 3 pending searches and triggers edge functions for them.';

COMMENT ON FUNCTION cleanup_stale_processing_searches() IS 
'Resets searches stuck in processing state for retry. Called by pg_cron every 2 minutes.
Handles edge function timeouts or crashes.';
