/**
 * Turn Order Helpers
 * Functions for managing player turn order during different phases
 */

/**
 * Calculate turn order for worker placement phase
 * Rules per Section 5.1:
 * 1. The player with the First Player pawn goes first
 * 2. Ministry visitors this round claim the First Player token (for next turn order calculation)
 * 3. Remaining players go in lowest income order (ties broken by lowest cash, then original order)
 *
 * @param {Object} state - Game state
 * @returns {string[]} Array of player IDs in turn order
 */
function calculateTurnOrder(state) {
  const players = Object.entries(state.players).map(([playerId, playerState]) => ({
    playerId,
    income: playerState.income,
    cash: playerState.cash,
    originalIndex: state.playerOrder.indexOf(playerId)
  }));

  // Get ministry visitors from this round (they claim First Player token)
  const ministryVisitors = state.workerPlacement?.ministryVisitors || [];

  // Determine who has the First Player token
  // If someone visited Ministry this round, they get the token
  // Otherwise, the persistent firstPlayer holder has it
  const firstPlayerHolder = ministryVisitors.length > 0
    ? ministryVisitors[ministryVisitors.length - 1] // Most recent Ministry visitor gets token
    : state.firstPlayer;

  // Sort all players by income (lowest first), then cash, then original order
  const sortedPlayers = [...players];
  sortedPlayers.sort((a, b) => {
    // Lowest income first
    if (a.income !== b.income) return a.income - b.income;
    // Tiebreaker 1: Lowest cash first
    if (a.cash !== b.cash) return a.cash - b.cash;
    // Tiebreaker 2: Original player order
    return a.originalIndex - b.originalIndex;
  });

  // If there's a First Player token holder, they go first
  if (firstPlayerHolder && players.some(p => p.playerId === firstPlayerHolder)) {
    // Remove First Player from sorted list and prepend them
    const otherPlayers = sortedPlayers.filter(p => p.playerId !== firstPlayerHolder);
    return [firstPlayerHolder, ...otherPlayers.map(p => p.playerId)];
  }

  // No First Player token - pure income-based order
  return sortedPlayers.map(p => p.playerId);
}

/**
 * Get the current player who should place an agent (during worker_placement phase)
 *
 * @param {Object} state - Game state
 * @returns {string|null} Player ID or null if not in worker placement
 */
function getCurrentPlacer(state) {
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

/**
 * Advance to the next player who hasn't passed in worker placement
 *
 * @param {Object} state - Game state (mutated)
 * @returns {string|null} Next player ID or null if all have passed
 */
function advanceToNextPlacer(state) {
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
        state.workerPlacement = { placementOrder: order, passedPlayers: [], currentPlacerIndex: 0 };
      }
      state.workerPlacement.currentPlacerIndex = index;
      return playerId;
    }
  }

  // All players have passed - this shouldn't happen as we check before calling
  return null;
}

/**
 * Check if all players have passed in worker placement
 *
 * @param {Object} state - Game state
 * @returns {boolean} True if all players have passed
 */
function allPlayersPassed(state) {
  const passedPlayers = state.workerPlacement?.passedPlayers || [];
  return state.playerOrder.every(pid => passedPlayers.includes(pid));
}

module.exports = {
  calculateTurnOrder,
  getCurrentPlacer,
  advanceToNextPlacer,
  allPlayersPassed
};
