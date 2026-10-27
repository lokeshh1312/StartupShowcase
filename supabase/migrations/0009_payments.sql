-- 0009_payments.sql
-- Payments Table, Awaiting Payment Status, Payment Transition Enforcement, and RLS
-- Self-contained and re-runnable (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS)

-- 1. Update startups status check constraint and column default
ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_status_check;
ALTER TABLE public.startups ADD CONSTRAINT startups_status_check
  CHECK (status IN ('awaiting_payment', 'pending', 'approved', 'rejected'));

ALTER TABLE public.startups ALTER COLUMN status SET DEFAULT 'awaiting_payment';

-- 2. Create public.payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text UNIQUE,
  amount_cents integer NOT NULL,
  amount_refunded_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL,
  status text NOT NULL CHECK (status IN ('created', 'paid', 'failed', 'refunded', 'partially_refunded')),
  webhook_event_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  refunded_at timestamptz
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_payments_startup_id ON public.payments(startup_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(razorpay_payment_id);

-- 3. Grants: NO insert/update/delete for anon or authenticated (server/postgres only).
REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payments TO authenticated;

-- 4. Row Level Security for public.payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
CREATE POLICY "payments_select_policy" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 4B. Create public.payment_events table for durable event deduplication
CREATE TABLE IF NOT EXISTS public.payment_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  payment_id text,
  order_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events(created_at);

REVOKE ALL ON public.payment_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.payment_events TO authenticated;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_events_select_policy" ON public.payment_events;
CREATE POLICY "payment_events_select_policy" ON public.payment_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 5. Update Startups RLS Policies
-- A. Insert: direct API insert must have status = 'awaiting_payment' (never 'pending' or 'approved')
DROP POLICY IF EXISTS "startups_insert_policy" ON public.startups;
CREATE POLICY "startups_insert_policy" ON public.startups
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = owner_id
    AND public.is_verified()
    AND status = 'awaiting_payment'
    AND is_sample = false
    AND approved_at IS NULL
    AND reviewed_by IS NULL
    AND views_count = 0
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('founder', 'admin')
    )
  );

-- B. Update: owners can edit their own unapproved startup while in awaiting_payment or pending
DROP POLICY IF EXISTS "startups_owner_update_policy" ON public.startups;
CREATE POLICY "startups_owner_update_policy" ON public.startups
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status IN ('awaiting_payment', 'pending'))
  WITH CHECK (auth.uid() = owner_id AND status IN ('awaiting_payment', 'pending'));

-- 6. Trigger: Enforce payment rules on status transitions and block non-admin direct status changes
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
    -- MUST have a payment row with status = 'paid' or 'partially_refunded'. Applies to EVERY caller (including server role).
    IF OLD.status = 'awaiting_payment' AND NEW.status <> 'awaiting_payment' THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.startup_id = NEW.id AND p.status IN ('paid', 'partially_refunded')
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
    -- Paid startups cannot be deleted by the owner via direct API calls
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      IF OLD.status <> 'awaiting_payment' OR EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.startup_id = OLD.id AND p.status IN ('paid', 'partially_refunded')
      ) THEN
        RAISE EXCEPTION 'Paid startups cannot be deleted by the owner. Please contact support.'
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
