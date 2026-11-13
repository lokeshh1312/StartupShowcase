/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MonthSelector } from "@/components/discovery/month-selector";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("MonthSelector Component", () => {
  const sampleMonths = [
    { id: "2026-11-01", label: "November 2026", count: 12 },
    { id: "2026-10-01", label: "October 2026", count: 8 },
  ];

  it("renders month tabs with both full and short labels and full aria-label", () => {
    render(<MonthSelector months={sampleMonths} activeMonth="2026-11-01" />);

    // Link has full month name in aria-label
    const novLink = screen.getByRole("link", { name: "November 2026" });
    expect(novLink).toBeDefined();

    // Contains desktop label
    expect(novLink.textContent).toContain("November 2026");
    // Contains mobile shortened label
    expect(novLink.textContent).toContain("Nov 26");
  });
});

