-- supabase/tests/rls_checks.sql
-- ==============================================================================
-- Startup Showcase — Row Level Security (RLS) & Permissions Test Suite
-- ==============================================================================
--
-- HOW TO RUN:
--   1. Open the Supabase Dashboard -> SQL Editor (or connect via psql as postgres).
--   2. Ensure all migrations (0001 through 0004) have been applied.
--   3. Paste and run this script as the `postgres` superuser/admin role.
--   4. View the final tabular output showing individual test status and summary.
--
-- RE-RUN SAFETY:
--   This script is fully idempotent and safe to re-run multiple times:
--   - Performs pre-test cleanup to remove any stale test entities.
--   - Creates isolated test users in auth.users with @example.invalid domains.
--   - Unconditionally cleans up all created test entities at the end.
--   - The results table is reset on each execution and writable ONLY from postgres.
-- ==============================================================================

-- 0. Prepare results table: writable only from postgres
CREATE TEMP TABLE IF NOT EXISTS _rls_results (
  id serial PRIMARY KEY,
  check_name text NOT NULL,
  status text NOT NULL, -- 'PASS' or 'FAIL'
  details text NOT NULL
);
TRUNCATE _rls_results;
REVOKE ALL ON _rls_results FROM PUBLIC, anon, authenticated;
GRANT ALL ON _rls_results TO postgres;

-- 1. Main test suite execution block
DO $$
DECLARE
  _uid_a uuid := '11111111-1111-4111-a111-111111111111';
  _uid_b uuid := '22222222-2222-4222-a222-222222222222';
  _uid_c uuid := '33333333-3333-4333-a333-333333333333';
  _uid_d uuid := '44444444-4444-4444-a444-444444444444';
  _uid_owner uuid := '88888888-8888-4888-a888-888888888888';
  _uid_unverified uuid := '55555555-5555-4555-a555-555555555555';
  _uid_fresh uuid := '66666666-6666-4666-a666-666666666666';
  _uid_veteran uuid := '77777777-7777-4777-a777-777777777777';
  _startup_approved_id uuid := 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  _startup_pending_id  uuid := 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  _comment_test_id     uuid := 'cccccccc-cccc-4ccc-cccc-cccccccccccc';

  _check_name text;
  _passed boolean;
  _details text;
  _count integer;
  _lb_count integer;
  _rc integer;
  _c_role text;
  _vc bigint;
  _vc_fresh bigint;
  _vc_veteran bigint;
  _voter_uid uuid;
  _voter_blocked boolean;
  _got_count boolean;
  _audit_count integer;
