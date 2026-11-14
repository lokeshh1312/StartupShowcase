/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage, { HOME_LIST_LIMIT } from "@/app/page";
import * as startupServer from "@/server/startups";
import * as seoLib from "@/lib/seo";
import type { FormattedStartup } from "@/server/startups";

vi.mock("@/server/startups", () => ({
  getLeaderboard: vi.fn(),
  listMonths: vi.fn(),
  listCategories: vi.fn(),
}));

vi.mock("@/lib/seo", async () => {
  const actual = await vi.importActual<typeof seoLib>("@/lib/seo");
  return {
    ...actual,
    buildItemListJsonLd: vi.fn(actual.buildItemListJsonLd),
    buildOrganizationJsonLd: vi.fn(actual.buildOrganizationJsonLd),
    buildWebSiteJsonLd: vi.fn(actual.buildWebSiteJsonLd),
  };
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock VoteButton to keep render lightweight
vi.mock("@/components/startup/vote-button", () => ({
  VoteButton: ({ startupName }: { startupName: string }) => (
    <button data-testid={`vote-btn-${startupName}`} type="button">
      Like
    </button>
  ),
}));

function createMockStartup(index: number): FormattedStartup & { rank: number; votesCount: number } {
  const rank = index + 1;
  return {
    id: `startup-${rank}`,
    name: `Startup ${rank}`,
    slug: `startup-${rank}`,
    tagline: `Tagline for startup ${rank}`,
    ideaTitle: `Idea ${rank}`,
    description: `Description for startup ${rank}`,
    fullStory: "",
    category: "EdTech",
    countryCode: "US",
    region: "Massachusetts",
    city: "Boston",
    remoteFirst: false,
    location: "Boston, Massachusetts, United States",
    stage: "MVP",
    month: "2026-11-01",
    monthLabel: "November 2026",
    websiteUrl: "",
    logoType: "upload",
    logoColor: "#2563EB",
    thumbnail: `/startups/startup-${rank}-logo.png`,
    coverImage: `/startups/startup-${rank}-thumb.png`,
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
    likes: 100 - rank,
    views: 0,
    votesCount: 100 - rank,
    rank,
    status: "approved",
    isSample: false,
  };
}

describe("HomePage - Show All Approved Startups", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(startupServer.listMonths).mockResolvedValue([
      { id: "2026-11-01", label: "November 2026", date: "2026-11-01", count: 25 },
    ]);

    vi.mocked(startupServer.listCategories).mockResolvedValue([
      { id: "edtech", name: "EdTech", count: 10 },
      { id: "fintech", name: "FinTech", count: 5 },
    ]);
  });

  it("exports HOME_LIST_LIMIT = 500", () => {
    expect(HOME_LIST_LIMIT).toBe(500);
  });

  it("fetches the leaderboard using HOME_LIST_LIMIT (500) so all approved startups are loaded", async () => {
    const mock25Startups = Array.from({ length: 25 }, (_, i) => createMockStartup(i));

    vi.mocked(startupServer.getLeaderboard).mockResolvedValue({
      items: mock25Startups,
      total: 25,
      page: 1,
      pageSize: HOME_LIST_LIMIT,
      totalPages: 1,
      month: "2026-11-01",
      monthLabel: "November 2026",
    });

    const pageElement = await HomePage({});
    render(pageElement);

    // Verify getLeaderboard was called with the activeMonth, page 1, and HOME_LIST_LIMIT (500)
    expect(startupServer.getLeaderboard).toHaveBeenCalledWith(
      "2026-11-01",
      1,
      HOME_LIST_LIMIT
    );
  });

  it("passes only the first 10 startups to buildItemListJsonLd for lightweight structured data", async () => {
    const mock25Startups = Array.from({ length: 25 }, (_, i) => createMockStartup(i));

    vi.mocked(startupServer.getLeaderboard).mockResolvedValue({
      items: mock25Startups,
      total: 25,
      page: 1,
      pageSize: HOME_LIST_LIMIT,
      totalPages: 1,
      month: "2026-11-01",
      monthLabel: "November 2026",
    });

    const pageElement = await HomePage({});
    render(pageElement);

    // Verify buildItemListJsonLd was called with exactly 10 items (slice(0, 10))
    expect(seoLib.buildItemListJsonLd).toHaveBeenCalled();
    const passedItems = vi.mocked(seoLib.buildItemListJsonLd).mock.calls[0][0];
    expect(passedItems).toHaveLength(10);
    expect(passedItems[0].name).toBe("Startup 1");
    expect(passedItems[9].name).toBe("Startup 10");
  });

  it("renders all 25 startups in the leaderboard table with correct rank numbers beyond 10", async () => {
    const mock25Startups = Array.from({ length: 25 }, (_, i) => createMockStartup(i));

    vi.mocked(startupServer.getLeaderboard).mockResolvedValue({
      items: mock25Startups,
      total: 25,
      page: 1,
      pageSize: HOME_LIST_LIMIT,
      totalPages: 1,
      month: "2026-11-01",
      monthLabel: "November 2026",
    });

    const pageElement = await HomePage({});
    render(pageElement);

    // Startup 1 (top of list) and Startup 25 (beyond top 10) should both be present in the document
    expect(screen.getAllByText(/1\. Startup 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/11\. Startup 11/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/25\. Startup 25/).length).toBeGreaterThan(0);
  });
});
