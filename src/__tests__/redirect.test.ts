import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/redirect";

describe("safeRedirectPath Open Redirect Protection", () => {
  it("rejects protocol-relative URL //evil.com", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
  });

  it("rejects absolute https scheme https://evil.com", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
  });

  it("rejects backslash evasion /\\evil.com", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
  });

  it("rejects javascript scheme javascript:alert(1)", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("allows valid relative internal path with query /browse?x=1", () => {
    expect(safeRedirectPath("/browse?x=1")).toBe("/browse?x=1");
  });

  it("allows standard internal paths", () => {
    expect(safeRedirectPath("/")).toBe("/");
    expect(safeRedirectPath("/startup/agrisense")).toBe("/startup/agrisense");
    expect(safeRedirectPath("/saved")).toBe("/saved");
    expect(safeRedirectPath("/me/submissions")).toBe("/me/submissions");
  });

  it("rejects null, undefined, and empty string", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("   ")).toBe("/");
  });

  it("supports custom fallback", () => {
    expect(safeRedirectPath("//evil.com", "/browse")).toBe("/browse");
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });

  it("rejects strings containing backslashes anywhere in path", () => {
    expect(safeRedirectPath("/foo\\bar")).toBe("/");
    expect(safeRedirectPath("/test/\\evil.com")).toBe("/");
  });

  it("rejects data: and mailto: schemes", () => {
    expect(safeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(safeRedirectPath("mailto:test@example.com")).toBe("/");
  });
});
