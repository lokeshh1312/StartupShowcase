# Startup Showcase

Startup Showcase is a full-stack directory for discovering early-stage Indian startups. It includes founder accounts, startup submissions with administrator review, shared votes, saved listings, comments, and a moderation queue.

## Run locally

Requirements: Node.js 24.15 or newer (minimum 22.5 for built-in SQLite).

### Option 1: One-Click Launch (Windows)
Double-click `start.bat` or run in terminal:
```cmd
start.bat
```
This automatically verifies dependencies, starts both the backend API and frontend Vite server, and opens your browser to `http://localhost:5173`.

### Option 2: Unified NPM Command
```sh
npm install
npm run dev:all
```

### Option 3: Two-Terminal Setup
1. Start the API server: `npm run dev:api` (runs at `http://localhost:3001`)
2. In a second terminal, start the website: `npm run dev` (runs at `http://localhost:5173`)

The local Vite site runs at `http://localhost:5173`; the API runs at `http://localhost:3001`. Local development seeds example profiles so the interface can be explored. They are disabled in production, where the directory starts empty until approved listings are added.

## Accounts and moderation

Visitors can browse approved listings without an account. An account is required to submit a startup, vote, save a listing, or comment. Submissions remain pending until an administrator reviews them.

To create the first administrator, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in the environment, then run `npm run admin:create`. Use a unique, strong password and keep these values private. Sign in with that account and open **Admin** to review submissions.

## Data and production preparation

The local app stores accounts, sessions, listings, votes, saves, and comments in `data/showcase.sqlite`. Set `DATABASE_PATH` to choose another writable database path. Keep the `data` directory private and persistent; it must not be exposed as public web content.

Before a public launch, configure HTTPS and the production database/storage strategy for the selected Hostinger plan, create the administrator account, and populate only approved real listings. The app can be built with `npm run build` and served with `npm start` after setting `NODE_ENV=production` and the hosting-provided `PORT`. Production does not seed example listings.

Email verification, password recovery, and transactional email are not configured yet because no mail provider credentials have been supplied. Configure these before enabling a public account launch. Do not upload the stale `hostinger-deploy.zip`; it contains the earlier static prototype, not this full-stack product.
