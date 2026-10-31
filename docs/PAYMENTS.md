# Startup Showcase - Payments & Submissions Architecture

Startup Showcase enforces a mandatory, one-time payment of **$10.00 USD** before any submitted startup enters the administrative review queue.

---

## 1. Submission & Payment Flow

```
  Founder                     Browser / Client                   Server (Next.js)                 Razorpay API / Webhook              Supabase DB
     │                               │                                  │                                   │                              │
     │ 1. Fill submit form           │                                  │                                   │                              │
     ├──────────────────────────────>│                                  │                                   │                              │
     │                               │ 2. Submit action                 │                                   │                              │
     │                               ├─────────────────────────────────>│                                   │                              │
     │                               │                                  │ 3. Create startup                 │                              │
     │                               │                                  │    (status = 'awaiting_payment')  │                              │
     │                               │                                  ├─────────────────────────────────────────────────────────────────>│
     │                               │                                  │ 4. Create Order ($10.00 USD)      │                              │
     │                               │                                  ├──────────────────────────────────>│                              │
     │                               │                                  │    (order_id: order_xxx)          │                              │
     │                               │                                  │<──────────────────────────────────┤                              │
     │                               │                                  │ 5. Insert payment record          │                              │
     │                               │                                  │    (status = 'created')           │                              │
     │                               │                                  ├─────────────────────────────────────────────────────────────────>│
     │                               │ 6. Return order details          │                                   │                              │
     │                               │<─────────────────────────────────┤                                   │                              │
     │                               │                                  │                                   │                              │
     │ 7. Opens Razorpay Modal       │                                  │                                   │                              │
     │<──────────────────────────────┤                                  │                                   │                              │
     │ 8. Enters Card / Pays         │                                  │                                   │                              │
     ├──────────────────────────────>│                                  │                                   │                              │
     │                               │ 9. Returns payment ID & sig      │                                   │                              │
     │                               │<─────────────────────────────────────────────────────────────────────┤                              │
     │                               │ 10. Confirm payment action       │                                   │                              │
     │                               ├─────────────────────────────────>│                                   │                              │
     │                               │                                  │ 11. Verify HMAC-SHA256 signature  │                              │
     │                               │                                  │     Update payment -> 'paid'      │                              │
     │                               │                                  │     Update startup -> 'pending'   │                              │
     │                               │                                  ├─────────────────────────────────────────────────────────────────>│
     │                               │                                  │ 12. Send submission confirmation  │                              │
     │                               │ 13. Redirect to success view     │                                   │                              │
     │                               │<─────────────────────────────────┤                                   │                              │
     │                               │                                  │                                   │                              │
     │                               │                                  │ 14. Async webhook (safety net)    │                              │
     │                               │                                  │     POST /api/webhooks/razorpay   │                              │
     │                               │                                  │<──────────────────────────────────┤                              │
     │                               │                                  │     Verify signature & idempotency│                              │
     │                               │                                  │     Ensure payment 'paid'         │                              │
     │                               │                                  │     Ensure startup 'pending'      │                              │
     │                               │                                  ├─────────────────────────────────────────────────────────────────>│
```

---

## 2. Server-Side and Database Invariants

1. **Pricing Invariance**:
   - The fee is **fixed at $10.00 USD** (1000 cents) defined by `SUBMISSION_PRICE_USD_CENTS=1000`.
   - The client **never** specifies the price or currency.
2. **Database Triggers (`enforce_startup_payment_transition`)**:
   - Any database transition from `awaiting_payment` to `pending` or `approved` requires an existing `paid` record in `public.payments`.
   - Direct database attacks attempting to bypass payment fail with Postgres error `23514` (`check_violation`).
3. **RLS Security**:
   - `public.payments` grants `SELECT` only to the startup owner or admin.
   - `INSERT`, `UPDATE`, and `DELETE` on `public.payments` are completely revoked for `anon` and `authenticated` roles.
4. **Order Reuse & Rate Limiting**:
   - If a founder closes the checkout window and clicks "Resume Payment" later, existing unpaid orders are reused if still valid.
   - Maximum of 3 concurrent unpaid submissions per founder.
   - Maximum of 10 order creation requests per user per hour.

---

## 3. Testing with Razorpay Test Mode

