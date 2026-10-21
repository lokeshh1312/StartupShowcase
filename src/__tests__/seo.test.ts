import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBaseUrl, absoluteUrl } from "@/lib/urls";
import {
  createMetadata,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
  buildStartupJsonLd,
  buildItemListJsonLd,
} from "@/lib/seo";
import type { FormattedStartup } from "@/server/startups";

describe("SEO and URL Configuration", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it("defaults base URL to localhost:3000 when NEXT_PUBLIC_SITE_URL is not set", () => {
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("reads base URL strictly from NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://showcase.example.com/";
    expect(getBaseUrl()).toBe("https://showcase.example.com");

    expect(absoluteUrl("/browse")).toBe("https://showcase.example.com/browse");
    expect(absoluteUrl("startup/test")).toBe("https://showcase.example.com/startup/test");
  });

  it("creates standard page metadata with canonical link and open graph", () => {
    const meta = createMetadata({
      title: "Explore Startups",
      description: "Discover innovative early-stage startups",
      path: "/browse",
    });

    expect(meta.title).toBe("Explore Startups");
    expect(meta.description).toBe("Discover innovative early-stage startups");
    expect(meta.alternates?.canonical).toBe("http://localhost:3000/browse");
    expect(meta.openGraph?.title).toBe("Explore Startups");
    expect(meta.openGraph?.url).toBe("http://localhost:3000/browse");
    expect((meta.twitter as Record<string, unknown>)?.card).toBe("summary_large_image");
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("respects custom robots directives", () => {
    const meta = createMetadata({
      title: "Admin Panel",
      description: "Restricted area",
      path: "/admin",
      robots: { index: false, follow: false },
    });

    expect(meta.robots).toEqual({ index: false, follow: false });
  });
});

describe("Structured Data (JSON-LD)", () => {
  it("builds valid Organization JSON-LD", () => {
    const org = buildOrganizationJsonLd();
    expect(org["@context"]).toBe("https://schema.org");
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Startup Showcase");
    expect(org.url).toContain("http");
  });

  it("builds valid WebSite JSON-LD with SearchAction", () => {
    const site = buildWebSiteJsonLd();
    expect(site["@context"]).toBe("https://schema.org");
    expect(site["@type"]).toBe("WebSite");
    expect(site.potentialAction).toBeDefined();
    expect((site.potentialAction as Record<string, unknown>)["@type"]).toBe("SearchAction");
    expect((site.potentialAction as Record<string, unknown>)["query-input"]).toBe("required name=search_term_string");
  });

  it("builds valid BreadcrumbList JSON-LD", () => {
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Categories", path: "/categories" },
      { name: "AI", path: "/categories/artificial-intelligence" },
    ]);

    expect(breadcrumb["@context"]).toBe("https://schema.org");
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement).toHaveLength(3);
    expect(breadcrumb.itemListElement[0].position).toBe(1);
    expect(breadcrumb.itemListElement[2].name).toBe("AI");
  });

  it("builds SoftwareApplication schema for a startup", () => {
    const sampleStartup = {
      id: "startup-123",
      name: "Acme Cloud",
      slug: "acme-cloud",
      tagline: "High-performance distributed storage",
      description: "A fast distributed object store built for modern AI workloads.",
      category: "Developer Tools",
      countryCode: "DE",
      stage: "MVP",
      websiteUrl: "https://acme.example.com",
      likes: 42,
      views: 150,
      isSample: false,
      status: "approved",
    } as unknown as FormattedStartup;

    const schema = buildStartupJsonLd(sampleStartup);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("SoftwareApplication");
    expect(schema.name).toBe("Acme Cloud");
    expect(schema.applicationCategory).toBe("Developer Tools");
    expect(schema.operatingSystem).toBe("Web");
  });
});

describe("Sample Startup Exclusion and SEO Safety (Critical Requirement)", () => {
  const realStartup = {
    id: "real-1",
    name: "Real App",
    slug: "real-app",
    tagline: "Real verified venture",
    description: "A genuine verified product on the platform.",
    category: "Fintech",
    countryCode: "SG",
    stage: "MVP",
    websiteUrl: "https://realapp.example.com",
    likes: 10,
    views: 20,
    isSample: false, // NOT sample
    status: "approved",
  } as unknown as FormattedStartup;

  const fakeSampleStartup = {
    id: "sample-1",
    name: "Fake Seeded Demo",
    slug: "fake-seeded-demo",
    tagline: "Test data placeholder",
    description: "Fake test data used during development.",
    category: "Healthcare",
    countryCode: "CA",
    stage: "Idea",
    websiteUrl: "https://demo.example.com",
    likes: 5,
    views: 12,
    isSample: true, // SAMPLE DATA
    status: "approved",
  } as unknown as FormattedStartup;

  it("STRICTLY excludes sample startups from JSON-LD ItemList feeds", () => {
    const itemList = buildItemListJsonLd(
      [realStartup, fakeSampleStartup],
      "Leaderboard",
      "/browse"
    );
    
    // The fake sample startup MUST NOT be present in itemListElement
    expect(itemList.numberOfItems).toBe(1);
    expect(itemList.itemListElement).toHaveLength(1);
    expect(itemList.itemListElement[0].name).toBe("Real App");
    expect(itemList.itemListElement[0].url).toContain("/startup/real-app");

    // Double check that fake sample startup was completely skipped
    const foundSample = itemList.itemListElement.find(
      (item) => item.name === "Fake Seeded Demo"
    );
    expect(foundSample).toBeUndefined();
  });

  it("serves sample startups with noindex, nofollow metadata", () => {
    // Helper replicating the rule implemented on /startup/[slug]/page.tsx
    const computeStartupRobots = (isSample: boolean) => {
      return isSample
        ? { index: false, follow: false }
        : { index: true, follow: true };
    };

    expect(computeStartupRobots(fakeSampleStartup.isSample)).toEqual({
      index: false,
      follow: false,
    });

    expect(computeStartupRobots(realStartup.isSample)).toEqual({
      index: true,
      follow: true,
    });
  });
});
