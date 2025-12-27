#!/bin/bash
# Autoplay turns for UP SHIP! playtest
# Usage: ./scripts/autoplay.sh <gameId> [num_turns]
# Or:    GAME=<gameId> ./scripts/autoplay.sh [num_turns]
#
# Runs simple AI logic for all 4 players to exercise game systems.

set -e

GAME_ID="${1:-$GAME}"
NUM_TURNS="${2:-5}"
CLI="node cli/upship.js"
PASSWORD="test123456"

if [ -z "$GAME_ID" ]; then
  echo "Usage: ./scripts/autoplay.sh <gameId> [num_turns]"
  echo "   or: GAME=<gameId> ./scripts/autoplay.sh [num_turns]"
  exit 1
fi

# Player list
PLAYERS=("playtest_germany" "playtest_britain" "playtest_usa" "playtest_italy")

# Get gas preference for player
get_gas() {
  case "$1" in
    playtest_usa) echo "helium" ;;
    *) echo "hydrogen" ;;
  esac
}

echo "=== UP SHIP! Autoplay ==="
echo "Game: $GAME_ID"
echo "Turns: $NUM_TURNS"
echo ""

# Ensure all players are logged in
echo ">>> Ensuring all players logged in..."
for player in "${PLAYERS[@]}"; do
  $CLI login "$player" "$PASSWORD" 2>&1 | grep -E "✓|already" || true
done
echo ""

# Get current player from game state
get_current_player() {
  # Parse state output to find who has "YOUR TURN"
  for player in "${PLAYERS[@]}"; do
    STATE=$($CLI "$player" state "$GAME_ID" 2>&1)
    if echo "$STATE" | grep -q "YOUR TURN"; then
      echo "$player"
      return
    fi
  done
  echo ""
}

# Get current phase (strip ANSI codes)
get_phase() {
  $CLI playtest_germany state "$GAME_ID" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -oE "Phase: [A-Z]+" | sed 's/Phase: //' || echo "UNKNOWN"
}

# Run action for current player only
run_current() {
  local cmd="$1"
  shift
  local current=$(get_current_player)
  if [ -n "$current" ]; then
    $CLI "$current" "$cmd" "$GAME_ID" "$@" 2>&1 | grep -E "✓|✗" || true
  fi
}

# Have current player end turn, repeat until phase changes or all done
advance_phase() {
  local start_phase=$(get_phase)
  local attempts=0
  while [ $attempts -lt 8 ]; do
    local current=$(get_current_player)
    if [ -z "$current" ]; then
      break
    fi
    $CLI "$current" endturn "$GAME_ID" 2>&1 | grep -E "✓|✗" || true

    local new_phase=$(get_phase)
    if [ "$new_phase" != "$start_phase" ]; then
      break
    fi
    ((attempts++))
  done
}

# Show brief status
show_status() {
  echo ""
  $CLI playtest_germany state "$GAME_ID" 2>&1 | grep -E "Age|Turn|Round|Phase|Progress" | head -3
  echo ""
}

for turn in $(seq 1 $NUM_TURNS); do
  echo "========================================="
  echo "=== TURN $turn ==="
  echo "========================================="
  show_status

  # PLANNING PHASE - each player draws and ends turn
  PHASE=$(get_phase)
  if [ "$PHASE" = "PLANNING" ]; then
    echo "--- Planning Phase ---"
    for i in {1..4}; do
      current=$(get_current_player)
      if [ -n "$current" ]; then
        echo "  $current: drawing cards..."
        $CLI "$current" draw "$GAME_ID" 2 2>&1 | grep -E "✓|✗" || true
        $CLI "$current" endturn "$GAME_ID" 2>&1 | grep -E "✓|✗" || true
      fi
    done
  fi

  # ACTIONS PHASE - each player buys gas, builds, ends turn
  PHASE=$(get_phase)
  if [ "$PHASE" = "ACTIONS" ]; then
    echo "--- Actions Phase ---"
    for i in {1..4}; do
      current=$(get_current_player)
      if [ -n "$current" ]; then
        gas=$(get_gas "$current")
        echo "  $current: buying gas, building..."

        # Buy gas
        $CLI "$current" buygas "$GAME_ID" "$gas" 4 2>&1 | grep -E "✓|✗" || true

        # Build ship
        $CLI "$current" build "$GAME_ID" 1 2>&1 | grep -E "✓|✗" || true

        # Try to launch if we have ships in hangar
        SHIPS=$($CLI "$current" state "$GAME_ID" 2>&1 | grep -E "HANGAR" | grep -oE '[a-z]+_[a-z]+_[0-9]+' || true)
        for ship in $SHIPS; do
          echo "  $current: launching $ship..."
          $CLI "$current" launch "$GAME_ID" "$ship" "$gas" 2>&1 | grep -E "✓|✗" || true
        done

        $CLI "$current" endturn "$GAME_ID" 2>&1 | grep -E "✓|✗" || true
      fi
    done
  fi

  # LAUNCH PHASE - all end turn
  PHASE=$(get_phase)
  if [ "$PHASE" = "LAUNCH" ]; then
    echo "--- Launch Phase ---"
    advance_phase
  fi

  # INCOME PHASE - all end turn
  PHASE=$(get_phase)
  if [ "$PHASE" = "INCOME" ]; then
    echo "--- Income Phase ---"
    advance_phase
  fi

  # CLEANUP PHASE - all end turn
  PHASE=$(get_phase)
  if [ "$PHASE" = "CLEANUP" ]; then
    echo "--- Cleanup Phase ---"
    advance_phase
  fi

  show_status
done

echo ""
echo "========================================="
echo "Autoplay complete: $NUM_TURNS turns"
echo "========================================="

# Final state
echo ""
echo "=== FINAL STATE ==="
$CLI playtest_germany state "$GAME_ID"
