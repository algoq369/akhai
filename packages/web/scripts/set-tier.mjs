#!/usr/bin/env node
// Admin lever: set a user's tier (free | pro | legend) by email or user id.
// Usage: node scripts/set-tier.mjs <email|userId> <tier>
// Stripe→tier wiring is a logged follow-up — this is the manual lever until then.
import Database from 'better-sqlite3';
import path from 'path';

const [target, tier] = process.argv.slice(2);
const TIERS = ['free', 'pro', 'legend'];
if (!target || !TIERS.includes(tier)) {
  console.error('Usage: node scripts/set-tier.mjs <email|userId> <free|pro|legend>');
  process.exit(1);
}

const db = new Database(path.join(process.cwd(), 'data', 'akhai.db'));
const user = db
  .prepare('SELECT id, email, username, tier FROM users WHERE email = ? OR id = ?')
  .get(target, target);
if (!user) {
  console.error(`No user found for "${target}"`);
  process.exit(1);
}
console.log('before:', user);
db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(tier, user.id);
console.log('after: ', db.prepare('SELECT id, email, username, tier FROM users WHERE id = ?').get(user.id));
