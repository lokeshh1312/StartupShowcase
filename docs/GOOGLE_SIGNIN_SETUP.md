# Google OAuth Sign-In Setup Guide

This guide walks through setting up Google Cloud OAuth credentials, enabling Google Authentication in Supabase, and configuring local and production redirect URLs.

---

## 1. Google Cloud Console Setup

### Step 1: Create or Select a GCP Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Select your existing project or create a new project named **Startup Showcase**.

### Step 2: Configure the OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services** &rarr; **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the App Information:
   - **App name**: `Startup Showcase`
   - **User support email**: Your support or admin email
   - **App logo**: (Optional) Upload your showcase logo
   - **Authorized domains**: Add your production domain (e.g. `startupshowcase.com`) and `supabase.co`
   - **Developer contact information**: Your technical contact email
4. Scopes: Keep the default standard scopes (`.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`).
5. Test users: While in "Testing" publishing status, add any developer emails testing the login. When ready for public use, click **Publish App** to switch to "In production".

### Step 3: Create OAuth 2.0 Client Credentials
1. Go to **APIs & Services** &rarr; **Credentials** &rarr; **Create Credentials** &rarr; **OAuth client ID**.
2. Application type: Select **Web application**.
3. Name: `Startup Showcase Web Client`.
4. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://yourdomain.com` (for production)
5. **Authorized redirect URIs**:
   Add your **Supabase Auth callback URL**:
   - `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback`
   *(Find this in your Supabase Dashboard under Authentication &rarr; Providers &rarr; Google)*
6. Click **Create**. Copy the **Client ID** and **Client Secret**.

---

## 2. Supabase Provider Configuration

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **Authentication** &rarr; **Providers** &rarr; click **Google**.
3. Toggle **Enable Google provider** to **ON**.
4. Paste the credentials from Google Cloud Console:
   - **Client ID**: `<Your Google Client ID>`
   - **Client Secret**: `<Your Google Client Secret>`
5. Click **Save**.

---

## 3. Site URL & Redirect URLs in Supabase

1. In Supabase Dashboard, go to **Authentication** &rarr; **URL Configuration**.
2. **Site URL**:
   - For local development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
3. **Redirect URLs**:
   Add the following patterns to allow secure redirects:
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/**`
   - `https://yourdomain.com/auth/callback`

---

## 4. Application Environment Configuration

In your environment configuration (`.env.local` or hosting provider settings):

```bash
# Enable the Google Sign-In button on /login and /signup
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true

# Must match your public site origin (canonical HTTPS in production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000 # or https://yourdomain.com
```

When `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` or unset, the "Continue with Google" button is automatically hidden.

---

## 5. Security & Role Promotion Rules

- Google OAuth accounts default to the **community** role via the PostgreSQL `handle_new_user()` trigger.
- Users can choose to be a **founder** or **investor** during initial onboarding.
- Row Level Security (RLS) and the `protect_profile_columns()` trigger strictly prohibit any user from self-promoting to the `admin` role.
