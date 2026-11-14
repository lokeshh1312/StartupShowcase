-- =============================================================================
-- Revert Startup Images to v1 (Original Assets)
-- =============================================================================
-- Generated: 2026-11-14
-- Purpose:   Reverts thumbnail (logo) and cover_image (hero/card picture)
--            for the 20 global startup listings back to the v1 assets.
--
-- HOW TO RUN
-- ----------
-- 1. Open the Supabase SQL Editor (Dashboard → SQL Editor)
-- 2. Paste this entire file and click "Run"
-- =============================================================================

BEGIN;

-- 1. NimbleDesk
UPDATE startups
SET thumbnail = '/startups/nimbledesk-logo.png',
    cover_image = '/startups/nimbledesk-thumb.png',
    updated_at = now()
WHERE slug = 'nimbledesk';

-- 2. TerraTrack
UPDATE startups
SET thumbnail = '/startups/terratrack-logo.png',
    cover_image = '/startups/terratrack-thumb.png',
    updated_at = now()
WHERE slug = 'terratrack';

-- 3. CareNest
UPDATE startups
SET thumbnail = '/startups/carenest-logo.png',
    cover_image = '/startups/carenest-thumb.png',
    updated_at = now()
WHERE slug = 'carenest';

-- 4. LedgerLeaf
UPDATE startups
SET thumbnail = '/startups/ledgerleaf-logo.png',
    cover_image = '/startups/ledgerleaf-thumb.png',
    updated_at = now()
WHERE slug = 'ledgerleaf';

-- 5. FieldNote AI
UPDATE startups
SET thumbnail = '/startups/fieldnote-ai-logo.png',
    cover_image = '/startups/fieldnote-ai-thumb.png',
    updated_at = now()
WHERE slug = 'fieldnote-ai';

-- 6. LoopLocal
UPDATE startups
SET thumbnail = '/startups/looplocal-logo.png',
    cover_image = '/startups/looplocal-thumb.png',
    updated_at = now()
WHERE slug = 'looplocal';

-- 7. Patchwork
UPDATE startups
SET thumbnail = '/startups/patchwork-logo.png',
    cover_image = '/startups/patchwork-thumb.png',
    updated_at = now()
WHERE slug = 'patchwork';

-- 8. OrbitLearn
UPDATE startups
SET thumbnail = '/startups/orbitlearn-logo.png',
    cover_image = '/startups/orbitlearn-thumb.png',
    updated_at = now()
WHERE slug = 'orbitlearn';

-- 9. ReForm Materials
UPDATE startups
SET thumbnail = '/startups/reform-materials-logo.png',
    cover_image = '/startups/reform-materials-thumb.png',
    updated_at = now()
WHERE slug = 'reform-materials';

-- 10. QuietHours
UPDATE startups
SET thumbnail = '/startups/quiethours-logo.png',
    cover_image = '/startups/quiethours-thumb.png',
    updated_at = now()
WHERE slug = 'quiethours';

-- 11. ProfitPilot
UPDATE startups
SET thumbnail = '/startups/profitpilot-logo.png',
    cover_image = '/startups/profitpilot-thumb.png',
    updated_at = now()
WHERE slug = 'profitpilot';

-- 12. AgriNext
UPDATE startups
SET thumbnail = '/startups/agrinext-logo.png',
    cover_image = '/startups/agrinext-thumb.png',
    updated_at = now()
WHERE slug = 'agrinext';

-- 13. HealthBridge
UPDATE startups
SET thumbnail = '/startups/healthbridge-logo.png',
    cover_image = '/startups/healthbridge-thumb.png',
    updated_at = now()
WHERE slug = 'healthbridge';

-- 14. FuelSmart
UPDATE startups
SET thumbnail = '/startups/fuelsmart-logo.png',
    cover_image = '/startups/fuelsmart-thumb.png',
    updated_at = now()
WHERE slug = 'fuelsmart';

-- 15. StreamForge
UPDATE startups
SET thumbnail = '/startups/streamforge-logo.png',
    cover_image = '/startups/streamforge-thumb.png',
    updated_at = now()
WHERE slug = 'streamforge';

-- 16. TalkEase
UPDATE startups
SET thumbnail = '/startups/talkease-logo.png',
    cover_image = '/startups/talkease-thumb.png',
    updated_at = now()
WHERE slug = 'talkease';

-- 17. HomeEase
UPDATE startups
SET thumbnail = '/startups/homeease-logo.png',
    cover_image = '/startups/homeease-thumb.png',
    updated_at = now()
WHERE slug = 'homeease';

-- 18. MindfulMe
UPDATE startups
SET thumbnail = '/startups/mindfulme-logo.png',
    cover_image = '/startups/mindfulme-thumb.png',
    updated_at = now()
WHERE slug = 'mindfulme';

-- 19. BuildGrid
UPDATE startups
SET thumbnail = '/startups/buildgrid-logo.png',
    cover_image = '/startups/buildgrid-thumb.png',
    updated_at = now()
WHERE slug = 'buildgrid';

-- 20. EcoSphere
UPDATE startups
SET thumbnail = '/startups/ecosphere-logo.png',
    cover_image = '/startups/ecosphere-thumb.png',
    updated_at = now()
WHERE slug = 'ecosphere';

COMMIT;
