import type { MetadataRoute } from "next";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { startups } from "@/db/schema";
import { absoluteUrl } from "@/lib/urls";
import { STATIC_PAGES_LAST_MODIFIED } from "@/lib/seo";

// Dynamic rendering so database failures return an HTTP error at request time
// (causing search engines to retry) while never failing next build when offline.
export const dynamic = "force-dynamic";

// In-memory 1-hour cache for sitemap entries to minimize database load
let cachedSitemap: { timestamp: number; data: MetadataRoute.Sitemap } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Return cached sitemap if within 1-hour TTL
  if (cachedSitemap && Date.now() - cachedSitemap.timestamp < CACHE_TTL_MS) {
    return cachedSitemap.data;
  }

  // 1. Static public pages with constant, deterministic lastModified
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/browse"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/categories"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/countries"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/support"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/newsletter"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/cookies"),
      lastModified: STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    // Condition: ONLY approved and NON-SAMPLE startups
    const nonSampleApprovedCondition = and(
      eq(startups.status, "approved"),
      eq(startups.isSample, false)
    );

    // 2. Category pages: ONLY categories that have at least 1 approved, non-sample startup
    const activeCategories = await db
      .select({
        category: startups.category,
        lastModified: sql<Date | null>`max(coalesce(${startups.updatedAt}, ${startups.createdAt}))`,
      })
      .from(startups)
      .where(nonSampleApprovedCondition)
      .groupBy(startups.category);

    const categoryRoutes: MetadataRoute.Sitemap = activeCategories.map((c) => ({
      url: absoluteUrl(`/categories/${c.category.toLowerCase()}`),
      lastModified: c.lastModified ? new Date(c.lastModified) : STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    // 3. Country pages: ONLY countries that have at least 1 approved, non-sample startup
    // Note: The static "all countries" list is removed.
    const activeCountries = await db
      .select({
        countryCode: startups.countryCode,
        lastModified: sql<Date | null>`max(coalesce(${startups.updatedAt}, ${startups.createdAt}))`,
      })
      .from(startups)
      .where(nonSampleApprovedCondition)
      .groupBy(startups.countryCode);

    const countryRoutes: MetadataRoute.Sitemap = activeCountries.map((c) => ({
      url: absoluteUrl(`/countries/${c.countryCode.toLowerCase()}`),
      lastModified: c.lastModified ? new Date(c.lastModified) : STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // 4. Monthly cohort leaderboard pages: ONLY months with approved, non-sample startups
    const activeMonths = await db
      .select({
        month: startups.month,
        lastModified: sql<Date | null>`max(coalesce(${startups.updatedAt}, ${startups.createdAt}))`,
      })
      .from(startups)
      .where(nonSampleApprovedCondition)
      .groupBy(startups.month);

    const monthRoutes: MetadataRoute.Sitemap = activeMonths.map((m) => {
      const monthStr =
        typeof m.month === "string"
          ? m.month.slice(0, 7)
          : new Date(m.month).toISOString().slice(0, 7);
      return {
        url: absoluteUrl(`/months/${monthStr}`),
        lastModified: m.lastModified ? new Date(m.lastModified) : STATIC_PAGES_LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    // 5. Approved Startups (STRICTLY EXCLUDING SAMPLE DATA)
    const approvedStartups = await db
      .select({
        slug: startups.slug,
        lastModified: sql<Date | null>`coalesce(${startups.updatedAt}, ${startups.createdAt})`,
      })
      .from(startups)
      .where(nonSampleApprovedCondition)
      .orderBy(desc(startups.createdAt))
      .limit(5000);

    const startupRoutes: MetadataRoute.Sitemap = approvedStartups.map((s) => ({
      url: absoluteUrl(`/startup/${s.slug}`),
      lastModified: s.lastModified ? new Date(s.lastModified) : STATIC_PAGES_LAST_MODIFIED,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const fullSitemap: MetadataRoute.Sitemap = [
      ...staticRoutes,
      ...categoryRoutes,
      ...countryRoutes,
      ...monthRoutes,
      ...startupRoutes,
    ];

    cachedSitemap = {
      timestamp: Date.now(),
      data: fullSitemap,
    };

    return fullSitemap;
  } catch (error) {
    // Resilience: If database is unreachable during 'next build', return staticRoutes
    // so build never fails. At request time, re-throw so crawler receives HTTP 500/503 and retries.
    const isBuildPhase =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build" ||
      !process.env.DATABASE_URL;

    if (isBuildPhase) {
      console.warn(
        "Sitemap warning: Database unreachable during build. Falling back to static routes.",
        error
      );
      return staticRoutes;
    }

    // At request time, throw so crawlers receive an error status and retry later
    console.error("Sitemap request error: Database query failed:", error);
    throw error;
  }
}
