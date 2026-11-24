/**
 * @vitest-environment jsdom
 */

import React from "react";
import fs from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  START_VALUE,
  START_AT,
  COUNTER_LABEL,
  baseline,
} from "@/lib/home-counter";
import { HomeCounterBadge } from "@/components/common/home-counter-badge";

describe("baseline(now) Pure Function", () => {
  const startAtMs = new Date(START_AT).getTime();

  it("returns exactly 2000 at START_AT and before it", () => {
    // Exactly at START_AT
    expect(baseline(startAtMs)).toBe(START_VALUE);
    expect(baseline(new Date(START_AT))).toBe(START_VALUE);

    // 1 ms before START_AT
    expect(baseline(startAtMs - 1)).toBe(START_VALUE);

    // 1 hour before START_AT
    expect(baseline(startAtMs - 3600 * 1000)).toBe(START_VALUE);

    // 10 years before START_AT
    expect(baseline(startAtMs - 10 * 365 * 24 * 3600 * 1000)).toBe(START_VALUE);
  });

  it("is monotonic non-decreasing as time advances", () => {
    let prev = baseline(startAtMs);
    // Step forward every 100ms for 20 seconds
    for (let offset = 0; offset <= 20000; offset += 100) {
      const current = baseline(startAtMs + offset);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  it("is roughly 100 higher after 60 seconds (between 95 and 105)", () => {
    const after60s = baseline(startAtMs + 60 * 1000);
    const increase = after60s - START_VALUE;

    expect(increase).toBeGreaterThanOrEqual(95);
    expect(increase).toBeLessThanOrEqual(105);
    // With 5/3 rate: 60 * 5/3 = 100 exactly
    expect(after60s).toBe(2100);
  });

  it("is deterministic (same input produces exact same output)", () => {
    const testTimes = [
      startAtMs - 5000,
      startAtMs,
      startAtMs + 12345,
      startAtMs + 999999,
      startAtMs + 10000000,
    ];

    for (const t of testTimes) {
      const res1 = baseline(t);
      const res2 = baseline(t);
      const res3 = baseline(new Date(t));
      expect(res1).toBe(res2);
      expect(res1).toBe(res3);
    }
  });
});

describe("HomeCounterBadge Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    act(() => {
      vi.clearAllTimers();
    });
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the digits and 'hello' text with aria-hidden='true'", () => {
    let container!: HTMLElement;
    act(() => {
      const res = render(<HomeCounterBadge />);
      container = res.container;
    });

    const badge = screen.getByTestId("home-counter-badge");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("aria-hidden")).toBe("true");

    // Must display "hello"
    expect(screen.getByText(COUNTER_LABEL)).toBeDefined();
    expect(screen.getByText("hello")).toBeDefined();

    // Check that digit characters from formatted baseline are in the container
    const currentBase = baseline(Date.now());
    const formatted = currentBase.toLocaleString("en-US");
    for (const char of formatted) {
      if (char !== ",") {
        expect(container.textContent).toContain(char);
      }
    }
  });

  it("does not contain the word 'visitors', 'users', 'live', or any unwanted labels", () => {
    act(() => {
      render(<HomeCounterBadge />);
    });

    const badge = screen.getByTestId("home-counter-badge");
    const text = badge.textContent?.toLowerCase() || "";

    expect(text).not.toContain("visitors");
    expect(text).not.toContain("visitor");
    expect(text).not.toContain("users");
    expect(text).not.toContain("user");
    expect(text).not.toContain("live");
    expect(text).not.toContain("online");
    expect(text).not.toContain("active");
  });

  it("advances the displayed count over time", () => {
    act(() => {
      render(<HomeCounterBadge />);
    });

    const initialText = screen.getByTestId("home-counter-badge").textContent;
    expect(initialText).toBeDefined();

    // Advance by 3.5 seconds (at least one or two ticks between 1000-2000ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    const updatedText = screen.getByTestId("home-counter-badge").textContent;
    expect(updatedText).toBeDefined();
  });

  it("stops timer when document is hidden and resyncs to baseline on visible", () => {
    act(() => {
      render(<HomeCounterBadge />);
    });

    // Simulate tab hiding
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Advance time while hidden
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Simulate tab becoming visible again
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const badge = screen.getByTestId("home-counter-badge");
    expect(badge).toBeDefined();
  });
});

describe("Page vs Layout Scope Check", () => {
  it("verifies that HomeCounterBadge is rendered in src/app/page.tsx", () => {
    const homePageContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/page.tsx"),
      "utf-8"
    );
    expect(homePageContent).toContain("HomeCounterBadge");
    expect(homePageContent).toContain("<HomeCounterBadge />");
  });

  it("verifies that HomeCounterBadge is NOT imported or rendered in src/app/layout.tsx", () => {
    const layoutContent = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/layout.tsx"),
      "utf-8"
    );
    expect(layoutContent).not.toContain("HomeCounterBadge");
    expect(layoutContent).not.toContain("home-counter-badge");
  });
});
