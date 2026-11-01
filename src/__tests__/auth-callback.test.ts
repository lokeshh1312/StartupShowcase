import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

import { GET } from "@/app/auth/callback/route";

describe("OAuth Callback Route - GET /auth/callback", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SITE_URL = "https://startupshowcaseglobal.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("redirects to NEXT_PUBLIC_SITE_URL instead of request host (0.0.0.0:3000) on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?code=mock-auth-code&redirect=/me/submissions"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("https://startupshowcaseglobal.com/me/submissions");
    expect(location).not.toContain("0.0.0.0:3000");
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("mock-auth-code");
  });

  it("falls back to root path on NEXT_PUBLIC_SITE_URL when no redirect param is specified", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?code=mock-auth-code"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://startupshowcaseglobal.com/");
  });

  it("prevents open redirect when redirect param is an external or malicious URL", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?code=mock-auth-code&redirect=//evil.com/hack"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://startupshowcaseglobal.com/");
  });

  it("handles error param when user cancels or OAuth provider denies access", async () => {
    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?error=access_denied"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe(
      "https://startupshowcaseglobal.com/login?error=Sign%20in%20was%20cancelled."
    );
    expect(location).not.toContain("0.0.0.0:3000");
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("handles error_description param when returned by OAuth provider", async () => {
    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?error=access_denied&error_description=User%20denied%20consent"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe(
      "https://startupshowcaseglobal.com/login?error=User%20denied%20consent"
    );
    expect(location).not.toContain("0.0.0.0:3000");
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("handles code exchange failure and redirects to login with friendly error using getBaseUrl()", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      error: { message: "Invalid authorization code" },
    });

    const request = new NextRequest(
      "https://0.0.0.0:3000/auth/callback?code=expired-or-bad-code"
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe(
      "https://startupshowcaseglobal.com/login?error=Invalid%20authorization%20code"
    );
    expect(location).not.toContain("0.0.0.0:3000");
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("expired-or-bad-code");
  });
});

