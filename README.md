# Startup Showcase

A **global** startup discovery and monthly-leaderboard platform for early-stage startups from any country. Founders submit startups, admins review and approve/reject submissions, visitors browse, search, filter, vote, save, and comment.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Backend & DB | Supabase Postgres + Supabase Auth + Supabase Storage |
| ORM | Drizzle ORM |
| Validation | Zod |
| Testing | Vitest (unit) · Playwright (e2e) |
| Deployment | Portable Node build (`output: "standalone"`) — no vendor lock-in |

## Run Locally

### Prerequisites

- Node.js ≥ 20
- npm

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd StartupShowcase
npm install

# 2. Copy environment template and fill in your keys
cp .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production bundle (standalone) |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run seed` | Seed global sample startups (requires non-production environment) |
| `npm run check:samples` | Guard script ensuring zero sample test data exists in production |

## Database Setup & Migrations

All SQL migrations reside in `/supabase/migrations`. Apply them in numeric order in your Supabase SQL Editor:

1. `supabase/migrations/0001_initial_schema.sql` — Extensions, tables, foreign keys, and auth triggers.
2. `supabase/migrations/0002_indexes.sql` — Status/month, slug uniqueness, GIN full-text index, and foreign key indexes.
3. `supabase/migrations/0003_leaderboard.sql` — Monthly leaderboard view & SQL function with deterministic tie-breaks.
4. `supabase/migrations/0004_rls_and_permissions.sql` — Row Level Security policies and least-privilege role grants.

Alternatively, if using the Supabase CLI:
```bash
npx supabase db push
```

### Seeding Sample Data
Once migrations have been applied:
```bash
npm run seed
```
This loads 27 global sample startups across 12 countries into Postgres with `is_sample = true`. Safe to re-run.

## Environment Variables

See [`.env.example`](.env.example) for the full list:

- `NEXT_PUBLIC_SITE_URL` — Public site origin (e.g. `https://startupshowcase.com`). **CRITICAL**: In production (`NODE_ENV=production`), `NEXT_PUBLIC_SITE_URL` must be set during the **BUILD** step as well as at runtime. If missing, empty, or containing `localhost`, the build and server startup will fail with a loud error to prevent deploying broken canonical and Open Graph metadata. In development and test, it safely defaults to `http://localhost:3000`.
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (**server-only**)
- `DATABASE_URL` — Postgres connection string
- `RESEND_API_KEY` — Resend API key for transactional email (REQUIRED IN PRODUCTION).
- `EMAIL_FROM` — Verified sender address (e.g. `Startup Showcase <updates@yourdomain.com>`).
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile public site key (REQUIRED IN PRODUCTION).
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile server secret key (REQUIRED IN PRODUCTION).
- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` — Set to `true` to activate Google OAuth Sign-In.
- `TRUSTED_PROXY_COUNT` — Number of reverse proxies in front of the application. In production (`NODE_ENV=production`), this environment variable is mandatory and must be explicitly set (even to `0`). On the real host, the value must match the exact number of reverse proxies in front of the app (determined during deployment). If unset in production, startup/first use throws a loud configuration error. In development and test, it safely defaults to `0`.
- `VIEW_HASH_SECRET` — Secret salt used for deterministic daily viewer hash calculation without storing raw user IP addresses.

## Phase 5B Setup (Images, Email, CAPTCHA, Google OAuth)

### 1. Database Migrations
Apply these migrations in order in your Supabase SQL Editor:
1. `supabase/migrations/0006_storage.sql` — Creates public-read `startup-images` bucket, restricts uploads/updates/deletes to `{auth.uid()}/*` with email verification check (`is_verified()`), and sets 2MB limit with png/jpeg/webp MIME constraints.
2. `supabase/migrations/0007_newsletter.sql` — Adds `confirmed_at`, `unsubscribe_token`, and `token_expires_at` to `newsletter_subscribers` for double opt-in verification.

Verify with:
- Run `supabase/tests/rls_checks.sql` in Supabase SQL editor to ensure all 41 test assertions pass (`ALL 41 CHECKS PASSED`).

### 2. Environment Variables & Where to Get Them

| Variable | Required in Prod? | Where to Obtain |
| --- | --- | --- |
| `RESEND_API_KEY` | **Yes** | [Resend Dashboard](https://resend.com/api-keys) > Create API Key with "Sending access". |
| `EMAIL_FROM` | **Yes** | Your verified domain in Resend (e.g. `Startup Showcase <updates@yourdomain.com>`). See [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **Yes** | [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) > Turnstile > Add Site (Managed mode). |
| `TURNSTILE_SECRET_KEY` | **Yes** | Cloudflare Turnstile Site Settings > Secret Key. |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | No (Optional) | Set to `true` once Google Cloud OAuth credentials and Supabase Google Provider are configured. See [docs/GOOGLE_SIGNIN_SETUP.md](docs/GOOGLE_SIGNIN_SETUP.md). |

### 3. Graceful Degradation vs Production Hardening
- **Local Development**: With no new keys set, `npm run dev` works out of the box. Image uploads operate against Supabase Storage once migration 0006 is applied; emails log safely to the server console; CAPTCHA checks and Google OAuth are skipped.
- **Production**: Missing required keys (`RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TRUSTED_PROXY_COUNT`) causes immediate startup failure with a clear error identifying the missing variable.

## Project Structure

```
src/
├── app/             # Next.js App Router pages & layouts
│   ├── globals.css  # Tailwind + design tokens
│   ├── layout.tsx   # Root layout (Navbar, Footer, ThemeProvider)
│   └── page.tsx     # Home page
├── components/      # Shared React components
│   ├── footer.tsx
│   ├── logo.tsx
│   ├── navbar.tsx
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
└── __tests__/       # Vitest tests
```

## Deployment

The project is configured with `output: "standalone"` in `next.config.ts`. This produces a self-contained Node.js server with no platform-specific dependencies.

```bash
npm run build
# The standalone server is in .next/standalone/
node .next/standalone/server.js
```

Copy `.next/static` and `public` into `.next/standalone/` for static assets.

## License

Private — all rights reserved.
