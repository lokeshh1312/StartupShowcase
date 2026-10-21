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
- `RESEND_API_KEY` — Resend API key for transactional email

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
