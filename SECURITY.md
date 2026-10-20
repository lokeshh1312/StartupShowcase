# Security & Authorization Architecture

## Overview
Startup Showcase utilizes Supabase Postgres with Row Level Security (RLS) enabled on every table. Schema auto-expose is disabled, and least-privilege role grants are explicitly defined.

---

## Row Level Security (RLS) Policies

| Table | One-Line RLS Policy Summary |
| --- | --- |
| `profiles` | Public can SELECT all profiles; authenticated users can only INSERT/UPDATE their own profile (`auth.uid() = id`). |
| `startups` | Anyone can SELECT approved startups; owners can SELECT/INSERT/UPDATE their own pending submissions; admins can SELECT/UPDATE/DELETE all startups and moderate status. |
| `startup_votes` | Anyone can SELECT votes; authenticated users can only INSERT and DELETE their own votes (`auth.uid() = user_id`). |
| `saved_startups` | Authenticated users can only SELECT, INSERT, and DELETE their own saved startups (`auth.uid() = user_id`). |
| `startup_comments` | Anyone can SELECT visible comments on approved startups (plus author/admin for their own); authenticated users can INSERT and DELETE their own comments; admins can UPDATE (moderate) or DELETE any comment. |
| `startup_views` | Server-only table (no anon/authenticated policies); accessed exclusively through server-side logic using service role. |
| `rate_limits` | Server-only table (no anon/authenticated policies); rate-limiting enforced on server using service role. |
| `newsletter_subscribers` | Server-only table (no anon/authenticated policies); subscription tokens and emails managed server-side. |
| `audit_log` | Server-only table (no anon/authenticated policies); immutable administrative action logs written server-side. |

---

## Role Privileges (Grants)

| Table / Object | `anon` | `authenticated` | `service_role` |
| --- | --- | --- | --- |
| `public.profiles` | `SELECT` | `SELECT`, `INSERT`, `UPDATE` | `ALL` |
| `public.startups` | `SELECT` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `ALL` |
| `public.startup_votes` | `SELECT` | `SELECT`, `INSERT`, `DELETE` | `ALL` |
| `public.saved_startups` | None | `SELECT`, `INSERT`, `DELETE` | `ALL` |
| `public.startup_comments` | `SELECT` | `SELECT`, `INSERT`, `DELETE`, `UPDATE` | `ALL` |
| `public.monthly_leaderboard_view` | `SELECT` | `SELECT` | `ALL` |
| `public.monthly_leaderboard(date)` | `EXECUTE` | `EXECUTE` | `EXECUTE` |
| `public.is_admin()` | `EXECUTE` | `EXECUTE` | `EXECUTE` |
| `public.startup_views` | None | None | `ALL` |
| `public.rate_limits` | None | None | `ALL` |
| `public.newsletter_subscribers` | None | None | `ALL` |
| `public.audit_log` | None | None | `ALL` |

---

## Secrets & Client Safety
1. **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` and database connection credentials are strictly server-only (`import "server-only"` enforced in database client) and are never exposed to browser bundles.
2. **Input Validation**: All server actions and repository functions validate payload types, lengths, and constraints using Zod schemas (`src/lib/validation.ts`) prior to query execution.
3. **No Concatenated SQL**: All queries use Drizzle ORM parameterized SQL or typed query builders.
