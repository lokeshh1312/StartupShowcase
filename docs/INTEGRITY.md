# Platform Integrity & Security Architecture

This document specifies all data integrity, abuse prevention, and security rules across Startup Showcase, detailing where each rule is enforced (Database RLS/triggers vs. Server Actions/Repository).

---

## 1. Initial Admin Provisioning (SQL Only)

To prevent privilege escalation from client-accessible interfaces:
- **No server action or API route allows promoting a user to admin.**
- The initial admin (and any subsequent admin) must be created **strictly via direct SQL** in the Supabase SQL editor:

```sql
-- Replace <user-uuid> with the user's UUID from auth.users:
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<user-uuid>';
```

The database trigger `protect_profile_columns` strictly prevents any authenticated client from modifying the `role` column on `public.profiles`. Only superuser/service-role sessions (such as the Supabase SQL Editor) can update profile roles.

---

## 2. Dual Enforcement Matrix (Server vs. Database)

Because the Next.js server connects using a privileged role that bypasses Row Level Security, every integrity rule is enforced in **both** layers:
1. **Database Layer**: RLS policies, PostgreSQL triggers (with `SET search_path = ''` to prevent search path hijacking), and database views enforce rules against direct PostgREST or Supabase API calls.
2. **Server Layer**: Server Actions (`src/server/actions.ts`) and database service helpers (`src/server/startups.ts`, `src/server/rate-limit.ts`, `src/server/comments.ts`) validate inputs, user authentication, email verification, and rate limits prior to query execution.

