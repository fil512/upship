const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const gameService = require('../services/gameService');
const gameStateService = require('../services/gameStateService');
const { broadcastLobbyUpdate, broadcastGameStarted } = require('../socket');
const { NotFoundError, ValidationError } = require('../errors');

// All game routes require authentication
router.use(requireAuth);

// List games (with optional status filter)
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status || 'waiting',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    const games = await gameService.getGames(filters);
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Get my games
router.get('/mine', async (req, res, next) => {
  try {
    const games = await gameService.getUserGames(req.session.userId);
    res.json({ games });
  } catch (error) {
    next(error);
  }
});

// Get single game
router.get('/:id', async (req, res, next) => {
  try {
    const game = await gameService.getGameById(req.params.id);
    if (!game) {
      throw new NotFoundError('Game');
    }
    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Create game
router.post('/', async (req, res, next) => {
  try {
    const { name, settings } = req.body;

    if (!name || name.trim().length === 0) {
      throw new ValidationError('Game name is required');
    }

    if (name.length > 100) {
      throw new ValidationError('Game name must be 100 characters or less');
    }

    // SECURITY: Validate game settings to prevent invalid configurations
    const validatedSettings = { ...settings };
    if (validatedSettings.minPlayers !== undefined) {
      const minPlayers = parseInt(validatedSettings.minPlayers, 10);
      if (isNaN(minPlayers) || minPlayers < 2 || minPlayers > 4) {
        throw new ValidationError('Minimum players must be between 2 and 4');
      }
      validatedSettings.minPlayers = minPlayers;
    }
    if (validatedSettings.maxPlayers !== undefined) {
      const maxPlayers = parseInt(validatedSettings.maxPlayers, 10);
      if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
        throw new ValidationError('Maximum players must be between 2 and 4');
      }
      validatedSettings.maxPlayers = maxPlayers;
    }
    // Ensure min <= max
    if (validatedSettings.minPlayers && validatedSettings.maxPlayers &&
        validatedSettings.minPlayers > validatedSettings.maxPlayers) {
      throw new ValidationError('Minimum players cannot exceed maximum players');
    }

    const game = await gameService.createGame(req.session.userId, name.trim(), validatedSettings);
    res.status(201).json({ game });
  } catch (error) {
    next(error);
  }
});

// Join game (optionally with faction selection)
router.post('/:id/join', async (req, res, next) => {
  try {
    const { faction } = req.body;
    const validFactions = ['germany', 'britain', 'usa', 'italy'];

    // Validate faction if provided
    if (faction && !validFactions.includes(faction)) {
      throw new ValidationError('Invalid faction. Must be: germany, britain, usa, or italy');
    }

    const game = await gameService.joinGame(req.params.id, req.session.userId, faction);

    // Broadcast lobby update to waiting players
    const io = req.app.get('io');
    if (io) {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Leave game
router.post('/:id/leave', async (req, res, next) => {
  try {
    const game = await gameService.leaveGame(req.params.id, req.session.userId);

    // Broadcast lobby update to remaining players
    const io = req.app.get('io');
    if (io && game.status === 'waiting') {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Select faction
router.post('/:id/faction', async (req, res, next) => {
  try {
    const { faction } = req.body;
    const validFactions = ['germany', 'britain', 'usa', 'italy'];

    if (!faction || !validFactions.includes(faction)) {
      throw new ValidationError('Invalid faction. Must be: germany, britain, usa, or italy');
    }

    const game = await gameService.selectFaction(req.params.id, req.session.userId, faction);

    // Broadcast lobby update to waiting players
    const io = req.app.get('io');
    if (io) {
      broadcastLobbyUpdate(io, req.params.id, game);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

// Start game (host only)
router.post('/:id/start', async (req, res, next) => {
  try {
    const game = await gameService.startGame(req.params.id, req.session.userId);

    // Get the initial game state to broadcast
    const gameState = await gameStateService.getGameState(req.params.id);

    // Broadcast game-started to all waiting players
    const io = req.app.get('io');
    if (io && gameState) {
      broadcastGameStarted(io, req.params.id, gameState.state);
    }

    res.json({ game });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
