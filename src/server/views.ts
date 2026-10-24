import { createHash } from "crypto";

const BOT_USER_AGENT_REGEX =
  /bot|crawler|spider|preview|facebookexternalhit|slurp|curl|wget|whatsapp|telegram|twitterbot|slackbot|discordbot|applebot|duckduckbot/i;

export interface ViewFilterParams {
  userAgent?: string | null;
  nextRouterPrefetch?: string | null;
  purpose?: string | null;
  secPurpose?: string | null;
  method?: string | null;
}

/**
 * Filter known bots, crawlers, HEAD requests, and Next.js prefetch queries.
 */
export function isBotOrPrefetch(params: ViewFilterParams): boolean {
  if (params.method && params.method.toUpperCase() === "HEAD") {
    return true;
  }
  if (params.nextRouterPrefetch) {
    return true;
  }
  if (params.purpose === "prefetch" || params.secPurpose === "prefetch") {
    return true;
  }
  if (!params.userAgent || !params.userAgent.trim()) {
    return true;
  }
  if (BOT_USER_AGENT_REGEX.test(params.userAgent)) {
    return true;
  }
  return false;
}

/**
 * Extract headers and test for bot/prefetch characteristics.
 */
export function isBotOrPrefetchFromHeaders(
  headerSource?: Headers | Record<string, string | string[] | undefined> | null,
  method?: string
): boolean {
  if (!headerSource) {
    return isBotOrPrefetch({ userAgent: "", method });
  }

  let userAgent: string | null = null;
  let nextRouterPrefetch: string | null = null;
  let purpose: string | null = null;
  let secPurpose: string | null = null;

  if (typeof (headerSource as Headers).get === "function") {
    const h = headerSource as Headers;
    userAgent = h.get("user-agent");
    nextRouterPrefetch = h.get("next-router-prefetch");
    purpose = h.get("purpose");
    secPurpose = h.get("sec-purpose");
  } else {
    const record = headerSource as Record<string, string | string[] | undefined>;
    userAgent = (record["user-agent"] as string) || (record["User-Agent"] as string) || null;
    nextRouterPrefetch = (record["next-router-prefetch"] as string) || null;
    purpose = (record["purpose"] as string) || null;
    secPurpose = (record["sec-purpose"] as string) || null;
  }

  return isBotOrPrefetch({
    userAgent,
    nextRouterPrefetch,
    purpose,
    secPurpose,
    method,
  });
}

/**
 * Compute viewer_hash = sha256(ip + user-agent + daily salt)
 * Daily salt is derived from VIEW_HASH_SECRET + UTC date (YYYY-MM-DD).
 */
export function computeViewerHash(
  ip: string,
  userAgent: string,
  dateUtc: string,
  secretOverride?: string
): string {
  const secret = secretOverride || process.env.VIEW_HASH_SECRET || "default-salt-view-secret";

  if (process.env.NODE_ENV === "production" && !process.env.VIEW_HASH_SECRET && !secretOverride) {
    console.warn("[SECURITY WARNING]: VIEW_HASH_SECRET is missing in production.");
  }

  const dailySalt = createHash("sha256")
    .update(`${secret}:${dateUtc}`)
    .digest("hex");

  return createHash("sha256")
    .update(`${ip}:${userAgent}:${dailySalt}`)
    .digest("hex");
}
