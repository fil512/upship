/**
 * Game Access Middleware
 * Authorization checks for game-related routes
 */

import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../errors';

// Use require for CommonJS compatibility
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gameService = require('../services/gameService');

// Game interface from gameService
interface Game {
  id: string;
  host_id: string;
  status: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Middleware that requires the authenticated user to be a player in the game
 * Expects :gameId parameter in route
 *
 * Usage: router.get('/:gameId', requireGamePlayer, handler)
 */
export async function requireGamePlayer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const session = (req as Request & { session: { userId: string } }).session;
    const userId = session.userId;

    if (!gameId) {
      next(new ForbiddenError('Game ID required'));
      return;
    }

    const isPlayer = await gameService.isPlayerInGame(gameId, userId);

    if (!isPlayer) {
      next(new ForbiddenError('Not a player in this game'));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that requires the user to be the host of the game
 * Expects :gameId parameter in route
 */
export async function requireGameHost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const session = (req as Request & { session: { userId: string } }).session;
    const userId = session.userId;

    if (!gameId) {
      next(new ForbiddenError('Game ID required'));
      return;
    }

    const game = await gameService.getGameById(gameId) as Game | null;

    if (!game) {
      next(new NotFoundError('Game'));
      return;
    }

    if (game.host_id !== userId) {
      next(new ForbiddenError('Only the host can perform this action'));
      return;
    }

    // Attach game to request for use in handler
    (req as Request & { game: Game }).game = game;
    next();
  } catch (error) {
    next(error);
  }
}

// CommonJS compatibility
module.exports = {
  requireGamePlayer,
  requireGameHost
};
