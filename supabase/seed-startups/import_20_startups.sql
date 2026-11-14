-- =============================================================================
-- Import 20 Global Startups into Startup Showcase
-- =============================================================================
-- Generated: 2026-11-14
-- Source:     startup_showcase_20_global_startups.xlsx
--
-- HOW TO RUN
-- ----------
-- 1. Open the Supabase SQL Editor (Dashboard → SQL Editor)
-- 2. Replace the placeholder admin UUID below with a real admin profile UUID
--    (run: SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;)
-- 3. Paste this entire file and click "Run"
--
-- IDEMPOTENT: Uses INSERT ... ON CONFLICT (slug) DO NOTHING.
-- Running it twice will not duplicate rows.
-- =============================================================================

BEGIN;

-- ┌─────────────────────────────────────────────────────────────────────────────┐
-- │ ADMIN OWNER — Replace this UUID with the admin profile id                  │
-- └─────────────────────────────────────────────────────────────────────────────┘
-- To find it:  SELECT id, display_name, role FROM profiles WHERE role = 'admin';
DO $$
DECLARE
  _owner_id uuid := '00000000-0000-0000-0000-000000000000';  -- ← PASTE ADMIN UUID HERE
  _month     date := date_trunc('month', now())::date;        -- current month, e.g. 2026-11-01
  _month_lbl text := to_char(date_trunc('month', now()), 'FMMonth YYYY'); -- e.g. November 2026
  _now       timestamptz := now();
BEGIN

-- Verify the owner exists and is admin
IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = _owner_id AND role = 'admin') THEN
  RAISE EXCEPTION 'Owner UUID % is not a valid admin profile. Please set _owner_id to a real admin UUID.', _owner_id;
END IF;

