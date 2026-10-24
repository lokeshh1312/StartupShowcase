import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/db";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  maxCount: number;
  resetInSeconds: number;
}

export interface CheckRateLimitOptions {
  forceCleanup?: boolean;
  cleanupChance?: number;
}

/**
 * Returns TRUSTED_PROXY_COUNT.
 * In production (NODE_ENV=production), if TRUSTED_PROXY_COUNT is not explicitly set (even to 0),
 * throws a clear error, matching the NEXT_PUBLIC_SITE_URL guard pattern.
 */
export function getTrustedProxyCount(): number {
  const raw = process.env.TRUSTED_PROXY_COUNT;
  if (process.env.NODE_ENV === "production") {
    if (raw === undefined || raw.trim() === "" || isNaN(parseInt(raw, 10))) {
      throw new Error(
        `Production deployment error: TRUSTED_PROXY_COUNT is required in production (received: "${raw ?? ""}"). Set TRUSTED_PROXY_COUNT to match the number of reverse proxies in front of the application (set to 0 if the app directly receives client connections).`
      );
    }
    return parseInt(raw, 10);
  }

  // In development and test, default to 0 if not set or invalid
  if (raw === undefined || raw.trim() === "" || isNaN(parseInt(raw, 10))) {
    return 0;
  }
  return parseInt(raw, 10);
}

/**
 * Hash and normalise an email using sha256.
 * Never stores raw emails in rate_limits keys.
 */
export function hashEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Pure IP extractor adhering to the leftmost-trusted proxy rule.
 *
 * If trustedProxyCount <= 0:
 *   Headers cannot be trusted and direct socket IP is unavailable in server components,
 *   so returns null ("unknown").
 * If trustedProxyCount > 0:
 *   Selects the Nth-from-last entry in the comma-separated x-forwarded-for list.
 *   Returns null if header is missing or empty.
 */
export function extractClientIp(
  headerSource?: Headers | Record<string, string | string[] | undefined> | null,
  trustedProxyCount?: number
): string | null {
  const count =
    trustedProxyCount !== undefined
      ? trustedProxyCount
      : getTrustedProxyCount();

  // If 0 or negative trusted proxies, never trust any client-supplied header
  if (isNaN(count) || count <= 0) {
    return null;
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
    return null;
  }

  const entries = rawHeader
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return null;
  }

  if (entries.length < count) {
    // Chain shorter than trusted proxy count: pick leftmost available
    return entries[0];
  }

  // Leftmost-trusted rule: Nth from last
  const targetIndex = entries.length - count;
  return entries[targetIndex] || null;
}

/**
 * Retrieves client IP from current request headers using extractClientIp.
 * Returns null if IP is unknown or trustedProxyCount <= 0.
 */
export async function getRequestIp(): Promise<string | null> {
  try {
    const h = await headers();
    return extractClientIp(h);
  } catch {
    return null;
  }
}

/**
 * Atomic rate limiter helper using public.rate_limits table.
 * Executes a single atomic INSERT ... ON CONFLICT DO UPDATE ... RETURNING count statement.
 * Strictly no read-then-write race conditions.
 * Includes opportunistic cleanup: ~1 in 200 calls deletes rows older than 2 days.
 */
export async function checkRateLimit(
  key: string,
  maxCount: number,
  windowSeconds: number,
  options?: CheckRateLimitOptions
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

  // Opportunistic cleanup: ~1 in 200 calls (0.5%) deletes rate_limits rows older than 2 days
  const cleanupChance = options?.cleanupChance ?? 0.005;
  const shouldCleanup = options?.forceCleanup || Math.random() < cleanupChance;
  if (shouldCleanup) {
    try {
      await db.execute(sql`
        DELETE FROM public.rate_limits
        WHERE window_start < (NOW() - INTERVAL '2 days')
      `);
    } catch {
      // Best-effort cleanup must never throw or break rate limit checking
    }
  }

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
