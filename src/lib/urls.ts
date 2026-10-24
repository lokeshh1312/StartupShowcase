/**
 * Central URL helper for Startup Showcase.
 * Reads the base URL ONLY from NEXT_PUBLIC_SITE_URL.
 *
 * In production (NODE_ENV === "production"):
 * NEXT_PUBLIC_SITE_URL is mandatory and cannot be empty or contain "localhost".
 * A missing or localhost URL throws a loud error at build/start time to prevent bad deploys.
 *
 * In development and test (NODE_ENV !== "production"):
 * Falls back to "http://localhost:3000" if NEXT_PUBLIC_SITE_URL is unset.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      throw new Error(
        `Production deployment error: NEXT_PUBLIC_SITE_URL is required in production and cannot be empty or localhost (received: "${envUrl || ""}"). Set a valid public origin (e.g. https://startupshowcase.com) at build time and runtime.`
      );
    }
    return envUrl.replace(/\/+$/, "");
  }

  // Development & test environments fallback
  if (!envUrl) {
    return "http://localhost:3000";
  }
  return envUrl.replace(/\/+$/, "");
}

/**
 * Resolves an absolute URL given a relative or path-based URL.
 */
export function absoluteUrl(path: string = "/"): string {
  const base = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
