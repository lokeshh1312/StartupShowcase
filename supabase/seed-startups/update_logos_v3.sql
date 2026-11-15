-- =============================================================================
-- Update Startup Logos to v3 (Square 14 Logos)
-- =============================================================================
-- Purpose:   Updates thumbnail (logo) for the 14 startups to use new v3 square assets.
--            Hero/card pictures and the other 6 startups remain untouched.
--
-- HOW TO RUN
-- ----------
-- 1. Open the Supabase SQL Editor (Dashboard → SQL Editor)
-- 2. Paste this entire file and click "Run"
--
-- REVERT
-- ------
-- To revert back to v2 logos, run revert_logos_v3.sql
-- =============================================================================

BEGIN;

-- 1. AgriNext
UPDATE public.startups
SET thumbnail = '/startups/agrinext-logo-v3.png',
    updated_at = now()
WHERE slug = 'agrinext';

-- 2. CareNest
UPDATE public.startups
SET thumbnail = '/startups/carenest-logo-v3.png',
    updated_at = now()
WHERE slug = 'carenest';

-- 3. EcoSphere
UPDATE public.startups
SET thumbnail = '/startups/ecosphere-logo-v3.png',
    updated_at = now()
WHERE slug = 'ecosphere';

-- 4. FieldNote AI
UPDATE public.startups
SET thumbnail = '/startups/fieldnote-ai-logo-v3.png',
    updated_at = now()
WHERE slug = 'fieldnote-ai';

-- 5. FuelSmart
UPDATE public.startups
SET thumbnail = '/startups/fuelsmart-logo-v3.png',
    updated_at = now()
WHERE slug = 'fuelsmart';

-- 6. HomeEase
UPDATE public.startups
SET thumbnail = '/startups/homeease-logo-v3.png',
    updated_at = now()
WHERE slug = 'homeease';

-- 7. LedgerLeaf
UPDATE public.startups
SET thumbnail = '/startups/ledgerleaf-logo-v3.png',
    updated_at = now()
WHERE slug = 'ledgerleaf';

-- 8. MindfulMe
UPDATE public.startups
SET thumbnail = '/startups/mindfulme-logo-v3.png',
    updated_at = now()
WHERE slug = 'mindfulme';

-- 9. OrbitLearn
UPDATE public.startups
SET thumbnail = '/startups/orbitlearn-logo-v3.png',
    updated_at = now()
WHERE slug = 'orbitlearn';

-- 10. Patchwork
UPDATE public.startups
SET thumbnail = '/startups/patchwork-logo-v3.png',
    updated_at = now()
WHERE slug = 'patchwork';

-- 11. ReForm Materials
UPDATE public.startups
SET thumbnail = '/startups/reform-materials-logo-v3.png',
    updated_at = now()
WHERE slug = 'reform-materials';

-- 12. StreamForge
UPDATE public.startups
SET thumbnail = '/startups/streamforge-logo-v3.png',
    updated_at = now()
WHERE slug = 'streamforge';

-- 13. TalkEase
UPDATE public.startups
SET thumbnail = '/startups/talkease-logo-v3.png',
    updated_at = now()
WHERE slug = 'talkease';

-- 14. TerraTrack
UPDATE public.startups
SET thumbnail = '/startups/terratrack-logo-v3.png',
    updated_at = now()
WHERE slug = 'terratrack';

COMMIT;

-- Verification check: exactly 14 startups should have a v3 thumbnail
SELECT count(*) AS v3_logo_count
FROM public.startups
WHERE thumbnail LIKE '%-logo-v3.png';
