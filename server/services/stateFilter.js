/**
 * State Filter Service
 * Filters game state to hide private information from other players
 */

/**
 * Filter game state for a specific player
 * Hides private information (hand, deck, hazard deck) from opponents
 *
 * @param {Object} state - Full game state
 * @param {string} playerId - ID of the player viewing the state
 * @returns {Object} Filtered state safe to send to player
 */
function filterStateForPlayer(state, playerId) {
  if (!state) return state;

  const filtered = { ...state };

  if (filtered.players) {
    filtered.players = {};

    for (const [pid, playerState] of Object.entries(state.players)) {
      if (pid === playerId) {
        // Show full state to the owning player
        filtered.players[pid] = playerState;
      } else {
        // Hide private information from opponents
        filtered.players[pid] = {
          ...playerState,
          // Replace arrays with counts to hide actual cards
          hand: playerState.hand ? playerState.hand.length : 0,
          deck: playerState.deck ? playerState.deck.length : 0,
          hazardDeck: playerState.hazardDeck ? playerState.hazardDeck.length : 0,
          // Remove any peeked hazard info
          peekedHazard: undefined
        };
      }
    }
  }

  return filtered;
}

/**
 * Filter game state for spectators (no private info for anyone)
 *
 * @param {Object} state - Full game state
 * @returns {Object} Filtered state safe for spectators
 */
function filterStateForSpectator(state) {
  if (!state) return state;

  const filtered = { ...state };

  if (filtered.players) {
    filtered.players = {};

    for (const [pid, playerState] of Object.entries(state.players)) {
      filtered.players[pid] = {
        ...playerState,
        hand: playerState.hand ? playerState.hand.length : 0,
        deck: playerState.deck ? playerState.deck.length : 0,
        hazardDeck: playerState.hazardDeck ? playerState.hazardDeck.length : 0,
        peekedHazard: undefined
      };
    }
  }

  return filtered;
}

module.exports = {
  filterStateForPlayer,
  filterStateForSpectator
};
