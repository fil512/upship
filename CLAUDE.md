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

## Superuser Account

For viewing any game state (debugging/playtesting):
- **Username**: superuser
- **Password**: superuser123

The superuser can bypass the "must be a player" check to view any game's state.

## Browser Testing (MCP)

Browser UI playtesting uses Chrome DevTools MCP:
- `/playtest-ui` - Full game playtest: creates a game with 3 server bots, plays through the UI until completion or stuck. If stuck, investigates and fixes the issue.

See `.claude/commands/playtest-ui.md` for detailed instructions.

## Troubleshooting Deployments

**Using the Railway CLI script (preferred):**
```bash
python scripts/railway.py status        # Quick status check with health
python scripts/railway.py logs -n 100   # View recent deployment logs
python scripts/railway.py deployments   # List recent deployments
python scripts/railway.py getvar        # Check environment variables
```

**Via Railway Dashboard:**
1. Navigate to https://railway.com/ and log in
2. Go to the Upship project dashboard
3. Click "Logs" tab to check for errors
4. Look for migration errors, startup failures, or runtime exceptions
5. Check "Architecture" tab to see if services are online/deploying

## Tech Stack

- **Backend:** Node.js 18+ with Express + Socket.io
- **Database:** PostgreSQL with JSONB for game state
- **Session:** express-session with connect-pg-simple
- **Frontend:** SvelteKit + TypeScript (in `web/` directory)
- **Real-time:** Socket.io for push-based updates
- **Hosting:** Railway with auto-deploy from GitHub

## Commands

```bash
npm install              # Install all dependencies (including web/)
npm run build            # Build SvelteKit frontend for production
npm start                # Production server on port 3000 (serves SvelteKit build)
npm run dev              # Development with auto-reload (--watch)
npm run dev:local        # Development with local .env.development
npm run dev:web          # Run SvelteKit dev server (port 5173)
npm run dev:all          # Run both servers concurrently
npm run migrate          # Run pending database migrations
npm run migrate:down     # Rollback last migration
npm run migrate:status   # Check migration status
npm run migrate:local    # Run migrations against local DB
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix lint issues
npm run code-cleanup     # Find duplicate functions, code smells (SonarJS)
npm test                 # Run Jest tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
```

## Local Development Setup

Quick start (one command):
```bash
npm run dev:setup        # Starts DB, runs migrations, starts dev server
```

Or step-by-step:
```bash
npm run db:up            # Start PostgreSQL in Docker
npm run migrate:local    # Run migrations against local DB
npm run dev:local        # Start server with local env (auto-reload)
```

Stop the database:
```bash
npm run db:down          # Stop and remove PostgreSQL container
```

## Testing

```bash
npm test                                    # Run all tests
npm test -- --watch                         # Watch mode
npm test -- __tests__/unit/rules/hazards.test.js  # Run single file
npm test -- --testNamePattern="hazard"      # Run tests matching pattern
npm test -- --coverage                      # With coverage report
```

Tests are in `__tests__/unit/` with fixtures in `__tests__/fixtures/`.

Global test helpers (defined in `__tests__/setup.js`):
- `createMockPool()` - Mock PostgreSQL pool
- `createMockClient()` - Mock client for transactions
- `createMockRequest(overrides)` - Mock Express request
- `createMockResponse()` - Mock Express response

## Pre-Push Validation

**IMPORTANT**: Claude must NEVER call `git push` directly. Always use the `/push` command instead, which runs lint and tests before pushing.

## Playtesting (NEVER use CLI)

**CRITICAL**: Claude must NEVER use `npm run cli` or `npm run cli:local`. These commands require permission prompts and cause interruptions. **Always use the Python playtest tool instead** (`python -m playtest`), which runs without any permission prompts.

