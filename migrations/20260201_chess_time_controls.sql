-- Chess time control support
ALTER TABLE chess_games ADD COLUMN time_control TEXT; -- 'blitz', 'rapid', 'classical', null for untimed
ALTER TABLE chess_games ADD COLUMN time_limit_seconds INTEGER; -- Total time per player
ALTER TABLE chess_games ADD COLUMN time_increment_seconds INTEGER; -- Increment per move
ALTER TABLE chess_games ADD COLUMN white_time_remaining INTEGER; -- Milliseconds
ALTER TABLE chess_games ADD COLUMN black_time_remaining INTEGER; -- Milliseconds
ALTER TABLE chess_games ADD COLUMN last_move_color TEXT; -- 'w' or 'b' (white/black)

-- Add time control stats to user stats
ALTER TABLE chess_user_stats ADD COLUMN blitz_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN rapid_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN classical_elo INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE chess_user_stats ADD COLUMN blitz_games INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chess_user_stats ADD COLUMN rapid_games INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chess_user_stats ADD COLUMN classical_games INTEGER NOT NULL DEFAULT 0;
