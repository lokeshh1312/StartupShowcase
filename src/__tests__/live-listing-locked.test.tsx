/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import SubmitPage from "@/app/submit/page";
import MySubmissionsPage from "@/app/me/submissions/page";
import * as supabaseServer from "@/lib/supabase/server";
import * as startupServer from "@/server/startups";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

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

vi.mock("@/components/startup/submit-form", () => ({
  SubmitStartupForm: () => <div data-testid="submit-startup-form">Form</div>,
}));

vi.mock("@/app/me/submissions/submission-actions", () => ({
  SubmissionActions: ({ status }: { status: string }) => (
    <div data-testid={`submission-actions-${status}`} />
  ),
}));

function makeStartup(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    name: "Nova Flow",
    slug: "nova-flow",
    tagline: "Global workflow automation",
    ideaTitle: "Nova Flow",
    description: "Description",
    fullStory: "",
    category: "SaaS",
    stage: "MVP",
    countryCode: "US",
    region: "CA",
    city: "San Francisco",
    remoteFirst: false,
    location: "San Francisco, CA, United States",
    month: "2026-11-01",
    monthLabel: "November 2026",
    websiteUrl: "https://novaflow.example.com",
    logoType: "upload",
    logoColor: "#2563EB",
    thumbnail: "",
    coverImage: "",
    founderJson: {},
    problem: "",
    solution: "",
    keyFeaturesJson: [],
    techStackJson: [],
    traction: "",
    viewsCount: 0,
    reviewedBy: null,
    approvedAt: new Date("2026-11-01"),
    createdAt: new Date("2026-11-01"),
    updatedAt: new Date("2026-11-01"),
    ownerId: "owner-1",
    status: "approved",
    plan: "basic",
    paymentStatus: "paid",
    paymentAmountCents: 900,
    paymentCurrency: "USD",
    razorpayPaymentId: null,
    paymentAmountRefundedCents: 0,
    likes: 10,
    views: 20,
    isSample: false,
    ...overrides,
  };
}

describe("Live listing locked UX - /submit and /me/submissions", () => {
  const originalEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  });

  afterEach(() => {
    if (originalEmail !== undefined) {
      process.env.NEXT_PUBLIC_CONTACT_EMAIL = originalEmail;
    } else {
      delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;
    }
  });

  describe("/submit?edit=<slug>", () => {
    it("renders the locked notice and no form when owner opens an approved startup", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
        user: { id: "owner-1" } as never,
        profile: { id: "owner-1", role: "founder", displayName: "Founder" } as never,
      });
      vi.spyOn(startupServer, "getStartupBySlug").mockResolvedValue({
        startup: makeStartup({ status: "approved", ownerId: "owner-1" }) as never,
        comments: [],
      });

      const ui = await SubmitPage({
        searchParams: Promise.resolve({ edit: "nova-flow" }),
      });
      render(ui);

      expect(screen.queryByTestId("submit-startup-form")).toBeNull();
      expect(screen.getAllByText("This listing is live").length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          "Live listings can be updated by our team. Email contact@startupshowcaseglobal.com with your changes."
        )
      ).toBeDefined();

      const emailBtn = screen.getByRole("link", { name: /Email us your changes/i });
      expect(emailBtn.getAttribute("href")).toContain(
        "mailto:contact@startupshowcaseglobal.com?subject=Update%20request%3A%20Nova%20Flow"
      );

      const backLinks = screen.getAllByRole("link", { name: /Back to My Submissions/i });
      expect(backLinks.some((el) => el.getAttribute("href") === "/me/submissions")).toBe(true);
    });

    it("renders the edit form when admin opens an approved startup", async () => {
      vi.spyOn(supabaseServer, "getCurrentUserProfile").mockResolvedValue({
        user: { id: "admin-1" } as never,
        profile: { id: "admin-1", role: "admin", displayName: "Admin" } as never,
      });
      vi.spyOn(startupServer, "getStartupBySlug").mockResolvedValue({
        startup: makeStartup({ status: "approved", ownerId: "owner-1" }) as never,
        comments: [],
      });

      const ui = await SubmitPage({
        searchParams: Promise.resolve({ edit: "nova-flow" }),
      });
      render(ui);

      expect(screen.getByTestId("submit-startup-form")).toBeDefined();
      expect(screen.queryByRole("link", { name: /Email us your changes/i })).toBeNull();
    });
  });

  describe("/me/submissions", () => {
    it("shows banner and per-card note + mailto link only for approved startups", async () => {
      vi.spyOn(supabaseServer, "getCurrentUser").mockResolvedValue({
        id: "owner-1",
      } as never);
      vi.spyOn(startupServer, "getMySubmissions").mockResolvedValue({
        items: [
          makeStartup({ id: "s-1", name: "Live App", slug: "live-app", status: "approved" }),
          makeStartup({ id: "s-2", name: "Pending App", slug: "pending-app", status: "pending" }),
        ] as never,
        total: 2,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });

      const ui = await MySubmissionsPage();
      render(ui);

      // Banner is shown
      expect(screen.getByText(/Live listings can be updated by our team\./i)).toBeDefined();

      // Per-card note + mailto link appears exactly once (for approved card only)
      const notes = screen.getAllByText(/Live\. To change anything, email us your changes\./i);
      expect(notes).toHaveLength(1);

      const emailLinks = screen.getAllByRole("link", { name: /^Email changes$/i });
      expect(emailLinks).toHaveLength(1);
      expect(emailLinks[0].getAttribute("href")).toContain(
        "mailto:contact@startupshowcaseglobal.com?subject=Update%20request%3A%20Live%20App"
      );
    });

    it("does not show banner or per-card note when user has no approved startups", async () => {
      vi.spyOn(supabaseServer, "getCurrentUser").mockResolvedValue({
        id: "owner-1",
      } as never);
      vi.spyOn(startupServer, "getMySubmissions").mockResolvedValue({
        items: [
          makeStartup({ id: "s-2", name: "Pending App", slug: "pending-app", status: "pending" }),
          makeStartup({ id: "s-3", name: "Draft App", slug: "draft-app", status: "awaiting_payment" }),
        ] as never,
        total: 2,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      });

      const ui = await MySubmissionsPage();
      render(ui);

      expect(screen.queryByText(/Live listings can be updated by our team\./i)).toBeNull();
      expect(screen.queryByText(/Live\. To change anything, email us your changes\./i)).toBeNull();
      expect(screen.queryByRole("link", { name: /^Email changes$/i })).toBeNull();
    });
  });
});
