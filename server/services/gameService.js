const { pool } = require('../db');

// Create a new game
async function createGame(hostId, name, settings = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the game
    const gameResult = await client.query(
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

// Get list of games (with filters)
async function getGames(filters = {}) {
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

  const conditions = [];
  const params = [];

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

  const result = await pool.query(query, params);
  return result.rows;
}

// Get single game by ID
async function getGameById(gameId) {
  const result = await pool.query(
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

// Join a game
async function joinGame(gameId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check game exists and is waiting
    const gameResult = await client.query(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    if (game.status !== 'waiting') {
      throw new Error('Game is not accepting players');
    }

    if (game.current_player_count >= game.max_players) {
      throw new Error('Game is full');
    }

    // Check if already in game
    const existingPlayer = await client.query(
      'SELECT id FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );

    if (existingPlayer.rows.length > 0) {
      throw new Error('Already in this game');
    }

    // Add player
    const playerOrder = game.current_player_count + 1;
    await client.query(
      `INSERT INTO game_players (game_id, user_id, player_order)
       VALUES ($1, $2, $3)`,
      [gameId, userId, playerOrder]
    );

    // Update player count
    await client.query(
      'UPDATE games SET current_player_count = current_player_count + 1 WHERE id = $1',
      [gameId]
    );

    await client.query('COMMIT');

    client.release();
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }
}

// Leave a game
async function leaveGame(gameId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check game exists and user is in it
    const gameResult = await client.query(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    if (game.status !== 'waiting') {
      throw new Error('Cannot leave a game in progress');
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
        throw new Error('Not in this game');
      }

      // Update player count
      await client.query(
        'UPDATE games SET current_player_count = current_player_count - 1 WHERE id = $1',
        [gameId]
      );
    }

    await client.query('COMMIT');

    client.release();
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }
}

// Select faction
async function selectFaction(gameId, userId, faction) {
  const result = await pool.query(
    `UPDATE game_players
     SET faction = $1
     WHERE game_id = $2 AND user_id = $3
     RETURNING *`,
    [faction, gameId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Not in this game');
  }

  return getGameById(gameId);
}

// Start game (host only)
async function startGame(gameId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gameResult = await client.query(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    if (game.host_id !== userId) {
      throw new Error('Only the host can start the game');
    }

    if (game.status !== 'waiting') {
      throw new Error('Game already started');
    }

    if (game.current_player_count < game.min_players) {
      throw new Error(`Need at least ${game.min_players} players to start`);
    }

    // Check all players have selected factions
    const playersResult = await client.query(
      'SELECT * FROM game_players WHERE game_id = $1',
      [gameId]
    );

    const missingFaction = playersResult.rows.some(p => !p.faction);
    if (missingFaction) {
      throw new Error('All players must select a faction');
    }

    // Start the game
    await client.query(
      `UPDATE games
       SET status = 'in_progress', started_at = NOW()
       WHERE id = $1`,
      [gameId]
    );

    await client.query('COMMIT');

    client.release();
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }
}

// Get games for a specific user
async function getUserGames(userId) {
  const result = await pool.query(
    `SELECT g.*, u.username as host_username
     FROM games g
     JOIN users u ON g.host_id = u.id
     JOIN game_players gp ON g.id = gp.game_id
     WHERE gp.user_id = $1
     ORDER BY g.created_at DESC`,
    [userId]
  );
  return result.rows;
}

module.exports = {
  createGame,
  getGames,
  getGameById,
  joinGame,
  leaveGame,
  selectFaction,
  startGame,
  getUserGames
};
