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

describe("SubmissionActions Component - Plan Selection & Payment Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRefresh.mockClear();
  });

  it("renders single Pay button when awaiting payment", () => {
    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
        plan="basic"
      />
    );

    expect(screen.getByRole("button", { name: /^Pay$/i })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Pay Rs 999/i })).toBeNull();
  });

  it("opens PlanPickerModal on clicking Pay, and choosing a plan passes selected plan to getStartupPaymentOrderAction", async () => {
    const getOrderSpy = vi.spyOn(actions, "getStartupPaymentOrderAction").mockImplementation(
      () => new Promise(() => {}) // keep in paying state
    );

    render(
      <SubmissionActions
        startupId="draft-1"
        startupName="Test Draft"
        slug="test-draft"
        status="awaiting_payment"
        plan="basic"
      />
    );

    const payBtn = screen.getByRole("button", { name: /^Pay$/i });
    fireEvent.click(payBtn);

    // Plan picker modal should appear
    expect(screen.getByText("Choose your listing plan")).toBeDefined();
    const selectBasicBtn = screen.getByRole("button", { name: /Choose Startup Listing plan/i });
    fireEvent.click(selectBasicBtn);

    expect(getOrderSpy).toHaveBeenCalledWith("draft-1", "basic");
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
        plan="basic"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^Pay$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Choose Startup Listing plan/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /^Pay$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Choose Startup Listing plan/i }));

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
      amount: 900,
      currency: "USD",
      keyId: "rzp_test_123",
      paymentRequired: true,
      plan: "basic",
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

    fireEvent.click(screen.getByRole("button", { name: /^Pay$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Choose Startup Listing plan/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /^Pay$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Choose Startup Listing plan/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined();
    });

    const backdrop = screen.getByRole("dialog");
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("shows 'Upgrade plan' button for pending or approved startups when effective plan is not investor_ready", () => {
    const { rerender } = render(
      <SubmissionActions
        startupId="startup-pending-1"
        startupName="Pending Startup"
        slug="pending-startup"
        status="pending"
        plan="basic"
      />
    );

    expect(screen.getByRole("button", { name: /Upgrade plan/i })).toBeDefined();

    rerender(
      <SubmissionActions
        startupId="startup-approved-1"
        startupName="Approved Startup"
        slug="approved-startup"
        status="approved"
        plan="investor_connect"
      />
    );
    expect(screen.getByRole("button", { name: /Upgrade plan/i })).toBeDefined();
  });

  it("does not show 'Upgrade plan' button when status is awaiting_payment, rejected, or already investor_ready", () => {
    const { rerender } = render(
      <SubmissionActions
        startupId="startup-awaiting-1"
        startupName="Awaiting Startup"
        slug="awaiting-startup"
        status="awaiting_payment"
        plan="basic"
      />
    );
    expect(screen.queryByRole("button", { name: /Upgrade plan/i })).toBeNull();

    rerender(
      <SubmissionActions
        startupId="startup-rejected-1"
        startupName="Rejected Startup"
        slug="rejected-startup"
        status="rejected"
        plan="basic"
      />
    );
    expect(screen.queryByRole("button", { name: /Upgrade plan/i })).toBeNull();

    rerender(
      <SubmissionActions
        startupId="startup-max-1"
        startupName="Max Plan Startup"
        slug="max-plan-startup"
        status="approved"
        plan="investor_ready"
      />
    );
    expect(screen.queryByRole("button", { name: /Upgrade plan/i })).toBeNull();
  });

  it("opens upgrade modal and clicking upgrade card triggers getStartupUpgradeOrderAction and checkout", async () => {
    const upgradeOrderSpy = vi
      .spyOn(actions, "getStartupUpgradeOrderAction")
      .mockResolvedValue({
        success: true,
        orderId: "order_upg_test_123",
        amount: 19000,
        currency: "USD",
        keyId: "test_key",
        paymentRequired: true,
        plan: "investor_connect",
        kind: "upgrade",
      });

    const openCheckoutSpy = vi
      .spyOn(razorpayClient, "openRazorpayCheckout")
      .mockResolvedValue(true);

    render(
      <SubmissionActions
        startupId="startup-1"
        startupName="My Startup"
        slug="my-startup"
        status="pending"
        plan="basic"
      />
    );

    const upgradeBtn = screen.getByRole("button", { name: /Upgrade plan/i });
    fireEvent.click(upgradeBtn);

    // Modal title and difference text should be visible
    expect(screen.getByText("Upgrade your plan")).toBeDefined();
    expect(
      screen.getByText("Pay only the difference. Your current plan is credited.")
    ).toBeDefined();

    // Since current is basic, target plans are investor_connect and investor_ready
    // Upgrade for $190
    expect(screen.getByText("Upgrade for $190")).toBeDefined();
    // Upgrade for $990
    expect(screen.getByText("Upgrade for $990")).toBeDefined();

    // Click investor_connect upgrade
    const chooseConnect = screen.getByRole("button", {
      name: /Choose Investor Connect plan, \$190/i,
    });
    fireEvent.click(chooseConnect);

    await waitFor(() => {
      expect(upgradeOrderSpy).toHaveBeenCalledWith("startup-1", "investor_connect");
      expect(openCheckoutSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "order_upg_test_123",
          amount: 19000,
          currency: "USD",
          startupName: "My Startup",
        })
      );
    });
  });
});
