/**
 * Game State Routes
 * HTTP handlers for game state API endpoints
 * Business logic has been extracted to services for better separation of concerns
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const gameStateService = require('../services/gameStateService');
const { pool } = require('../db');
const {
  UPGRADES,
  TECHNOLOGIES,
  getAvailableUpgrades
} = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS
} = require('../data/groundBoard');

// Import refactored services
const { filterStateForPlayer } = require('../services/gameStateHelpers');
const { processAction } = require('../services/actionProcessorService');

// All game state routes require authentication
router.use(requireAuth);

// Get game state
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
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
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
});

// Get available upgrades for a player
router.get('/:gameId/upgrades', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    const playerState = gameState.state.players[req.session.userId];
    if (!playerState) {
      return res.status(404).json({ error: 'Player state not found' });
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
    console.error('Get upgrades error:', error);
    res.status(500).json({ error: 'Failed to get upgrades' });
  }
});

// Get Ground Board data
router.get('/:gameId/ground-board', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    res.json({
      locations: GROUND_BOARD_LOCATIONS,
      symbols: SYMBOL_ICONS,
      placements: gameState.state.groundBoard?.placements || {}
    });
  } catch (error) {
    console.error('Get ground board error:', error);
    res.status(500).json({ error: 'Failed to get ground board' });
  }
});

// Get action history
router.get('/:gameId/actions', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is in this game
    const playerCheck = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, req.session.userId]
    );

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not a player in this game' });
    }

    const actions = await gameStateService.getGameActions(gameId, limit);
    res.json({ actions });
  } catch (error) {
    console.error('Get game actions error:', error);
    res.status(500).json({ error: 'Failed to get game actions' });
  }
});

// Perform a game action
router.post('/:gameId/action', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { actionType, actionData } = req.body;

    if (!actionType) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    // Get current game state
    const gameState = await gameStateService.getGameState(gameId);

    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
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
      return res.status(403).json({ error: 'Not your turn' });
    }

    // Process the action using the extracted service
    const result = processAction(state, req.session.userId, actionType, actionData);

    if (result.error) {
      return res.status(400).json({ error: result.error });
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
    console.error('Game action error:', error);
    res.status(500).json({ error: 'Failed to process action' });
  }
});

module.exports = router;
