-- 0008_roles.sql
-- Add role_chosen_at to public.profiles to track one-time onboarding selection
-- Self-contained and re-runnable

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role_chosen_at timestamptz;

-- Ensure protect_profile_columns also guards role_chosen_at against direct client updates
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow service_role and postgres full access
  IF current_setting('role', true) IN ('service_role', 'postgres')
     OR session_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Block changes to protected columns
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot change profile id';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Cannot change profile role';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot change profile created_at';
  END IF;
  IF NEW.role_chosen_at IS DISTINCT FROM OLD.role_chosen_at THEN
    RAISE EXCEPTION 'Cannot change profile role_chosen_at directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profile_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();
