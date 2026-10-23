import "server-only";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { absoluteUrl } from "@/lib/urls";

/**
 * Escapes user-supplied content for safe interpolation into HTML emails.
 * Neutralizes XSS attempts like <script>, <img> tags, quotes, and ampersands.
 */
export function escapeHtml(unsafe: string): string {
  return String(unsafe ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates transactional email environment variables.
 * Fails loudly at startup in production if required variables are missing.
 */
export function validateEmailEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  if (isProd && !isBuild) {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_API_KEY.trim()) {
      throw new Error("Missing required production environment variable: RESEND_API_KEY");
    }
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_FROM.trim()) {
      throw new Error("Missing required production environment variable: EMAIL_FROM");
    }
  }
}

// Check at module load
validateEmailEnv();

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  template: string;
}

/**
 * Core email sender using the Resend HTTP API.
 * In development, if RESEND_API_KEY is not set, logs to console instead.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  template,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Startup Showcase <notifications@startupshowcase.com>";

  if (!apiKey) {
    // Development mode fallback
    console.log("[DEV EMAIL LOG] ========================================");
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Template: ${template}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: \n${text}`);
    console.log("========================================================");
    return { success: true, id: "dev-simulated-id" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Resend API returned status ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as { id?: string };
    return { success: true, id: data.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Email Error] Failed sending '${template}' to ${to}:`, errorMsg);

    // Audit log the email failure without blocking the caller
    try {
      await db.insert(auditLog).values({
        action: `email.failure:${template}`,
        targetType: "email",
        targetId: to,
        metadata: {
          error: errorMsg,
          subject,
          template,
        },
      });
    } catch (auditErr) {
      console.error("[Email Audit Log Error]:", auditErr);
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Safe email dispatcher.
 * Guaranteed never to throw or roll back calling operations.
 */
export function fireAndForgetEmail(
  sendPromise: Promise<{ success: boolean; id?: string; error?: string }>
): void {
  sendPromise.catch((err) => {
    console.error("[Unhandled Email Send Error]:", err);
  });
}

// -----------------------------------------------------------------------------
// Transactional Email Templates
// -----------------------------------------------------------------------------

/**
 * 1. Submission Received (to founder)
 */
