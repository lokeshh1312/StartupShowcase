import { randomBytes, scryptSync, randomUUID } from 'node:crypto';
import { db } from './database.mjs';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Showcase Admin';

if (!email || !password || password.length < 10) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters) before running npm run admin:create.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(email);
if (existing) {
  console.error('An account with that email already exists.');
  process.exit(1);
}

const salt = randomBytes(16);
const passwordHash = `${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`;
db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
  .run(randomUUID(), name, email, passwordHash, 'admin');
console.log(`Administrator account created for ${email}.`);
db.close();
