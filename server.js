import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Serve static audio files
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}
app.use('/audio', express.static(audioDir, {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Serve production build static files
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// GET /api/version - System version & audio engine information
app.get('/api/version', (req, res) => {
  res.json({
    app: "Quinn's Letter Sounds",
    version: "1.3.2",
    audioEngine: "authentic-prerecorded-phonics",
    buildDate: "2026-10-16",
    features: ["pure-human-phonics", "profile-tracking", "balloon-game", "fishing-game", "matching-game", "train-spelling", "enter-left-exit-right", "keyboard-typing"]
  });
});

// GET /api/profiles - List all profiles
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = db.prepare('SELECT * FROM profiles ORDER BY id ASC').all();
    res.json({ profiles });
  } catch (err) {
    console.error('Error fetching profiles:', err);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// GET /api/profiles/active - Get current active profile and stats
app.get('/api/profiles/active', (req, res) => {
  try {
    let profile = db.prepare('SELECT * FROM profiles WHERE is_active = 1 LIMIT 1').get();
    if (!profile) {
      profile = db.prepare('SELECT * FROM profiles ORDER BY id ASC LIMIT 1').get();
      if (profile) {
        db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(profile.id);
      }
    }

    if (!profile) {
      return res.status(404).json({ error: 'No profiles found' });
    }

    const progress = db.prepare('SELECT * FROM profile_progress WHERE profile_id = ?').get(profile.id) || {
      level: 1,
      streak: 0,
      best_streak: 0,
      correct_in_level: 0,
    };

    const trainProgress = db.prepare('SELECT * FROM train_game_progress WHERE profile_id = ?').get(profile.id) || {
      level: 1,
      correct_in_level: 0,
      total_words_spelled: 0,
      streak: 0,
      best_streak: 0,
    };

    const statsRows = db.prepare('SELECT letter, correct, total FROM letter_sound_stats WHERE profile_id = ?').all(profile.id);
    const letters = {};
    for (const row of statsRows) {
      letters[row.letter] = { correct: row.correct, total: row.total };
    }

    const wordRows = db.prepare('SELECT word, correct, total FROM word_spelling_stats WHERE profile_id = ?').all(profile.id);
    const words = {};
    for (const row of wordRows) {
      words[row.word] = { correct: row.correct, total: row.total };
    }

    const settingsRows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of settingsRows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    res.json({
      profile,
      progress,
      trainProgress,
      letters,
      words,
      settings,
    });
  } catch (err) {
    console.error('Error fetching active profile:', err);
    res.status(500).json({ error: 'Failed to fetch active profile state' });
  }
});

// POST /api/profiles - Create new passwordless profile
app.post('/api/profiles', (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const trimmedName = name.trim();
    const chosenAvatar = avatar || '🦄';

    // Set other profiles inactive
    db.prepare('UPDATE profiles SET is_active = 0').run();

    const insert = db.prepare('INSERT INTO profiles (name, avatar, is_active) VALUES (?, ?, 1)');
    const info = insert.run(trimmedName, chosenAvatar);
    const newId = info.lastInsertRowid;

    db.prepare(`
      INSERT INTO profile_progress (profile_id, level, streak, best_streak, correct_in_level)
      VALUES (?, 1, 0, 0, 0)
    `).run(newId);

    db.prepare(`
      INSERT INTO train_game_progress (profile_id, level, correct_in_level, total_words_spelled, streak, best_streak)
      VALUES (?, 1, 0, 0, 0, 0)
    `).run(newId);

    const newProfile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(newId);
    res.json({ profile: newProfile });
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// POST /api/profiles/:id/select - Switch active profile
app.post('/api/profiles/:id/select', (req, res) => {
  try {
    const profileId = parseInt(req.params.id, 10);
    db.prepare('UPDATE profiles SET is_active = 0').run();
    db.prepare('UPDATE profiles SET is_active = 1 WHERE id = ?').run(profileId);

    const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Error selecting profile:', err);
    res.status(500).json({ error: 'Failed to switch profile' });
  }
});

// PUT /api/profiles/:id - Update profile avatar / name
app.put('/api/profiles/:id', (req, res) => {
  try {
    const profileId = parseInt(req.params.id, 10);
    const { name, avatar } = req.body;

    if (name) {
      db.prepare('UPDATE profiles SET name = ? WHERE id = ?').run(name.trim(), profileId);
    }
    if (avatar) {
      db.prepare('UPDATE profiles SET avatar = ? WHERE id = ?').run(avatar, profileId);
    }

    const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(profileId);
    res.json({ profile: updated });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/stats/record - Record letter sound attempt result
app.post('/api/stats/record', (req, res) => {
  try {
    const { profileId, letter, isCorrect, level, streak, correctInLevel } = req.body;

    if (!profileId || !letter) {
      return res.status(400).json({ error: 'profileId and letter are required' });
    }

    const upperLetter = letter.toUpperCase();

    // Upsert letter_sound_stats
    const existing = db.prepare('SELECT correct, total FROM letter_sound_stats WHERE profile_id = ? AND letter = ?').get(profileId, upperLetter);
    if (existing) {
      const newCorrect = existing.correct + (isCorrect ? 1 : 0);
      const newTotal = existing.total + 1;
      db.prepare(`
        UPDATE letter_sound_stats
        SET correct = ?, total = ?, last_practiced = CURRENT_TIMESTAMP
        WHERE profile_id = ? AND letter = ?
      `).run(newCorrect, newTotal, profileId, upperLetter);
    } else {
      db.prepare(`
        INSERT INTO letter_sound_stats (profile_id, letter, correct, total)
        VALUES (?, ?, ?, 1)
      `).run(profileId, upperLetter, isCorrect ? 1 : 0);
    }

    // Update profile_progress
    const currentProg = db.prepare('SELECT * FROM profile_progress WHERE profile_id = ?').get(profileId);
    const currentBest = currentProg ? currentProg.best_streak : 0;
    const newBest = Math.max(currentBest, streak || 0);

    db.prepare(`
      INSERT INTO profile_progress (profile_id, level, streak, best_streak, correct_in_level)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(profile_id) DO UPDATE SET
        level = excluded.level,
        streak = excluded.streak,
        best_streak = excluded.best_streak,
        correct_in_level = excluded.correct_in_level
    `).run(profileId, level || 1, streak || 0, newBest, correctInLevel || 0);

    res.json({ success: true });
  } catch (err) {
    console.error('Error recording stats:', err);
    res.status(500).json({ error: 'Failed to record stat' });
  }
});

// POST /api/stats/reset - Reset stats for a profile
app.post('/api/stats/reset', (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId required' });

    db.prepare('DELETE FROM letter_sound_stats WHERE profile_id = ?').run(profileId);
    db.prepare(`
      UPDATE profile_progress
      SET streak = 0, best_streak = 0, correct_in_level = 0
      WHERE profile_id = ?
    `).run(profileId);

    res.json({ success: true });
  } catch (err) {
    console.error('Error resetting stats:', err);
    res.status(500).json({ error: 'Failed to reset stats' });
  }
});

// POST /api/train/record - Record train word spelling attempt
app.post('/api/train/record', (req, res) => {
  try {
    const { profileId, word, isCorrect, level, streak, correctInLevel } = req.body;
    if (!profileId || !word) {
      return res.status(400).json({ error: 'profileId and word are required' });
    }

    const upperWord = word.trim().toUpperCase();

    // 1. Update word_spelling_stats
    const existing = db.prepare('SELECT correct, total FROM word_spelling_stats WHERE profile_id = ? AND word = ?').get(profileId, upperWord);
    if (existing) {
      const newCorrect = existing.correct + (isCorrect ? 1 : 0);
      const newTotal = existing.total + 1;
      db.prepare(`
        UPDATE word_spelling_stats
        SET correct = ?, total = ?, last_practiced = CURRENT_TIMESTAMP
        WHERE profile_id = ? AND word = ?
      `).run(newCorrect, newTotal, profileId, upperWord);
    } else {
      db.prepare(`
        INSERT INTO word_spelling_stats (profile_id, word, correct, total)
        VALUES (?, ?, ?, 1)
      `).run(profileId, upperWord, isCorrect ? 1 : 0);
    }

    // 2. Update train_game_progress
    const currentProg = db.prepare('SELECT * FROM train_game_progress WHERE profile_id = ?').get(profileId);
    const currentBest = currentProg ? currentProg.best_streak : 0;
    const newBest = Math.max(currentBest, streak || 0);
    const prevTotalWords = currentProg ? currentProg.total_words_spelled : 0;
    const newTotalWords = prevTotalWords + (isCorrect ? 1 : 0);

    db.prepare(`
      INSERT INTO train_game_progress (profile_id, level, correct_in_level, total_words_spelled, streak, best_streak)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(profile_id) DO UPDATE SET
        level = excluded.level,
        correct_in_level = excluded.correct_in_level,
        total_words_spelled = excluded.total_words_spelled,
        streak = excluded.streak,
        best_streak = excluded.best_streak
    `).run(profileId, level || 1, correctInLevel || 0, newTotalWords, streak || 0, newBest);

    res.json({ success: true });
  } catch (err) {
    console.error('Error recording train stats:', err);
    res.status(500).json({ error: 'Failed to record train stats' });
  }
});

// POST /api/train/reset - Reset train stats for a profile
app.post('/api/train/reset', (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) return res.status(400).json({ error: 'profileId required' });

    db.prepare('DELETE FROM word_spelling_stats WHERE profile_id = ?').run(profileId);
    db.prepare(`
      UPDATE train_game_progress
      SET streak = 0, best_streak = 0, correct_in_level = 0
      WHERE profile_id = ?
    `).run(profileId);

    res.json({ success: true });
  } catch (err) {
    console.error('Error resetting train stats:', err);
    res.status(500).json({ error: 'Failed to reset train stats' });
  }
});

// GET /api/settings - Get settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const r of rows) {
      try {
        settings[r.key] = JSON.parse(r.value);
      } catch {
        settings[r.key] = r.value;
      }
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// PUT /api/settings - Update settings
app.put('/api/settings', (req, res) => {
  try {
    const newSettings = req.body;
    for (const [k, v] of Object.entries(newSettings)) {
      db.prepare(`
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(k, JSON.stringify(v));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// SPA fallback to index.html
if (fs.existsSync(distDir)) {
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

function startServer(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Quinn's Letter Sounds v1.3.2 running on http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is already in use. Trying port ${Number(port) + 1}...`);
      startServer(Number(port) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
