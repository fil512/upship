/**
 * Game State Routes
 * HTTP handlers for game state API endpoints
 * Business logic has been extracted to services for better separation of concerns
 */

import type { Request, Response, NextFunction, Router, Application } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import type { GameState, PlayerState, Ship } from '@upship/api';

const express = require('express');
const router: Router = express.Router();
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
const { checkAndExecuteBotMoves } = require('../services/botExecutor');

// Extended request with session and app
interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId: string;
  };
  app: Application & {
    get(name: 'io'): SocketIOServer | undefined;
  };
}

// Game state wrapper
interface GameStateWrapper {
  state: GameState & {
    workerPlacement?: {
      currentPlacerIndex?: number;
      placementOrder?: string[];
    };
    ageTransitionDesignBureau?: {
      currentPlayerIndex?: number;
    };
    groundBoard?: {
      placements?: Record<string, unknown>;
    };
    log?: Array<{ timestamp: string; message: string; type?: string }>;
  };
  version: number;
}

// Extended player state
type ExtendedPlayerState = PlayerState & {
  techCards?: string[];
};

// Game action data
interface ActionData {
  [key: string]: unknown;
}

// Action request body
interface ActionRequestBody {
  actionType?: string;
  actionData?: ActionData;
}

// Undo result
interface UndoResult {
  newState: GameState;
  undoneAction: string;
}

// Undo info
interface UndoInfo {
  canUndo: boolean;
  lastAction?: string;
}

// All game state routes require authentication
router.use(requireAuth);

// Get game state
router.get('/:gameId', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { gameId } = req.params;
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    // Filter state to only show what this player should see
    const filteredState = filterStateForPlayer(gameState.state, authReq.session.userId);

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
router.get('/:gameId/upgrades', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { gameId } = req.params;
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    const playerState = gameState.state.players[authReq.session.userId] as ExtendedPlayerState | undefined;
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
router.get('/:gameId/ground-board', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

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
router.get('/:gameId/actions', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const actions = await gameStateService.getGameActions(gameId, limit);
    res.json({ actions });
  } catch (error) {
    next(error);
  }
});

// Get full game log (lazy-loaded by UI)
router.get('/:gameId/log', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameId } = req.params;
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game state');
    }

    // Return full log - not filtered since log is public information
    res.json({
      log: gameState.state.log || [],
      count: (gameState.state.log || []).length
    });
  } catch (error) {
    next(error);
  }
});

// Get undo info for UI
router.get('/:gameId/undo-info', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { gameId } = req.params;
    const userId = authReq.session.userId;

    const undoInfo: UndoInfo = await getUndoInfo(gameId, userId);
    res.json(undoInfo);
  } catch (error) {
    next(error);
  }
});

// Perform a game action
router.post('/:gameId/action', requireGamePlayer, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { gameId } = req.params;
    const { actionType, actionData } = req.body as ActionRequestBody;

    if (!actionType) {
      throw new ValidationError('Action type is required');
    }

    // Get current game state
    const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

    if (!gameState) {
      throw new NotFoundError('Game');
    }

    const state = gameState.state;
    const effectiveUserId = authReq.session.userId;

    // Verify it's this player's turn
    // - Worker placement: use workerPlacement.currentPlacerIndex
    // - Reveal phase: all players can act (simultaneous)
    // - Other phases: use currentPlayerIndex
    let currentPlayerId: string;
    let skipTurnCheck = false;

    if (state.phase === 'worker_placement' && state.workerPlacement?.placementOrder) {
      const wpIndex = state.workerPlacement.currentPlacerIndex || 0;
      currentPlayerId = state.workerPlacement.placementOrder[wpIndex];
    } else if (state.phase === 'reveal') {
      // Reveal phase allows all players to act simultaneously
      skipTurnCheck = true;
      currentPlayerId = effectiveUserId;
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
      const hasAwaitingHazard = playerState?.ships?.some((s: Ship) => s.status === 'awaiting_hazard');
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
      const undoResult: UndoResult = await executeUndo(gameId, effectiveUserId);
      const undoInfo: UndoInfo = await getUndoInfo(gameId, effectiveUserId);

      // Broadcast undo to all connected players via Socket.io
      const io = authReq.app.get('io');
      if (io) {
        broadcastStateUpdate(io, gameId, undoResult.newState, gameState.version + 1, 'UNDO');
      }

      res.json({
        success: true,
        undoneAction: undoResult.undoneAction,
        undoInfo,
        gameState: {
          ...gameState,
          state: filterStateForPlayer(undoResult.newState, effectiveUserId)
        }
      });
      return;
    }

    // Process the action using the extracted service
    const result = processAction(state, effectiveUserId, actionType, actionData);

    if (result.error) {
      throw new ValidationError(result.error);
    }

    // Save the new state with optimistic locking
    // Pass the version we read to ensure no concurrent modifications occurred
    const newState = await gameStateService.updateGameState(
      gameId,
      result.newState,
      {
        playerId: effectiveUserId,
        type: actionType,
        data: actionData
      },
      gameState.version  // Expected version for optimistic locking
    );

    // Broadcast state update to all connected players via Socket.io
    const io = authReq.app.get('io');
    if (io) {
      broadcastStateUpdate(io, gameId, newState, newState.version || 1, actionType);

      // Check if next player is a bot and execute their moves
      // Run async to not block the response
      setImmediate(() => {
        checkAndExecuteBotMoves(io, gameId).catch((err: Error) => {
          console.error('Bot execution error:', err);
        });
      });
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

export default router;

// CommonJS compatibility
module.exports = router;
