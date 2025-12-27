# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a board game design project for **UP SHIP!**, a strategy game about airship conglomerates during the Golden Age of Airships (1900-1937). Players act as Directors of rival airship companies representing Germany, Britain, the United States, and Italy, competing across three historical Ages.

The project includes game rules design and an online implementation.

## Deployment

- **Production URL**: https://upship-production.up.railway.app
- **Hosting**: Railway (auto-deploys from GitHub on push to main)
- **Health Check**: https://upship-production.up.railway.app/health

## Test Credentials

For testing the production site:
- **Username**: testpilot42
- **Password**: airship123

## Testing with Claude in Chrome

Use the Claude in Chrome MCP browser automation tools to test the production site:

### Getting Started
1. Call `mcp__claude-in-chrome__tabs_context_mcp` first to see available tabs
2. Create a new tab with `mcp__claude-in-chrome__tabs_create_mcp` if needed
3. Navigate to the production URL with `mcp__claude-in-chrome__navigate`

### Common Testing Tasks
- **Take screenshots**: `mcp__claude-in-chrome__computer` with `action: "screenshot"`
- **Find elements**: `mcp__claude-in-chrome__find` with natural language queries
- **Fill forms**: `mcp__claude-in-chrome__form_input` with element ref from find/read_page
- **Click buttons**: `mcp__claude-in-chrome__computer` with `action: "left_click"` or use ref
- **Read page structure**: `mcp__claude-in-chrome__read_page` for accessibility tree

### Troubleshooting Deployments
1. Navigate to https://railway.com/ and log in
2. Go to the Upship project dashboard
3. Click "Logs" tab to check for errors
4. Look for migration errors, startup failures, or runtime exceptions
5. Check "Architecture" tab to see if services are online/deploying

## Tech Stack

- **Backend:** Node.js 18+ with Express
- **Database:** PostgreSQL with JSONB for game state
- **Session:** express-session with connect-pg-simple
- **Frontend:** Vanilla HTML/CSS/JavaScript (no framework)
- **Real-time:** Polling every 2 seconds (WebSocket integration planned)
- **Hosting:** Railway with auto-deploy from GitHub

## Commands

```bash
npm install              # Install dependencies
npm start                # Production server on port 3000
npm run dev              # Development with auto-reload (--watch)
npm run migrate          # Run pending database migrations
npm run migrate:down     # Rollback last migration
npm run migrate:status   # Check migration status
npm run cli -- <args>    # Run CLI tool (see below)
```

## CLI Tool

A command-line client for rapid playtesting via the REST API. Supports multiple simultaneous user sessions by storing session tokens in `.upship-sessions/`.

### Quick Start

```bash
# Login (stores session token)
npm run cli -- login testpilot42 airship123

# All subsequent commands use username as first argument
npm run cli -- testpilot42 games          # List games
npm run cli -- testpilot42 create "Test"  # Create game
npm run cli -- testpilot42 state <gameId> # View game state
npm run cli -- testpilot42 endturn <id>   # End turn
```

### Session Management

```bash
npm run cli -- login <username> <password>    # Login and store session
npm run cli -- register <username> <password> # Create account
npm run cli -- sessions                       # List active sessions
npm run cli -- <user> logout                  # End session
```

### Game Lobby

```bash
npm run cli -- <user> games [mine|waiting|active|all]
npm run cli -- <user> create <name>
npm run cli -- <user> join <gameId>
npm run cli -- <user> faction <gameId> <germany|britain|usa|italy>
npm run cli -- <user> start <gameId>
```

### Game Actions

```bash
npm run cli -- <user> state <gameId>      # View full state
npm run cli -- <user> blueprint <gameId>  # View blueprint
npm run cli -- <user> endturn <gameId>    # End turn
npm run cli -- <user> buygas <id> hydrogen 2
npm run cli -- <user> build <gameId> 1
npm run cli -- <user> action <gameId> <ACTION_TYPE> [key=value ...]
```

Use `npm run cli -- help` for complete command reference.

## Application Structure

```
server/
├── index.js              # Express app setup, middleware, route mounting
├── auth/index.js         # Session middleware, bcrypt helpers, requireAuth
├── db/
│   ├── index.js          # PostgreSQL connection pool
│   ├── migrate.js        # Migration runner
│   └── migrations/       # SQL migration files (001_, 002_, etc.)
├── routes/
│   ├── auth.js           # POST /api/auth/register, login, logout, GET /me
│   ├── games.js          # Game lobby CRUD, join/leave, faction selection
│   └── gameState.js      # Game state API, action processing (25+ action types)
├── services/
│   ├── userService.js    # User registration, login, lookup
│   ├── gameService.js    # Game CRUD, lobby operations, transactions
│   └── gameStateService.js  # State init, persistence, faction configs
└── data/
    ├── upgrades.js       # Upgrade definitions, tech bag, ship stat calculations
    └── groundBoard.js    # Worker placement locations, card symbols
public/
├── index.html            # Lobby page (auth, game list, create/join)
└── game.html             # Game board UI with inline JavaScript
cli/
└── upship.js             # Command-line playtesting tool
spec/                     # Game rules documentation
plans/                    # Implementation plans (see overview.md for status)
```

