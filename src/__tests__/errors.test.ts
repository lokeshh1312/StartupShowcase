import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { formatActionError } from "@/server/errors";

describe("formatActionError Helper", () => {
  it("reduces ZodError to first human-readable message without JSON dumping", () => {
    const testSchema = z.object({
      name: z.string().min(1, "Startup name is required"),
      email: z.string().email("Enter a valid email address"),
    });

    const result = testSchema.safeParse({ name: "", email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatActionError(result.error);
      expect(formatted).toBe("Startup name is required");
      // Must not be a JSON dump
      expect(formatted).not.toContain("{");
      expect(formatted).not.toContain("[");
      expect(formatted).not.toContain('"code":');
    }
  });

  it("prefixes field name when Zod issue does not mention field name", () => {
    const testSchema = z.object({
      stage: z.enum(["MVP", "Prototype"]),
    });

    const result = testSchema.safeParse({ stage: "invalid" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatActionError(result.error);
      expect(formatted).toContain("stage:");
      expect(formatted).not.toContain("{");
    }
  });

  it("returns known 'not found or not approved' error as friendly message", () => {
    const err = new Error("Startup not found or not approved for voting.");
    expect(formatActionError(err)).toBe(
      "Startup not found or not approved for voting."
    );
  });

  it("returns known forbidden error as friendly message", () => {
    const err = new Error("Forbidden: Admin privileges required.");
    expect(formatActionError(err)).toBe(
      "Forbidden: Admin privileges required."
    );
  });

  it("returns unauthenticated as friendly message", () => {
    expect(formatActionError("unauthenticated")).toBe("unauthenticated");
    expect(formatActionError(new Error("unauthenticated"))).toBe(
      "unauthenticated"
    );
  });

  it("returns founder role requirement message", () => {
    const err = new Error(
      "Only users with the Founder role can submit startups. Please update your role or register as a founder."
    );
    expect(formatActionError(err)).toContain(
      "Only users with the Founder role can submit startups"
    );
  });

  it("returns draft and payment deletion protection errors as user-facing friendly messages", () => {
    const messages = [
      "Only unpaid draft submissions awaiting payment can be deleted",
      "This draft has a checkout in progress",
      "Startups with paid or refunded payments cannot be deleted",
      "Payment records cannot be deleted unless older than 7 days",
      "This draft has a checkout in progress. It can be deleted after 7 days, or you can edit it or resume payment.",
      "Startups with paid or refunded payments cannot be deleted. Paid startups can be rejected but not deleted.",
    ];

    for (const msg of messages) {
      expect(formatActionError(new Error(msg))).toBe(msg);
      expect(formatActionError(msg)).toBe(msg);
    }
  });

  it("masks unexpected database or system errors and logs to console.error", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const unexpectedErr = new Error(
      "relation \"public.startups\" does not exist at postgres.js:231"
    );

    const formatted = formatActionError(unexpectedErr);
    expect(formatted).toBe("Something went wrong. Please try again.");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("masks unknown errors and returns friendly fallback", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(formatActionError({ unknownCrash: true })).toBe(
      "Something went wrong. Please try again."
    );
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
