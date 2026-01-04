/**
 * Game Service
 * Handles game lobby operations: create, join, leave, start
 */

import type { Faction, GameState } from '@upship/api';
import type { PoolClient } from 'pg';
import { pool } from '../db';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ConflictError
} from '../errors';

// Use require for circular dependency with gameStateService
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gameStateService = require('./gameStateService');

// Game settings
interface GameSettings {
  minPlayers?: number;
  maxPlayers?: number;
  [key: string]: unknown;
}

// Database game row
interface GameRow {
  id: string;
  name: string;
  host_id: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  min_players: number;
  max_players: number;
  current_player_count: number;
  settings: GameSettings;
  created_at: Date;
  started_at: Date | null;
  host_username?: string;
  players?: GamePlayer[];
  game_state?: GameState;
  my_faction?: Faction;
}

// Game player from database
interface GamePlayerRow {
  id: string;
  game_id: string;
  user_id: string;
  faction: Faction | null;
  player_order: number;
}

// Player info in game response
interface GamePlayer {
  id: string;
  username: string;
  faction: Faction | null;
  playerOrder?: number;
}

// Game with players for API response
interface GameWithPlayers extends Omit<GameRow, 'players'> {
  players: GamePlayer[];
}

// User game with turn info
interface UserGame extends Omit<GameRow, 'game_state'> {
  isMyTurn: boolean;
  age: number | null;
  round: number | null;
}

// Filters for game list
interface GameFilters {
  status?: 'waiting' | 'in_progress' | 'completed';
  limit?: number;
}

// Drop games result
interface DropGamesResult {
  deletedGames: number;
  deletedStates: number;
  deletedActions: number;
  deletedPlayers: number;
}

/**
 * Create a new game
 */
