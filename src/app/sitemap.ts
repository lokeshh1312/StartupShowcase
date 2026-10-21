import type { MetadataRoute } from "next";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { startups } from "@/db/schema";
import { CATEGORIES, getAvailableCountries } from "@/lib/validation";
import { listMonths } from "@/server/startups";
import { absoluteUrl } from "@/lib/urls";

export const revalidate = 3600; // Revalidate sitemap at most every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/browse"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/categories"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/countries"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/support"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/newsletter"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Category pages
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: absoluteUrl(`/categories/${cat.toLowerCase()}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. Country pages
  const countries = getAvailableCountries();
  const countryRoutes: MetadataRoute.Sitemap = countries.map((c) => ({
    url: absoluteUrl(`/countries/${c.code.toLowerCase()}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 4. Monthly cohort leaderboard pages
  const months = await listMonths();
  const monthRoutes: MetadataRoute.Sitemap = months.map((m) => ({
    url: absoluteUrl(`/months/${m.id}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 5. Approved Startups (EXCLUDING SAMPLE DATA)
  // =========================================================================
  // CRITICAL REQUIREMENT:
  // Sample startups (is_sample = true) are fake test data and MUST BE EXCLUDED
  // from sitemap.xml. They must never be indexed by search engines.
  // =========================================================================
  const approvedStartups = await db
    .select({
      slug: startups.slug,
      updatedAt: startups.updatedAt,
      createdAt: startups.createdAt,
    })
    .from(startups)
    .where(
      and(
        eq(startups.status, "approved"),
        eq(startups.isSample, false) // STRICT EXCLUSION OF SAMPLE STARTUPS
      )
    )
    .orderBy(desc(startups.createdAt))
    .limit(5000);

  const startupRoutes: MetadataRoute.Sitemap = approvedStartups.map((s) => ({
    url: absoluteUrl(`/startup/${s.slug}`),
    lastModified: s.updatedAt || s.createdAt || now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...countryRoutes,
    ...monthRoutes,
    ...startupRoutes,
  ];
}