-- ─── 1. NimbleDesk ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'nimbledesk', _owner_id, 'approved', false,
  'NimbleDesk',
  'NimbleDesk',
  'Your AI study buddy, anytime, anywhere.',
  'An adaptive study companion that turns notes and learning goals into focused revision plans.',
  '',
  'EdTech',
  'US',
  'Massachusetts',
  'Boston',
  false,
  'Boston, Massachusetts, United States',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/nimbledesk-logo.png',
  '/startups/nimbledesk-thumb.png',
  '{"name":"Sofia Bennett","role":"Founder","avatar":"","quote":"Make high-quality, personalized study support accessible to every learner."}'::jsonb,
  'Students struggle to turn large volumes of notes into consistent, effective revision routines.',
  'NimbleMind organizes notes into topic maps, practice questions, and personalized study sessions with progress tracking.',
  '["Note import","study plans","practice quizzes","progress insights","spaced repetition"]'::jsonb,
  '["Python","FastAPI","React","PostgreSQL","vector search"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 2. TerraTrack ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'terratrack', _owner_id, 'approved', false,
  'TerraTrack',
  'TerraTrack',
  'Track. Reduce. Go Green.',
  'A carbon visibility dashboard for small logistics operators.',
  '',
  'CleanTech',
  'DE',
  'Berlin',
  'Berlin',
  false,
  'Berlin, Berlin, Germany',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/terratrack-logo.png',
  '/startups/terratrack-thumb.png',
  '{"name":"Lukas Weber","role":"Founder","avatar":"","quote":"Make climate data useful to the businesses that move the world."}'::jsonb,
  'Smaller logistics firms lack accessible tools to understand emissions across their delivery routes.',
  'TerraTrack combines route and vehicle data to estimate emissions and identify practical efficiency improvements.',
  '["Route emissions","fleet dashboard","CSV import","carrier comparison","exportable reports"]'::jsonb,
  '["Python","FastAPI","React","PostgreSQL","Mapbox"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 3. CareNest ────────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'carenest', _owner_id, 'approved', false,
  'CareNest',
  'CareNest',
  'Healthcare, now in your pocket.',
  'A family coordination app for everyday care routines.',
  '',
  'HealthTech',
  'IN',
  'Rajasthan',
  'Jaipur',
  false,
  'Jaipur, Rajasthan, India',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/carenest-logo.png',
  '/startups/carenest-thumb.png',
  '{"name":"Rohan Bhatia","role":"Founder","avatar":"","quote":"Make everyday care more coordinated, compassionate, and less stressful."}'::jsonb,
  'Families coordinating care often lose track of appointments, medication schedules, and shared responsibilities.',
  'CareNest provides a shared care calendar, task assignments, visit notes, and reminders for family members.',
  '["Shared calendar","care tasks","appointment reminders","visit notes","family updates"]'::jsonb,
  '["Flutter","Firebase","Cloud Functions","Figma"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 4. LedgerLeaf ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'ledgerleaf', _owner_id, 'approved', false,
  'LedgerLeaf',
  'LedgerLeaf',
  'Smart bookkeeping for modern business.',
  'A cash-flow and invoice workspace for independent businesses.',
  '',
  'FinTech',
  'GB',
  'England',
  'London',
  false,
  'London, England, United Kingdom',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/ledgerleaf-logo.png',
  '/startups/ledgerleaf-thumb.png',
  '{"name":"Amelia Clarke","role":"Founder","avatar":"","quote":"Give independent businesses the financial clarity to plan with confidence."}'::jsonb,
  'Freelancers and small firms often discover cash shortages too late because income and expenses are tracked separately.',
  'LedgerLeaf brings invoices, recurring costs, and expected payments into a simple rolling cash-flow forecast.',
  '["Invoice tracking","cash forecast","recurring expenses","payment reminders","CSV import"]'::jsonb,
  '["Next.js","TypeScript","Node.js","PostgreSQL","Stripe"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 5. FieldNote AI ────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'fieldnote-ai', _owner_id, 'approved', false,
  'FieldNote AI',
  'FieldNote AI',
  'Turn ideas into insights.',
  'An AI-assisted reporting tool for field and inspection teams.',
  '',
  'DeepTech',
  'CA',
  'Ontario',
  'Toronto',
  false,
  'Toronto, Ontario, Canada',
  'Prototype',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/fieldnote-ai-logo.png',
  '/startups/fieldnote-ai-thumb.png',
  '{"name":"Noah Williams","role":"Founder","avatar":"","quote":"Help operational teams spend less time documenting and more time improving."}'::jsonb,
  'Field workers spend hours turning voice notes, photos, and handwritten observations into formal reports.',
  'FieldNote AI organizes captured notes and images into editable report drafts for human review.',
  '["Voice capture","photo tagging","report drafts","templates","offline mode","approvals"]'::jsonb,
  '["Python","FastAPI","React Native","PostgreSQL","object storage"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 6. LoopLocal ───────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'looplocal', _owner_id, 'approved', false,
  'LoopLocal',
  'LoopLocal',
  'Shop local. Support local.',
  'A discovery and loyalty platform for independent neighborhood stores.',
  '',
  'FinTech',
  'IN',
  'Kerala',
  'Kochi',
  false,
  'Kochi, Kerala, India',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/looplocal-logo.png',
  '/startups/looplocal-thumb.png',
  '{"name":"Ananya Joseph","role":"Founder","avatar":"","quote":"Help local businesses build stronger relationships with their communities."}'::jsonb,
  'Independent retailers struggle to reach nearby customers and run affordable loyalty programs.',
  'LoopLocal gives merchants searchable profiles, local offers, and simple digital loyalty cards.',
  '["Nearby discovery","merchant pages","digital stamps","local offers","saved shops","owner dashboard"]'::jsonb,
  '["React","Node.js","MongoDB","Maps API","Firebase"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 7. Patchwork ───────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'patchwork', _owner_id, 'approved', false,
  'Patchwork',
  'Patchwork',
  'Work together, achieve more.',
  'A shared feedback inbox for small product teams.',
  '',
  'DeepTech',
  'US',
  'Texas',
  'Austin',
  false,
  'Austin, Texas, United States',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/patchwork-logo.png',
  '/startups/patchwork-thumb.png',
  '{"name":"Maya Chen","role":"Founder","avatar":"","quote":"Help product teams make better decisions by listening to customers systematically."}'::jsonb,
  'Product feedback arrives across email, calls, and support channels, making recurring requests difficult to prioritize.',
  'Patchwork centralizes feedback, groups similar requests, and links customer evidence to roadmap decisions.',
  '["Feedback inbox","theme clustering","duplicate detection","roadmap links","customer tags"]'::jsonb,
  '["Next.js","TypeScript","Supabase","PostgreSQL","AI APIs"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 8. OrbitLearn ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'orbitlearn', _owner_id, 'approved', false,
  'OrbitLearn',
  'OrbitLearn',
  'Learn. Practice. Grow.',
  'Short practical learning paths for workplace tools and digital skills.',
  '',
  'SkillTech',
  'AU',
  'Victoria',
  'Melbourne',
  false,
  'Melbourne, Victoria, Australia',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/orbitlearn-logo.png',
  '/startups/orbitlearn-thumb.png',
  '{"name":"Ethan Brooks","role":"Founder","avatar":"","quote":"Make continuous learning fit naturally into the working day."}'::jsonb,
  'Busy professionals often abandon long courses when they need one practical skill for an immediate task.',
  'OrbitLearn delivers short lessons, guided exercises, and progress paths built around real workplace tasks.',
  '["Micro-lessons","skill paths","practice tasks","team spaces","progress tracking","badges"]'::jsonb,
  '["Angular","NestJS","PostgreSQL","Redis","H5P"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 9. ReForm Materials ────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'reform-materials', _owner_id, 'approved', false,
  'ReForm Materials',
  'ReForm Materials',
  'Turning waste into opportunity.',
  'A B2B catalog connecting makers with recycled-material suppliers.',
  '',
  'CleanTech',
  'GB',
  'England',
  'Manchester',
  false,
  'Manchester, England, United Kingdom',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/reform-materials-logo.png',
  '/startups/reform-materials-thumb.png',
  '{"name":"Oliver Grant","role":"Founder","avatar":"","quote":"Make circular sourcing easier for product makers of every size."}'::jsonb,
  'Product teams find it difficult to compare recycled materials and verify supplier specifications and availability.',
  'ReForm Materials organizes material listings, technical specifications, sample requests, and supplier updates.',
  '["Material catalog","supplier profiles","specification sheets","sample requests","saved searches"]'::jsonb,
  '["Ruby on Rails","PostgreSQL","Hotwire","AWS","Algolia"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 10. QuietHours ─────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'quiethours', _owner_id, 'approved', false,
  'QuietHours',
  'QuietHours',
  'Better sleep. A calmer you.',
  'A team scheduling assistant that protects focus time.',
  '',
  'DeepTech',
  'FR',
  'Île-de-France',
  'Paris',
  false,
  'Paris, Île-de-France, France',
  'Prototype',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/quiethours-logo.png',
  '/startups/quiethours-thumb.png',
  '{"name":"Camille Laurent","role":"Founder","avatar":"","quote":"Help teams collaborate without sacrificing the time needed for deep work."}'::jsonb,
  'Distributed teams lose focused work time as calendars fill with meetings across time zones.',
  'QuietHours coordinates team preferences and suggests meeting windows while protecting shared focus blocks.',
  '["Focus preferences","shared availability","meeting suggestions","calendar sync","weekly insights"]'::jsonb,
  '["SvelteKit","TypeScript","Go","PostgreSQL","Calendar APIs"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 11. ProfitPilot ────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'profitpilot', _owner_id, 'approved', false,
  'ProfitPilot',
  'ProfitPilot',
  'Smarter insights. Higher profits.',
  'A simple performance dashboard for independent online sellers.',
  '',
  'FinTech',
  'SG',
  'Singapore',
  'Singapore',
  false,
  'Singapore, Singapore, Singapore',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/profitpilot-logo.png',
  '/startups/profitpilot-thumb.png',
  '{"name":"Chloe Tan","role":"Founder","avatar":"","quote":"Make clear business performance data accessible to every independent seller."}'::jsonb,
  'Small online sellers struggle to understand true product margins across advertising, shipping, and marketplace fees.',
  'ProfitPilot combines sales and cost data into product-level margin insights and practical performance reports.',
  '["Sales overview","product margins","fee tracking","ad spend","alerts","exports"]'::jsonb,
  '["Vue.js","Laravel","MySQL","Redis","Chart.js"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 12. AgriNext ───────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'agrinext', _owner_id, 'approved', false,
  'AgriNext',
  'AgriNext',
  'Modern solutions for farmers.',
  'A farm operations planner for small and mid-sized growers.',
  '',
  'AgriTech',
  'IN',
  'Maharashtra',
  'Nashik',
  false,
  'Nashik, Maharashtra, India',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/agrinext-logo.png',
  '/startups/agrinext-thumb.png',
  '{"name":"Vikram Patil","role":"Founder","avatar":"","quote":"Put practical digital tools in the hands of the people growing our food."}'::jsonb,
  'Growers often coordinate crop activities, input purchases, and field observations through disconnected records.',
  'AgriNext provides field logs, crop calendars, input tracking, and weather-informed task planning.',
  '["Crop calendar","field logs","input records","weather alerts","task reminders"]'::jsonb,
  '["React Native","Django","PostgreSQL","weather APIs","GIS"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 13. HealthBridge ───────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'healthbridge', _owner_id, 'approved', false,
  'HealthBridge',
  'HealthBridge',
  'Affordable healthcare for everyone.',
  'A clinic workflow and patient follow-up platform for community practices.',
  '',
  'HealthTech',
  'KE',
  'Nairobi County',
  'Nairobi',
  false,
  'Nairobi, Nairobi County, Kenya',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/healthbridge-logo.png',
  '/startups/healthbridge-thumb.png',
  '{"name":"Wanjiku Mwangi","role":"Founder","avatar":"","quote":"Support community clinics with technology that is practical and dependable."}'::jsonb,
  'Small clinics find it hard to coordinate patient follow-ups and maintain consistent visit records.',
  'HealthBridge offers appointment workflows, visit summaries, and follow-up reminders in a lightweight clinic workspace.',
  '["Appointment management","patient notes","follow-up reminders","staff roles","reports"]'::jsonb,
  '["Django","React","PostgreSQL","Docker","SMS gateway"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 14. FuelSmart ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'fuelsmart', _owner_id, 'approved', false,
  'FuelSmart',
  'FuelSmart',
  'Smarter fuel. Greener planet.',
  'A fleet energy monitoring tool for commercial vehicle operators.',
  '',
  'CleanTech',
  'NL',
  'South Holland',
  'Rotterdam',
  false,
  'Rotterdam, South Holland, Netherlands',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/fuelsmart-logo.png',
  '/startups/fuelsmart-thumb.png',
  '{"name":"Daan de Vries","role":"Founder","avatar":"","quote":"Help fleet operators reduce waste through better everyday decisions."}'::jsonb,
  'Fleet managers have limited visibility into fuel usage patterns and avoidable operating inefficiencies.',
  'FuelSmart analyzes vehicle and fuel records to flag unusual consumption and compare fleet performance.',
  '["Fuel logs","vehicle comparisons","anomaly alerts","efficiency trends","fleet reports"]'::jsonb,
  '["Node.js","Python","TimescaleDB","React","MQTT"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 15. StreamForge ────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'streamforge', _owner_id, 'approved', false,
  'StreamForge',
  'StreamForge',
  'Create. Share. Monetize.',
  'A lightweight collaboration hub for independent video creators.',
  '',
  'DeepTech',
  'IN',
  'Maharashtra',
  'Mumbai',
  false,
  'Mumbai, Maharashtra, India',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/streamforge-logo.png',
  '/startups/streamforge-thumb.png',
  '{"name":"Aisha Khan","role":"Founder","avatar":"","quote":"Give independent creators the systems they need to build sustainable businesses."}'::jsonb,
  'Independent creators manage briefs, feedback, assets, and sponsor deliverables across too many tools.',
  'StreamForge brings project briefs, review links, asset handoffs, and sponsor deliverables into one workspace.',
  '["Project rooms","video review","timestamp comments","asset library","sponsor tracker"]'::jsonb,
  '["Next.js","NestJS","PostgreSQL","S3","FFmpeg"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 16. TalkEase ───────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'talkease', _owner_id, 'approved', false,
  'TalkEase',
  'TalkEase',
  'Break language barriers.',
  'A practice-first language exchange platform for working adults.',
  '',
  'EdTech',
  'ES',
  'Catalonia',
  'Barcelona',
  false,
  'Barcelona, Catalonia, Spain',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/talkease-logo.png',
  '/startups/talkease-thumb.png',
  '{"name":"Lucía Martín","role":"Founder","avatar":"","quote":"Make real conversation practice welcoming, consistent, and accessible."}'::jsonb,
  'Adult language learners struggle to find consistent conversation practice that fits their schedules.',
  'TalkEase matches learners for short guided sessions and provides prompts and reflection notes after each exchange.',
  '["Partner matching","guided prompts","voice rooms","session notes","learning streaks"]'::jsonb,
  '["React Native","Elixir","PostgreSQL","WebRTC","Redis"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 17. HomeEase ───────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'homeease', _owner_id, 'approved', false,
  'HomeEase',
  'HomeEase',
  'Smarter living, every day.',
  'A home maintenance organizer for homeowners and renters.',
  '',
  'DeepTech',
  'IN',
  'Madhya Pradesh',
  'Bhopal',
  false,
  'Bhopal, Madhya Pradesh, India',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/homeease-logo.png',
  '/startups/homeease-thumb.png',
  '{"name":"Neel Joshi","role":"Founder","avatar":"","quote":"Make home ownership and renting easier to manage, one small task at a time."}'::jsonb,
  'Households often forget maintenance schedules, warranty details, and service history for appliances and home systems.',
  'HomeEase stores home records, recurring maintenance tasks, warranty dates, and trusted service contacts.',
  '["Home inventory","maintenance reminders","warranty vault","service log","household sharing"]'::jsonb,
  '["Flutter","Supabase","PostgreSQL","Node.js","Firebase"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 18. MindfulMe ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'mindfulme', _owner_id, 'approved', false,
  'MindfulMe',
  'MindfulMe',
  'Your mental wellness companion.',
  'A guided journaling and habit reflection app for everyday wellbeing.',
  '',
  'HealthTech',
  'AU',
  'New South Wales',
  'Sydney',
  false,
  'Sydney, New South Wales, Australia',
  'Prototype',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/mindfulme-logo.png',
  '/startups/mindfulme-thumb.png',
  '{"name":"Harper Collins","role":"Founder","avatar":"","quote":"Help people build small, sustainable habits of self-reflection and wellbeing."}'::jsonb,
  'People who want to build reflective routines often find generic habit trackers impersonal and hard to sustain.',
  'MindfulMe combines private journaling prompts, gentle habit check-ins, and personal reflection summaries.',
  '["Guided journaling","mood check-ins","habit reminders","reflection summaries","privacy controls"]'::jsonb,
  '["Flutter","Firebase","Python","FastAPI","encrypted storage"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 19. BuildGrid ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'buildgrid', _owner_id, 'approved', false,
  'BuildGrid',
  'BuildGrid',
  'Build faster. Scale smarter.',
  'A project coordination workspace for small software teams.',
  '',
  'DeepTech',
  'US',
  'Washington',
  'Seattle',
  false,
  'Seattle, Washington, United States',
  'Idea Stage',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/buildgrid-logo.png',
  '/startups/buildgrid-thumb.png',
  '{"name":"Daniel Kim","role":"Founder","avatar":"","quote":"Make dependable software delivery easier for teams without large operations departments."}'::jsonb,
  'Small engineering teams use disconnected tools to track releases, dependencies, and delivery risks.',
  'BuildGrid links project tasks, release milestones, and team updates in one clear engineering overview.',
  '["Release planning","dependency map","GitHub sync","milestone tracking","delivery insights"]'::jsonb,
  '["TypeScript","React","Go","PostgreSQL","GitHub API"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

