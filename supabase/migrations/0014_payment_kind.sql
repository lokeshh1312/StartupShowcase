-- 0014: Add payment kind (listing, upgrade)
-- Existing paid rows become 'listing' via the default value.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'listing';

-- Drop constraint if exists then add check constraint for supported payment kinds
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_kind_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_kind_check
  CHECK (kind IN ('listing', 'upgrade'));

-- Composite index for fast startup payment resolution by kind and status
CREATE INDEX IF NOT EXISTS idx_payments_startup_kind_status
  ON public.payments(startup_id, kind, status);

