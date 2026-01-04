/**
 * Game Authorization Middleware
 * Provides reusable authorization checks for game-related routes
 */

import type { Request, Response, NextFunction } from 'express';
import type { GameState as ApiGameState } from '@upship/api';
import { ForbiddenError, NotFoundError, NotYourTurnError } from '../errors';
import { pool } from '../db';

// Use require for CommonJS compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gameStateService = require('../services/gameStateService');

// Game player row from database
interface GamePlayerRow {
  game_id: string;
  user_id: string;
  faction: string | null;
  status: string;
  host_id: string;
  [key: string]: unknown;
}

// Game state wrapper from service
interface GameStateWrapper {
  id: number;
  gameId: string;
  version: number;
  state: ApiGameState;
  [key: string]: unknown;
}

// Extended request type for middleware that adds properties
type GameAuthRequest = Request & {
  session: { userId: string };
  gamePlayer?: GamePlayerRow;
  gameState?: GameStateWrapper;
};

/**
 * Verify user is a player in the specified game
 * Attaches gamePlayer info to req.gamePlayer
 *
 * @example
 * router.get('/:gameId', requireGamePlayer, asyncHandler(async (req, res) => {
 *   // req.gamePlayer contains the player's game_players row
 * }));
 */
export async function requireGamePlayer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as GameAuthRequest;
  const { gameId } = req.params;
  const userId = authReq.session.userId;

  if (!gameId) {
    next(new ForbiddenError('Game ID is required'));
    return;
  }

  try {
    const result = await pool.query<GamePlayerRow>(`
      SELECT gp.*, g.status, g.host_id
      FROM game_players gp
      JOIN games g ON g.id = gp.game_id
      WHERE gp.game_id = $1 AND gp.user_id = $2
    `, [gameId, userId]);

    if (result.rows.length === 0) {
      next(new ForbiddenError('Not a player in this game'));
      return;
    }

    authReq.gamePlayer = result.rows[0];
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
export async function requireGameHost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as GameAuthRequest;

  if (!authReq.gamePlayer) {
    next(new Error('requireGameHost must be used after requireGamePlayer'));
    return;
  }

  if (authReq.gamePlayer.host_id !== authReq.session.userId) {
    next(new ForbiddenError('Only the host can perform this action'));
    return;
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
export async function requirePlayerTurn(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as GameAuthRequest;
  const { gameId } = req.params;
  const userId = authReq.session.userId;

  try {
    const gameState = await gameStateService.getGameState(gameId) as GameStateWrapper | null;

    if (!gameState) {
      next(new NotFoundError('Game'));
      return;
    }

    const state = gameState.state;

    // Determine current player based on phase
    let currentPlayerId: string | undefined;
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
      next(new NotYourTurnError());
      return;
    }

    authReq.gameState = gameState;
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
export async function loadGameState(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as GameAuthRequest;
  const { gameId } = req.params;

  try {
    const gameState = await gameStateService.getGameState(gameId) as GameStateWrapper | null;

    if (!gameState) {
      next(new NotFoundError('Game state'));
      return;
    }

    authReq.gameState = gameState;
    next();
  } catch (error) {
    next(error);
  }
}

// CommonJS compatibility
module.exports = {
  requireGamePlayer,
  requireGameHost,
  requirePlayerTurn,
  loadGameState
};
