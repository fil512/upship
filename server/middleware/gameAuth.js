/**
 * Game Authorization Middleware
 * Provides reusable authorization checks for game-related routes
 */

const { pool } = require('../db');
const gameStateService = require('../services/gameStateService');
const { ForbiddenError, NotFoundError, NotYourTurnError } = require('../errors');

/**
 * Verify user is a player in the specified game
 * Attaches gamePlayer info to req.gamePlayer
 *
 * @example
 * router.get('/:gameId', requireGamePlayer, asyncHandler(async (req, res) => {
 *   // req.gamePlayer contains the player's game_players row
 * }));
 */
async function requireGamePlayer(req, res, next) {
  const { gameId } = req.params;
  const userId = req.session.userId;

  if (!gameId) {
    return next(new ForbiddenError('Game ID is required'));
  }

  try {
    const result = await pool.query(`
      SELECT gp.*, g.status, g.host_id
      FROM game_players gp
      JOIN games g ON g.id = gp.game_id
      WHERE gp.game_id = $1 AND gp.user_id = $2
    `, [gameId, userId]);

    if (result.rows.length === 0) {
      return next(new ForbiddenError('Not a player in this game'));
    }

    req.gamePlayer = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Verify user is the host of the specified game
 * Must be used after requireGamePlayer
 *
 * @example
 * router.post('/:gameId/start', requireGamePlayer, requireGameHost, asyncHandler(...));
 */
async function requireGameHost(req, res, next) {
  if (!req.gamePlayer) {
    return next(new Error('requireGameHost must be used after requireGamePlayer'));
  }

  if (req.gamePlayer.host_id !== req.session.userId) {
    return next(new ForbiddenError('Only the host can perform this action'));
  }

  next();
}

/**
 * Verify it's the player's turn to act
 * Attaches gameState to req.gameState
 *
 * Handles different turn logic based on game phase:
 * - worker_placement: Uses workerPlacement.currentPlacerIndex
 * - reveal: All players can act simultaneously
 * - income_cleanup: Uses currentPlayerIndex
 *
 * @example
 * router.post('/:gameId/action', requirePlayerTurn, asyncHandler(async (req, res) => {
 *   // req.gameState contains the current game state
 * }));
 */
async function requirePlayerTurn(req, res, next) {
  const { gameId } = req.params;
  const userId = req.session.userId;

  try {
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return next(new NotFoundError('Game'));
    }

    const state = gameState.state;

    // Determine current player based on phase
    let currentPlayerId;
    let skipTurnCheck = false;

    if (state.phase === 'worker_placement' && state.workerPlacement?.placementOrder) {
      const wpIndex = state.workerPlacement.currentPlacerIndex || 0;
      currentPlayerId = state.workerPlacement.placementOrder[wpIndex];
    } else if (state.phase === 'reveal') {
      // Reveal phase allows all players to act simultaneously
      skipTurnCheck = true;
    } else {
      currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    }

    if (!skipTurnCheck && currentPlayerId !== userId) {
      return next(new NotYourTurnError());
    }

    req.gameState = gameState;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Load game state without turn verification
 * Useful for read-only operations that don't require turn check
 *
 * @example
 * router.get('/:gameId', loadGameState, asyncHandler(async (req, res) => {
 *   // req.gameState contains the current game state
 * }));
 */
async function loadGameState(req, res, next) {
  const { gameId } = req.params;

  try {
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return next(new NotFoundError('Game state'));
    }

    req.gameState = gameState;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireGamePlayer,
  requireGameHost,
  requirePlayerTurn,
  loadGameState
};
