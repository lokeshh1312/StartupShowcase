/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StartupCard } from "@/components/startup/startup-card";
import type { FormattedStartup } from "@/server/startups";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockStartup: FormattedStartup = {
  id: "card-1",
  ownerId: "owner-1",
  name: "FlowSpark",
  slug: "flowspark",
  tagline: "Automated data workflows for modern teams",
  ideaTitle: "FlowSpark Automation",
  description: "A fast workflow orchestrator for teams moving fast and building pipelines.",
  category: "Developer Tools",
  stage: "MVP",
  countryCode: "US",
  coverImage: "https://showcase-app.supabase.co/storage/v1/object/public/startup-images/uuid/cover.jpg",
  thumbnail: "",
  logoType: "cpu",
  logoColor: "#2563EB",
  likes: 88,
  views: 1200,
  viewsCount: 1200,
  isLiked: false,
  isSaved: false,
  status: "approved",
  isSample: false,
  fullStory: "",
  region: "",
  city: "San Francisco",
  remoteFirst: true,
  location: "San Francisco, US",
  month: "2026-10-01",
  monthLabel: "October 2026",
  websiteUrl: "https://flowspark.io",
  founderJson: {},
  problem: "",
  solution: "",
  keyFeaturesJson: [],
  techStackJson: [],
  traction: "",
  reviewedBy: null,
  approvedAt: new Date("2026-10-01"),
  createdAt: new Date("2026-10-01"),
  updatedAt: new Date("2026-10-01"),
};

describe("StartupCard Component", () => {
  it("renders startup logo with 56px (w-14 h-14) and 8px radius (rounded-lg) below lg, and desktop size at lg", () => {
    const { container } = render(<StartupCard startup={mockStartup} />);

    const logo = container.querySelector('[aria-label="FlowSpark logo"]');
    expect(logo).not.toBeNull();

    // Verify mobile classes: 56px size (w-14 h-14) and 8px radius (rounded-lg)
    expect(logo?.className).toContain("max-lg:!w-14");
    expect(logo?.className).toContain("max-lg:!h-14");
    expect(logo?.className).toContain("max-lg:!rounded-lg");

    // Verify desktop classes: 44px size (w-11 h-11) and rounded-xl
    expect(logo?.className).toContain("w-11");
    expect(logo?.className).toContain("h-11");
    expect(logo?.className).toContain("rounded-xl");
  });

  it("renders VoteButton with heart-only configuration everywhere (no count text, no border/bg/shadow, w-6 h-6 lg:w-7 lg:h-7)", () => {
    render(<StartupCard startup={mockStartup} />);

    const voteButton = screen.getByRole("button", { name: "Like FlowSpark, currently 88 likes" });
    expect(voteButton).toBeDefined();

    // No visible count text and no span elements
    expect(voteButton.querySelector("span")).toBeNull();
    expect(voteButton.textContent).toBe("");

    // No border, background, or shadow classes at any breakpoint
    expect(voteButton.className).not.toMatch(/\bborder\b/);
    expect(voteButton.className).not.toMatch(/\bbg-/);
    expect(voteButton.className).not.toMatch(/\bshadow\b/);

    // Heart icon sizing: w-6 h-6 lg:w-7 lg:h-7
    const heart = voteButton.querySelector("svg");
    expect(heart).not.toBeNull();
    expect(heart?.classList.contains("w-6")).toBe(true);
    expect(heart?.classList.contains("h-6")).toBe(true);
    expect(heart?.classList.contains("lg:w-7")).toBe(true);
    expect(heart?.classList.contains("lg:h-7")).toBe(true);
  });

  it("renders startup information correctly without overflow", () => {
    render(<StartupCard startup={mockStartup} />);

    expect(screen.getByText("FlowSpark")).toBeDefined();
    expect(screen.getByText("Automated data workflows for modern teams")).toBeDefined();
    expect(screen.getByText("Developer Tools")).toBeDefined();
    expect(screen.getByText("MVP")).toBeDefined();
    expect(screen.getByText("1200")).toBeDefined();
  });
});
