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

describe("SubmissionActions Component - Resume Payment & Delete Messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockClear();
  });

  it("displays real friendly error when getStartupPaymentOrderAction returns an error message", async () => {
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
      expect(
        screen.getByText(
          "Limit reached: You have 3 submissions awaiting payment. Please complete or delete an existing unpaid submission before creating a new one."
        )
      ).toBeDefined();
    });
  });

  it("displays generic fallback when getStartupPaymentOrderAction fails without an explicit message", async () => {
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
      expect(screen.getByText("Failed to initiate payment.")).toBeDefined();
    });
  });

  it("displays 'Failed to open checkout.' when openRazorpayCheckout returns false", async () => {
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
      expect(screen.getByText("Failed to open checkout.")).toBeDefined();
    });
  });

  it("displays friendly error if resume payment throws an exception with message", async () => {
    vi.spyOn(actions, "getStartupPaymentOrderAction").mockRejectedValue(
      new Error("Network timeout contacting payment gateway.")
    );

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
      expect(screen.getByText("Network timeout contacting payment gateway.")).toBeDefined();
    });
  });

  it("displays friendly checkout in progress message when delete fails for recent unpaid draft", async () => {
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
      expect(screen.getByText(friendlyMsg)).toBeDefined();
    });
  });
});

