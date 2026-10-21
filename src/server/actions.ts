"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
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
} from "@/server/startups";
import { createStartupSchema, newsletterSubscribeSchema } from "@/lib/validation";
import { formatActionError } from "@/server/errors";
import {
  checkRateLimit,
  getRequestIp,
  RATE_LIMIT_MESSAGE,
} from "@/server/rate-limit";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

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
    const ip = await getRequestIp();

    // Rate limit per IP
    const ipLimit = await checkRateLimit(`vote:ip:${ip}`, 100, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

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
    const ip = await getRequestIp();
    const ipLimit = await checkRateLimit(`save:ip:${ip}`, 100, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

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
    const ip = await getRequestIp();

    const ipLimit = await checkRateLimit(`comment:ip:${ip}`, 30, 3600);
    if (!ipLimit.allowed) {
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
 * Submit a startup (authenticated verified founders only)
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
    const ip = await getRequestIp();
    const ipLimit = await checkRateLimit(`submit:ip:${ip}`, 10, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

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
 * Moderate a startup (admin only)
 */
export async function moderateStartupAction(
  idOrSlug: string,
  status: "approved" | "rejected" | "pending"
) {
  const authData = await getCurrentUserProfile();
  if (!authData || authData.profile.role !== "admin") {
    return { error: "Forbidden: Admin privileges required." };
  }

  try {
    const updated = await moderateStartup(idOrSlug, status, authData.user.id);
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
 * Sign In with email & password
 * Protects against account enumeration: returns generic error on any failure.
 */
export async function signInAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const ip = await getRequestIp();
    const ipLimit = await checkRateLimit(`auth:signin:${ip}`, 10, 900);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Do not leak whether an email exists
      return { error: "Email or password is incorrect." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Sign Up with email, password & chosen role metadata
 * Protects against account enumeration: returns generic success message regardless of prior registration.
 */
export async function signUpAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();
    const name = formData.get("name")?.toString()?.trim() || "";
    const role = formData.get("role")?.toString()?.trim() || "community";

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    if (password.length < 10) {
      return { error: "Password must be at least 10 characters long." };
    }

    const ip = await getRequestIp();
    const ipLimit = await checkRateLimit(`auth:signup:${ip}`, 5, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    // Allowed roles for signup strictly sanitized
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

    // If already registered or generic error, return identical check email message to prevent enumeration
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

    // If session is present immediately (email confirmation turned off in local/test)
    if (data.session) {
      revalidatePath("/", "layout");
      return { success: true, needsConfirmation: false };
    }

    // Email confirmation is required
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
 * Forgot password (request reset link)
 * Protects against account enumeration: returns generic message regardless of email existence.
 */
export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    if (!email) {
      return { error: "Email is required." };
    }

    const ip = await getRequestIp();
    const ipLimit = await checkRateLimit(`auth:forgot:${ip}`, 5, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    // Always return generic success message to prevent account enumeration
    return {
      success: true,
      message: "If an account exists, we sent an email.",
    };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Reset password
 */
export async function resetPasswordAction(formData: FormData) {
  try {
    const password = formData.get("password")?.toString();
    if (!password || password.length < 10) {
      return { error: "Password must be at least 10 characters long." };
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
 * Subscribe to Newsletter with rate limiting
 */
export async function subscribeNewsletterAction(email: string) {
  try {
    const validated = newsletterSubscribeSchema.parse({ email });
    const ip = await getRequestIp();

    const ipLimit = await checkRateLimit(`newsletter:ip:${ip}`, 5, 3600);
    if (!ipLimit.allowed) {
      return { error: RATE_LIMIT_MESSAGE };
    }

    await db
      .insert(newsletterSubscribers)
      .values({
        email: validated.email,
        token: randomUUID(),
        confirmed: false,
      })
      .onConflictDoNothing();

    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}
