const express = require('express');
const request = require('supertest');

// Mock auth middleware
jest.mock('../../server/auth', () => ({
  requireAuth: (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  }
}));

// Mock gameService
jest.mock('../../server/services/gameService', () => ({
  createGame: jest.fn(),
  getGames: jest.fn(),
  getGameById: jest.fn(),
  joinGame: jest.fn(),
  leaveGame: jest.fn(),
  selectFaction: jest.fn(),
  startGame: jest.fn(),
  getUserGames: jest.fn()
}));

const gameService = require('../../server/services/gameService');
const gamesRouter = require('../../server/routes/games');
const { errorHandler } = require('../../server/middleware/errorHandler');
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError
} = require('../../server/errors');

describe('Games Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authenticated session
    app.use((req, res, next) => {
      req.session = { userId: 1 };
      next();
    });

    app.use('/api/games', gamesRouter);
    app.use(errorHandler);
  });

  describe('GET /api/games', () => {
    it('should return games list', async () => {
      gameService.getGames.mockResolvedValue([
        { id: 1, name: 'Game 1' },
        { id: 2, name: 'Game 2' }
      ]);

      const res = await request(app)
        .get('/api/games');

      expect(res.status).toBe(200);
      expect(res.body.games).toHaveLength(2);
      expect(gameService.getGames).toHaveBeenCalled();
    });

    it('should apply status filter', async () => {
      gameService.getGames.mockResolvedValue([]);

      await request(app)
        .get('/api/games?status=in_progress');

      expect(gameService.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in_progress' })
      );
    });

    it('should apply limit filter', async () => {
      gameService.getGames.mockResolvedValue([]);

      await request(app)
        .get('/api/games?limit=10');

      expect(gameService.getGames).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should return 500 on error', async () => {
      gameService.getGames.mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/games');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/games/mine', () => {
    it('should return user games', async () => {
      gameService.getUserGames.mockResolvedValue([{ id: 1, name: 'My Game' }]);

      const res = await request(app)
        .get('/api/games/mine');

      expect(res.status).toBe(200);
      expect(res.body.games).toHaveLength(1);
      expect(gameService.getUserGames).toHaveBeenCalledWith(1);
    });

    it('should return 500 on error', async () => {
      gameService.getUserGames.mockRejectedValue(new Error('Error'));

      const res = await request(app)
        .get('/api/games/mine');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/games/:id', () => {
    it('should return a single game', async () => {
      gameService.getGameById.mockResolvedValue({ id: 1, name: 'Test Game' });

      const res = await request(app)
        .get('/api/games/1');

      expect(res.status).toBe(200);
      expect(res.body.game.id).toBe(1);
      expect(gameService.getGameById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if game not found', async () => {
      gameService.getGameById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/games/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Game not found');
    });

    it('should return 500 on error', async () => {
      gameService.getGameById.mockRejectedValue(new Error('Error'));

      const res = await request(app)
        .get('/api/games/1');

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/games', () => {
    it('should create a game', async () => {
      gameService.createGame.mockResolvedValue({ id: 1, name: 'New Game' });

      const res = await request(app)
        .post('/api/games')
        .send({ name: 'New Game' });

      expect(res.status).toBe(201);
      expect(res.body.game.name).toBe('New Game');
      expect(gameService.createGame).toHaveBeenCalledWith(1, 'New Game', undefined);
    });

    it('should pass settings', async () => {
      gameService.createGame.mockResolvedValue({ id: 1 });

      await request(app)
        .post('/api/games')
        .send({ name: 'Game', settings: { minPlayers: 3 } });

      expect(gameService.createGame).toHaveBeenCalledWith(
        1, 'Game', { minPlayers: 3 }
      );
    });

    it('should return 400 if name missing', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Game name is required');
    });

    it('should return 400 if name empty', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Game name is required');
    });

    it('should return 400 if name too long', async () => {
      const res = await request(app)
        .post('/api/games')
        .send({ name: 'a'.repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Game name must be 100 characters or less');
    });

    it('should trim name', async () => {
      gameService.createGame.mockResolvedValue({ id: 1, name: 'Trimmed' });

      await request(app)
        .post('/api/games')
        .send({ name: '  Trimmed  ' });

      expect(gameService.createGame).toHaveBeenCalledWith(1, 'Trimmed', undefined);
    });

    it('should return 500 on error', async () => {
      gameService.createGame.mockRejectedValue(new Error('Error'));

      const res = await request(app)
        .post('/api/games')
        .send({ name: 'Test' });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/games/:id/join', () => {
    it('should join a game', async () => {
      gameService.joinGame.mockResolvedValue({ id: 1, players: [{ id: 1 }, { id: 2 }] });

      const res = await request(app)
        .post('/api/games/1/join');

      expect(res.status).toBe(200);
      expect(gameService.joinGame).toHaveBeenCalledWith('1', 1);
    });

    it('should return 404 if game not found', async () => {
      gameService.joinGame.mockRejectedValue(new NotFoundError('Game'));

      const res = await request(app)
        .post('/api/games/999/join');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Game not found');
    });

    it('should return 400 for validation errors', async () => {
      gameService.joinGame.mockRejectedValue(new ValidationError('Game is full'));

      const res = await request(app)
        .post('/api/games/1/join');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Game is full');
    });
  });

  describe('POST /api/games/:id/leave', () => {
    it('should leave a game', async () => {
      gameService.leaveGame.mockResolvedValue({ id: 1, players: [] });

      const res = await request(app)
        .post('/api/games/1/leave');

      expect(res.status).toBe(200);
      expect(gameService.leaveGame).toHaveBeenCalledWith('1', 1);
    });

    it('should return 404 if game not found', async () => {
      gameService.leaveGame.mockRejectedValue(new NotFoundError('Game'));

      const res = await request(app)
        .post('/api/games/999/leave');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Game not found');
    });

    it('should return 400 for validation errors', async () => {
      gameService.leaveGame.mockRejectedValue(new ValidationError('Cannot leave a game in progress'));

      const res = await request(app)
        .post('/api/games/1/leave');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot leave a game in progress');
    });
  });

  describe('POST /api/games/:id/faction', () => {
    it('should select faction', async () => {
      gameService.selectFaction.mockResolvedValue({ id: 1 });

      const res = await request(app)
        .post('/api/games/1/faction')
        .send({ faction: 'germany' });

      expect(res.status).toBe(200);
      expect(gameService.selectFaction).toHaveBeenCalledWith('1', 1, 'germany');
    });

    it('should return 400 if faction invalid', async () => {
      const res = await request(app)
        .post('/api/games/1/faction')
        .send({ faction: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid faction');
    });

    it('should return 400 if faction missing', async () => {
      const res = await request(app)
        .post('/api/games/1/faction')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should accept all valid factions', async () => {
      const factions = ['germany', 'britain', 'usa', 'italy'];

      for (const faction of factions) {
        gameService.selectFaction.mockResolvedValue({ id: 1 });

        const res = await request(app)
          .post('/api/games/1/faction')
          .send({ faction });

        expect(res.status).toBe(200);
      }
    });

    it('should return 409 for faction already taken', async () => {
      gameService.selectFaction.mockRejectedValue(new ConflictError('Faction already taken'));

      const res = await request(app)
        .post('/api/games/1/faction')
        .send({ faction: 'germany' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Faction already taken');
    });
  });

  describe('POST /api/games/:id/start', () => {
    it('should start game', async () => {
      gameService.startGame.mockResolvedValue({ id: 1, status: 'in_progress' });

      const res = await request(app)
        .post('/api/games/1/start');

      expect(res.status).toBe(200);
      expect(gameService.startGame).toHaveBeenCalledWith('1', 1);
    });

    it('should return 400 for validation errors', async () => {
      gameService.startGame.mockRejectedValue(new ValidationError('Need at least 2 players to start'));

      const res = await request(app)
        .post('/api/games/1/start');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Need at least 2 players to start');
    });

    it('should return 403 if not host', async () => {
      gameService.startGame.mockRejectedValue(new ForbiddenError('Only the host can start the game'));

      const res = await request(app)
        .post('/api/games/1/start');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Only the host can start the game');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all routes', async () => {
      // Create app without authentication
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.use((req, res, next) => {
        req.session = {}; // No userId
        next();
      });
      unauthApp.use('/api/games', gamesRouter);

      const endpoints = [
        { method: 'get', path: '/api/games' },
        { method: 'get', path: '/api/games/mine' },
        { method: 'get', path: '/api/games/1' },
        { method: 'post', path: '/api/games' },
        { method: 'post', path: '/api/games/1/join' },
        { method: 'post', path: '/api/games/1/leave' },
        { method: 'post', path: '/api/games/1/faction' },
        { method: 'post', path: '/api/games/1/start' }
      ];

      for (const endpoint of endpoints) {
        const res = await request(unauthApp)[endpoint.method](endpoint.path)
          .send({ name: 'test', faction: 'germany' });

        expect(res.status).toBe(401);
      }
    });
  });
});
