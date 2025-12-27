# UP SHIP! Online Implementation Plan

This document tracks the implementation of UP SHIP! as an online multiplayer board game.

## Status Legend

| Symbol | Meaning |
|--------|---------|
| [ ] | Not started |
| [~] | In progress |
| [x] | Complete |

---

## Implementation Phases

### Phase 1: Foundation

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [01-setup.md](01-setup.md) | Project setup, tech stack, Railway deployment |
| [x] | [02-database.md](02-database.md) | Database schema and ORM setup |
| [x] | [03-auth.md](03-auth.md) | User authentication and sessions |

### Phase 2: Game Lobby

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [04-lobby.md](04-lobby.md) | Create/join games, player matchmaking |
| [x] | [05-game-state.md](05-game-state.md) | Core game state management and persistence |

### Phase 3: Player Board

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [06-player-board.md](06-player-board.md) | Player board UI layout and zones |
| [x] | [07-blueprint.md](07-blueprint.md) | Blueprint system with upgrade slots |
| [x] | [08-economy.md](08-economy.md) | Cash, income tracks, loans |

### Phase 4: Shared Boards

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [09-ground-board.md](09-ground-board.md) | Worker placement board and actions |
| [x] | [10-rd-board.md](10-rd-board.md) | R&D board and technology market |
| [x] | [11-maps.md](11-maps.md) | Map boards for all three Ages |

### Phase 5: Core Mechanics

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [12-technologies.md](12-technologies.md) | Technology acquisition and Drawing Office |
| [x] | [13-upgrades.md](13-upgrades.md) | Upgrade tiles and installation |
| [x] | [14-ships.md](14-ships.md) | Ship building, hangars, and launching |
| [x] | [15-routes.md](15-routes.md) | Route claiming and requirements |

### Phase 6: Advanced Systems

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [16-hazards.md](16-hazards.md) | Hazard deck and hazard checks |
| [x] | [17-cards.md](17-cards.md) | Deck building and market cards |
| [x] | [18-crew.md](18-crew.md) | Pilots, Engineers, and crew management |

### Phase 7: Game Flow

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [19-rounds.md](19-rounds.md) | Round structure and phase management |
| [x] | [20-ages.md](20-ages.md) | Age transitions and progress track |
| [x] | [21-scoring.md](21-scoring.md) | Victory points and end game |

### Phase 8: Multiplayer

| Status | Plan | Description |
|--------|------|-------------|
| [~] | [22-realtime.md](22-realtime.md) | WebSocket integration for real-time play |
| [x] | [23-turns.md](23-turns.md) | Turn management and timeouts |

### Phase 9: Factions

| Status | Plan | Description |
|--------|------|-------------|
| [x] | [24-factions.md](24-factions.md) | Faction-specific abilities and asymmetry |

### Phase 10: Polish

| Status | Plan | Description |
|--------|------|-------------|
| [ ] | [25-tutorial.md](25-tutorial.md) | New player tutorial and rules reference |
| [ ] | [26-ui-polish.md](26-ui-polish.md) | Animations, sound, visual polish |
| [ ] | [27-testing.md](27-testing.md) | Comprehensive testing and bug fixes |

---

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (via Railway)
- **Real-time:** Socket.io
- **Frontend:** React (or vanilla JS initially)
- **Hosting:** Railway (auto-deploy from GitHub)

---

## Current Session

**Active Plan:** 16-hazards.md

**Next Plan:** 17-cards.md

---

## Notes

- Each plan file contains detailed implementation steps for one session
- Plans may be split or combined based on complexity discovered during implementation
- Update status markers in this file as plans are completed