## Architecture

### Data Flow

```
Browser (fetch) → Express Routes → Service Layer → PostgreSQL
                                                      ↓
                      DOM Update ← JSON Response ← JSONB State
```

The frontend polls `/api/state/:gameId` every 2 seconds. All game mutations go through `POST /api/state/:gameId/action`.

### Game State (JSONB)

The entire game state is stored as a single JSONB document in `game_states.state`. Key structure:

```javascript
{
  playerOrder: [userId, ...],
  currentPlayerIndex: 0,
  phase: 'planning' | 'actions' | 'launch' | 'income' | 'cleanup',
  turn: 1, round: 1, age: 1,
  players: {
    [userId]: {
      faction, cash, income, pilots, engineers,
      gasCubes: { hydrogen, helium },
      technologies: [], ships: [], routes: [],
      blueprint: { frameSlots, fabricSlots, driveSlots, componentSlots, gasSockets },
      hand: [], deck: [], discardPile: []
    }
  },
  gasMarket: { hydrogen, helium },
  groundBoard: { placements: {} },
  log: []
}
```

### Action Processing

Actions are processed in `server/routes/gameState.js` via `processAction()`:
1. Deep clone current state
2. Validate preconditions
3. Apply action-specific logic
4. Persist new state + action record
5. Return filtered state (hides opponent hands/decks)

Action types include: `END_TURN`, `BUY_GAS`, `INSTALL_UPGRADE`, `BUILD_SHIP`, `LAUNCH_SHIP`, `PLACE_AGENT`, `CLAIM_ROUTE`, `PERFORM_HAZARD_CHECK`, etc.

### Database Patterns

- **Transactions** with `BEGIN/COMMIT/ROLLBACK` for multi-step operations (join game, start game)
- **Row locking** with `FOR UPDATE` to prevent race conditions
- **State versioning** via `game_states.version` counter
- **Audit log** in `game_actions` table for replay/debugging

## Document Structure

- **`spec/upship_rules.md`** - Complete game rules
  - Sections 1-13: Core rules (overview, components, mechanics, factions, setup)
  - Appendix A: TODO list of remaining design work
  - Appendix B: Quick reference/cheat sheet
  - Appendix C: Technology Tiles
  - Appendix D: Upgrade Tiles
  - Appendix E: Hazard Deck
  - Appendix F: Market Deck

## Plans Directory

Design documents and reviews are organized in `plans/`:

- **Active plans**: `plans/*.md` - Current design work
- **Archived plans**: `plans/archive/*.md` - Completed or superseded documents
- **Naming convention**: `YYYY-MM-DD_DESCRIPTION.md`

## Implementation Roadmap

See `plans/overview.md` for the 27-phase implementation plan tracking progress from foundation to polish.

## Available Commands

- `/go-upship` - Continue implementation by working on the next unfinished phase
- `/review-rules` - Conducts a comprehensive rules review using the boardgame-design skill

## Available Skills

**Game Design:**
- `boardgame-design` - Game mechanics, balance analysis, rules clarity, Eurogame principles

**Development:**
- `realtime-multiplayer` - Socket.io, state sync, reconnection, room management
- `game-state` - Reducers, validation, phase management, undo/redo
- `game-database` - PostgreSQL schemas, JSONB, transactions, migrations
- `board-game-ui` - SVG boards, drag-drop, responsive layouts, animations

## Utility Scripts

```bash
# Fix UTF-8 encoding corruption (creates backup automatically)
./scripts/fix-encoding.sh [file.md]
```

## Working with This Project

### When Editing Rules
- Cross-references use section numbers frequently
- Key interconnected sections to keep consistent:
  - Section 3.2 (Blueprint mechanics) ↔ Section 4 (Technology/Upgrade System)
  - Section 6 (Game Loop phases) ↔ Section 7 (Building and Launching)
  - Appendix C/D (Tile specs) ↔ Section 4 (System descriptions)
- When mechanics change, update all related sections and Appendix A TODO list

### Design Philosophy
- **Engineering Reality**: Physics (Lift vs Weight) is the core constraint
- **Industrial Management**: Blueprint represents factory capability, not individual ships
- **Historical Narrative**: Three Ages mirror actual airship history
- **Risk Management**: Hazard Checks make every launch uncertain

### Proposing Changes
When suggesting mechanical changes:
1. Identify which sections are affected
2. Check for ripple effects across interconnected systems
3. Update Appendix A TODO list if design gaps are identified
4. Consider faction balance implications
5. Verify thematic consistency with historical airship era

## Key Design Principles

1. **No Direct Attacks**: Players cannot sabotage opponents' ships; competition is positional
2. **Eurogame Philosophy**: Strategy over luck, no player elimination, multiple paths to victory
3. **Faction Asymmetry**: Each nation has unique advantages and constraints
4. **Network Connectivity**: Rules vary by Age for where ships can launch
