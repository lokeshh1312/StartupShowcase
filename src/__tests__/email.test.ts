import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/server/email";

describe("Email Security & Escaping (escapeHtml)", () => {
  it("escapes dangerous HTML characters to prevent XSS/injection", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );

    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );

    expect(escapeHtml("Tom & Jerry > Sylvester < Tweety")).toBe(
      "Tom &amp; Jerry &gt; Sylvester &lt; Tweety"
    );
  });

  it("handles empty or nullish inputs safely", () => {
    expect(escapeHtml("")).toBe("");
    // @ts-expect-error test runtime robustness
    expect(escapeHtml(null)).toBe("");
    // @ts-expect-error test runtime robustness
    expect(escapeHtml(undefined)).toBe("");
  });

  it("leaves standard alphanumeric and punctuation characters intact", () => {
    const safeString = "Startup Showcase 2026: The best early-stage discoveries.";
    expect(escapeHtml(safeString)).toBe(safeString);
  });
});
