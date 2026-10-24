-- 0003_leaderboard.sql
-- Monthly Leaderboard View and SQL Function
-- Computes ranks in SQL with tie-breaks: earlier approval first, then name.

-- 1. Monthly Leaderboard View
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
LEFT JOIN public.startup_votes v ON v.startup_id = s.id
WHERE s.status = 'approved'
GROUP BY s.id;

-- 2. Monthly Leaderboard SQL Function
CREATE OR REPLACE FUNCTION public.monthly_leaderboard(target_month date)
RETURNS SETOF public.monthly_leaderboard_view
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.monthly_leaderboard_view
  WHERE monthly_leaderboard_view.month = date_trunc('month', target_month)::date
  ORDER BY rank ASC;
$$;
