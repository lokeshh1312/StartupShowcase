-- 0001_initial_schema.sql
-- Create initial schema for Startup Showcase
-- Self-contained and re-runnable

CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- 1. Profiles (mirrors auth.users with app-specific roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'community' CHECK (role IN ('founder', 'investor', 'community', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Startups
CREATE TABLE IF NOT EXISTS public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_sample boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  idea_title text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL,
  full_story text NOT NULL DEFAULT '',
  category text NOT NULL,
  country_code text NOT NULL,
  region text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  remote_first boolean NOT NULL DEFAULT false,
  location text NOT NULL DEFAULT '',
  stage text NOT NULL,
  month date NOT NULL,
  month_label text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  logo_type text NOT NULL DEFAULT 'sprout',
  logo_color text NOT NULL DEFAULT '#2563EB',
  thumbnail text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  founder_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  problem text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  key_features_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  tech_stack_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  traction text NOT NULL DEFAULT '',
  views_count integer NOT NULL DEFAULT 0,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Search TSVector column (generated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'startups' AND column_name = 'search_tsv'
  ) THEN
    ALTER TABLE public.startups
    ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'C')
    ) STORED;
  END IF;
END $$;

-- 3. Startup Votes
CREATE TABLE IF NOT EXISTS public.startup_votes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, startup_id)
);

-- 4. Saved Startups
CREATE TABLE IF NOT EXISTS public.saved_startups (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, startup_id)
);

-- 5. Startup Comments
CREATE TABLE IF NOT EXISTS public.startup_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Startup Views (deduplicated per viewer_hash per day)
CREATE TABLE IF NOT EXISTS public.startup_views (
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  viewer_hash text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (startup_id, viewer_hash, day)
);

-- 7. Rate Limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- 8. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email public.citext NOT NULL UNIQUE,
  confirmed boolean NOT NULL DEFAULT false,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auth trigger to automatically create profile for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'community')
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = CASE WHEN profiles.display_name = '' THEN EXCLUDED.display_name ELSE profiles.display_name END,
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
