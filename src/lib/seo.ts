import type { Metadata } from "next";
import { absoluteUrl, getBaseUrl } from "./urls";
import type { FormattedStartup } from "@/server/startups";

export const SITE_NAME = "Startup Showcase";
export const DEFAULT_SITE_TITLE = "Startup Showcase | Discover Emerging Startups";
export const DEFAULT_SITE_DESCRIPTION =
  "Global startup discovery and monthly leaderboard for early-stage tech startups, prototypes, and MVPs.";

interface CreateMetadataOptions {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
  image?: string;
  type?: "website" | "article";
}

/**
 * Generates unified metadata with canonical URL, Open Graph, and Twitter card.
 */
export function createMetadata({
  title,
  description,
  path,
  robots,
  image,
  type = "website",
}: CreateMetadataOptions): Metadata {
  const canonicalUrl = absoluteUrl(path);
  const defaultOgImage = image || absoluteUrl("/opengraph-image");
  const formattedTitle = title.includes(`| ${SITE_NAME}`)
    ? { absolute: title }
    : title;

  return {
    title: formattedTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: robots ?? {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultOgImage],
    },
  };
}

/**
 * JSON-LD: Organization schema for the home page.
 */
export function buildOrganizationJsonLd() {
  const siteUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl("/opengraph-image"),
    description: DEFAULT_SITE_DESCRIPTION,
  };
}

/**
 * JSON-LD: WebSite schema with SearchAction for the home page.
 */
export function buildWebSiteJsonLd() {
  const siteUrl = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON-LD: BreadcrumbList schema.
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * JSON-LD: SoftwareApplication / Product schema for a startup.
 */
export function buildStartupJsonLd(startup: FormattedStartup) {
  const startupUrl = absoluteUrl(`/startup/${startup.slug}`);
  const ogImageUrl = absoluteUrl(`/startup/${startup.slug}/opengraph-image`);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: startup.name,
    headline: startup.tagline || startup.ideaTitle,
    description: startup.description,
    url: startupUrl,
    applicationCategory: startup.category,
    operatingSystem: "Web",
    image: startup.coverImage || startup.thumbnail || ogImageUrl,
    author: {
      "@type": "Person",
      name: startup.founderJson?.name || "Founder",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: Math.max(1, startup.likes || 1),
      ratingCount: Math.max(1, startup.likes || 1),
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/**
 * JSON-LD: ItemList schema for leaderboards and categories.
 * CRITICAL REQUIREMENT:
 * Sample startups (isSample = true) are fake test data and MUST BE EXCLUDED
 * from JSON-LD ItemList feeds.
 */
export function buildItemListJsonLd(
  items: FormattedStartup[],
  listName: string,
  listUrl: string
) {
  // Exclude sample startups from JSON-LD feeds
  const realStartups = items.filter((s) => !s.isSample);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: absoluteUrl(listUrl),
    numberOfItems: realStartups.length,
    itemListElement: realStartups.map((startup, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/startup/${startup.slug}`),
      name: startup.name,
      description: startup.tagline || startup.description,
    })),
  };
}
