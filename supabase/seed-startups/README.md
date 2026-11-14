# Seed Startups — 20 Global Startups Import

This directory contains SQL scripts to import, update images for, and remove 20 curated global startup listings in the Startup Showcase database.

## Files

| File | Purpose |
|---|---|
| `import_20_startups.sql` | Inserts 20 approved startups with v2 images (idempotent — safe to run twice) |
| `update_images_v2.sql` | Updates live startup records to use v2 rebranded logo and cover images |
| `revert_images_v2.sql` | Reverts startup records back to v1 logo and cover images |
| `remove_20_startups.sql` | Deletes all 20 startups by slug (cascade-deletes votes, saves, comments, views) |

## How to Import

1. **Find your admin profile UUID:**

   In the Supabase SQL Editor, run:

   ```sql
   SELECT id, display_name, role FROM profiles WHERE role = 'admin';
   ```

2. **Edit the SQL file:**

   Open `import_20_startups.sql` and replace the placeholder UUID on this line:

   ```sql
   _owner_id uuid := '00000000-0000-0000-0000-000000000000';  -- ← PASTE ADMIN UUID HERE
   ```

3. **Run in Supabase SQL Editor:**

   - Go to **Dashboard → SQL Editor**
   - Paste the entire contents of `import_20_startups.sql`
   - Click **Run**

4. **Verify:**

   ```sql
   SELECT slug, name, status, category, country_code, thumbnail, cover_image
   FROM startups
   WHERE slug IN ('nimbledesk','terratrack','carenest','ledgerleaf','fieldnote-ai','looplocal','patchwork','orbitlearn','reform-materials','quiethours','profitpilot','agrinext','healthbridge','fuelsmart','streamforge','talkease','homeease','mindfulme','buildgrid','ecosphere')
   ORDER BY name;
   ```

## Replacing Images (v2 Rebranded Assets)

To upgrade the live 20 startups from the initial (v1) pictures to the new rebranded (v2) logos and thumbnails without re-importing listings:

1. **Run `update_images_v2.sql`:**
   - Go to **Dashboard → SQL Editor** in Supabase
   - Paste the entire contents of `update_images_v2.sql`
   - Click **Run**
   This updates `thumbnail` = `/startups/<slug>-logo-v2.png` and `cover_image` = `/startups/<slug>-thumb-v2.png` for all 20 startups.

2. **Reverting back to v1:**
   If you ever need to restore the original v1 images:
   - Go to **Dashboard → SQL Editor** in Supabase
   - Paste the contents of `revert_images_v2.sql`
   - Click **Run**

3. **Image Cache Invalidation:**
   The v2 files use versioned filenames (`-logo-v2.png`, `-thumb-v2.png`), ensuring browsers, CDN caches, and Next.js image optimization immediately fetch and display the new images without stale cache issues.

## How to Undo (Full Deletion)

Run `remove_20_startups.sql` in the Supabase SQL Editor. This deletes the 20 startups by slug. All related votes, saves, comments, and views are cascade-deleted automatically.

## How to Refresh the Cache

After importing or updating images, the Next.js cache can be refreshed so listings appear immediately:

- **If using ISR/SSG:** Trigger a redeploy or call `revalidatePath` from an admin action.
- **Quick method:** In the admin panel, moderate any startup (even re-approve one) — this calls `revalidatePath('/')` and `revalidatePath('/browse')`, which refreshes the homepage and browse page.
- **Full cache clear:** Redeploy the app (`npm run build && npm start` or trigger a deploy on your hosting platform).

## Image Assets

The startup logos and thumbnails are committed in `public/startups/`:

- `<slug>-logo-v2.png` — 512×512 square logo (stored in `thumbnail` column; rendered by `<StartupLogo logoUrl={startup.thumbnail} />`)
- `<slug>-thumb-v2.png` — landscape image (stored in `cover_image` column; rendered on the startup profile cover and leaderboard table cards)
- Previous v1 assets (`<slug>-logo.png`, `<slug>-thumb.png`) are preserved so live sites continue functioning until the migration SQL is run.

The SQL references them as safe site-relative paths:
- `thumbnail` = `'/startups/<slug>-logo-v2.png'`
- `cover_image` = `'/startups/<slug>-thumb-v2.png'`

Allowed by `src/lib/images.ts` `isAllowedImageUrl()` via the safe pattern `^/startups/[a-z0-9-]+\.(png|webp|jpg|jpeg)$`.

## Notes

- All listings are created with `status = 'approved'` and `views_count = 0` (no fake engagement).
- The `month` is set to the current month at import time.
- No payment records are created (admin-imported listings bypass the payment flow).
- The script uses `INSERT ... ON CONFLICT (slug) DO NOTHING` — running it twice is safe.
