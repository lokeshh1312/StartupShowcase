/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { PromoBanner } from "@/components/common/promo-banner";
import * as promoConfig from "@/lib/promo-banner";

let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe("PromoBanner Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    currentPathname = "/";
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders after the ~1.2s delay using fake timers", () => {
    render(<PromoBanner />);

    // Initially not open
    expect(screen.queryByRole("dialog")).toBeNull();

    // Advance by 1100ms - still not open
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    // Advance past 1200ms
    act(() => {
      vi.advanceTimersByTime(150);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-label")).toBe(
      "Startup Showcase grants announcement"
    );
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    // Page scroll should be locked
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes with the visible cross (X) button top-right and restores scroll", () => {
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(document.body.style.overflow).toBe("hidden");

    const closeBtn = screen.getByRole("button", { name: /close announcement/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    // Scroll restored
    expect(document.body.style.overflow).toBe("");
  });

  it("closes with the Escape key and restores scroll", () => {
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByRole("dialog")).toBeDefined();

    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes by clicking the dark backdrop and restores scroll", () => {
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByRole("dialog")).toBeDefined();

    const backdrop = screen.getByTestId("promo-banner-backdrop");
    act(() => {
      fireEvent.click(backdrop);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("does not re-render open after close while browsing", () => {
    const { rerender } = render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByRole("dialog")).toBeDefined();

    // Close via X button
    const closeBtn = screen.getByRole("button", { name: /close announcement/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    // Simulate navigation by advancing timers further or re-rendering
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    rerender(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is not rendered when PROMO_BANNER_ENABLED is false", () => {
    const activeSpy = vi
      .spyOn(promoConfig, "isPromoBannerActive")
      .mockReturnValue(false);

    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
    activeSpy.mockRestore();
  });

  it("is not rendered when current time is after the end date", () => {
    // End date is 2026-11-30T23:59:59+05:30
    vi.setSystemTime(new Date("2026-12-01T00:00:00Z"));

    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is not rendered on /admin routes", () => {
    currentPathname = "/admin";

    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    currentPathname = "/admin/moderation";
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders new content: Top 10 Startups Shortlisted, Top 5 Startups Will Get $10,000 Grant, (Per Startup), five rows 1st-5th Place each with $10K, Result Announcement", () => {
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();

    // Top pill
    expect(screen.getByText("November 2026")).toBeDefined();

    // Heading
    expect(screen.getByText("Top 10 Startups")).toBeDefined();
    expect(screen.getByText("Shortlisted.")).toBeDefined();

    // Orange bar
    expect(
      screen.getByText("Top 5 Startups Will Get $10,000 Grant")
    ).toBeDefined();
    expect(screen.getByText("(Per Startup)")).toBeDefined();

    // Five rows 1st Place to 5th Place
    const expectedPlaces = [
      "1st Place",
      "2nd Place",
      "3rd Place",
      "4th Place",
      "5th Place",
    ];
    expectedPlaces.forEach((placeText) => {
      expect(
        screen.getByText(
          (_, el) =>
            el?.tagName.toLowerCase() === "span" &&
            el?.textContent?.replace(/\s+/g, " ").trim() === placeText
        )
      ).toBeDefined();
    });

    // Each with $10K
    const amounts = screen.getAllByText("$10K");
    expect(amounts).toHaveLength(5);

    // Two chips
    expect(screen.getByText("Deadline: 30 Nov 2026")).toBeDefined();
    expect(
      screen.getByText("Result Announcement: 10 Dec 2026")
    ).toBeDefined();

    // Corrected spelling: Result Announcement present, Announcment and Announcncet absent
    expect(dialog.textContent).toContain("Result Announcement");
    expect(dialog.textContent).not.toContain("Announcment");
    expect(dialog.textContent).not.toContain("Announcncet");

    // Old text removed
    expect(dialog.textContent).not.toContain("Top 5 Awarded Grants.");
    expect(dialog.textContent).not.toContain("USD 10,000");
  });

  it("makes zero calls to localStorage and sessionStorage", () => {
    const localGetSpy = vi.spyOn(Storage.prototype, "getItem");
    const localSetSpy = vi.spyOn(Storage.prototype, "setItem");

    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    const closeBtn = screen.getByRole("button", { name: /close announcement/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(localGetSpy).not.toHaveBeenCalled();
    expect(localSetSpy).not.toHaveBeenCalled();

    localGetSpy.mockRestore();
    localSetSpy.mockRestore();
  });
});
