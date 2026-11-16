/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { resendVerificationAction } from "@/server/actions";
import * as captchaServer from "@/server/captcha";
import * as rateLimitServer from "@/server/rate-limit";
import SignUpPage from "@/app/signup/page";
import LoginPage from "@/app/login/page";
import * as actions from "@/server/actions";

const mockResend = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      resend: mockResend,
    },
  })),
  getCurrentUser: vi.fn(),
  getCurrentUserProfile: vi.fn(),
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/auth/google-sign-in-button", () => ({
  GoogleSignInButton: () => <div data-testid="google-signin">Google Sign In</div>,
}));

vi.mock("@/components/common/turnstile", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <div data-testid="turnstile-widget">
      <button
        type="button"
        data-testid="turnstile-verify"
        onClick={() => onVerify("mock-token")}
      >
        Verify
      </button>
    </div>
  ),
}));

describe("resendVerificationAction Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(rateLimitServer, "getRequestIp").mockResolvedValue("127.0.0.1");
    vi.spyOn(rateLimitServer, "checkRateLimit").mockResolvedValue({
      allowed: true,
      count: 1,
      maxCount: 10,
      resetInSeconds: 3600,
    });
    vi.spyOn(captchaServer, "verifyTurnstileToken").mockResolvedValue({
      success: true,
    });
  });

  const NEUTRAL_MSG =
    "If this email is registered and not yet verified, we've sent a new link.";

  it("returns the neutral success message for a valid unconfirmed email", async () => {
    mockResend.mockResolvedValueOnce({ data: {}, error: null });

    const res = await resendVerificationAction({
      email: "founder@example.com",
      captchaToken: "test-token",
    });

    expect(res).toEqual({
      success: true,
      message: NEUTRAL_MSG,
    });
    expect(mockResend).toHaveBeenCalledWith({
      type: "signup",
      email: "founder@example.com",
    });
  });

  it("returns the neutral success message for an unknown email (user not found) without discovery", async () => {
    mockResend.mockResolvedValueOnce({
      error: { message: "User not found" },
    });

    const res = await resendVerificationAction({
      email: "unknown@example.com",
      captchaToken: "test-token",
    });

    expect(res).toEqual({
      success: true,
      message: NEUTRAL_MSG,
    });
  });

  it("returns the neutral success message for an already-confirmed email", async () => {
    mockResend.mockResolvedValueOnce({
      error: { message: "Email already confirmed" },
    });

    const res = await resendVerificationAction({
      email: "verified@example.com",
      captchaToken: "test-token",
    });

    expect(res).toEqual({
      success: true,
      message: NEUTRAL_MSG,
    });
  });

  it("enforces Turnstile verification when token is invalid or missing", async () => {
    vi.spyOn(captchaServer, "verifyTurnstileToken").mockResolvedValueOnce({
      success: false,
      error: "Security verification failed.",
    });

    const res = await resendVerificationAction({
      email: "founder@example.com",
      captchaToken: "invalid-token",
    });

    expect(res).toEqual({
      error: "Security verification failed.",
    });
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("enforces rate limits per email hash (3 per hour)", async () => {
    vi.spyOn(rateLimitServer, "checkRateLimit").mockImplementation(
      async (key: string) => {
        if (key.startsWith("auth:resend:email:")) {
          return { allowed: false, count: 4, maxCount: 3, resetInSeconds: 3600 };
        }
        return { allowed: true, count: 1, maxCount: 10, resetInSeconds: 3600 };
      }
    );

    const res = await resendVerificationAction({
      email: "abuser@example.com",
      captchaToken: "test-token",
    });

    expect(res).toEqual({
      error: rateLimitServer.RATE_LIMIT_MESSAGE,
    });
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("enforces rate limits per IP (10 per hour)", async () => {
    vi.spyOn(rateLimitServer, "checkRateLimit").mockImplementation(
      async (key: string) => {
        if (key.startsWith("auth:resend:ip:")) {
          return { allowed: false, count: 11, maxCount: 10, resetInSeconds: 3600 };
        }
        return { allowed: true, count: 1, maxCount: 3, resetInSeconds: 3600 };
      }
    );

    const res = await resendVerificationAction({
      email: "founder@example.com",
      captchaToken: "test-token",
    });

    expect(res).toEqual({
      error: rateLimitServer.RATE_LIMIT_MESSAGE,
    });
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("maps Supabase rate-limit errors to friendly message without leaking raw text", async () => {
    mockResend.mockResolvedValueOnce({
      error: { message: "over_email_send_rate_limit: quota exceeded" },
    });

    const res = await resendVerificationAction({
      email: "founder@example.com",
      captchaToken: "test-token",
    });

    expect(res.error).toBe(rateLimitServer.RATE_LIMIT_MESSAGE);
    expect(res.error).not.toContain("over_email_send_rate_limit");
    expect(res.error).not.toContain("quota");
  });

  it("maps Supabase send failures to friendly message without leaking raw text", async () => {
    mockResend.mockResolvedValueOnce({
      error: { message: "Fatal internal SMTP connection refused at port 587" },
    });

    const res = await resendVerificationAction({
      email: "founder@example.com",
      captchaToken: "test-token",
    });

    expect(res.error).toBe("Something went wrong. Please try again.");
    expect(res.error).not.toContain("SMTP");
  });

  it("logs real error without leaking the user's email address", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockResend.mockResolvedValueOnce({
      error: { message: "Internal mailer timeout" },
    });

    await resendVerificationAction({
      email: "secret-user-email@example.com",
      captchaToken: "test-token",
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const allArgs = consoleErrorSpy.mock.calls.flat().join(" ");
    expect(allArgs).not.toContain("secret-user-email@example.com");
    expect(allArgs).toContain("Internal mailer timeout");

    consoleErrorSpy.mockRestore();
  });

  it("rejects invalid or missing email input", async () => {
    const resEmpty = await resendVerificationAction({ email: "" });
    expect(resEmpty).toEqual({ error: "Email is required." });

    const resInvalid = await resendVerificationAction({ email: "not-an-email" });
    expect(resInvalid).toEqual({ error: "Please enter a valid email address." });
  });

  it("accepts FormData input", async () => {
    mockResend.mockResolvedValueOnce({ data: {}, error: null });

    const formData = new FormData();
    formData.append("email", "founder@example.com");
    formData.append("captchaToken", "test-token");

    const res = await resendVerificationAction(formData);
    expect(res).toEqual({
      success: true,
      message: NEUTRAL_MSG,
    });
  });
});

describe("UI Integration - Signup and Login Pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows resend button on signup success screen, and clicking triggers countdown and neutral message", async () => {
    vi.spyOn(actions, "signUpAction").mockResolvedValue({
      success: true,
      needsConfirmation: true,
      email: "newfounder@example.com",
      message: "If an account exists, we sent an email.",
    });

    const resendSpy = vi.spyOn(actions, "resendVerificationAction").mockResolvedValue({
      success: true,
      message: "If this email is registered and not yet verified, we've sent a new link.",
    });

    render(<SignUpPage />);

    // Fill form and submit to reach success screen
    fireEvent.change(screen.getByPlaceholderText(/Ada Lovelace/i), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByPlaceholderText(/founder@example.com/i), {
      target: { value: "newfounder@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/At least 10 characters/i), {
      target: { value: "supersecret123" },
    });

    const submitBtn = screen.getByRole("button", { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Check your inbox")).toBeDefined();
    });

    // Check resend button is present
    const resendBtn = screen.getByRole("button", {
      name: /didn't get the email\? resend verification email/i,
    });
    expect(resendBtn).toBeDefined();

    // Click resend
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ email: "newfounder@example.com" })
      );
      expect(
        screen.getByText(
          "If this email is registered and not yet verified, we've sent a new link."
        )
      ).toBeDefined();
    });

    // Button should now be disabled and show countdown
    expect(screen.getByRole("button", { name: /resend in 60s/i })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /resend in 60s/i }).hasAttribute("disabled")
    ).toBe(true);
  });

  it("shows resend button on login page ONLY when error includes 'email not confirmed'", async () => {
    vi.spyOn(actions, "signInAction").mockResolvedValue({
      error: "Email not confirmed. Please verify your email before signing in.",
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/founder@example.com/i), {
      target: { value: "unconfirmed@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "supersecret123" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/email not confirmed\. please verify your email before signing in\./i)
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /resend verification email/i })
      ).toBeDefined();
    });
  });

  it("does NOT show resend button on login page for generic credential errors", async () => {
    vi.spyOn(actions, "signInAction").mockResolvedValue({
      error: "Email or password is incorrect.",
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/founder@example.com/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "wrongpassword123" },
    });

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Email or password is incorrect.")).toBeDefined();
      expect(
        screen.queryByRole("button", { name: /resend verification email/i })
      ).toBeNull();
    });
  });
});
