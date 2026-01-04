-- Add bot support to game_players table
-- Bots are entries with is_bot=TRUE and user_id=NULL
-- Each bot has a thematic display name based on their faction

-- Add bot columns
ALTER TABLE game_players ADD COLUMN is_bot BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE game_players ADD COLUMN bot_name VARCHAR(50);

-- Add check constraint: bots must have a bot_name, humans must not
ALTER TABLE game_players ADD CONSTRAINT check_bot_name
  CHECK ((is_bot = TRUE AND bot_name IS NOT NULL) OR (is_bot = FALSE AND bot_name IS NULL));

-- Add check constraint: bots have NULL user_id, humans have non-NULL user_id
ALTER TABLE game_players ADD CONSTRAINT check_bot_user_id
  CHECK ((is_bot = TRUE AND user_id IS NULL) OR (is_bot = FALSE AND user_id IS NOT NULL));

-- Index for efficient bot lookups
CREATE INDEX idx_game_players_bots ON game_players(game_id) WHERE is_bot = TRUE;

-- DOWN

-- Rollback: remove bot columns and constraints
DROP INDEX IF EXISTS idx_game_players_bots;
ALTER TABLE game_players DROP CONSTRAINT IF EXISTS check_bot_user_id;
ALTER TABLE game_players DROP CONSTRAINT IF EXISTS check_bot_name;
ALTER TABLE game_players DROP COLUMN IF EXISTS bot_name;
ALTER TABLE game_players DROP COLUMN IF EXISTS is_bot;
