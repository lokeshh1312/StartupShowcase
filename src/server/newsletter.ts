import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import {
  sendNewsletterConfirmationEmail,
  fireAndForgetEmail,
} from "@/server/email";

/**
 * Validates and retrieves NEWSLETTER_SECRET.
 * In production (NODE_ENV=production), throws if unset.
 */
export function getNewsletterSecret(): string {
  const isProd = process.env.NODE_ENV === "production";
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  const secret = process.env.NEWSLETTER_SECRET?.trim();
  if (isProd && !isBuild && !secret) {
    throw new Error("Missing required production environment variable: NEWSLETTER_SECRET");
  }
  return secret || "dev-newsletter-secret-minimum-32-chars-long";
}

/**
 * Computes the SHA-256 hash of a confirmation token.
 * We store only hashes in the database so tokens are never leaked if the DB is compromised.
 */
export function hashNewsletterToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generates a stateless signed unsubscribe token:
 * token = base64url(HMAC-SHA256(NEWSLETTER_SECRET, lowercase email))
 */
export function generateNewsletterUnsubscribeToken(email: string): string {
  const secret = getNewsletterSecret();
  const normalized = email.trim().toLowerCase();
  return createHmac("sha256", secret).update(normalized).digest("base64url");
}

/**
 * Verifies a stateless unsubscribe token using timingSafeEqual to avoid timing side-channels.
 */
export function verifyNewsletterUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const expected = generateNewsletterUnsubscribeToken(email);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export interface NewsletterSubscribeResult {
  success: boolean;
  message: string;
}

/**
 * Subscribes an email to the newsletter with double opt-in.
 * Never reveals whether an email is already subscribed.
 */
export async function subscribeToNewsletter(
  email: string
): Promise<NewsletterSubscribeResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const rawConfirmToken = randomBytes(32).toString("hex");
  const hashedConfirmToken = hashNewsletterToken(rawConfirmToken);
  const statelessUnsubToken = generateNewsletterUnsubscribeToken(normalizedEmail);

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48-hour expiration

  // Check if subscriber exists
  const existing = await db
    .select({
      id: newsletterSubscribers.id,
      confirmed: newsletterSubscribers.confirmed,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalizedEmail))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].confirmed) {
      // Already confirmed: do not reveal status, don't overwrite confirmed state
      return {
        success: true,
        message: "Please check your inbox to confirm your newsletter subscription.",
      };
    }

    // Existing but unconfirmed: renew confirmation token and resend
    await db
      .update(newsletterSubscribers)
      .set({
        token: hashedConfirmToken,
        tokenExpiresAt: expiresAt,
      })
      .where(eq(newsletterSubscribers.id, existing[0].id));
  } else {
    // New subscriber
    await db.insert(newsletterSubscribers).values({
      email: normalizedEmail,
      confirmed: false,
      token: hashedConfirmToken,
      tokenExpiresAt: expiresAt,
    });
  }

  // Dispatch double opt-in confirmation email safely
  fireAndForgetEmail(
    sendNewsletterConfirmationEmail({
      to: normalizedEmail,
      token: rawConfirmToken,
      unsubscribeToken: statelessUnsubToken,
    })
  );

  return {
    success: true,
    message: "Please check your inbox to confirm your newsletter subscription.",
  };
}

/**
 * Confirms a double opt-in subscription using the one-time raw token.
 */
export async function confirmNewsletter(
  rawToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!rawToken || rawToken.trim().length === 0) {
    return { success: false, error: "Missing or invalid confirmation token." };
  }

  const hashedToken = hashNewsletterToken(rawToken.trim());
  const now = new Date();

  // Find unconfirmed subscriber with matching token and valid expiration
  const [subscriber] = await db
    .select({
      id: newsletterSubscribers.id,
      confirmed: newsletterSubscribers.confirmed,
      tokenExpiresAt: newsletterSubscribers.tokenExpiresAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.token, hashedToken))
    .limit(1);

  if (!subscriber) {
    return {
      success: false,
      error: "This confirmation link is invalid or has already been used.",
    };
  }

  if (subscriber.tokenExpiresAt && subscriber.tokenExpiresAt < now) {
    return {
      success: false,
      error: "This confirmation link has expired. Please subscribe again.",
    };
  }

  // One-time confirm: set confirmed = true and clear the confirm token
  await db
    .update(newsletterSubscribers)
    .set({
      confirmed: true,
      confirmedAt: now,
      token: "", // Invalidate token so it cannot be reused
    })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  return { success: true };
}

/**
 * Unsubscribes a subscriber using stateless HMAC verification.
 * Does not depend on database tokens and cannot be spoofed.
 */
export async function unsubscribeNewsletter(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || !token || !token.trim()) {
    return { success: false, error: "Missing email address or unsubscribe token." };
  }

  const isValid = verifyNewsletterUnsubscribeToken(normalized, token.trim());
  if (!isValid) {
    return { success: false, error: "Invalid or expired unsubscribe link." };
  }

  // Delete the subscription record if it exists
  await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized));

  return { success: true };
}
