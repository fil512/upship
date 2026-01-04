import type { Request, Response, NextFunction, Router } from 'express';

const express = require('express');
const router: Router = express.Router();
const gameService = require('../services/gameService');
const { ForbiddenError } = require('../errors');

// Middleware to restrict admin routes to non-production environments
function requireNonProduction(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'production') {
    next(new ForbiddenError('This operation is not allowed in production'));
    return;
  }
  next();
}

// Drop all game data (dev/test only)
// DELETE /api/admin/games
router.delete('/games', requireNonProduction, async (req: Request, res: Response, next: NextFunction) => {
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

export default router;

// CommonJS compatibility
module.exports = router;
