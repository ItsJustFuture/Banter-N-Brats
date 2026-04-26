CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('lobby', 'active', 'finished')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

CREATE TABLE IF NOT EXISTS game_players (
  session_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  connection_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_players_session ON game_players(session_id);
