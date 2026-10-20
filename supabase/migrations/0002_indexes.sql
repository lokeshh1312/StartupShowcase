-- 0002_indexes.sql
-- Indexes for Startup Showcase
-- Self-contained and re-runnable

-- 1. Startups status and launch month index
CREATE INDEX IF NOT EXISTS idx_startups_status_month
  ON public.startups (status, month);

-- 2. Startups slug unique index (enforces fast lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_startups_slug
  ON public.startups (slug);

-- 3. GIN Full-Text Search index on generated search_tsv
CREATE INDEX IF NOT EXISTS idx_startups_search_tsv
  ON public.startups USING gin (search_tsv);

-- 4. Votes by startup_id index (for aggregation & rank computation)
CREATE INDEX IF NOT EXISTS idx_startup_votes_startup_id
  ON public.startup_votes (startup_id);

-- 5. Startups country_code index for global filtering
CREATE INDEX IF NOT EXISTS idx_startups_country_code
  ON public.startups (country_code);

-- 6. Startups owner index for founder dashboard lookups
CREATE INDEX IF NOT EXISTS idx_startups_owner_id
  ON public.startups (owner_id);

-- 7. Startup comments by startup_id & date
CREATE INDEX IF NOT EXISTS idx_startup_comments_startup_id
  ON public.startup_comments (startup_id, created_at DESC);

-- 8. Saved startups by user_id
CREATE INDEX IF NOT EXISTS idx_saved_startups_user_id
  ON public.saved_startups (user_id);

-- 9. Deduplicated views index
CREATE INDEX IF NOT EXISTS idx_startup_views_day
  ON public.startup_views (startup_id, day);

-- 10. Rate limits index
CREATE INDEX IF NOT EXISTS idx_rate_limits_window
  ON public.rate_limits (key, window_start);

-- 11. Audit log target index
CREATE INDEX IF NOT EXISTS idx_audit_log_target
  ON public.audit_log (target_type, target_id);
