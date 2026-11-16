import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";
import { getBaseUrl } from "@/lib/urls";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectParam = requestUrl.searchParams.get("redirect");
  const oauthError = requestUrl.searchParams.get("error");
  const oauthErrorDescription = requestUrl.searchParams.get("error_description");
  const targetPath = safeRedirectPath(redirectParam || "/");
  const baseUrl = getBaseUrl();

  if (oauthError || oauthErrorDescription) {
    const message =
      oauthErrorDescription ||
      (oauthError === "access_denied"
        ? "Sign in was cancelled."
        : oauthError || "Authentication failed.");
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, baseUrl)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[OAuth Callback Error]:", error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, baseUrl)
      );
    }

    const user = data?.user;
    if (user && user.app_metadata?.provider !== "email") {
      const [profile] = await db
        .select({
          role: profiles.role,
          roleChosenAt: profiles.roleChosenAt,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      if (profile && profile.role === "community" && profile.roleChosenAt === null) {
        const onboardingUrl = new URL("/onboarding/role", baseUrl);
        onboardingUrl.searchParams.set("redirect", targetPath);
        return NextResponse.redirect(onboardingUrl);
      }
    }
  }

  return NextResponse.redirect(new URL(targetPath, baseUrl));
}
