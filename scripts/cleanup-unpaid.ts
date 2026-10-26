import dotenv from "dotenv";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local if present
dotenv.config({ path: ".env.local" });
dotenv.config();

interface OrphanStartup {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  status: string;
  thumbnail: string | null;
  cover_image: string | null;
  created_at: string;
}

export async function cleanupUnpaidStartups(options?: {
  dryRun?: boolean;
  connectionString?: string;
  daysOld?: number;
}): Promise<{
  scanned: number;
  deleted: number;
  dryRun: boolean;
  startups: { id: string; name: string }[];
}> {
  const isDryRun = options?.dryRun ?? process.argv.includes("--dry-run");
  const days = options?.daysOld ?? 7;
  const dbUrl = options?.connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set. Cannot run unpaid cleanup.");
  }

  const sql = postgres(dbUrl, { prepare: false, max: 1 });

  // Initialize Supabase admin client for storage cleanup if service role key exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const storageAdmin =
    supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

  try {
    // 1. Find all awaiting_payment startups created > 7 days ago
    const candidates = await sql<OrphanStartup[]>`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.owner_id,
        s.status,
        s.thumbnail,
        s.cover_image,
        s.created_at::text
      FROM public.startups s
      WHERE s.status = 'awaiting_payment'
        AND s.created_at < (now() - (${days} || ' days')::interval)
        AND NOT EXISTS (
          SELECT 1 FROM public.payments p
          WHERE p.startup_id = s.id AND p.status = 'paid'
        )
      ORDER BY s.created_at ASC;
    `;

    console.log(
      `[Cleanup Unpaid]: Found ${candidates.length} awaiting_payment startup(s) older than ${days} days.${
        isDryRun ? " (DRY-RUN MODE — no changes will be made)" : ""
      }`
    );

    const deletedList: { id: string; name: string }[] = [];

    for (const startup of candidates) {
      if (isDryRun) {
        console.log(
          `  [DRY-RUN] Would delete: ${startup.id} | "${startup.name}" (created: ${startup.created_at})`
        );
        deletedList.push({ id: startup.id, name: startup.name });
        continue;
      }

      // Live mode: Clean up storage images if storage client is configured
      if (storageAdmin) {
        const imagePathsToClean: string[] = [];
        const extractPath = (url: string | null) => {
          if (!url) return null;
          const match = url.match(/\/startup-images\/([^?#]+)/);
          return match ? match[1] : null;
        };

        const thumbPath = extractPath(startup.thumbnail);
        const coverPath = extractPath(startup.cover_image);
        if (thumbPath) imagePathsToClean.push(thumbPath);
        if (coverPath && coverPath !== thumbPath) imagePathsToClean.push(coverPath);

        if (imagePathsToClean.length > 0) {
          try {
            await storageAdmin.storage.from("startup-images").remove(imagePathsToClean);
          } catch (storageErr) {
            console.warn(
              `  [Storage Cleanup Warning] Failed to delete images for startup ${startup.id}:`,
              storageErr
            );
          }
        }
      }

      // Delete in transaction: payment records first (due to ON DELETE RESTRICT on startup_id), then startup
      await sql.begin(async (tx) => {
        await tx`DELETE FROM public.payments WHERE startup_id = ${startup.id}::uuid;`;
        await tx`DELETE FROM public.startups WHERE id = ${startup.id}::uuid;`;
        await tx`
          INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata, created_at)
          VALUES (
            ${startup.owner_id}::uuid,
            'startup.orphan_cleanup',
            'startup',
            ${startup.id},
            jsonb_build_object(
              'startup_name', ${startup.name},
              'reason', 'older_than_7_days_unpaid'
            ),
            now()
          );
        `;
      });

      console.log(`  [DELETED] ${startup.id} | "${startup.name}"`);
      deletedList.push({ id: startup.id, name: startup.name });
    }

    console.log(
      `[Cleanup Unpaid Finished]: Scanned: ${candidates.length}, ${
        isDryRun ? "Would delete" : "Deleted"
      }: ${deletedList.length}.`
    );

    return {
      scanned: candidates.length,
      deleted: deletedList.length,
      dryRun: isDryRun,
      startups: deletedList,
    };
  } finally {
    await sql.end();
  }
}

// Direct execution via CLI
if (process.argv[1]?.endsWith("cleanup-unpaid.ts")) {
  cleanupUnpaidStartups()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Cleanup Unpaid Fatal Error]:", err);
      process.exit(1);
    });
}