If you need functionality that doesn't exist in the playtest tool, **add it to the playtest tool** rather than using the CLI.

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
web/                       # SvelteKit frontend
├── src/
│   ├── lib/
│   │   ├── components/   # Svelte components (blueprint, cards, ships, sidebar)
│   │   ├── stores/       # State management (auth, gameState, socket, ui)
│   │   └── types/        # TypeScript types (game, actions, socket)
│   └── routes/
│       ├── +page.svelte         # Lobby page
│       └── game/[id]/+page.svelte  # Game board
├── build/                # Production build (generated by npm run build)
├── package.json
└── vite.config.ts        # Vite proxy config for API (dev only)
playtest/                  # Python playtest tool (ALWAYS use this, never CLI)
├── __main__.py           # Entry point
├── client.py             # HTTP client wrapper
├── state.py              # Game state accessors
├── strategy.py           # Bot decision logic
├── phases.py             # Phase handlers
├── autoplay.py           # Main game loop
└── config.py             # Configuration
spec/                     # Game rules documentation
plans/                    # Implementation plans (see overview.md for status)
```

## Architecture

### Data Flow

**Development:**
```
SvelteKit (5173) → Vite Proxy → Express API (3000) → PostgreSQL
      ↑                              ↓
      └──── Socket.io ←──────────────┘
```

**Production:**
```
Browser → Express (3000) → SvelteKit Handler → PostgreSQL
              ↓                    ↑
              └── Socket.io ───────┘
