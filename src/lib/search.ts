/**
 * Search utilities for Startup Showcase.
 * No server-only imports — safe for unit testing.
 */

/**
 * Converts a search phrase into a PostgreSQL prefix tsquery string.
 * Uses a Unicode-aware cleaner so non-Latin names (Japanese, Arabic, etc.) are searchable.
 * Caps the query at 8 words to limit complexity.
 *
 * @example buildSafePrefixTsQuery("agri ai") // "agri:* & ai:*"
 * @example buildSafePrefixTsQuery("東京 テクノロジー") // "東京:* & テクノロジー:*"
 */
export function buildSafePrefixTsQuery(raw: string): string | null {
  const cleaned = raw.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0).slice(0, 8);
  if (words.length === 0) return null;
  return words.map((w) => `${w}:*`).join(" & ");
}
