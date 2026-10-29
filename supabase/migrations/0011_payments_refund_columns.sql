-- 0011: columns/status the payments code expects
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS amount_refunded_cents integer NOT NULL DEFAULT 0;

DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('created','paid','failed','refunded','partially_refunded'));

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_refunded_range_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_refunded_range_check
  CHECK (amount_refunded_cents >= 0 AND amount_refunded_cents <= amount_cents);
