/**
 * Socket.io Server Tests
 * Tests for real-time game updates and player presence
 */

// Mock dependencies before requiring anything
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
    on: jest.fn()
  }
}));

jest.mock('../../server/services/gameStateService', () => ({
  getGameState: jest.fn(),
  updateGameState: jest.fn()
}));

jest.mock('../../server/services/gameService', () => ({
  getGameById: jest.fn()
}));

jest.mock('../../server/services/gameStateHelpers', () => ({
  filterStateForPlayer: jest.fn((state, playerId) => ({
    ...state,
    filteredFor: playerId
  }))
}));

jest.mock('../../server/actions', () => ({
  processAction: jest.fn()
}));

jest.mock('../../server/actions/undo', () => ({
  executeUndo: jest.fn(),
  getUndoInfo: jest.fn()
}));

jest.mock('../../server/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const gameStateService = require('../../server/services/gameStateService');
const gameService = require('../../server/services/gameService');
const { filterStateForPlayer } = require('../../server/services/gameStateHelpers');
const { processAction } = require('../../server/actions');
const { executeUndo, getUndoInfo } = require('../../server/actions/undo');
const logger = require('../../server/logger');

// Import the module under test
const socketModule = require('../../server/socket/index');

// Create mock socket factory
function createMockSocket(overrides = {}) {
  const socket = {
    id: overrides.id || 'socket-123',
    request: {
      session: overrides.session || { userId: 'user-1' }
    },
    gameId: overrides.gameId || null,
    playerId: overrides.playerId || null,
    inLobby: overrides.inLobby || false,
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides
  };
  return socket;
}

// Create mock IO server factory
function createMockIO() {
  const sockets = new Map();
  const rooms = new Map();

  const io = {
    engine: {
      use: jest.fn()
    },
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      adapter: {
        rooms: rooms
      },
      sockets: sockets
    }
  };

  // Helper to add socket to room
  io._addSocketToRoom = (socketId, roomName) => {
    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }
    rooms.get(roomName).add(socketId);
  };

  // Helper to add socket
  io._addSocket = (socket) => {
    sockets.set(socket.id, socket);
  };

  return io;
}

// Create test game state
function createTestGameState() {
  return {
    playerOrder: ['user-1', 'user-2'],
    currentPlayerIndex: 0,
    phase: 'worker_placement',
    workerPlacement: {
      placementOrder: ['user-1', 'user-2'],
      currentPlacerIndex: 0
    },
    players: {
      'user-1': {
        faction: 'germany',
        cash: 100,
        hasTakenActionThisTurn: false,
        ships: []
      },
      'user-2': {
        faction: 'britain',
        cash: 80,
        hasTakenActionThisTurn: false,
        ships: []
      }
    },
    groundBoard: { placements: {} },
    log: []
  };
}

