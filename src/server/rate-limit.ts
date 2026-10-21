import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  maxCount: number;
  resetInSeconds: number;
}

/**
 * Pure IP extractor adhering to the leftmost-trusted proxy rule.
 *
 * If trustedProxyCount <= 0 (default):
 *   Ignores x-forwarded-for entirely and returns the non-spoofable fallback IP.
 * If trustedProxyCount > 0:
 *   Selects the Nth-from-last entry in the comma-separated x-forwarded-for list.
 */
export function extractClientIp(
  headerSource?: Headers | Record<string, string | string[] | undefined> | null,
  trustedProxyCount?: number
): string {
  const count =
    trustedProxyCount !== undefined
      ? trustedProxyCount
      : parseInt(process.env.TRUSTED_PROXY_COUNT || "0", 10);

  // If 0 or negative trusted proxies, never trust any client-supplied header
  if (isNaN(count) || count <= 0) {
    return "127.0.0.1";
  }

  let rawHeader: string | undefined;

  if (headerSource) {
    if (typeof (headerSource as Headers).get === "function") {
      rawHeader = (headerSource as Headers).get("x-forwarded-for") ?? undefined;
    } else {
      const record = headerSource as Record<string, string | string[] | undefined>;
      const val = record["x-forwarded-for"] || record["X-Forwarded-For"];
      if (Array.isArray(val)) {
        rawHeader = val.join(", ");
      } else if (typeof val === "string") {
        rawHeader = val;
      }
    }
  }

  if (!rawHeader || !rawHeader.trim()) {
    return "127.0.0.1";
  }

  const entries = rawHeader
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return "127.0.0.1";
  }

  if (entries.length < count) {
    // Chain shorter than trusted proxy count: pick leftmost available
    return entries[0];
  }

  // Leftmost-trusted rule: Nth from last
  const targetIndex = entries.length - count;
  return entries[targetIndex] || "127.0.0.1";
}

/**
 * Retrieves client IP from current request headers using extractClientIp
 */
export async function getRequestIp(): Promise<string> {
  try {
    const h = await headers();
    return extractClientIp(h);
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Atomic rate limiter helper using public.rate_limits table.
 * Executes a single atomic INSERT ... ON CONFLICT DO UPDATE ... RETURNING count statement.
 * Strictly no read-then-write race conditions.
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);

  const rows = await db.execute<{ count: string | number }>(sql`
    INSERT INTO public.rate_limits (key, window_start, count)
    VALUES (${key}, ${windowStart.toISOString()}::timestamptz, 1)
    ON CONFLICT (key, window_start)
    DO UPDATE SET count = public.rate_limits.count + 1
    RETURNING count
  `);

  const count = Number(rows[0]?.count ?? 1);
  const resetInSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + windowMs - now) / 1000)
  );

  return {
    allowed: count <= maxCount,
    count,
    maxCount,
    resetInSeconds,
  };
}

/**
 * Friendly rate limit error message
 */
export const RATE_LIMIT_MESSAGE = "Too many attempts, try again later.";
