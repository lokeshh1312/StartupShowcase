-- 0012_leaderboard_view_security.sql
-- Leaderboard View & Function Security Hardening
-- Enable security_invoker on the leaderboard view and revoke direct access
-- from anon and authenticated roles. The server queries the leaderboard
-- using direct Postgres connection (role postgres / superuser).
-- Re-runnable.

ALTER VIEW public.monthly_leaderboard_view SET (security_invoker = true);

REVOKE SELECT ON public.monthly_leaderboard_view FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.monthly_leaderboard(date) FROM anon, authenticated;
