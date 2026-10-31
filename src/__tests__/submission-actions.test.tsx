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

describe("SubmissionActions Component - Accessible Error Modal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockClear();
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

    const resumeBtn = screen.getByRole("button", { name: /Resume Payment/i });
    fireEvent.click(resumeBtn);

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

    const resumeBtn = screen.getByRole("button", { name: /Resume Payment/i });
    fireEvent.click(resumeBtn);

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

    const resumeBtn = screen.getByRole("button", { name: /Resume Payment/i });
    fireEvent.click(resumeBtn);

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

    fireEvent.click(screen.getByRole("button", { name: /Resume Payment/i }));

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