export async function sendSubmissionReceivedEmail(params: {
  to: string;
  founderName: string;
  startupName: string;
}) {
  const safeFounder = escapeHtml(params.founderName || "Founder");
  const safeStartup = escapeHtml(params.startupName);
  const mySubmissionsUrl = absoluteUrl("/me/submissions");

  const subject = `Submission received: ${params.startupName} is in review`;

  const text = `Hi ${params.founderName || "Founder"},\n\n` +
    `Thank you for submitting ${params.startupName} to Startup Showcase!\n\n` +
    `Our editorial team reviews each submission to ensure it meets our quality guidelines. ` +
    `We will notify you by email as soon as your startup is approved or if any revisions are needed.\n\n` +
    `Track your submission status here: ${mySubmissionsUrl}\n\n` +
    `Best regards,\nThe Startup Showcase Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Submission Received</div>
    <div class="content">
      <p>Hi ${safeFounder},</p>
      <p>Thank you for submitting <strong>${safeStartup}</strong> to Startup Showcase!</p>
      <p>Our curation team is reviewing your project details. We will notify you once it has been approved for the global showcase leaderboard.</p>
    </div>
    <div>
      <a href="${mySubmissionsUrl}" class="btn">View Submission Status</a>
    </div>
    <div class="footer">
      Startup Showcase &bull; Global Startup Discovery Platform
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    template: "submission_received",
  });
}

/**
 * 2. Submission Approved (to founder)
 */
export async function sendSubmissionApprovedEmail(params: {
  to: string;
  founderName: string;
  startupName: string;
  startupSlug: string;
}) {
  const safeFounder = escapeHtml(params.founderName || "Founder");
  const safeStartup = escapeHtml(params.startupName);
  const startupUrl = absoluteUrl(`/startup/${params.startupSlug}`);

  const subject = `Congratulations! ${params.startupName} is approved and live`;

  const text = `Hi ${params.founderName || "Founder"},\n\n` +
    `Great news! Your startup "${params.startupName}" has been approved and is now live on Startup Showcase.\n\n` +
    `View your public profile and start collecting community votes: ${startupUrl}\n\n` +
    `Share it with your team, customers, and investors to climb this month's leaderboard!\n\n` +
    `Best regards,\nThe Startup Showcase Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Approved &bull; Live</span>
    <div class="title">${safeStartup} is Live!</div>
    <div class="content">
      <p>Hi ${safeFounder},</p>
      <p>Congratulations! Your startup <strong>${safeStartup}</strong> has been approved by our team and is now featured on Startup Showcase.</p>
      <p>You can now start gathering votes from the community to compete on this month's leaderboard.</p>
    </div>
    <div>
      <a href="${startupUrl}" class="btn">View Live Page</a>
    </div>
    <div class="footer">
      Startup Showcase &bull; Global Startup Discovery Platform
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    template: "submission_approved",
  });
}

/**
 * 3. Submission Rejected (to founder, with reason)
 */
export async function sendSubmissionRejectedEmail(params: {
  to: string;
  founderName: string;
  startupName: string;
  reason?: string;
}) {
  const safeFounder = escapeHtml(params.founderName || "Founder");
  const safeStartup = escapeHtml(params.startupName);
  const safeReason = escapeHtml(
    params.reason || "The submission did not meet our listing guidelines at this time."
  );
  const submitUrl = absoluteUrl("/submit");

  const subject = `Update regarding your submission: ${params.startupName}`;

  const text = `Hi ${params.founderName || "Founder"},\n\n` +
    `Thank you for submitting "${params.startupName}" to Startup Showcase.\n\n` +
    `After careful review, we are unable to feature your startup at this time for the following reason:\n` +
    `${params.reason || "The submission did not meet our listing guidelines."}\n\n` +
    `You are welcome to address this feedback and submit an updated project in the future: ${submitUrl}\n\n` +
    `Best regards,\nThe Startup Showcase Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .reason-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; color: #991b1b; font-size: 13px; margin: 16px 0; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Submission Update</div>
    <div class="content">
      <p>Hi ${safeFounder},</p>
      <p>Thank you for submitting <strong>${safeStartup}</strong> to Startup Showcase.</p>
      <p>After review, our editorial team was unable to approve this submission at this time. Feedback provided:</p>
      <div class="reason-box">
        ${safeReason}
      </div>
      <p>You may review our guidelines and submit an updated profile whenever you're ready.</p>
    </div>
    <div class="footer">
      Startup Showcase &bull; Global Startup Discovery Platform
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    template: "submission_rejected",
  });
}

/**
 * 4. Newsletter Confirmation (Double Opt-In)
 */
export async function sendNewsletterConfirmationEmail(params: {
  to: string;
  token: string;
  unsubscribeToken: string;
}) {
  const confirmUrl = absoluteUrl(`/newsletter/confirm?token=${encodeURIComponent(params.token)}`);
  const unsubscribeUrl = absoluteUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(params.unsubscribeToken)}`);

  const subject = "Please confirm your Startup Showcase newsletter subscription";

  const text = `Welcome to Startup Showcase!\n\n` +
    `Please confirm your email address by clicking the link below:\n${confirmUrl}\n\n` +
    `If you did not request this subscription, you can ignore this email or unsubscribe here:\n${unsubscribeUrl}\n\n` +
    `Best regards,\nThe Startup Showcase Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; }
    .title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
    .content { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    .unsub { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Confirm Your Subscription</div>
    <div class="content">
      <p>Thank you for subscribing to the <strong>Startup Showcase Weekly Digest</strong>.</p>
      <p>Please confirm your email address below to start receiving curated early-stage startups and monthly leaderboard rankings.</p>
    </div>
    <div>
      <a href="${confirmUrl}" class="btn">Confirm Subscription</a>
    </div>
    <div class="footer">
      If you did not make this request, you can safely ignore this email or
      <a href="${unsubscribeUrl}" class="unsub">unsubscribe</a>.
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: params.to,
    subject,
    text,
    html,
    template: "newsletter_confirmation",
  });
}
