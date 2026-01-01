const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');
const { ForbiddenError } = require('../errors');

// Middleware to restrict admin routes to non-production environments
function requireNonProduction(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next(new ForbiddenError('This operation is not allowed in production'));
  }
  next();
}

// Drop all game data (dev/test only)
// DELETE /api/admin/games
router.delete('/games', requireNonProduction, async (req, res, next) => {
  try {
    const result = await gameService.dropAllGames();
    res.json({
      success: true,
      message: 'All game data has been deleted',
      deleted: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
