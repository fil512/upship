# Phase 23: Turn Management and Timeouts

## Overview
Turn management with optional timeouts.

## Goals
- [x] Current player tracking - Already implemented
- [x] END_TURN action - Already implemented
- [x] Turn indicator in UI - Already implemented
- [ ] Optional turn timer
- [ ] Auto-skip on timeout

## Current Implementation
Turn management is functional:
- state.currentPlayerIndex tracks whose turn
- state.playerOrder defines play order
- END_TURN advances to next player
- UI shows "Your Turn" / "Waiting..."

## Future Enhancement
Turn timers can be added later.

## Next Steps
- Phase 24: Factions
