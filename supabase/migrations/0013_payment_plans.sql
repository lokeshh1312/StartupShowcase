-- 0013: Add listing plans to payments table (basic, investor_connect, investor_ready)
-- Existing paid rows become 'basic' via the default value.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basic';

-- Drop constraint if exists then add check constraint for supported plans
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('basic', 'investor_connect', 'investor_ready'));

