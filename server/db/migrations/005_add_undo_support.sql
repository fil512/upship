-- Migration: Add UNDO support
-- Enables single-action undo with commit points for hidden info reveals

-- Add columns to game_actions for tracking undo state
ALTER TABLE game_actions
ADD COLUMN is_undone BOOLEAN DEFAULT FALSE,
ADD COLUMN creates_commit_point BOOLEAN DEFAULT FALSE,
ADD COLUMN previous_state JSONB;

-- Add commit point tracking to game_states
ALTER TABLE game_states
ADD COLUMN commit_point_version INTEGER DEFAULT 0;

-- Index for efficient undo queries (find latest undoable action by player)
CREATE INDEX idx_game_actions_undo_lookup
ON game_actions (game_id, player_id, state_version DESC)
WHERE is_undone = FALSE;

-- Comments for documentation
COMMENT ON COLUMN game_actions.is_undone IS
  'TRUE if this action has been undone; soft delete for audit trail';

COMMENT ON COLUMN game_actions.creates_commit_point IS
  'TRUE if this action revealed hidden information (hazard draw, weather peek)';

COMMENT ON COLUMN game_actions.previous_state IS
  'Complete state snapshot before this action for instant undo restore';

COMMENT ON COLUMN game_states.commit_point_version IS
  'State version of last commit point; cannot undo actions at or before this version';
