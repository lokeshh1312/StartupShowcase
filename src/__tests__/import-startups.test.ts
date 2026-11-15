import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { isAllowedImageUrl } from "@/lib/images";

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

  it("maps thumbnail to logo-v2.png and cover_image to thumb-v2.png for all startups", () => {
    for (const insert of inserts) {
      const slug = extractSlug(insert);
      const thumbnail = extractColumnValue(insert, "thumbnail");
      const coverImage = extractColumnValue(insert, "cover_image");

      expect(thumbnail, `thumbnail for ${slug}`).toBe(`/startups/${slug}-logo-v2.png`);
      expect(coverImage, `cover_image for ${slug}`).toBe(`/startups/${slug}-thumb-v2.png`);

      // Both should be valid according to isAllowedImageUrl
      expect(isAllowedImageUrl(thumbnail), `isAllowedImageUrl(thumbnail) for ${slug}`).toBe(true);
      expect(isAllowedImageUrl(coverImage), `isAllowedImageUrl(coverImage) for ${slug}`).toBe(true);
    }
  });

  it("ensures every referenced image file exists in public/startups", () => {
    const publicDir = resolve(__dirname, "../../public");

    for (const insert of inserts) {
      const slug = extractSlug(insert);
      const thumbnail = extractColumnValue(insert, "thumbnail");
      const coverImage = extractColumnValue(insert, "cover_image");

      expect(thumbnail).toBeTruthy();
      expect(coverImage).toBeTruthy();

      const logoDiskPath = resolve(publicDir, thumbnail!.replace(/^\//, ""));
      const thumbDiskPath = resolve(publicDir, coverImage!.replace(/^\//, ""));

      expect(existsSync(logoDiskPath), `Logo file on disk for ${slug} at ${logoDiskPath}`).toBe(true);
      expect(existsSync(thumbDiskPath), `Thumbnail file on disk for ${slug} at ${thumbDiskPath}`).toBe(true);
    }
  });

  describe("update_images_v2.sql and revert_images_v2.sql", () => {
    const updateSqlPath = resolve(__dirname, "../../supabase/seed-startups/update_images_v2.sql");
    const revertSqlPath = resolve(__dirname, "../../supabase/seed-startups/revert_images_v2.sql");
    const publicDir = resolve(__dirname, "../../public");

    it("verifies update_images_v2.sql syntax, slug coverage, and image existence", () => {
      expect(existsSync(updateSqlPath)).toBe(true);
      const updateSql = readFileSync(updateSqlPath, "utf-8");
      expect(updateSql).toMatch(/^\s*BEGIN\s*;/m);
      expect(updateSql).toMatch(/COMMIT\s*;\s*$/m);

      const slugs = inserts.map((i) => extractSlug(i)!);
      for (const slug of slugs) {
        expect(updateSql).toContain(`WHERE slug = '${slug}';`);
        expect(updateSql).toContain(`thumbnail = '/startups/${slug}-logo-v2.png'`);
        expect(updateSql).toContain(`cover_image = '/startups/${slug}-thumb-v2.png'`);

        const logoPath = resolve(publicDir, `startups/${slug}-logo-v2.png`);
        const thumbPath = resolve(publicDir, `startups/${slug}-thumb-v2.png`);
        expect(existsSync(logoPath), `v2 logo exists for ${slug}`).toBe(true);
        expect(existsSync(thumbPath), `v2 thumb exists for ${slug}`).toBe(true);
      }
    });

    it("verifies revert_images_v2.sql syntax, slug coverage, and v1 image existence", () => {
      expect(existsSync(revertSqlPath)).toBe(true);
      const revertSql = readFileSync(revertSqlPath, "utf-8");
      expect(revertSql).toMatch(/^\s*BEGIN\s*;/m);
      expect(revertSql).toMatch(/COMMIT\s*;\s*$/m);

      const slugs = inserts.map((i) => extractSlug(i)!);
      for (const slug of slugs) {
        expect(revertSql).toContain(`WHERE slug = '${slug}';`);
        expect(revertSql).toContain(`thumbnail = '/startups/${slug}-logo.png'`);
        expect(revertSql).toContain(`cover_image = '/startups/${slug}-thumb.png'`);

        const logoPath = resolve(publicDir, `startups/${slug}-logo.png`);
        const thumbPath = resolve(publicDir, `startups/${slug}-thumb.png`);
        expect(existsSync(logoPath), `v1 logo exists for ${slug}`).toBe(true);
        expect(existsSync(thumbPath), `v1 thumb exists for ${slug}`).toBe(true);
      }
    });
  });

  describe("update_logos_v3.sql and revert_logos_v3.sql (14 square logos)", () => {
    const updateSqlPath = resolve(__dirname, "../../supabase/seed-startups/update_logos_v3.sql");
    const revertSqlPath = resolve(__dirname, "../../supabase/seed-startups/revert_logos_v3.sql");
    const publicDir = resolve(__dirname, "../../public");

    const V3_SLUGS = [
      "fuelsmart",
      "fieldnote-ai",
      "ecosphere",
      "carenest",
      "agrinext",
      "streamforge",
      "terratrack",
      "talkease",
      "reform-materials",
      "patchwork",
      "orbitlearn",
      "mindfulme",
      "ledgerleaf",
      "homeease",
    ] as const;

    const UNTOUCHED_SLUGS = [
      "nimbledesk",
      "looplocal",
      "quiethours",
      "profitpilot",
      "healthbridge",
      "buildgrid",
    ] as const;

    it("has exactly 14 targeted startups and 6 untouched startups among the 20", () => {
      expect(V3_SLUGS).toHaveLength(14);
      expect(UNTOUCHED_SLUGS).toHaveLength(6);
      const allSlugs = new Set([...V3_SLUGS, ...UNTOUCHED_SLUGS]);
      expect(allSlugs.size).toBe(20);
    });

    it("asserts every v3 file exists in public/startups, is a square PNG, and passes isAllowedImageUrl", () => {
      for (const slug of V3_SLUGS) {
        const imagePath = `/startups/${slug}-logo-v3.png`;
        const diskPath = resolve(publicDir, `startups/${slug}-logo-v3.png`);

        // 1. Exists in public/startups
        expect(existsSync(diskPath), `v3 logo exists at ${diskPath}`).toBe(true);

        // 2. Passes isAllowedImageUrl
        expect(isAllowedImageUrl(imagePath), `isAllowedImageUrl passes for ${imagePath}`).toBe(true);

        // 3. Valid square PNG format
        const buf = readFileSync(diskPath);
        expect(buf.length, `${diskPath} is not empty`).toBeGreaterThan(24);

        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        const signature = buf.subarray(0, 8).toString("hex");
        expect(signature, `${slug} has valid PNG signature`).toBe("89504e470d0a1a0a");

        // IHDR chunk header
        const ihdr = buf.subarray(12, 16).toString("ascii");
        expect(ihdr, `${slug} has valid IHDR chunk`).toBe("IHDR");

        // Width and height in IHDR chunk (offset 16 and 20, 32-bit big-endian unsigned integers)
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        expect(width, `${slug} width is positive`).toBeGreaterThan(0);
        expect(height, `${slug} height is positive`).toBeGreaterThan(0);
        expect(width, `${slug} logo is square (${width}x${height})`).toBe(height);
      }
    });

    it("verifies update_logos_v3.sql updates only thumbnail for the 14 slugs", () => {
      expect(existsSync(updateSqlPath)).toBe(true);
      const updateSql = readFileSync(updateSqlPath, "utf-8");
      expect(updateSql).toMatch(/^\s*BEGIN\s*;/m);
      expect(updateSql).toMatch(/COMMIT\s*;/m);

      // Must NOT touch cover_image
      expect(updateSql).not.toMatch(/cover_image\s*=/i);

      // Updates only thumbnail for the 14 slugs
      for (const slug of V3_SLUGS) {
        expect(updateSql).toContain(`WHERE slug = '${slug}';`);
        expect(updateSql).toContain(`thumbnail = '/startups/${slug}-logo-v3.png'`);
      }

      // Untouched slugs must not be in the update file
      for (const slug of UNTOUCHED_SLUGS) {
        expect(updateSql).not.toContain(`'${slug}'`);
      }

      // Includes count check
      expect(updateSql).toContain("SELECT count(*)");
      expect(updateSql).toContain("LIKE '%-logo-v3.png'");
    });

    it("verifies revert_logos_v3.sql restores v2 thumbnails for the 14 slugs", () => {
      expect(existsSync(revertSqlPath)).toBe(true);
      const revertSql = readFileSync(revertSqlPath, "utf-8");
      expect(revertSql).toMatch(/^\s*BEGIN\s*;/m);
      expect(revertSql).toMatch(/COMMIT\s*;/m);

      expect(revertSql).not.toMatch(/cover_image\s*=/i);

      for (const slug of V3_SLUGS) {
        expect(revertSql).toContain(`WHERE slug = '${slug}';`);
        expect(revertSql).toContain(`thumbnail = '/startups/${slug}-logo-v2.png'`);
      }

      for (const slug of UNTOUCHED_SLUGS) {
        expect(revertSql).not.toContain(`'${slug}'`);
      }
    });
  });
});
