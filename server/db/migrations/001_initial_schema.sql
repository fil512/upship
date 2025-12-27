-- Initial database schema for UP SHIP! online board game
-- Creates core tables for users, games, players, game state, and action history

-- Users table (supports both registered and guest users)
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
-- Factions: germany, britain, usa, italy
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

-- Game state (JSONB for complex nested state)
-- See plans/02-database.md for state structure documentation
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

-- Action history (for replay, undo, and debugging)
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
CREATE INDEX idx_game_actions_created ON game_actions(created_at);
CREATE INDEX idx_game_states_game ON game_states(game_id);
CREATE INDEX idx_users_username ON users(username);

-- DOWN

-- Rollback: drop all tables in reverse dependency order
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_game_states_game;
DROP INDEX IF EXISTS idx_game_actions_created;
DROP INDEX IF EXISTS idx_game_actions_game;
DROP INDEX IF EXISTS idx_game_players_game;
DROP INDEX IF EXISTS idx_game_players_user;
DROP INDEX IF EXISTS idx_games_host;
DROP INDEX IF EXISTS idx_games_status;

DROP TABLE IF EXISTS game_actions;
DROP TABLE IF EXISTS game_states;
DROP TABLE IF EXISTS game_players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;
