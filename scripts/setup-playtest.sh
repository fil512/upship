#!/bin/bash
# Setup a new 4-player playtest game
# Usage: ./scripts/setup-playtest.sh [game_name]
# Output: Exports GAME=<gameId> and prints it for use in subsequent commands

set -e

GAME_NAME="${1:-Playtest_$(date +%Y%m%d_%H%M%S)}"
CLI="node cli/upship.js"
PASSWORD="test123456"

PLAYERS=("playtest_germany" "playtest_britain" "playtest_usa" "playtest_italy")
FACTIONS=("germany" "britain" "usa" "italy")

echo "=== UP SHIP! Playtest Setup ==="
echo ""

# Register/login all players
echo ">>> Logging in players..."
for player in "${PLAYERS[@]}"; do
  # Try login first
  LOGIN_RESULT=$($CLI login "$player" "$PASSWORD" 2>&1)
  if echo "$LOGIN_RESULT" | grep -q "✓"; then
    echo "  $player: logged in"
  else
    # Try to register
    echo "  $player: registering..."
    REG_RESULT=$($CLI register "$player" "$PASSWORD" 2>&1)
    if echo "$REG_RESULT" | grep -q "✓"; then
      echo "  $player: registered"
    else
      echo "  $player: WARNING - $REG_RESULT"
    fi
  fi
done

echo ""
echo ">>> Creating game: $GAME_NAME"
CREATE_OUTPUT=$($CLI playtest_germany create "$GAME_NAME" 2>&1)
echo "$CREATE_OUTPUT" | grep -E "✓|Game ID" || true

# Extract game ID
GAME_ID=$(echo "$CREATE_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')

if [ -z "$GAME_ID" ]; then
  echo "ERROR: Could not extract game ID"
  exit 1
fi

echo ""
echo ">>> Game ID: $GAME_ID"

# Join other players
echo ""
echo ">>> Joining other players..."
for player in "${PLAYERS[@]:1}"; do
  $CLI "$player" join "$GAME_ID" 2>&1 | grep -E "✓|✗" || true
done

# Select factions
echo ""
echo ">>> Selecting factions..."
for i in "${!PLAYERS[@]}"; do
  $CLI "${PLAYERS[$i]}" faction "$GAME_ID" "${FACTIONS[$i]}" 2>&1 | grep -E "✓|✗" || true
done

# Start game
echo ""
echo ">>> Starting game..."
$CLI playtest_germany start "$GAME_ID" 2>&1 | grep -E "✓|✗" || true

echo ""
echo "========================================="
echo "Playtest ready!"
echo ""
echo "Game ID: $GAME_ID"
echo ""
echo "To use in subsequent commands, run:"
echo "  export GAME=$GAME_ID"
echo ""
echo "Or copy this line:"
echo "GAME=$GAME_ID"
echo "========================================="

# Output just the game ID on last line for easy parsing
echo ""
echo "GAME_ID=$GAME_ID"
