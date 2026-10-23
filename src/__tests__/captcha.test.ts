import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "@/server/captcha";

describe("Cloudflare Turnstile CAPTCHA Verification", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("gracefully bypasses verification when TURNSTILE_SECRET_KEY is unset in development", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const res = await verifyTurnstileToken("dummy-token", "127.0.0.1");
    expect(res.success).toBe(true);
  });

  it("fails when token is missing and TURNSTILE_SECRET_KEY is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    const res = await verifyTurnstileToken("", "127.0.0.1");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Security verification required");
  });

  it("fails when Cloudflare siteverify rejects the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    } as unknown as Response);

    const res = await verifyTurnstileToken("invalid-token", "192.0.2.1");
    expect(res.success).toBe(false);
    expect(res.error).toContain("CAPTCHA validation failed");
    expect(res.errorCodes).toContain("invalid-input-response");
  });

  it("succeeds when Cloudflare siteverify accepts the token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as unknown as Response);

    const res = await verifyTurnstileToken("valid-cf-token", "192.0.2.1");
    expect(res.success).toBe(true);
  });

  it("handles fetch network failure gracefully", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network timeout"));

    const res = await verifyTurnstileToken("any-token", "192.0.2.1");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Unable to verify CAPTCHA");
  });
});
