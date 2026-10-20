import { describe, it, expect } from "vitest";
import {
  parseThemeCookie,
  resolveThemeClass,
  buildThemeCookieValue,
} from "@/lib/theme";

// ---------------------------------------------------------------------------
// parseThemeCookie
// ---------------------------------------------------------------------------

describe("parseThemeCookie", () => {
  it("returns null for undefined input", () => {
    expect(parseThemeCookie(undefined)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(parseThemeCookie(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseThemeCookie("")).toBeNull();
  });

  it("returns null when the theme cookie is absent", () => {
    expect(parseThemeCookie("session=abc123; lang=en")).toBeNull();
  });

  it('parses "light"', () => {
    expect(parseThemeCookie("theme=light")).toBe("light");
  });

  it('parses "dark"', () => {
    expect(parseThemeCookie("theme=dark")).toBe("dark");
  });

  it('parses "system"', () => {
    expect(parseThemeCookie("theme=system")).toBe("system");
  });

  it("parses the theme cookie when it appears after other cookies", () => {
    expect(parseThemeCookie("session=xyz; theme=dark; lang=en")).toBe("dark");
  });

  it("returns null for an unrecognised value", () => {
    expect(parseThemeCookie("theme=purple")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveThemeClass
// ---------------------------------------------------------------------------

describe("resolveThemeClass", () => {
  it('returns "light" when preference is "light" regardless of system', () => {
    expect(resolveThemeClass("light", true)).toBe("light");
    expect(resolveThemeClass("light", false)).toBe("light");
  });

  it('returns "dark" when preference is "dark" regardless of system', () => {
    expect(resolveThemeClass("dark", true)).toBe("dark");
    expect(resolveThemeClass("dark", false)).toBe("dark");
  });

  it('returns system preference when preference is "system"', () => {
    expect(resolveThemeClass("system", true)).toBe("dark");
    expect(resolveThemeClass("system", false)).toBe("light");
  });

  it("defaults to system when preference is null", () => {
    expect(resolveThemeClass(null, true)).toBe("dark");
    expect(resolveThemeClass(null, false)).toBe("light");
  });
});

// ---------------------------------------------------------------------------
// buildThemeCookieValue
// ---------------------------------------------------------------------------

describe("buildThemeCookieValue", () => {
  it("produces a valid Set-Cookie string for light", () => {
    const val = buildThemeCookieValue("light");
    expect(val).toContain("theme=light");
    expect(val).toContain("path=/");
    expect(val).toContain("SameSite=Lax");
    expect(val).toMatch(/max-age=\d+/);
  });

  it("produces a valid Set-Cookie string for dark", () => {
    const val = buildThemeCookieValue("dark");
    expect(val).toContain("theme=dark");
  });

  it("produces a valid Set-Cookie string for system", () => {
    const val = buildThemeCookieValue("system");
    expect(val).toContain("theme=system");
  });

  it("sets max-age to 1 year (31536000 seconds)", () => {
    const val = buildThemeCookieValue("light");
    expect(val).toContain("max-age=31536000");
  });
});
