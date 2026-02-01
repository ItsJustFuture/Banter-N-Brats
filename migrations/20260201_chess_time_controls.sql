-- Chess time control support
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS time_control TEXT; -- 'blitz', 'rapid', 'classical', null for untimed
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER; -- Total time per player
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS time_increment_seconds INTEGER; -- Increment per move
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS white_time_remaining INTEGER; -- Milliseconds
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS black_time_remaining INTEGER; -- Milliseconds
ALTER TABLE chess_games ADD COLUMN IF NOT EXISTS last_move_color TEXT; -- 'white' or 'black'

-- Add time control stats to user stats
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS blitz_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS rapid_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS classical_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS blitz_games INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS rapid_games INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chess_user_stats ADD COLUMN IF NOT EXISTS classical_games INTEGER NOT NULL DEFAULT 0;
