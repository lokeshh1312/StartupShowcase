"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
} from "@/server/startups";
import { createStartupSchema } from "@/lib/validation";
import { formatActionError } from "@/server/errors";

/**
 * Vote on a startup (authenticated only)
 */
export async function voteAction(startupIdOrSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  try {
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
 * Save/Bookmark a startup (authenticated only)
 */
export async function saveAction(startupIdOrSlug: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  try {
    const result = await toggleSave(startupIdOrSlug, user.id);
    revalidatePath("/startup/[slug]", "page");
    revalidatePath("/saved", "page");
    return { success: true, ...result };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Add a comment to an approved startup (authenticated only)
 */
export async function addCommentAction(
  startupIdOrSlug: string,
  content: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "unauthenticated" };
  }

  try {
    const comment = await addComment(startupIdOrSlug, content, user.id);
    revalidatePath(`/startup/${startupIdOrSlug}`);
    return { success: true, comment };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Submit a startup (authenticated founders only)
 */
export async function submitStartupAction(rawData: unknown) {
  const authData = await getCurrentUserProfile();
  if (!authData) {
    return { error: "unauthenticated" };
  }

  const { user, profile } = authData;

  if (profile.role !== "founder" && profile.role !== "admin") {
    return {
      error:
        "Only users with the Founder role can submit startups. Please update your role or register as a founder.",
    };
  }

  try {
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
 * Sign In with email & password
 */
export async function signInAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: formatActionError(error) };
    }

    if (!data.user) {
      return { error: "Sign in failed. Please try again." };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: unknown) {
    return { error: formatActionError(err) };
  }
}

/**
 * Sign Up with email, password & chosen role metadata
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

    // Allowed roles for signup
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
      return { error: formatActionError(error) };
    }

    // If session is present immediately (email confirmation turned off)
    if (data.session) {
      revalidatePath("/", "layout");
      return { success: true, needsConfirmation: false };
    }

    // Email confirmation is required
    return { success: true, needsConfirmation: true, email };
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
 */
export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get("email")?.toString()?.trim();
    if (!email) {
      return { error: "Email is required." };
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    if (error) {
      return { error: formatActionError(error) };
    }

    return { success: true };
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
