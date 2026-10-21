import { describe, it, expect, vi } from "vitest";
import { extractClientIp, checkRateLimit } from "@/server/rate-limit";
import { db } from "@/db";

describe("extractClientIp (Leftmost-Trusted Proxy Rule)", () => {
  it("defaults to ignoring x-forwarded-for when TRUSTED_PROXY_COUNT = 0", () => {
    const headers = { "x-forwarded-for": "198.51.100.42, 203.0.113.1" };
    expect(extractClientIp(headers, 0)).toBe("127.0.0.1");
  });

  it("returns fallback IP when header is completely missing", () => {
    expect(extractClientIp({}, 1)).toBe("127.0.0.1");
    expect(extractClientIp(null, 1)).toBe("127.0.0.1");
  });

  it("returns fallback IP when header is empty or spaces only", () => {
    expect(extractClientIp({ "x-forwarded-for": "   " }, 1)).toBe("127.0.0.1");
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

describe("checkRateLimit atomic helper", () => {
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
});
