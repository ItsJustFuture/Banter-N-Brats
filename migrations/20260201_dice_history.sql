-- Dice roll history tracking
CREATE TABLE IF NOT EXISTS dice_rolls (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  result INTEGER NOT NULL,
  breakdown_json TEXT,
  delta_gold INTEGER NOT NULL,
  outcome TEXT NOT NULL,
  is_jackpot BOOLEAN NOT NULL DEFAULT FALSE,
  rolled_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dice_rolls_user ON dice_rolls(user_id, rolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_jackpot ON dice_rolls(is_jackpot, rolled_at DESC);

-- Add dice statistics columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS dice_total_rolls INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dice_total_won INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dice_biggest_win INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dice_win_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dice_current_streak INTEGER NOT NULL DEFAULT 0;
