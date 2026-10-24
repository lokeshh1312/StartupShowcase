# Startup Showcase - Pre-Launch Checklist

This checklist details every remaining manual step required before opening **Startup Showcase** to the public. Follow this checklist step-by-step from top to bottom.

---

## Phase 1: Database & Supabase Production Setup

- [ ] **1.1 Create Supabase Production Project**
  - Choose a region geographically close to your target audience.
  - Set a strong, unique database password (store securely in a password manager).
  - Note down your Project Ref, API URL, Anon Key, Service Role Key, and DB connection string.

- [ ] **1.2 Apply Database Migrations**
  Execute all migrations in order in the Supabase SQL Editor (or via `supabase db push`):
  1. `supabase/migrations/0001_initial_schema.sql`
  2. `supabase/migrations/0002_rls_policies.sql`
  3. `supabase/migrations/0003_cohorts_and_votes.sql`
  4. `supabase/migrations/0004_comments_and_bookmarks.sql`
  5. `supabase/migrations/0005_profiles_and_roles.sql`
  6. `supabase/migrations/0006_storage.sql`
  7. `supabase/migrations/0007_newsletter.sql`
  8. `supabase/migrations/0008_rate_limits_and_audit.sql`

- [ ] **1.3 Verify Row-Level Security (RLS)**
  - Open `supabase/tests/rls_checks.sql` in the Supabase SQL Editor and execute.
  - Confirm that all **43 / 43 tests pass**.

- [ ] **1.4 Configure Storage Bucket**
  - Verify that the `startup-images` bucket exists and is set to **Public**.
  - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
  - Max file size: `3MB`.

- [ ] **1.5 Configure Supabase Auth Settings**
  - **Site URL**: `https://yourdomain.com` (no trailing slash).
  - **Redirect URLs**:
    - `https://yourdomain.com/auth/callback`
    - `https://yourdomain.com/**`
  - In Email Templates, ensure confirmation and password reset links route to `{{ .SiteURL }}/auth/callback?next=...`.

---

## Phase 2: Third-Party Service Credentials