export async function createGame(
  hostId: string,
  name: string,
  settings: GameSettings = {}
): Promise<GameRow> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the game
    const gameResult = await client.query<GameRow>(
      `INSERT INTO games (name, host_id, min_players, max_players, settings)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, hostId, settings.minPlayers || 2, settings.maxPlayers || 4, JSON.stringify(settings)]
    );
    const game = gameResult.rows[0];

    // Add host as first player
    await client.query(
      `INSERT INTO game_players (game_id, user_id, player_order)
       VALUES ($1, $2, 1)`,
      [game.id, hostId]
    );

    await client.query('COMMIT');
    return game;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get list of games (with filters)
 */
export async function getGames(filters: GameFilters = {}): Promise<GameWithPlayers[]> {
  let query = `
    SELECT g.*, u.username as host_username,
           COALESCE(
             json_agg(
               json_build_object('id', gp.user_id, 'username', pu.username, 'faction', gp.faction)
               ORDER BY gp.player_order
             ) FILTER (WHERE gp.user_id IS NOT NULL),
             '[]'
           ) as players
    FROM games g
    JOIN users u ON g.host_id = u.id
    LEFT JOIN game_players gp ON g.id = gp.game_id
    LEFT JOIN users pu ON gp.user_id = pu.id
  `;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`g.status = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY g.id, u.username ORDER BY g.created_at DESC';

  if (filters.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  const result = await pool.query<GameWithPlayers>(query, params);
  return result.rows;
}

/**
 * Get single game by ID
 */
export async function getGameById(gameId: string): Promise<GameWithPlayers | null> {
  const result = await pool.query<GameWithPlayers>(
    `SELECT g.*, u.username as host_username,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', gp.user_id,
                  'username', pu.username,
                  'faction', gp.faction,
                  'playerOrder', gp.player_order
                ) ORDER BY gp.player_order
              ) FILTER (WHERE gp.user_id IS NOT NULL),
              '[]'
            ) as players
     FROM games g
     JOIN users u ON g.host_id = u.id
     LEFT JOIN game_players gp ON g.id = gp.game_id
     LEFT JOIN users pu ON gp.user_id = pu.id
     WHERE g.id = $1
     GROUP BY g.id, u.username`,
    [gameId]
  );
  return result.rows[0] || null;
}

/**
 * Join a game (optionally with faction selection)
 */
export async function joinGame(
  gameId: string,
  userId: string,
  faction: Faction | null = null
): Promise<GameWithPlayers | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check game exists and is waiting
    const gameResult = await client.query<GameRow>(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new NotFoundError('Game');
    }

    const game = gameResult.rows[0];

    if (game.status !== 'waiting') {
      throw new ValidationError('Game is not accepting players');
    }

    if (game.current_player_count >= game.max_players) {
      throw new ValidationError('Game is full');
    }

    // Check if already in game
    const existingPlayer = await client.query(
      'SELECT id FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (existingPlayer.rows.length > 0) {
      throw new ConflictError('Already in this game');
    }

    // If faction provided, check it's not already taken
    if (faction) {
      const existingFaction = await client.query(
        'SELECT user_id FROM game_players WHERE game_id = $1 AND faction = $2',
        [gameId, faction]
      );

      if (existingFaction.rows.length > 0) {
        throw new ConflictError('Faction already taken');
      }
    }

    // Add player (with faction if provided)
    const playerOrder = game.current_player_count + 1;
    await client.query(
      `INSERT INTO game_players (game_id, user_id, player_order, faction)
       VALUES ($1, $2, $3, $4)`,
      [gameId, userId, playerOrder, faction]
    );

    // Update player count
    await client.query(
      'UPDATE games SET current_player_count = current_player_count + 1 WHERE id = $1',
      [gameId]
    );

    await client.query('COMMIT');
    return await getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Leave a game
 */
export async function leaveGame(gameId: string, userId: string): Promise<GameWithPlayers | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check game exists and user is in it
    const gameResult = await client.query<GameRow>(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new NotFoundError('Game');
    }

    const game = gameResult.rows[0];

    if (game.status !== 'waiting') {
      throw new ValidationError('Cannot leave a game in progress');
    }

    // Check if host is leaving
    if (game.host_id === userId) {
      // Cancel the game if host leaves
      await client.query(
        "UPDATE games SET status = 'cancelled' WHERE id = $1",
        [gameId]
      );
    } else {
      // Remove player
      const deleteResult = await client.query(
        'DELETE FROM game_players WHERE game_id = $1 AND user_id = $2',
        [gameId, userId]
      );

      if (deleteResult.rowCount === 0) {
        throw new ForbiddenError('Not in this game');
      }

      // Update player count
      await client.query(
        'UPDATE games SET current_player_count = current_player_count - 1 WHERE id = $1',
        [gameId]
      );
    }

    await client.query('COMMIT');
    return await getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Select faction (with transaction to prevent race conditions)
 */
export async function selectFaction(
  gameId: string,
  userId: string,
  faction: Faction
): Promise<GameWithPlayers | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the game and check status
    const gameResult = await client.query<{ status: string }>(
      'SELECT status FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new NotFoundError('Game');
    }

    if (gameResult.rows[0].status !== 'waiting') {
      throw new ValidationError('Cannot change faction after game has started');
    }

    // Check if faction is already taken by another player (with lock)
    const existingFaction = await client.query(
      `SELECT user_id FROM game_players
       WHERE game_id = $1 AND faction = $2 AND user_id != $3
       FOR UPDATE`,
      [gameId, faction, userId]
    );

    if (existingFaction.rows.length > 0) {
      throw new ConflictError('Faction already taken');
    }

    // Verify user is in this game
    const playerResult = await client.query(
      'SELECT id FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (playerResult.rows.length === 0) {
      throw new ForbiddenError('Not in this game');
    }

    // Update faction
    await client.query(
      'UPDATE game_players SET faction = $1 WHERE game_id = $2 AND user_id = $3',
      [faction, gameId, userId]
    );

    await client.query('COMMIT');
    return await getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Start game (host only)
 */
export async function startGame(gameId: string, userId: string): Promise<GameWithPlayers | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gameResult = await client.query<GameRow>(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new NotFoundError('Game');
    }

    const game = gameResult.rows[0];

    if (game.host_id !== userId) {
      throw new ForbiddenError('Only the host can start the game');
    }

    if (game.status !== 'waiting') {
      throw new ValidationError('Game already started');
    }

    if (game.current_player_count < game.min_players) {
      throw new ValidationError(`Need at least ${game.min_players} players to start`);
    }

    // Check all players have selected factions
    const playersResult = await client.query<GamePlayerRow>(
      'SELECT * FROM game_players WHERE game_id = $1',
      [gameId]
    );

    const missingFaction = playersResult.rows.some(p => !p.faction);
    if (missingFaction) {
      throw new ValidationError('All players must select a faction');
    }

    // Start the game
    await client.query(
      `UPDATE games
       SET status = 'in_progress', started_at = NOW()
       WHERE id = $1`,
      [gameId]
    );

    await client.query('COMMIT');

    // Initialize game state (after transaction commits)
    await gameStateService.initializeGameState(gameId, playersResult.rows);

    return await getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if a user is a player in a game
 */
export async function isPlayerInGame(gameId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2',
    [gameId, userId]
  );
  return result.rows.length > 0;
}

