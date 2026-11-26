-- 0016_startup_sort_priority.sql
-- Add admin-only manual sort priority for pinning approved startups to the top of default lists.
-- Idempotent / re-runnable.

alter table public.startups add column if not exists sort_priority integer not null default 0;

-- Update monthly_leaderboard_view so default monthly leaderboard ranks pinned startups first
-- (higher sort_priority first, then counted votes DESC, earliest approval ASC, name ASC).
CREATE OR REPLACE VIEW public.monthly_leaderboard_view
WITH (security_invoker = true) AS
SELECT
  DENSE_RANK() OVER (
    PARTITION BY s.month
    ORDER BY
      s.sort_priority DESC,
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
  s.updated_at,
  s.sort_priority
FROM public.startups s
LEFT JOIN (
  public.startup_votes v
  JOIN public.profiles voter ON voter.id = v.user_id AND voter.created_at <= (now() - interval '24 hours')
) ON v.startup_id = s.id
WHERE s.status = 'approved'
GROUP BY s.id;

REVOKE SELECT ON public.monthly_leaderboard_view FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.monthly_leaderboard(date) FROM anon, authenticated;
