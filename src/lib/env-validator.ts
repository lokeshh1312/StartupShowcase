/**
 * Environment Variable Validator for Production
 *
 * Checks all mandatory production environment variables.
 * Used by src/instrumentation.ts at startup and unit tested in isolation.
 */

export const REQUIRED_PRODUCTION_ENV_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "TRUSTED_PROXY_COUNT",
  "VIEW_HASH_SECRET",
  "NEWSLETTER_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED",
  "NEXT_PUBLIC_CONTACT_EMAIL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "SUBMISSION_PRICE_USD_CENTS",
] as const;

export type RequiredEnvVar = (typeof REQUIRED_PRODUCTION_ENV_VARS)[number];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  errors?: string[];
}

/**
 * Pure function to test whether required environment variables are present and valid.
 */
export function validateProductionEnv(
  env: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const missing: string[] = [];
  const errors: string[] = [];

  for (const varName of REQUIRED_PRODUCTION_ENV_VARS) {
    const val = env[varName];
    if (val === undefined || val === null || val.trim() === "") {
      missing.push(varName);
    }
  }

  // Validate SUBMISSION_PRICE_USD_CENTS is a positive integer
  const priceVal = env.SUBMISSION_PRICE_USD_CENTS?.trim();
  if (priceVal && (!/^\d+$/.test(priceVal) || parseInt(priceVal, 10) <= 0)) {
    errors.push("SUBMISSION_PRICE_USD_CENTS must be a positive integer (e.g. 1000 for $10.00)");
  }

  // Check test key in production
  const isProd = env.NODE_ENV === "production";
  const allowTestInProd = env.ALLOW_RAZORPAY_TEST_IN_PRODUCTION === "true";
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const publicKeyId = env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();

  if (isProd && !allowTestInProd) {
    if (keyId?.startsWith("rzp_test_") || publicKeyId?.startsWith("rzp_test_")) {
      errors.push(
        "Razorpay key is a test key (starts with 'rzp_test_') in production. Launching in test mode is prohibited unless ALLOW_RAZORPAY_TEST_IN_PRODUCTION=true."
      );
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Asserts all required production environment variables exist and are valid.
 * Throws a descriptive error naming every missing or invalid variable if validation fails.
 */
export function assertProductionEnv(
  env: Record<string, string | undefined> = process.env
): void {
  const { valid, missing, errors } = validateProductionEnv(env);

  if (!valid) {
    const errorDetails: string[] = [];
    if (missing.length > 0) {
      errorDetails.push(
        "Missing required production environment variable(s):\n" +
          missing.map((v) => `  - ${v}`).join("\n")
      );
    }
    if (errors && errors.length > 0) {
      errorDetails.push(
        "Configuration error(s):\n" +
          errors.map((e) => `  - ${e}`).join("\n")
      );
    }
    throw new Error(
      `CRITICAL CONFIGURATION ERROR:\n${errorDetails.join("\n\n")}\n\nPlease consult docs/DEPLOY.md.`
    );
  }
}
