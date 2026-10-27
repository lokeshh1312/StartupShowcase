import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { extractCaptchaToken, verifyTurnstileToken } from "@/server/captcha";
import * as captchaModule from "@/server/captcha";
import { signUpAction, forgotPasswordAction, resetPasswordAction } from "@/server/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

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

describe("extractCaptchaToken Helper", () => {
  it("extracts token from standard 'captchaToken' field in FormData", () => {
    const formData = new FormData();
    formData.append("captchaToken", "token-from-captchaToken");
    expect(extractCaptchaToken(formData)).toBe("token-from-captchaToken");
  });

  it("extracts token from legacy 'turnstileToken' field in FormData", () => {
    const formData = new FormData();
    formData.append("turnstileToken", "token-from-turnstileToken");
    expect(extractCaptchaToken(formData)).toBe("token-from-turnstileToken");
  });

  it("extracts token from default 'cf-turnstile-response' field in FormData", () => {
    const formData = new FormData();
    formData.append("cf-turnstile-response", "token-from-cf-turnstile-response");
    expect(extractCaptchaToken(formData)).toBe("token-from-cf-turnstile-response");
  });

  it("prioritizes candidate keys in order: captchaToken > turnstileToken > cf-turnstile-response", () => {
    const formData = new FormData();
    formData.append("captchaToken", "first-choice");
    formData.append("turnstileToken", "second-choice");
    formData.append("cf-turnstile-response", "third-choice");
    expect(extractCaptchaToken(formData)).toBe("first-choice");

    const formData2 = new FormData();
    formData2.append("turnstileToken", "second-choice");
    formData2.append("cf-turnstile-response", "third-choice");
    expect(extractCaptchaToken(formData2)).toBe("second-choice");
  });

  it("returns undefined when token value is empty string or only whitespace", () => {
    const fd1 = new FormData();
    fd1.append("captchaToken", "");
    expect(extractCaptchaToken(fd1)).toBeUndefined();

    const fd2 = new FormData();
    fd2.append("captchaToken", "   ");
    expect(extractCaptchaToken(fd2)).toBeUndefined();

    const fd3 = new FormData();
    fd3.append("turnstileToken", "");
    fd3.append("cf-turnstile-response", "  ");
    expect(extractCaptchaToken(fd3)).toBeUndefined();
  });

  it("returns undefined when CAPTCHA fields are missing or FormData is empty", () => {
    const emptyFd = new FormData();
    expect(extractCaptchaToken(emptyFd)).toBeUndefined();

    const otherFd = new FormData();
    otherFd.append("email", "test@example.com");
    expect(extractCaptchaToken(otherFd)).toBeUndefined();
  });

  it("returns undefined when passed null or undefined", () => {
    expect(extractCaptchaToken(null)).toBeUndefined();
    expect(extractCaptchaToken(undefined)).toBeUndefined();
  });

  it("works with URLSearchParams and plain JavaScript objects", () => {
    const params = new URLSearchParams();
    params.set("captchaToken", "url-param-token");
    expect(extractCaptchaToken(params)).toBe("url-param-token");

    expect(extractCaptchaToken({ captchaToken: "obj-token" })).toBe("obj-token");
    expect(extractCaptchaToken({ turnstileToken: "obj-turnstile" })).toBe("obj-turnstile");
    expect(extractCaptchaToken({ "cf-turnstile-response": "obj-cf" })).toBe("obj-cf");
    expect(extractCaptchaToken({ otherKey: "other" })).toBeUndefined();
  });
});

describe("Server Actions - Client Field Integration & Token Verification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("signUpAction passes the token from the client's real field name 'captchaToken' to verifyTurnstileToken", async () => {
    const verifySpy = vi
      .spyOn(captchaModule, "verifyTurnstileToken")
      .mockResolvedValueOnce({
        success: false,
        error: "CAPTCHA mock rejected for testing",
      });

    const formData = new FormData();
    formData.append("name", "Test Founder");
    formData.append("email", "founder@example.com");
    formData.append("password", "SecurePassword123!");
    formData.append("role", "founder");
    // Client's real field name
    formData.append("captchaToken", "real-client-turnstile-token-xyz");

    const res = await signUpAction(formData);

    // Verify spy received the exact token extracted from captchaToken
    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(verifySpy.mock.calls[0][0]).toBe("real-client-turnstile-token-xyz");
    expect(res).toEqual({ error: "CAPTCHA mock rejected for testing" });
  });

  it("forgotPasswordAction and resetPasswordAction pass the token from 'captchaToken'", async () => {
    const verifySpy = vi
      .spyOn(captchaModule, "verifyTurnstileToken")
      .mockResolvedValue({
        success: false,
        error: "Mock verification failure",
      });

    // forgotPasswordAction
    const forgotFd = new FormData();
    forgotFd.append("email", "user@example.com");
    forgotFd.append("captchaToken", "forgot-token-123");

    const forgotRes = await forgotPasswordAction(forgotFd);
    expect(verifySpy.mock.calls[0][0]).toBe("forgot-token-123");
    expect(forgotRes).toEqual({ error: "Mock verification failure" });

    // resetPasswordAction
    const resetFd = new FormData();
    resetFd.append("password", "NewSecurePassword123!");
    resetFd.append("captchaToken", "reset-token-456");

    const resetRes = await resetPasswordAction(resetFd);
    expect(verifySpy.mock.calls[1][0]).toBe("reset-token-456");
    expect(resetRes).toEqual({ error: "Mock verification failure" });
  });
});

describe("Client Form - Server Field Name Contract Test", () => {
  it("ensures every client page appending a CAPTCHA token uses a field name recognized by extractCaptchaToken", () => {
    const clientFormFiles = [
      "src/app/signup/page.tsx",
      "src/app/forgot-password/page.tsx",
      "src/app/reset-password/page.tsx",
    ];

    for (const relPath of clientFormFiles) {
      const fullPath = path.resolve(process.cwd(), relPath);
      const content = fs.readFileSync(fullPath, "utf-8");

      // Match formData.append("fieldName", turnstileToken) or similar
      const appendMatch = content.match(/formData\.append\(\s*["']([^"']+)["']\s*,\s*turnstileToken\s*\)/);
      expect(
        appendMatch,
        `Expected ${relPath} to append turnstileToken to FormData`
      ).not.toBeNull();

      const fieldName = appendMatch![1];

      // Simulate a FormData with that field name and verify extractCaptchaToken recognizes it
      const testFd = new FormData();
      const testTokenValue = `test-token-from-${fieldName}`;
      testFd.append(fieldName, testTokenValue);

      const extracted = extractCaptchaToken(testFd);
      expect(
        extracted,
        `Server extractCaptchaToken must read field name '${fieldName}' used by ${relPath}`
      ).toBe(testTokenValue);
    }
  });
});
