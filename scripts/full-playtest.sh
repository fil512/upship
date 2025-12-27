#!/bin/bash
# Run a complete playtest from start to finish
# Usage: ./scripts/full-playtest.sh [num_turns] [game_name]
#
# This script:
# 1. Sets up a new 4-player game
# 2. Runs autoplay for the specified number of turns (default: 10)
# 3. Outputs final game state and summary

set -e

NUM_TURNS="${1:-10}"
GAME_NAME="${2:-Playtest_$(date +%Y%m%d_%H%M%S)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== UP SHIP! Full Playtest ==="
echo "Turns: $NUM_TURNS"
echo "Game: $GAME_NAME"
echo ""

# Step 1: Setup
echo ">>> Setting up game..."
SETUP_OUTPUT=$("$SCRIPT_DIR/setup-playtest.sh" "$GAME_NAME" 2>&1)
echo "$SETUP_OUTPUT"

# Extract game ID
GAME_ID=$(echo "$SETUP_OUTPUT" | grep "^GAME_ID=" | cut -d= -f2)

if [ -z "$GAME_ID" ]; then
  echo "ERROR: Could not extract game ID from setup"
  exit 1
fi

export GAME="$GAME_ID"

echo ""
echo ">>> Game created: $GAME_ID"
echo ""

# Step 2: Autoplay
echo ">>> Running autoplay..."
"$SCRIPT_DIR/autoplay.sh" "$GAME_ID" "$NUM_TURNS"

echo ""
echo "========================================="
echo "PLAYTEST COMPLETE"
echo "========================================="
echo ""
echo "Game ID: $GAME_ID"
echo "Turns played: $NUM_TURNS"
echo ""
echo "To continue this game manually:"
echo "  export GAME=$GAME_ID"
echo "  npm run cli -- playtest_germany state \$GAME"
