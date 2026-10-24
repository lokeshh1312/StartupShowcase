-- 0007_newsletter.sql
-- Add confirmed_at, unsubscribe_token, and token_expires_at columns to newsletter_subscribers
-- Self-contained and re-runnable

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Index token lookups for fast double opt-in confirmation & unsubscription
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_token
  ON public.newsletter_subscribers(token);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsub_token
  ON public.newsletter_subscribers(unsubscribe_token);
