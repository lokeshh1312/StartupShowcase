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
] as const;

export type RequiredEnvVar = (typeof REQUIRED_PRODUCTION_ENV_VARS)[number];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Pure function to test whether required environment variables are present and non-empty.
 */
export function validateProductionEnv(
  env: Record<string, string | undefined> = process.env
): EnvValidationResult {
  const missing: string[] = [];

  for (const varName of REQUIRED_PRODUCTION_ENV_VARS) {
    const val = env[varName];
    if (val === undefined || val === null || val.trim() === "") {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Asserts all required production environment variables exist.
 * Throws a descriptive error naming every missing variable if validation fails.
 */
export function assertProductionEnv(
  env: Record<string, string | undefined> = process.env
): void {
  const { valid, missing } = validateProductionEnv(env);

  if (!valid) {
    const missingList = missing.map((v) => `  - ${v}`).join("\n");
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Missing required production environment variable(s):\n${missingList}\n\nPlease consult docs/DEPLOY.md.`
    );
  }
}
