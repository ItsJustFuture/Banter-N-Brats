-- Add XP and level columns to users
ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_type TEXT,
  reward_value TEXT,
  active_date TEXT NOT NULL,
  UNIQUE(challenge_id, active_date)
);

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  username TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  completed_date TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  PRIMARY KEY(username, challenge_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_challenge_progress ON user_challenge_progress(username, completed_date);

-- Insert sample challenges
INSERT OR IGNORE INTO daily_challenges (challenge_id, title, description, reward_type, reward_value, active_date) VALUES
('daily-messages-50', 'Chatterbox', 'Send 50 messages today', 'gold', '100', '2026-02-09'),
('daily-chess-3', 'Chess Champion', 'Win 3 chess games today', 'badge', 'daily-chess-master', '2026-02-09'),
('daily-theme', 'Theme Explorer', 'Try a new theme today', 'gold', '50', '2026-02-09'),
('daily-dice-5', 'Lucky Roller', 'Play 5 dice games today', 'xp', '100', '2026-02-09');
