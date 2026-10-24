/**
 * Next.js Instrumentation Hook
 *
 * Runs once at server start (nodejs runtime only).
 * Validates required environment variables in production mode.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const isProduction = process.env.NODE_ENV === "production";
    const isBuildPhase =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build";

    // Only validate at runtime in production, never during build phase
    if (isProduction && !isBuildPhase) {
      const { assertProductionEnv } = await import("@/lib/env-validator");
      assertProductionEnv();
    }
  }
}
