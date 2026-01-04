/**
 * Turn Actions
 * END_TURN action processor
 */

const { transitionToIncomeCleanup, startNewRound } = require('./helpers/phaseTransition');
const { advanceToNextPlacer } = require('./helpers/turnOrder');
const { refreshMarketRow, refreshRnDBoard } = require('./helpers/marketHelpers');

/**
 * End turn - behavior depends on current phase
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @returns {Object} { newState } or throws error
 */
function processEndTurn(state, playerId) {
  const playerState = state.players[playerId];

  switch (state.phase) {
    case 'worker_placement': {
      // During worker placement, END_TURN just advances to next placer
      // It does NOT mark the player as passed - only REVEAL does that
      // Per terminology: Round = all players reveal, Turn = single player action
      playerState.hasTakenActionThisTurn = false;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn'
      });

      // Just advance to next placer - don't mark as passed
      advanceToNextPlacer(state);
      break;
    }

    case 'reveal': {
      // During reveal phase, END_TURN finalizes tentative purchases

      // 1. Finalize market card purchases (move to discard pile)
      const pendingMarket = playerState.pendingMarketPurchases || [];
      for (const purchase of pendingMarket) {
        const cardIndex = state.marketCards.findIndex(c => c.id === purchase.cardId);
        if (cardIndex !== -1) {
          const card = state.marketCards[cardIndex];
          // Move card to player's discard pile
          playerState.discardPile = playerState.discardPile || [];
          playerState.discardPile.push(card);
          // Remove from market
          state.marketCards.splice(cardIndex, 1);
          // Clear claim
          if (state.marketCardsClaimed) {
            delete state.marketCardsClaimed[purchase.cardId];
          }

          state.log.push({
            timestamp: new Date().toISOString(),
            message: `Purchased ${card.name} for ${purchase.cost} Influence`,
            playerId,
            type: 'action'
          });
        }
      }
      playerState.pendingMarketPurchases = [];

      // 2. Finalize tech card acquisitions (add to techCards)
      const pendingTech = playerState.pendingTechAcquisitions || [];
      for (const acquisition of pendingTech) {
        const cardIndex = state.rdBoard.findIndex(c => c.id === acquisition.cardId);
        if (cardIndex !== -1) {
          const card = state.rdBoard[cardIndex];
          // Add to player's tech cards
          playerState.techCards = playerState.techCards || [];
          playerState.techCards.push(card.id);
          // Remove from R&D board
          state.rdBoard.splice(cardIndex, 1);
          // Clear claim
          if (state.techCardsClaimed) {
            delete state.techCardsClaimed[acquisition.cardId];
          }

          state.log.push({
            timestamp: new Date().toISOString(),
            message: `Acquired ${card.name} for ${acquisition.cost} Research`,
            playerId,
            type: 'action'
          });
        }
      }
      playerState.pendingTechAcquisitions = [];

      // 3. Replenish market and R&D board
      refreshMarketRow(state);
      refreshRnDBoard(state);

      // Mark player as complete
      state.revealPhase.techAcquisitionsComplete[playerId] = true;
      state.revealPhase.marketPurchasesComplete[playerId] = true;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} finished reveal phase`,
        playerId,
        type: 'turn'
      });

      // Check if all players are done with reveal phase
      const allDone = state.playerOrder.every(pid =>
        state.revealPhase.techAcquisitionsComplete[pid] &&
        state.revealPhase.marketPurchasesComplete[pid]
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

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} ended their turn`,
        playerId,
        type: 'turn'
      });

      if (state.currentPlayerIndex === 0) {
        // All players have completed income/cleanup, start new round
        startNewRound(state);
      }
      break;

    default:
      // Fallback for any other phase - advance player
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Player ended their turn`,
        playerId,
        type: 'turn'
      });
  }

  return { newState: state };
}

module.exports = { processEndTurn };
