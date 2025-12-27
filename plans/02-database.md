# Phase 02: Database Schema and Setup

## Overview

Set up PostgreSQL database on Railway with a schema optimized for multiplayer board games. Uses a hybrid approach: relational tables for users, games, and players; JSONB for complex game state.

## Prerequisites

- [x] Phase 01 complete (Express server deployed to Railway)

## Goals

- [x] Add PostgreSQL database on Railway
- [x] Create database connection module with pooling
- [x] Implement migration system
- [x] Create core schema (users, games, players, game_states, game_actions)
- [x] Add database health check endpoint
- [ ] Test database connectivity locally and on Railway

## Implementation Steps

### Step 1: Add PostgreSQL to Railway

1. In Railway dashboard, add PostgreSQL plugin to the project
2. Railway auto-generates `DATABASE_URL` environment variable
3. For local development, create `.env` file with local PostgreSQL connection

### Step 2: Install Dependencies

```bash
npm install pg dotenv
```

- `pg`: PostgreSQL client for Node.js
- `dotenv`: Load environment variables from .env file

### Step 3: Create Database Connection Module

Create `server/db/index.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

async function healthCheck() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  } finally {
    client.release();
  }
}

module.exports = { pool, healthCheck };
```

### Step 4: Create Migration System

Create `server/db/migrations/` directory with migration runner and initial schema.

**Migration Runner** (`server/db/migrate.js`):
- Tracks applied migrations in a `migrations` table
- Runs pending migrations in order
- Supports both `up` and `down` operations

**Initial Migration** (`server/db/migrations/001_initial_schema.sql`):

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_guest BOOLEAN DEFAULT false
);

-- Games table (lobby + active games)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  host_id UUID REFERENCES users(id),
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 4,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('waiting', 'in_progress', 'completed', 'abandoned'))
);

-- Game players (join table with faction selection)
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  faction VARCHAR(50),
  seat_position INTEGER,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_ready BOOLEAN DEFAULT false,

  UNIQUE(game_id, user_id),
  UNIQUE(game_id, seat_position),
  UNIQUE(game_id, faction)
);

-- Game state (JSONB for complex state)
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  version INTEGER DEFAULT 1,
  current_player_id UUID REFERENCES users(id),
  phase VARCHAR(50),
  turn_number INTEGER DEFAULT 1,
  age INTEGER DEFAULT 1,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action history (for replay/undo/debugging)
CREATE TABLE game_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB NOT NULL,
  state_version INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_host ON games(host_id);
CREATE INDEX idx_game_players_user ON game_players(user_id);
CREATE INDEX idx_game_players_game ON game_players(game_id);
CREATE INDEX idx_game_actions_game ON game_actions(game_id);
CREATE INDEX idx_game_states_game ON game_states(game_id);
```

### Step 5: Update Server with Database Integration

Modify `server/index.js`:
1. Load environment variables with dotenv
2. Import database module
3. Update health check to include database status
4. Run migrations on startup (optional, can be manual)

### Step 6: Add npm Scripts

Update `package.json`:
```json
{
  "scripts": {
    "migrate": "node server/db/migrate.js",
    "migrate:down": "node server/db/migrate.js down"
  }
}
```

### Step 7: Create .env.example

Document required environment variables:
```
DATABASE_URL=postgresql://user:password@localhost:5432/upship
NODE_ENV=development
```

## Files to Create/Modify

- `server/db/index.js` - Database connection pool
- `server/db/migrate.js` - Migration runner
- `server/db/migrations/001_initial_schema.sql` - Initial schema
- `server/index.js` - Add database integration
- `package.json` - Add dependencies and scripts
- `.env.example` - Document environment variables
- `.gitignore` - Ensure .env is ignored

## Game State JSONB Structure

The `game_states.state` column stores the full game state:

```javascript
{
  "progressTrack": 0,
  "heliumPrice": 5,
  "rdBoard": {
    "available": []  // Technology tile IDs
  },
  "marketRow": [],   // Card IDs
  "groundBoard": {}, // Worker placement state
  "players": {
    "<player_id>": {
      "cash": 15,
      "income": 0,
      "vp": 0,
      "research": 0,
      "pilots": 2,
      "engineers": 2,
      "agents": 3,
      "agentsPlaced": [],
      "technologies": [],
      "blueprint": {
        "age": 1,
        "slots": {}
      },
      "hangar": {
        "launch": [],
        "repair": []
      },
      "gasReserve": {
        "hydrogen": 0,
        "helium": 0
      },
      "deck": [],
      "hand": [],
      "discard": [],
      "routes": []
    }
  }
}
```

## Testing

1. **Local Testing:**
   - Start local PostgreSQL
   - Create database: `createdb upship`
   - Copy `.env.example` to `.env` and update DATABASE_URL
   - Run `npm run migrate`
   - Start server `npm run dev`
   - Check `GET /health` includes database status

2. **Railway Testing:**
   - Push to main branch
   - Check Railway logs for migration output
   - Test production health endpoint

## Notes

- Using UUID for all primary keys (better for distributed systems)
- Guest users supported via `is_guest` flag (no password required)
- Faction uniqueness enforced per game
- Optimistic locking via `version` column in game_states
- SSL enabled for production database connections
