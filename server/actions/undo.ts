/**
 * Undo Action Support
 *
 * Provides single-action undo with commit points for hidden information reveals.
 * Commit points prevent undo beyond the point where hidden info was revealed.
 */

import type { GameState } from '@upship/api';

const { pool } = require('../db');
const { GameRuleError } = require('../errors');

/**
 * Actions that reveal hidden information and create commit points.
 * Once any of these occur, player cannot undo past this point.
 */
const COMMIT_POINT_ACTION_TYPES = new Set<string>([
  // These action types always create commit points
  'DISCARD_HAZARD',  // Weather Bureau - discards peeked hazard
]);

/**
 * Actions that should NOT be undoable
 */
const NON_UNDOABLE_ACTIONS = new Set<string>([
  'END_TURN',
  'REVEAL',  // Ends worker placement round
  'UNDO',    // Cannot undo an undo
  'CALCULATE_SCORES',
]);

interface ActionData {
  locationId?: string;
  [key: string]: unknown;
}

interface StateChanges {
  [key: string]: unknown;
}

/**
 * Check if an action creates a commit point (reveals hidden info or phase transition)
 */
function createsCommitPoint(actionType: string, actionData: ActionData = {}, _stateChanges: StateChanges = {}): boolean {
  // Explicit commit point action types
  if (COMMIT_POINT_ACTION_TYPES.has(actionType)) {
    return true;
  }

  // Phase transitions create commit points - prevents undoing across phases
  // REVEAL transitions from worker_placement to reveal phase
  // END_TURN during reveal transitions to cleanup (now auto-advances)
  if (actionType === 'REVEAL' || actionType === 'END_TURN') {
    return true;
  }

  // LAUNCH_SHIP creates commit point because hazard card is drawn
  if (actionType === 'LAUNCH_SHIP') {
    return true;
  }

  // RESPOND_TO_HAZARD creates commit point (outcome is now known)
  if (actionType === 'RESPOND_TO_HAZARD') {
    return true;
  }

  // PLACE_AGENT at weather_bureau peeks at hazard deck
  if (actionType === 'PLACE_AGENT' && actionData.locationId === 'weather-bureau') {
    return true;
  }

  return false;
}

/**
 * Check if an action can be undone
 */
function isUndoable(actionType: string): boolean {
  return !NON_UNDOABLE_ACTIONS.has(actionType);
}

interface ActionRow {
  id: string;
  action_type: string;
  action_data: unknown;
  previous_state: GameState;
  state_version: number;
}

interface CountRow {
  count: string;
}

/**
 * Get the last undoable action for a player in a game
 */
async function getLastUndoableAction(gameId: string, userId: string): Promise<ActionRow | null> {
  const result = await pool.query(
    `SELECT ga.id, ga.action_type, ga.action_data, ga.previous_state, ga.state_version
     FROM game_actions ga
     JOIN game_states gs ON gs.game_id = ga.game_id
     WHERE ga.game_id = $1
       AND ga.player_id = $2
       AND ga.is_undone = FALSE
       AND ga.state_version > gs.commit_point_version
       AND ga.action_type NOT IN ('END_TURN', 'REVEAL', 'UNDO', 'CALCULATE_SCORES')
       AND ga.previous_state IS NOT NULL
     ORDER BY ga.state_version DESC
     LIMIT 1`,
    [gameId, userId]
  ) as { rows: ActionRow[] };

  return result.rows[0] || null;
}

/**
 * Get count of undoable actions for a player
 */
