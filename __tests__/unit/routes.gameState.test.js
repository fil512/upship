const express = require('express');
const request = require('supertest');

// Mock dependencies before requiring anything
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock('../../server/services/gameService', () => ({
  isPlayerInGame: jest.fn()
}));

jest.mock('../../server/auth', () => ({
  requireAuth: (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  }
}));

jest.mock('../../server/services/gameStateService', () => ({
  getGameState: jest.fn(),
  updateGameState: jest.fn(),
  getGameActions: jest.fn(),
  FACTION_CONFIG: {
    germany: { startingTechCards: [], bannedTechCards: ['helium_handling'] },
    britain: { startingTechCards: [] },
    usa: { startingTechCards: ['helium_handling'] },
    italy: { startingTechCards: [] }
  }
}));

// Mock the extracted services
jest.mock('../../server/services/gameStateHelpers', () => ({
  filterStateForPlayer: jest.fn((state, playerId) => state),
  calculateTurnOrder: jest.fn(),
  getCurrentPlacer: jest.fn(),
  advanceToNextPlacer: jest.fn(),
  allPlayersPassed: jest.fn(),
  shuffleArray: jest.fn(arr => arr),
  transitionToRevealPhase: jest.fn(),
  transitionToIncomeCleanup: jest.fn(),
  startNewRound: jest.fn(),
  hasPlayableCards: jest.fn()
}));

jest.mock('../../server/services/actionProcessorService', () => ({
  processAction: jest.fn((state, playerId, actionType, data) => {
    // Default mock implementation that returns newState
    if (actionType === 'UNKNOWN_ACTION') {
      return { error: 'Unknown action type: UNKNOWN_ACTION' };
    }
    // Note: TAKE_LOAN removed from game - loans system eliminated
    if (actionType === 'PASS') {
      const newState = JSON.parse(JSON.stringify(state));
      newState.players[playerId].hasPassed = true;
      newState.workerPlacement.passedPlayers.push(playerId);
      return { newState };
    }
    if (actionType === 'RECALL_AGENTS') {
      const newState = JSON.parse(JSON.stringify(state));
      newState.groundBoard.placements = {};
      return { newState };
    }
    if (actionType === 'END_TURN') {
      if (state.phase === 'worker_placement') {
        return { error: 'Use PASS action during worker placement phase' };
      }
      const newState = JSON.parse(JSON.stringify(state));
      newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.playerOrder.length;
      return { newState };
    }
    return { newState: state };
  })
}));

const { pool } = require('../../server/db');
const gameService = require('../../server/services/gameService');
const gameStateService = require('../../server/services/gameStateService');
const gameStateRouter = require('../../server/routes/gameState');
const { errorHandler } = require('../../server/middleware/errorHandler');

function createApp(userId = 1) {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.session = { userId };
    next();
  });
  app.use('/api/state', gameStateRouter);
  app.use(errorHandler);
  return app;
}

function createAppWithNoSession() {
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.session = {};
    next();
  });
  app.use('/api/state', gameStateRouter);
  app.use(errorHandler);
  return app;
}

// Create a comprehensive game state that matches what the routes expect
function createFullGameState() {
  return {
    age: 1,
    turn: 1,
    round: 1,
    phase: 'worker_placement',
    currentPlayerIndex: 0,
    playerOrder: [1, 2, 3, 4],
    workerPlacement: {
      placementOrder: [1, 2, 3, 4],
      currentPlacerIndex: 0,
      passedPlayers: []
    },
    passedPlayers: [],
    roundPasses: { '1': 0, '2': 0, '3': 0, '4': 0 },
    completedCleanup: [],
    players: {
      '1': {
        faction: 'germany',
        cash: 100,
        income: 5,
        officers: 2,
        engineers: 3,
        research: 5,
        gasCubes: { hydrogen: 5, helium: 0 },
        techCards: ['rigid_frame', 'duralumin_girders'],
        ships: [],
        routes: [],
        blueprint: {
          frameSlots: [null],
          fabricSlots: [null],
          driveSlots: [null],
          componentSlots: [],
          gasSockets: []
        },
        hand: [{ symbol: 'wrench', id: 'card1' }, { symbol: 'coin', id: 'card2' }],
        deck: [{ symbol: 'propeller', id: 'card3' }],
        discardPile: [],
        hazardDeck: [{ id: 'hazard1', severity: 1 }],
        pendingActions: {},
        collectedIncome: false,
        officerIncomeLevel: 0,
        engineerIncomeLevel: 0
      },
      '2': {
        faction: 'britain',
        cash: 80,
        income: 4,
        officers: 1,
        engineers: 2,
        research: 0,
        gasCubes: { hydrogen: 3, helium: 0 },
        techCards: [],
        ships: [],
        routes: [],
        blueprint: { frameSlots: [], fabricSlots: [], driveSlots: [], componentSlots: [], gasSockets: [] },
        hand: [{ symbol: 'coin', id: 'card4' }],
        deck: [],
        discardPile: [],
        hazardDeck: [],
        pendingActions: {},
        collectedIncome: false
      }
    },
    groundBoard: { placements: {} },
    gasMarket: { hydrogen: 10, helium: 8 },
    rdBoard: [
      { id: 'helium_handling', name: 'Helium Handling', cost: 5, type: 'frame' }
    ],
    techBag: [],
    marketRow: [{ id: 'market1', cost: 3, symbol: 'wrench' }],
    availableRoutes: [
      { id: 'route-1', distance: 2, victoryPoints: 3, from: 'A', to: 'B' }
    ],
    log: []
  };
}

