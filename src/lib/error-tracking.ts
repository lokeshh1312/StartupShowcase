/**
 * Unified Error Tracking & Reporting Hook
 *
 * Provides a clean interface for application error reporting (supporting Sentry
 * or internal structured telemetry). Keys are read from environment variables;
 * when unset or in test environments, it safely falls back to formatted logging
 * without throwing or crashing.
 */

export interface ErrorContext {
  componentName?: string;
  actionName?: string;
  userId?: string;
  url?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Capture and report an unexpected exception.
 * Server actions, route handlers, and error boundaries can call this directly.
 */
export function captureException(
  error: unknown,
  context?: ErrorContext
): void {
  const dsn =
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  const errorMessage =
    error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // In production with Sentry DSN configured, Sentry or an ingestion hook can be notified
  type SentryInstance = {
    captureException: (err: unknown, options?: { extra?: unknown }) => void;
  };
  const globalWin = typeof window !== "undefined" ? (window as unknown as { Sentry?: SentryInstance }) : undefined;
  if (dsn && globalWin?.Sentry) {
    try {
      globalWin.Sentry.captureException(error, { extra: context });
      return;
    } catch {
      // Fall through to standard safe logger
    }
  }

  // Structured logging (server or browser console)
  if (process.env.NODE_ENV !== "test") {
    console.error("[ErrorTracker Captured]", {
      message: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * React hook for client components
 */
export function useErrorTracker() {
  return {
    captureException: (error: unknown, context?: ErrorContext) => {
      captureException(error, context);
    },
  };
}
