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
1. **Database Layer**: RLS policies, PostgreSQL triggers, and database views enforce rules against direct PostgREST or Supabase API calls.
2. **Server Layer**: Server Actions (`src/server/actions.ts`) and database service helpers (`src/server/startups.ts`, `src/server/rate-limit.ts`, `src/server/comments.ts`) validate inputs and state before executing commands.

| Rule | Database Enforcement | Server Enforcement | User Experience / UI |
| --- | --- | --- | --- |
| **Email Verification** | `public.is_verified()` `SECURITY DEFINER` function in RLS `INSERT` policies for `startups`, `startup_votes`, `saved_startups`, and `startup_comments`. | Checks `user.email_confirmed_at` and `isUserEmailVerified(userId)`. Returns `"Please verify your email first."` | `UnverifiedBanner` rendered in layout with a "Resend verification email" button. Signup displays "Check your inbox". |
| **Anti-Enumeration (Auth)** | Supabase Auth API authentication checks. | `signInAction`, `signUpAction`, and `forgotPasswordAction` return uniform generic messages (`"Email or password is incorrect."` / `"If an account exists, we sent an email."`). | Attackers cannot enumerate registered emails through sign-in, registration, or password reset. |
| **Role Restriction** | `handle_new_user()` trigger sanitizes `role` metadata to `'founder'`, `'investor'`, or `'community'`. Defaults any other value to `'community'`. | `signUpAction` validates allowed role list prior to forwarding to Supabase Auth. | Registration form allows only founder, investor, or community. |
| **Voting: Verified Only** | `startup_votes_insert_policy` requires `public.is_verified()`. | `voteAction` and `toggleVote` check verification before voting. | Friendly verification prompt if unconfirmed. |
| **Voting: No Founder Self-Vote** | `startup_votes_insert_policy` check: `(s.owner_id IS NULL OR s.owner_id <> auth.uid())`. | `toggleVote` checks `startup.ownerId === userId` and throws `"Founders cannot vote for their own startup."`. | Disallows self-voting; prevents founders from inflating their own rank. |
| **Voting: 24-Hour Profile Rank Rule** | `monthly_leaderboard_view` counts votes only where voter profile `created_at <= (now() - interval '24 hours')`. | `listStartups` uses identical `LEFT JOIN (startup_votes v JOIN profiles voter ...)` condition. | Votes toggle immediately for voter, but rank impact reflects once profile is 24 hours old. Documented in FAQ. |
| **Voting Rate Limit** | Server-enforced via `rate_limits` table. | `checkRateLimit('vote:user:${userId}', 30, 3600)` restricts vote toggles to 30/hour. | Returns friendly `"Too many attempts, try again later."` on burst abuse. |
| **Rate Limiting (Atomic)** | `public.rate_limits` table with composite primary key `(key, window_start)`. | `checkRateLimit` executes single atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING count`. Strictly no read-then-write race conditions. | Protects signin (10/15m), signup (5/h), forgot-password (5/h), comments (10/10m), submissions (5/h), newsletter (5/h). |
| **Trusted Proxy IP Extraction** | N/A (Server header evaluation). | `extractClientIp` respects `TRUSTED_PROXY_COUNT`: default 0 ignores `x-forwarded-for`. Leftmost-trusted rule selects Nth-from-last entry. | Prevents IP header spoofing while operating behind reverse proxies. |
| **Deduplicated Views** | `startup_views` composite primary key `(startup_id, viewer_hash, day)`. | `getStartupBySlug` hashes `sha256(ip + ua + daily salt)` where daily salt is derived from `VIEW_HASH_SECRET` + UTC date. Increments `views_count` only on successful insert. | Ignores bots, crawlers, HEAD requests, and Next.js prefetch requests. Counts only approved, non-sample startups. |
| **Submissions Limit** | `startups_insert_policy` allows verified founders to submit with default pending status. | `createStartup` enforces maximum 5 pending submissions per founder account. | Founders cannot flood review queue with unreviewed backlog. |
| **Duplicate Detection** | `pg_trgm` extension enabled in `0005_integrity.sql` for fuzzy string matching. | `checkStartupDuplicate` tests normalized website domain and name similarity (`similarity > 0.6`). | Likely duplicates are not blocked, but trigger clear warning badges with direct links in admin review queue. |
| **Comment Spam Heuristics** | `startup_comments_insert_policy` checks verified user, approved startup, and visible status. | `validateCommentSpam` rejects > 2 links, > 30% uppercase on comments > 50 chars, and identical repeat comments within 10 minutes. | Rejects spam with constructive guidance. |
| **Comment Moderation** | `startup_comments_update_policy` permits only admins (`public.is_admin()`). `trg_comment_status_audit` trigger writes to `audit_log`. | `hideCommentAction` and `hideComment` update status to `'hidden'` inside transaction and record audit trail with previous value. | Admin comment moderation button directly on startup comments and admin panel. |
| **Administrative Audit Trail** | `public.audit_log` with `REVOKE ALL FROM anon, authenticated`. Triggers `trg_comment_status_audit` and `trg_startup_status_audit` log status changes. | Server actions record true previous status (`previousStatus` -> `newStatus`) in `audit_log`. | `/admin` Audit Log tab displays latest 100 entries with transition details. |

---

## 3. Rate Limit Configuration

Set `TRUSTED_PROXY_COUNT` in `.env.local` according to deployment infrastructure:
- `0`: Direct node process / local development (ignores `x-forwarded-for`).
- `1`: Single reverse proxy / CDN (e.g. Cloudflare or Nginx).
- `2`: Two-tier proxy topology (e.g. Cloudflare -> AWS ALB -> Node).

Set `VIEW_HASH_SECRET` in `.env.local` to a high-entropy string (required in production). This prevents rainbow table inversion of viewer hashes across dates.
