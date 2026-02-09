-- Role symbol customization storage
CREATE TABLE IF NOT EXISTS user_role_symbols (
  username TEXT PRIMARY KEY,
  vip_gemstone TEXT DEFAULT 'diamond',
  vip_color_variant TEXT DEFAULT 'blue',
  moderator_gemstone TEXT DEFAULT 'onyx',
  moderator_color_variant TEXT DEFAULT 'blue',
  enable_animations INTEGER NOT NULL DEFAULT 1,
  updated_at BIGINT NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX IF NOT EXISTS idx_role_symbols_username ON user_role_symbols(username);
