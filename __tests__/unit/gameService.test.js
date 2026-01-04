// Mock the database
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

// Mock gameStateService
jest.mock('../../server/services/gameStateService', () => ({
  initializeGameState: jest.fn()
}));

const { pool } = require('../../server/db');
const gameStateService = require('../../server/services/gameStateService');
const {
  createGame,
  getGames,
  getGameById,
  joinGame,
  leaveGame,
  selectFaction,
  startGame,
  getUserGames
} = require('../../server/services/gameService');
const { testGames, testGamePlayers } = require('../fixtures/testData');

describe('GameService', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('createGame', () => {
    it('should create a game and add host as first player', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test Game', host_id: 1 }] }) // INSERT game
        .mockResolvedValueOnce({}) // INSERT player
        .mockResolvedValueOnce({}); // COMMIT

      const result = await createGame(1, 'Test Game');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO games'),
        expect.arrayContaining(['Test Game', 1])
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO game_players'),
        [1, 1]  // game_id, user_id - player_order is hardcoded as 1 in the SQL
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, name: 'Test Game', host_id: 1 });
    });

    it('should use custom settings', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await createGame(1, 'Test', { minPlayers: 3, maxPlayers: 4 });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO games'),
        ['Test', 1, 3, 4, expect.any(String)]
      );
    });

    it('should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(createGame(1, 'Test')).rejects.toThrow('Database error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getGames', () => {
    it('should return games with default filters', async () => {
      pool.query.mockResolvedValue({
        rows: [{ id: 1, name: 'Game 1', players: [] }]
      });

      const result = await getGames();

      expect(pool.query).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await getGames({ status: 'in_progress' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("g.status = $1"),
        ['in_progress']
      );
    });

    it('should apply limit', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await getGames({ limit: 10 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [10]
      );
    });

    it('should combine status and limit', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await getGames({ status: 'waiting', limit: 5 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        ['waiting', 5]
      );
    });
  });

  describe('getGameById', () => {
    it('should return game with players', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          name: 'Test Game',
          host_username: 'testhost',
          players: [{ id: 1, username: 'player1', faction: 'germany' }]
        }]
      });

      const result = await getGameById(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE g.id = $1'),
        [1]
      );
      expect(result.id).toBe(1);
    });

    it('should return null for non-existent game', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getGameById(999);

      expect(result).toBeNull();
    });
  });

  describe('joinGame', () => {
    it('should add player to game', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [testGames.waitingGame] }) // SELECT game
        .mockResolvedValueOnce({ rows: [] }) // Check existing player
        .mockResolvedValueOnce({}) // INSERT player
        .mockResolvedValueOnce({}) // UPDATE count
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValue({ rows: [{ ...testGames.waitingGame, players: [] }] });

      const result = await joinGame(1, 2);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO game_players'),
        [1, 2, 2, null] // game_id, user_id, player_order, faction
      );
      expect(result).toBeDefined();
    });

    it('should throw error if game not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT game

      await expect(joinGame(999, 1)).rejects.toThrow('Game not found');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error if game not waiting', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [testGames.inProgressGame] });

      await expect(joinGame(3, 1)).rejects.toThrow('Game is not accepting players');
    });

    it('should throw error if game is full', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [testGames.fullGame] });

      await expect(joinGame(2, 5)).rejects.toThrow('Game is full');
    });

    it('should throw error if already in game', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [testGames.waitingGame] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Already exists

      await expect(joinGame(1, 1)).rejects.toThrow('Already in this game');
    });
  });

  describe('leaveGame', () => {
    it('should remove player from game', async () => {
      const game = { ...testGames.waitingGame, host_id: 1 };
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [game] }) // SELECT game
        .mockResolvedValueOnce({ rowCount: 1 }) // DELETE player
        .mockResolvedValueOnce({}) // UPDATE count
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValue({ rows: [{ ...game, players: [] }] });

      const result = await leaveGame(1, 2);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM game_players'),
        [1, 2]
      );
      expect(result).toBeDefined();
    });

    it('should cancel game if host leaves', async () => {
      const game = { ...testGames.waitingGame, host_id: 1 };
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [game] }) // SELECT game
        .mockResolvedValueOnce({}) // UPDATE status to cancelled
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValue({ rows: [{ ...game, status: 'cancelled', players: [] }] });

      await leaveGame(1, 1); // Host leaving

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'cancelled'"),
        [1]
      );
    });

    it('should throw error if game not waiting', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [testGames.inProgressGame] });

      await expect(leaveGame(3, 1)).rejects.toThrow('Cannot leave a game in progress');
    });

    it('should throw error if not in game', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [testGames.waitingGame] })
        .mockResolvedValueOnce({ rowCount: 0 }); // DELETE returned 0

      await expect(leaveGame(1, 99)).rejects.toThrow('Not in this game');
    });
  });

  describe('selectFaction', () => {
    it('should update player faction', async () => {
      // Now uses transaction with pool.connect
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT game FOR UPDATE
        .mockResolvedValueOnce({ rows: [] }) // SELECT faction check (none taken)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT player exists
        .mockResolvedValueOnce({}) // UPDATE faction
        .mockResolvedValueOnce({}); // COMMIT

      pool.query.mockResolvedValue({ rows: [{ id: 1, players: [] }] }); // getGameById

      const result = await selectFaction(1, 1, 'germany');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_players SET faction'),
        ['germany', 1, 1]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if not in game', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT game
        .mockResolvedValueOnce({ rows: [] }) // SELECT faction check
        .mockResolvedValueOnce({ rows: [] }); // SELECT player exists - NOT FOUND

      await expect(selectFaction(1, 99, 'germany')).rejects.toThrow('Not in this game');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error if faction already taken', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'waiting' }] }) // SELECT game
        .mockResolvedValueOnce({ rows: [{ user_id: 2 }] }); // SELECT faction - TAKEN by user 2

      await expect(selectFaction(1, 1, 'germany')).rejects.toThrow('Faction already taken');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error if game not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT game - NOT FOUND

      await expect(selectFaction(999, 1, 'germany')).rejects.toThrow('Game not found');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should throw error if game already started', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ status: 'in_progress' }] }); // SELECT game - STARTED

      await expect(selectFaction(1, 1, 'germany')).rejects.toThrow('Cannot change faction after game has started');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('startGame', () => {
    it('should start game when all conditions met', async () => {
      const game = {
        ...testGames.waitingGame,
        host_id: 1,
        current_player_count: 4,
        min_players: 2
      };
      const players = [
        { user_id: 1, faction: 'germany' },
        { user_id: 2, faction: 'britain' },
        { user_id: 3, faction: 'usa' },
        { user_id: 4, faction: 'italy' }
      ];

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [game] }) // SELECT game
        .mockResolvedValueOnce({ rows: players }) // SELECT players
        .mockResolvedValueOnce({}) // UPDATE game status
        .mockResolvedValueOnce({}); // COMMIT

      gameStateService.initializeGameState.mockResolvedValue({});
      pool.query.mockResolvedValue({ rows: [{ ...game, status: 'in_progress', players }] });

      const result = await startGame(1, 1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'in_progress'"),
        [1]
      );
      expect(gameStateService.initializeGameState).toHaveBeenCalledWith(1, players);
      expect(result).toBeDefined();
    });

    it('should throw error if not host', async () => {
      const game = { ...testGames.waitingGame, host_id: 1 };
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [game] });

      await expect(startGame(1, 2)).rejects.toThrow('Only the host can start the game');
    });

    it('should throw error if game already started', async () => {
      const game = { ...testGames.inProgressGame, host_id: 1 };
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [game] });

      await expect(startGame(3, 1)).rejects.toThrow('Game already started');
    });

    it('should throw error if not enough players', async () => {
      const game = {
        ...testGames.waitingGame,
        host_id: 1,
        current_player_count: 1,
        min_players: 2
      };
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [game] });

      await expect(startGame(1, 1)).rejects.toThrow('Need at least 2 players');
    });

    it('should throw error if player missing faction', async () => {
      const game = {
        ...testGames.waitingGame,
        host_id: 1,
        current_player_count: 2,
        min_players: 2
      };
      const players = [
        { user_id: 1, faction: 'germany' },
        { user_id: 2, faction: null }
      ];

      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [game] })
        .mockResolvedValueOnce({ rows: players });

      await expect(startGame(1, 1)).rejects.toThrow('All players must select a faction');
    });
  });

  describe('getUserGames', () => {
    it('should return games for user', async () => {
      pool.query.mockResolvedValue({
        rows: [
          { id: 1, name: 'Game 1', host_username: 'user1' },
          { id: 2, name: 'Game 2', host_username: 'user1' }
        ]
      });

      const result = await getUserGames(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE gp.user_id = $1'),
        [1]
      );
      expect(result).toHaveLength(2);
    });

    it('should return empty array if user has no games', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getUserGames(999);

      expect(result).toEqual([]);
    });
  });
});
