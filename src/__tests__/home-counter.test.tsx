/**
 * @vitest-environment jsdom
 */

import React from "react";
import fs from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  COUNTER_UTC_OFFSET_MINUTES,
  DAILY_START_VALUE,
  COUNTER_LABEL,
  baseline,
  nextTickAt,
} from "@/lib/home-counter";
import { HomeCounterBadge } from "@/components/common/home-counter-badge";

const MS_PER_DAY = 86_400_000;
const OFFSET_MS = COUNTER_UTC_OFFSET_MINUTES * 60_000;

/**
 * Helper to construct a UTC timestamp in ms for a given IST date & time.
 */
function istTime(
  year: number,
  month: number, // 1-12
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): number {
  return Date.UTC(year, month - 1, day, hour, minute, second, ms) - OFFSET_MS;
}

/**
 * Helper to extract the displayed digit values from the rendered HomeCounterBadge
 * by reading each digit box's translateY(-pos * 5%) transform.
 */
function getDisplayedDigitsFromBadge(badge: HTMLElement): string {
  // The digits wrapper is the second child (after pulsing dot, before label)
  const digitsWrapper = badge.children[1] as HTMLElement;
  let result = "";
  for (const child of Array.from(digitsWrapper.children)) {
    const el = child as HTMLElement;
    if (el.textContent === ",") {
      result += ",";
    } else {
      const track = el.firstElementChild as HTMLElement;
      const transform = track?.style.transform ?? "";
      const match = /translateY\(-(\d+)%\)/.exec(transform);
      if (match) {
        const pos = Number(match[1]) / 5;
        result += String(pos % 10);
      }
    }
  }
  return result;
}

describe("Daily-Reset Home Counter Pure Functions", () => {
  it("baseline at exactly 00:00:00.000 IST is 0; just before midnight it is high; at the next 00:00:00.000 it is 0 again", () => {
    const midnight1 = istTime(2026, 11, 25, 0, 0, 0, 0);
    const justBeforeMidnight = istTime(2026, 11, 25, 23, 59, 59, 999);
    const midnight2 = istTime(2026, 11, 26, 0, 0, 0, 0);

    expect(baseline(midnight1)).toBe(DAILY_START_VALUE);
    expect(baseline(midnight1)).toBe(0);

    const endOfDayVal = baseline(justBeforeMidnight);
    expect(endOfDayVal).toBeGreaterThanOrEqual(49500);
    expect(endOfDayVal).toBeLessThanOrEqual(65650);

    expect(baseline(midnight2)).toBe(0);
  });

  it("Deterministic and monotonic within a day: sampling every 1000 ms across a full day never decreases; same input gives same output", () => {
    const dayStart = istTime(2026, 11, 25, 0, 0, 0, 0);

    let prev = baseline(dayStart);
    expect(prev).toBe(0);

    for (let offset = 1000; offset < MS_PER_DAY; offset += 1000) {
      const val = baseline(dayStart + offset);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }

    // Same input gives same output (including different call order & Date objects)
    const sampleOffsets = [0, 12_345, 3_600_000, 43_200_000, 86_399_999];
    const firstPass = sampleOffsets.map((o) => baseline(dayStart + o));
    const reversePass = [...sampleOffsets]
      .reverse()
      .map((o) => baseline(new Date(dayStart + o)));
    expect(firstPass).toEqual([...reversePass].reverse());
  });

  it("Walk tick by tick through a full day with nextTickAt: every increase is 2 or 3, gaps are within that day's window, the first tick is after midnight, the last tick is before the day ends", () => {
    const dayStart = istTime(2026, 11, 25, 0, 0, 0, 0);
    const dayEnd = dayStart + MS_PER_DAY;

    const endVal = baseline(dayEnd - 1);
    const gaps: number[] = [];

    let cur = dayStart;
    const firstTick = nextTickAt(cur);
    expect(firstTick).toBeGreaterThan(dayStart);
    expect(firstTick).toBeLessThan(dayEnd);

    let lastTickInDay = firstTick;
    while (true) {
      const next = nextTickAt(cur);
      if (next >= dayEnd) {
        break;
      }
      const gap = next - cur;
      gaps.push(gap);

      const inc = baseline(next) - baseline(cur);
      expect(inc === 2 || inc === 3).toBe(true);

      lastTickInDay = next;
      cur = next;
    }

    expect(lastTickInDay).toBeLessThan(dayEnd);
    expect(baseline(lastTickInDay)).toBe(endVal);

    // Every gap is within [minGap, maxGap] around that day's meanGapMs (+/- 500ms)
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    expect(maxGap - minGap).toBeLessThanOrEqual(1001);
    expect(minGap).toBeGreaterThan(2000);
    expect(maxGap).toBeLessThan(6000);
  });

  it("For 60 consecutive days (covering a month boundary and Feb 29 in a leap year): end-of-day value is between 49,500 and 65,650, values vary across days, and each day's result is deterministic", () => {
    // 2028 is a leap year; start Jan 20, 2028 -> covers Jan->Feb boundary, Feb 29, Feb->Mar boundary
    const startDay = istTime(2028, 1, 20, 23, 59, 59, 999);
    const endValues: number[] = [];

    for (let d = 0; d < 60; d++) {
      const t = startDay + d * MS_PER_DAY;
      const val = baseline(t);
      expect(val).toBeGreaterThanOrEqual(49500);
      expect(val).toBeLessThanOrEqual(65650);
      endValues.push(val);
    }

    // Values are not all identical across days
    const uniqueValues = new Set(endValues);
    expect(uniqueValues.size).toBeGreaterThan(10);

    // Re-computing any day gives the exact same result (even after cache eviction)
    for (let d = 0; d < 60; d++) {
      const t = startDay + d * MS_PER_DAY;
      expect(baseline(t)).toBe(endValues[d]);
    }
  });

  it("nextTickAt crosses midnight correctly", () => {
    const justBeforeMidnight = istTime(2026, 11, 25, 23, 59, 59, 999);
    const nextDayMidnight = istTime(2026, 11, 26, 0, 0, 0, 0);

    const next = nextTickAt(justBeforeMidnight);
    expect(next).toBeGreaterThan(nextDayMidnight);
    expect(next).toBe(nextTickAt(nextDayMidnight));
    expect(baseline(next)).toBeGreaterThan(0);
    expect(baseline(next)).toBeLessThanOrEqual(3);
  });

  it("Performance: baseline for a far-future date (year 2040) returns in under 150 ms the first time and under 5 ms after", () => {
    const year2040 = istTime(2040, 6, 15, 14, 30, 0, 0);

    const t0 = performance.now();
    const val1 = baseline(year2040);
    const firstDuration = performance.now() - t0;

    const t1 = performance.now();
    const val2 = baseline(year2040);
    const secondDuration = performance.now() - t1;

    expect(val1).toBe(val2);
    expect(val1).toBeGreaterThan(0);
    expect(firstDuration).toBeLessThan(150);
    expect(secondDuration).toBeLessThan(5);
  });
});

