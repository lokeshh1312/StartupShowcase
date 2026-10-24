import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Normalise a website URL into a domain:
 * Strips protocol, removes leading 'www.', discards path, query string, and hash, and lowercases.
 */
export function normalizeDomain(url: string): string {
  if (!url || !url.trim()) return "";
  const cleaned = url.trim();

  try {
    const withProto = cleaned.includes("://") ? cleaned : `https://${cleaned}`;
    const parsed = new URL(withProto);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return cleaned
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .trim();
  }
}

export interface DuplicateWarning {
  id: string;
  name: string;
  slug: string;
  reason: "domain" | "name_similarity";
  score?: number;
}

/**
 * Checks for potential duplicate submissions against existing approved or pending startups:
 * 1. Normalized website domain exact match
 * 2. Similar startup names via pg_trgm similarity > 0.6
 */
export async function checkStartupDuplicate(
  name: string,
  websiteUrl?: string | null,
  excludeStartupId?: string
): Promise<DuplicateWarning | null> {
  const normDomain = normalizeDomain(websiteUrl || "");

  // 1. Check domain duplicate if websiteUrl provided
  if (normDomain) {
    const domainMatches = await db.execute<{
      id: string;
      name: string;
      slug: string;
      website_url: string;
    }>(sql`
      SELECT id, name, slug, website_url
      FROM public.startups
      WHERE status IN ('approved', 'pending')
        ${excludeStartupId ? sql`AND id <> ${excludeStartupId}::uuid` : sql``}
      LIMIT 100
    `);

    for (const match of domainMatches) {
      if (normalizeDomain(match.website_url) === normDomain) {
        return {
          id: match.id,
          name: match.name,
          slug: match.slug,
          reason: "domain",
        };
      }
    }
  }

  // 2. Check name similarity via pg_trgm (> 0.6)
  if (name && name.trim()) {
    const trimmedName = name.trim();
    const nameMatches = await db.execute<{
      id: string;
      name: string;
      slug: string;
      sim: number;
    }>(sql`
      SELECT id, name, slug, similarity(name, ${trimmedName}) AS sim
      FROM public.startups
      WHERE status IN ('approved', 'pending')
        ${excludeStartupId ? sql`AND id <> ${excludeStartupId}::uuid` : sql``}
        AND similarity(name, ${trimmedName}) > 0.6
      ORDER BY sim DESC
      LIMIT 1
    `);

    if (nameMatches.length > 0 && nameMatches[0]) {
      return {
        id: nameMatches[0].id,
        name: nameMatches[0].name,
        slug: nameMatches[0].slug,
        reason: "name_similarity",
        score: Number(nameMatches[0].sim),
      };
    }
  }

  return null;
}
