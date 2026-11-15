-- =============================================================================
-- Revert Startup Logos to v2
-- =============================================================================
-- Purpose:   Reverts thumbnail (logo) for the 14 startups back to their v2 assets.
--            Hero/card pictures and the other 6 startups remain untouched.
--
-- HOW TO RUN
-- ----------
-- 1. Open the Supabase SQL Editor (Dashboard → SQL Editor)
-- 2. Paste this entire file and click "Run"
-- =============================================================================

BEGIN;

-- 1. AgriNext
UPDATE public.startups
SET thumbnail = '/startups/agrinext-logo-v2.png',
    updated_at = now()
WHERE slug = 'agrinext';

-- 2. CareNest
UPDATE public.startups
SET thumbnail = '/startups/carenest-logo-v2.png',
    updated_at = now()
WHERE slug = 'carenest';

-- 3. EcoSphere
UPDATE public.startups
SET thumbnail = '/startups/ecosphere-logo-v2.png',
    updated_at = now()
WHERE slug = 'ecosphere';

-- 4. FieldNote AI
UPDATE public.startups
SET thumbnail = '/startups/fieldnote-ai-logo-v2.png',
    updated_at = now()
WHERE slug = 'fieldnote-ai';

-- 5. FuelSmart
UPDATE public.startups
SET thumbnail = '/startups/fuelsmart-logo-v2.png',
    updated_at = now()
WHERE slug = 'fuelsmart';

-- 6. HomeEase
UPDATE public.startups
SET thumbnail = '/startups/homeease-logo-v2.png',
    updated_at = now()
WHERE slug = 'homeease';

-- 7. LedgerLeaf
UPDATE public.startups
SET thumbnail = '/startups/ledgerleaf-logo-v2.png',
    updated_at = now()
WHERE slug = 'ledgerleaf';

-- 8. MindfulMe
UPDATE public.startups
SET thumbnail = '/startups/mindfulme-logo-v2.png',
    updated_at = now()
WHERE slug = 'mindfulme';

-- 9. OrbitLearn
UPDATE public.startups
SET thumbnail = '/startups/orbitlearn-logo-v2.png',
    updated_at = now()
WHERE slug = 'orbitlearn';

-- 10. Patchwork
UPDATE public.startups
SET thumbnail = '/startups/patchwork-logo-v2.png',
    updated_at = now()
WHERE slug = 'patchwork';

-- 11. ReForm Materials
UPDATE public.startups
SET thumbnail = '/startups/reform-materials-logo-v2.png',
    updated_at = now()
WHERE slug = 'reform-materials';

-- 12. StreamForge
UPDATE public.startups
SET thumbnail = '/startups/streamforge-logo-v2.png',
    updated_at = now()
WHERE slug = 'streamforge';

-- 13. TalkEase
UPDATE public.startups
SET thumbnail = '/startups/talkease-logo-v2.png',
    updated_at = now()
WHERE slug = 'talkease';

-- 14. TerraTrack
UPDATE public.startups
SET thumbnail = '/startups/terratrack-logo-v2.png',
    updated_at = now()
WHERE slug = 'terratrack';

COMMIT;

-- Verification check: 0 startups should have a v3 thumbnail
SELECT count(*) AS remaining_v3_logo_count
FROM public.startups
WHERE thumbnail LIKE '%-logo-v3.png';