| Rule | Database Enforcement | Server Enforcement | User Experience / UI |
| --- | --- | --- | --- |
| **Email Verification** | `public.is_verified()` `SECURITY DEFINER` function (`SET search_path = ''`) in RLS `INSERT` policies for `startups`, `startup_votes`, `saved_startups`, and `startup_comments`. | Checks `user.email_confirmed_at` and `isUserEmailVerified(userId)`. Returns `"Please verify your email first."` | `UnverifiedBanner` rendered in layout with a "Resend verification email" button. Signup displays "Check your inbox". |
| **Anti-Enumeration (Auth)** | Supabase Auth API authentication checks. | `signInAction`, `signUpAction`, and `forgotPasswordAction` return uniform generic messages (`"Email or password is incorrect."` / `"If an account exists, we sent an email."`). | Attackers cannot enumerate registered emails through sign-in, registration, or password reset. |
| **Role Restriction** | `handle_new_user()` trigger sanitizes `role` metadata to `'founder'`, `'investor'`, or `'community'`. Defaults any other value to `'community'`. `startups_insert_policy` requires profile role `founder` or `admin`. | `signUpAction` validates allowed role list prior to forwarding to Supabase Auth. `submitStartupAction` verifies founder role. | Registration form allows only founder, investor, or community. |
| **Voting: Verified Only** | `startup_votes_insert_policy` requires `public.is_verified()`. | `voteAction` and `toggleVote` check email confirmation before voting. | Friendly verification prompt if unconfirmed. |
| **Voting: No Founder Self-Vote** | `startup_votes_insert_policy` check: `(s.owner_id IS NULL OR s.owner_id <> auth.uid())`. | `toggleVote` checks `startup.ownerId === userId` and throws `"Founders cannot vote for their own startup."`. | Disallows self-voting; prevents founders from inflating their own rank. |
| **Voting: 24-Hour Profile Rank Rule** | `monthly_leaderboard_view` counts votes only where voter profile `created_at <= (now() - interval '24 hours')`. Function `monthly_leaderboard(target_month)` normalises dates to month start (`date_trunc('month', target_month)::date`). | `listStartups` uses identical `LEFT JOIN (startup_votes v JOIN profiles voter ...)` condition. | Votes toggle immediately for voter, but rank impact reflects once profile is 24 hours old. Documented in FAQ. |
| **User Activity Rate Limits** | Server-enforced via atomic `rate_limits` table. | `voteAction` (30/h), `saveAction` (60/h), `addCommentAction` (15/h), `submitStartupAction` (5/h) keyed strictly by `user.id`. | Returns friendly `"Too many attempts, try again later."` on burst abuse. |
| **Rate Limiting (Atomic & Hashed)** | `public.rate_limits` table with composite primary key `(key, window_start)`. | `checkRateLimit` executes single atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`. Strictly no read-then-write race conditions. Raw emails are NEVER stored in keys: normalised `sha256(email)` is used. Opportunistic cleanup (~1 in 200 calls) prunes rows older than 2 days. | Protects signin (10/15m per email & IP), signup (5/h per email, 10/h per IP or 200/h global ceiling), forgot-password (5/h per email, 5/h per IP or 200/h global ceiling), newsletter (5/h per email, 5/h per IP or 200/h global ceiling). |
| **Trusted Proxy IP & Unknown IP Handling** | N/A (Server header evaluation). | `extractClientIp` respects `TRUSTED_PROXY_COUNT`: in production, mandatory and must match reverse proxy count. If count <= 0 or IP cannot be determined, returns `null` ("unknown"). Does NOT collapse unknown IPs into a single bucket: falls back to per-email limits and global ceilings. | Prevents IP header spoofing while operating behind reverse proxies; prevents one actor on unknown IP from locking out all users. |
| **Deduplicated Views** | `startup_views` composite primary key `(startup_id, viewer_hash, day)`. | `getStartupBySlug` hashes `sha256(ip + ua + daily salt)` where daily salt is derived from `VIEW_HASH_SECRET` + UTC date. Increments `views_count` only on successful insert. | Ignores bots, crawlers, HEAD requests, and Next.js prefetch requests. Counts only approved, non-sample startups. |
| **Submissions Limit** | `startups_insert_policy` allows verified founders to submit with default pending status. | `createStartup` enforces maximum 5 pending submissions per founder account. | Founders cannot flood review queue with unreviewed backlog. |
| **Image Upload Security** | `storage.objects` RLS policies in `0006_storage.sql`: public read; insert/update/delete restricted to `{auth.uid()}/*` first path segment and verified user (`public.is_verified()`). Bucket enforces 2MB limit and png/jpeg/webp mime types. | `uploadStartupImage` / `validateImageBuffer`: strictly validates real magic bytes for PNG, JPEG, and WebP; rejects SVG entirely; generates UUID file names (no user path traversal); handles orphan image deletion on replace/delete. | Fast image preview, clear error feedback on invalid formats or size over 2 MB. |
| **Transactional Email Security** | N/A (Server-side delivery). | `src/server/email.ts`: validates required keys in production at startup; HTML-escapes all user content with `escapeHtml`; email dispatch failure is non-blocking (logged to `audit_log` without rolling back DB transaction). | Immediate UX response; users receive branded confirmation and status notification emails. |
| **Newsletter Double Opt-In** | `newsletter_subscribers` table stores `token_hash` (`sha256`) and `confirmed_at`. Service-role access only. | `subscribeNewsletter` creates unconfirmed entry, generates high-entropy random token, emails confirmation link with 48h expiry. `/newsletter/confirm` marks confirmed; `/newsletter/unsubscribe` clears subscription. Never reveals subscription status. Rate limited (5/h per email & IP). | Clear confirmation instructions; 1-click unsubscribe. |
| **Bot & Abuse Protection (CAPTCHA)** | N/A (External verification service). | `verifyTurnstileToken` calls Cloudflare Turnstile siteverify with client IP. Enforced on server actions for signup, startup submission, newsletter subscribe, and password reset. Mandatory in production; bypassable in test using Cloudflare dummy keys. | Seamless invisible / interactive verification with minimal user friction. |
| **OAuth Identity & Role Safety** | `handle_new_user()` trigger defaults OAuth-created profiles to role `'community'` and ignores non-standard roles. Database trigger `protect_profile_columns` forbids updating `role`. | `chooseInitialRoleAction` permits a one-time onboarding selection between `'founder'`, `'investor'`, and `'community'` (strictly never `'admin'`). | Google Sign-In button displayed when enabled; onboarding modal/prompt for new OAuth founders. |
| **Duplicate Detection** | `pg_trgm` extension enabled in `0005_integrity.sql` for fuzzy string matching. | `checkStartupDuplicate` tests normalized website domain and name similarity (`similarity > 0.6`). | Likely duplicates are not blocked, but trigger clear warning badges with direct links in admin review queue. |
| **Comment Spam Heuristics** | `startup_comments_insert_policy` checks verified user, approved startup, and visible status. | `validateCommentSpam` rejects > 2 links, > 30% uppercase on comments > 20 chars, and identical repeat comments within 10 minutes. | Rejects spam with constructive guidance. |
| **Comment Moderation** | `startup_comments_update_policy` permits only admins (`public.is_admin()`). Trigger `trg_comment_status_audit` logs status transitions to `audit_log` with actor when `auth.uid() IS NOT NULL`. | `hideCommentAction` and `hideComment` update status to `'hidden'` inside transaction and write audit trail with `previous_status` and `new_status`. | Admin comment moderation button directly on startup comments and admin panel. |
| **Administrative Audit Trail** | `public.audit_log` with `REVOKE ALL FROM anon, authenticated`. Triggers `trg_comment_status_audit` and `trg_startup_status_audit` return immediately when `auth.uid() IS NULL` to prevent duplicate rows. Standardized `snake_case` keys (`previous_status`, `new_status`). | Server actions record true previous status (`previous_status` -> `new_status`) with the authenticated admin ID. | `/admin` Audit Log tab displays latest 100 entries with transition details. |

---

## 3. Rate Limit & Proxy Configuration

Set `TRUSTED_PROXY_COUNT` in `.env.local` / deployment environment:
- Mandatory in production (`NODE_ENV=production`): application throws a clear startup error if missing or invalid.
- Must match the exact number of reverse proxies in front of the application:
  - `0`: Direct node process / local development / direct socket connections (ignores `x-forwarded-for`).
  - `1`: Single reverse proxy / CDN (e.g. Cloudflare or Nginx).
  - `2`: Two-tier proxy topology (e.g. Cloudflare -> AWS ALB -> Node).

Set `VIEW_HASH_SECRET` in `.env.local` to a high-entropy string (required in production). This prevents rainbow table inversion of viewer hashes across dates.
