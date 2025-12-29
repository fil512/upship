/**
 * Turn Actions
 * END_TURN action processor
 */

const { GameRuleError } = require('../errors');
const { transitionToIncomeCleanup, startNewRound } = require('./helpers/phaseTransition');

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
    case 'worker_placement':
      // During worker placement, use PASS action instead of END_TURN
      throw new GameRuleError('Use PASS action during worker placement phase');

    case 'reveal': {
      // During reveal phase, END_TURN signals done with tech/market purchases
      state.revealPhase.techAcquisitionsComplete[playerId] = true;
      state.revealPhase.marketPurchasesComplete[playerId] = true;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${playerState.faction.toUpperCase()} finished reveal phase actions`,
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
