/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminPanel } from "@/components/admin/admin-panel";
import * as actions from "@/server/actions";

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

describe("AdminPanel Component - Approved Tab & Moderation", () => {
  const dummyApprovedStartup = {
    id: "approved-1",
    name: "Acme Cloud",
    slug: "acme-cloud",
    tagline: "The best cloud for builders",
    description: "Detailed description of Acme Cloud platform.",
    category: "Developer Tools",
    stage: "Seed",
    countryCode: "US",
    createdAt: new Date("2026-10-01T12:00:00Z"),
    status: "approved" as const,
    monthLabel: "October 2026",
    paymentAmountCents: 1000,
    paymentCurrency: "USD",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Reject / Unpublish button on the Approved tab and no delete button", () => {
    render(
      <AdminPanel
        initialPending={[]}
        initialApproved={[dummyApprovedStartup]}
        initialRejected={[]}
        auditLogs={[]}
      />
    );

    // Switch to Approved tab
    const approvedTab = screen.getByRole("button", { name: /Approved \(1\)/i });
    fireEvent.click(approvedTab);

    // Verify startup name is visible
    expect(screen.getByText("Acme Cloud")).toBeDefined();

    // Verify Reject / Unpublish button is present
    const rejectBtn = screen.getByRole("button", { name: /Reject \/ Unpublish/i });
    expect(rejectBtn).toBeDefined();

    // Ensure NO delete button exists anywhere in the panel for approved startups
    const deleteBtn = screen.queryByRole("button", { name: /delete/i });
    expect(deleteBtn).toBeNull();
  });

  it("opens the rejection dialog, submits with reason, and moves startup from Approved to Rejected tab", async () => {
    const moderateSpy = vi
      .spyOn(actions, "moderateStartupAction")
      .mockResolvedValue({
        success: true,
        startup: {
          ...dummyApprovedStartup,
          status: "rejected",
        } as unknown as NonNullable<
          Awaited<ReturnType<typeof actions.moderateStartupAction>>["startup"]
        >,
      });

    render(
      <AdminPanel
        initialPending={[]}
        initialApproved={[dummyApprovedStartup]}
        initialRejected={[]}
        auditLogs={[]}
      />
    );

    // Switch to Approved tab
    fireEvent.click(screen.getByRole("button", { name: /Approved \(1\)/i }));

    // Click Reject / Unpublish
    const rejectBtn = screen.getByRole("button", { name: /Reject \/ Unpublish/i });
    fireEvent.click(rejectBtn);

    // Modal should be open
    expect(screen.getByText(/Reject Submission: Acme Cloud/i)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/e\.g\. Please provide a working prototype demo/i);
    fireEvent.change(textarea, { target: { value: "Violates terms of service." } });

    const confirmBtn = screen.getByRole("button", { name: /Confirm Rejection/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(moderateSpy).toHaveBeenCalledWith(
        "approved-1",
        "rejected",
        "Violates terms of service."
      );
    });

    // Startup should be removed from Approved tab
    await waitFor(() => {
      expect(screen.getByText("No approved startups in this view.")).toBeDefined();
    });

    // Switch to Rejected tab and verify startup is now listed there with reason
    fireEvent.click(screen.getByRole("button", { name: /Rejected \(1\)/i }));
    expect(screen.getByText("Acme Cloud")).toBeDefined();
    expect(screen.getByText("Reason: Violates terms of service.")).toBeDefined();
  });
});

