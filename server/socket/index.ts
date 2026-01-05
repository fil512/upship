/**
 * Socket.io Server Module
 * Handles real-time game updates and player presence
 */

import type { Server as HttpServer } from 'http';
import type { RequestHandler } from 'express';
import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { GameState, Ship } from '@upship/api';

const { Server } = require('socket.io');
const gameStateService = require('../services/gameStateService');
const gameService = require('../services/gameService');
const { filterStateForPlayer } = require('../services/gameStateHelpers');
const { processAction } = require('../actions');
const { executeUndo, getUndoInfo } = require('../actions/undo');
const { checkAndExecuteBotMoves } = require('../services/botExecutor');
const logger = require('../logger');

// Extended socket with game-specific properties
interface GameSocket extends Socket {
  gameId?: string | null;
  playerId?: string | null;
  inLobby?: boolean;
  request: Socket['request'] & {
    session?: {
      userId?: string;
    };
  };
}

// Extended player state with turn tracking
interface ExtendedPlayerState {
  hasTakenActionThisTurn?: boolean;
  ships?: Ship[];
  [key: string]: unknown;
}

// Game state wrapper
interface GameStateWrapper {
  state: GameState & {
    workerPlacement?: {
      currentPlacerIndex?: number;
      placementOrder?: string[];
    };
    ageTransitionDesignBureau?: {
      currentPlayerIndex?: number;
    };
  };
  version: number;
  isCommitPoint?: boolean;
}

// Game info from service
interface Game {
  id: string;
  name: string;
  status: string;
  host_id: string;
  current_player_count: number;
  max_players: number;
  players: Array<{ id: string; faction?: string }>;
}

// Action request
interface GameAction {
  actionType: string;
  actionData?: Record<string, unknown>;
  asUserId?: string;
}

// Undo result
interface UndoResult {
  newState: GameState;
  undoneAction: string;
}

// Undo info
interface UndoInfo {
  canUndo: boolean;
  lastActionType?: string;
}

// Track online players per game: Map<gameId, Map<playerId, socketId>>
const gamePresence: Map<string, Map<string, string>> = new Map();

// Grace period timers for disconnects: Map<`gameId:playerId`, timeoutId>
const disconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

/**
 * Initialize Socket.io with the HTTP server
 */
