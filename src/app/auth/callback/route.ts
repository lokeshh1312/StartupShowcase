import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/redirect";
import { getBaseUrl } from "@/lib/urls";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[OAuth Callback Error]:", error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, baseUrl)
      );
    }
  }

  return NextResponse.redirect(new URL(targetPath, baseUrl));
}
