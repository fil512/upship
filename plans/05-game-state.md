# Phase 05: Game State Management

## Overview
Implement core game state management and persistence for in-progress games.

## Goals
- [x] Create game state service with initialization logic
- [x] Implement faction-specific starting configurations
- [x] Create API endpoints for state read/update
- [x] Implement action processing system
- [x] Add action history tracking

## Implementation

### Game State Service (`server/services/gameStateService.js`)
- `initializeGameState(gameId, players)` - Creates initial state when game starts
- `getGameState(gameId)` - Retrieves current state
- `updateGameState(gameId, newState, action)` - Updates state with version tracking
- `getGameActions(gameId, limit)` - Retrieves action history

### Faction Configurations
Each faction has unique starting setup:
- **Germany**: Rigid Frame + Duralumin Girders techs, +1 Structure
- **Britain**: Dining Saloon tech, +1 Luxury
- **USA**: Helium Handling tech, +1 Safety, Helium Monopoly (stable prices)
- **Italy**: Rapid Refit tech, +1 Speed, 4 upgrade swaps

### Initial Player State
- £15 cash, £5 income
- 1 Pilot, 2 Engineers
- 2 Hydrogen gas cubes
- 3 Agent tokens
- Starter deck of 10 cards
- 20-card hazard deck (shuffled)

### API Routes (`server/routes/gameState.js`)
- `GET /api/state/:gameId` - Get current game state (filtered for player)
- `GET /api/state/:gameId/actions` - Get action history
- `POST /api/state/:gameId/action` - Perform a game action

### Supported Actions
- `END_TURN` - End turn and advance to next player
- `BUY_GAS` - Purchase hydrogen/helium from market
- `ACQUIRE_TECHNOLOGY` - Buy technology from R&D board
- `INSTALL_UPGRADE` - Place upgrade on blueprint
- `PLAY_CARD` - Play card from hand
- `DRAW_CARDS` - Draw cards from deck

### State Privacy
- Each player only sees their own hand/deck contents
- Other players' private info shows only counts

## Database Tables Used
- `game_states` - Stores JSONB game state
- `game_actions` - Action history for replay/undo

## Next Steps
- Phase 06: Player Board UI to visualize game state
