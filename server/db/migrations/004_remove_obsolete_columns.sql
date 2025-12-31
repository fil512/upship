-- Remove obsolete columns that are never used in the codebase

-- users.email - never referenced anywhere
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- users.is_guest - no guest user feature implemented
ALTER TABLE users DROP COLUMN IF EXISTS is_guest;

-- game_players.is_ready - games start without ready checks
ALTER TABLE game_players DROP COLUMN IF EXISTS is_ready;

-- DOWN

-- Rollback: restore the dropped columns
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