function initializeSocket(server: HttpServer, sessionMiddleware: RequestHandler): SocketIOServer {
  const io: SocketIOServer = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Share Express session with Socket.io
  io.engine.use(sessionMiddleware);

  io.on('connection', (socket: GameSocket) => {
    const userId = socket.request.session?.userId;

    if (!userId) {
      logger.warn('Socket connection without authentication, disconnecting');
      socket.disconnect();
      return;
    }

    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    // Join game room
    socket.on('join-game', async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
      try {
        // Verify user is a player in this game
        const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

        if (!gameState) {
          socket.emit('action-error', { error: 'Game not found' });
          return;
        }

        if (!gameState.state.players[playerId]) {
          socket.emit('action-error', { error: 'Not a player in this game' });
          return;
        }

        // Store game/player info on socket
        socket.gameId = gameId;
        socket.playerId = playerId;

        // Join the game room
        socket.join(`game:${gameId}`);

        // Track presence
        handlePlayerJoin(io, gameId, playerId, socket.id);

        // Get undo info for this player
        const undoInfo: UndoInfo = await getUndoInfo(gameId, playerId);
        const playerState = gameState.state.players[playerId] as unknown as ExtendedPlayerState | undefined;

        // Send initial state sync with turnInfo
        const filteredState = filterStateForPlayer(gameState.state, playerId);
        socket.emit('state-sync', {
          state: filteredState,
          version: gameState.version,
          turnInfo: {
            canUndo: undoInfo.canUndo,
            lastActionType: undoInfo.lastActionType,
            canEndTurn: playerState?.hasTakenActionThisTurn || false
          }
        });

        logger.info({ gameId, playerId }, 'Player joined game room');
      } catch (error) {
        logger.error({ error, gameId, playerId }, 'Error joining game');
        socket.emit('action-error', { error: 'Failed to join game' });
      }
    });

    // Join lobby room for waiting games (before game starts)
    socket.on('join-lobby', async ({ gameId }: { gameId: string }) => {
      try {
        // Get game info from games table (not game_states)
        const game: Game | null = await gameService.getGameById(gameId);

        if (!game) {
          socket.emit('lobby-error', { error: 'Game not found' });
          return;
        }

        // Verify user is a player in this game
        const isPlayer = game.players.some(p => p.id === userId);
        if (!isPlayer) {
          socket.emit('lobby-error', { error: 'Not a player in this game' });
          return;
        }

        // Store game info on socket
        socket.gameId = gameId;
        socket.playerId = userId;
        socket.inLobby = true;

        // Join the lobby room
        socket.join(`lobby:${gameId}`);

        // Track presence
        handlePlayerJoin(io, gameId, userId, socket.id);

        // Send current lobby state
        socket.emit('lobby-sync', {
          game: {
            id: game.id,
            name: game.name,
            status: game.status,
            host_id: game.host_id,
            current_player_count: game.current_player_count,
            max_players: game.max_players,
            players: game.players
          }
        });

        logger.info({ gameId, playerId: userId }, 'Player joined lobby room');
      } catch (error) {
        logger.error({ error, gameId }, 'Error joining lobby');
        socket.emit('lobby-error', { error: 'Failed to join lobby' });
      }
    });

    // Handle game actions
    socket.on('game-action', async (action: GameAction, callback: (response: Record<string, unknown>) => void) => {
      const { gameId, playerId } = socket;

      logger.debug({ gameId, playerId, actionType: action.actionType }, 'Game action received');

      if (!gameId || !playerId) {
        logger.warn({ gameId, playerId }, 'Action rejected: not in a game');
        callback({ success: false, error: 'Not in a game' });
        return;
      }

      try {
        const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

        if (!gameState) {
          callback({ success: false, error: 'Game not found' });
          return;
        }

        const state = gameState.state;

        // Handle dev mode user override
        const isDev = process.env.NODE_ENV !== 'production';
        const effectiveUserId = (isDev && action.asUserId && state.players[action.asUserId])
          ? action.asUserId
          : playerId;

        // Verify it's this player's turn (similar to HTTP route logic)
        let currentPlayerId: string;
        let skipTurnCheck = false;

        if (state.phase === 'worker_placement' && state.workerPlacement?.placementOrder) {
          const wpIndex = state.workerPlacement.currentPlacerIndex || 0;
          currentPlayerId = state.workerPlacement.placementOrder[wpIndex];
        } else if (state.phase === 'reveal') {
          skipTurnCheck = true;
          currentPlayerId = effectiveUserId;
        } else if (state.phase === 'age_transition_design_bureau' && state.ageTransitionDesignBureau) {
          const transitionIndex = state.ageTransitionDesignBureau.currentPlayerIndex || 0;
          currentPlayerId = state.playerOrder[transitionIndex];
        } else {
          currentPlayerId = state.playerOrder[state.currentPlayerIndex];
        }

        // Special cases that bypass turn check
        if (action.actionType === 'RESPOND_TO_HAZARD') {
          const playerState = state.players[effectiveUserId];
          const hasAwaitingHazard = playerState?.ships?.some((s: Ship) => s.status === 'awaiting_hazard');
          if (hasAwaitingHazard) skipTurnCheck = true;
        }

        if (action.actionType === 'UNDO') {
          skipTurnCheck = true;
        }

        if (!skipTurnCheck && currentPlayerId !== effectiveUserId) {
          logger.debug({ currentPlayerId, effectiveUserId }, 'Action rejected: not your turn');
          callback({ success: false, error: 'Not your turn' });
          return;
        }

        // Handle UNDO specially
        if (action.actionType === 'UNDO') {
          const undoResult: UndoResult = await executeUndo(gameId, effectiveUserId);

          // Broadcast to all players
          broadcastStateUpdate(io, gameId, undoResult.newState, gameState.version + 1, 'UNDO');

          // Get updated undo info after the undo
          const undoInfo: UndoInfo = await getUndoInfo(gameId, effectiveUserId);
          const playerState = undoResult.newState.players[effectiveUserId] as unknown as ExtendedPlayerState | undefined;

          callback({
            success: true,
            state: filterStateForPlayer(undoResult.newState, playerId),
            version: gameState.version + 1,
            undoneAction: undoResult.undoneAction,
            turnInfo: {
              canUndo: undoInfo.canUndo,
              lastActionType: undoInfo.lastActionType,
              canEndTurn: playerState?.hasTakenActionThisTurn || false
            }
          });
          return;
        }

        // Process the action
        const result = processAction(state, effectiveUserId, action.actionType, action.actionData);

        if (result.error) {
          callback({ success: false, error: result.error });
          return;
        }

        // Save the new state
        const newGameState: GameStateWrapper = await gameStateService.updateGameState(gameId, result.newState, {
          playerId: effectiveUserId,
          type: action.actionType,
          data: action.actionData
        });

        // Broadcast to all players in the game
        broadcastStateUpdate(io, gameId, newGameState as unknown as GameState, newGameState.version, action.actionType);

        // Check for turn/phase changes and notify
        checkAndNotifyChanges(io, gameId, state, result.newState);

        // Get undo info for the acting player
        const undoInfo: UndoInfo = await getUndoInfo(gameId, effectiveUserId);
        const playerState = result.newState.players[effectiveUserId] as unknown as ExtendedPlayerState | undefined;

        // Send response to acting player with turn info
        const responsePayload = {
          success: true,
          state: filterStateForPlayer(newGameState, playerId),
          version: newGameState.version,
          isCommitPoint: newGameState.isCommitPoint || false,
          turnInfo: {
            canUndo: undoInfo.canUndo,
            lastActionType: undoInfo.lastActionType,
            canEndTurn: playerState?.hasTakenActionThisTurn || false
          }
        };
        callback(responsePayload);

        logger.info({ gameId, playerId, actionType: action.actionType }, 'Action processed');

        // Check if next player is a bot and execute their moves
        // Run async to not block the response
        // eslint-disable-next-line sonarjs/no-nested-functions
        setImmediate(() => checkAndExecuteBotMoves(io, gameId).catch((err: Error) => logger.error({ err, gameId }, 'Bot execution error')));
      } catch (error) {
        logger.error({ error, gameId, action }, 'Error processing game action');
        const errorMessage = error instanceof Error ? error.message : 'Action failed';
        callback({ success: false, error: errorMessage });
      }
    });

    // Handle state sync request
    socket.on('request-sync', async () => {
      const { gameId, playerId } = socket;

      if (!gameId || !playerId) return;

      try {
        const gameState: GameStateWrapper | null = await gameStateService.getGameState(gameId);

        if (gameState) {
          // Get undo info for this player
          const undoInfo: UndoInfo = await getUndoInfo(gameId, playerId);
          const playerState = gameState.state.players[playerId] as unknown as ExtendedPlayerState | undefined;

          socket.emit('state-sync', {
            state: filterStateForPlayer(gameState.state, playerId),
            version: gameState.version,
            turnInfo: {
              canUndo: undoInfo.canUndo,
              lastActionType: undoInfo.lastActionType,
              canEndTurn: playerState?.hasTakenActionThisTurn || false
            }
          });
        }
      } catch (error) {
        logger.error({ error, gameId }, 'Error syncing state');
      }
    });

    // Handle leave game
    socket.on('leave-game', ({ gameId }: { gameId: string }) => {
      if (socket.gameId === gameId && socket.playerId) {
        socket.leave(`game:${gameId}`);
        handlePlayerDisconnect(io, gameId, socket.playerId);
        socket.gameId = null;
        socket.playerId = null;
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.gameId && socket.playerId) {
        handlePlayerDisconnect(io, socket.gameId, socket.playerId);
      }
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

/**
 * Handle player joining a game
 */
function handlePlayerJoin(io: SocketIOServer, gameId: string, playerId: string, socketId: string): void {
  // Clear any disconnect timer
  const timerKey = `${gameId}:${playerId}`;
  if (disconnectTimers.has(timerKey)) {
    clearTimeout(disconnectTimers.get(timerKey)!);
    disconnectTimers.delete(timerKey);
  }

  // Track presence
  if (!gamePresence.has(gameId)) {
    gamePresence.set(gameId, new Map());
  }
  gamePresence.get(gameId)!.set(playerId, socketId);

  // Broadcast presence update
  broadcastPresence(io, gameId);
}

/**
 * Handle player disconnecting from a game
 */
function handlePlayerDisconnect(io: SocketIOServer, gameId: string, playerId: string): void {
  const timerKey = `${gameId}:${playerId}`;

  // Give grace period before marking offline (30 seconds)
  const timer = setTimeout(() => {
    const players = gamePresence.get(gameId);
    if (players) {
      players.delete(playerId);
      if (players.size === 0) {
        gamePresence.delete(gameId);
      }
      broadcastPresence(io, gameId);
    }
    disconnectTimers.delete(timerKey);
  }, 30000);

  disconnectTimers.set(timerKey, timer);
}

/**
 * Broadcast presence update to all players in a game
 */
function broadcastPresence(io: SocketIOServer, gameId: string): void {
  const players = gamePresence.get(gameId);
  const onlinePlayers = players ? Array.from(players.keys()) : [];

  io.to(`game:${gameId}`).emit('presence-update', { onlinePlayers });
}

/**
 * Broadcast state update to all players in a game (filtered per player)
 */
function broadcastStateUpdate(io: SocketIOServer, gameId: string, newState: GameState, version: number, actionType: string): void {
  const room = io.sockets.adapter.rooms.get(`game:${gameId}`);
  if (!room) {
    logger.debug({ gameId }, 'No room found for broadcast');
    return;
  }

  logger.debug({ gameId, actionType, version, clientCount: room.size }, 'Broadcasting state update');
  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId) as GameSocket | undefined;
    if (socket && socket.playerId) {
      socket.emit('state-update', {
        state: filterStateForPlayer(newState, socket.playerId),
        version,
        action: actionType
      });
    }
  }
}

// Extended state for checking changes
type ExtendedGameState = GameState & {
  workerPlacement?: {
    currentPlacerIndex?: number;
    placementOrder?: string[];
  };
};

/**
 * Check for turn/phase changes and send notifications
 */
function checkAndNotifyChanges(io: SocketIOServer, gameId: string, oldState: ExtendedGameState, newState: ExtendedGameState): void {
  // Check for phase change
  if (oldState.phase !== newState.phase) {
    io.to(`game:${gameId}`).emit('phase-changed', {
      phase: newState.phase,
      previousPhase: oldState.phase
    });
  }

  // Check for turn change
  const getPlayerId = (state: ExtendedGameState): string => {
    if (state.phase === 'worker_placement' && state.workerPlacement?.placementOrder) {
      return state.workerPlacement.placementOrder[state.workerPlacement.currentPlacerIndex || 0];
    }
    return state.playerOrder[state.currentPlayerIndex];
  };

  const oldPlayerId = getPlayerId(oldState);
  const newPlayerId = getPlayerId(newState);

  if (oldPlayerId !== newPlayerId) {
    // Broadcast turn change to all
    io.to(`game:${gameId}`).emit('turn-changed', {
      currentPlayerId: newPlayerId,
      phase: newState.phase
    });

    // Notify the new current player it's their turn
    const players = gamePresence.get(gameId);
    if (players && players.has(newPlayerId)) {
      const socketId = players.get(newPlayerId)!;
      io.to(socketId).emit('your-turn');
    }
  }
}

/**
 * Broadcast game started event to both lobby and game rooms
 */
function broadcastGameStarted(io: SocketIOServer, gameId: string, state: GameState): void {
  // Notify lobby room
  const lobbyRoom = io.sockets.adapter.rooms.get(`lobby:${gameId}`);
  if (lobbyRoom) {
    for (const socketId of lobbyRoom) {
      const socket = io.sockets.sockets.get(socketId) as GameSocket | undefined;
      if (socket && socket.playerId) {
        socket.emit('game-started', {
          state: filterStateForPlayer(state, socket.playerId)
        });
        // Move socket from lobby to game room
        socket.leave(`lobby:${gameId}`);
        socket.join(`game:${gameId}`);
        socket.inLobby = false;
      }
    }
  }

  // Also notify game room (for any direct connections)
  const gameRoom = io.sockets.adapter.rooms.get(`game:${gameId}`);
  if (gameRoom) {
    for (const socketId of gameRoom) {
      const socket = io.sockets.sockets.get(socketId) as GameSocket | undefined;
      if (socket && socket.playerId) {
        socket.emit('game-started', {
          state: filterStateForPlayer(state, socket.playerId)
        });
      }
    }
  }
}

/**
 * Broadcast lobby update (player joined/left, faction changed)
 */
function broadcastLobbyUpdate(io: SocketIOServer, gameId: string, game: Game): void {
  io.to(`lobby:${gameId}`).emit('lobby-update', {
    game: {
      id: game.id,
      name: game.name,
      status: game.status,
      host_id: game.host_id,
      current_player_count: game.current_player_count,
      max_players: game.max_players,
      players: game.players
    }
  });
}

export {
  initializeSocket,
  broadcastStateUpdate,
  broadcastGameStarted,
  broadcastLobbyUpdate,
  broadcastPresence
};

// CommonJS compatibility
module.exports = {
  initializeSocket,
  broadcastStateUpdate,
  broadcastGameStarted,
  broadcastLobbyUpdate,
  broadcastPresence
};
