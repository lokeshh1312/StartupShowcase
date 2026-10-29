# Startup Showcase - Agent Guidelines

## PROJECT
- **Startup Showcase**: A GLOBAL startup discovery and monthly-leaderboard platform for early-stage startups from any country.
- **Global Scope**: Nothing may be India-specific (no Indian states list, no India-only copy, no rupee or IST assumptions).
- **Core User Journeys**: Founders submit startups, admins review and approve/reject submissions, visitors browse, search, filter, vote, save, and comment.

## STACK (target)
- **Framework & Language**: Next.js (latest stable, App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Backend & Database**: Supabase Postgres + Supabase Auth + Supabase Storage
- **ORM & Migrations**: Drizzle ORM for typed queries and schema migrations (SQL migrations committed in `/supabase/migrations`)
- **Validation**: `zod` for all runtime and server-side input validation
- **Testing**: Vitest for unit tests
- **Deployment Target**: Portable Node build (`output: "standalone"` in `next.config`). No Vercel-specific code, configuration, or packages anywhere.

## STANDING RULES (CRITICAL - PRODUCTION DATABASE SAFETY)
- Never run `npm run test:e2e`, Playwright, `scripts/cleanup-unpaid.ts`, `scripts/seed.ts`, or any other script that loads `.env.local` or connects to DATABASE_URL. The `.env.local` file points at the LIVE production database.
- Only run: `npm run lint`, `npx tsc --noEmit`, `npm test` (unit tests with mocks) and `npm run build`.
- If a task seems to need a database, a browser test, or a script that touches data, stop and ask me first instead of running it.
- Never print, copy or commit values from `.env.local`.

## RULES
1. **Branching & Commits**: Work on branch `next-migration`. Make one commit per completed phase with a clear message.
2. **Secrets & Security**: Never commit secrets. Only `.env.example` with placeholder values is committed. The Supabase service-role key is server-only and must never be imported in client components.
3. **Row Level Security**: Every table has Row Level Security (RLS) enabled with explicit policies. Public reads only return approved startups.
4. **Input Validation & Query Safety**: Validate every input on the server with `zod`. Never trust client data. Never build SQL by string concatenation.
5. **Quality Gates**: A phase is NOT finished until `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass. If any fails, fix it. Paste the final passing output summary in your report.
6. **Preserve Functionality**: Do not delete working behaviour from the old app until the new equivalent exists and is verified.
7. **Type Safety & Component Sizing**: Keep components small and typed. No `any` unless explicitly commented with a reason.
8. **Accessibility (a11y)**: Semantic HTML, properly labelled form fields, visible focus states, keyboard-operable menus and modals, and sufficient colour contrast in both light and dark themes.
9. **Ambiguity Resolution**: When something is ambiguous, choose the simplest secure option and list the assumption in your report.
10. **Database & Script Safety**: Never run seed, tests or scripts against the production DATABASE_URL. Do not run npm run seed:local unless a local database is configured.
