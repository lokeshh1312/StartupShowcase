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
    expect(desktopContainer?.classList.contains("gap-2.5")).toBe(true);

    const card = desktopContainer?.firstElementChild;
    expect(card?.classList.contains("rounded-3xl")).toBe(true);
    expect(card?.classList.contains("max-w-[1510px]")).toBe(true);
  });

  it("renders VoteButton with relative z-20 centered in its cell in both mobile and desktop layouts", () => {
    const { container } = render(<LeaderboardTable startups={mockStartups} />);

    const voteWrapper = container.querySelectorAll(".z-20");
    expect(voteWrapper.length).toBeGreaterThan(0);
    const voteBtn = screen.getAllByTestId("vote-btn-Acme AI")[0];
    expect(voteBtn).toBeDefined();

    // Desktop Col 7 centers the heart in its cell
    const desktopContainer = container.querySelector(".lg\\:flex");
    const desktopVoteCell = desktopContainer?.querySelector(".z-20");
    expect(desktopVoteCell?.classList.contains("justify-center")).toBe(true);
    expect(desktopVoteCell?.classList.contains("items-center")).toBe(true);
  });

  it("renders next/image when coverImage is a site-relative /startups/ path", () => {
    const startupWithSiteRelativeImage: FormattedStartup & { rank?: number } = {
      ...mockStartups[0],
      id: "startup-2",
      name: "NimbleDesk",
      slug: "nimbledesk",
      coverImage: "/startups/nimbledesk-thumb.png",
      thumbnail: "/startups/nimbledesk-logo.png",
    };

    const { container } = render(<LeaderboardTable startups={[startupWithSiteRelativeImage]} />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
    const hasNimbleDeskImg = Array.from(images).some((img) =>
      img.getAttribute("alt") === "NimbleDesk"
    );
    expect(hasNimbleDeskImg).toBe(true);
  });

  it("renders the real logo <img> with the thumbnail URL in both mobile and desktop layouts when thumbnail is provided", () => {
    const startupWithLogo: FormattedStartup & { rank?: number } = {
      ...mockStartups[0],
      id: "startup-with-logo",
      name: "NimbleDesk",
      slug: "nimbledesk",
      thumbnail: "/startups/nimbledesk-logo.png",
      coverImage: "/startups/nimbledesk-thumb.png",
    };

    const { container } = render(<LeaderboardTable startups={[startupWithLogo]} />);

    // Mobile layout: <ul class="lg:hidden ...">
    const mobileList = container.querySelector("ul.lg\\:hidden");
    expect(mobileList).not.toBeNull();
    const mobileLogoContainer = mobileList?.querySelector('[aria-label="NimbleDesk logo"]');
    expect(mobileLogoContainer).not.toBeNull();
    const mobileLogoImg = mobileLogoContainer?.querySelector("img");
    expect(mobileLogoImg).not.toBeNull();
    expect(decodeURIComponent(mobileLogoImg?.getAttribute("src") || "")).toContain("/startups/nimbledesk-logo.png");

    // Desktop layout: <div class="hidden lg:flex ...">
    const desktopContainer = container.querySelector(".lg\\:flex");
    expect(desktopContainer).not.toBeNull();
    const desktopLogoContainer = desktopContainer?.querySelector('[aria-label="NimbleDesk logo"]');
    expect(desktopLogoContainer).not.toBeNull();
    const desktopLogoImg = desktopLogoContainer?.querySelector("img");
    expect(desktopLogoImg).not.toBeNull();
    expect(decodeURIComponent(desktopLogoImg?.getAttribute("src") || "")).toContain("/startups/nimbledesk-logo.png");
  });

  it("renders the icon fallback when thumbnail is empty in both mobile and desktop layouts", () => {
    const startupWithoutLogo: FormattedStartup & { rank?: number } = {
      ...mockStartups[0],
      id: "startup-no-logo",
      name: "Acme AI",
      slug: "acme-ai",
      thumbnail: "",
      logoType: "cpu",
    };

    const { container } = render(<LeaderboardTable startups={[startupWithoutLogo]} />);

    // Mobile layout
    const mobileList = container.querySelector("ul.lg\\:hidden");
    const mobileLogo = mobileList?.querySelector('[aria-label="Acme AI logo"]');
    expect(mobileLogo).not.toBeNull();
    expect(mobileLogo?.querySelector("img")).toBeNull();
    expect(mobileLogo?.querySelector("svg")).not.toBeNull();

    // Desktop layout
    const desktopContainer = container.querySelector(".lg\\:flex");
    const desktopLogo = desktopContainer?.querySelector('[aria-label="Acme AI logo"]');
    expect(desktopLogo).not.toBeNull();
    expect(desktopLogo?.querySelector("img")).toBeNull();
    expect(desktopLogo?.querySelector("svg")).not.toBeNull();
  });

  it("renders logo at 56px (w-14 h-14) with 8px radius (rounded-lg) in both mobile and desktop layouts", () => {
    const { container } = render(<LeaderboardTable startups={mockStartups} />);

    // Mobile layout
    const mobileList = container.querySelector("ul.lg\\:hidden");
    expect(mobileList).not.toBeNull();

    // Logo size: 56px (w-14 h-14) with 8px radius (rounded-lg)
    const mobileLogo = mobileList?.querySelector('[aria-label="Acme AI logo"]');
    expect(mobileLogo).not.toBeNull();
    expect(mobileLogo?.className).toContain("!w-14");
    expect(mobileLogo?.className).toContain("!h-14");
    expect(mobileLogo?.className).toContain("!rounded-lg");

    // Right column: centered under logo, w-14 width
    const rightCol = mobileLogo?.closest(".col-start-3");
    expect(rightCol).not.toBeNull();
    expect(rightCol?.classList.contains("items-center")).toBe(true);
    expect(rightCol?.classList.contains("w-14")).toBe(true);

    // Vote button wrapper is centered
    const voteWrapper = rightCol?.querySelector(".relative.z-20");
    expect(voteWrapper?.classList.contains("flex")).toBe(true);
    expect(voteWrapper?.classList.contains("items-center")).toBe(true);
    expect(voteWrapper?.classList.contains("justify-center")).toBe(true);

    // Desktop layout logo also uses 56px (w-14 h-14) with 8px radius (rounded-lg)
    const desktopContainer = container.querySelector(".lg\\:flex");
    const desktopLogo = desktopContainer?.querySelector('[aria-label="Acme AI logo"]');
    expect(desktopLogo).not.toBeNull();
    expect(desktopLogo?.className).toContain("!w-14");
    expect(desktopLogo?.className).toContain("!h-14");
    expect(desktopLogo?.className).toContain("!rounded-lg");
  });
});
