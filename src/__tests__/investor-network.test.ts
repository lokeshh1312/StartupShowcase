import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as topojson from "topojson-client";
import type { Topology, Objects } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import {
  SEED_INVESTOR_REGIONS,
  SEED_INVESTORS_TOTAL,
  numericIdToAlpha2,
  getCountryFallbackCoordinates,
  FALLBACK_COUNTRY_COORDINATES,
} from "@/lib/country-map-data";
import { investorRegionSchema, getAvailableCountries } from "@/lib/validation";
import { aggregateInvestorNetworkData } from "@/server/investor-network";

describe("Investor Network Feature", () => {
  describe("1. Seed Data & Headline Total", () => {
    it("asserts that the sum of the 20 seed rows strictly equals 144,500", () => {
      const calculatedSum = SEED_INVESTOR_REGIONS.reduce(
        (acc, r) => acc + r.investors,
        0
      );
      expect(calculatedSum).toBe(144500);
      expect(calculatedSum).toBe(SEED_INVESTORS_TOTAL);
      expect(SEED_INVESTOR_REGIONS.length).toBe(20);
    });

    it("contains exact required seed figures", () => {
      const expected = [
        { code: "US", name: "United States", count: 18500 },
        { code: "IN", name: "India", count: 15200 },
        { code: "CN", name: "China", count: 14300 },
        { code: "GB", name: "United Kingdom", count: 11200 },
        { code: "DE", name: "Germany", count: 9800 },
        { code: "JP", name: "Japan", count: 8900 },
        { code: "CA", name: "Canada", count: 8100 },
        { code: "FR", name: "France", count: 7500 },
        { code: "AU", name: "Australia", count: 6900 },
        { code: "SG", name: "Singapore", count: 6200 },
        { code: "AE", name: "United Arab Emirates", count: 5800 },
        { code: "KR", name: "South Korea", count: 5400 },
        { code: "BR", name: "Brazil", count: 4900 },
        { code: "NL", name: "Netherlands", count: 4300 },
        { code: "CH", name: "Switzerland", count: 3900 },
        { code: "SE", name: "Sweden", count: 3500 },
        { code: "IT", name: "Italy", count: 3100 },
        { code: "ES", name: "Spain", count: 2700 },
        { code: "IL", name: "Israel", count: 2400 },
        { code: "ZA", name: "South Africa", count: 1900 },
      ];

      for (const row of expected) {
        const found = SEED_INVESTOR_REGIONS.find((r) => r.countryCode === row.code);
        expect(found).toBeDefined();
        expect(found?.countryName).toBe(row.name);
        expect(found?.investors).toBe(row.count);
      }
    });

    it("verifies migration SQL file exists and contains idempotent seed statements", () => {
      const sqlPath = resolve(__dirname, "../../supabase/migrations/0015_investor_regions.sql");
      const sql = readFileSync(sqlPath, "utf-8");

      expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.investor_regions");
      expect(sql).toContain("country_code char(2) PRIMARY KEY");
      expect(sql).toContain("investors integer NOT NULL CHECK (investors >= 0)");
      expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
      expect(sql).toContain("REVOKE ALL ON public.investor_regions FROM PUBLIC, anon, authenticated");
      expect(sql).toContain("ON CONFLICT (country_code) DO UPDATE");
      expect(sql).toContain("('US', 'United States', 18500, now())");
      expect(sql).toContain("('SG', 'Singapore', 6200, now())");
      expect(sql).toContain("('ZA', 'South Africa', 1900, now())");
    });
  });

  describe("2. Aggregation Helper", () => {
    it("merges investors and public startups, computes totals, and sorts correctly", () => {
      const investorRows = [
        { country_code: "US", country_name: "United States", investors: 18500 },
        { country_code: "DE", country_name: "Germany", investors: 9800 },
        { country_code: "SG", country_name: "Singapore", investors: 6200 },
      ];

      const startupRows = [
        { country_code: "US", count: 120 },
        { country_code: "DE", count: 45 },
        { country_code: "FR", count: 30 }, // France has startups but no investor row
      ];

      const asOfDate = "2026-11-09T10:00:00.000Z";
      const result = aggregateInvestorNetworkData(investorRows, startupRows, asOfDate);

      // Totals
      expect(result.totals.investors).toBe(18500 + 9800 + 6200); // 34500
      expect(result.totals.startups).toBe(120 + 45 + 30); // 195
      expect(result.asOf).toBe(asOfDate);
      expect(result.degraded).toBe(false);

      // Countries list
      expect(result.countries.length).toBe(4);

      // Check SG (investors > 0, startups = 0)
      const sg = result.countries.find((c) => c.code === "SG");
      expect(sg).toEqual({
        code: "SG",
        name: "Singapore",
        investors: 6200,
        startups: 0,
      });

      // Check FR (investors = 0, startups > 0)
      const fr = result.countries.find((c) => c.code === "FR");
      expect(fr).toEqual({
        code: "FR",
        name: "France",
        investors: 0,
        startups: 30,
      });

      // Check sorting order: investors desc, then startups desc, then name asc
      expect(result.countries[0].code).toBe("US"); // 18500
      expect(result.countries[1].code).toBe("DE"); // 9800
      expect(result.countries[2].code).toBe("SG"); // 6200
      expect(result.countries[3].code).toBe("FR"); // 0
    });

    it("handles tie-breaking by startups desc, then name asc", () => {
      const investorRows = [
        { country_code: "CA", country_name: "Canada", investors: 5000 },
        { country_code: "BR", country_name: "Brazil", investors: 5000 },
      ];
      const startupRows = [
        { country_code: "CA", count: 10 },
        { country_code: "BR", count: 20 },
      ];

      const res = aggregateInvestorNetworkData(investorRows, startupRows);
      expect(res.countries[0].code).toBe("BR"); // 5000 inv, 20 st
      expect(res.countries[1].code).toBe("CA"); // 5000 inv, 10 st
    });

    it("handles empty or degraded investor data by returning startup countries with investors = 0", () => {
      const emptyInvestorRows: Array<{
        country_code: string;
        country_name: string;
        investors: number;
      }> = [];

      const startupRows = [
        { country_code: "US", count: 120 },
        { country_code: "IN", count: 85 },
        { country_code: "GB", count: 40 },
      ];

      const res = aggregateInvestorNetworkData(emptyInvestorRows, startupRows, null);
      expect(res.totals.investors).toBe(0);
      expect(res.totals.startups).toBe(245);
      expect(res.countries.length).toBe(3);

      expect(res.countries[0]).toEqual({
        code: "US",
        name: "United States of America",
        investors: 0,
        startups: 120,
      });
      expect(res.countries[1]).toEqual({
        code: "IN",
        name: "India",
        investors: 0,
        startups: 85,
      });
      expect(res.countries[2]).toEqual({
        code: "GB",
        name: "United Kingdom",
        investors: 0,
        startups: 40,
      });
    });
  });

  describe("3. Zod Schemas for Admin Edits", () => {
    it("validates valid country codes and investor numbers", () => {
      const valid1 = investorRegionSchema.safeParse({
        countryCode: "US",
        investors: 1000,
      });
      expect(valid1.success).toBe(true);
      if (valid1.success) {
        expect(valid1.data.countryCode).toBe("US");
        expect(valid1.data.investors).toBe(1000);
      }

      // Lowercase normalization
      const validLower = investorRegionSchema.safeParse({
        countryCode: "de",
        investors: "500",
      });
      expect(validLower.success).toBe(true);
      if (validLower.success) {
        expect(validLower.data.countryCode).toBe("DE");
        expect(validLower.data.investors).toBe(500);
      }

      // Boundary values: 0 and 10,000,000
      const validZero = investorRegionSchema.safeParse({
        countryCode: "JP",
        investors: 0,
      });
      expect(validZero.success).toBe(true);

      const validMax = investorRegionSchema.safeParse({
        countryCode: "IN",
        investors: 10000000,
      });
      expect(validMax.success).toBe(true);
    });

    it("rejects invalid investor counts (negative, > 10M, non-integer)", () => {
      expect(
        investorRegionSchema.safeParse({ countryCode: "US", investors: -1 }).success
      ).toBe(false);

      expect(
        investorRegionSchema.safeParse({ countryCode: "US", investors: 10000001 }).success
      ).toBe(false);

      expect(
        investorRegionSchema.safeParse({ countryCode: "US", investors: 12.34 }).success
      ).toBe(false);

      expect(
        investorRegionSchema.safeParse({ countryCode: "US", investors: "not-a-number" }).success
      ).toBe(false);
    });

    it("rejects invalid country codes", () => {
      expect(
        investorRegionSchema.safeParse({ countryCode: "USA", investors: 100 }).success
      ).toBe(false);

      expect(
        investorRegionSchema.safeParse({ countryCode: "ZZ", investors: 100 }).success
      ).toBe(false);

      expect(
        investorRegionSchema.safeParse({ countryCode: "", investors: 100 }).success
      ).toBe(false);
    });
  });

  describe("4. Country Code Mapping & Shape Resolution", () => {
    const rawWorldData = JSON.parse(
      readFileSync(resolve(__dirname, "../../src/data/countries-110m.json"), "utf-8")
    );
    const topology = rawWorldData as unknown as Topology<Objects>;
    const featureCollection = topojson.feature(
      topology,
      topology.objects.countries
    ) as unknown as FeatureCollection<Geometry>;

    const polygonCodes = new Set<string>();
    for (const feat of featureCollection.features) {
      const code = numericIdToAlpha2(feat.id as string | number);
      if (code) {
        polygonCodes.add(code);
      }
    }

    it("asserts that numericIdToAlpha2 maps numeric ISO ids correctly", () => {
      expect(numericIdToAlpha2("840")).toBe("US");
      expect(numericIdToAlpha2("356")).toBe("IN");
      expect(numericIdToAlpha2("124")).toBe("CA");
      expect(numericIdToAlpha2("276")).toBe("DE");
      expect(numericIdToAlpha2(undefined)).toBeNull();
    });

    it("proves that every code in the seed list resolves to a map shape or fallback marker", () => {
      const seedCodes = SEED_INVESTOR_REGIONS.map((r) => r.countryCode);
      const missingFromAll: string[] = [];
      const hasPolygon: string[] = [];
      const hasFallbackMarker: string[] = [];

      for (const code of seedCodes) {
        if (polygonCodes.has(code)) {
          hasPolygon.push(code);
        } else if (getCountryFallbackCoordinates(code)) {
          hasFallbackMarker.push(code);
        } else {
          missingFromAll.push(code);
        }
      }

      // Exactly 19 of the 20 seed countries have 110m polygons
      expect(hasPolygon.length).toBe(19);
      // Exactly 1 seed country (SG - Singapore) does not have a 110m polygon and resolves to a marker
      expect(hasFallbackMarker).toEqual(["SG"]);
      // None are missing!
      expect(missingFromAll).toEqual([]);
    });

    it("proves that every country in the app's available country list resolves to a map shape or fallback marker", () => {
      const available = getAvailableCountries();
      const unresolved: string[] = [];

      for (const country of available) {
        const hasPoly = polygonCodes.has(country.code);
        const hasMarker = Boolean(getCountryFallbackCoordinates(country.code));

        if (!hasPoly && !hasMarker) {
          unresolved.push(country.code);
        }
      }

      // All 250 countries in the app resolve without dropping any
      expect(unresolved).toEqual([]);
      expect(available.length).toBeGreaterThan(240);
    });

    it("has fallback coordinates for known microstates and island territories", () => {
      expect(FALLBACK_COUNTRY_COORDINATES["SG"]).toBeDefined();
      expect(FALLBACK_COUNTRY_COORDINATES["MT"]).toBeDefined();
      expect(FALLBACK_COUNTRY_COORDINATES["MC"]).toBeDefined();
      expect(FALLBACK_COUNTRY_COORDINATES["HK"]).toBeDefined();
      expect(FALLBACK_COUNTRY_COORDINATES["BM"]).toBeDefined();
    });
  });
});
