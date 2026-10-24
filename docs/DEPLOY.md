# Startup Showcase - Production Deployment Guide

This guide documents the complete procedure to deploy **Startup Showcase** to production. It covers two hosting paths on Hostinger:
- **Path A**: Hostinger Node.js Web App Hosting (Managed cPanel/Cloud Web App)
- **Path B**: Hostinger VPS (Self-managed Ubuntu Server with Docker or PM2 + Nginx/Caddy)

No Vercel-specific code, configuration, or dependencies are used. The application outputs a portable Node.js standalone bundle (`output: "standalone"` in `next.config.ts`).

---

## Table of Contents

1. [Required Production Environment Variables](#1-required-production-environment-variables)
2. [CRITICAL SECURITY WARNING: TRUSTED_PROXY_COUNT](#2-critical-security-warning-trusted_proxy_count)
3. [Path A: Hostinger Node.js Web App Hosting](#3-path-a-hostinger-nodejs-web-app-hosting)
4. [Path B: Hostinger VPS Deployment](#4-path-b-hostinger-vps-deployment)
   - [Method B1: Docker & Docker Compose (Recommended for VPS)](#method-b1-docker--docker-compose-recommended-for-vps)
   - [Method B2: PM2 & Native Node.js](#method-b2-pm2--native-nodejs)
   - [Reverse Proxy Setup: Nginx + Let's Encrypt SSL](#reverse-proxy-setup-nginx--lets-encrypt-ssl)
   - [Alternative Reverse Proxy: Caddy (Automatic HTTPS)](#alternative-reverse-proxy-caddy-automatic-https)
5. [Domain & DNS Configuration](#5-domain--dns-configuration)
6. [Supabase Authentication Configuration](#6-supabase-authentication-configuration)
7. [Content-Security-Policy (CSP): Transitioning to Enforcing](#7-content-security-policy-csp-transitioning-to-enforcing)
8. [Database Backups & Disaster Recovery](#8-database-backups--disaster-recovery)
9. [Post-Deployment Verification](#9-post-deployment-verification)

---

## 1. Required Production Environment Variables

All variables below must be configured in your hosting environment. At production boot, `src/instrumentation.ts` and `scripts/start-production.sh` execute pre-flight audits and will refuse to start if any required variable is missing.

> [!IMPORTANT]
> **Security Rule: Build Args vs Runtime Secrets**:
> - **Build Args (Public only)**: Only `NEXT_PUBLIC_*` variables may be passed as Docker build arguments (`--build-arg`). Next.js bakes these directly into the client-side JavaScript bundles.
> - **Runtime Secrets (Server only)**: All secrets (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `VIEW_HASH_SECRET`, `NEWSLETTER_SECRET`) **MUST NEVER** be passed as Docker build arguments or committed to git. They must be supplied strictly at runtime via container `env_file`, VPS environment variables, or your hosting control panel.

| Variable Name | Required? | Build vs Runtime | Description & Example |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | **Both** | Canonical public site URL (NO trailing slash). Example: `https://startupshowcase.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | **Yes** | **Both** | Public contact and support email address shown on `/privacy`, `/terms`, and `/cookies`. Example: `contact@startupshowcase.com` |
| `NEXT_PUBLIC_COMPANY_NAME` | Optional | **Both** | Operating entity name (defaults to `Startup Showcase`). |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | **Both** | Supabase Project API URL. Example: `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | **Both** | Supabase anonymous public key. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Runtime | Supabase service-role key. **Server-only secret.** Never expose to client. |
| `DATABASE_URL` | **Yes** | Runtime | Supabase Postgres connection string. Use the **Transaction Pooler** (port `6543`) with `?pgbouncer=true`. Example: `postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres` |
| `TRUSTED_PROXY_COUNT` | **Yes** | Runtime | Exact integer count of reverse proxies in front of Node.js. (See warning below). |
| `VIEW_HASH_SECRET` | **Yes** | Runtime | Minimum 32-character random secret salt for deduplicating startup view counts. |
| `NEWSLETTER_SECRET` | **Yes** | Runtime | Minimum 32-character random secret salt for HMAC newsletter unsubscribe tokens. |
| `RESEND_API_KEY` | **Yes** | Runtime | Resend API key for transactional emails and digests. Example: `re_123456789` |
| `EMAIL_FROM` | **Yes** | Runtime | Sender address verified in Resend. Example: `Startup Showcase <updates@startupshowcase.com>` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **Yes** | **Both** | Cloudflare Turnstile site key (public widget key). |
| `TURNSTILE_SECRET_KEY` | **Yes** | Runtime | Cloudflare Turnstile secret key (for server-side token validation). |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | **Yes** | **Both** | `'true'` if Google OAuth button is enabled; `'false'` otherwise. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Optional | **Both** | Custom Plausible domain (e.g. `startupshowcase.com`). Disabled if unset. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | **Both** | PostHog public key. Disabled if unset. |
| `PORT` | Optional | Runtime | Port to listen on (defaults to `3000`). |
| `HOSTNAME` | Optional | Runtime | Host interface to bind to (defaults to `0.0.0.0`). |

---

## 2. CRITICAL SECURITY WARNING: TRUSTED_PROXY_COUNT

> [!CAUTION]
> **DO NOT GUESS OR LEAVE `TRUSTED_PROXY_COUNT` INCORRECT.**
> Setting `TRUSTED_PROXY_COUNT` to the wrong number creates a critical security vulnerability:
> - **Too High:** Attackers can inject a forged `X-Forwarded-For` HTTP header, spoof their IP address, and completely bypass rate limiting (brute-forcing passwords, voting repeatedly, or spamming submissions).
> - **Too Low:** All users will appear to share the reverse proxy's internal IP address (e.g., `127.0.0.1` or the Hostinger edge gateway), causing legitimate visitors to be blocked by shared rate limits.

### How to Determine the Exact Value:

1. **Hostinger Node.js Web App Hosting**:
   - Start with `1` and **VERIFY** using the Section 2 test below; it is unconfirmed for Hostinger as reverse proxy counts can vary across shared/cloud web app infrastructures.
   - If you also place Cloudflare in front of Hostinger: start with `2` and verify using the Section 2 test below.

2. **Hostinger VPS with Nginx or Caddy**:
   - Nginx running on the VPS forwarding directly to Node.js on `127.0.0.1:3000`: **`TRUSTED_PROXY_COUNT=1`**.
   - Cloudflare proxying to Nginx on the VPS: Cloudflare (1) + Nginx (1) = **`TRUSTED_PROXY_COUNT=2`**.
   - Node.js exposed directly to the internet (no reverse proxy, not recommended): **`TRUSTED_PROXY_COUNT=0`**.

### How to Verify After Deployment:

Run this curl command against your live deployment from your local terminal:

```bash
# Replace with your actual domain and a fake IP
curl -i -H "X-Forwarded-For: 203.0.113.199, 198.51.100.2" https://yourdomain.com/api/health
```

Now check the server logs (e.g. `docker compose logs` or `pm2 logs`). Inspect the incoming request IP or submit an invalid action to trigger rate-limiting:
- If the application logs identify your **actual public IP** (e.g. your home/office ISP IP) and **ignore** the injected fake IP (`203.0.113.199`), your proxy count is **correct**.
- If the logs record `203.0.113.199`, your `TRUSTED_PROXY_COUNT` is set too high and must be decreased immediately.

---

## 3. Path A: Hostinger Node.js Web App Hosting

Hostinger provides managed Node.js web app hosting on select Cloud and Business plans.

### Confirm with Hostinger Support that your Plan can run a Next.js Server App
Before deploying on Hostinger Web App Hosting, contact Hostinger Support or check your plan specifications to confirm:
- Your plan supports a **persistent, long-running Node.js process** (Node 22+ LTS).
- Your plan allows custom port binding and internal reverse proxying to a standalone Node.js server.
- Memory allocation is at least **1GB RAM** (Next.js server-side rendering requires sufficient memory under concurrent traffic).
- If your plan only supports static web files or serverless functions with execution timeouts, use **Path B (Hostinger VPS)** instead, which gives you complete control over your server environment.

### Step 1: Prepare the Node.js Application in hPanel
1. Log in to **Hostinger hPanel**.
2. Navigate to **Websites** &rarr; Select your domain &rarr; **Node.js**.
3. Click **Create Application**:
   - **Node.js version**: Select **`22.x`** (LTS).
   - **Application mode**: `Production`.
   - **Application root**: `public_html` (or subfolder `app`).
   - **Application startup file**: `scripts/start-production.sh` (or `node_modules/.bin/next` with argument `start`).
4. In the **Environment Variables** section of hPanel, enter all required production variables from [Section 1](#1-required-production-environment-variables). Make sure `TRUSTED_PROXY_COUNT=1` is set.

### Step 2: Deploy Source Code
Choose one of two methods:
- **Git Deployment (Recommended)**: In hPanel &rarr; **Git**, connect your repository (`next-migration` or `main` branch).
- **File Manager / SSH**:
  Clone the repository or upload a clean zip (excluding `node_modules` and `.next`).

### Step 3: Build & Start
Access SSH on Hostinger (or use the hPanel Terminal):

```bash
cd ~/public_html

# 1. Install clean production & dev dependencies needed for build
npm ci

# 2. Build Next.js standalone bundle (inlines NEXT_PUBLIC_* variables)
npm run build

# 3. Copy static assets to standalone directory (if not using start-production.sh)
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static

# 4. Start the application
sh scripts/start-production.sh
```

In hPanel, set the **Application startup file** to `.next/standalone/server.js` or run via `scripts/start-production.sh`. Click **Restart Application**.

---

## 4. Path B: Hostinger VPS Deployment

Hostinger VPS provides an unmanaged Ubuntu 22.04 or 24.04 server with full root access, dedicated IP, and complete control over reverse proxies.

### Initial Server Preparation (One-time)
SSH into your VPS as `root`:

```bash
# Update packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git ufw

# Configure UFW Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Create dedicated deploy user (avoid running as root)
adduser deploy
usermod -aG sudo deploy
```

---

### Method B1: Docker & Docker Compose (Recommended for VPS)

Docker isolates the Next.js runtime inside a hardened, unprivileged container.

#### 1. Install Docker & Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker deploy
```

#### 2. Clone the Repository & Configure `.env`
Log in as the `deploy` user:

```bash
su - deploy
git clone https://github.com/your-username/StartupShowcase.git app
cd app
git checkout next-migration

# Create production .env file
cp .env.example .env
nano .env
```
Fill in all production secrets. Ensure:
- `TRUSTED_PROXY_COUNT=1` (when using Nginx on the same VPS).
- `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

#### 3. Build & Launch Containers
```bash
# Build Docker image passing NEXT_PUBLIC_* build args automatically
docker compose build

# Start the application detached
docker compose up -d

# Verify container health
docker compose ps
curl http://127.0.0.1:3000/api/health
```

The container automatically restarts on system reboot (`restart: unless-stopped`).

---

### Method B2: PM2 & Native Node.js

If you prefer running directly on the host without Docker:

```bash
# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager globally
sudo npm install -g pm2

# In your app directory:
cd /home/deploy/app
npm ci
npm run build

# Start with PM2
pm2 start scripts/start-production.sh --name "startup-showcase"
pm2 save

# Enable automatic start on server reboot
pm2 startup systemd -u deploy --hp /home/deploy
```

---

### Reverse Proxy Setup: Nginx + Let's Encrypt SSL

Install and configure Nginx to terminate TLS, compress responses with Gzip, and cache static assets.

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Copy provided Nginx configuration
sudo cp deploy/nginx/startup-showcase.conf /etc/nginx/sites-available/startup-showcase.conf

# Edit domain name
sudo nano /etc/nginx/sites-available/startup-showcase.conf
# Replace 'yourdomain.com' with your actual domain

# Enable site and disable default
sudo ln -s /etc/nginx/sites-available/startup-showcase.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test syntax and reload
sudo nginx -t
sudo systemctl reload nginx

# Obtain free Let's Encrypt SSL Certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically schedules auto-renewal via systemd timer.

---

### Alternative Reverse Proxy: Caddy (Automatic HTTPS)

Caddy automatically obtains and renews Let's Encrypt certificates without certbot:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Copy Caddyfile
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile   # Replace yourdomain.com
sudo systemctl restart caddy
```

---

## 5. Domain & DNS Configuration

In your Hostinger DNS Zone Editor (or domain registrar):

| Type | Host | Points to | TTL | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `YOUR_VPS_PUBLIC_IP` | 300 | Apex domain (`startupshowcase.com`) |
| **CNAME** | `www` | `@` (or `startupshowcase.com`) | 300 | Subdomain alias |

If deploying on **Hostinger Node.js Web App Hosting**, use the CNAME or A record provided in your hPanel dashboard under **DNS / Nameservers**.

---

## 6. Supabase Authentication Configuration

To allow users to sign in, reset passwords, and authenticate with Google OAuth:

1. Open your **Supabase Dashboard** &rarr; Select your Production Project.
2. Go to **Authentication** &rarr; **URL Configuration**:
   - **Site URL**: `https://yourdomain.com` (NO trailing slash).
   - **Redirect URLs**: Add the following:
     - `https://yourdomain.com/auth/callback`
     - `https://yourdomain.com/**`
     - `https://www.yourdomain.com/auth/callback`
3. Under **Authentication** &rarr; **Email Templates**:
   - Ensure confirmation and password reset links point to `{{ .SiteURL }}/auth/callback?next=...`
4. Under **Authentication** &rarr; **Providers** &rarr; **Google**:
   - Enable Google.
   - Enter your **Google Client ID** and **Google Client Secret**.
   - Copy the Supabase Callback URL into Google Cloud Console &rarr; Credentials &rarr; Authorized redirect URIs:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`

---

## 7. Content-Security-Policy (CSP): Transitioning to Enforcing

In `next.config.ts`, the Content Security Policy is currently configured as **`Content-Security-Policy-Report-Only`**. This allows you to monitor production traffic in the browser console or telemetry for violations without breaking any legitimate functionality.

### What Must Be Allowed in CSP:

| Directive | Allowed Origins | Reason |
| :--- | :--- | :--- |
| `default-src` | `'self'` | Base policy |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://plausible.io` | Next.js runtime, Cloudflare Turnstile CAPTCHA, Plausible analytics |
| `frame-src` | `'self' https://challenges.cloudflare.com` | Cloudflare Turnstile invisible iframe |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Tailwind styles & Google Fonts stylesheets |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts webfont files |
| `img-src` | `'self' data: blob: https:` | Supabase Storage logos, product screenshots, user avatars |
| `connect-src` | `'self' https:` | Supabase REST/Auth API, Cloudflare Turnstile token validation, telemetry |

> **Note on Analytics Hosts**: If privacy analytics are enabled, the CSP must explicitly allow the analytics provider's host:
> - **Plausible**: Ensure `https://plausible.io` (or your custom `NEXT_PUBLIC_PLAUSIBLE_API_HOST`) is present in `script-src` and `connect-src`.
> - **PostHog**: If using PostHog, add `https://app.posthog.com` and `https://us.i.posthog.com` (or `https://eu.i.posthog.com`) to `script-src` and `connect-src`.
>
> **Note on Resend**: Resend is invoked strictly from **server-side actions** (`server-only`). The browser client never connects directly to Resend, so no CSP connect directive for Resend is needed.

### Steps to Switch to Enforcing Mode:
1. Deploy with `Content-Security-Policy-Report-Only`.
2. Browse all pages (`/`, `/browse`, `/submit`, `/login`, `/signup`, `/admin`) and verify in DevTools Console that no `[Report Only]` CSP errors appear.
3. In `next.config.ts`, rename the header key from:
   ```ts
   key: "Content-Security-Policy-Report-Only"
   ```
   to:
   ```ts
   key: "Content-Security-Policy"
   ```
4. Rebuild and restart the application (`npm run build && sh scripts/start-production.sh`).

---

## 8. Database Backups & Disaster Recovery

### Supabase Automated Backups
- **Pro / Team Projects**: Supabase automatically takes daily physical database backups with 7-day retention and offers Point-in-Time Recovery (PITR) up to the second.
- **Free Projects**: Automated backups are retained for fewer days and inactive projects pause. For production, a Pro project is strongly recommended.

### Monthly / Scheduled Manual `pg_dump`
Take a full logical backup of schema and data using PostgreSQL `pg_dump` (via direct connection port `5432` or transaction pooler):

```bash
# Run on your local machine or VPS with postgresql-client installed:
pg_dump "postgres://postgres.[YOUR_PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  -F c -b -v \
  -f "startup_showcase_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### To Verify or Restore from a Dump:
```bash
# Restore into a staging or target database:
pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "postgres://postgres.[TARGET_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" \
  startup_showcase_backup_YYYYMMDD_HHMMSS.dump
```

### Storage Bucket Backups
Back up uploaded startup logos and screenshots stored in the `startup-images` Supabase Storage bucket:
```bash
# Using Supabase CLI:
supabase storage download startup-images ./backup-storage-images/
```

---

## 9. Post-Deployment Verification

Verify each item immediately following launch:

1. **Health Check Endpoint**:
   ```bash
   curl -i https://yourdomain.com/api/health
   ```
   Must return HTTP 200 with `{"status":"ok","db":"connected"}`.

2. **Security Headers Check**:
   ```bash
   curl -I https://yourdomain.com/
   ```
   Verify headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

3. **Sitemap and Robots**:
   - `https://yourdomain.com/sitemap.xml`
   - `https://yourdomain.com/robots.txt`

4. **Legal Pages**:
   - `https://yourdomain.com/privacy`
   - `https://yourdomain.com/terms`
   - `https://yourdomain.com/cookies`

5. **Authentication Flow Smoke Test**:
   - Register a new test user & verify confirmation email via Resend.
   - Test login, password reset, and Google OAuth.
   - Submit a test startup and verify approval in `/admin`.
