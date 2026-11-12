/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardTable } from "@/components/startup/leaderboard-table";
import type { FormattedStartup } from "@/server/startups";

// Mock VoteButton to check its placement and event handling
vi.mock("@/components/startup/vote-button", () => ({
  VoteButton: ({ startupName }: { startupName: string }) => (
    <button data-testid={`vote-btn-${startupName}`} type="button">
      Like
    </button>
  ),
}));

const mockStartups: Array<FormattedStartup & { rank?: number; votesCount?: number }> = [
  {
    id: "startup-1",
    name: "Acme AI",
    slug: "acme-ai",
    tagline: "Autonomous AI agents for enterprise workflows",
    ideaTitle: "Acme Autonomous Intelligence",
    description: "Full text description of Acme AI which spans multiple lines and explains how autonomous AI works in real world workflows.",
    category: "Artificial Intelligence",
    stage: "MVP",
    countryCode: "US",
    coverImage: "https://showcase-app.supabase.co/storage/v1/object/public/startup-images/uuid/cover.jpg",
    thumbnail: "",
    logoType: "cpu",
    logoColor: "#ff6600",
    likes: 42,
    isLiked: false,
    rank: 1,
    createdAt: new Date("2026-10-01"),
    ownerId: "owner-1",
    websiteUrl: "https://acme.ai",
  } as unknown as FormattedStartup & { rank?: number; votesCount?: number },
];

describe("LeaderboardTable Redesign", () => {
  it("does NOT render any column header row or labels", () => {
    render(<LeaderboardTable startups={mockStartups} />);

    // Header labels should be absent
    expect(screen.queryByText(/^LOGO$/i)).toBeNull();
    expect(screen.queryByText(/^IMAGE$/i)).toBeNull();
    expect(screen.queryByText(/^STARTUP IDEA$/i)).toBeNull();
    expect(screen.queryByText(/^CATEGORY$/i)).toBeNull();
    expect(screen.queryByText(/^COUNTRY$/i)).toBeNull();
    expect(screen.queryByText(/^STAGE$/i)).toBeNull();
  });

  it("renders a stretched link overlay with aria-label View {name}", () => {
    render(<LeaderboardTable startups={mockStartups} />);

    const links = screen.getAllByRole("link", { name: "View Acme AI" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBe("/startup/acme-ai");
      expect(link.classList.contains("absolute")).toBe(true);
      expect(link.classList.contains("inset-0")).toBe(true);
      expect(link.classList.contains("z-10")).toBe(true);
    }
  });

  it("renders desktop cards with rounded-3xl container and 1510px max-width", () => {
    const { container } = render(<LeaderboardTable startups={mockStartups} />);

    const desktopContainer = container.querySelector(".lg\\:flex");
    expect(desktopContainer).not.toBeNull();
    expect(desktopContainer?.classList.contains("gap-[12px]")).toBe(true);

    const card = desktopContainer?.firstElementChild;
    expect(card?.classList.contains("rounded-3xl")).toBe(true);
    expect(card?.classList.contains("max-w-[1510px]")).toBe(true);
  });

  it("renders VoteButton with relative z-20 so it sits above the stretched link", () => {
    const { container } = render(<LeaderboardTable startups={mockStartups} />);

    const voteWrapper = container.querySelectorAll(".z-20");
    expect(voteWrapper.length).toBeGreaterThan(0);
    const voteBtn = screen.getAllByTestId("vote-btn-Acme AI")[0];
    expect(voteBtn).toBeDefined();
  });
});