describe("HomeCounterBadge Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

  it("renders the digits and COUNTER_LABEL with aria-hidden='true'", () => {
    vi.setSystemTime(istTime(2026, 11, 25, 12, 0, 0, 0));

    act(() => {
      render(<HomeCounterBadge />);
    });

    const badge = screen.getByTestId("home-counter-badge");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText(COUNTER_LABEL)).toBeDefined();

    const expectedFormatted = baseline(Date.now()).toLocaleString("en-US");
    expect(getDisplayedDigitsFromBadge(badge)).toBe(expectedFormatted);
  });

  it("render at 23:59:58 IST, advance past midnight, the displayed number resets to the small number for the new day", () => {
    vi.setSystemTime(istTime(2026, 11, 25, 23, 59, 58, 0));

    act(() => {
      render(<HomeCounterBadge />);
    });

    const badge = screen.getByTestId("home-counter-badge");
    const beforeDisplayed = getDisplayedDigitsFromBadge(badge);
    const beforeVal = baseline(Date.now());
    expect(beforeVal).toBeGreaterThan(45000);
    expect(beforeDisplayed).toBe(beforeVal.toLocaleString("en-US"));

    // Advance 15 seconds to well past midnight (00:00:13 IST of the next day).
    // The component's scheduled timer (gap ~3-5s) fires during this window,
    // re-syncs to baseline(now) which is now in the new day (small number),
    // and schedules the next tick for the new day.
    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    const afterVal = baseline(Date.now());
    expect(afterVal).toBeLessThan(10);
    expect(getDisplayedDigitsFromBadge(badge)).toBe(
      afterVal.toLocaleString("en-US")
    );
  });

  it("remount at the same fake time shows the same number", () => {
    vi.setSystemTime(istTime(2026, 11, 25, 15, 30, 0, 0));

    let unmount!: () => void;
    act(() => {
      const res = render(<HomeCounterBadge />);
      unmount = res.unmount;
    });

    const firstDisplayed = getDisplayedDigitsFromBadge(
      screen.getByTestId("home-counter-badge")
    );

    unmount();

    act(() => {
      render(<HomeCounterBadge />);
    });

    const secondDisplayed = getDisplayedDigitsFromBadge(
      screen.getByTestId("home-counter-badge")
    );

    expect(secondDisplayed).toBe(firstDisplayed);
    expect(secondDisplayed).toBe(baseline(Date.now()).toLocaleString("en-US"));
  });

  it("hidden then visible re-syncs to baseline(now)", () => {
    vi.setSystemTime(istTime(2026, 11, 25, 10, 0, 0, 0));

    act(() => {
      render(<HomeCounterBadge />);
    });

    const beforeCount = baseline(Date.now());

    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const afterCount = baseline(Date.now());
    expect(afterCount).toBeGreaterThan(beforeCount);

    const badge = screen.getByTestId("home-counter-badge");
    expect(getDisplayedDigitsFromBadge(badge)).toBe(
      afterCount.toLocaleString("en-US")
    );
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
