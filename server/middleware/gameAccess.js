/**
 * Game Access Middleware
 * Authorization checks for game-related routes
 */

const { ForbiddenError, NotFoundError } = require('../errors');
const gameService = require('../services/gameService');

/**
 * Middleware that requires the authenticated user to be a player in the game
 * Expects :gameId parameter in route
 *
 * Usage: router.get('/:gameId', requireGamePlayer, handler)
 */
async function requireGamePlayer(req, res, next) {
  try {
    const { gameId } = req.params;
    const userId = req.session.userId;

    if (!gameId) {
      return next(new ForbiddenError('Game ID required'));
    }

    const isPlayer = await gameService.isPlayerInGame(gameId, userId);

    if (!isPlayer) {
      return next(new ForbiddenError('Not a player in this game'));
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
async function requireGameHost(req, res, next) {
  try {
    const { gameId } = req.params;
    const userId = req.session.userId;

    if (!gameId) {
      return next(new ForbiddenError('Game ID required'));
    }

    const game = await gameService.getGameById(gameId);

    if (!game) {
      return next(new NotFoundError('Game'));
    }

    if (game.host_id !== userId) {
      return next(new ForbiddenError('Only the host can perform this action'));
    }

    // Attach game to request for use in handler
    req.game = game;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireGamePlayer,
  requireGameHost
};
