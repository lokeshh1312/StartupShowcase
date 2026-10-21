import { describe, it, expect } from "vitest";
import {
  createStartupSchema,
  normalizeUrl,
  normalizeMonthToDate,
  formatMonthLabel,
  countryCodeSchema,
  formatLocation,
  CATEGORIES,
  STAGES,
} from "../lib/validation";
import { buildSafePrefixTsQuery } from "../lib/search";

describe("Validation Schemas & Normalization", () => {
  describe("normalizeUrl", () => {
    it("prepends https:// when protocol is missing", () => {
      expect(normalizeUrl("example.com")).toBe("https://example.com/");
      expect(normalizeUrl("subdomain.startup.io/path")).toBe(
        "https://subdomain.startup.io/path"
      );
    });

    it("preserves valid http and https URLs", () => {
      expect(normalizeUrl("https://startup.com")).toBe("https://startup.com/");
      expect(normalizeUrl("http://legacy.startup.com")).toBe(
        "http://legacy.startup.com/"
      );
    });

    it("rejects invalid or unsafe schemes", () => {
      expect(normalizeUrl("javascript:alert(1)")).toBe("");
      expect(normalizeUrl("ftp://files.com")).toBe("");
      expect(normalizeUrl("data:text/html,test")).toBe("");
    });

    it("rejects URLs with credentials", () => {
      expect(normalizeUrl("https://admin:secret@malicious.com")).toBe("");
    });

    it("returns empty string for empty or null inputs", () => {
      expect(normalizeUrl("")).toBe("");
      expect(normalizeUrl(null)).toBe("");
      expect(normalizeUrl(undefined)).toBe("");
      expect(normalizeUrl("   ")).toBe("");
    });
  });

  describe("normalizeMonthToDate & formatMonthLabel", () => {
    it("normalizes YYYY-MM and YYYY-MM-DD to YYYY-MM-01", () => {
      expect(normalizeMonthToDate("2026-10")).toBe("2026-10-01");
      expect(normalizeMonthToDate("2026-10-15")).toBe("2026-10-01");
      expect(normalizeMonthToDate("2027-01-01")).toBe("2027-01-01");
    });

    it("normalizes legacy slug month format (e.g. oct-2026)", () => {
      expect(normalizeMonthToDate("oct-2026")).toBe("2026-10-01");
      expect(normalizeMonthToDate("sep-2026")).toBe("2026-09-01");
      expect(normalizeMonthToDate("aug-2026")).toBe("2026-08-01");
    });

    it("normalizes Date instances using UTC", () => {
      const date = new Date(Date.UTC(2026, 9, 15)); // Month index 9 = October
      expect(normalizeMonthToDate(date)).toBe("2026-10-01");
    });

    it("throws on invalid month strings", () => {
      expect(() => normalizeMonthToDate("invalid-month")).toThrow();
      expect(() => normalizeMonthToDate("2026-13")).toThrow();
    });

    it("formats readable UTC month label", () => {
      expect(formatMonthLabel("2026-10-01")).toBe("October 2026");
      expect(formatMonthLabel("2026-01-01")).toBe("January 2026");
    });
  });

  describe("countryCodeSchema & formatLocation", () => {
    it("accepts valid ISO 3166-1 alpha-2 codes and normalizes to uppercase", () => {
      expect(countryCodeSchema.parse("us")).toBe("US");
      expect(countryCodeSchema.parse("IN")).toBe("IN");
      expect(countryCodeSchema.parse("gb")).toBe("GB");
      expect(countryCodeSchema.parse("DE")).toBe("DE");
      expect(countryCodeSchema.parse("jp")).toBe("JP");
      expect(countryCodeSchema.parse("br")).toBe("BR");
    });

    it("rejects invalid, empty, or non-alpha2 codes", () => {
      expect(() => countryCodeSchema.parse("USA")).toThrow();
      expect(() => countryCodeSchema.parse("ZZ")).toThrow();
      expect(() => countryCodeSchema.parse("12")).toThrow();
      expect(() => countryCodeSchema.parse("")).toThrow();
    });

    it("formats location correctly with region, city, and remote-first flag", () => {
      expect(
        formatLocation({
          countryCode: "US",
          region: "California",
          city: "San Francisco",
          remoteFirst: true,
        })
      ).toBe("San Francisco, California, United States of America, (Remote)");

      expect(
        formatLocation({
          countryCode: "CA",
          region: "Ontario",
          city: "Toronto",
          remoteFirst: false,
        })
      ).toBe("Toronto, Ontario, Canada");

      expect(
        formatLocation({
          countryCode: "DE",
          city: "Berlin",
        })
      ).toBe("Berlin, Germany");
    });
  });

  describe("createStartupSchema", () => {
    // Note: month is no longer part of the client schema.
    // The server decides the launch month at approval time.
    const validData = {
      name: "AgriSense",
      ideaTitle: "AI-Based Crop Health Monitoring",
      tagline: "Drone and AI-based precision agriculture.",
      description: "Drone and AI-based solution for early crop disease detection.",
      category: "AgriTech",
      countryCode: "GB",
      region: "England",
      city: "London",
      remoteFirst: false,
      stage: "MVP",
      websiteUrl: "https://agrisense.io",
      logoColor: "#16A34A",
      founder: {
        name: "Dr. Rowan Smith",
        role: "Founder",
        avatar: "https://images.unsplash.com/avatar",
        quote: "Saving crops with AI.",
      },
      keyFeatures: ["NDVI Drone Mapping", "Edge AI Inference"],
      techStack: ["PyTorch", "React Native"],
    };

    it("successfully validates and transforms a complete valid payload", () => {
      const parsed = createStartupSchema.parse(validData);
      expect(parsed.name).toBe("AgriSense");
      expect(parsed.ideaTitle).toBe("AI-Based Crop Health Monitoring");
      expect(parsed.countryCode).toBe("GB");
      // month is no longer in the schema output
      expect(parsed.location).toBe("London, England, United Kingdom");
      expect(parsed.websiteUrl).toBe("https://agrisense.io/");
    });

    it("does not accept a month field from client input", () => {
      // Even if the client sends month, it should be ignored/stripped
      const withMonth = { ...validData, month: "2026-10-01" };
      const parsed = createStartupSchema.parse(withMonth);
      // The output should not contain a month property from the schema
      expect((parsed as Record<string, unknown>).month).toBeUndefined();
    });

    it("defaults ideaTitle to name if omitted", () => {
      const { ideaTitle, ...withoutIdeaTitle } = validData;
      void ideaTitle;
      const parsed = createStartupSchema.parse(withoutIdeaTitle);
      expect(parsed.ideaTitle).toBe("AgriSense");
    });

    it("rejects names that are empty or exceed 100 characters", () => {
      expect(() =>
        createStartupSchema.parse({ ...validData, name: "" })
      ).toThrow();
      expect(() =>
        createStartupSchema.parse({
          ...validData,
          name: "A".repeat(101),
        })
      ).toThrow();
    });

    it("rejects descriptions under 10 or over 500 characters", () => {
      expect(() =>
        createStartupSchema.parse({
          ...validData,
          description: "Too short",
        })
      ).toThrow();
      expect(() =>
        createStartupSchema.parse({
          ...validData,
          description: "D".repeat(501),
        })
      ).toThrow();
    });

    it("rejects invalid categories and stages", () => {
      expect(() =>
        createStartupSchema.parse({
          ...validData,
          category: "InvalidCategory",
        })
      ).toThrow();

      expect(() =>
        createStartupSchema.parse({
          ...validData,
          stage: "All Stages", // Filter option, not valid startup submission stage
        })
      ).toThrow();
    });

    it("verifies all supported categories and stages can be parsed", () => {
      for (const cat of CATEGORIES) {
        const parsed = createStartupSchema.parse({
          ...validData,
          category: cat,
        });
        expect(parsed.category).toBe(cat);
      }

      for (const stg of STAGES) {
        const parsed = createStartupSchema.parse({
          ...validData,
          stage: stg,
        });
        expect(parsed.stage).toBe(stg);
      }
    });

    it("validates hex logo colors", () => {
      expect(
        createStartupSchema.parse({ ...validData, logoColor: "#2563EB" })
          .logoColor
      ).toBe("#2563EB");
      expect(() =>
        createStartupSchema.parse({ ...validData, logoColor: "not-a-color" })
      ).toThrow();
    });
  });

  describe("buildSafePrefixTsQuery", () => {
    it("returns null for empty or whitespace-only input", () => {
      expect(buildSafePrefixTsQuery("")).toBeNull();
      expect(buildSafePrefixTsQuery("   ")).toBeNull();
      expect(buildSafePrefixTsQuery("!!!")).toBeNull();
    });

    it("builds prefix tsquery for ASCII words", () => {
      expect(buildSafePrefixTsQuery("agri")).toBe("agri:*");
      expect(buildSafePrefixTsQuery("agri ai")).toBe("agri:* & ai:*");
    });

    it("strips non-letter, non-number, non-space characters", () => {
      expect(buildSafePrefixTsQuery("hello-world!")).toBe("hello:* & world:*");
    });

    it("caps at 8 words", () => {
      const input = "one two three four five six seven eight nine ten";
      const result = buildSafePrefixTsQuery(input);
      // Should only have 8 terms
      expect(result).toBe(
        "one:* & two:* & three:* & four:* & five:* & six:* & seven:* & eight:*"
      );
    });

    it("handles Japanese input (Unicode letters)", () => {
      // "東京テック" = Tokyo Tech in Japanese
      const result = buildSafePrefixTsQuery("東京テック");
      expect(result).toBe("東京テック:*");
    });

    it("handles Japanese multi-word input", () => {
      const result = buildSafePrefixTsQuery("東京 テクノロジー");
      expect(result).toBe("東京:* & テクノロジー:*");
    });

    it("handles Arabic input (Unicode letters)", () => {
      // "تقنية" = Technology in Arabic
      const result = buildSafePrefixTsQuery("تقنية");
      expect(result).toBe("تقنية:*");
    });

    it("handles Arabic multi-word input", () => {
      const result = buildSafePrefixTsQuery("شركة ناشئة");
      expect(result).toBe("شركة:* & ناشئة:*");
    });

    it("handles mixed Latin and non-Latin scripts", () => {
      const result = buildSafePrefixTsQuery("Tokyo 東京 startup");
      expect(result).toBe("Tokyo:* & 東京:* & startup:*");
    });
  });
});