describe('Socket.io Server', () => {
  let mockIO;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIO = createMockIO();
  });

  describe('initializeSocket', () => {
    it('should export initializeSocket function', () => {
      expect(socketModule.initializeSocket).toBeDefined();
      expect(typeof socketModule.initializeSocket).toBe('function');
    });

    it('should export broadcast functions', () => {
      expect(socketModule.broadcastStateUpdate).toBeDefined();
      expect(socketModule.broadcastGameStarted).toBeDefined();
      expect(socketModule.broadcastLobbyUpdate).toBeDefined();
      expect(socketModule.broadcastPresence).toBeDefined();
    });
  });

  describe('broadcastStateUpdate', () => {
    it('should broadcast filtered state to each player in room', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1' });
      const socket2 = createMockSocket({ id: 'socket-2', playerId: 'user-2' });

      mockIO._addSocket(socket1);
      mockIO._addSocket(socket2);
      mockIO._addSocketToRoom('socket-1', 'game:game-123');
      mockIO._addSocketToRoom('socket-2', 'game:game-123');

      const testState = createTestGameState();

      socketModule.broadcastStateUpdate(mockIO, 'game-123', testState, 5, 'PASS');

      expect(socket1.emit).toHaveBeenCalledWith('state-update', expect.objectContaining({
        version: 5,
        action: 'PASS'
      }));
      expect(socket2.emit).toHaveBeenCalledWith('state-update', expect.objectContaining({
        version: 5,
        action: 'PASS'
      }));
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'user-1');
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'user-2');
    });

    it('should handle empty room gracefully', () => {
      socketModule.broadcastStateUpdate(mockIO, 'empty-game', {}, 1, 'PASS');

      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ gameId: 'empty-game' }),
        'No room found for broadcast'
      );
    });

    it('should skip sockets without playerId', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1' });
      const socket2 = createMockSocket({ id: 'socket-2', playerId: null }); // No playerId

      mockIO._addSocket(socket1);
      mockIO._addSocket(socket2);
      mockIO._addSocketToRoom('socket-1', 'game:game-123');
      mockIO._addSocketToRoom('socket-2', 'game:game-123');

      const testState = createTestGameState();

      socketModule.broadcastStateUpdate(mockIO, 'game-123', testState, 5, 'PASS');

      expect(socket1.emit).toHaveBeenCalled();
      expect(socket2.emit).not.toHaveBeenCalled();
    });

    it('should log broadcast with client count', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1' });
      mockIO._addSocket(socket1);
      mockIO._addSocketToRoom('socket-1', 'game:game-123');

      socketModule.broadcastStateUpdate(mockIO, 'game-123', {}, 1, 'END_TURN');

      expect(logger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 'game-123',
          actionType: 'END_TURN',
          version: 1,
          clientCount: 1
        }),
        'Broadcasting state update'
      );
    });
  });

  describe('broadcastGameStarted', () => {
    it('should emit game-started to lobby sockets and move them to game room', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1', inLobby: true });

      mockIO._addSocket(socket1);
      mockIO._addSocketToRoom('socket-1', 'lobby:game-123');

      const testState = createTestGameState();

      socketModule.broadcastGameStarted(mockIO, 'game-123', testState);

      expect(socket1.emit).toHaveBeenCalledWith('game-started', expect.objectContaining({
        state: expect.any(Object)
      }));
      expect(socket1.leave).toHaveBeenCalledWith('lobby:game-123');
      expect(socket1.join).toHaveBeenCalledWith('game:game-123');
      expect(socket1.inLobby).toBe(false);
    });

    it('should emit game-started to game room sockets', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1' });

      mockIO._addSocket(socket1);
      mockIO._addSocketToRoom('socket-1', 'game:game-123');

      const testState = createTestGameState();

      socketModule.broadcastGameStarted(mockIO, 'game-123', testState);

      expect(socket1.emit).toHaveBeenCalledWith('game-started', expect.objectContaining({
        state: expect.any(Object)
      }));
    });

    it('should filter state for each player', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1' });
      const socket2 = createMockSocket({ id: 'socket-2', playerId: 'user-2' });

      mockIO._addSocket(socket1);
      mockIO._addSocket(socket2);
      mockIO._addSocketToRoom('socket-1', 'lobby:game-123');
      mockIO._addSocketToRoom('socket-2', 'lobby:game-123');

      const testState = createTestGameState();

      socketModule.broadcastGameStarted(mockIO, 'game-123', testState);

      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'user-1');
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'user-2');
    });

    it('should skip sockets without playerId', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: null });

      mockIO._addSocket(socket1);
      mockIO._addSocketToRoom('socket-1', 'lobby:game-123');

      const testState = createTestGameState();

      socketModule.broadcastGameStarted(mockIO, 'game-123', testState);

      expect(socket1.emit).not.toHaveBeenCalled();
    });

    it('should handle missing rooms gracefully', () => {
      const testState = createTestGameState();

      // Should not throw when neither room exists
      expect(() => {
        socketModule.broadcastGameStarted(mockIO, 'nonexistent-game', testState);
      }).not.toThrow();
    });
  });

  describe('broadcastLobbyUpdate', () => {
    it('should emit lobby-update with game info', () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        status: 'waiting',
        host_id: 'user-1',
        current_player_count: 2,
        max_players: 4,
        players: [{ id: 'user-1' }, { id: 'user-2' }]
      };

      socketModule.broadcastLobbyUpdate(mockIO, 'game-123', mockGame);

      expect(mockIO.to).toHaveBeenCalledWith('lobby:game-123');
      expect(mockIO.emit).toHaveBeenCalledWith('lobby-update', {
        game: {
          id: 'game-123',
          name: 'Test Game',
          status: 'waiting',
          host_id: 'user-1',
          current_player_count: 2,
          max_players: 4,
          players: [{ id: 'user-1' }, { id: 'user-2' }]
        }
      });
    });

    it('should only include specified game properties', () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        status: 'waiting',
        host_id: 'user-1',
        current_player_count: 2,
        max_players: 4,
        players: [{ id: 'user-1' }],
        secret_field: 'should not be included', // Extra field
        internal_data: { foo: 'bar' }
      };

      socketModule.broadcastLobbyUpdate(mockIO, 'game-123', mockGame);

      const emittedGame = mockIO.emit.mock.calls[0][1].game;
      expect(emittedGame).not.toHaveProperty('secret_field');
      expect(emittedGame).not.toHaveProperty('internal_data');
    });
  });

  describe('broadcastPresence', () => {
    it('should emit presence-update to game room', () => {
      socketModule.broadcastPresence(mockIO, 'game-123');

      expect(mockIO.to).toHaveBeenCalledWith('game:game-123');
      expect(mockIO.emit).toHaveBeenCalledWith('presence-update', expect.objectContaining({
        onlinePlayers: expect.any(Array)
      }));
    });

    it('should return empty array when no presence tracked', () => {
      socketModule.broadcastPresence(mockIO, 'empty-game');

      expect(mockIO.emit).toHaveBeenCalledWith('presence-update', {
        onlinePlayers: []
      });
    });
  });

  describe('state filtering', () => {
    it('should call filterStateForPlayer for each recipient', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'player-a' });
      const socket2 = createMockSocket({ id: 'socket-2', playerId: 'player-b' });
      const socket3 = createMockSocket({ id: 'socket-3', playerId: 'player-c' });

      mockIO._addSocket(socket1);
      mockIO._addSocket(socket2);
      mockIO._addSocket(socket3);
      mockIO._addSocketToRoom('socket-1', 'game:test');
      mockIO._addSocketToRoom('socket-2', 'game:test');
      mockIO._addSocketToRoom('socket-3', 'game:test');

      const testState = { test: 'state' };

      socketModule.broadcastStateUpdate(mockIO, 'test', testState, 1, 'ACTION');

      expect(filterStateForPlayer).toHaveBeenCalledTimes(3);
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'player-a');
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'player-b');
      expect(filterStateForPlayer).toHaveBeenCalledWith(testState, 'player-c');
    });
  });

  describe('room management edge cases', () => {
    it('should handle socket not found in sockets map', () => {
      // Add to room but not to sockets map
      mockIO._addSocketToRoom('missing-socket', 'game:test');

      const testState = createTestGameState();

      // Should not throw
      expect(() => {
        socketModule.broadcastStateUpdate(mockIO, 'test', testState, 1, 'ACTION');
      }).not.toThrow();
    });

    it('should handle multiple rooms for same game', () => {
      const socket1 = createMockSocket({ id: 'socket-1', playerId: 'user-1', inLobby: true });
      const socket2 = createMockSocket({ id: 'socket-2', playerId: 'user-1' }); // Same player, different socket

      mockIO._addSocket(socket1);
      mockIO._addSocket(socket2);
      mockIO._addSocketToRoom('socket-1', 'lobby:game-123');
      mockIO._addSocketToRoom('socket-2', 'game:game-123');

      const testState = createTestGameState();

      socketModule.broadcastGameStarted(mockIO, 'game-123', testState);

      // Both sockets should receive the message
      expect(socket1.emit).toHaveBeenCalled();
      expect(socket2.emit).toHaveBeenCalled();
    });
  });
});
