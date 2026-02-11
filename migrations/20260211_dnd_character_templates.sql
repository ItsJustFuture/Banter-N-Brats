-- DnD character templates for persistent characters across sessions
-- Allows users to save their character builds and reuse them in future games

CREATE TABLE IF NOT EXISTS dnd_character_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  race TEXT,
  gender TEXT,
  age INTEGER,
  background TEXT,
  traits TEXT,
  abilities TEXT,
  -- CORE attributes
  might INTEGER NOT NULL DEFAULT 3,
  finesse INTEGER NOT NULL DEFAULT 3,
  wit INTEGER NOT NULL DEFAULT 3,
  instinct INTEGER NOT NULL DEFAULT 3,
  presence INTEGER NOT NULL DEFAULT 3,
  resolve INTEGER NOT NULL DEFAULT 3,
  chaos INTEGER NOT NULL DEFAULT 3,
  -- Skills and perks
  skills_json TEXT,
  perks_json TEXT,
  -- Metadata
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  last_used_at BIGINT,
  UNIQUE(user_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_dnd_character_templates_user ON dnd_character_templates(user_id);
