import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from Server Component
          }
        },
      },
    }
  );
}

/**
 * Verified user session on the server.
 * Never trust client-supplied input for user identity.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Fetch verified user + their app profile (role, display_name)
 */
export async function getCurrentUserProfile(): Promise<{
  user: User;
  profile: Profile;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return null;
    }

    return { user, profile };
  } catch {
    return null;
  }
}
