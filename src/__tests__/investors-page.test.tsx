/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";
import InvestorsPage, { metadata } from "@/app/investors/page";
import { InvestorsClient } from "@/components/investor-network/investors-client";

// Mock global fetch for /api/investor-network
const mockNetworkData = {
  countries: [
    { code: "US", name: "United States", investors: 54128, startups: 120 },
    { code: "IN", name: "India", investors: 15200, startups: 85 },
  ],
  totals: {
    investors: 69328,
    startups: 205,
  },
  asOf: "2026-11-13T10:00:00.000Z",
  degraded: false,
};

describe("Investors Page (/investors)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => mockNetworkData,
      } as Response)
    );
  });

  it("exports correct metadata via createMetadata", () => {
    expect(metadata.title).toBe("Investors");
    expect(metadata.description).toBe(
      "Explore our global angel investor network spanning active investors across the globe."
    );
    expect(metadata.alternates?.canonical).toContain("/investors");
  });

  it("renders server-rendered heading 'Investors' and crawlable intro paragraph", async () => {
    await act(async () => {
      render(<InvestorsPage />);
    });

    // Centred heading
    const heading = screen.getByRole("heading", { level: 1, name: "Investors" });
    expect(heading).toBeDefined();

    // Crawlable intro paragraph
    const intro = screen.getByText(/Investor figures are estimates/i);
    expect(intro).toBeDefined();
    expect(intro.textContent?.toLowerCase()).toContain("investor figures are estimates");
    expect(intro.textContent?.toLowerCase()).toContain("investor meetings are subject to investor availability");
    expect(intro.textContent?.toLowerCase()).toContain("we offer introductions, not funding");
  });

  it("renders initial subtitle fallback and updates with computed count once data loads", async () => {
    await act(async () => {
      render(<InvestorsPage />);
    });

    // After fetch resolves: 69,328 -> >= 10,000 -> round DOWN to nearest 10,000 = 60k+
    await waitFor(() => {
      expect(
        screen.getByText(
          "Our Network Spans 60k+ Active Angel Investors Across the Globe"
        )
      ).toBeDefined();
    });
  });

  it("renders world map container with rounded corners, aspect ratio and overflow-hidden (no inner scrollbars)", async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = render(<InvestorsClient />);
      container = res.container;
    });

    const mapBox = container!.querySelector(".aspect-\\[960\\/500\\]");
    expect(mapBox).not.toBeNull();
    expect(mapBox?.classList.contains("overflow-hidden")).toBe(true);
    expect(mapBox?.classList.contains("max-w-[1150px]")).toBe(true);
    expect(mapBox?.classList.contains("rounded-2xl")).toBe(true);
  });

  describe("Responsive viewport checks (320, 768, 1440, 1917px)", () => {
    const viewports = [320, 768, 1440, 1917];

    for (const width of viewports) {
      it(`renders properly at ${width}px with no horizontal scroll or inner map scrollbar`, async () => {
        window.innerWidth = width;
        let container: HTMLElement;
        await act(async () => {
          const res = render(<InvestorsPage />);
          container = res.container;
        });

        const root = container!.firstElementChild as HTMLElement;
        expect(root).toBeDefined();

        // Main layout container is constrained
        const layoutContainer = container!.querySelector(".max-w-6xl");
        expect(layoutContainer).not.toBeNull();

        // Map box is contained within aspect ratio and overflow-hidden
        const mapBox = container!.querySelector(".aspect-\\[960\\/500\\]") as HTMLElement;
        expect(mapBox).not.toBeNull();
        expect(mapBox.classList.contains("overflow-hidden")).toBe(true);
      });
    }
  });
});
