import { describe, it, expect, vi } from "vitest";
import { normalizeDomain, checkStartupDuplicate } from "@/server/duplicates";
import { db } from "@/db";

describe("normalizeDomain", () => {
  it("strips www and converts to lowercase", () => {
    expect(normalizeDomain("https://www.Example.COM/landing")).toBe("example.com");
    expect(normalizeDomain("http://www.ACME.org")).toBe("acme.org");
    expect(normalizeDomain("www.startupshowcase.com/about")).toBe("startupshowcase.com");
  });

  it("handles URLs without protocol or www", () => {
    expect(normalizeDomain("my-app.io/docs")).toBe("my-app.io");
    expect(normalizeDomain("https://tech.co/features?ref=producthunt")).toBe("tech.co");
  });

  it("discards query strings, hashes, and paths", () => {
    expect(
      normalizeDomain("https://www.deepmind.google/technologies/gemini/#overview")
    ).toBe("deepmind.google");
  });

  it("returns empty string on empty or missing input", () => {
    expect(normalizeDomain("")).toBe("");
    expect(normalizeDomain("   ")).toBe("");
  });
});

describe("checkStartupDuplicate", () => {
  it("detects exact normalized domain matches", async () => {
    vi.spyOn(db, "execute").mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-a111-111111111111",
        name: "Acme App",
        slug: "acme-app",
        website_url: "https://www.acme.co/home",
      },
    ] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const result = await checkStartupDuplicate("New Acme Product", "http://acme.co");
    expect(result).not.toBeNull();
    expect(result?.reason).toBe("domain");
    expect(result?.slug).toBe("acme-app");
  });

  it("detects similar names above 0.6 similarity", async () => {
    // 1st query: domain check (no match)
    vi.spyOn(db, "execute")
      .mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof db.execute>>)
      // 2nd query: pg_trgm similarity check (returns high similarity)
      .mockResolvedValueOnce([
        {
          id: "22222222-2222-4222-a222-222222222222",
          name: "Stripe",
          slug: "stripe",
          sim: 0.85,
        },
      ] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const result = await checkStartupDuplicate("Stripe Payments", "https://different-domain.com");
    expect(result).not.toBeNull();
    expect(result?.reason).toBe("name_similarity");
    expect(result?.name).toBe("Stripe");
  });

  it("returns null when no duplicates exist", async () => {
    vi.spyOn(db, "execute")
      .mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof db.execute>>)
      .mockResolvedValueOnce([] as unknown as Awaited<ReturnType<typeof db.execute>>);

    const result = await checkStartupDuplicate("Unique Brand Name", "https://brandnewdomain123.com");
    expect(result).toBeNull();
  });
});
