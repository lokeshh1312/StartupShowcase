import { describe, it, expect } from "vitest";
import {
  getUtcMonthStart,
  getUtcMonthEnd,
  toUtcDateString,
  formatDisplayDate,
  formatMonthYear,
} from "../lib/dates";

describe("UTC Dates and Locales", () => {
  it("computes exact UTC month boundaries", () => {
    const start = getUtcMonthStart("2026-10-15T15:30:00Z");
    expect(start.toISOString()).toBe("2026-10-01T00:00:00.000Z");

    const end = getUtcMonthEnd("2026-10-15T15:30:00Z");
    expect(end.toISOString()).toBe("2026-10-31T23:59:59.999Z");
  });

  it("formats UTC date string as YYYY-MM-DD", () => {
    expect(toUtcDateString(new Date("2026-10-05T00:00:00Z"))).toBe("2026-10-05");
  });

  it("formats month and year in UTC without timezone drift", () => {
    expect(formatMonthYear("2026-10-01T00:00:00Z")).toBe("October 2026");
    expect(formatMonthYear("2026-08-01T00:00:00Z")).toBe("August 2026");
  });

  it("formats display dates with locale options", () => {
    const formatted = formatDisplayDate("2026-10-21T12:00:00Z", "en-US", {
      timeZone: "UTC",
    });
    expect(formatted).toBe("Oct 21, 2026");
  });
});
