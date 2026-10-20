import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const databasePath = resolve(process.env.DATABASE_PATH || `${projectRoot}/data/showcase.sqlite`);
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath, { timeout: 5000 });
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'community' CHECK (role IN ('founder', 'investor', 'community', 'admin')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS startups (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
    owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_sample INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    name TEXT NOT NULL,
    idea_title TEXT NOT NULL,
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    full_story TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    stage TEXT NOT NULL,
    month TEXT NOT NULL,
    month_label TEXT NOT NULL,
    website_url TEXT NOT NULL DEFAULT '',
    logo_type TEXT NOT NULL DEFAULT 'sprout',
    logo_color TEXT NOT NULL DEFAULT '#2563EB',
    thumbnail TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    founder_json TEXT NOT NULL DEFAULT '{}',
    problem TEXT NOT NULL DEFAULT '',
    solution TEXT NOT NULL DEFAULT '',
    key_features_json TEXT NOT NULL DEFAULT '[]',
    tech_stack_json TEXT NOT NULL DEFAULT '[]',
    traction TEXT NOT NULL DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS startup_votes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, startup_id)
  );

  CREATE TABLE IF NOT EXISTS saved_startups (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, startup_id)
  );

  CREATE TABLE IF NOT EXISTS startup_comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    startup_id TEXT NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_startups_public_month ON startups(status, month, rank);
  CREATE INDEX IF NOT EXISTS idx_startups_created ON startups(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_comments_startup ON startup_comments(startup_id, created_at DESC);
`);

export const seedSamples = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_SEED !== 'true') return;
  const { INITIAL_STARTUPS } = await import('../src/data/startups.js');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO startups (
      id, slug, status, is_sample, rank, name, idea_title, tagline, description,
      full_story, category, location, stage, month, month_label, website_url,
      logo_type, logo_color, thumbnail, cover_image, founder_json, problem,
      solution, key_features_json, tech_stack_json, traction, views
    ) VALUES (
      ?, ?, 'approved', 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
    )
  `);

  for (const startup of INITIAL_STARTUPS) {
    insert.run(
      startup.id, startup.slug, startup.rank, startup.name, startup.ideaTitle,
      startup.tagline || '', startup.description, startup.fullStory || '',
      startup.category, startup.location, startup.stage, startup.month,
      startup.monthLabel, startup.websiteUrl?.includes('.mock') ? '' : startup.websiteUrl || '',
      startup.logoType || 'sprout', startup.logoColor || '#2563EB',
      startup.thumbnail || '', startup.coverImage || '', JSON.stringify(startup.founder || {}),
      startup.problem || '', startup.solution || '', JSON.stringify(startup.keyFeatures || []),
      JSON.stringify(startup.techStack || []), startup.traction || ''
    );
  }
};
