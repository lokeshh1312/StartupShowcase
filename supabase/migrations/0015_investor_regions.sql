-- 0015_investor_regions.sql
-- Table: investor_regions
-- Self-contained and idempotent

CREATE TABLE IF NOT EXISTS public.investor_regions (
  country_code char(2) PRIMARY KEY,
  country_name text NOT NULL,
  investors integer NOT NULL CHECK (investors >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for ordering by investor count
CREATE INDEX IF NOT EXISTS idx_investor_regions_investors ON public.investor_regions(investors DESC);

-- Enable RLS with no public policies (server/postgres only, same pattern as startup_views, rate_limits, audit_log)
ALTER TABLE public.investor_regions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.investor_regions FROM PUBLIC, anon, authenticated;

-- Seed 20 baseline investor regions (Total sum = 144,500)
INSERT INTO public.investor_regions (country_code, country_name, investors, updated_at)
VALUES
  ('US', 'United States', 18500, now()),
  ('IN', 'India', 15200, now()),
  ('CN', 'China', 14300, now()),
  ('GB', 'United Kingdom', 11200, now()),
  ('DE', 'Germany', 9800, now()),
  ('JP', 'Japan', 8900, now()),
  ('CA', 'Canada', 8100, now()),
  ('FR', 'France', 7500, now()),
  ('AU', 'Australia', 6900, now()),
  ('SG', 'Singapore', 6200, now()),
  ('AE', 'United Arab Emirates', 5800, now()),
  ('KR', 'South Korea', 5400, now()),
  ('BR', 'Brazil', 4900, now()),
  ('NL', 'Netherlands', 4300, now()),
  ('CH', 'Switzerland', 3900, now()),
  ('SE', 'Sweden', 3500, now()),
  ('IT', 'Italy', 3100, now()),
  ('ES', 'Spain', 2700, now()),
  ('IL', 'Israel', 2400, now()),
  ('ZA', 'South Africa', 1900, now())
ON CONFLICT (country_code) DO UPDATE
SET
  country_name = EXCLUDED.country_name,
  investors = EXCLUDED.investors,
  updated_at = EXCLUDED.updated_at;

