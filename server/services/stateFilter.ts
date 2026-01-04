/**
 * State Filter Service
 * Filters game state to hide private information from other players
 */

import type { GameState, PlayerState, Card, HazardCard } from '@upship/api';

// Filtered player state for opponents (hides private info)
interface FilteredPlayerState extends Omit<PlayerState, 'hand' | 'deck' | 'hazardDeck' | 'peekedHazard'> {
  hand: number | Card[];
  deck: number | Card[];
  hazardDeck: number | HazardCard[];
  peekedHazard?: undefined;
}

// Filtered game state type
interface FilteredGameState extends Omit<GameState, 'players'> {
  players: Record<string, PlayerState | FilteredPlayerState>;
}

/**
 * Filter game state for a specific player
 * Hides private information (hand, deck, hazard deck) from opponents
 *
 * @param state - Full game state
 * @param playerId - ID of the player viewing the state
 * @returns Filtered state safe to send to player
 */
export function filterStateForPlayer(state: GameState | null, playerId: string): FilteredGameState | null {
  if (!state) return state;

  const filtered: FilteredGameState = { ...state, players: {} };

  if (state.players) {
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
 * @param state - Full game state
 * @returns Filtered state safe for spectators
 */
export function filterStateForSpectator(state: GameState | null): FilteredGameState | null {
  if (!state) return state;

  const filtered: FilteredGameState = { ...state, players: {} };

  if (state.players) {
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

// CommonJS compatibility
module.exports = {
  filterStateForPlayer,
  filterStateForSpectator
};
