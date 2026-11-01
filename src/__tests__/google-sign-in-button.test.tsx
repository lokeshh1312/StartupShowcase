/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import * as supabaseClient from "@/lib/supabase/client";

describe("GoogleSignInButton Component", () => {
  const originalEnv = process.env;
  const mockSignInWithOAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "true";
    process.env.NEXT_PUBLIC_SITE_URL = "https://startupshowcaseglobal.com";

    vi.spyOn(supabaseClient, "createClient").mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
      },
    } as unknown as ReturnType<typeof supabaseClient.createClient>);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("renders when Google auth is enabled", () => {
    render(<GoogleSignInButton />);
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeDefined();
  });

  it("shows friendly message when window.location.origin differs from NEXT_PUBLIC_SITE_URL without starting flow", async () => {
    // window.location.origin in jsdom defaults to http://localhost:3000
    // NEXT_PUBLIC_SITE_URL is https://startupshowcaseglobal.com
    render(<GoogleSignInButton />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);

    expect(
      screen.getByText(
        "Please open the site at https://startupshowcaseglobal.com to sign in with Google."
      )
    ).toBeDefined();
    expect(mockSignInWithOAuth).not.toHaveBeenCalled();
  });

  it("initiates OAuth flow when window.location.origin matches NEXT_PUBLIC_SITE_URL", async () => {
    // Set NEXT_PUBLIC_SITE_URL to match jsdom origin
    process.env.NEXT_PUBLIC_SITE_URL = window.location.origin;

    mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

    render(<GoogleSignInButton redirectPath="/me/submissions" />);

    const button = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(button);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=%2Fme%2Fsubmissions`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  });
});
