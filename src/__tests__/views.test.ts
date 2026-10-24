import { describe, it, expect } from "vitest";
import {
  isBotOrPrefetch,
  isBotOrPrefetchFromHeaders,
  computeViewerHash,
} from "@/server/views";

describe("isBotOrPrefetch and bot/prefetch filtering", () => {
  it("allows standard desktop browser user agents", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(isBotOrPrefetch({ userAgent: ua })).toBe(false);
  });

  it("allows standard mobile browser user agents", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(isBotOrPrefetch({ userAgent: ua })).toBe(false);
  });

  it("filters known search engine crawlers and bots", () => {
    expect(isBotOrPrefetch({ userAgent: "Googlebot/2.1 (+http://www.google.com/bot.html)" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "Twitterbot/1.0" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "curl/7.88.1" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "Wget/1.21.3" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "Applebot/0.1" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "DuckDuckBot/1.0" })).toBe(true);
  });

  it("filters empty or missing user agents", () => {
    expect(isBotOrPrefetch({ userAgent: "" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: "   " })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: null })).toBe(true);
  });

  it("filters HEAD requests", () => {
    const ua = "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36";
    expect(isBotOrPrefetch({ userAgent: ua, method: "HEAD" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: ua, method: "head" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: ua, method: "GET" })).toBe(false);
  });

  it("filters Next.js prefetch requests (next-router-prefetch)", () => {
    const ua = "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36";
    expect(isBotOrPrefetch({ userAgent: ua, nextRouterPrefetch: "1" })).toBe(true);
  });

  it("filters browser prefetch requests (purpose / sec-purpose: prefetch)", () => {
    const ua = "Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36";
    expect(isBotOrPrefetch({ userAgent: ua, purpose: "prefetch" })).toBe(true);
    expect(isBotOrPrefetch({ userAgent: ua, secPurpose: "prefetch" })).toBe(true);
  });

  it("inspects headers correctly with isBotOrPrefetchFromHeaders", () => {
    const validHeaders = new Headers();
    validHeaders.set(
      "user-agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
    );
    expect(isBotOrPrefetchFromHeaders(validHeaders)).toBe(false);

    const prefetchHeaders = new Headers();
    prefetchHeaders.set(
      "user-agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
    );
    prefetchHeaders.set("next-router-prefetch", "1");
    expect(isBotOrPrefetchFromHeaders(prefetchHeaders)).toBe(true);
  });
});

describe("computeViewerHash", () => {
  const ip = "198.51.100.1";
  const ua = "Mozilla/5.0 Chrome/120.0.0.0";
  const dateStr = "2026-10-21";
  const secret = "test-secret-salt-123";

  it("is deterministic for identical input", () => {
    const hash1 = computeViewerHash(ip, ua, dateStr, secret);
    const hash2 = computeViewerHash(ip, ua, dateStr, secret);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // 64 char hex sha256
  });

  it("differs when IP changes", () => {
    const hash1 = computeViewerHash(ip, ua, dateStr, secret);
    const hash2 = computeViewerHash("198.51.100.2", ua, dateStr, secret);
    expect(hash1).not.toBe(hash2);
  });

  it("differs when user-agent changes", () => {
    const hash1 = computeViewerHash(ip, ua, dateStr, secret);
    const hash2 = computeViewerHash(ip, "Mozilla/5.0 Firefox/120.0", dateStr, secret);
    expect(hash1).not.toBe(hash2);
  });

  it("differs across distinct days (daily salt rotation)", () => {
    const hashDay1 = computeViewerHash(ip, ua, "2026-10-21", secret);
    const hashDay2 = computeViewerHash(ip, ua, "2026-10-22", secret);
    expect(hashDay1).not.toBe(hashDay2);
  });

  it("differs when secret changes", () => {
    const hash1 = computeViewerHash(ip, ua, dateStr, "secret-a");
    const hash2 = computeViewerHash(ip, ua, dateStr, "secret-b");
    expect(hash1).not.toBe(hash2);
  });
});