BEGIN
  -- Always ensure we start as postgres
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  ----------------------------------------------------------------------
  -- SETUP (as postgres)
  ----------------------------------------------------------------------
  -- Pre-cleanup in case of prior interrupted execution
  DELETE FROM public.startup_comments WHERE id = _comment_test_id;
  DELETE FROM public.audit_log WHERE target_id IN (_comment_test_id::text, _startup_pending_id::text);
  DELETE FROM public.saved_startups WHERE startup_id IN (_startup_approved_id, _startup_pending_id);
  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved', 'rls-unverified-pending', 'rls-community-pending');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d, _uid_owner, _uid_unverified, _uid_fresh, _uid_veteran);

  -- Insert real users into auth.users so handle_new_user trigger creates real profiles
  -- User A: founder (verified)
  -- User B: community (verified)
  -- User C: requested role 'admin' -> sanitized to 'community' by trigger
  -- User D: community -> promoted to 'admin' by postgres below
  -- User Owner: founder (verified), owner of approved startup
  -- User Unverified: founder (email_confirmed_at IS NULL)
  -- User Fresh: community (verified, created_at = now)
  -- User Veteran: community (verified, created_at = now - 48h)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
  ) VALUES
    (_uid_a, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-a@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Founder A", "role": "founder"}'::jsonb, now(), now()),
    (_uid_b, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-b@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Community B", "role": "community"}'::jsonb, now(), now()),
    (_uid_c, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-c@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Attacker C", "role": "admin"}'::jsonb, now(), now()),
    (_uid_d, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-d@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Admin D", "role": "community"}'::jsonb, now(), now()),
    (_uid_owner, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-owner@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Founder Owner", "role": "founder"}'::jsonb, now(), now()),
    (_uid_unverified, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-unverified@example.invalid', 'encrypted-secret-placeholder', NULL, '{"name": "RLS Unverified", "role": "founder"}'::jsonb, now(), now()),
    (_uid_fresh, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-fresh@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Fresh Voter", "role": "community"}'::jsonb, now(), now()),
    (_uid_veteran, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-veteran@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Veteran Voter", "role": "community"}'::jsonb, now() - interval '48 hours', now() - interval '48 hours');

  -- Promote user D to admin as postgres (allowed by protect_profile_columns trigger)
  UPDATE public.profiles SET role = 'admin' WHERE id = _uid_d;

  -- Set veteran profile created_at to 48 hours ago
  UPDATE public.profiles SET created_at = (now() - interval '48 hours') WHERE id = _uid_veteran;

  -- Create one approved (owned by _uid_owner) and one pending startup (owned by _uid_a) as postgres
  INSERT INTO public.startups (
    id, slug, owner_id, status, is_sample, name, idea_title, tagline, description,
    category, country_code, stage, month, month_label, views_count, approved_at
  ) VALUES (
    _startup_approved_id, 'rls-test-approved', _uid_owner, 'approved', false,
    'RLS Approved Startup', 'Approved Idea', 'Best Tagline', 'A comprehensive description for approved startup',
    'AgriTech', 'US', 'MVP', '2026-10-01'::date, 'October 2026', 0, now()
  );

  INSERT INTO public.startups (
    id, slug, owner_id, status, is_sample, name, idea_title, tagline, description,
    category, country_code, stage, month, month_label, views_count, approved_at
  ) VALUES (
    _startup_pending_id, 'rls-test-pending', _uid_a, 'pending', false,
    'RLS Pending Startup', 'Pending Idea', 'Pending Tagline', 'A comprehensive description for pending startup',
    'AgriTech', 'US', 'MVP', '2026-10-01'::date, 'October 2026', 0, NULL
  );

  -- Insert a vote for user B on approved startup (used for isolation testing)
  INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_b, _startup_approved_id);

  ----------------------------------------------------------------------
  -- NEGATIVE CHECKS
  ----------------------------------------------------------------------

  -- 01: user cannot UPDATE own role
  _check_name := '01 (NEG): user cannot UPDATE own role';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = _uid_a;
    _passed := false;
    _details := 'FAIL: Update succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot change profile role%' THEN
        _passed := true;
        _details := 'Caught expected trigger exception: ' || SQLERRM;
      ELSE
        _passed := false;
        _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
      END IF;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 02: user cannot UPDATE own display_name AND role in one statement
  _check_name := '02 (NEG): user cannot UPDATE own display_name AND role in one statement';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    UPDATE public.profiles SET display_name = 'Hacked Name', role = 'admin' WHERE id = _uid_a;
    _passed := false;
    _details := 'FAIL: Update succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot change profile role%' THEN
        _passed := true;
        _details := 'Caught expected trigger exception: ' || SQLERRM;
      ELSE
        _passed := false;
        _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
      END IF;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 03: user cannot INSERT a startup with status 'approved'
  _check_name := '03 (NEG): user cannot INSERT startup with status approved';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startups (
      slug, owner_id, status, is_sample, name, idea_title, tagline, description,
      category, country_code, stage, month, views_count
    ) VALUES (
      'rls-hack-approved', _uid_a, 'approved', false, 'Hack Approved', 'Idea', 'Tagline', 'Description',
      'AgriTech', 'US', 'MVP', '2026-10-01'::date, 0
    );
    _passed := false;
    _details := 'FAIL: Insert succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (RLS check violation)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 04: user cannot UPDATE own startup's status (column privilege)
  _check_name := '04 (NEG): user cannot UPDATE own startup status (column privilege)';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    UPDATE public.startups SET status = 'approved' WHERE id = _startup_pending_id;
    _passed := false;
    _details := 'FAIL: Update succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient column privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 05: user A cannot read user B's votes
  _check_name := '05 (NEG): user A cannot read user B votes';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startup_votes WHERE user_id = _uid_b;
    IF _count = 0 THEN
      _passed := true;
      _details := 'RLS filtered user B votes (count = 0)';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected 0 visible votes, got %s', _count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 06: anon cannot SELECT startup_votes
  _check_name := '06 (NEG): anon cannot SELECT startup_votes';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startup_votes;
    _passed := false;
    _details := 'FAIL: Select succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 07: anon cannot read pending startups
  _check_name := '07 (NEG): anon cannot read pending startups';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startups WHERE id = _startup_pending_id;
    IF _count = 0 THEN
      _passed := true;
      _details := 'RLS filtered pending startup (count = 0)';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected 0 visible pending startups, got %s', _count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 08: anon cannot read rate_limits
  _check_name := '08 (NEG): anon cannot read rate_limits';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.rate_limits;
    _passed := false;
    _details := 'FAIL: Select succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 09: anon cannot read audit_log
  _check_name := '09 (NEG): anon cannot read audit_log';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.audit_log;
    _passed := false;
    _details := 'FAIL: Select succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 10: anon cannot read newsletter_subscribers
  _check_name := '10 (NEG): anon cannot read newsletter_subscribers';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.newsletter_subscribers;
    _passed := false;
    _details := 'FAIL: Select succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 11: anon cannot read startup_views
  _check_name := '11 (NEG): anon cannot read startup_views';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startup_views;
    _passed := false;
    _details := 'FAIL: Select succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (insufficient privilege)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 12: authenticated user cannot vote on a PENDING startup
  _check_name := '12 (NEG): authenticated user cannot vote on pending startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_a, _startup_pending_id);
    _passed := false;
    _details := 'FAIL: Vote on pending startup succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (RLS check violation)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 13: cannot comment on a pending startup
  _check_name := '13 (NEG): cannot comment on a pending startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_comments (user_id, startup_id, content)
    VALUES (_uid_a, _startup_pending_id, 'Comment on pending startup');
    _passed := false;
    _details := 'FAIL: Comment on pending startup succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (RLS check violation)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 14: owner cannot UPDATE an approved startup
  _check_name := '14 (NEG): owner cannot UPDATE an approved startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_owner::text, 'role', 'authenticated')::text, true);
  BEGIN
    UPDATE public.startups SET description = 'Attempted update on approved startup' WHERE id = _startup_approved_id;
    GET DIAGNOSTICS _rc = ROW_COUNT;
    IF _rc = 0 THEN
      _passed := true;
      _details := '0 rows updated (RLS filtered)';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected 0 rows updated, got %s', _rc);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 15: sign-up with metadata role 'admin' (user C) yields 'community' via REAL trigger
  _check_name := '15 (NEG): signup with metadata role admin yields community via REAL trigger';
  _passed := false;
  _details := '';
  BEGIN
    SELECT role INTO _c_role FROM public.profiles WHERE id = _uid_c;
    IF _c_role = 'community' THEN
      _passed := true;
      _details := 'Profile role sanitized to community by handle_new_user()';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected role community, got %s', _c_role);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  ----------------------------------------------------------------------
  -- POSITIVE CONTROLS
  ----------------------------------------------------------------------

  -- 16: user can UPDATE own display_name
  _check_name := '16 (POS): user can UPDATE own display_name';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    UPDATE public.profiles SET display_name = 'User A Renamed' WHERE id = _uid_a;
    GET DIAGNOSTICS _rc = ROW_COUNT;
    IF _rc = 1 THEN
      _passed := true;
      _details := '1 row updated successfully';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected 1 row updated, got %s', _rc);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 17: user can INSERT a pending startup with is_sample=false
  _check_name := '17 (POS): user can INSERT pending startup with is_sample=false';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startups (
      slug, owner_id, status, is_sample, name, idea_title, tagline, description,
      category, country_code, stage, month, views_count
    ) VALUES (
      'rls-positive-pending', _uid_a, 'pending', false, 'Positive Control Startup',
      'Idea Title', 'Tagline', 'A valid pending startup description for positive control',
      'AgriTech', 'US', 'MVP', '2026-10-01'::date, 0
    );
    _passed := true;
    _details := 'Startup inserted successfully with status pending';
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 18: user can vote on the approved startup
  _check_name := '18 (POS): user can vote on approved startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_a, _startup_approved_id);
    _passed := true;
    _details := 'Vote on approved startup inserted successfully';
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 19: user can read their own vote
  _check_name := '19 (POS): user can read own vote';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startup_votes WHERE user_id = _uid_a AND startup_id = _startup_approved_id;
    IF _count = 1 THEN
      _passed := true;
      _details := 'Own vote visible (count = 1)';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected 1 vote, got %s', _count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 20: anon CAN read the approved startup and monthly_leaderboard()
  _check_name := '20 (POS): anon can read approved startup and monthly_leaderboard()';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    SELECT count(*) INTO _count FROM public.startups WHERE id = _startup_approved_id;
    SELECT count(*) INTO _lb_count FROM public.monthly_leaderboard('2026-10-01'::date) WHERE id = _startup_approved_id;
    IF _count = 1 AND _lb_count = 1 THEN
      _passed := true;
      _details := 'Anon successfully read approved startup and monthly_leaderboard() entry';
    ELSE
      _passed := false;
      _details := format('FAIL: Approved startup count = %s (expected 1), Leaderboard count = %s (expected 1)', _count, _lb_count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 21: anon CANNOT see the vote user_ids but leaderboard shows a votes_count
  _check_name := '21 (POS): anon cannot see vote user_ids but leaderboard shows votes_count';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
  BEGIN
    -- Part A: anon cannot read user_id from startup_votes
    BEGIN
      SELECT user_id INTO _voter_uid FROM public.startup_votes WHERE startup_id = _startup_approved_id LIMIT 1;
      _voter_blocked := false;
    EXCEPTION
      WHEN SQLSTATE '42501' THEN
        _voter_blocked := true;
      WHEN OTHERS THEN
        _voter_blocked := false;
    END;

    -- Backdate the voter's profile as postgres so the vote counts in monthly_leaderboard_view (profiles must be >= 24h old)
    PERFORM set_config('role', 'postgres', true);
    PERFORM set_config('request.jwt.claims', '', true);
    UPDATE public.profiles SET created_at = now() - interval '2 days' WHERE id = _uid_b;
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claims', '{}', true);

    -- Part B: anon can read aggregated votes_count from leaderboard view
    BEGIN
      SELECT votes_count INTO _vc FROM public.monthly_leaderboard_view WHERE id = _startup_approved_id;
      _got_count := (_vc >= 1);
    EXCEPTION
      WHEN OTHERS THEN
        _got_count := false;
    END;

    IF _voter_blocked AND _got_count THEN
      _passed := true;
      _details := format('Blocked from startup_votes (42501); leaderboard shows votes_count = %s', _vc);
    ELSE
      _passed := false;
      _details := format('FAIL: Blocked from startup_votes: %s, Leaderboard votes_count >= 1: %s (votes_count = %s)', _voter_blocked, _got_count, _vc);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 22: unverified user cannot vote on approved startup
  _check_name := '22 (NEG): unverified user cannot vote on approved startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_unverified::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_unverified, _startup_approved_id);
    _passed := false;
    _details := 'FAIL: Unverified vote succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (is_verified RLS rejection)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 23: unverified user cannot comment on approved startup
  _check_name := '23 (NEG): unverified user cannot comment on approved startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_unverified::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_comments (user_id, startup_id, content) VALUES (_uid_unverified, _startup_approved_id, 'Unverified comment');
    _passed := false;
    _details := 'FAIL: Unverified comment succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (is_verified RLS rejection)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 24: unverified user cannot submit a startup
  _check_name := '24 (NEG): unverified user cannot submit a startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_unverified::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startups (
      slug, owner_id, status, is_sample, name, idea_title, tagline, description,
      category, country_code, stage, month, views_count
    ) VALUES (
      'rls-unverified-pending', _uid_unverified, 'pending', false, 'Unverified Submission',
      'Unverified Idea', 'Tagline', 'Description of unverified startup attempt',
      'AgriTech', 'US', 'MVP', '2026-10-01'::date, 0
    );
    _passed := false;
    _details := 'FAIL: Unverified submission succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (is_verified RLS rejection)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 25: unverified user cannot save a startup
  _check_name := '25 (NEG): unverified user cannot save a startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_unverified::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.saved_startups (user_id, startup_id) VALUES (_uid_unverified, _startup_approved_id);
    _passed := false;
    _details := 'FAIL: Unverified save succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (is_verified RLS rejection)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 26: non-founder cannot submit a startup
  _check_name := '26 (NEG): non-founder cannot submit a startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_b::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startups (
      slug, owner_id, status, is_sample, name, idea_title, tagline, description,
      category, country_code, stage, month, views_count
    ) VALUES (
      'rls-community-pending', _uid_b, 'pending', false, 'Community Submission',
      'Community Idea', 'Tagline', 'Description of community startup attempt',
      'AgriTech', 'US', 'MVP', '2026-10-01'::date, 0
    );
    _passed := false;
    _details := 'FAIL: Non-founder submission succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (founder role requirement in startups_insert_policy)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 27: founder cannot vote for own startup
  _check_name := '27 (NEG): founder cannot vote for own startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_owner::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_owner, _startup_approved_id);
    _passed := false;
    _details := 'FAIL: Founder self-vote succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (founder self-vote RLS rejection)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 28: direct API insert of a vote on a pending startup fails
  _check_name := '28 (NEG): direct API insert of a vote on a pending startup fails';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_veteran::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_veteran, _startup_pending_id);
    _passed := false;
    _details := 'FAIL: Vote on pending startup succeeded unexpectedly';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN
      _passed := true;
      _details := 'Caught expected SQLSTATE 42501 (pending startup vote rejected)';
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 29: 24h profile rule: young profile vote does not count, veteran vote counts
  _check_name := '29 (POS): 24h profile rule: young profile vote does not count, veteran vote counts';
  _passed := false;
  _details := '';
  BEGIN
    -- Read current count before additions
    SELECT votes_count INTO _vc FROM public.monthly_leaderboard_view WHERE id = _startup_approved_id;
    
    -- Insert fresh vote (< 24h old profile) as postgres
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_fresh, _startup_approved_id);
    SELECT votes_count INTO _vc_fresh FROM public.monthly_leaderboard_view WHERE id = _startup_approved_id;

    -- Insert veteran vote (>= 24h old profile) as postgres
    INSERT INTO public.startup_votes (user_id, startup_id) VALUES (_uid_veteran, _startup_approved_id);
    SELECT votes_count INTO _vc_veteran FROM public.monthly_leaderboard_view WHERE id = _startup_approved_id;

    IF _vc_fresh = _vc AND _vc_veteran = (_vc + 1) THEN
      _passed := true;
      _details := format('Fresh vote ignored (count %s -> %s); veteran vote counted (count -> %s)', _vc, _vc_fresh, _vc_veteran);
    ELSE
      _passed := false;
      _details := format('FAIL: Baseline %s, After fresh %s, After veteran %s', _vc, _vc_fresh, _vc_veteran);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 30: monthly_leaderboard normalises mid-month date to month start
  _check_name := '30 (POS): monthly_leaderboard normalises mid-month date to month start';
  _passed := false;
  _details := '';
  BEGIN
    SELECT count(*) INTO _lb_count
    FROM public.monthly_leaderboard('2026-10-15'::date)
    WHERE id = _startup_approved_id;

    IF _lb_count >= 1 THEN
      _passed := true;
      _details := format('Passing 2026-10-15 successfully returned approved startup row (count = %s)', _lb_count);
    ELSE
      _passed := false;
      _details := format('FAIL: Expected approved startup row for 2026-10-15, got %s rows', _lb_count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 31: direct JWT admin hiding a comment writes exactly ONE audit row with admin as actor
  _check_name := '31 (POS): direct JWT admin hiding a comment writes exactly ONE audit row with admin as actor';
  _passed := false;
  _details := '';
  BEGIN
    -- Insert a comment as postgres
    INSERT INTO public.startup_comments (id, user_id, startup_id, content, status)
    VALUES (_comment_test_id, _uid_b, _startup_approved_id, 'Comment to be hidden by admin', 'visible');

    -- Admin hides comment via JWT
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_d::text, 'role', 'authenticated')::text, true);
    UPDATE public.startup_comments SET status = 'hidden' WHERE id = _comment_test_id;

    -- Back to postgres to inspect audit_log
    PERFORM set_config('role', 'postgres', true);
    PERFORM set_config('request.jwt.claims', '', true);

    SELECT count(*) INTO _audit_count
    FROM public.audit_log
    WHERE target_id = _comment_test_id::text
      AND target_type = 'comment'
      AND action = 'hide_comment'
      AND actor_id = _uid_d
      AND metadata->>'previous_status' = 'visible'
      AND metadata->>'new_status' = 'hidden';

    IF _audit_count = 1 THEN
      _passed := true;
      _details := 'Exactly ONE audit_log row written by trigger with admin as actor';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected exactly 1 audit_log entry, got %s', _audit_count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 32: postgres role status update triggers 0 rows and app insert writes exactly ONE
  _check_name := '32 (POS): postgres role status update triggers 0 rows and app insert writes exactly ONE';
  _passed := false;
  _details := '';
  BEGIN
    -- As postgres (simulating server backend without JWT, auth.uid() IS NULL):
    -- 1. Update startup status (e.g. from pending to approved)
    UPDATE public.startups SET status = 'approved' WHERE id = _startup_pending_id;

    -- 2. App-style insert with the reviewer actor id
    INSERT INTO public.audit_log (
      actor_id,
      action,
      target_type,
      target_id,
      metadata
    ) VALUES (
      _uid_d,
      'startup.status_change:approved',
      'startup',
      _startup_pending_id::text,
      json_build_object('previous_status', 'pending', 'new_status', 'approved')
    );

    -- 3. Verify total rows in audit_log for this target is exactly 1 (trigger added 0 rows)
    SELECT count(*) INTO _audit_count
    FROM public.audit_log
    WHERE target_id = _startup_pending_id::text
      AND target_type = 'startup';

    IF _audit_count = 1 THEN
      _passed := true;
      _details := 'Exactly ONE row in audit_log (trigger added 0 rows because auth.uid() was null)';
    ELSE
      _passed := false;
      _details := format('FAIL: Expected exactly 1 row in audit_log, got %s (trigger may have added duplicate)', _audit_count);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  -- 33: verified veteran user can save and comment on approved startup
  _check_name := '33 (POS): verified veteran user can save and comment on approved startup';
  _passed := false;
  _details := '';
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_veteran::text, 'role', 'authenticated')::text, true);
  BEGIN
    INSERT INTO public.saved_startups (user_id, startup_id) VALUES (_uid_veteran, _startup_approved_id);
    INSERT INTO public.startup_comments (user_id, startup_id, content) VALUES (_uid_veteran, _startup_approved_id, 'Great verified comment');
    _passed := true;
    _details := 'Save and comment succeeded for verified veteran user';
  EXCEPTION
    WHEN OTHERS THEN
      _passed := false;
      _details := 'FAIL (unexpected error [' || SQLSTATE || ']): ' || SQLERRM;
  END;
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO _rls_results (check_name, status, details) VALUES (_check_name, CASE WHEN _passed THEN 'PASS' ELSE 'FAIL' END, _details);

  ----------------------------------------------------------------------
  -- UNCONDITIONAL CLEANUP BLOCK
  ----------------------------------------------------------------------
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  DELETE FROM public.startup_comments WHERE id = _comment_test_id;
  DELETE FROM public.audit_log WHERE target_id IN (_comment_test_id::text, _startup_pending_id::text);
  DELETE FROM public.saved_startups WHERE startup_id IN (_startup_approved_id, _startup_pending_id);
  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved', 'rls-unverified-pending', 'rls-community-pending');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d, _uid_owner, _uid_unverified, _uid_fresh, _uid_veteran);

EXCEPTION WHEN OTHERS THEN
  -- Ensure cleanup runs even if an unhandled error aborts the block
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.startup_comments WHERE id = _comment_test_id;
  DELETE FROM public.audit_log WHERE target_id IN (_comment_test_id::text, _startup_pending_id::text);
  DELETE FROM public.saved_startups WHERE startup_id IN (_startup_approved_id, _startup_pending_id);
  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved', 'rls-unverified-pending', 'rls-community-pending');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d, _uid_owner, _uid_unverified, _uid_fresh, _uid_veteran);
  RAISE;
END;
$$;

------------------------------------------------------------------------
-- 2. Final Results & Summary Report
------------------------------------------------------------------------
WITH checks AS (
  SELECT
    id,
    check_name,
    status,
    details
  FROM _rls_results
  ORDER BY id
),
summary AS (
  SELECT
    999999 AS id,
    CASE
      WHEN count(*) FILTER (WHERE status = 'FAIL') = 0
        THEN 'ALL ' || count(*) || ' CHECKS PASSED'
      ELSE
        count(*) FILTER (WHERE status = 'FAIL') || ' FAILED'
    END AS check_name,
    CASE
      WHEN count(*) FILTER (WHERE status = 'FAIL') = 0 THEN 'PASS'
      ELSE 'FAIL'
    END AS status,
    CASE
      WHEN count(*) FILTER (WHERE status = 'FAIL') = 0
        THEN 'All ' || count(*) || ' checks passed successfully'
      ELSE
        count(*) FILTER (WHERE status = 'FAIL') || ' check(s) failed out of ' || count(*)
    END AS details
  FROM _rls_results
)
SELECT check_name, status, details FROM checks
UNION ALL
SELECT check_name, status, details FROM summary;
