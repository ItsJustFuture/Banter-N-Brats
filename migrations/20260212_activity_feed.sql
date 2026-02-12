-- Activity Feed / Social Stream
CREATE TABLE IF NOT EXISTS activity_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- level_up|badge_earned|chess_win|theme_unlock|friendship_anniversary
  activity_data TEXT, -- JSON
  created_at INTEGER NOT NULL,
  is_public INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(username);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);
