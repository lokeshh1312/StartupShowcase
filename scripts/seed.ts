import dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { INITIAL_STARTUPS } from "./sample-data/startups";
import { formatLocation, formatMonthLabel, normalizeMonthToDate, normalizeUrl } from "../src/lib/validation";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export function isLocalDatabaseUrl(urlStr?: string): boolean {
  if (!urlStr) return false;
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /^postgres(?:ql)?:\/\/[^@]*@(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(urlStr);
  }
}

async function seed() {
  const allowSeed = process.env.ALLOW_SEED === "true";
  const connectionString = process.env.DATABASE_URL;

  if (!allowSeed || !isLocalDatabaseUrl(connectionString)) {
    console.error("Refusing to seed: not a local database");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: Refusing to run seed script in production environment (NODE_ENV=production).");
    process.exit(1);
  }

  console.log("Connecting to Supabase Postgres (prepare: false)...");
  const client = postgres(connectionString!, { prepare: false });
  const db = drizzle(client);

  console.log(`Seeding ${INITIAL_STARTUPS.length} sample startups...`);

  let count = 0;
  for (const item of INITIAL_STARTUPS) {
    const monthDate = normalizeMonthToDate(item.month);
    const monthLabel = formatMonthLabel(monthDate);
    const location = formatLocation({
      countryCode: item.countryCode,
      region: item.region,
      city: item.city,
      remoteFirst: item.remoteFirst,
    });

    await db.execute(sql`
      INSERT INTO public.startups (
        slug,
        owner_id,
        status,
        is_sample,
        name,
        idea_title,
        tagline,
        description,
        full_story,
        category,
        country_code,
        region,
        city,
        remote_first,
        location,
        stage,
        month,
        month_label,
        website_url,
        logo_type,
        logo_color,
        thumbnail,
        cover_image,
        founder_json,
        problem,
        solution,
        key_features_json,
        tech_stack_json,
        traction,
        views_count,
        approved_at
      ) VALUES (
        ${item.slug},
        NULL,
        'approved',
        true,
        ${item.name},
        ${item.ideaTitle || item.name},
        ${item.tagline || ""},
        ${item.description},
        ${item.fullStory || ""},
        ${item.category},
        ${item.countryCode.toUpperCase()},
        ${item.region || ""},
        ${item.city || ""},
        ${Boolean(item.remoteFirst)},
        ${location},
        ${item.stage},
        ${monthDate}::date,
        ${monthLabel},
        ${normalizeUrl(item.websiteUrl)},
        ${item.logoType || "sprout"},
        ${item.logoColor || "#2563EB"},
        ${normalizeUrl(item.thumbnail)},
        ${normalizeUrl(item.coverImage || item.thumbnail)},
        ${JSON.stringify(item.founder || {})}::jsonb,
        ${item.problem || ""},
        ${item.solution || ""},
        ${JSON.stringify(item.keyFeatures || [])}::jsonb,
        ${JSON.stringify(item.techStack || [])}::jsonb,
        ${item.traction || ""},
        ${item.views || 0},
        now()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        idea_title = EXCLUDED.idea_title,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description,
        full_story = EXCLUDED.full_story,
        category = EXCLUDED.category,
        country_code = EXCLUDED.country_code,
        region = EXCLUDED.region,
        city = EXCLUDED.city,
        remote_first = EXCLUDED.remote_first,
        location = EXCLUDED.location,
        stage = EXCLUDED.stage,
        month = EXCLUDED.month,
        month_label = EXCLUDED.month_label,
        website_url = EXCLUDED.website_url,
        logo_type = EXCLUDED.logo_type,
        logo_color = EXCLUDED.logo_color,
        thumbnail = EXCLUDED.thumbnail,
        cover_image = EXCLUDED.cover_image,
        founder_json = EXCLUDED.founder_json,
        problem = EXCLUDED.problem,
        solution = EXCLUDED.solution,
        key_features_json = EXCLUDED.key_features_json,
        tech_stack_json = EXCLUDED.tech_stack_json,
        traction = EXCLUDED.traction,
        views_count = EXCLUDED.views_count,
        status = 'approved',
        is_sample = true,
        approved_at = COALESCE(public.startups.approved_at, now()),
        updated_at = now()
    `);
    count++;
  }

  console.log(`Successfully seeded/updated ${count} sample startups!`);
  await client.end();
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/seed.ts")) {
  seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
