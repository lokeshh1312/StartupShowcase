import "server-only";
import { getRequestIp } from "@/server/rate-limit";

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  errorCodes?: string[];
}

/**
 * Validates Cloudflare Turnstile environment variables.
 * Fails loudly at startup in production if required variables are missing.
 */
export function validateTurnstileEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const isBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";

  if (isProd && !isBuild) {
    if (!process.env.TURNSTILE_SECRET_KEY || !process.env.TURNSTILE_SECRET_KEY.trim()) {
      throw new Error("Missing required production environment variable: TURNSTILE_SECRET_KEY");
    }
    if (
      !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY.trim()
    ) {
      throw new Error(
        "Missing required production environment variable: NEXT_PUBLIC_TURNSTILE_SITE_KEY"
      );
    }
  }
}

validateTurnstileEnv();

/**
 * Verifies a Cloudflare Turnstile token on the server using siteverify.
 * In development, if TURNSTILE_SECRET_KEY is not configured, verification is skipped safely.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIpOverride?: string | null
): Promise<CaptchaVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  // In development/test without configured keys: skip gracefully
  if (!secret) {
    return { success: true };
  }

  if (!token || !token.trim()) {
    return {
      success: false,
      error: "Security verification required. Please complete the CAPTCHA.",
    };
  }

  const remoteIp = remoteIpOverride ?? (await getRequestIp());

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!res.ok) {
      return {
        success: false,
        error: "CAPTCHA service verification request failed.",
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!data.success) {
      return {
        success: false,
        error: "CAPTCHA validation failed. Please try again.",
        errorCodes: data["error-codes"],
      };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[Turnstile Verification Exception]:", err);
    return {
      success: false,
      error: "Unable to verify CAPTCHA at this time. Please retry.",
    };
  }
}
