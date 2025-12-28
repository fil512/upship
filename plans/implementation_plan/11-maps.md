# Phase 11: Map Boards

## Overview
Implement the map boards showing routes between cities that players can claim with their ships.

## Goals
- [x] Display Age I map with cities and routes
- [x] Show route requirements (distance, income)
- [x] Implement LAUNCH_SHIP action
- [x] Implement route claiming mechanics
- [x] Display claimed routes with player colors
- [x] Track route income bonuses

## Implementation

### Map Display
- SVG-based route visualization
- Cities as nodes with names
- Routes as connections with distance/income labels
- Color-coded claimed routes by player

### Launch Ship Action
- Requires ship in hangar
- Requires sufficient gas cubes loaded
- Requires Lift >= Weight check
- Ship moves from hangar to route

### Route Claiming
- Ship must meet route requirements (distance = range)
- Claims route for income bonus
- Ship stays on route until returned or crashed

### Age Progression
- Age II map unlocks at progress threshold
- Age III map unlocks later
- Each age has different routes and requirements

## Next Steps
- Phase 12: Technologies
