import dotenv from "dotenv";
import postgres from "postgres";

// Load environment variables from .env.local if present
dotenv.config({ path: ".env.local" });

/**
 * Validates that no sample startups (is_sample = true) exist in the database when NODE_ENV=production.
 * Returns { sampleCount, passed, message }.
 */
export async function verifyNoSamplesInProduction(
  env: string = process.env.NODE_ENV || "development",
  connectionString?: string
): Promise<{ sampleCount: number; passed: boolean; message: string }> {
  const isProduction = env === "production";
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set. Cannot verify sample startups.");
  }

  const client = postgres(dbUrl, { prepare: false, max: 1 });
  try {
    const rows = await client<{ count: number }[]>`
      SELECT count(*)::int AS count FROM public.startups WHERE is_sample = true;
    `;
    const sampleCount = Number(rows[0]?.count ?? 0);

    if (isProduction && sampleCount > 0) {
      return {
        sampleCount,
        passed: false,
        message: `DEPLOY GUARD FAILED: Found ${sampleCount} sample startup(s) (is_sample = true) in production database! Sample data must be deleted before production deploy.`,
      };
    }

    return {
      sampleCount,
      passed: true,
      message:
        sampleCount === 0
          ? "Zero sample startups found in database. Clean for production deploy."
          : `Found ${sampleCount} sample startup(s) in non-production environment (${env}). Safe to proceed for local development.`,
    };
  } finally {
    await client.end();
  }
}

/**
 * Pure validation logic for unit testing without live DB
 */
export function evaluateSampleGuard(
  sampleCount: number,
  env: string = process.env.NODE_ENV || "development"
): { passed: boolean; message: string } {
  const isProduction = env === "production";
  if (isProduction && sampleCount > 0) {
    return {
      passed: false,
      message: `DEPLOY GUARD FAILED: Found ${sampleCount} sample startup(s) in production database.`,
    };
  }
  return {
    passed: true,
    message:
      sampleCount === 0
        ? "Clean database for production."
        : `Allowed ${sampleCount} samples in ${env}.`,
  };
}

async function runCli() {
  try {
    const result = await verifyNoSamplesInProduction();
    console.log(result.passed ? `✅ ${result.message}` : `❌ ${result.message}`);
    if (!result.passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error executing check:samples:", error);
    process.exit(1);
  }
}

// Only execute when run directly via CLI
if (
  process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/check-samples.ts")
) {
  runCli();
}
