import "server-only";
import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import {
  sendNewsletterConfirmationEmail,
  fireAndForgetEmail,
} from "@/server/email";

/**
 * Computes the SHA-256 hash of a token.
 * We store only hashes in the database so tokens are never leaked if the DB is compromised.
 */
export function hashNewsletterToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
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
  const rawUnsubToken = randomBytes(32).toString("hex");

  const hashedConfirmToken = hashNewsletterToken(rawConfirmToken);
  const hashedUnsubToken = hashNewsletterToken(rawUnsubToken);

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
        unsubscribeToken: hashedUnsubToken,
        tokenExpiresAt: expiresAt,
      })
      .where(eq(newsletterSubscribers.id, existing[0].id));
  } else {
    // New subscriber
    await db.insert(newsletterSubscribers).values({
      email: normalizedEmail,
      confirmed: false,
      token: hashedConfirmToken,
      unsubscribeToken: hashedUnsubToken,
      tokenExpiresAt: expiresAt,
    });
  }

  // Dispatch double opt-in confirmation email safely
  fireAndForgetEmail(
    sendNewsletterConfirmationEmail({
      to: normalizedEmail,
      token: rawConfirmToken,
      unsubscribeToken: rawUnsubToken,
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
 * Unsubscribes a subscriber using their signed unsubscribe token.
 */
export async function unsubscribeNewsletter(
  rawUnsubToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!rawUnsubToken || rawUnsubToken.trim().length === 0) {
    return { success: false, error: "Missing or invalid unsubscribe token." };
  }

  const hashedToken = hashNewsletterToken(rawUnsubToken.trim());

  const [subscriber] = await db
    .select({ id: newsletterSubscribers.id })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.unsubscribeToken, hashedToken))
    .limit(1);

  if (!subscriber) {
    return {
      success: false,
      error: "Invalid or expired unsubscribe link.",
    };
  }

  // Delete the subscription record
  await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, subscriber.id));

  return { success: true };
}