When running in development or staging:
1. Ensure your `.env.local` contains test keys prefixed with `rzp_test_`:
   ```bash
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="..."
   RAZORPAY_WEBHOOK_SECRET="..."
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
   SUBMISSION_PRICE_USD_CENTS=1000
   ```
2. When submitting a startup, the checkout popup will appear in Test Mode.
3. Use Razorpay's test card credentials:
   - **Card Number**: Use standard Razorpay test card numbers (e.g. `4111 1111 1111 1111` or any valid test card supported by Razorpay for international USD payments).
   - **Expiry Date**: Any future date (e.g., `12/30`).
   - **CVV**: Any 3 digits (e.g., `123`).
   - **OTP**: Razorpay displays a mock authentication page; click **Success** or **Failure** to test outcomes.

---

## 4. Webhook Configuration in Razorpay Dashboard

Webhooks act as an essential safety net for cases where a user closes their browser immediately after payment completes before the client-side confirmation handler executes.

### Setup Instructions:
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** -> **Webhooks**.
3. Click **+ Add New Webhook**.
4. Enter the **Webhook URL**:
   ```
   https://<your-domain.com>/api/webhooks/razorpay
   ```
5. Enter a secret token and set the same value in your production environment as `RAZORPAY_WEBHOOK_SECRET`.
6. Select the following **Active Events**:
   - `payment.captured` (marks startup as paid and moves it to `pending` review)
   - `payment.failed` (records payment failure and logs details)
   - `refund.processed` (records refund and transitions startup to `rejected`)
7. Click **Create Webhook**.

---

## 5. Refunds & Cancellations

- **Refund Policy**: Startup Showcase maintains a 14-day refund window for submissions that have not yet been approved or reviewed, as documented in `/refunds`.
- **Initiating Refunds**:
  - Refunds are initiated directly from the Razorpay Dashboard under **Transactions** -> **Payments** -> Select Payment -> **Issue Refund**.
- **Automated Webhook Processing**:
  - When a refund is processed, Razorpay sends the `refund.processed` webhook.
  - The webhook handler updates `public.payments` (`status = 'refunded'`) and updates the startup's status to `'rejected'` with rejection reason: `"Payment refunded"`.
  - An audit log entry is written: `event = 'payment.refunded'`.

---

## 6. Production Go-Live Checklist

- [ ] Obtain live API keys from Razorpay Dashboard (**Settings** -> **API Keys**).
- [ ] Confirm key prefix: Live keys **must** begin with `rzp_live_`.
- [ ] Remove `ALLOW_RAZORPAY_TEST_IN_PRODUCTION` from production environment variables (the server refuses to start if test keys are used in production without this explicit flag).
- [ ] Set `SUBMISSION_PRICE_USD_CENTS=1000` in production environment.
- [ ] Configure the live webhook URL and copy the secret to `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Verify that international USD card payments are enabled on your Razorpay Merchant Account.
- [ ] Ensure database migration `supabase/migrations/0009_payments.sql` is applied to your production Supabase database.

---

## 7. Cleanup of Abandoned Unpaid Submissions

A cron maintenance script is provided in `scripts/cleanup-unpaid.ts`. It permanently purges submissions in `awaiting_payment` status that are older than 7 days, along with any associated uploaded storage assets (logos, screenshots) and payment draft records.

### Dry Run (Preview deletions):
```bash
npx tsx scripts/cleanup-unpaid.ts --dry-run
```

### Live Run (Execute deletions):
```bash
npx tsx scripts/cleanup-unpaid.ts
```

Recommended cron schedule: Run daily via server cron or GitHub Actions.

---

## 8. Database Migrations

- `0009_payments.sql`: Creates `public.payments` table, adds `awaiting_payment` startup status, and enforces transition triggers and RLS policies.
- `0010_payments_hardening.sql`: Adds `public.payment_events` table for webhook deduplication, hardens `user_id` FK to `RESTRICT`, and restricts payment record deletions.
- `0011_payments_refund_columns.sql`: Adds `amount_refunded_cents` column, expands status check to include `partially_refunded`, and adds refunded range check constraint.
- `0012_leaderboard_view_security.sql`: Sets `security_invoker = true` on `public.monthly_leaderboard_view` and revokes `SELECT` on the view and `EXECUTE` on `public.monthly_leaderboard(date)` from `anon` and `authenticated` (app queries via direct Postgres connection).
