-- Add missing columns and constraints for game lobby functionality
-- The games and game_players tables already exist from 001_initial_schema.sql

-- Add current_player_count column to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS current_player_count INTEGER NOT NULL DEFAULT 1;

-- Rename seat_position to player_order for clarity (if it exists)
-- First check if seat_position exists, then rename
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'seat_position') THEN
    ALTER TABLE game_players RENAME COLUMN seat_position TO player_order;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'player_order') THEN
    ALTER TABLE game_players ADD COLUMN player_order INTEGER;
  END IF;
END $$;

-- Update status constraint to include 'cancelled' (drop old, add new)
ALTER TABLE games DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE games ADD CONSTRAINT valid_status CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned', 'cancelled'));

-- DOWN
-- Rollback the changes
ALTER TABLE games DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE games ADD CONSTRAINT valid_status CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_players' AND column_name = 'player_order') THEN
    ALTER TABLE game_players RENAME COLUMN player_order TO seat_position;
  END IF;
END $$;

ALTER TABLE games DROP COLUMN IF EXISTS current_player_count;
