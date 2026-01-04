/**
 * Concurrency and Race Condition Tests
 * Tests transaction locking and concurrent access scenarios
 */

// Mock database with controllable timing
jest.mock('../../server/db', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  };
  return { pool: mockPool };
});

const { pool } = require('../../server/db');
const {
  selectFaction,
  joinGame
} = require('../../server/services/gameService');

describe('Concurrency: Faction Selection', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('Row Locking with FOR UPDATE', () => {
    it('should use FOR UPDATE when checking game status', async () => {
      // Setup: Game found, faction not taken, player exists
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }) // Faction not taken
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Player exists
        .mockResolvedValueOnce({}) // UPDATE faction
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({ rows: [{ id: 'game-1', players: [] }] });

      await selectFaction('game-1', 1, 'germany');

      // Verify FOR UPDATE was used in the SELECT
      const calls = mockClient.query.mock.calls;
      const selectCall = calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('SELECT') && call[0].includes('games')
      );
      expect(selectCall[0]).toContain('FOR UPDATE');
    });

    it('should check faction availability within transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT game
        .mockResolvedValueOnce({ rows: [] }) // SELECT faction check
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Player exists
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValueOnce({ rows: [{ id: 'game-1', players: [] }] });

      await selectFaction('game-1', 1, 'germany');

      // Verify faction check query
      const factionCheck = mockClient.query.mock.calls.find(call =>
        typeof call[0] === 'string' && call[0].includes('faction') && call[0].includes('$')
      );
      expect(factionCheck).toBeDefined();
      expect(factionCheck[1]).toContain('germany');
    });
  });

  describe('Simulated Race Conditions', () => {
    it('should reject second request when faction taken during transaction', async () => {
      // First request: success
      const client1 = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] })
          .mockResolvedValueOnce({ rows: [] }) // Faction not taken
          .mockResolvedValueOnce({ rows: [{ id: 1 }] })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn()
      };

      // Second request: faction now taken
      const client2 = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] })
          .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }), // Faction TAKEN
        release: jest.fn()
      };

      // First call gets client1, second gets client2
      pool.connect
        .mockResolvedValueOnce(client1)
        .mockResolvedValueOnce(client2);

      pool.query.mockResolvedValue({ rows: [{ id: 'game-1', players: [] }] });

      // First request succeeds
      await selectFaction('game-1', 1, 'germany');

      // Second request fails
      await expect(selectFaction('game-1', 2, 'germany'))
        .rejects.toThrow('already taken');

      // Both clients should be released
      expect(client1.release).toHaveBeenCalled();
      expect(client2.release).toHaveBeenCalled();

      // Second client should have rolled back
      expect(client2.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should properly rollback on any error during transaction', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockRejectedValueOnce(new Error('Database constraint violation')); // UPDATE fails

      await expect(selectFaction('game-1', 1, 'germany'))
        .rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Transaction Isolation', () => {
    it('should hold lock until COMMIT', async () => {
      const queryOrder = [];

      mockClient.query.mockImplementation((sql) => {
        queryOrder.push(sql.substring(0, 20));
        if (sql === 'BEGIN') return Promise.resolve({});
        if (sql === 'COMMIT') return Promise.resolve({});
        if (sql === 'ROLLBACK') return Promise.resolve({});
        if (sql.includes('SELECT') && sql.includes('games')) {
          return Promise.resolve({ rows: [{ status: 'waiting' }] });
        }
        if (sql.includes('SELECT') && sql.includes('faction')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('SELECT') && sql.includes('game_players')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        return Promise.resolve({});
      });

      pool.query.mockResolvedValue({ rows: [{ id: 'game-1', players: [] }] });

      await selectFaction('game-1', 1, 'germany');

      // Verify query order: BEGIN first, COMMIT last
      expect(queryOrder[0]).toBe('BEGIN');
      expect(queryOrder[queryOrder.length - 1]).toBe('COMMIT');
    });

    it('should always release client connection', async () => {
      // Test success case
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      pool.query.mockResolvedValue({ rows: [{ id: 'game-1', players: [] }] });

      await selectFaction('game-1', 1, 'germany');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      // Reset and test error case
      jest.clearAllMocks();
      mockClient.release = jest.fn();

      mockClient.query
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('DB Error'));

      pool.connect.mockResolvedValue(mockClient);

      await expect(selectFaction('game-1', 1, 'germany'))
        .rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Concurrency: Join Game', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('Player Count Race Condition', () => {
    it('should reject join when game is at max capacity', async () => {
      // Game is already full when checked
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'game-1',
            status: 'waiting',
            current_player_count: 4, // Already at max
            max_players: 4
          }]
        });

      await expect(joinGame('game-1', 5))
        .rejects.toThrow('full');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should prevent duplicate player joins', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 'game-1',
            status: 'waiting',
            current_player_count: 2,
            max_players: 4
          }]
        })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Already in game!

      await expect(joinGame('game-1', 1))
        .rejects.toThrow('Already in this game');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});

describe('Error Recovery', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  it('should handle connection pool exhaustion gracefully', async () => {
    pool.connect.mockRejectedValue(new Error('Connection pool exhausted'));

    await expect(selectFaction('game-1', 1, 'germany'))
      .rejects.toThrow('Connection pool exhausted');
  });

  it('should handle network errors during transaction', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN succeeds
      .mockRejectedValueOnce(new Error('Connection reset by peer'));

    await expect(selectFaction('game-1', 1, 'germany'))
      .rejects.toThrow();

    // Should attempt rollback even if connection may be dead
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle rollback failure gracefully', async () => {
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('Query error'))
      .mockRejectedValueOnce(new Error('Rollback failed')); // ROLLBACK fails too

    // Should still reject with original error and release client
    await expect(selectFaction('game-1', 1, 'germany'))
      .rejects.toThrow();

    expect(mockClient.release).toHaveBeenCalled();
  });
});
