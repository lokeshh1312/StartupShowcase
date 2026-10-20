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

-- 2. Enable RLS on EVERY table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: PROFILES
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. RLS Policies: STARTUPS
-- Anyone can read approved startups; owners can read their own; admins can read all
DROP POLICY IF EXISTS "startups_select_policy" ON public.startups;
CREATE POLICY "startups_select_policy" ON public.startups
  FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id OR public.is_admin());

-- Authenticated founders can insert their own startup
DROP POLICY IF EXISTS "startups_insert_policy" ON public.startups;
CREATE POLICY "startups_insert_policy" ON public.startups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

-- Admins can update any startup (including status moderation)
DROP POLICY IF EXISTS "startups_admin_update_policy" ON public.startups;
CREATE POLICY "startups_admin_update_policy" ON public.startups
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Owners can edit their own unapproved startup
DROP POLICY IF EXISTS "startups_owner_update_policy" ON public.startups;
CREATE POLICY "startups_owner_update_policy" ON public.startups
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND status != 'approved')
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');

-- Owners or admins can delete startup
DROP POLICY IF EXISTS "startups_delete_policy" ON public.startups;
CREATE POLICY "startups_delete_policy" ON public.startups
  FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.is_admin());

-- 5. RLS Policies: STARTUP_VOTES
DROP POLICY IF EXISTS "startup_votes_select_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_select_policy" ON public.startup_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "startup_votes_insert_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_insert_policy" ON public.startup_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "startup_votes_delete_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_delete_policy" ON public.startup_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. RLS Policies: SAVED_STARTUPS
DROP POLICY IF EXISTS "saved_startups_select_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_select_policy" ON public.saved_startups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_startups_insert_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_insert_policy" ON public.saved_startups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_startups_delete_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_delete_policy" ON public.saved_startups
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. RLS Policies: STARTUP_COMMENTS
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

DROP POLICY IF EXISTS "startup_comments_insert_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_insert_policy" ON public.startup_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "startup_comments_delete_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_delete_policy" ON public.startup_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "startup_comments_update_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_update_policy" ON public.startup_comments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Server-Only Tables: No policies for anon / authenticated
-- (rate_limits, startup_views, newsletter_subscribers, audit_log remain strictly server-only)

-- 9. Explicit Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public read access
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.startups TO anon, authenticated;
GRANT SELECT ON public.startup_votes TO anon, authenticated;
GRANT SELECT ON public.startup_comments TO anon, authenticated;
GRANT SELECT ON public.monthly_leaderboard_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.monthly_leaderboard(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Authenticated writes matching RLS
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.startups TO authenticated;
GRANT INSERT, DELETE ON public.startup_votes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_startups TO authenticated;
GRANT INSERT, DELETE, UPDATE ON public.startup_comments TO authenticated;

-- Ensure NO grants exist on server-only tables for anon or authenticated
REVOKE ALL ON public.startup_views FROM anon, authenticated;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
REVOKE ALL ON public.newsletter_subscribers FROM anon, authenticated;
REVOKE ALL ON public.audit_log FROM anon, authenticated;
