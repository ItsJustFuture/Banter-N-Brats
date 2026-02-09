CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  UNIQUE(username, badge_id)
);

CREATE TABLE IF NOT EXISTS badge_definitions (
  badge_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  rarity TEXT,
  category TEXT,
  conditions_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_badges_username ON user_badges(username);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_username_nocase ON user_badges(username COLLATE NOCASE);

-- Insert initial badge definitions
INSERT OR IGNORE INTO badge_definitions (badge_id, name, description, emoji, rarity, category) VALUES
('anniversary-1y', '1 Year Anniversary', 'Member for 1 year', '🎂', 'rare', 'milestone'),
('chatterbox', 'Chatterbox', 'Sent 10,000 messages', '💬', 'rare', 'achievement'),
('lucky-streak', 'Lucky Streak', 'Won 10 dice rolls in a row', '🎲', 'epic', 'achievement'),
('vip-member', 'VIP Member', 'Has VIP status', '👑', 'rare', 'special'),
('theme-collector', 'Theme Collector', 'Unlocked 20+ themes', '🎨', 'epic', 'achievement'),
('chess-master', 'Chess Master', 'Chess ELO over 1800', '♟️', 'legendary', 'achievement'),
('lovebirds', 'Lovebirds', 'Coupled for 6+ months', '💝', 'rare', 'special');
