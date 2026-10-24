import { describe, it, expect, vi, afterEach } from "vitest";
import {
  extractClientIp,
  checkRateLimit,
  getTrustedProxyCount,
  hashEmail,
} from "@/server/rate-limit";
import { db } from "@/db";

describe("extractClientIp (Leftmost-Trusted Proxy Rule)", () => {
  it("returns null (unknown IP) when TRUSTED_PROXY_COUNT <= 0 so clients do not share a single bucket", () => {
    const headers = { "x-forwarded-for": "198.51.100.42, 203.0.113.1" };
    expect(extractClientIp(headers, 0)).toBeNull();
    expect(extractClientIp(headers, -1)).toBeNull();
  });

  it("returns null when header is completely missing or null", () => {
    expect(extractClientIp({}, 1)).toBeNull();
    expect(extractClientIp(null, 1)).toBeNull();
  });

  it("returns null when header is empty or spaces only", () => {
    expect(extractClientIp({ "x-forwarded-for": "   " }, 1)).toBeNull();
  });

  it("extracts client IP with 1 trusted proxy (1st from last)", () => {
    // Single trusted reverse proxy (e.g. Cloudflare or Nginx)
    const headers = { "x-forwarded-for": "198.51.100.55" };
    expect(extractClientIp(headers, 1)).toBe("198.51.100.55");
  });

  it("ignores spoofed preceding headers when 1 trusted proxy is configured", () => {
    // Client sent "spoofed.attacker.com", trusted proxy appended real client IP "198.51.100.55"
    const headers = {
      "x-forwarded-for": "1.2.3.4, 5.6.7.8, 198.51.100.55",
    };
    expect(extractClientIp(headers, 1)).toBe("198.51.100.55");
  });

  it("extracts client IP with 2 trusted proxies (2nd from last)", () => {
    // Chain: Client (203.0.113.9) -> Proxy 1 (Cloudflare: 10.0.0.1) -> Proxy 2 (Load Balancer) -> App
    // x-forwarded-for: 203.0.113.9, 10.0.0.1
    const headers = {
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    };
    expect(extractClientIp(headers, 2)).toBe("203.0.113.9");
  });

  it("defeats spoofing with 2 trusted proxies", () => {
    // Attacker sent "1.1.1.1", real client is "203.0.113.9", proxy 1 is "10.0.0.1"
    const headers = {
      "x-forwarded-for": "1.1.1.1, 203.0.113.9, 10.0.0.1",
    };
    expect(extractClientIp(headers, 2)).toBe("203.0.113.9");
  });

  it("handles chain shorter than proxy count safely", () => {
    const headers = { "x-forwarded-for": "203.0.113.9" };
    // If only 1 IP is present but 2 proxies configured, return the leftmost available
    expect(extractClientIp(headers, 2)).toBe("203.0.113.9");
  });

  it("supports Web API Headers object", () => {
    const h = new Headers();
    h.set("x-forwarded-for", "1.2.3.4, 203.0.113.77");
    expect(extractClientIp(h, 1)).toBe("203.0.113.77");
  });
});

describe("getTrustedProxyCount & Production Guards", () => {
  const originalTrusted = process.env.TRUSTED_PROXY_COUNT;

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalTrusted !== undefined) {
      process.env.TRUSTED_PROXY_COUNT = originalTrusted;
    } else {
      delete process.env.TRUSTED_PROXY_COUNT;
    }
  });

  it("defaults to 0 in non-production environments when unset", () => {
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(getTrustedProxyCount()).toBe(0);
  });

  it("throws loud error in production when TRUSTED_PROXY_COUNT is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(() => getTrustedProxyCount()).toThrow(/TRUSTED_PROXY_COUNT is required in production/);
  });

  it("throws loud error in production when TRUSTED_PROXY_COUNT is empty or invalid", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.TRUSTED_PROXY_COUNT = "   ";
    expect(() => getTrustedProxyCount()).toThrow(/TRUSTED_PROXY_COUNT is required in production/);

    process.env.TRUSTED_PROXY_COUNT = "not-a-number";
    expect(() => getTrustedProxyCount()).toThrow(/TRUSTED_PROXY_COUNT is required in production/);
  });

  it("accepts valid numeric values in production (including 0)", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.TRUSTED_PROXY_COUNT = "0";
    expect(getTrustedProxyCount()).toBe(0);

    process.env.TRUSTED_PROXY_COUNT = "2";
    expect(getTrustedProxyCount()).toBe(2);
  });
});

describe("hashEmail helper", () => {
  it("normalises email by lowercasing and trimming, producing a sha256 hex string", () => {
    const hash1 = hashEmail("User@Example.COM ");
    const hash2 = hashEmail("user@example.com");
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces distinct hashes for distinct emails", () => {
    expect(hashEmail("a@example.com")).not.toBe(hashEmail("b@example.com"));
  });
});

describe("checkRateLimit atomic helper and cleanup", () => {
  it("increments atomically and blocks when exceeding maxCount", async () => {
    let mockCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle execute mock returns complex RowList in tests
    const executeSpy = (vi.spyOn(db, "execute") as any).mockImplementation(
      async () => {
        mockCount += 1;
        return [{ count: mockCount }];
      }
    );

    const res1 = await checkRateLimit("test-key-1", 2, 60);
    expect(res1.allowed).toBe(true);
    expect(res1.count).toBe(1);

    const res2 = await checkRateLimit("test-key-1", 2, 60);
    expect(res2.allowed).toBe(true);
    expect(res2.count).toBe(2);

    const res3 = await checkRateLimit("test-key-1", 2, 60);
    expect(res3.allowed).toBe(false);
    expect(res3.count).toBe(3);

    executeSpy.mockRestore();
  });

  it("triggers opportunistic cleanup query when forceCleanup is true", async () => {
    const executedQueries: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle execute mock returns complex RowList in tests
    const executeSpy = (vi.spyOn(db, "execute") as any).mockImplementation(
      async (queryObj: { queryChunks?: Array<{ value?: string[] }> }) => {
        // Collect query string fragments
        const sqlText = JSON.stringify(queryObj);
        executedQueries.push(sqlText);
        return [{ count: 1 }];
      }
    );

    await checkRateLimit("test-cleanup-key", 10, 60, { forceCleanup: true });

    // Should have executed both the INSERT/UPDATE query and the DELETE cleanup query
    expect(executedQueries.length).toBe(2);
    expect(executedQueries.some((q) => q.includes("DELETE FROM public.rate_limits"))).toBe(true);

    executeSpy.mockRestore();
  });
});
