# Phase 09: Ground Board (Worker Placement)

## Overview
Implement the Ground Board with 12 action spaces for worker placement.

## Goals
- [x] Create Ground Board data with 12 action spaces
- [x] Implement agent placement tracking
- [x] Add action handlers for each location
- [x] Create Ground Board UI component
- [x] Implement card symbol requirements
- [x] Add place/recall agent actions

## Ground Board Locations

| # | Name | Symbol | Action |
|---|------|--------|--------|
| 1 | Research Institute | Propeller | Buy Research for £3 each |
| 2 | Design Bureau | Wrench | Install/remove upgrades (2 swaps) |
| 3 | Construction Hall | Wrench | Build ships (pay Hull Cost) |
| 4 | Launchpad | Propeller | Launch ships from hangar |
| 5 | Academy | Coin | Recruit crew (£2/Pilot, £4/Engineer) |
| 6 | Flight School | Coin | +1 Pilot Income (£5) |
| 7 | Technical Institute | Wrench | +1 Engineer Income (£6) |
| 8 | The Bank | Coin | Take loan (£30, -3 Income) |
| 9 | Ministry | Propeller | Draw 2/discard 1, go first, -1 He price |
| 10 | Gas Depot | Wrench | Buy gas (H:£1, He:market) |
| 11 | Insurance Bureau | Coin | Buy insurance (-1 Income/policy) |
| 12 | Weather Bureau | Propeller | Peek at hazard deck (£2) |

## Implementation

### Ground Board Data (`server/data/groundBoard.js`)
- Location definitions with symbol requirements
- Action effects and costs

### Agent Placement State
- Track which agents are placed where
- Track which players have passed
- Available agents per player (3)

### Action Processing
Each location has specific action logic:
- Validate card symbol if required
- Execute action effect
- Update game state

### UI Components
- Ground Board display with 12 spaces
- Agent tokens showing placement
- Click to place agent (opens action dialog)

## Next Steps
- Phase 10: R&D Board
