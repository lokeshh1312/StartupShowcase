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

  it("contains exact corrected text with 'Result Announcement' and no 'Announcncet'", () => {
    render(<PromoBanner />);

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();

    // Content checks
    expect(screen.getByText("November 2026")).toBeDefined();
    expect(screen.getByText("Top 10 Startups")).toBeDefined();
    expect(screen.getByText("Shortlisted.")).toBeDefined();
    expect(screen.getByText("Top 5 Awarded Grants.")).toBeDefined();
    expect(screen.getByText("USD 10,000")).toBeDefined();
    expect(screen.getByText("GRANTS")).toBeDefined();
    expect(screen.getByText("Deadline: 30 Nov 2026")).toBeDefined();
    expect(
      screen.getByText("Result Announcement: 10 Dec 2026")
    ).toBeDefined();

    // Verification of fixed typo
    expect(dialog.textContent).toContain("Result Announcement");
    expect(dialog.textContent).not.toContain("Announcncet");
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