async function getUndoCount(gameId: string, userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM game_actions ga
     JOIN game_states gs ON gs.game_id = ga.game_id
     WHERE ga.game_id = $1
       AND ga.player_id = $2
       AND ga.is_undone = FALSE
       AND ga.state_version > gs.commit_point_version
       AND ga.action_type NOT IN ('END_TURN', 'REVEAL', 'UNDO', 'CALCULATE_SCORES')
       AND ga.previous_state IS NOT NULL`,
    [gameId, userId]
  ) as { rows: CountRow[] };

  return parseInt(result.rows[0].count, 10);
}

interface UndoResult {
  success: boolean;
  undoneAction: string;
  newState: GameState;
}

/**
 * Execute undo of the last action
 */
async function executeUndo(gameId: string, userId: string): Promise<UndoResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock game state
    const stateResult = await client.query(
      `SELECT state, version, commit_point_version
       FROM game_states
       WHERE game_id = $1
       FOR UPDATE`,
      [gameId]
    ) as { rows: { state: GameState; version: number; commit_point_version: number }[] };

    if (stateResult.rows.length === 0) {
      throw new GameRuleError('Game not found');
    }

    const { version, commit_point_version } = stateResult.rows[0];

    // Find last undoable action
    const actionResult = await client.query(
      `SELECT id, action_type, previous_state, state_version
       FROM game_actions
       WHERE game_id = $1
         AND player_id = $2
         AND is_undone = FALSE
         AND state_version > $3
         AND action_type NOT IN ('END_TURN', 'REVEAL', 'UNDO', 'CALCULATE_SCORES')
         AND previous_state IS NOT NULL
       ORDER BY state_version DESC
       LIMIT 1`,
      [gameId, userId, commit_point_version]
    ) as { rows: ActionRow[] };

    if (actionResult.rows.length === 0) {
      throw new GameRuleError('No actions available to undo');
    }

    const actionToUndo = actionResult.rows[0];

    // Mark action as undone (soft delete for audit trail)
    await client.query(
      `UPDATE game_actions SET is_undone = TRUE WHERE id = $1`,
      [actionToUndo.id]
    );

    // Restore previous state (increment version to maintain monotonic history)
    const newVersion = version + 1;
    const previousState = actionToUndo.previous_state;

    await client.query(
      `UPDATE game_states
       SET state = $1, version = $2,
           current_player_id = $3, phase = $4,
           turn_number = $5, age = $6,
           updated_at = NOW()
       WHERE game_id = $7`,
      [
        JSON.stringify(previousState),
        newVersion,
        previousState.playerOrder[previousState.currentPlayerIndex],
        previousState.phase,
        (previousState as GameState & { turn?: number }).turn,
        previousState.age,
        gameId
      ]
    );

    // Log the undo action itself (no previous_state for undo - can't undo an undo)
    await client.query(
      `INSERT INTO game_actions (game_id, player_id, action_type, action_data, state_version, is_undone, creates_commit_point)
       VALUES ($1, $2, 'UNDO', $3, $4, FALSE, FALSE)`,
      [gameId, userId, JSON.stringify({ undoneActionId: actionToUndo.id, undoneActionType: actionToUndo.action_type }), newVersion]
    );

    await client.query('COMMIT');

    return {
      success: true,
      undoneAction: actionToUndo.action_type,
      newState: previousState
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

interface UndoInfo {
  canUndo: boolean;
  undoCount: number;
  lastActionType: string | null;
}

/**
 * Get undo info for UI display
 */
async function getUndoInfo(gameId: string, userId: string): Promise<UndoInfo> {
  const lastAction = await getLastUndoableAction(gameId, userId);
  const undoCount = await getUndoCount(gameId, userId);

  return {
    canUndo: undoCount > 0,
    undoCount,
    lastActionType: lastAction?.action_type || null
  };
}

export {
  createsCommitPoint,
  isUndoable,
  getLastUndoableAction,
  getUndoCount,
  executeUndo,
  getUndoInfo,
  COMMIT_POINT_ACTION_TYPES,
  NON_UNDOABLE_ACTIONS
};

// CommonJS compatibility
module.exports = {
  createsCommitPoint,
  isUndoable,
  getLastUndoableAction,
  getUndoCount,
  executeUndo,
  getUndoInfo,
  COMMIT_POINT_ACTION_TYPES,
  NON_UNDOABLE_ACTIONS
};
