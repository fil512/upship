#!/bin/bash
# Automated playtest script for UP SHIP!
# Runs the game to completion

GAME=$1
if [ -z "$GAME" ]; then
  echo "Usage: ./scripts/autoplay.sh <gameId>"
  exit 1
fi

CLI="node cli/upship.js"

# Helper function to run a command and show result
run() {
  $CLI "$@" 2>/dev/null | grep -E "✓|✗" | head -1
}

# Get current game state (strip ANSI codes)
get_phase() {
  $CLI playtest_italy state $GAME 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E "Phase:" | grep -oE "Phase: [A-Z]+" | sed 's/Phase: //'
}

get_age() {
  $CLI playtest_italy state $GAME 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -oE "Age [0-9]" | head -1 | sed 's/Age //'
}

get_turn() {
  $CLI playtest_italy state $GAME 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -oE "Turn [0-9]+" | head -1 | sed 's/Turn //'
}

# Quick pass for all players through a phase
pass_all() {
  run playtest_italy endturn $GAME
  run playtest_germany endturn $GAME
  run playtest_usa endturn $GAME
  run playtest_britain endturn $GAME
}

# Player takes strategic actions in actions phase
player_actions() {
  local PLAYER=$1

  # Check cash (strip ANSI and extract number)
  local CASH=$($CLI $PLAYER state $GAME 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Cash:" | grep -oE "£[0-9]+" | grep -oE "[0-9]+" | head -1)
  CASH=${CASH:-0}

  echo "  $PLAYER has £$CASH"

  # Take loan if low on cash
  if [ "$CASH" -lt 15 ]; then
    run $PLAYER loan $GAME
    CASH=$((CASH + 30))
  fi

  # Try to acquire any available technology
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=improved_propeller
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=wooden_framework
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=rubberized_cotton
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=goldbeater_skin
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=diesel_engine
  run $PLAYER action $GAME ACQUIRE_TECHNOLOGY techId=radio_navigation

  # Buy gas if we have money
  if [ "$CASH" -gt 20 ]; then
    run $PLAYER buygas $GAME hydrogen 4
  fi

  # Build ship
  run $PLAYER build $GAME 1

  # Load gas
  run $PLAYER load $GAME hydrogen 0
  run $PLAYER load $GAME hydrogen 1
  run $PLAYER load $GAME hydrogen 2
  run $PLAYER load $GAME hydrogen 3

  # Get ship to launch
  local SHIP=$($CLI $PLAYER state $GAME 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "HANGAR" | grep -oE "ship_[0-9_]+" | head -1)
  if [ -n "$SHIP" ]; then
    run $PLAYER launch $GAME $SHIP
  fi

  # End turn
  run $PLAYER endturn $GAME
}

echo "Starting autoplay for game: $GAME"
echo "=================================="

# Main game loop
ITERATIONS=0
MAX_ITERATIONS=200  # Safety limit

while [ $ITERATIONS -lt $MAX_ITERATIONS ]; do
  PHASE=$(get_phase)
  AGE=$(get_age)
  TURN=$(get_turn)

  echo ""
  echo "=== Age $AGE | Turn $TURN | Phase: $PHASE ==="

  # Check if game ended
  if [ -z "$PHASE" ]; then
    echo "Could not determine phase, checking if game ended..."
    $CLI playtest_italy state $GAME 2>&1 | head -20
    break
  fi

  case $PHASE in
    PLANNING)
      echo "-- Planning Phase: Drawing cards --"
      run playtest_italy draw $GAME 1
      run playtest_italy endturn $GAME
      run playtest_germany draw $GAME 1
      run playtest_germany endturn $GAME
      run playtest_usa draw $GAME 1
      run playtest_usa endturn $GAME
      run playtest_britain draw $GAME 1
      run playtest_britain endturn $GAME
      ;;
    ACTIONS)
      echo "-- Actions Phase: Strategic actions --"
      player_actions playtest_italy
      player_actions playtest_germany
      player_actions playtest_usa
      player_actions playtest_britain
      ;;
    LAUNCH)
      echo "-- Launch Phase: Passing --"
      pass_all
      ;;
    INCOME)
      echo "-- Income Phase: Collecting (auto) --"
      pass_all
      ;;
    CLEANUP)
      echo "-- Cleanup Phase: End of turn --"
      pass_all
      ;;
    *)
      echo "Unknown phase: '$PHASE', trying to pass..."
      pass_all
      ;;
  esac

  ITERATIONS=$((ITERATIONS + 1))

  # Check for game end condition (Age 3 and high turn count)
  if [ "$AGE" = "3" ] && [ "$TURN" -gt 3 ]; then
    echo "Attempting to calculate final scores..."
    run playtest_italy action $GAME CALCULATE_SCORES

    # Check if game ended
    ENDED=$($CLI playtest_italy state $GAME 2>&1 | grep -i "ended\|winner\|game over")
    if [ -n "$ENDED" ]; then
      echo "Game ended: $ENDED"
      break
    fi
  fi
done

echo ""
echo "=================================="
echo "Autoplay complete after $ITERATIONS iterations"
echo ""
echo "Final state:"
$CLI playtest_italy state $GAME
