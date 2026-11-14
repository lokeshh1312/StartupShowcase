/**
 * Image URL safety validator for next/image.
 *
 * Rules:
 * 1. Safe site-relative paths matching ^/startups/[a-z0-9-]+\.(png|webp|jpg|jpeg)$
 *    are permitted to serve static startup assets from public/startups/.
 * 2. Absolute URLs must use http: or https: protocol (strictly rejects javascript:, data:, file:, etc.).
 * 3. In non-production environments (NODE_ENV !== "production"), http(s) URLs on the dev
 *    allowlist (images.unsplash.com) are permitted to support sample/seed data.
 * 4. Our Supabase public storage host (derived from NEXT_PUBLIC_SUPABASE_URL, matching
 *    the exact logic in next.config.ts) is allowed. If NEXT_PUBLIC_SUPABASE_URL is not set,
 *    it defaults to allowing *.supabase.co hosts.
 *
 * Any other host, malformed string, or unapproved protocol returns false.
 */

const SAFE_STARTUP_PATH_REGEX = /^\/startups\/[a-z0-9-]+\.(png|webp|jpg|jpeg)$/;

export function isAllowedImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  // 1. Allow safe site-relative startup images from public/startups/
  if (SAFE_STARTUP_PATH_REGEX.test(trimmed)) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  // Strictly require http: or https:
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  // 1. Dev / sample data allowlist: allowed ONLY outside production
  if (process.env.NODE_ENV !== "production") {
    if (hostname === "images.unsplash.com") {
      return true;
    }
  }

  // 2. Supabase storage host (matches next.config.ts remotePatterns rule)
  const supabaseEnv = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let supabaseHost = "";
  let supabasePort = "";

  if (supabaseEnv) {
    try {
      const parsedSupabase = new URL(supabaseEnv);
      supabaseHost = parsedSupabase.hostname.toLowerCase();
      supabasePort = parsedSupabase.port || "";
    } catch {
      // Ignore malformed env URL and fall back below
    }
  }

  if (supabaseHost) {
    const hostMatches = hostname === supabaseHost;
    const portMatches = !supabasePort || parsed.port === supabasePort;
    if (hostMatches && portMatches) {
      return true;
    }
  } else {
    // If NEXT_PUBLIC_SUPABASE_URL is unset, default remote pattern allows *.supabase.co
    if (hostname === "supabase.co" || hostname.endsWith(".supabase.co")) {
      return true;
    }
  }

  return false;
}
