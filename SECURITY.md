# Security & Authorization Architecture

## Overview
Startup Showcase utilizes Supabase Postgres with Row Level Security (RLS) enabled on every table. Schema auto-expose is disabled, and least-privilege role grants are explicitly defined. Column-level grants restrict authenticated writes to content-only columns.

---

## Row Level Security (RLS) Policies

| Table | One-Line RLS Policy Summary |
| --- | --- |
| `profiles` | Public can SELECT all profiles; authenticated users can UPDATE only their own profile (`auth.uid() = id`). No INSERT policy for authenticated (the auth trigger creates profiles). A BEFORE UPDATE trigger rejects changes to `role`, `id`, or `created_at` unless the session is `service_role` / `postgres`. |
| `startups` | Anyone can SELECT approved startups; owners can SELECT their own pending submissions; admins can SELECT/UPDATE/DELETE all. INSERT requires verified founder/admin (`public.is_verified()`), `status = 'pending'`, `is_sample = false`, `approved_at IS NULL`, `reviewed_by IS NULL`, `views_count = 0`, and `auth.uid() = owner_id`. Owner UPDATE policy requires keeping `status = 'pending'`. |
| `startup_votes` | Authenticated users can SELECT only their own votes (`auth.uid() = user_id`); no anon SELECT. INSERT requires verified user (`public.is_verified()`), `auth.uid() = user_id`, approved startup, and blocks founders from voting for their own startup (`s.owner_id <> auth.uid()`). Public rank counts only votes from voter profiles >= 24h old via `monthly_leaderboard_view`. |
| `saved_startups` | Authenticated users can only SELECT, INSERT, and DELETE their own saved startups (`auth.uid() = user_id`). INSERT requires verified email (`public.is_verified()`). |
| `startup_comments` | Visible comments on approved startups are readable by anyone (plus author/admin for their own). INSERT requires verified user (`public.is_verified()`), `status = 'visible'`, and approved startup. DELETE own or admin. UPDATE requires admin (`public.is_admin()`); trigger `trg_comment_status_audit` (`SET search_path = ''`) logs status transitions to `audit_log` with snake_case metadata when `auth.uid() IS NOT NULL`. |
| `startup_views` | Server-only table (no anon/authenticated policies); daily deduplicated views via `viewer_hash = sha256(ip + ua + daily salt)` where daily salt rotates with UTC date and `VIEW_HASH_SECRET`. |
| `rate_limits` | Server-only table (no anon/authenticated policies); atomic limiter using single statement `INSERT ... ON CONFLICT DO UPDATE` with trusted proxy IP extraction (`TRUSTED_PROXY_COUNT`), unknown-IP isolation, hashed email keys, and opportunistic pruning. |
| `newsletter_subscribers` | Server-only table (no anon/authenticated policies); subscription tokens and emails managed server-side. |
| `audit_log` | Server-only table (no anon/authenticated policies); immutable administrative action logs written by server actions and DB audit triggers (triggers return immediately if `auth.uid() IS NULL` to prevent duplicate rows). Standardised snake_case metadata keys (`previous_status`, `new_status`). |

For detailed implementation mapping between server actions and database constraints, see [docs/INTEGRITY.md](docs/INTEGRITY.md).

---

## Role Privileges (Grants)

| Table / Object | `anon` | `authenticated` | `service_role` |
| --- | --- | --- | --- |
| `public.profiles` | `SELECT` | `SELECT`, `UPDATE (display_name)` | `ALL` |
| `public.startups` | `SELECT` | `SELECT`, `INSERT (content columns + required defaults)`, `UPDATE (content columns + updated_at)`, `DELETE` | `ALL` |
| `public.startup_votes` | None | `SELECT`, `INSERT`, `DELETE` | `ALL` |
| `public.saved_startups` | None | `SELECT`, `INSERT`, `DELETE` | `ALL` |
| `public.startup_comments` | `SELECT` | `SELECT`, `INSERT`, `DELETE`, `UPDATE` | `ALL` |
| `public.monthly_leaderboard_view` | `SELECT` | `SELECT` | `ALL` |
| `public.monthly_leaderboard(date)` | `EXECUTE` | `EXECUTE` | `EXECUTE` |
| `public.is_admin()` | `EXECUTE` | `EXECUTE` | `EXECUTE` |
| `public.startup_views` | None | None | `ALL` |
| `public.rate_limits` | None | None | `ALL` |
| `public.newsletter_subscribers` | None | None | `ALL` |
| `public.audit_log` | None | None | `ALL` |

### Startups Column-Level Grants (authenticated)

| Operation | Columns |
| --- | --- |
| `INSERT` | `slug`, `owner_id`, `status`, `name`, `idea_title`, `tagline`, `description`, `full_story`, `category`, `country_code`, `region`, `city`, `remote_first`, `location`, `stage`, `month`, `month_label`, `website_url`, `logo_type`, `logo_color`, `thumbnail`, `cover_image`, `founder_json`, `problem`, `solution`, `key_features_json`, `tech_stack_json`, `traction`, `is_sample`, `approved_at`, `reviewed_by`, `views_count` |
| `UPDATE` | `name`, `idea_title`, `tagline`, `description`, `full_story`, `category`, `country_code`, `region`, `city`, `remote_first`, `location`, `stage`, `month`, `month_label`, `website_url`, `logo_type`, `logo_color`, `thumbnail`, `cover_image`, `founder_json`, `problem`, `solution`, `key_features_json`, `tech_stack_json`, `traction`, `updated_at` |

> **Note:** RLS INSERT policy enforces `status = 'pending'`, `is_sample = false`, `approved_at IS NULL`, `reviewed_by IS NULL`, and `views_count = 0` — so even though the column-level GRANT permits writing to those columns, the RLS policy blocks any value other than the required defaults.

---

## Profile Protection

A `BEFORE UPDATE` trigger (`protect_profile_columns`) prevents any non-service-role session from modifying `role`, `id`, or `created_at`. Admin profiles are created only via SQL or the service role.

## Auth Trigger: `handle_new_user`

The `handle_new_user` trigger sanitizes `raw_user_meta_data`:
- **Role**: Only `'founder'`, `'investor'`, or `'community'` are accepted. Any other value (including `'admin'`) defaults to `'community'`.
- **Display name**: Capped at 100 characters.

## Launch Month

The server decides the launch month. The client submission schema does **not** accept a `month` field. When a startup is approved via `moderateStartup`, the launch month is set to the UTC month of the approval timestamp.

---

## Secrets & Client Safety
1. **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` and database connection credentials are strictly server-only (`import "server-only"` enforced in database client) and are never exposed to browser bundles.
2. **Input Validation**: All server actions and repository functions validate payload types, lengths, and constraints using Zod schemas (`src/lib/validation.ts`) prior to query execution.
3. **No Concatenated SQL**: All queries use Drizzle ORM parameterized SQL or typed query builders.
