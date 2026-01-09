/**
 * Turn Order Helpers
 * Functions for managing player turn order during different phases
 */

import type { GameState, PlayerState } from '@upship/api';

/**
 * Calculate turn order for worker placement phase
 * Rules per Section 3.3 and 5.1:
 * 1. playerOrder represents fixed seating around the table (randomized at game start)
 * 2. The player with the First Player token goes first
 * 3. Play proceeds clockwise (in playerOrder) from the First Player
 *
 * Ministry visitors this round claim the First Player token for next round.
 */
function calculateTurnOrder(state: GameState): string[] {
  // Get ministry visitors from this round (they claim First Player token)
  const ministryVisitors = state.workerPlacement?.ministryVisitors || [];

  // Determine who has the First Player token
  // If someone visited Ministry this round, they get the token
  // Otherwise, the persistent firstPlayer holder has it
  const firstPlayerHolder = ministryVisitors.length > 0
    ? ministryVisitors[ministryVisitors.length - 1] // Most recent Ministry visitor gets token
    : state.firstPlayer;

  // playerOrder is the fixed seating order (clockwise around the table)
  const seatingOrder = state.playerOrder;

  // If there's a First Player token holder, rotate seating to start with them
  if (firstPlayerHolder && seatingOrder.includes(firstPlayerHolder)) {
    const firstPlayerIndex = seatingOrder.indexOf(firstPlayerHolder);
    // Rotate array to start with First Player, maintaining clockwise order
    return [
      ...seatingOrder.slice(firstPlayerIndex),
      ...seatingOrder.slice(0, firstPlayerIndex)
    ];
  }

  // No First Player token - use original seating order
  return [...seatingOrder];
}

/**
 * Get the current player who should place an agent (during worker_placement phase)
 */
function getCurrentPlacer(state: GameState): string | null {
  if (state.phase !== 'worker_placement') {
    return null;
  }

  const order = state.workerPlacement?.placementOrder || state.playerOrder;
  const index = state.workerPlacement?.currentPlacerIndex || 0;

  // Skip passed players
  while (index < order.length) {
    const playerId = order[index];
    if (!state.workerPlacement?.passedPlayers?.includes(playerId)) {
      return playerId;
    }
    // This shouldn't happen during normal play since currentPlacerIndex
    // should always point to a non-passed player, but handle it gracefully
    break;
  }

  return null;
}

// Extended state type with mutable workerPlacement (intersection to allow optional properties)
type MutableState = GameState & {
  turnInRound?: number;
  workerPlacement?: {
    placementOrder: string[];
    passedPlayers: string[];
    currentPlacerIndex: number;
    ministryVisitors?: string[];
  };
};

/**
 * Advance to the next player who hasn't passed in worker placement
 */
function advanceToNextPlacer(state: MutableState): string | null {
  // Increment turn counter within the current round
  state.turnInRound = (state.turnInRound || 1) + 1;

  const order = state.workerPlacement?.placementOrder || state.playerOrder;
  const passedPlayers = state.workerPlacement?.passedPlayers || [];
  let index = state.workerPlacement?.currentPlacerIndex || 0;

  // Find next non-passed player
  for (let i = 0; i < order.length; i++) {
    index = (index + 1) % order.length;
    const playerId = order[index];
    if (!passedPlayers.includes(playerId)) {
      // Ensure workerPlacement exists before updating
      if (!state.workerPlacement) {
        state.workerPlacement = { placementOrder: order, passedPlayers: [], currentPlacerIndex: 0, ministryVisitors: [] };
      }
      state.workerPlacement.currentPlacerIndex = index;
      // Reset the next player's action flag
      const player = state.players[playerId] as PlayerState & { hasTakenActionThisTurn?: boolean };
      if (player) {
        player.hasTakenActionThisTurn = false;
      }
      return playerId;
    }
  }

  // All players have passed - this shouldn't happen as we check before calling
  return null;
}

/**
 * Check if all players have passed in worker placement
 */
function allPlayersPassed(state: GameState): boolean {
  const passedPlayers = state.workerPlacement?.passedPlayers || [];
  return state.playerOrder.every(pid => passedPlayers.includes(pid));
}

export {
  calculateTurnOrder,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed
};

// CommonJS compatibility
module.exports = {
  calculateTurnOrder,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed
};
