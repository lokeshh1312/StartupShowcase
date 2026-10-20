import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { randomBytes, createHash, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, seedSamples } from './database.mjs';
import { AVAILABLE_MONTHS, CATEGORIES_LIST, STAGES_LIST, INDIAN_STATES } from '../src/data/startups.js';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = resolve(projectRoot, 'dist');
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction && process.env.DEMO_SEED === undefined) process.env.DEMO_SEED = 'true';
const cookieName = 'showcase_session';
const sessionDuration = 1000 * 60 * 60 * 24 * 14;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2'
};
const rateLimits = new Map();

const json = (res, status, value, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...headers
  });
  res.end(JSON.stringify(value));
};

const fail = (res, status, message) => json(res, status, { error: message });
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map((piece) => piece.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined)
    .map(([key, value]) => [key, decodeURIComponent(value)])
);

const getUser = (req) => {
  const token = parseCookies(req.headers.cookie)[cookieName];
  if (!token) return null;
  const session = db.prepare(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(hashToken(token), Date.now());
  return session || null;
};

const issueSession = (res, userId) => {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, Date.now() + sessionDuration);
  res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(sessionDuration / 1000)}${isProduction ? '; Secure' : ''}`);
};

const clearSession = (res) => {
  res.setHeader('Set-Cookie', `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProduction ? '; Secure' : ''}`);
};

const readJson = async (req) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 256) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
};

const requireUser = (req, res) => {
  if (!req.user) {
    fail(res, 401, 'Please sign in to continue.');
    return false;
  }
  return true;
};

const requireAdmin = (req, res) => {
  if (!requireUser(req, res)) return false;
  if (req.user.role !== 'admin') {
    fail(res, 403, 'Administrator access is required.');
    return false;
  }
  return true;
};

const rateLimit = (req, key, maximum, windowMs) => {
  const now = Date.now();
  const identity = `${key}:${req.socket.remoteAddress || 'unknown'}`;
  const entry = rateLimits.get(identity);
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(identity, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maximum;
};

const safeUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

const startupFromRow = (row, user) => {
  const voteCount = db.prepare('SELECT COUNT(*) AS count FROM startup_votes WHERE startup_id = ?').get(row.id).count;
  return {
    id: row.id, slug: row.slug, rank: row.rank, status: row.status, isSample: Boolean(row.is_sample),
    name: row.name, ideaTitle: row.idea_title, tagline: row.tagline, description: row.description,
    fullStory: row.full_story, category: row.category, location: row.location, stage: row.stage,
    month: row.month, monthLabel: row.month_label, websiteUrl: row.website_url,
    logoType: row.logo_type, logoColor: row.logo_color, thumbnail: row.thumbnail, coverImage: row.cover_image,
    founder: JSON.parse(row.founder_json || '{}'), problem: row.problem, solution: row.solution,
    keyFeatures: JSON.parse(row.key_features_json || '[]'), techStack: JSON.parse(row.tech_stack_json || '[]'),
    traction: row.traction, likes: voteCount, views: row.views,
    isLiked: user ? Boolean(db.prepare('SELECT 1 FROM startup_votes WHERE user_id = ? AND startup_id = ?').get(user.id, row.id)) : false,
    isSaved: user ? Boolean(db.prepare('SELECT 1 FROM saved_startups WHERE user_id = ? AND startup_id = ?').get(user.id, row.id)) : false,
    createdAt: row.created_at
  };
};

const text = (value, max, field) => {
  const result = typeof value === 'string' ? value.trim() : '';
  if (!result || result.length > max) throw Object.assign(new Error(`${field} is required and must be under ${max} characters.`), { status: 422 });
  return result;
};

const optionalText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeUrl = (value) => {
  const raw = optionalText(value, 300);
  if (!raw) return '';
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    return url.toString();
  } catch {
    return '';
  }
};

const makeStartup = (body, userId, status = 'pending') => {
  const id = randomUUID();
  const base = text(body.name, 100, 'Startup name').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'startup';
  let slug = base;
  while (db.prepare('SELECT 1 FROM startups WHERE slug = ?').get(slug)) slug = `${base}-${randomBytes(3).toString('hex')}`;
  const monthRecord = AVAILABLE_MONTHS.find((entry) => entry.id === body.month);
  if (!monthRecord) throw Object.assign(new Error('Choose a valid launch month.'), { status: 422 });
  const category = text(body.category, 60, 'Category');
  if (!CATEGORIES_LIST.some((entry) => entry.id === category)) throw Object.assign(new Error('Choose a valid startup category.'), { status: 422 });
  const stage = text(body.stage, 40, 'Stage');
  if (!STAGES_LIST.includes(stage) || stage === 'All Stages') throw Object.assign(new Error('Choose a valid startup stage.'), { status: 422 });
  const location = text(body.location, 100, 'Location');
  if (!INDIAN_STATES.includes(location)) throw Object.assign(new Error('Choose a valid location.'), { status: 422 });
  const month = monthRecord.id;
  const monthLabel = monthRecord.label;
  const founder = {
    name: optionalText(body.founderName || body.founder?.name, 100),
    role: optionalText(body.founderRole || body.founder?.role, 100),
    avatar: normalizeUrl(body.founderAvatar || body.founder?.avatar),
    quote: optionalText(body.founderQuote || body.founder?.quote, 500)
  };
  const startup = {
    id, slug, ownerId: userId, status,
    name: text(body.name, 100, 'Startup name'),
    ideaTitle: text(body.ideaTitle || body.name, 140, 'Product title'),
    tagline: optionalText(body.tagline, 240),
    description: text(body.description, 500, 'Description'),
    fullStory: optionalText(body.fullStory, 12000),
    category,
    location,
    stage,
    month, monthLabel, websiteUrl: normalizeUrl(body.websiteUrl),
    logoType: optionalText(body.logoType, 40) || 'sprout',
    logoColor: /^#[0-9a-f]{6}$/i.test(body.logoColor || '') ? body.logoColor : '#2563EB',
    thumbnail: normalizeUrl(body.thumbnail), coverImage: normalizeUrl(body.coverImage || body.thumbnail),
    founder, problem: optionalText(body.problem, 12000), solution: optionalText(body.solution, 12000),
    keyFeatures: Array.isArray(body.keyFeatures) ? body.keyFeatures.slice(0, 12).map((item) => optionalText(item, 300)).filter(Boolean) : [],
    techStack: Array.isArray(body.techStack) ? body.techStack.slice(0, 12).map((item) => optionalText(item, 60)).filter(Boolean) : [],
    traction: optionalText(body.traction, 1000)
  };
  db.prepare(`
    INSERT INTO startups (
      id, slug, owner_id, status, rank, name, idea_title, tagline, description, full_story,
      category, location, stage, month, month_label, website_url, logo_type, logo_color,
      thumbnail, cover_image, founder_json, problem, solution, key_features_json,
      tech_stack_json, traction
    ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    startup.id, startup.slug, startup.ownerId, startup.status, startup.name, startup.ideaTitle,
    startup.tagline, startup.description, startup.fullStory, startup.category, startup.location,
    startup.stage, startup.month, startup.monthLabel, startup.websiteUrl, startup.logoType,
    startup.logoColor, startup.thumbnail, startup.coverImage, JSON.stringify(startup.founder),
    startup.problem, startup.solution, JSON.stringify(startup.keyFeatures), JSON.stringify(startup.techStack), startup.traction
  );
  return startup;
};

