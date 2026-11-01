/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubmissionActions } from "@/app/me/submissions/submission-actions";
import * as actions from "@/server/actions";
import * as razorpayClient from "@/lib/razorpay-client";

// Mock next/navigation
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SubmissionActions Component - Accessible Error Modal & Dual Currency Payment Buttons", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockClear();
  });

  it("renders both INR and USD payment buttons when awaiting payment", () => {
    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
        priceInr="Rs 999"
        priceUsd="$10"
      />
    );

    expect(screen.getByRole("button", { name: /Pay Rs 999 \(UPI \/ QR \/ cards\)/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Pay \$10 \(international card\)/i })).toBeDefined();
  });

  it("passes selected currency (INR or USD) to getStartupPaymentOrderAction and shares paying state", async () => {
    const getOrderSpy = vi.spyOn(actions, "getStartupPaymentOrderAction").mockImplementation(
      () => new Promise(() => {}) // never resolves to keep in paying state
    );

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    const inrBtn = screen.getByRole("button", { name: /Pay Rs 999/i });
    const usdBtn = screen.getByRole("button", { name: /Pay \$10/i });

    fireEvent.click(inrBtn);

    expect(getOrderSpy).toHaveBeenCalledWith("draft-1", "INR");

    // Both buttons should now be disabled and share the loading state
    await waitFor(() => {
      expect(inrBtn.hasAttribute("disabled")).toBe(true);
      expect(usdBtn.hasAttribute("disabled")).toBe(true);
    });
  });

  it("displays payment error in a modal dialog with title 'Payment couldn't start'", async () => {
    vi.spyOn(actions, "getStartupPaymentOrderAction").mockResolvedValue({
      error: "Limit reached: You have 3 submissions awaiting payment. Please complete or delete an existing unpaid submission before creating a new one.",
    });

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    const inrBtn = screen.getByRole("button", { name: /Pay Rs 999/i });
    fireEvent.click(inrBtn);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute("aria-modal")).toBe("true");
      expect(screen.getByText("Payment couldn't start")).toBeDefined();
      expect(
        screen.getByText(
          "Limit reached: You have 3 submissions awaiting payment. Please complete or delete an existing unpaid submission before creating a new one."
        )
      ).toBeDefined();
    });

    // Verify closing on OK click
    const okBtn = screen.getByRole("button", { name: /^OK$/i });
    fireEvent.click(okBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("displays generic fallback in modal when getStartupPaymentOrderAction fails without explicit message", async () => {
    vi.spyOn(actions, "getStartupPaymentOrderAction").mockResolvedValue({
      error: "",
    });

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    const usdBtn = screen.getByRole("button", { name: /Pay \$10/i });
    fireEvent.click(usdBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Payment couldn't start")).toBeDefined();
      expect(screen.getByText("Failed to initiate payment.")).toBeDefined();
    });
  });

  it("displays 'Failed to open checkout.' in modal when openRazorpayCheckout returns false", async () => {
    vi.spyOn(actions, "getStartupPaymentOrderAction").mockResolvedValue({
      success: true,
      orderId: "order_123",
      amount: 1000,
      currency: "USD",
      keyId: "rzp_test_123",
      paymentRequired: true,
    });
    vi.spyOn(razorpayClient, "openRazorpayCheckout").mockResolvedValue(false);

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    const usdBtn = screen.getByRole("button", { name: /Pay \$10/i });
    fireEvent.click(usdBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Payment couldn't start")).toBeDefined();
      expect(screen.getByText("Failed to open checkout.")).toBeDefined();
    });
  });

  it("displays delete error in a modal dialog with title 'Can't delete this draft' and closes on Escape", async () => {
    const friendlyMsg =
      "This draft has a checkout in progress. It can be deleted after 7 days, or you can edit it or resume payment.";

    vi.spyOn(actions, "deleteStartupAction").mockResolvedValue({
      error: friendlyMsg,
    });

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    // First click initiates confirmation prompt
    const deleteBtn = screen.getByRole("button", { name: /^Delete$/i });
    fireEvent.click(deleteBtn);

    // Second click confirms delete
    const confirmBtn = screen.getByRole("button", { name: /Confirm Delete\?/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeDefined();
      expect(dialog.getAttribute("aria-modal")).toBe("true");
      expect(screen.getByText("Can't delete this draft")).toBeDefined();
      expect(screen.getByText(friendlyMsg)).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^OK$/i })).toBeDefined();
    });
    // Press Escape to close modal
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("closes modal on backdrop click", async () => {
    vi.spyOn(actions, "getStartupPaymentOrderAction").mockResolvedValue({
      error: "Some payment error",
    });

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Pay Rs 999/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    const backdrop = screen.getByRole("dialog");
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
