import { describe, it, expect, vi, beforeEach } from "vitest";
import { captureException, useErrorTracker } from "@/lib/error-tracking";

describe("error tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("safely captures exceptions without crashing when Sentry is not configured", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      captureException(new Error("Test explosion"), {
        componentName: "TestComponent",
      });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  it("provides hook with captureException", () => {
    const { captureException: hookCapture } = useErrorTracker();
    expect(typeof hookCapture).toBe("function");
    expect(() => hookCapture("String error")).not.toThrow();
  });
});
