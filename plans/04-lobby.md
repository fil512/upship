# Phase 04: Game Lobby

## Overview

Implement a game lobby system where authenticated users can create new games, browse open games, and join games waiting for players. This is the gateway to multiplayer gameplay.

## Prerequisites

- [x] Phase 01 complete (Express server deployed)
- [x] Phase 02 complete (Database with users table)
- [x] Phase 03 complete (User authentication)

## Goals

- [ ] Create games database table with proper schema
- [ ] Create game_players junction table for player-game relationships
- [ ] Implement API endpoints for game CRUD operations
- [ ] Build lobby UI showing available games
- [ ] Add game creation flow with settings
- [ ] Implement join game functionality
- [ ] Add game status management (waiting, in_progress, completed)

## Implementation Steps

### Step 1: Create Database Migrations

Create `server/db/migrations/003_games.sql`:

```sql
-- Games table
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  host_id INTEGER NOT NULL REFERENCES users(id),
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 4,
  current_player_count INTEGER NOT NULL DEFAULT 1,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_player_counts CHECK (min_players >= 2 AND max_players <= 4 AND min_players <= max_players)
);

-- Game players junction table
CREATE TABLE game_players (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  faction VARCHAR(20),
  player_order INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, faction),
  CONSTRAINT valid_faction CHECK (faction IS NULL OR faction IN ('germany', 'britain', 'usa', 'italy'))
);

-- Indexes for common queries
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_host ON games(host_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);
```

### Step 2: Create Game Service

Create `server/services/gameService.js`:

```javascript
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
           array_agg(json_build_object('id', gp.user_id, 'username', pu.username, 'faction', gp.faction)) as players
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
            array_agg(json_build_object(
              'id', gp.user_id,
              'username', pu.username,
              'faction', gp.faction,
              'playerOrder', gp.player_order
            ) ORDER BY gp.player_order) as players
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
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
    return getGameById(gameId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
```

### Step 3: Create Game Routes

Create `server/routes/games.js`:

```javascript
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../auth');
const gameService = require('../services/gameService');

// All game routes require authentication
router.use(requireAuth);

// List games (with optional status filter)
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'waiting',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    const games = await gameService.getGames(filters);
    res.json({ games });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to get games' });
  }
});

// Get my games
router.get('/mine', async (req, res) => {
  try {
    const games = await gameService.getUserGames(req.session.userId);
    res.json({ games });
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({ error: 'Failed to get your games' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await gameService.getGameById(parseInt(req.params.id));
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ game });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
});

// Create game
router.post('/', async (req, res) => {
  const { name, settings } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Game name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Game name must be 100 characters or less' });
  }

  try {
    const game = await gameService.createGame(req.session.userId, name.trim(), settings);
    res.status(201).json({ game });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join game
router.post('/:id/join', async (req, res) => {
  try {
    const game = await gameService.joinGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Join game error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Leave game
router.post('/:id/leave', async (req, res) => {
  try {
    const game = await gameService.leaveGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Leave game error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: error.message });
  }
});

// Select faction
router.post('/:id/faction', async (req, res) => {
  const { faction } = req.body;
  const validFactions = ['germany', 'britain', 'usa', 'italy'];

  if (!faction || !validFactions.includes(faction)) {
    return res.status(400).json({ error: 'Invalid faction. Must be: germany, britain, usa, or italy' });
  }

  try {
    const game = await gameService.selectFaction(parseInt(req.params.id), req.session.userId, faction);
    res.json({ game });
  } catch (error) {
    console.error('Select faction error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Faction already taken' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Start game (host only)
router.post('/:id/start', async (req, res) => {
  try {
    const game = await gameService.startGame(parseInt(req.params.id), req.session.userId);
    res.json({ game });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 4: Update Server Index

Add game routes to `server/index.js`:

```javascript
const gameRoutes = require('./routes/games');

// ... after auth routes
app.use('/api/games', gameRoutes);
```

### Step 5: Create Lobby UI

Update `public/index.html` to add lobby interface:

- Show lobby after login (replace status section)
- List open games with join buttons
- "Create Game" button and modal
- "My Games" section showing active/waiting games
- Game detail view showing players and faction selection

Create `public/js/lobby.js`:

- Fetch and display game list
- Create game form handler
- Join/leave game functionality
- Faction selection UI
- Start game button (for host)

### Step 6: Add CSS for Lobby

Style the lobby interface:
- Game list cards
- Create game modal
- Faction selection buttons with flags
- Player list in game detail
- Responsive layout

## Files to Create/Modify

- `server/db/migrations/003_games.sql` - Games and game_players tables
- `server/services/gameService.js` - Game business logic
- `server/routes/games.js` - Game API endpoints
- `server/index.js` - Mount game routes
- `public/index.html` - Add lobby UI
- `public/css/lobby.css` - Lobby styles (optional, can inline)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/games` | List games (filter by status) |
| GET | `/api/games/mine` | Get user's games |
| GET | `/api/games/:id` | Get single game details |
| POST | `/api/games` | Create new game |
| POST | `/api/games/:id/join` | Join a game |
| POST | `/api/games/:id/leave` | Leave a game |
| POST | `/api/games/:id/faction` | Select faction |
| POST | `/api/games/:id/start` | Start game (host only) |

## Testing

1. **Game Creation:**
   - Create a game with name and settings
   - Verify game appears in list
   - Verify host is automatically added as player

2. **Join/Leave:**
   - Join an open game
   - Verify player count updates
   - Leave game, verify count decreases
   - Host leaves → game cancelled

3. **Faction Selection:**
   - Select a faction
   - Verify faction shows in player list
   - Try selecting taken faction → error

4. **Start Game:**
   - Try start with too few players → error
   - Try start without all factions selected → error
   - Host starts with valid setup → status changes to in_progress

5. **Validation:**
   - Create game without name → error
   - Join full game → error
   - Join game already in → error
   - Non-host tries to start → error

## Notes

- Games use optimistic locking with transactions for race conditions
- Player count is denormalized for query performance
- Faction selection uses unique constraint for automatic conflict handling
- Host leaving cancels the game (could make another player host in future)
- Settings stored as JSONB for flexibility (future: time limits, variant rules)
