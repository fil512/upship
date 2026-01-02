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
  TECH_TILES,
  TECH_CARDS,
  getAvailableTechTiles
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
const { processAction } = require('../actions');
const { executeUndo, getUndoInfo } = require('../actions/undo');
const { broadcastStateUpdate } = require('../socket');

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

    // In dev mode with devMode query param, return full unfiltered state for player switching
    const isDev = process.env.NODE_ENV !== 'production';
    const devModeRequested = req.query.devMode === 'true';

    // Filter state to only show what this player should see (unless dev mode)
    const filteredState = (isDev && devModeRequested)
      ? gameState.state
      : filterStateForPlayer(gameState.state, req.session.userId);

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

    // Get available tech tiles based on owned tech cards
    const available = getAvailableTechTiles(
      playerState.techCards,
      gameState.state.age
    );

    // Get all tech tile and card definitions for reference
    res.json({
      available,
      allTechTiles: TECH_TILES,
      allTechCards: TECH_CARDS
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

// Get undo info for UI
router.get('/:gameId/undo-info', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const userId = req.session.userId;

    const undoInfo = await getUndoInfo(gameId, userId);
    res.json(undoInfo);
  } catch (error) {
    next(error);
  }
});

// Perform a game action
router.post('/:gameId/action', requireGamePlayer, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { actionType, actionData, asUserId } = req.body;

    if (!actionType) {
      throw new ValidationError('Action type is required');
    }

    // Get current game state
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game');
    }

    const state = gameState.state;

    // Dev mode impersonation: allow asUserId to override session userId
    // Only allowed in non-production environment
    const isDev = process.env.NODE_ENV !== 'production';
    let effectiveUserId = req.session.userId;

    if (isDev && asUserId && state.players[asUserId]) {
      // In dev mode, allow impersonating any player in the game
      effectiveUserId = asUserId;
    }

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
    } else if (state.phase === 'age_transition_design_bureau' && state.ageTransitionDesignBureau) {
      // Age transition phase uses its own player index
      const transitionIndex = state.ageTransitionDesignBureau.currentPlayerIndex || 0;
      currentPlayerId = state.playerOrder[transitionIndex];
    } else {
      currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    }

    // Special case: RESPOND_TO_HAZARD is allowed if the player has a ship awaiting hazard
    if (actionType === 'RESPOND_TO_HAZARD') {
      const playerState = state.players[effectiveUserId];
      const hasAwaitingHazard = playerState?.ships?.some(s => s.status === 'awaiting_hazard');
      if (hasAwaitingHazard) {
        skipTurnCheck = true;
      }
    }

    // Special case: UNDO is allowed if it's your turn or in reveal phase
    if (actionType === 'UNDO') {
      skipTurnCheck = true;  // Undo checks are handled by executeUndo
    }

    if (!skipTurnCheck && currentPlayerId !== effectiveUserId) {
      throw new ForbiddenError('Not your turn');
    }

    // Special handling for UNDO - bypasses normal action processing
    if (actionType === 'UNDO') {
      const undoResult = await executeUndo(gameId, effectiveUserId);
      const undoInfo = await getUndoInfo(gameId, effectiveUserId);

      // Broadcast undo to all connected players via Socket.io
      const io = req.app.get('io');
      if (io) {
        broadcastStateUpdate(io, gameId, undoResult.newState, gameState.version + 1, 'UNDO');
      }

      return res.json({
        success: true,
        undoneAction: undoResult.undoneAction,
        undoInfo,
        gameState: {
          ...gameState,
          state: filterStateForPlayer(undoResult.newState, effectiveUserId)
        }
      });
    }

    // Process the action using the extracted service
    const result = processAction(state, effectiveUserId, actionType, actionData);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    // Save the new state
    const newState = await gameStateService.updateGameState(gameId, result.newState, {
      playerId: effectiveUserId,
      type: actionType,
      data: actionData
    });

    // Broadcast state update to all connected players via Socket.io
    const io = req.app.get('io');
    if (io) {
      broadcastStateUpdate(io, gameId, newState, newState.version || 1, actionType);
    }

    res.json({
      success: true,
      isCommitPoint: newState.isCommitPoint || false,
      gameState: {
        ...gameState,
        state: filterStateForPlayer(newState, effectiveUserId)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
