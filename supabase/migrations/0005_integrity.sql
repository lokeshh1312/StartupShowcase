-- 0005_integrity.sql
-- Integrity, Email Verification, Voting Rules, and Deduplication Extension
-- Self-contained and re-runnable (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS)

-- 1. Enable pg_trgm for fuzzy text and duplicate name similarity search
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;

-- 2. Security Definer Helper: checks if auth.uid() has verified their email
CREATE OR REPLACE FUNCTION public.is_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT coalesce(
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_verified() TO anon, authenticated;

-- 3. Update Monthly Leaderboard View:
-- Only votes from voter profiles at least 24 hours old count toward public rank
CREATE OR REPLACE VIEW public.monthly_leaderboard_view AS
SELECT
  DENSE_RANK() OVER (
    PARTITION BY s.month
    ORDER BY
      COUNT(v.user_id) DESC,
      COALESCE(s.approved_at, s.created_at) ASC,
      s.name ASC
  ) AS rank,
  s.id,
  s.slug,
  s.name,
  s.idea_title,
  s.tagline,
  s.description,
  s.full_story,
  s.category,
  s.country_code,
  s.region,
  s.city,
  s.remote_first,
  s.location,
  s.stage,
  s.month,
  s.month_label,
  s.website_url,
  s.logo_type,
  s.logo_color,
  s.thumbnail,
  s.cover_image,
  s.founder_json,
  s.problem,
  s.solution,
  s.key_features_json,
  s.tech_stack_json,
  s.traction,
  s.views_count,
  COUNT(v.user_id)::bigint AS votes_count,
  s.owner_id,
  s.approved_at,
  s.created_at,
  s.updated_at
FROM public.startups s
LEFT JOIN (
  public.startup_votes v
  JOIN public.profiles voter ON voter.id = v.user_id AND voter.created_at <= (now() - interval '24 hours')
) ON v.startup_id = s.id
WHERE s.status = 'approved'
GROUP BY s.id;

-- Ensure function uses the updated view
CREATE OR REPLACE FUNCTION public.monthly_leaderboard(target_month date)
RETURNS SETOF public.monthly_leaderboard_view
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.monthly_leaderboard_view
  WHERE month = target_month
  ORDER BY rank ASC;
$$;

-- 4. RLS Policy Updates: Enforce email verification and founder voting restriction

-- A. Startups: only verified founders can submit startups
DROP POLICY IF EXISTS "startups_insert_policy" ON public.startups;
CREATE POLICY "startups_insert_policy" ON public.startups
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = owner_id
    AND public.is_verified()
    AND status = 'pending'
    AND is_sample = false
    AND approved_at IS NULL
    AND reviewed_by IS NULL
    AND views_count = 0
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('founder', 'admin')
    )
  );

-- B. Votes: only verified users can vote, and founders CANNOT vote for their own startup
DROP POLICY IF EXISTS "startup_votes_insert_policy" ON public.startup_votes;
CREATE POLICY "startup_votes_insert_policy" ON public.startup_votes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified()
    AND EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_votes.startup_id
        AND s.status = 'approved'
        AND (s.owner_id IS NULL OR s.owner_id <> auth.uid())
    )
  );

-- C. Saved Startups: only verified users can save startups
DROP POLICY IF EXISTS "saved_startups_insert_policy" ON public.saved_startups;
CREATE POLICY "saved_startups_insert_policy" ON public.saved_startups
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified()
  );

-- D. Comments: only verified users can comment on approved startups
DROP POLICY IF EXISTS "startup_comments_insert_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_insert_policy" ON public.startup_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND public.is_verified()
    AND status = 'visible'
    AND EXISTS (
      SELECT 1 FROM public.startups s
      WHERE s.id = startup_comments.startup_id AND s.status = 'approved'
    )
  );

-- E. Comments update: admins can update comment status (e.g. to 'hidden')
DROP POLICY IF EXISTS "startup_comments_update_policy" ON public.startup_comments;
CREATE POLICY "startup_comments_update_policy" ON public.startup_comments
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Trigger to automatically write to audit_log when comment status changes
CREATE OR REPLACE FUNCTION public.log_comment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (
      actor_id,
      action,
      target_type,
      target_id,
      metadata
    ) VALUES (
      auth.uid(),
      CASE WHEN NEW.status = 'hidden' THEN 'hide_comment' ELSE 'comment.status_change:' || NEW.status END,
      'comment',
      NEW.id::text,
      jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_status_audit ON public.startup_comments;
CREATE TRIGGER trg_comment_status_audit
  AFTER UPDATE OF status ON public.startup_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_comment_status_change();

-- 6. Trigger to audit startup status changes
CREATE OR REPLACE FUNCTION public.log_startup_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.audit_log
      WHERE target_type = 'startup'
        AND target_id = NEW.id::text
        AND created_at >= (now() - interval '2 seconds')
        AND metadata->>'new_status' = NEW.status
    ) THEN
      INSERT INTO public.audit_log (
        actor_id,
        action,
        target_type,
        target_id,
        metadata
      ) VALUES (
        auth.uid(),
        'startup.status_change:' || NEW.status,
        'startup',
        NEW.id::text,
        jsonb_build_object('previous_status', OLD.status, 'new_status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_startup_status_audit ON public.startups;
CREATE TRIGGER trg_startup_status_audit
  AFTER UPDATE OF status ON public.startups
  FOR EACH ROW
  EXECUTE FUNCTION public.log_startup_status_change();
