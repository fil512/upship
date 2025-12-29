/**
 * Game State Routes
 * HTTP handlers for game state API endpoints
 * Business logic has been extracted to services for better separation of concerns
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const { requireGamePlayer } = require('../middleware/gameAccess');
const gameStateService = require('../services/gameStateService');
const {
  UPGRADES,
  TECHNOLOGIES,
  getAvailableUpgrades
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS
} = require('../data/groundBoard');
const {
  NotFoundError,
  ForbiddenError,
  ValidationError
} = require('../errors');

// Import refactored services
const { filterStateForPlayer } = require('../services/gameStateHelpers');
const { processAction } = require('../services/actionProcessorService');

// All game state routes require authentication
router.use(requireAuth);

// Get game state
router.get('/:gameId', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    // Filter state to only show what this player should see
    const filteredState = filterStateForPlayer(gameState.state, req.session.userId);

    res.json({
      gameState: {
        ...gameState,
        state: filteredState
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get available upgrades for a player
router.get('/:gameId/upgrades', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    const playerState = gameState.state.players[req.session.userId];
    if (!playerState) {
      throw new NotFoundError('Player state');
    }

    // Get available upgrades based on owned technologies
    const available = getAvailableUpgrades(
      playerState.technologies,
      gameState.state.age
    );

    // Get all upgrade definitions for reference
    res.json({
      available,
      allUpgrades: UPGRADES,
      allTechnologies: TECHNOLOGIES
    });
  } catch (error) {
    next(error);
  }
});

// Get Ground Board data
router.get('/:gameId/ground-board', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    res.json({
      locations: GROUND_BOARD_LOCATIONS,
      symbols: SYMBOL_ICONS,
      placements: gameState.state.groundBoard?.placements || {}
    });
  } catch (error) {
    next(error);
  }
});

// Get action history
router.get('/:gameId/actions', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const actions = await gameStateService.getGameActions(gameId, limit);
    res.json({ actions });
  } catch (error) {
    next(error);
  }
});

// Perform a game action
router.post('/:gameId/action', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { actionType, actionData } = req.body;

    if (!actionType) {
      throw new ValidationError('Action type is required');
    }

    // Get current game state
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game');
    }

    const state = gameState.state;

    // Verify it's this player's turn
    // - Worker placement: use workerPlacement.currentPlacerIndex
    // - Reveal phase: all players can act (simultaneous)
    // - Other phases: use currentPlayerIndex
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

    if (!skipTurnCheck && currentPlayerId !== req.session.userId) {
      throw new ForbiddenError('Not your turn');
    }

    // Process the action using the extracted service
    const result = processAction(state, req.session.userId, actionType, actionData);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    // Save the new state
    const newState = await gameStateService.updateGameState(gameId, result.newState, {
      playerId: req.session.userId,
      type: actionType,
      data: actionData
    });

    res.json({
      success: true,
      gameState: {
        ...gameState,
        state: filterStateForPlayer(newState, req.session.userId)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
