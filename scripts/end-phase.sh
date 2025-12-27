#!/bin/bash
# Have all 4 players end their turn to complete the current phase
# Usage: ./scripts/end-phase.sh <gameId>
# Or:    GAME=<gameId> ./scripts/end-phase.sh

GAME_ID="${1:-$GAME}"
CLI="node cli/upship.js"

if [ -z "$GAME_ID" ]; then
  echo "Usage: ./scripts/end-phase.sh <gameId>"
  echo "   or: GAME=<gameId> ./scripts/end-phase.sh"
  exit 1
fi

PLAYERS=("playtest_germany" "playtest_britain" "playtest_usa" "playtest_italy")

for player in "${PLAYERS[@]}"; do
  $CLI "$player" endturn "$GAME_ID" 2>&1 | grep -E "✓|✗|Phase|Turn" || true
done
