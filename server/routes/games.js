const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const gameService = require('../services/gameService');

// All game routes require authentication
router.use(requireAuth);

// List games (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'waiting',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    const games = await gameService.getGames(filters);
    res.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Get my games
router.get('/mine', async (req, res) => {
  try {
    const games = await gameService.getUserGames(req.session.userId);
    res.json({ games });
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({ error: 'Failed to get your games' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await gameService.getGameById(parseInt(req.params.id));
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// Create game
router.post('/', async (req, res) => {
  const { name, settings } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Game name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Game name must be 100 characters or less' });
  }

  try {
    const game = await gameService.createGame(req.session.userId, name.trim(), settings);
    res.status(201).json({ game });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join game
router.post('/:id/join', async (req, res) => {
  try {
    const game = await gameService.joinGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Join game error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Leave game
router.post('/:id/leave', async (req, res) => {
  try {
    const game = await gameService.leaveGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Leave game error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Select faction
router.post('/:id/faction', async (req, res) => {
  const { faction } = req.body;
  const validFactions = ['germany', 'britain', 'usa', 'italy'];

  if (!faction || !validFactions.includes(faction)) {
    return res.status(400).json({ error: 'Invalid faction. Must be: germany, britain, usa, or italy' });
  }

  try {
    const game = await gameService.selectFaction(parseInt(req.params.id), req.session.userId, faction);
    res.json({ game });
  } catch (error) {
    console.error('Select faction error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Faction already taken' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Start game (host only)
router.post('/:id/start', async (req, res) => {
  try {
    const game = await gameService.startGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
