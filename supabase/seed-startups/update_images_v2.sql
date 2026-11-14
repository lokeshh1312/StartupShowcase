-- =============================================================================
-- Update Startup Images to v2 (Rebranded Assets)
-- =============================================================================
-- Generated: 2026-11-14
-- Purpose:   Updates thumbnail (logo) and cover_image (hero/card picture)
--            for the 20 global startup listings to use new v2 rebranded assets.
--
-- HOW TO RUN
-- ----------
-- 1. Open the Supabase SQL Editor (Dashboard → SQL Editor)
-- 2. Paste this entire file and click "Run"
--
-- REVERT
-- ------
-- To revert back to v1 images, run revert_images_v2.sql
-- =============================================================================

BEGIN;

-- 1. NimbleDesk
UPDATE startups
SET thumbnail = '/startups/nimbledesk-logo-v2.png',
    cover_image = '/startups/nimbledesk-thumb-v2.png',
    updated_at = now()
WHERE slug = 'nimbledesk';

-- 2. TerraTrack
UPDATE startups
SET thumbnail = '/startups/terratrack-logo-v2.png',
    cover_image = '/startups/terratrack-thumb-v2.png',
    updated_at = now()
WHERE slug = 'terratrack';

-- 3. CareNest
UPDATE startups
SET thumbnail = '/startups/carenest-logo-v2.png',
    cover_image = '/startups/carenest-thumb-v2.png',
    updated_at = now()
WHERE slug = 'carenest';

-- 4. LedgerLeaf
UPDATE startups
SET thumbnail = '/startups/ledgerleaf-logo-v2.png',
    cover_image = '/startups/ledgerleaf-thumb-v2.png',
    updated_at = now()
WHERE slug = 'ledgerleaf';

-- 5. FieldNote AI
UPDATE startups
SET thumbnail = '/startups/fieldnote-ai-logo-v2.png',
    cover_image = '/startups/fieldnote-ai-thumb-v2.png',
    updated_at = now()
WHERE slug = 'fieldnote-ai';

-- 6. LoopLocal
UPDATE startups
SET thumbnail = '/startups/looplocal-logo-v2.png',
    cover_image = '/startups/looplocal-thumb-v2.png',
    updated_at = now()
WHERE slug = 'looplocal';

-- 7. Patchwork
UPDATE startups
SET thumbnail = '/startups/patchwork-logo-v2.png',
    cover_image = '/startups/patchwork-thumb-v2.png',
    updated_at = now()
WHERE slug = 'patchwork';

-- 8. OrbitLearn
UPDATE startups
SET thumbnail = '/startups/orbitlearn-logo-v2.png',
    cover_image = '/startups/orbitlearn-thumb-v2.png',
    updated_at = now()
WHERE slug = 'orbitlearn';

-- 9. ReForm Materials
UPDATE startups
SET thumbnail = '/startups/reform-materials-logo-v2.png',
    cover_image = '/startups/reform-materials-thumb-v2.png',
    updated_at = now()
WHERE slug = 'reform-materials';

-- 10. QuietHours
UPDATE startups
SET thumbnail = '/startups/quiethours-logo-v2.png',
    cover_image = '/startups/quiethours-thumb-v2.png',
    updated_at = now()
WHERE slug = 'quiethours';

-- 11. ProfitPilot
UPDATE startups
SET thumbnail = '/startups/profitpilot-logo-v2.png',
    cover_image = '/startups/profitpilot-thumb-v2.png',
    updated_at = now()
WHERE slug = 'profitpilot';

-- 12. AgriNext
UPDATE startups
SET thumbnail = '/startups/agrinext-logo-v2.png',
    cover_image = '/startups/agrinext-thumb-v2.png',
    updated_at = now()
WHERE slug = 'agrinext';

-- 13. HealthBridge
UPDATE startups
SET thumbnail = '/startups/healthbridge-logo-v2.png',
    cover_image = '/startups/healthbridge-thumb-v2.png',
    updated_at = now()
WHERE slug = 'healthbridge';

-- 14. FuelSmart
UPDATE startups
SET thumbnail = '/startups/fuelsmart-logo-v2.png',
    cover_image = '/startups/fuelsmart-thumb-v2.png',
    updated_at = now()
WHERE slug = 'fuelsmart';

-- 15. StreamForge
UPDATE startups
SET thumbnail = '/startups/streamforge-logo-v2.png',
    cover_image = '/startups/streamforge-thumb-v2.png',
    updated_at = now()
WHERE slug = 'streamforge';

-- 16. TalkEase
UPDATE startups
SET thumbnail = '/startups/talkease-logo-v2.png',
    cover_image = '/startups/talkease-thumb-v2.png',
    updated_at = now()
WHERE slug = 'talkease';

-- 17. HomeEase
UPDATE startups
SET thumbnail = '/startups/homeease-logo-v2.png',
    cover_image = '/startups/homeease-thumb-v2.png',
    updated_at = now()
WHERE slug = 'homeease';

-- 18. MindfulMe
UPDATE startups
SET thumbnail = '/startups/mindfulme-logo-v2.png',
    cover_image = '/startups/mindfulme-thumb-v2.png',
    updated_at = now()
WHERE slug = 'mindfulme';

-- 19. BuildGrid
UPDATE startups
SET thumbnail = '/startups/buildgrid-logo-v2.png',
    cover_image = '/startups/buildgrid-thumb-v2.png',
    updated_at = now()
WHERE slug = 'buildgrid';

-- 20. EcoSphere
UPDATE startups
SET thumbnail = '/startups/ecosphere-logo-v2.png',
    cover_image = '/startups/ecosphere-thumb-v2.png',
    updated_at = now()
WHERE slug = 'ecosphere';

COMMIT;
