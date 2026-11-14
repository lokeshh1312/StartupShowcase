# Seed Startups — 20 Global Startups Import

This directory contains SQL scripts to import (and remove) 20 curated global startup listings into the Startup Showcase database.

## Files

| File | Purpose |
|---|---|
| `import_20_startups.sql` | Inserts 20 approved startups (idempotent — safe to run twice) |
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
   SELECT slug, name, status, category, country_code
   FROM startups
   WHERE slug IN ('nimbledesk','terratrack','carenest','ledgerleaf','fieldnote-ai','looplocal','patchwork','orbitlearn','reform-materials','quiethours','profitpilot','agrinext','healthbridge','fuelsmart','streamforge','talkease','homeease','mindfulme','buildgrid','ecosphere')
   ORDER BY name;
   ```

## How to Undo

Run `remove_20_startups.sql` in the Supabase SQL Editor. This deletes the 20 startups by slug. All related votes, saves, comments, and views are cascade-deleted automatically.

## How to Refresh the Cache

After importing, the Next.js cache needs to be refreshed so listings appear immediately:

- **If using ISR/SSG:** Trigger a redeploy or call `revalidatePath` from an admin action.
- **Quick method:** In the admin panel, moderate any startup (even re-approve one) — this calls `revalidatePath('/')` and `revalidatePath('/browse')`, which refreshes the homepage and browse page.
- **Full cache clear:** Redeploy the app (`npm run build && npm start` or trigger a deploy on your hosting platform).

## Image Assets

The startup logos and thumbnails are committed in `public/startups/`:

- `<slug>-logo.png` — 512×512 square logo (stored in `thumbnail` column; rendered by `<StartupLogo logoUrl={startup.thumbnail} />`)
- `<slug>-thumb.png` — 800×520 landscape image (stored in `cover_image` column; rendered on the startup profile cover and leaderboard table cards)

The SQL references them as safe site-relative paths:
- `thumbnail` = `'/startups/<slug>-logo.png'`
- `cover_image` = `'/startups/<slug>-thumb.png'`

Allowed by `src/lib/images.ts` `isAllowedImageUrl()` via the safe pattern `^/startups/[a-z0-9-]+\.(png|webp|jpg|jpeg)$`.

## Notes

- All listings are created with `status = 'approved'` and `views_count = 0` (no fake engagement).
- The `month` is set to the current month at import time.
- No payment records are created (admin-imported listings bypass the payment flow).
- The script uses `INSERT ... ON CONFLICT (slug) DO NOTHING` — running it twice is safe.
