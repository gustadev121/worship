CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  original_key TEXT NOT NULL,
  practice_key TEXT,
  bpm INTEGER,
  time_signature TEXT,
  lyrics_and_chords TEXT NOT NULL DEFAULT '',
  youtube_video_id TEXT,
  section_timestamps TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS role_assignments (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL,
  instrument_name TEXT NOT NULL DEFAULT '',
  harmony_or_part_notes TEXT,
  reference_timestamps TEXT,
  practice_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(song_id, user_id, role_type, instrument_name)
);
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color_hex TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS song_labels (
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY(song_id, label_id)
);
