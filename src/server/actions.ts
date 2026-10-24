"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import {
  getCurrentUser,
  getCurrentUserProfile,
  createClient,
} from "@/lib/supabase/server";
import {
  toggleVote,
  toggleSave,
  addComment,
  createStartup,
  moderateStartup,
  hideComment,
  deleteStartup,
  updateStartup,
} from "@/server/startups";
import { uploadStartupImage } from "@/server/storage";
import { verifyTurnstileToken } from "@/server/captcha";
import {
  subscribeToNewsletter,
  confirmNewsletter,
  unsubscribeNewsletter,
} from "@/server/newsletter";
import { createStartupSchema, newsletterSubscribeSchema } from "@/lib/validation";
import { formatActionError } from "@/server/errors";
import {
  checkRateLimit,
  getRequestIp,
  hashEmail,
  RATE_LIMIT_MESSAGE,
} from "@/server/rate-limit";
import { db } from "@/db";
import { profiles, auditLog } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Vote on a startup (authenticated & verified only)
 */
export async function voteAction(startupIdOrSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  if (!user.email_confirmed_at) {
    return { error: "Please verify your email first." };
  }

  try {
    // Rate limit per user (at most 30 toggles per hour)
    const userLimit = await checkRateLimit(`vote:user:${user.id}`, 30, 3600);
    if (!userLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const result = await toggleVote(startupIdOrSlug, user.id);
    revalidatePath("/startup/[slug]", "page");
    revalidatePath("/", "page");
    revalidatePath("/browse", "page");
    return { success: true, ...result };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Save/Bookmark a startup (authenticated & verified only)
 */
export async function saveAction(startupIdOrSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  if (!user.email_confirmed_at) {
    return { error: "Please verify your email first." };
  }

  try {
    // Rate limit per user (at most 60 toggles per hour)
    const userLimit = await checkRateLimit(`save:user:${user.id}`, 60, 3600);
    if (!userLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const result = await toggleSave(startupIdOrSlug, user.id);
    revalidatePath("/startup/[slug]", "page");
    revalidatePath("/saved", "page");
    return { success: true, ...result };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Add a comment to an approved startup (authenticated & verified only)
 */
export async function addCommentAction(
  startupIdOrSlug: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  if (!user.email_confirmed_at) {
    return { error: "Please verify your email first." };
  }

  try {
    // Rate limit per user (at most 15 comments per hour)
    const userLimit = await checkRateLimit(`comment:user:${user.id}`, 15, 3600);
    if (!userLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const comment = await addComment(startupIdOrSlug, content, user.id);
    revalidatePath(`/startup/${startupIdOrSlug}`);
    return { success: true, comment };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Upload a startup logo or cover image with magic byte verification.
 */
export async function uploadStartupImageAction(formData: FormData): Promise<
  | { success: false; error: string }
  | { success: true; url: string; path: string }
> {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { success: false, error: "unauthenticated" };
  }

  // Require verified email
  if (!authData.user.email_confirmed_at) {
    return { success: false, error: "Please verify your email before uploading images." };
  }

  // Require founder role (or admin)
  if (authData.profile.role !== "founder" && authData.profile.role !== "admin") {
    return { success: false, error: "Only founders can upload startup images." };
  }

  // Rate limit: 10 uploads per user per hour
  const rateLimitKey = `upload:user:${authData.user.id}`;
  const rateLimitResult = await checkRateLimit(rateLimitKey, 10, 3600);
  if (!rateLimitResult.allowed) {
    return { success: false, error: "Upload rate limit exceeded: Maximum 10 uploads per hour." };
  }

  // Max 20 live objects per user in startup-images bucket
  try {
    const admin = createAdminClient();
    const { data: objects, error: listError } = await admin.storage
      .from("startup-images")
      .list(authData.user.id);

    if (!listError && objects && objects.length >= 20) {
      return {
        success: false,
        error: "Image storage limit reached: A maximum of 20 images is permitted per account.",
      };
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    // In local dev without keys, proceed
  }

  try {
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return { success: false, error: "No image file provided." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const declaredMime = file.type || undefined;

    const result = await uploadStartupImage(buffer, authData.user.id, declaredMime);
    return { success: true, url: result.url, path: result.path };
  } catch (err: unknown) {
    return { success: false, error: formatActionError(err) };
  }
}

/**
 * Submit a startup (authenticated verified founders only, protected by CAPTCHA)
 */
export async function submitStartupAction(rawData: unknown) {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { error: "unauthenticated" };
  }

  const { user, profile } = authData;

  if (!user.email_confirmed_at) {
    return { error: "Please verify your email first." };
  }

  if (profile.role !== "founder" && profile.role !== "admin") {
    return {
      error:
        "Only users with the Founder role can submit startups. Please update your role or register as a founder.",
    };
  }

  try {
    // Extract captchaToken if provided in rawData
    const dataObj = (typeof rawData === "object" && rawData !== null ? rawData : {}) as Record<string, unknown>;
    const captchaToken = typeof dataObj.captchaToken === "string" ? dataObj.captchaToken : undefined;

    const ip = await getRequestIp();
    const captchaRes = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaRes.success) {
      return { error: captchaRes.error || "Security verification failed." };
    }

    // Rate limit per user (at most 5 submissions per hour)
    const userLimit = await checkRateLimit(`submit:user:${user.id}`, 5, 3600);
    if (!userLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const validated = createStartupSchema.parse(rawData);
    const created = await createStartup(validated, user.id);
    revalidatePath("/me/submissions");
    return { success: true, startup: created };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Edit a pending startup (owner or admin)
 */
export async function updateStartupAction(startupId: string, rawData: unknown) {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { error: "unauthenticated" };
  }

  try {
    const isAdmin = authData.profile.role === "admin";
    const updated = await updateStartup(startupId, rawData, authData.user.id, isAdmin);
    revalidatePath("/me/submissions");
    revalidatePath(`/startup/${updated.slug}`);
    revalidatePath("/admin");
    return { success: true, startup: updated };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Delete a pending startup (owner or admin)
 */
export async function deleteStartupAction(startupId: string) {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { error: "unauthenticated" };
  }

  try {
    const isAdmin = authData.profile.role === "admin";
    await deleteStartup(startupId, authData.user.id, isAdmin);
    revalidatePath("/me/submissions");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/browse");
    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Moderate a startup (admin only)
 */
export async function moderateStartupAction(
  idOrSlug: string,
  status: "approved" | "rejected" | "pending",
  rejectionReason?: string
) {
  const authData = await getCurrentUserProfile();
  if (!authData || authData.profile.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    const updated = await moderateStartup(idOrSlug, status, authData.user.id, rejectionReason);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/browse");
    return { success: true, startup: updated };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Hide a comment (admin only)
 */
export async function hideCommentAction(commentId: string) {
  const authData = await getCurrentUserProfile();
  if (!authData || authData.profile.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    const updated = await hideComment(commentId, authData.user.id);
    revalidatePath("/admin");
    return { success: true, comment: updated };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Allow a Google / OAuth user with 'community' role to pick their initial role (founder or investor, never admin).
 * Can only be performed once (when role_chosen_at IS NULL and current role is 'community').
 */
export async function chooseInitialRoleAction(role: "founder" | "investor") {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { error: "unauthenticated" };
  }

  if (authData.profile.role === "admin") {
    return { error: "Forbidden: Admin accounts cannot change their role." };
  }

  if (!["founder", "investor"].includes(role)) {
    return { error: "Invalid role selected. Only founder or investor may be chosen." };
  }

  try {
    const [freshProfile] = await db
      .select({
        role: profiles.role,
        roleChosenAt: profiles.roleChosenAt,
      })
      .from(profiles)
      .where(eq(profiles.id, authData.user.id))
      .limit(1);

    if (!freshProfile) {
      return { error: "Profile not found." };
    }

    if (freshProfile.role === "admin") {
      return { error: "Forbidden: Admin accounts cannot change their role." };
    }

    if (freshProfile.role !== "community") {
      return { error: "Role cannot be changed once established." };
    }

    if (freshProfile.roleChosenAt) {
      return { error: "Initial role has already been chosen." };
    }

    const now = new Date();
    await db
      .update(profiles)
      .set({
        role,
        roleChosenAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(profiles.id, authData.user.id),
          eq(profiles.role, "community"),
          sql`${profiles.roleChosenAt} IS NULL`
        )
      );

    await db.insert(auditLog).values({
      actorId: authData.user.id,
      action: `profile.initial_role:${role}`,
      targetType: "profile",
      targetId: authData.user.id,
      metadata: { previous_role: "community", new_role: role },
    });

    revalidatePath("/", "layout");
    return { success: true, role };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Sign In with email & password
 */
export async function signInAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const emailHash = hashEmail(email);
    const emailLimit = await checkRateLimit(
      `auth:signin:email:${emailHash}`,
      10,
      900
    );
    if (!emailLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const ip = await getRequestIp();
    if (ip !== null) {
      const ipLimit = await checkRateLimit(`auth:signin:ip:${ip}`, 10, 900);
      if (!ipLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: "Email or password is incorrect." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Sign Up with email, password & chosen role metadata (protected by CAPTCHA)
 */
export async function signUpAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();
    const name = formData.get("name")?.toString()?.trim() || "";
    const role = formData.get("role")?.toString()?.trim() || "community";
    const captchaToken =
      formData.get("cf-turnstile-response")?.toString() ||
      formData.get("captchaToken")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    if (password.length < 10) {
      return { error: "Password must be at least 10 characters long." };
    }

    const ip = await getRequestIp();
    const captchaRes = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaRes.success) {
      return { error: captchaRes.error || "Security verification failed." };
    }

    const emailHash = hashEmail(email);
    const emailLimit = await checkRateLimit(
      `auth:signup:email:${emailHash}`,
      5,
      3600
    );
    if (!emailLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    if (ip !== null) {
      const ipLimit = await checkRateLimit(`auth:signup:ip:${ip}`, 10, 3600);
      if (!ipLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    } else {
      const globalLimit = await checkRateLimit("auth:signup:global", 200, 3600);
      if (!globalLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    }

    const safeRole = ["founder", "investor", "community"].includes(role)
      ? role
      : "community";

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: safeRole,
        },
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("already registered") ||
        msg.includes("user already exists")
      ) {
        return {
          success: true,
          needsConfirmation: true,
          email,
          message: "If an account exists, we sent an email.",
        };
      }
      return { error: formatActionError(error) };
    }

    if (data.session) {
      revalidatePath("/", "layout");
      return { success: true, needsConfirmation: false };
    }

    return {
      success: true,
      needsConfirmation: true,
      email,
      message: "If an account exists, we sent an email.",
    };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Sign Out
 */
export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err: unknown) {
    console.error("[SignOut Error]:", err);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Forgot password (protected by CAPTCHA)
 */
export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const captchaToken =
      formData.get("cf-turnstile-response")?.toString() ||
      formData.get("captchaToken")?.toString();

    if (!email) {
      return { error: "Email is required." };
    }

    const ip = await getRequestIp();
    const captchaRes = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaRes.success) {
      return { error: captchaRes.error || "Security verification failed." };
    }

    const emailHash = hashEmail(email);
    const emailLimit = await checkRateLimit(
      `auth:forgot:email:${emailHash}`,
      5,
      3600
    );
    if (!emailLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    if (ip !== null) {
      const ipLimit = await checkRateLimit(`auth:forgot:ip:${ip}`, 5, 3600);
      if (!ipLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    } else {
      const globalLimit = await checkRateLimit("auth:forgot:global", 200, 3600);
      if (!globalLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    return {
      success: true,
      message: "If an account exists, we sent an email.",
    };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Reset password (protected by CAPTCHA)
 */
export async function resetPasswordAction(formData: FormData) {
  try {
    const password = formData.get("password")?.toString();
    const captchaToken =
      formData.get("cf-turnstile-response")?.toString() ||
      formData.get("captchaToken")?.toString();

    if (!password || password.length < 10) {
      return { error: "Password must be at least 10 characters long." };
    }

    const ip = await getRequestIp();
    const captchaRes = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaRes.success) {
      return { error: captchaRes.error || "Security verification failed." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { error: formatActionError(error) };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Subscribe to Newsletter with rate limiting, CAPTCHA, and double opt-in
 */
export async function subscribeNewsletterAction(email: string, captchaToken?: string) {
  try {
    const ip = await getRequestIp();
    const captchaRes = await verifyTurnstileToken(captchaToken, ip);
    if (!captchaRes.success) {
      return { error: captchaRes.error || "Security verification failed." };
    }

    const validated = newsletterSubscribeSchema.parse({ email });
    const emailHash = hashEmail(validated.email);
    const emailLimit = await checkRateLimit(
      `newsletter:email:${emailHash}`,
      5,
      3600
    );
    if (!emailLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    if (ip !== null) {
      const ipLimit = await checkRateLimit(`newsletter:ip:${ip}`, 5, 3600);
      if (!ipLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    } else {
      const globalLimit = await checkRateLimit("newsletter:global", 200, 3600);
      if (!globalLimit.allowed) {
        return { error: RATE_LIMIT_MESSAGE };
      }
    }

    const res = await subscribeToNewsletter(validated.email);
    return { success: true, message: res.message };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Confirm newsletter subscription via POSTed server action (prevents email scanner pre-fetching).
 */
export async function confirmNewsletterSubscriptionAction(token: string) {
  if (!token || !token.trim()) {
    return { error: "No confirmation token provided." };
  }

  try {
    const ip = await getRequestIp();
    const rateLimitKey = ip ? `newsletter:confirm:ip:${ip}` : "newsletter:confirm:global";
    const limit = await checkRateLimit(rateLimitKey, 20, 3600);
    if (!limit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const result = await confirmNewsletter(token.trim());
    if (!result.success) {
      return { error: result.error || "Invalid or expired confirmation link." };
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Unsubscribe from newsletter via POSTed server action (stateless HMAC verification).
 */
export async function unsubscribeNewsletterAction(email: string, token: string) {
  if (!email || !token || !token.trim()) {
    return { error: "Missing email address or unsubscribe token." };
  }

  try {
    const ip = await getRequestIp();
    const rateLimitKey = ip ? `newsletter:unsub:ip:${ip}` : "newsletter:unsub:global";
    const limit = await checkRateLimit(rateLimitKey, 20, 3600);
    if (!limit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const result = await unsubscribeNewsletter(email.trim(), token.trim());
    if (!result.success) {
      return { error: result.error || "Invalid or expired unsubscribe link." };
    }

    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}
