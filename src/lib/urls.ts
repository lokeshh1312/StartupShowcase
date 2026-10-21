/**
 * Central URL helper for Startup Showcase.
 * Reads the base URL ONLY from NEXT_PUBLIC_SITE_URL (defaulting to http://localhost:3000).
 * Never hard-codes any domain.
 */

export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!envUrl) {
    return "http://localhost:3000";
  }
  // Remove any trailing slash to ensure consistency
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
