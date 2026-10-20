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
  _startup_approved_id uuid := 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  _startup_pending_id  uuid := 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

  _check_name text;
  _passed boolean;
  _details text;
  _count integer;
  _lb_count integer;
  _rc integer;
  _c_role text;
  _vc bigint;
  _voter_uid uuid;
  _voter_blocked boolean;
  _got_count boolean;
BEGIN
  -- Always ensure we start as postgres
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  ----------------------------------------------------------------------
  -- SETUP (as postgres)
  ----------------------------------------------------------------------
  -- Pre-cleanup in case of prior interrupted execution
  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d);

  -- Insert real users into auth.users so handle_new_user trigger creates real profiles
  -- User A: founder
  -- User B: community
  -- User C: requested role 'admin' -> sanitized to 'community' by trigger
  -- User D: community -> promoted to 'admin' by postgres below
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
  ) VALUES
    (_uid_a, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-a@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Founder A", "role": "founder"}'::jsonb, now(), now()),
    (_uid_b, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-b@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Community B", "role": "community"}'::jsonb, now(), now()),
    (_uid_c, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-c@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Attacker C", "role": "admin"}'::jsonb, now(), now()),
    (_uid_d, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', 'rls-test-d@example.invalid', 'encrypted-secret-placeholder', now(), '{"name": "RLS Admin D", "role": "community"}'::jsonb, now(), now());

  -- Promote user D to admin as postgres (allowed by protect_profile_columns trigger)
  UPDATE public.profiles SET role = 'admin' WHERE id = _uid_d;

  -- Create one approved and one pending startup as postgres
  INSERT INTO public.startups (
    id, slug, owner_id, status, is_sample, name, idea_title, tagline, description,
    category, country_code, stage, month, month_label, views_count, approved_at
  ) VALUES (
    _startup_approved_id, 'rls-test-approved', _uid_a, 'approved', false,
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
  PERFORM set_config('request.jwt.claims', json_build_object('sub', _uid_a::text, 'role', 'authenticated')::text, true);
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

  ----------------------------------------------------------------------
  -- UNCONDITIONAL CLEANUP BLOCK
  ----------------------------------------------------------------------
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);

  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d);

EXCEPTION WHEN OTHERS THEN
  -- Ensure cleanup runs even if an unhandled error aborts the block
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '', true);
  DELETE FROM public.startups WHERE slug IN ('rls-test-approved', 'rls-test-pending', 'rls-positive-pending', 'rls-hack-approved');
  DELETE FROM auth.users WHERE id IN (_uid_a, _uid_b, _uid_c, _uid_d);
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
