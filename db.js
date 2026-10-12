import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dbDir = process.env.DB_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🦄',
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS letter_sound_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    letter TEXT NOT NULL,
    correct INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    last_practiced DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, letter)
  );

  CREATE TABLE IF NOT EXISTS profile_progress (
    profile_id INTEGER PRIMARY KEY,
    level INTEGER NOT NULL DEFAULT 1,
    streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    correct_in_level INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Seed default profile 'Quinn' with avatar '🦄' if no profiles exist
const existingProfile = db.prepare('SELECT id FROM profiles LIMIT 1').get();
if (!existingProfile) {
  const insertProfile = db.prepare('INSERT INTO profiles (name, avatar, is_active) VALUES (?, ?, 1)');
  const info = insertProfile.run('Quinn', '🦄');
  const profileId = info.lastInsertRowid;

  db.prepare(`
    INSERT INTO profile_progress (profile_id, level, streak, best_streak, correct_in_level)
    VALUES (?, 1, 0, 0, 0)
  `).run(profileId);
}

// Ensure default settings exist
const getSetting = (k, defaultVal) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(k);
  if (!row) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(k, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(row.value);
};

getSetting('soundHintEnabled', true);
getSetting('scrambleOnWrong', false);
getSetting('letterCase', 'both'); // 'uppercase' | 'lowercase' | 'both'

export default db;
