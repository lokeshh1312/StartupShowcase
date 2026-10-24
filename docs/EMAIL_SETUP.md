# Transactional Email & Custom SMTP Setup Guide

This guide details how to configure transactional emails via Resend and configure Supabase Authentication to send auth emails (email confirmation, password reset) using Resend custom SMTP on a domain managed via Hostinger.

---

## 1. Resend Domain Verification (Hostinger DNS Setup)

To send emails with high deliverability and avoid spam folders, your domain must be verified in Resend using SPF, DKIM, and DMARC records.

### Step 1: Add Domain in Resend
1. Log in to [Resend Dashboard](https://resend.com).
2. Go to **Domains** &rarr; click **Add Domain**.
3. Enter your domain (e.g. `yourdomain.com`) and choose your primary sending region.
4. Resend displays 3 DNS records:
   - **DKIM**: TXT record (selector `resend._domainkey.yourdomain.com`)
   - **SPF**: MX/TXT record (`send.yourdomain.com` or root domain)
   - **DMARC**: TXT record (`_dmarc.yourdomain.com`)

### Step 2: Configure Hostinger DNS Records
1. Open your **Hostinger hPanel** &rarr; navigate to **Domains** &rarr; select your domain &rarr; **DNS / Nameservers**.
2. Add the following records exactly as provided by Resend:

| Record Type | Name / Host | Content / Value | TTL |
| :--- | :--- | :--- | :--- |
| **TXT** | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ...` (Value from Resend) | 3600 |
| **MX** | `send` (or subdomain) | `feedback-smtp.us-east-1.amazonses.com` (Priority: 10) | 3600 |
| **TXT** | `send` (or subdomain) | `v=spf1 include:amazonses.com ~all` | 3600 |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` | 3600 |

3. Wait 5–15 minutes for DNS propagation, then click **Verify DNS Records** in the Resend Dashboard. Status will update to **Verified**.

---

## 2. Supabase Custom SMTP Configuration

Supabase Auth uses its default built-in rate-limited email service until custom SMTP is configured. To send branded verification and password reset emails with high reliability:

1. Open your **Supabase Dashboard** &rarr; select your project.
2. Go to **Project Settings** &rarr; **Authentication** &rarr; scroll down to **SMTP Settings**.
3. Toggle **Enable Custom SMTP** to **ON**.
4. Fill in the following settings:

| Setting | Value |
| :--- | :--- |
| **Sender Email** | `notifications@yourdomain.com` (or `auth@yourdomain.com`) |
| **Sender Name** | `Startup Showcase` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` (SSL) |
| **Minimum Encryption** | `SSL / TLS` (or `STARTTLS` if using port 587) |
| **Username** | `resend` |
| **Password** | Your Resend API Key (`re_123456789...`) |

5. Click **Save Changes**.

---

## 3. Customised Email Template Wording

Configure custom templates in **Supabase Dashboard** &rarr; **Authentication** &rarr; **Email Templates**.

### A. Confirm Your Signup (Verification Email)
**Subject**: `Confirm your Startup Showcase account`
```html
<h2>Welcome to Startup Showcase!</h2>
<p>Thank you for joining our global startup discovery community.</p>
<p>Please confirm your email address to activate your voting, submitting, and community privileges:</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
    Confirm Email Address
  </a>
</p>
<p style="color:#64748b;font-size:12px;">If you didn't create an account, you can safely ignore this email.</p>
```

### B. Reset Password
**Subject**: `Reset your Startup Showcase password`
```html
<h2>Password Reset Request</h2>
<p>We received a request to reset your password for Startup Showcase.</p>
<p>Click the button below to choose a new password (must be at least 10 characters):</p>
<p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px;">
    Reset Password
  </a>
</p>
<p style="color:#64748b;font-size:12px;">This link will expire in 24 hours. If you did not request a password reset, no action is needed.</p>
```

---

## 4. Test Checklist

- [ ] **DNS Records Verified**: Resend dashboard reports status `Verified` for SPF, DKIM, and DMARC.
- [ ] **Supabase SMTP Saved**: Custom SMTP enabled in Supabase with host `smtp.resend.com`, port `465`, user `resend`, and Resend API key.
- [ ] **Verification Email Delivery**: Create a new test user account at `/signup`. Check inbox for verification link, ensure sender name is `Startup Showcase` from your domain.
- [ ] **Password Reset Delivery**: Request reset at `/forgot-password`. Ensure reset email arrives with correct formatting.
- [ ] **Submission Received Email**: Submit a startup at `/submit` and confirm founder receives confirmation.
- [ ] **Approval / Rejection Email**: As admin, approve or reject the startup in `/admin` and confirm founder receives notification with any feedback reason.
- [ ] **Newsletter Double Opt-in**: Subscribe at `/newsletter`, click the confirmation link in the email, verify subscriber status is updated to confirmed.
- [ ] **Spam Score Check**: Send test email to [mail-tester.com](https://www.mail-tester.com) to verify a 10/10 deliverability score.