-- ─── 20. EcoSphere ──────────────────────────────────────────────────────────
INSERT INTO startups (
  slug, owner_id, status, is_sample, name, idea_title, tagline, description,
  full_story, category, country_code, region, city, remote_first, location,
  stage, month, month_label, website_url,
  logo_type, logo_color, thumbnail, cover_image,
  founder_json, problem, solution,
  key_features_json, tech_stack_json, traction, views_count,
  approved_at, reviewed_by, created_at, updated_at
) VALUES (
  'ecosphere', _owner_id, 'approved', false,
  'EcoSphere',
  'EcoSphere',
  'A cleaner, greener tomorrow.',
  'A sustainability action tracker for schools and local organizations.',
  '',
  'CleanTech',
  'SE',
  'Stockholm County',
  'Stockholm',
  false,
  'Stockholm, Stockholm County, Sweden',
  'MVP',
  _month, _month_lbl, '',
  'upload', '#2563EB',
  '/startups/ecosphere-logo.png',
  '/startups/ecosphere-thumb.png',
  '{"name":"Elsa Lindström","role":"Founder","avatar":"","quote":"Turn local environmental ambition into visible, collective progress."}'::jsonb,
  'Schools and community groups struggle to turn environmental goals into measurable, shared activities.',
  'EcoSphere helps groups plan initiatives, record participation, and report progress on practical sustainability goals.',
  '["Initiative tracker","participation logs","impact dashboard","team challenges","reports"]'::jsonb,
  '["Django","React","PostgreSQL","MapLibre","Docker"]'::jsonb,
  '', 0,
  _now, _owner_id, _now, _now
) ON CONFLICT (slug) DO NOTHING;

END $$;

COMMIT;
