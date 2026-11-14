-- =============================================================================
-- Remove the 20 imported global startups
-- =============================================================================
-- Run this in the Supabase SQL Editor to undo the import.
-- Cascade-deletes votes, saves, comments, and views for these startups
-- (via ON DELETE CASCADE foreign keys on those tables).
-- =============================================================================

BEGIN;

DELETE FROM startups
WHERE slug IN (
  'nimbledesk',
  'terratrack',
  'carenest',
  'ledgerleaf',
  'fieldnote-ai',
  'looplocal',
  'patchwork',
  'orbitlearn',
  'reform-materials',
  'quiethours',
  'profitpilot',
  'agrinext',
  'healthbridge',
  'fuelsmart',
  'streamforge',
  'talkease',
  'homeease',
  'mindfulme',
  'buildgrid',
  'ecosphere'
);

COMMIT;
