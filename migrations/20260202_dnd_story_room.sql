-- DnD game mode tables

-- DnD sessions table
CREATE TABLE IF NOT EXISTS dnd_sessions (
  id BIGSERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_by_user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'lobby',
  world_state_json TEXT,
  round INTEGER NOT NULL DEFAULT 0,
  rng_seed INTEGER NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- DnD characters table
CREATE TABLE IF NOT EXISTS dnd_characters (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES dnd_sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  -- CORE attribute system
  might INTEGER NOT NULL DEFAULT 3,
  finesse INTEGER NOT NULL DEFAULT 3,
  wit INTEGER NOT NULL DEFAULT 3,
  instinct INTEGER NOT NULL DEFAULT 3,
  presence INTEGER NOT NULL DEFAULT 3,
  resolve INTEGER NOT NULL DEFAULT 3,
  chaos INTEGER NOT NULL DEFAULT 3,
  -- Character state
  skills_json TEXT,
  perks_json TEXT,
  hp INTEGER NOT NULL DEFAULT 100,
  max_hp INTEGER NOT NULL DEFAULT 100,
  alive BOOLEAN NOT NULL DEFAULT TRUE,
  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(session_id, user_id)
);

-- DnD events table for narrative history
CREATE TABLE IF NOT EXISTS dnd_events (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES dnd_sessions(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  text TEXT NOT NULL,
  involved_character_ids_json TEXT,
  outcome_json TEXT,
  created_at BIGINT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dnd_sessions_room ON dnd_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_dnd_sessions_status ON dnd_sessions(status);
CREATE INDEX IF NOT EXISTS idx_dnd_characters_session ON dnd_characters(session_id);
CREATE INDEX IF NOT EXISTS idx_dnd_characters_user ON dnd_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_dnd_events_session ON dnd_events(session_id);
CREATE INDEX IF NOT EXISTS idx_dnd_events_round ON dnd_events(session_id, round);
