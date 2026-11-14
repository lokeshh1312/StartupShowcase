import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Parse and validate the 20-startup import SQL file.
 * This test does NOT connect to any database — it only analyses the SQL text.
 */

const VALID_CATEGORIES = [
  "AgriTech",
  "HealthTech",
  "CleanTech",
  "EdTech",
  "FoodTech",
  "LegalTech",
  "WaterTech",
  "SkillTech",
  "FinTech",
  "DeepTech",
] as const;

// ISO 3166-1 alpha-2 — we validate format (2 uppercase letters) rather than
// maintaining a full 249-entry set; runtime validation uses i18n-iso-countries.

const SQL_PATH = resolve(__dirname, "../../supabase/seed-startups/import_20_startups.sql");

function readSql(): string {
  return readFileSync(SQL_PATH, "utf-8");
}

/**
 * Extract individual INSERT blocks from the SQL.
 * Each INSERT is matched by: INSERT INTO startups (...) VALUES (...) ON CONFLICT
 */
function extractInserts(sql: string): string[] {
  // Match each INSERT INTO startups ... ON CONFLICT (slug) DO NOTHING;
  const pattern = /INSERT INTO startups\s*\([^)]+\)\s*VALUES\s*\([\s\S]*?\)\s*ON CONFLICT \(slug\) DO NOTHING;/g;
  const matches = sql.match(pattern);
  return matches ?? [];
}

/**
 * Extract the slug from an INSERT block (first value after VALUES).
 */
function extractSlug(insert: string): string | null {
  // The slug is the first string literal value after VALUES (
  const match = insert.match(/VALUES\s*\(\s*'([^']+)'/);
  return match?.[1] ?? null;
}

/**
 * Extract a named column value from an INSERT block.
 */
function extractColumnValue(insert: string, columnName: string): string | null {
  // Get column list
  const colMatch = insert.match(/INSERT INTO startups\s*\(([^)]+)\)/);
  if (!colMatch) return null;

  const columns = colMatch[1].split(",").map((c) => c.trim());
  const colIndex = columns.indexOf(columnName);
  if (colIndex === -1) return null;

  // Parse VALUES — find the value at position colIndex
  const valuesMatch = insert.match(/VALUES\s*\(([\s\S]*)\)\s*ON CONFLICT/);
  if (!valuesMatch) return null;

  // Tokenize values carefully (handle nested parens, quoted strings, ::jsonb casts)
  const valuesStr = valuesMatch[1];
  const values: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if (ch === "'" && !escaped) {
      inString = !inString;
      current += ch;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escaped = true;
      }
      current += ch;
      continue;
    }

    if (ch === "(") {
      depth++;
      current += ch;
    } else if (ch === ")") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      values.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    values.push(current.trim());
  }

  const rawVal = values[colIndex];
  if (!rawVal) return null;

  // Strip surrounding quotes and ::jsonb casts
  const stripped = rawVal.replace(/::jsonb$/i, "").trim();
  if (stripped.startsWith("'") && stripped.endsWith("'")) {
    return stripped.slice(1, -1);
  }
  return stripped;
}

describe("import_20_startups.sql", () => {
  const sql = readSql();
  const inserts = extractInserts(sql);

  it("contains exactly 20 INSERT statements", () => {
    expect(inserts).toHaveLength(20);
  });

  it("has 20 unique slugs", () => {
    const slugs = inserts.map(extractSlug).filter(Boolean);
    expect(slugs).toHaveLength(20);
    expect(new Set(slugs).size).toBe(20);
  });

  it("all slugs match lowercase-alphanumeric-hyphen format", () => {
    for (const insert of inserts) {
      const slug = extractSlug(insert);
      expect(slug).toBeTruthy();
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("all categories are valid site categories", () => {
    const validSet = new Set<string>(VALID_CATEGORIES);
    for (const insert of inserts) {
      const category = extractColumnValue(insert, "category");
      const slug = extractSlug(insert);
      expect(category, `category for ${slug}`).toBeTruthy();
      expect(validSet.has(category!), `Invalid category '${category}' for slug '${slug}'`).toBe(true);
    }
  });

  it("all country codes are valid ISO alpha-2 format", () => {
    for (const insert of inserts) {
      const code = extractColumnValue(insert, "country_code");
      const slug = extractSlug(insert);
      expect(code, `country_code for ${slug}`).toBeTruthy();
      expect(code!.length, `country_code length for ${slug}`).toBe(2);
      expect(code, `country_code format for ${slug}`).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("all statuses are 'approved'", () => {
    for (const insert of inserts) {
      const status = extractColumnValue(insert, "status");
      const slug = extractSlug(insert);
      expect(status, `status for ${slug}`).toBe("approved");
    }
  });

  it("no engagement count greater than 0", () => {
    for (const insert of inserts) {
      const views = extractColumnValue(insert, "views_count");
      const slug = extractSlug(insert);
      expect(Number(views), `views_count for ${slug}`).toBe(0);
    }
  });

  it("no required columns are NULL", () => {
    const requiredColumns = [
      "slug",
      "name",
      "idea_title",
      "description",
      "category",
      "country_code",
      "stage",
    ];

    for (const insert of inserts) {
      const slug = extractSlug(insert);
      for (const col of requiredColumns) {
        const val = extractColumnValue(insert, col);
        expect(val, `${col} for ${slug} should not be NULL`).toBeTruthy();
        expect(val, `${col} for ${slug} should not be literal NULL`).not.toBe("NULL");
      }
    }
  });

  it("uses ON CONFLICT (slug) DO NOTHING for idempotency", () => {
    for (const insert of inserts) {
      expect(insert).toContain("ON CONFLICT (slug) DO NOTHING");
    }
  });

  it("is wrapped in BEGIN/COMMIT", () => {
    expect(sql).toMatch(/^\s*BEGIN\s*;/m);
    expect(sql).toMatch(/COMMIT\s*;\s*$/m);
  });

  it("contains a placeholder owner_id for the admin to fill in", () => {
    expect(sql).toContain("00000000-0000-0000-0000-000000000000");
    expect(sql).toMatch(/PASTE.*ADMIN.*UUID/i);
  });
});
