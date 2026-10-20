-- 0004_rls_and_permissions.sql
-- Row Level Security (RLS) policies and Role Privileges (Grants)
-- Self-contained and re-runnable

-- 1. Helper function to check if the caller is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. BEFORE UPDATE trigger on profiles: reject changes to role, id, or created_at
-- unless the session is service_role or postgres.
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns_trigger ON public.profiles;
CREATE TRIGGER protect_profile_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_columns();

-- 3. Enable RLS on EVERY table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: PROFILES
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- No INSERT policy for authenticated – the trigger creates profiles.
-- (profiles_insert_own removed)

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
-- intentionally not re-created

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. RLS Policies: STARTUPS
-- Anyone can read approved startups; owners can read their own; admins can read all
DROP POLICY IF EXISTS "startups_select_policy" ON public.startups;
CREATE POLICY "startups_select_policy" ON public.startups
  FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id OR public.is_admin());

-- Authenticated founders can insert their own startup with strict defaults
DROP POLICY IF EXISTS "startups_insert_policy" ON public.startups;
CREATE POLICY "startups_insert_policy" ON public.startups
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = owner_id
    AND status = 'pending'
    AND is_sample = false
    AND approved_at IS NULL
    AND reviewed_by IS NULL
    AND views_count = 0
  );

-- Admins can update any startup (including status moderation)
DROP POLICY IF EXISTS "startups_admin_update_policy" ON public.startups;
CREATE POLICY "startups_admin_update_policy" ON public.startups
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Owners can edit their own unapproved startup; must keep status = 'pending'
DROP POLICY IF EXISTS "startups_owner_update_policy" ON public.startups;
CREATE POLICY "startups_owner_update_policy" ON public.startups
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status = 'pending')
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');

-- Owners or admins can delete startup
DROP POLICY IF EXISTS "startups_delete_policy" ON public.startups;
CREATE POLICY "startups_delete_policy" ON public.startups
  FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.is_admin());

-- 6. RLS Policies: STARTUP_VOTES
-- Votes are NOT publicly readable. Authenticated users can SELECT only their own rows.
DROP POLICY IF EXISTS "startup_votes_select_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_select_policy" ON public.startup_votes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Votes INSERT: user must be the voter AND the startup must be approved
DROP POLICY IF EXISTS "startup_votes_insert_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_insert_policy" ON public.startup_votes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_votes.startup_id AND s.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "startup_votes_delete_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_delete_policy" ON public.startup_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. RLS Policies: SAVED_STARTUPS
DROP POLICY IF EXISTS "saved_startups_select_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_select_policy" ON public.saved_startups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_startups_insert_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_insert_policy" ON public.saved_startups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_startups_delete_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_delete_policy" ON public.saved_startups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. RLS Policies: STARTUP_COMMENTS
-- Comments readable only when visible and the startup is approved (or author/admin)
DROP POLICY IF EXISTS "startup_comments_select_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_select_policy" ON public.startup_comments
  FOR SELECT USING (
    (status = 'visible' AND EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_comments.startup_id AND s.status = 'approved'
    ))
    OR auth.uid() = user_id
    OR public.is_admin()
  );

-- Comments INSERT: startup must be approved and comment status must be 'visible'
DROP POLICY IF EXISTS "startup_comments_insert_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_insert_policy" ON public.startup_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND status = 'visible'
    AND EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_comments.startup_id AND s.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "startup_comments_delete_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_delete_policy" ON public.startup_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "startup_comments_update_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_update_policy" ON public.startup_comments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. Server-Only Tables: No policies for anon / authenticated
-- (rate_limits, startup_views, newsletter_subscribers, audit_log remain strictly server-only)

-- 10. Explicit Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public read access
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.startups TO anon, authenticated;
GRANT SELECT ON public.startup_comments TO anon, authenticated;
GRANT SELECT ON public.monthly_leaderboard_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monthly_leaderboard(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Votes: authenticated can SELECT own (via RLS), INSERT, DELETE – NO anon SELECT
GRANT SELECT, INSERT, DELETE ON public.startup_votes TO authenticated;

-- Profiles: authenticated can UPDATE display_name only (no INSERT – trigger creates profiles)
REVOKE INSERT ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;

-- Startups: column-level grants for authenticated
-- INSERT: content columns only (never status, is_sample, approved_at, reviewed_by, views_count)
-- The RLS INSERT policy enforces status='pending', is_sample=false, etc.
GRANT INSERT (
  slug, owner_id, status, name, idea_title, tagline, description, full_story,
  category, country_code, region, city, remote_first, location, stage,
  month, month_label, website_url, logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution, key_features_json, tech_stack_json, traction,
  is_sample, approved_at, reviewed_by, views_count
) ON public.startups TO authenticated;

-- UPDATE: content columns only; owner cannot change slug, owner_id, status (except via policy),
-- is_sample, approved_at, reviewed_by, views_count after creation
GRANT UPDATE (
  name, idea_title, tagline, description, full_story,
  category, country_code, region, city, remote_first, location, stage,
  month, month_label, website_url, logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution, key_features_json, tech_stack_json, traction,
  updated_at
) ON public.startups TO authenticated;

GRANT DELETE ON public.startups TO authenticated;

-- Saved startups
GRANT SELECT, INSERT, DELETE ON public.saved_startups TO authenticated;

-- Comments
GRANT INSERT, DELETE, UPDATE ON public.startup_comments TO authenticated;

-- Ensure NO grants exist on server-only tables for anon or authenticated
REVOKE ALL ON public.startup_views FROM anon, authenticated;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
REVOKE ALL ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE ALL ON public.audit_log FROM anon, authenticated;

-- Ensure NO SELECT on startup_votes for anon (public vote counts come from leaderboard view)
REVOKE ALL ON public.startup_votes FROM anon;
