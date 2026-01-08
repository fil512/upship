// Mock the database
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

const { pool } = require('../../server/db');
const {
  initializeGameState,
  getGameState,
  updateGameState,
  getGameActions,
  FACTION_CONFIG
} = require('../../server/services/gameStateService');
const { testGamePlayers, validFactions } = require('../fixtures/testData');

describe('GameStateService', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  describe('FACTION_CONFIG', () => {
    it('should have config for all factions', () => {
      validFactions.forEach(faction => {
        expect(FACTION_CONFIG[faction]).toBeDefined();
      });
    });

    it('should have starting technologies for each faction', () => {
      validFactions.forEach(faction => {
        expect(FACTION_CONFIG[faction].startingTechCards).toBeDefined();
        expect(Array.isArray(FACTION_CONFIG[faction].startingTechCards)).toBe(true);
        expect(FACTION_CONFIG[faction].startingTechCards.length).toBeGreaterThan(0);
      });
    });

    it('should have starting upgrades for each faction', () => {
      validFactions.forEach(faction => {
        expect(FACTION_CONFIG[faction].startingTechTiles).toBeDefined();
        expect(FACTION_CONFIG[faction].startingTechTiles.frame).toBeDefined();
        expect(FACTION_CONFIG[faction].startingTechTiles.fabric).toBeDefined();
      });
    });

    describe('Germany faction', () => {
      it('should have zeppelin girders, goldbeater, maybach, and blaugas technologies', () => {
        expect(FACTION_CONFIG.germany.startingTechCards).toContain('zeppelin_girders');
        expect(FACTION_CONFIG.germany.startingTechCards).toContain('goldbeater_skin');
        expect(FACTION_CONFIG.germany.startingTechCards).toContain('maybach_engine');
        expect(FACTION_CONFIG.germany.startingTechCards).toContain('blaugas_storage');
      });

      it('should have helium_handling as banned technology', () => {
        expect(FACTION_CONFIG.germany.bannedTechCards).toContain('helium_handling');
      });
    });

    describe('Britain faction', () => {
      it('should have wire bracing, doped canvas, and imperial mooring', () => {
        expect(FACTION_CONFIG.britain.startingTechCards).toContain('wire_bracing');
        expect(FACTION_CONFIG.britain.startingTechCards).toContain('doped_canvas');
        expect(FACTION_CONFIG.britain.startingTechCards).toContain('imperial_mooring');
      });

      it('should have pre-installed passenger cabin (Luxury Focus)', () => {
        expect(FACTION_CONFIG.britain.startingTechTiles.component).toContain('passenger_cabin');
      });

      it('should have passenger accommodation tech card for the cabin tile', () => {
        expect(FACTION_CONFIG.britain.startingTechCards).toContain('passenger_accommodation');
      });
    });

    describe('USA faction', () => {
      it('should have helium handling technology', () => {
        expect(FACTION_CONFIG.usa.startingTechCards).toContain('helium_handling');
      });

      it('should have helium monopoly', () => {
        expect(FACTION_CONFIG.usa.heliumMonopoly).toBe(true);
      });

      it('should have 5 starting technologies (including basic_powerplant for drive)', () => {
        expect(FACTION_CONFIG.usa.startingTechCards.length).toBe(5);
        expect(FACTION_CONFIG.usa.startingTechCards).toContain('basic_powerplant');
      });
    });

    describe('Italy faction', () => {
      it('should have internal keel, rubberized cotton, and articulated keel', () => {
        expect(FACTION_CONFIG.italy.startingTechCards).toContain('internal_keel');
        expect(FACTION_CONFIG.italy.startingTechCards).toContain('rubberized_cotton');
        expect(FACTION_CONFIG.italy.startingTechCards).toContain('articulated_keel');
      });

      it('should have low ceiling flaw', () => {
        expect(FACTION_CONFIG.italy.lowCeiling).toBe(true);
      });
    });
  });

  describe('initializeGameState', () => {
    const players = [
      { user_id: 1, faction: 'germany' },
      { user_id: 2, faction: 'britain' },
      { user_id: 3, faction: 'usa' },
      { user_id: 4, faction: 'italy' }
    ];

    it('should create initial game state', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // INSERT game_states
        .mockResolvedValueOnce({}); // COMMIT

      const result = await initializeGameState(1, players);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toBeDefined();
      expect(result.age).toBe(1);
      expect(result.round).toBe(1);
      expect(result.turnInRound).toBe(1);
      expect(result.phase).toBe('worker_placement');
    });

    it('should create player states for all factions', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      expect(Object.keys(result.players)).toHaveLength(4);
      players.forEach(p => {
        expect(result.players[p.user_id]).toBeDefined();
        expect(result.players[p.user_id].faction).toBe(p.faction);
      });
    });

    it('should give USA helium instead of hydrogen', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      const usaPlayer = result.players[3];
      expect(usaPlayer.gasCubes.helium).toBe(2);
      expect(usaPlayer.gasCubes.hydrogen).toBe(0);
    });

    it('should give non-USA players hydrogen', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      const germanyPlayer = result.players[1];
      expect(germanyPlayer.gasCubes.hydrogen).toBe(2);
      expect(germanyPlayer.gasCubes.helium).toBe(0);
    });

    it('should draw 5 cards for each player', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      players.forEach(p => {
        expect(result.players[p.user_id].hand.length).toBe(5);
        expect(result.players[p.user_id].deck.length).toBe(5); // 10 starter - 5 in hand
      });
    });

    it('should create R&D board with 5 technologies', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      expect(result.rdBoard.length).toBe(5);
    });

    it('should scale tech copies based on player count (N-1 per tech)', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      // With 4 players: 3 copies per tech, minus faction starters
      // Faction starters reduce available copies in the tech bag
      // The exact count depends on which starting techs overlap with general techs
      // After the starting tech redesign (zeppelin_girders, expedition_propeller, etc.),
      // the total tech count changed. Current expected: 33 total.
      const totalTechsInBag = result.rdBoard.length + result.techBag.length;
      expect(totalTechsInBag).toBe(33);
      expect(result.rdBoard.length).toBe(5);
      expect(result.techBag.length).toBe(28);
    });

    it('should set fixed progress thresholds (launch-based)', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await initializeGameState(1, players);

      // Per Section 1.3: Fixed thresholds based on successful launches (8, 8, 6 per age)
      expect(result.progressThresholds).toEqual({ age2: 8, age3: 16, end: 22 });
    });

    it('should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error'));

      await expect(initializeGameState(1, players)).rejects.toThrow('Database error');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getGameState', () => {
    it('should return game state', async () => {
      pool.query.mockResolvedValue({
        rows: [{
          id: 1,
          game_id: 1,
          version: 1,
          current_player_id: 1,
          phase: 'worker_placement',
          turn_number: 1,
          age: 1,
          state: { test: true },
          updated_at: new Date()
        }]
      });

      const result = await getGameState(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(result.gameId).toBe(1);
      expect(result.phase).toBe('worker_placement');
    });

    it('should return null if not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getGameState(999);

      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    const newState = {
      age: 1,
      turn: 2,
      phase: 'reveal',
      playerOrder: [1, 2],
      currentPlayerIndex: 0
    };

    it('should update game state with new version', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ version: 1 }] }) // SELECT current
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({}); // COMMIT

      const result = await updateGameState(1, newState);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE game_states'),
        expect.any(Array)
      );
      expect(result.version).toBe(2);
    });

    it('should record action if provided', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ version: 1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}) // INSERT action
        .mockResolvedValueOnce({});

      const action = { playerId: 1, type: 'END_TURN', data: {} };
      await updateGameState(1, newState, action);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO game_actions'),
        expect.any(Array)
      );
    });

    it('should throw if game state not found', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] });

      await expect(updateGameState(999, newState)).rejects.toThrow('Game state not found');
    });

    it('should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ version: 1 }] })
        .mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateGameState(1, newState)).rejects.toThrow('Update failed');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getGameActions', () => {
    it('should return action history', async () => {
      pool.query.mockResolvedValue({
        rows: [
          { id: 1, action_type: 'END_TURN', username: 'user1' },
          { id: 2, action_type: 'BUY_GAS', username: 'user2' }
        ]
      });

      const result = await getGameActions(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM game_actions'),
        [1, 50]
      );
      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await getGameActions(1, 10);

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        [1, 10]
      );
    });

    it('should return empty array if no actions', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await getGameActions(1);

      expect(result).toEqual([]);
    });
  });
});
