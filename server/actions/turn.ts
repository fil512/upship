/**
 * Turn Actions
 * END_TURN action processor
 */

import type { GameState, PlayerState, Card, LogEntry } from '@upship/api';

const { transitionToIncomeCleanup, startNewRound } = require('./helpers/phaseTransition');
const { advanceToNextPlacer } = require('./helpers/turnOrder');
const { refreshMarketRow, refreshRnDBoard } = require('./helpers/marketHelpers');

interface ActionResult {
  newState: GameState;
}

interface PendingPurchase {
  cardId: string;
  cost: number;
}

// Extended player state with pending purchases
type TurnPlayerState = PlayerState & {
  pendingMarketPurchases?: PendingPurchase[];
  pendingTechAcquisitions?: PendingPurchase[];
  hasTakenActionThisTurn?: boolean;
};

// Extended state with market claims and reveal phase
type TurnState = GameState & {
  marketCardsClaimed?: Record<string, string>;
  techCardsClaimed?: Record<string, string>;
  marketCards: Card[];
  rdBoard: Array<{ id: string; name: string }>;
  revealPhase: {
    techAcquisitionsComplete: Record<string, boolean>;
    marketPurchasesComplete: Record<string, boolean>;
  };
};

/**
 * End turn - behavior depends on current phase
 */
function processEndTurn(state: GameState, playerId: string): ActionResult {
  const turnState = state as TurnState;
  const playerState = state.players[playerId] as TurnPlayerState;

  switch (state.phase) {
    case 'worker_placement': {
      // During worker placement, END_TURN just advances to next placer
      // It does NOT mark the player as passed - only REVEAL does that
      // Per terminology: Round = all players reveal, Turn = single player action
      playerState.hasTakenActionThisTurn = false;

      state.log = state.log || [];
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn',
        round: state.round,
        age: state.age
      } as LogEntry);

      // Just advance to next placer - don't mark as passed
      advanceToNextPlacer(state);
      break;
    }

    case 'reveal': {
      // During reveal phase, END_TURN finalizes tentative purchases

      // 1. Finalize market card purchases (move to discard pile)
      const pendingMarket = playerState.pendingMarketPurchases || [];
      for (const purchase of pendingMarket) {
        const cardIndex = turnState.marketCards.findIndex(c => c.id === purchase.cardId);
        if (cardIndex !== -1) {
          const card = turnState.marketCards[cardIndex];
          // Move card to player's discard pile
          playerState.discardPile = playerState.discardPile || [];
          playerState.discardPile.push(card);
          // Remove from market
          turnState.marketCards.splice(cardIndex, 1);
          // Clear claim
          if (turnState.marketCardsClaimed) {
            delete turnState.marketCardsClaimed[purchase.cardId];
          }

          state.log = state.log || [];
          state.log.push({
            timestamp: new Date().toISOString(),
            message: `Purchased ${card.name} for ${purchase.cost} Influence`,
            playerId,
            type: 'action',
            round: state.round,
            age: state.age
          } as LogEntry);
        }
      }
      playerState.pendingMarketPurchases = [];

      // 2. Finalize tech card acquisitions (add to techCards)
      const pendingTech = playerState.pendingTechAcquisitions || [];
      for (const acquisition of pendingTech) {
        const cardIndex = turnState.rdBoard.findIndex(c => c.id === acquisition.cardId);
        if (cardIndex !== -1) {
          const card = turnState.rdBoard[cardIndex];
          // Add to player's tech cards
          playerState.techCards = playerState.techCards || [];
          playerState.techCards.push(card.id);
          // Remove from R&D board
          turnState.rdBoard.splice(cardIndex, 1);
          // Clear claim
          if (turnState.techCardsClaimed) {
            delete turnState.techCardsClaimed[acquisition.cardId];
          }

          state.log = state.log || [];
          state.log.push({
            timestamp: new Date().toISOString(),
            message: `Acquired ${card.name} for ${acquisition.cost} Research`,
            playerId,
            type: 'action',
            round: state.round,
            age: state.age
          } as LogEntry);
        }
      }
      playerState.pendingTechAcquisitions = [];

      // 3. Replenish market and R&D board
      refreshMarketRow(state);
      refreshRnDBoard(state);

      // Mark player as complete
      turnState.revealPhase.techAcquisitionsComplete[playerId] = true;
      turnState.revealPhase.marketPurchasesComplete[playerId] = true;

      state.log = state.log || [];
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} finished reveal phase`,
        playerId,
        type: 'turn',
        round: state.round,
        age: state.age
      } as LogEntry);

      // Check if all players are done with reveal phase
      const allDone = state.playerOrder.every(pid =>
        turnState.revealPhase.techAcquisitionsComplete[pid] &&
        turnState.revealPhase.marketPurchasesComplete[pid]
      );

      if (allDone) {
        transitionToIncomeCleanup(state);
      }
      break;
    }

    case 'income_cleanup':
      // During income/cleanup, END_TURN advances to next player
      // When all players done, start new round
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;

      state.log = state.log || [];
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn',
        round: state.round,
        age: state.age
      } as LogEntry);

      if (state.currentPlayerIndex === 0) {
        // All players have completed income/cleanup, start new round
        startNewRound(state);
      }
      break;

    default:
      // Fallback for any other phase - advance player
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
      state.log = state.log || [];
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Player ended their turn`,
        playerId,
        type: 'turn',
        round: state.round,
        age: state.age
      } as LogEntry);
  }

  return { newState: state };
}

export { processEndTurn };

// CommonJS compatibility
module.exports = { processEndTurn };