const getStartupByIdOrSlug = (idOrSlug) => db.prepare('SELECT * FROM startups WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);

const routeApi = async (req, res, pathname, searchParams) => {
  const method = req.method || 'GET';
  req.user = getUser(req);

  if (pathname === '/api/health' && method === 'GET') return json(res, 200, { ok: true });

  if (pathname === '/api/auth/register' && method === 'POST') {
    if (!rateLimit(req, 'register', 8, 60 * 60 * 1000)) return fail(res, 429, 'Too many attempts. Please try again later.');
    const body = await readJson(req);
    const name = text(body.name, 100, 'Name');
    const email = text(body.email, 254, 'Email').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 422, 'Enter a valid email address.');
    const password = text(body.password, 128, 'Password');
    if (password.length < 10) return fail(res, 422, 'Use a password with at least 10 characters.');
    const role = ['founder', 'investor', 'community'].includes(body.role) ? body.role : 'community';
    const salt = randomBytes(16);
    const passwordHash = `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
    const id = randomUUID();
    try {
      db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, passwordHash, role);
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) return fail(res, 409, 'An account with this email already exists.');
      throw error;
    }
    issueSession(res, id);
    return json(res, 201, { user: { id, name, email, role } });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    if (!rateLimit(req, 'login', 12, 15 * 60 * 1000)) return fail(res, 429, 'Too many sign-in attempts. Please try again later.');
    const body = await readJson(req);
    const email = optionalText(body.email, 254).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const user = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
    let valid = false;
    if (user) {
      const [saltHex, hashHex] = user.password_hash.split(':');
      const expected = Buffer.from(hashHex, 'hex');
      const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
      valid = expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    if (!valid) return fail(res, 401, 'Email or password is incorrect.');
    issueSession(res, user.id);
    return json(res, 200, { user: safeUser(user) });
  }

  if (pathname === '/api/auth/me' && method === 'GET') return json(res, 200, { user: req.user ? safeUser(req.user) : null });

  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = parseCookies(req.headers.cookie)[cookieName];
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    clearSession(res);
    return json(res, 200, { ok: true });
  }

  if (pathname === '/api/startups' && method === 'GET') {
    const clauses = ["status = 'approved'"];
    const values = [];
    const filters = [
      ['month', 'month'], ['category', 'category'], ['location', 'location'], ['stage', 'stage']
    ];
    for (const [parameter, column] of filters) {
      const value = searchParams.get(parameter);
      if (value && value !== 'All' && value !== 'All Stages') {
        clauses.push(`${column} = ? COLLATE NOCASE`);
        values.push(value);
      }
    }
    const query = optionalText(searchParams.get('q'), 120);
    if (query) {
      clauses.push('(name LIKE ? OR idea_title LIKE ? OR description LIKE ? OR category LIKE ? OR location LIKE ?)');
      const like = `%${query.replace(/[\\%_]/g, '\\$&')}%`;
      values.push(like, like, like, like, like);
    }
    const sort = searchParams.get('sort');
    const orderBy = sort === 'likes' ? '(SELECT COUNT(*) FROM startup_votes WHERE startup_id = startups.id) DESC, name COLLATE NOCASE'
      : sort === 'views' ? 'views DESC, name COLLATE NOCASE'
      : sort === 'alphabetical' ? 'name COLLATE NOCASE'
          : '(SELECT COUNT(*) FROM startup_votes WHERE startup_id = startups.id) DESC, views DESC, created_at DESC, name COLLATE NOCASE';
    const rows = db.prepare(`SELECT * FROM startups WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy} LIMIT 500`).all(...values);
    const monthRanks = new Map();
    const items = rows.map((row) => {
      const rank = (monthRanks.get(row.month) || 0) + 1;
      monthRanks.set(row.month, rank);
      return { ...startupFromRow(row, req.user), rank };
    });
    return json(res, 200, { items, total: rows.length });
  }

  if (pathname === '/api/startups' && method === 'POST') {
    if (!requireUser(req, res)) return;
    if (!['founder', 'admin'].includes(req.user.role)) return fail(res, 403, 'Only founders can submit startup listings.');
    const body = await readJson(req);
    const startup = makeStartup(body, req.user.id);
    return json(res, 201, { startup });
  }

  const startupCommentsMatch = pathname.match(/^\/api\/startups\/([^/]+)\/comments$/);
  if (startupCommentsMatch && method === 'POST') {
    if (!requireUser(req, res)) return;
    if (!rateLimit(req, 'comment', 30, 60 * 60 * 1000)) return fail(res, 429, 'You have posted too many comments. Try again later.');
    const startup = getStartupByIdOrSlug(decodeURIComponent(startupCommentsMatch[1]));
    if (!startup || startup.status !== 'approved') return fail(res, 404, 'Startup not found.');
    const body = await readJson(req);
    const content = text(body.content, 1500, 'Comment');
    const id = randomUUID();
    db.prepare('INSERT INTO startup_comments (id, user_id, startup_id, content) VALUES (?, ?, ?, ?)').run(id, req.user.id, startup.id, content);
    return json(res, 201, { comment: { id, author: req.user.name, role: req.user.role, content, date: 'Just now', avatar: '' } });
  }

  const voteMatch = pathname.match(/^\/api\/startups\/([^/]+)\/vote$/);
  if (voteMatch && method === 'POST') {
    if (!requireUser(req, res)) return;
    const startup = getStartupByIdOrSlug(decodeURIComponent(voteMatch[1]));
    if (!startup || startup.status !== 'approved') return fail(res, 404, 'Startup not found.');
    db.exec('BEGIN IMMEDIATE');
    try {
      const existing = db.prepare('SELECT 1 FROM startup_votes WHERE user_id = ? AND startup_id = ?').get(req.user.id, startup.id);
      if (existing) db.prepare('DELETE FROM startup_votes WHERE user_id = ? AND startup_id = ?').run(req.user.id, startup.id);
      else db.prepare('INSERT INTO startup_votes (user_id, startup_id) VALUES (?, ?)').run(req.user.id, startup.id);
      const likes = db.prepare('SELECT COUNT(*) AS count FROM startup_votes WHERE startup_id = ?').get(startup.id).count;
      db.exec('COMMIT');
      return json(res, 200, { liked: !existing, likes });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  const saveMatch = pathname.match(/^\/api\/startups\/([^/]+)\/save$/);
  if (saveMatch && method === 'POST') {
    if (!requireUser(req, res)) return;
    const startup = getStartupByIdOrSlug(decodeURIComponent(saveMatch[1]));
    if (!startup || startup.status !== 'approved') return fail(res, 404, 'Startup not found.');
    const existing = db.prepare('SELECT 1 FROM saved_startups WHERE user_id = ? AND startup_id = ?').get(req.user.id, startup.id);
    if (existing) db.prepare('DELETE FROM saved_startups WHERE user_id = ? AND startup_id = ?').run(req.user.id, startup.id);
    else db.prepare('INSERT INTO saved_startups (user_id, startup_id) VALUES (?, ?)').run(req.user.id, startup.id);
    return json(res, 200, { saved: !existing });
  }

  const startupDetailMatch = pathname.match(/^\/api\/startups\/([^/]+)$/);
  if (startupDetailMatch && method === 'GET') {
    const startup = getStartupByIdOrSlug(decodeURIComponent(startupDetailMatch[1]));
    if (!startup || startup.status !== 'approved') return fail(res, 404, 'Startup not found.');
    db.prepare('UPDATE startups SET views = views + 1 WHERE id = ?').run(startup.id);
    const freshRow = getStartupByIdOrSlug(startup.id);
    const comments = db.prepare(`
      SELECT startup_comments.id, startup_comments.content, startup_comments.created_at,
        users.id AS author_id, users.name AS author, users.role
      FROM startup_comments JOIN users ON users.id = startup_comments.user_id
      WHERE startup_comments.startup_id = ? ORDER BY startup_comments.created_at DESC LIMIT 100
    `).all(startup.id).map((comment) => ({
      id: comment.id, author: comment.author, authorId: comment.author_id, role: comment.role,
      content: comment.content, date: comment.created_at
    }));
    return json(res, 200, { startup: startupFromRow(freshRow, req.user), comments });
  }

  if (pathname === '/api/me/saved' && method === 'GET') {
    if (!requireUser(req, res)) return;
    const rows = db.prepare(`
      SELECT startups.* FROM saved_startups
      JOIN startups ON startups.id = saved_startups.startup_id
      WHERE saved_startups.user_id = ? AND startups.status = 'approved'
      ORDER BY saved_startups.created_at DESC
    `).all(req.user.id);
    return json(res, 200, { items: rows.map((row) => startupFromRow(row, req.user)) });
  }

  if (pathname === '/api/me/submissions' && method === 'GET') {
    if (!requireUser(req, res)) return;
    const rows = db.prepare('SELECT * FROM startups WHERE owner_id = ? ORDER BY created_at DESC').all(req.user.id);
    return json(res, 200, { items: rows.map((row) => startupFromRow(row, req.user)) });
  }

  if (pathname === '/api/admin/startups' && method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const status = ['pending', 'approved', 'rejected'].includes(searchParams.get('status')) ? searchParams.get('status') : 'pending';
    const rows = db.prepare('SELECT * FROM startups WHERE status = ? ORDER BY created_at DESC').all(status);
    return json(res, 200, { items: rows.map((row) => startupFromRow(row, req.user)) });
  }

  const moderationMatch = pathname.match(/^\/api\/admin\/startups\/([^/]+)\/status$/);
  if (moderationMatch && method === 'PATCH') {
    if (!requireAdmin(req, res)) return;
    const body = await readJson(req);
    if (!['approved', 'rejected', 'pending'].includes(body.status)) return fail(res, 422, 'Choose a valid review status.');
    const startup = getStartupByIdOrSlug(decodeURIComponent(moderationMatch[1]));
    if (!startup) return fail(res, 404, 'Startup not found.');
    db.prepare('UPDATE startups SET status = ?, reviewed_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(body.status, req.user.id, startup.id);
    return json(res, 200, { status: body.status });
  }

  return fail(res, 404, 'API route not found.');
};

const sendStatic = (req, res, pathname) => {
  if (!existsSync(resolve(distRoot, 'index.html'))) return fail(res, 503, 'The app has not been built yet. Run npm run build first.');
  const decoded = decodeURIComponent(pathname);
  let target = resolve(distRoot, `.${decoded}`);
  if (!target.startsWith(`${distRoot}${sep}`) && target !== distRoot) return fail(res, 403, 'Forbidden.');
  if (!existsSync(target) || !statSync(target).isFile()) target = resolve(distRoot, 'index.html');
  const type = mimeTypes[extname(target).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Cache-Control': target.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(target).pipe(res);
};

await seedSamples();
db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    try {
      await routeApi(req, res, url.pathname, url.searchParams);
    } catch (error) {
      if (res.headersSent) return res.end();
      json(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
      if (!error.status) console.error(error);
    }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'Method not allowed.');
  sendStatic(req, res, url.pathname);
});

server.listen(port, '0.0.0.0', () => console.log(`Startup Showcase running at http://localhost:${port}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => {
    db.close();
    process.exit(0);
  }));
}