```

In production, Express serves the SvelteKit build directly using `adapter-node`'s handler. The SvelteKit frontend connects via Socket.io for real-time updates. Game actions are sent through Socket.io and broadcast to all players in the game room. The REST API remains available for the playtest tool.

### Game State (JSONB)

The entire game state is stored as a single JSONB document in `game_states.state`. Key structure:

```javascript
{
  playerOrder: [userId, ...],
  currentPlayerIndex: 0,
  phase: 'worker_placement' | 'reveal' | 'income_cleanup',
  turn: 1, round: 1, age: 1,
  players: {
    [userId]: {
      faction, cash, income, officers, engineers,
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

Action types include: `END_TURN`, `BUY_GAS`, `INSTALL_UPGRADE`, `BUILD_SHIP`, `LAUNCH_SHIP`, `PLACE_AGENT`, `CLAIM_ROUTE`, etc. Note: Hazard checks happen automatically when a ship is launched.

### Database Patterns

- **Transactions** with `BEGIN/COMMIT/ROLLBACK` for multi-step operations (join game, start game)
- **Row locking** with `FOR UPDATE` to prevent race conditions
- **State versioning** via `game_states.version` counter
- **Audit log** in `game_actions` table for replay/debugging

### State Machines (XState)

XState manages complex multi-step action flows in `server/machines/`. Used for:
- Player turn state (tracking multi-step actions like worker placement → location action)
- Phase transitions requiring intermediate states
- Actions that need user confirmation or additional input mid-flow

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

- `/push` - Safe git push that runs lint and tests first; blocks push if either fails
- `/go-upship` - Continue implementation by working on the next unfinished phase
- `/fix-gaps` - Fix up to 10 gaps from `plans/gaps.md` using TDD (write failing test, verify fail, fix, verify pass)
- `/find-gaps` - Systematically analyze spec vs server code to find implementation gaps; stops at 10 gaps; tracks progress in `plans/gaps.md`
- `/resolve-gaps` - Continuously loop between `/find-gaps` and `/fix-gaps` in subcontexts until all gaps are resolved
- `/review-rules` - Conducts a comprehensive rules review using the boardgame-design skill
- `/playtest-rest` - Run a full automated playtest against the local dev server (http://localhost:3000)
- `/playtest-ui` - Create a game with 3 server bots, play through UI until completion; if stuck, fix the issue and retry
- `/play-with-me` - Interactive game where you (kenny) play Britain and Claude controls Germany, USA, Italy via browser

## Available Skills

**Game Design:**
- `boardgame-design` - Game mechanics, balance analysis, rules clarity, Eurogame principles

**Development:**
- `svelte` - Svelte components, stores, reactivity, SvelteKit, WebSocket integration
- `realtime-multiplayer` - Socket.io, state sync, reconnection, room management
- `game-state` - Reducers, validation, phase management, undo/redo
- `game-database` - PostgreSQL schemas, JSONB, transactions, migrations
- `board-game-ui` - SVG boards, drag-drop, responsive layouts, animations
- `ui-design-expert` - Visual polish, colors, typography, CSS patterns, screenshot review

## Utility Scripts

### Railway Management

Requires `RAILWAY_TOKEN` environment variable (create at https://railway.com/account/tokens):

```bash
python scripts/railway.py status              # Check deployment status + health
python scripts/railway.py logs [-n 50]        # View deployment logs
python scripts/railway.py deployments         # List recent deployments
python scripts/railway.py setvar KEY VALUE    # Set environment variable (triggers deploy)
python scripts/railway.py getvar              # List all environment variables
python scripts/railway.py delvar KEY          # Delete environment variable
python scripts/railway.py redeploy            # Trigger new deployment
python scripts/railway.py health              # Check health endpoint
```

### Encoding Fix

```bash
# Fix UTF-8 encoding corruption (creates backup automatically)
./scripts/fix-encoding.sh [file.md]
```

### Python Playtest Tool (REQUIRED - Never Use CLI)

The Python playtest tool provides autonomous playtesting with 4 strategic bot players.
It runs until the game **finishes** or gets **stuck** (detecting design flaws).

**Claude must ALWAYS use this tool instead of the CLI.** If a command is missing, add it to the playtest tool.

```bash
python -m playtest setup                     # Setup new 4-player game (all AI)
python -m playtest setup-interactive         # Setup game for kenny + 3 AI players
python -m playtest autoplay                  # Run until game ends or gets stuck
python -m playtest autoplay [num_turns]      # Run for N turns max
python -m playtest status [player]           # Show game status
python -m playtest summary                   # Show all players' status table
python -m playtest endphase                  # All players end turn/pass
python -m playtest action <player> <cmd>     # Run single action
python -m playtest debug                     # Show raw game state
python -m playtest gameid                    # Print current game ID
python -m playtest routes                    # Show available routes
python -m playtest launch <player> <shipId> <routeId> [gas]  # Launch ship
python -m playtest tail [num_lines]          # Show last N lines of playtest log
python -m playtest output [num_lines]        # Show Claude background task output
```

**Features:**
- Game end detection (winner/scores when game finishes)
- Stuck detection with verbose diagnostics (identifies design flaws)
- Strategic bot logic (prioritizes building, launching, resources)
- Correct phase handling (worker_placement, reveal, income_cleanup)
- Runs without permission prompts (unlike CLI)

## Working with This Project

### Icons in the Web Interface

When the web interface requires an icon, **always use icons from `web/src/lib/icons/svg/`**. See `web/src/lib/icons/svg/README.md` for the complete reference of available icons and their intended usage.

Key icon categories:
- **Resources**: `cash.svg`, `income.svg`, `officers.svg`, `engineers.svg`, `hydrogen.svg`, `helium.svg`, `vp.svg`, `research.svg`, `influence.svg`
- **Card Symbols**: `wrench.svg` (technical), `coin.svg` (business), `propeller.svg` (operations), `any.svg` (wild)
- **Factions**: `germany.svg`, `britain.svg`, `usa.svg`, `italy.svg`
- **Ship Stats**: `lift.svg`, `weight.svg`, `speed.svg`, `range.svg`, `ceiling.svg`, `reliability.svg`, `luxury.svg`
- **Game Mechanics**: `ship.svg`, `launch.svg`, `route.svg`, `technology.svg`, `upgrade.svg`, `hazard.svg`, `insurance.svg`, `blueprint.svg`, `eye.svg`, `gas.svg`

Icon requirements:
- All icons use `viewBox="0 0 24 24"` (24×24 design grid)
- Colors are baked into SVGs except player-colored icons which use `currentColor`
- Design for legibility at 10px (smallest display size)

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