- [ ] **2.1 Resend (Transactional Email & Digests)**
  - Add and verify your custom domain in the [Resend Dashboard](https://resend.com/domains).
  - Add required DNS records: DKIM (`resend._domainkey`), SPF (`bounces.yourdomain.com`), and DMARC (`_dmarc`).
  - Create a production API key (`RESEND_API_KEY`).
  - Set `EMAIL_FROM="Startup Showcase <updates@yourdomain.com>"`.

- [ ] **2.2 Cloudflare Turnstile (Anti-Bot Protection)**
  - Create a new Turnstile widget in the [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile).
  - Mode: **Managed** (or Non-interactive).
  - Whitelist domains: `yourdomain.com`, `www.yourdomain.com`.
  - Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.

- [ ] **2.3 Google OAuth (Optional / Recommended)**
  - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure OAuth consent screen (App name: "Startup Showcase", Support email, Logo).
  - Create OAuth 2.0 Client ID (Web application).
  - Add Authorized Redirect URI:
    `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
  - In Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Google:
    Enable Google, paste Client ID and Secret.
  - Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in your deployment environment.

- [ ] **2.4 Privacy Analytics (Optional)**
  - If using Plausible: Create site `yourdomain.com` in Plausible and set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com`.
  - If using PostHog: Set `NEXT_PUBLIC_POSTHOG_KEY`.

---

## Phase 3: Domain, DNS & Host Deployment

- [ ] **3.1 Point Domain via DNS**
  - Apex domain `yourdomain.com` &rarr; Hostinger VPS IP or Hostinger Node Web App CNAME.
  - Subdomain `www.yourdomain.com` &rarr; CNAME to apex.

- [ ] **3.2 Configure Environment Variables**
  - Populate all 13 required variables documented in `docs/DEPLOY.md`.
  - Double check:
    - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com` (no trailing slash).
    - `TRUSTED_PROXY_COUNT`: Set to `1` behind Nginx/Hostinger proxy.

- [ ] **3.3 Deploy Application**
  - Follow Path A (Hostinger Node Web App) or Path B (Hostinger VPS with Docker/PM2).
  - Run build: `npm run build` or `docker compose build`.
  - Start application: `sh scripts/start-production.sh` or `docker compose up -d`.

- [ ] **3.4 Verify Health Endpoint**
  - Visit `https://yourdomain.com/api/health`.
  - Confirm HTTP 200 response with `{"status":"ok","db":"connected"}`.

- [ ] **3.5 Verify Proxy Security (Spoofing Test)**
  - Run:
    ```bash
    curl -i -H "X-Forwarded-For: 203.0.113.199, 198.51.100.2" https://yourdomain.com/api/health
    ```
  - Verify in server logs that your real IP is detected, not the spoofed IP.

---

## Phase 4: Administrative Setup & Data Sanitation

- [ ] **4.1 Create Admin Account**
  - Navigate to `https://yourdomain.com/signup`.
  - Create the initial administrative account using your primary email address.
  - Confirm your email address via the verification link sent by Resend.
  - In Supabase SQL Editor, grant admin privileges:
    ```sql
    UPDATE profiles
    SET role = 'admin'
    WHERE email = 'your-admin@yourdomain.com';
    ```
  - Sign in and verify access to `https://yourdomain.com/admin`.

- [ ] **4.2 Purge Sample Data**
  - Before real founders submit, remove all seed/sample startups:
    ```sql
    DELETE FROM startups WHERE is_sample = true;
    ```
  - Run the integrity check script locally:
    ```bash
    npm run check:samples
    ```
  - Confirm that 0 sample startups remain in production.

---

## Phase 5: Search Engine Optimization & Indexing

- [ ] **5.1 Verify Robots and Sitemap**
  - Check `https://yourdomain.com/robots.txt` (must allow indexing and link to sitemap).
  - Check `https://yourdomain.com/sitemap.xml` (verify URLs load cleanly without sample startups).

- [ ] **5.2 Submit to Google Search Console**
  - Add property `https://yourdomain.com` in [Google Search Console](https://search.google.com/search-console).
  - Verify ownership via DNS TXT record or HTML meta tag.
  - Submit sitemap URL: `https://yourdomain.com/sitemap.xml`.

- [ ] **5.3 Submit to Bing Webmaster Tools**
  - Import property from Google Search Console or add manually in [Bing Webmaster Tools](https://www.bing.com/webmasters).
  - Submit sitemap.

---

## Phase 6: Security Hardening & CSP Enforcing

- [ ] **6.1 Review CSP Reports**
  - Browse key routes: Home (`/`), Directory (`/browse`), Categories (`/categories`), Submit (`/submit`), Startup Details, Admin Dashboard (`/admin`).
  - Check browser DevTools Console for any CSP report violations.

- [ ] **6.2 Switch CSP from Report-Only to Enforcing**
  - In `next.config.ts`, change header from `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.
  - Commit, rebuild, and redeploy.

---

## Phase 7: Legal & Compliance

- [ ] **7.1 Attorney Review of Legal Pages**
  - Have a qualified attorney review `/privacy`, `/terms`, and `/cookies`.
  - Replace company placeholder names, jurisdiction, and contact email addresses (`privacy@yourdomain.com`, `legal@yourdomain.com`).

---

## Final Launch Sign-Off

| Verification Item | Verified By | Date | Notes |
| :--- | :--- | :--- | :--- |
| Supabase RLS 43/43 Passing | | | |
| Resend SPF/DKIM/DMARC Passing | | | |
| Turnstile Bot Protection Active | | | |
| Google OAuth Functional | | | |
| Admin Account Created & Verified | | | |
| Sample Data Completely Removed | | | |
| Health Check HTTP 200 OK | | | |
| CSP Enforcing Mode Active | | | |
| Google Search Console Verified | | | |
| Legal Pages Reviewed | | | |
