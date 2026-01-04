/**
 * Integration Tests: Game Flow
 * Tests HTTP → Service → DB flows for game lifecycle
 */

const express = require('express');
const request = require('supertest');

// Mock database at the lowest level
jest.mock('../../server/db', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  };
  return { pool: mockPool };
});

// Keep real services - only mock the database
const { pool } = require('../../server/db');
const gamesRouter = require('../../server/routes/games');
const authRouter = require('../../server/routes/auth');
const gameStateRouter = require('../../server/routes/gameState');
const { errorHandler } = require('../../server/middleware/errorHandler');

// Create test app with real middleware chain
function createTestApp(sessionData = {}) {
  const app = express();
  app.use(express.json());

  // Mock session middleware
  app.use((req, res, next) => {
    req.session = { ...sessionData };
    req.session.save = (cb) => cb && cb();
    req.session.destroy = (cb) => cb && cb();
    next();
  });

  app.use('/api/games', gamesRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/state', gameStateRouter);
  app.use(errorHandler);

  return app;
}

// Create mock transaction client
function createMockClient() {
  return {
    query: jest.fn(),
    release: jest.fn()
  };
}

describe('Integration: Game Lifecycle Flow', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockClient();
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('Create → Join → Select Faction → Start Game', () => {
    it('should complete full game setup flow', async () => {
      const app = createTestApp({ userId: 1 });

      // Step 1: Create game
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'game-1', name: 'Test Game', host_id: 1 }] })
        .mockResolvedValueOnce({}) // INSERT player
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'game-1',
          name: 'Test Game',
          host_id: 1,
          status: 'waiting',
          players: [{ id: 1, username: 'host', faction: null }]
        }]
      });

      const createRes = await request(app)
        .post('/api/games')
        .send({ name: 'Test Game' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.game.id).toBe('game-1');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();

      // Step 2: Another player joins
      jest.clearAllMocks();
      mockClient = createMockClient();
      pool.connect.mockResolvedValue(mockClient);

      const app2 = createTestApp({ userId: 2 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'waiting', current_player_count: 1, max_players: 4 }] })
        .mockResolvedValueOnce({ rows: [] }) // Not already in game
        .mockResolvedValueOnce({}) // INSERT player
        .mockResolvedValueOnce({}) // UPDATE count
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'game-1',
          players: [
            { id: 1, username: 'host', faction: null },
            { id: 2, username: 'player2', faction: null }
          ]
        }]
      });

      const joinRes = await request(app2)
        .post('/api/games/game-1/join');

      expect(joinRes.status).toBe(200);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');

      // Step 3: Select factions
      jest.clearAllMocks();
      mockClient = createMockClient();
      pool.connect.mockResolvedValue(mockClient);

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // Game check
        .mockResolvedValueOnce({ rows: [] }) // Faction not taken
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Player exists
        .mockResolvedValueOnce({}) // UPDATE faction
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({
        rows: [{
          id: 'game-1',
          players: [{ id: 1, faction: 'germany' }]
        }]
      });

      const factionRes = await request(app)
        .post('/api/games/game-1/faction')
        .send({ faction: 'germany' });

      expect(factionRes.status).toBe(200);
    });

    it('should rollback transaction on game creation failure', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database constraint violation'));

      const res = await request(app)
        .post('/api/games')
        .send({ name: 'Test Game' });

      expect(res.status).toBe(500);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback transaction on join failure', async () => {
      const app = createTestApp({ userId: 2 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'game-1', status: 'waiting', current_player_count: 1, max_players: 4 }] })
        .mockResolvedValueOnce({ rows: [] }) // Not already in game
        .mockRejectedValueOnce(new Error('Foreign key violation'));

      const res = await request(app)
        .post('/api/games/game-1/join');

      expect(res.status).toBe(500);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Transaction Isolation', () => {
    it('should use FOR UPDATE lock when selecting faction', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }) // Faction check
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Player exists
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({ rows: [{ id: 'game-1', players: [] }] });

      await request(app)
        .post('/api/games/game-1/faction')
        .send({ faction: 'germany' });

      // Verify FOR UPDATE was used
      const selectCall = mockClient.query.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('FOR UPDATE')
      );
      expect(selectCall).toBeDefined();
    });

    it('should properly release client even on error', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Unexpected error'));

      await request(app)
        .post('/api/games/game-1/faction')
        .send({ faction: 'germany' });

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Propagation', () => {
    it('should return 404 for non-existent game', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // Game not found

      const res = await request(app)
        .post('/api/games/nonexistent/join');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 400 for invalid faction', async () => {
      const app = createTestApp({ userId: 1 });

      const res = await request(app)
        .post('/api/games/game-1/faction')
        .send({ faction: 'invalid_faction' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid faction');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const app = createTestApp({}); // No userId

      const res = await request(app)
        .post('/api/games')
        .send({ name: 'Test Game' });

      expect(res.status).toBe(401);
    });

    it('should return 409 for faction already taken', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // Game check
        .mockResolvedValueOnce({ rows: [{ user_id: 2 }] }); // Faction already taken

      const res = await request(app)
        .post('/api/games/game-1/faction')
        .send({ faction: 'germany' });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already taken');
    });
  });

  describe('Start Game Flow', () => {
    it('should reject start from non-host', async () => {
      const app = createTestApp({ userId: 2 }); // Not the host

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'game-1', host_id: 1, status: 'waiting' }]
        });

      const res = await request(app)
        .post('/api/games/game-1/start');

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('host');
    });

    it('should reject start with missing factions', async () => {
      const app = createTestApp({ userId: 1 });

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'game-1',
            host_id: 1,
            status: 'waiting',
            current_player_count: 2,
            min_players: 2
          }]
        })
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, faction: 'germany' },
            { user_id: 2, faction: null } // Missing faction
          ]
        });

      const res = await request(app)
        .post('/api/games/game-1/start');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('faction');
    });
  });

  describe('Leave Game Flow', () => {
    it('should cancel game when host leaves', async () => {
      const app = createTestApp({ userId: 1 }); // Host

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'game-1', host_id: 1, status: 'waiting' }]
        })
        .mockResolvedValueOnce({}) // UPDATE to cancelled
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'game-1', status: 'cancelled', players: [] }]
      });

      const res = await request(app)
        .post('/api/games/game-1/leave');

      expect(res.status).toBe(200);

      // Verify cancel query was called
      const cancelCall = mockClient.query.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes("cancelled")
      );
      expect(cancelCall).toBeDefined();
    });

    it('should just remove player when non-host leaves', async () => {
      const app = createTestApp({ userId: 2 }); // Not host

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 'game-1', host_id: 1, status: 'waiting' }]
        })
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE player
        .mockResolvedValueOnce({}) // UPDATE count
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({
        rows: [{ id: 'game-1', status: 'waiting', players: [{ id: 1 }] }]
      });

      const res = await request(app)
        .post('/api/games/game-1/leave');

      expect(res.status).toBe(200);

      // Verify DELETE was called, not cancel
      const deleteCall = mockClient.query.mock.calls.find(
        call => typeof call[0] === 'string' && call[0].includes('DELETE FROM game_players')
      );
      expect(deleteCall).toBeDefined();
    });
  });
});

describe('Integration: Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate username length', async () => {
      const app = createTestApp({});

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' }); // Too short

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('3-50');
    });

    it('should validate password length', async () => {
      const app = createTestApp({});

      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validuser', password: '123' }); // Too short

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least');
    });
  });

  describe('Session Management', () => {
    it('should return null user from /me when not authenticated', async () => {
      const app = createTestApp({}); // No userId

      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });
  });
});
