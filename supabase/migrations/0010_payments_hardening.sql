-- 0010_payments_hardening.sql
-- Payments Hardening: Foreign Key Constraints, Delete Protection Triggers, and Payment Events Table
-- Self-contained and re-runnable

-- 1. Create public.payment_events table for durable event deduplication
CREATE TABLE IF NOT EXISTS public.payment_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  razorpay_payment_id text,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- RLS enabled on public.payment_events with no grants for anon or authenticated (server-only)
REVOKE ALL ON public.payment_events FROM PUBLIC, anon, authenticated;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- 2. Update foreign key on public.payments:
-- user_id changes from ON DELETE CASCADE to ON DELETE RESTRICT
-- startup_id ON DELETE RESTRICT stays
DO $$
DECLARE
  fk_name text;
BEGIN
  FOR fk_name IN (
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND contype = 'f'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.payments'::regclass AND attname = 'user_id')]
  ) LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS %I', fk_name);
  END LOOP;
END $$;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 3. Trigger on public.payments:
-- Blocks DELETE on public.payments for EVERY caller (including postgres and server role)
-- UNLESS status IN ('created', 'failed') AND older than 7 days (for abandoned unpaid draft cleanup)
CREATE OR REPLACE FUNCTION public.enforce_payments_delete_restriction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (OLD.status IN ('created', 'failed') AND OLD.created_at < (now() - interval '7 days')) THEN
    RAISE EXCEPTION 'Cannot delete payment record with status % (created at %)', OLD.status, OLD.created_at
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_payments_delete_restriction ON public.payments;
CREATE TRIGGER trg_enforce_payments_delete_restriction
  BEFORE DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payments_delete_restriction();

-- 4. Update startup payment transition trigger on public.startups:
-- Block deleting a startup (any caller, incl. admin and server) that has a payments row with status paid or refunded.
-- For unpaid drafts, allow deleting the startup and its 'created'/'failed' payment rows via the cleanup rule.
CREATE OR REPLACE FUNCTION public.enforce_startup_payment_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Direct API JWT inserts by non-admins must be awaiting_payment
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      IF NEW.status <> 'awaiting_payment' THEN
        RAISE EXCEPTION 'New startups must have status awaiting_payment'
          USING ERRCODE = '42501';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Any transition from 'awaiting_payment' to 'pending' (or approved/rejected)
    -- MUST have a payment row with status = 'paid'. Applies to EVERY caller (including server role).
    IF OLD.status = 'awaiting_payment' AND NEW.status <> 'awaiting_payment' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.startup_id = NEW.id AND p.status = 'paid'
      ) THEN
        RAISE EXCEPTION 'Cannot transition startup % from awaiting_payment to % without a paid payment record',
          NEW.id, NEW.status
          USING ERRCODE = '23514'; -- check_violation
      END IF;
    END IF;

    -- Non-admin users cannot change startup status directly via JWT
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE EXCEPTION 'Non-admin users cannot change startup status directly'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- Block deleting a startup (any caller, incl. admin and server) that has a payments row with status paid or refunded
    IF EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.startup_id = OLD.id AND p.status IN ('paid', 'refunded')
    ) THEN
      RAISE EXCEPTION 'Startups with paid or refunded payments cannot be deleted'
        USING ERRCODE = '42501';
    END IF;

    -- Non-admin owners cannot delete startups unless in awaiting_payment
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      IF OLD.status <> 'awaiting_payment' THEN
        RAISE EXCEPTION 'Only startups awaiting payment can be deleted by owner'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_startup_payment_transition ON public.startups;
CREATE TRIGGER trg_enforce_startup_payment_transition
  BEFORE INSERT OR UPDATE OF status OR DELETE ON public.startups
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_startup_payment_transition();
