/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { SubmitStartupForm } from "@/components/startup/submit-form";
import * as actions from "@/server/actions";
import * as razorpayClient from "@/lib/razorpay-client";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

// Mock TurnstileWidget
vi.mock("@/components/common/turnstile", () => ({
  TurnstileWidget: ({ onVerify }: { onVerify: (token: string) => void }) => (
    <div data-testid="turnstile-mock">
      <button
        type="button"
        data-testid="turnstile-verify-btn"
        onClick={() => onVerify("mock-token")}
      >
        Verify Captcha
      </button>
    </div>
  ),
}));

describe("Razorpay Client error handling", () => {
  const originalRazorpay = window.Razorpay;

  afterEach(() => {
    window.Razorpay = originalRazorpay;
    vi.restoreAllMocks();
  });

  it("returns false if script fails to load or window.Razorpay is absent", async () => {
    delete (window as unknown as { Razorpay?: unknown }).Razorpay;
    // mock querySelector to simulate script load error
    vi.spyOn(document, "querySelector").mockReturnValue(null);
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      const script = node as HTMLScriptElement;
      setTimeout(() => script.onerror?.(new Event("error")), 0);
      return script;
    });

    const result = await openRazorpayCheckout({
      keyId: "rzp_test_123",
      orderId: "order_123",
      amount: 1000,
      currency: "USD",
      startupName: "Test Startup",
      onSuccess: vi.fn(),
    });

    expect(result).toBe(false);
  });

  it("returns false if the Razorpay constructor throws an error", async () => {
    (window as unknown as { Razorpay: unknown }).Razorpay = class {
      constructor() {
        throw new Error("Razorpay blocked by client extension");
      }
      open() {}
      on() {}
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await openRazorpayCheckout({
      keyId: "rzp_test_123",
      orderId: "order_123",
      amount: 1000,
      currency: "USD",
      startupName: "Test Startup",
      onSuccess: vi.fn(),
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("returns false if rzp.open() throws an error", async () => {
    (window as unknown as { Razorpay: unknown }).Razorpay = class {
      open() {
        throw new Error("Popup blocked");
      }
      on() {}
    };

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await openRazorpayCheckout({
      keyId: "rzp_test_123",
      orderId: "order_123",
      amount: 1000,
      currency: "USD",
      startupName: "Test Startup",
      onSuccess: vi.fn(),
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it("returns true when constructor and open() succeed", async () => {
    const openMock = vi.fn();
    (window as unknown as { Razorpay: unknown }).Razorpay = class {
      open = openMock;
      on() {}
    };

    const result = await openRazorpayCheckout({
      keyId: "rzp_test_123",
      orderId: "order_123",
      amount: 1000,
      currency: "USD",
      startupName: "Test Startup",
      onSuccess: vi.fn(),
    });

    expect(result).toBe(true);
    expect(openMock).toHaveBeenCalled();
  });
});

describe("SubmitStartupForm feedback & error handling", () => {
  const dummyCountries = [{ code: "US", name: "United States" }];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fillForm = () => {
    fireEvent.change(screen.getByPlaceholderText("e.g. Acme AI, TerraVolt"), {
      target: { value: "My Startup" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Autonomous irrigation networks powered by edge intelligence"),
      {
        target: { value: "A breakthrough product for builders everywhere" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("Describe what you are building, how it works, and why it matters..."),
      {
        target: {
          value:
            "This is a comprehensive description of our revolutionary startup product and market opportunity.",
        },
      }
    );
  };

  it("displays generic submission error when startTransition throws", async () => {
    vi.spyOn(actions, "submitStartupAction").mockRejectedValue(
      new Error("Network connection dropped")
    );

    render(<SubmitStartupForm countries={dummyCountries} />);

    fillForm();

    const submitBtn = screen.getByRole("button", { name: /Pay \$10|Submit and pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const err = screen.getByText("Something went wrong submitting your startup. Please try again.");
      expect(err).toBeDefined();
    });
  });

  it("displays 'No response from the server. Please try again.' when submitStartupAction returns empty result", async () => {
    // Neither res.error nor res.startup exists
    vi.spyOn(actions, "submitStartupAction").mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof actions.submitStartupAction>>
    );

    render(<SubmitStartupForm countries={dummyCountries} />);

    fillForm();

    const submitBtn = screen.getByRole("button", { name: /Pay \$10|Submit and pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const err = screen.getByText("No response from the server. Please try again.");
      expect(err).toBeDefined();
    });
  });

  it("displays ad-blocker guidance when openRazorpayCheckout returns false", async () => {
    vi.spyOn(actions, "submitStartupAction").mockResolvedValue({
      success: true,
      startup: { id: "s1", name: "Pending Co", slug: "pending-co" } as unknown as NonNullable<
        Awaited<ReturnType<typeof actions.submitStartupAction>>["startup"]
      >,
      paymentRequired: true,
      order: {
        orderId: "order_123",
        amount: 1000,
        currency: "USD",
        keyId: "rzp_test_123",
      },
    });

    // openRazorpayCheckout returns false (e.g. ad blocker)
    vi.spyOn(razorpayClient, "openRazorpayCheckout").mockResolvedValue(false);

    render(<SubmitStartupForm countries={dummyCountries} />);

    fillForm();

    const submitBtn = screen.getByRole("button", { name: /Pay \$10|Submit and pay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const err = screen.getByText(
        "We couldn't open the payment window. Turn off your ad blocker or Brave Shields for this site, then click Pay again."
      );
      expect(err).toBeDefined();
    });
  });
});