describe('GameState Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
    // Default: user is in game
    gameService.isPlayerInGame.mockResolvedValue(true);
  });

  describe('GET /:gameId', () => {
    it('should return game state for valid player', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1 });

      const res = await request(app).get('/api/state/1');

      expect(res.status).toBe(200);
      expect(res.body.gameState).toBeDefined();
      expect(res.body.gameState.state).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
      const noAuthApp = createAppWithNoSession();
      const res = await request(noAuthApp).get('/api/state/1');
      expect(res.status).toBe(401);
    });

    it('should return 403 if user is not in game', async () => {
      gameService.isPlayerInGame.mockResolvedValue(false);

      const res = await request(app).get('/api/state/1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Not a player in this game');
    });

    it('should return 404 if game state not found', async () => {
      gameStateService.getGameState.mockResolvedValue(null);

      const res = await request(app).get('/api/state/1');

      expect(res.status).toBe(404);
    });

    it('should handle errors gracefully', async () => {
      gameService.isPlayerInGame.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/state/1');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /:gameId/upgrades', () => {
    it('should return available upgrades', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1 });

      const res = await request(app).get('/api/state/1/upgrades');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('available');
      expect(res.body).toHaveProperty('allTechTiles');
      expect(res.body).toHaveProperty('allTechCards');
    });

    it('should return 403 if not in game', async () => {
      gameService.isPlayerInGame.mockResolvedValue(false);

      const res = await request(app).get('/api/state/1/upgrades');

      expect(res.status).toBe(403);
    });

    it('should return 404 if game state not found', async () => {
      gameStateService.getGameState.mockResolvedValue(null);

      const res = await request(app).get('/api/state/1/upgrades');

      expect(res.status).toBe(404);
    });

    it('should handle errors gracefully', async () => {
      gameService.isPlayerInGame.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/state/1/upgrades');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /:gameId/ground-board', () => {
    it('should return ground board state', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1 });

      const res = await request(app).get('/api/state/1/ground-board');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('locations');
      expect(res.body).toHaveProperty('placements');
      expect(res.body).toHaveProperty('symbols');
    });

    it('should return 403 if not in game', async () => {
      gameService.isPlayerInGame.mockResolvedValue(false);

      const res = await request(app).get('/api/state/1/ground-board');

      expect(res.status).toBe(403);
    });

    it('should return 404 if game state not found', async () => {
      gameStateService.getGameState.mockResolvedValue(null);

      const res = await request(app).get('/api/state/1/ground-board');

      expect(res.status).toBe(404);
    });

    it('should handle errors gracefully', async () => {
      gameService.isPlayerInGame.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/state/1/ground-board');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /:gameId/actions', () => {
    it('should return game actions', async () => {
      gameStateService.getGameActions.mockResolvedValue([
        { id: 1, action_type: 'END_TURN', created_at: new Date() }
      ]);

      const res = await request(app).get('/api/state/1/actions');

      expect(res.status).toBe(200);
      expect(res.body.actions).toHaveLength(1);
    });

    it('should return 403 if not in game', async () => {
      gameService.isPlayerInGame.mockResolvedValue(false);

      const res = await request(app).get('/api/state/1/actions');

      expect(res.status).toBe(403);
    });

    it('should handle errors gracefully', async () => {
      gameService.isPlayerInGame.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/state/1/actions');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /:gameId/action', () => {
    it('should return 404 if game not found', async () => {
      gameStateService.getGameState.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'PASS' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for missing action type', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Action type is required');
    });

    it('should return 400 for unknown action type', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'UNKNOWN_ACTION' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unknown action');
    });

    it('should return 403 when not player turn in worker_placement', async () => {
      const gameState = createFullGameState();
      gameState.workerPlacement.currentPlacerIndex = 1; // Player 2's turn
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'PASS' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Not your turn');
    });

    it('should process REVEAL action when player turn', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });
      gameStateService.updateGameState.mockResolvedValue({ state: gameState, version: 2 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'REVEAL', actionData: { techAcquisitions: [], marketPurchases: [] } });

      expect(res.status).toBe(200);
      expect(gameStateService.updateGameState).toHaveBeenCalled();
    });

    it('should process END_TURN action in income_cleanup phase', async () => {
      const gameState = createFullGameState();
      gameState.phase = 'income_cleanup';
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });
      gameStateService.updateGameState.mockResolvedValue({ state: gameState, version: 2 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'END_TURN' });

      expect(res.status).toBe(200);
    });

    // Note: TAKE_LOAN tests removed - loans have been removed from the game

    it('should process RECALL_AGENTS action', async () => {
      const gameState = createFullGameState();
      gameState.phase = 'income_cleanup';
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });
      gameStateService.updateGameState.mockResolvedValue({ state: gameState, version: 2 });

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'RECALL_AGENTS' });

      expect(res.status).toBe(200);
    });

    it('should handle action processing errors', async () => {
      const gameState = createFullGameState();
      gameStateService.getGameState.mockResolvedValue({ state: gameState, version: 1, id: 1 });
      gameStateService.updateGameState.mockRejectedValue(new Error('Update failed'));

      const res = await request(app)
        .post('/api/state/1/action')
        .send({ actionType: 'REVEAL', actionData: { techAcquisitions: [], marketPurchases: [] } });

      expect(res.status).toBe(500);
    });
  });
});
