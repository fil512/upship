# Database Best Practices

## Connection Pooling

Always use connection pooling. Never create connections per-request:

```javascript
// db/index.js - Single pool for the application
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // Max connections in pool
  idleTimeoutMillis: 30000,      // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// Log pool errors (don't crash the app)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

module.exports = { pool };
```

## Query Wrapper

Wrap pool.query for logging and metrics:

```javascript
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Query', {
      text: text.substring(0, 50),
      duration,
      rows: result.rowCount
    });
  }

  return result;
}
```

## Transactions

Use transactions for multi-step operations. Always handle rollback:

```javascript
async function createGame(hostId, name, settings = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First operation
    const gameResult = await client.query(
      `INSERT INTO games (name, host_id, settings)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, hostId, JSON.stringify(settings)]
    );
    const game = gameResult.rows[0];

    // Second operation (depends on first)
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
    client.release();  // ALWAYS release, even on error
  }
}
```

### Transaction Gotchas

```javascript
// BAD: Client never released on success path
async function badTransaction() {
  const client = await pool.connect();
  await client.query('BEGIN');
  await client.query('INSERT ...');
  await client.query('COMMIT');
  client.release();  // Never reached if error thrown
}

// BAD: Rollback forgotten
async function forgotRollback() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT ...');
    await client.query('COMMIT');
  } catch (error) {
    // Forgot ROLLBACK - connection left in bad state
    throw error;
  } finally {
    client.release();
  }
}
```

## Row Locking

Use `FOR UPDATE` to prevent race conditions:

```javascript
async function joinGame(gameId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row to prevent concurrent joins
    const gameResult = await client.query(
      'SELECT * FROM games WHERE id = $1 FOR UPDATE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      throw new Error('Game not found');
    }

    const game = gameResult.rows[0];

    // These checks are now safe from race conditions
    if (game.status !== 'waiting') {
      throw new Error('Game is not accepting players');
    }

    if (game.current_player_count >= game.max_players) {
      throw new Error('Game is full');
    }

    // Safe to modify now - other transactions are blocked
    await client.query(
      'INSERT INTO game_players (game_id, user_id) VALUES ($1, $2)',
      [gameId, userId]
    );

    await client.query(
      'UPDATE games SET current_player_count = current_player_count + 1 WHERE id = $1',
      [gameId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Avoiding N+1 Queries

Fetch related data in single queries using JOINs and aggregation:

```javascript
// GOOD: Single query with JOIN and aggregation
async function getGameById(gameId) {
  const result = await pool.query(`
    SELECT g.*,
           u.username as host_username,
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
    GROUP BY g.id, u.username
  `, [gameId]);

  return result.rows[0] || null;
}

// BAD: N+1 pattern - one query per player
async function getGameByIdBad(gameId) {
  const game = await pool.query(
    'SELECT * FROM games WHERE id = $1',
    [gameId]
  );

  const playerIds = await pool.query(
    'SELECT user_id FROM game_players WHERE game_id = $1',
    [gameId]
  );

  // N additional queries!
  const players = await Promise.all(
    playerIds.rows.map(row =>
      pool.query('SELECT * FROM users WHERE id = $1', [row.user_id])
    )
  );

  return { ...game.rows[0], players };
}
```

## Select Only Needed Columns

Avoid `SELECT *` in production code:

```javascript
// GOOD: Explicit columns
const result = await pool.query(
  'SELECT id, username, created_at FROM users WHERE id = $1',
  [userId]
);

// BAD: Fetches password hash and other sensitive/unused data
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

## Dynamic Query Building

Build queries safely with parameterized conditions:

```javascript
async function getGames(filters = {}) {
  let query = `
    SELECT g.*, u.username as host_username
    FROM games g
    JOIN users u ON g.host_id = u.id
  `;

  const conditions = [];
  const params = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`g.status = $${params.length}`);
  }

  if (filters.hostId) {
    params.push(filters.hostId);
    conditions.push(`g.host_id = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY g.created_at DESC';

  if (filters.limit) {
    params.push(filters.limit);
    query += ` LIMIT $${params.length}`;
  }

  const result = await pool.query(query, params);
  return result.rows;
}
```

## Health Checks

Verify database connectivity:

```javascript
async function healthCheck() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database health check failed:', err.message);
    return false;
  } finally {
    if (client) client.release();
  }
}
```

## JSONB for Game State

Store complex state as JSONB:

```javascript
// Store
await client.query(
  `INSERT INTO game_states (game_id, state, version)
   VALUES ($1, $2, 1)`,
  [gameId, JSON.stringify(gameState)]
);

// Update with version check (optimistic locking)
const result = await client.query(
  `UPDATE game_states
   SET state = $1, version = version + 1
   WHERE game_id = $2 AND version = $3
   RETURNING *`,
  [JSON.stringify(newState), gameId, expectedVersion]
);

if (result.rowCount === 0) {
  throw new Error('Concurrent modification detected');
}
```
