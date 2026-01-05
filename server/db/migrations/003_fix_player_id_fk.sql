-- Remove player_id foreign key constraints for bot support
-- This is needed because player IDs can be either:
-- - user_id (UUID from users table) for human players
-- - game_players.id (UUID from game_players table) for bots
-- A FK constraint is not viable since both tables are referenced.

-- Drop the existing foreign key constraints
ALTER TABLE game_states DROP CONSTRAINT IF EXISTS game_states_current_player_id_fkey;
ALTER TABLE game_actions DROP CONSTRAINT IF EXISTS game_actions_player_id_fkey;

-- DOWN

-- Rollback: restore original users(id) references (will fail if bots exist)
ALTER TABLE game_states
  ADD CONSTRAINT game_states_current_player_id_fkey
  FOREIGN KEY (current_player_id) REFERENCES users(id);

ALTER TABLE game_actions
  ADD CONSTRAINT game_actions_player_id_fkey
  FOREIGN KEY (player_id) REFERENCES users(id);