/**
 * Get games for a specific user (with turn info for active games)
 */
export async function getUserGames(userId: string): Promise<UserGame[]> {
  const result = await pool.query<GameRow & { game_state: GameState | null }>(
    `SELECT g.*, u.username as host_username,
            gs.state as game_state,
            gp.faction as my_faction
     FROM games g
     JOIN users u ON g.host_id = u.id
     JOIN game_players gp ON g.id = gp.game_id
     LEFT JOIN game_states gs ON g.id = gs.game_id
     WHERE gp.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId]
  );

  // Process games to add isMyTurn flag and extract game info
  return result.rows.map(game => {
    let isMyTurn = false;
    let age: number | null = null;
    let round: number | null = null;

    if (game.status === 'in_progress' && game.game_state) {
      const state = game.game_state;

      // Extract age and round
      age = state.age || null;
      round = state.round || null;

      // Determine current player based on phase
      if (state.phase === 'worker_placement') {
        // During worker placement, use placementOrder and currentPlacerIndex
        const order = state.workerPlacement?.placementOrder || state.playerOrder;
        const index = state.workerPlacement?.currentPlacerIndex || 0;
        const currentPlayerId = order[index];
        isMyTurn = currentPlayerId === userId;
      } else {
        // Other phases use playerOrder and currentPlayerIndex
        const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
        isMyTurn = currentPlayerId === userId;
      }
    }

    // Remove game_state from response (too large for list view)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { game_state, ...gameWithoutState } = game;
    return { ...gameWithoutState, isMyTurn, age, round };
  });
}

/**
 * Drop all game data (admin/dev only)
 */
export async function dropAllGames(): Promise<DropGamesResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get counts before deletion for reporting
    const gamesCount = await client.query<{ count: string }>('SELECT COUNT(*) FROM games');
    const statesCount = await client.query<{ count: string }>('SELECT COUNT(*) FROM game_states');
    const actionsCount = await client.query<{ count: string }>('SELECT COUNT(*) FROM game_actions');
    const playersCount = await client.query<{ count: string }>('SELECT COUNT(*) FROM game_players');

    // Delete from games - CASCADE will handle game_players, game_states, game_actions
    await client.query('DELETE FROM games');

    await client.query('COMMIT');

    return {
      deletedGames: parseInt(gamesCount.rows[0].count),
      deletedStates: parseInt(statesCount.rows[0].count),
      deletedActions: parseInt(actionsCount.rows[0].count),
      deletedPlayers: parseInt(playersCount.rows[0].count)
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// CommonJS compatibility
module.exports = {
  createGame,
  getGames,
  getGameById,
  joinGame,
  leaveGame,
  selectFaction,
  startGame,
  getUserGames,
  isPlayerInGame,
  dropAllGames
};
