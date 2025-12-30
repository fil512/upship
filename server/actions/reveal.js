/**
 * Reveal Actions
 * REVEAL action processor for atomic reveal phase handling
 *
 * Per Section 5.1: Reveal actions should be bundled atomically.
 * Players submit REVEAL with techAcquisitions[] and marketPurchases[]
 * When all players have revealed, resources are collected and acquisitions processed
 */

const { GameRuleError } = require('../errors');
const {
  transitionToRevealPhase,
  transitionToIncomeCleanup
} = require('./helpers/phaseTransition');
const { processAcquireTechnologyResearch } = require('./technology');
const { processBuyMarketCard } = require('./cards');
const { refillRDBoard, refreshMarketRow } = require('./helpers/marketHelpers');

/**
 * Get the current placer during worker placement
 * @param {Object} state - Game state
 * @returns {string} Current placer's player ID
 */
function getCurrentPlacer(state) {
  const placementOrder = state.workerPlacement?.placementOrder || state.playerOrder;
  return placementOrder[state.workerPlacement?.currentPlacerIndex || 0];
}

/**
 * Check if all players have passed/revealed
 * @param {Object} state - Game state
 * @returns {boolean} True if all players have passed
 */
function allPlayersPassed(state) {
  return state.playerOrder.every(pid => state.players[pid].hasPassed);
}

/**
 * Advance to the next placer who hasn't passed
 * @param {Object} state - Game state (mutated)
 */
function advanceToNextPlacer(state) {
  const placementOrder = state.workerPlacement?.placementOrder || state.playerOrder;
  let nextIndex = (state.workerPlacement.currentPlacerIndex + 1) % placementOrder.length;

  // Skip players who have passed
  let attempts = 0;
  while (state.players[placementOrder[nextIndex]]?.hasPassed && attempts < placementOrder.length) {
    nextIndex = (nextIndex + 1) % placementOrder.length;
    attempts++;
  }

  state.workerPlacement.currentPlacerIndex = nextIndex;
}

/**
 * Process atomic REVEAL action
 *
 * This replaces the separate PASS + ACQUIRE_TECHNOLOGY + BUY_MARKET_CARD + END_TURN flow.
 * Player declares what they want to acquire upfront, and when all players have revealed,
 * resources are collected and acquisitions processed in player order.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { techAcquisitions[], marketPurchases[] }
 * @returns {Object} { newState } or throws error
 */
function processReveal(state, playerId, data) {
  const { techAcquisitions = [], marketPurchases = [] } = data || {};
  const playerState = state.players[playerId];

  // Validate: must be in worker_placement phase
  if (state.phase !== 'worker_placement') {
    throw new GameRuleError('Can only call REVEAL during worker placement phase');
  }

  // Validate: must be player's turn
  const currentPlacer = getCurrentPlacer(state);
  if (currentPlacer !== playerId) {
    throw new GameRuleError('Not your turn');
  }

  // Validate: player hasn't already revealed
  if (playerState.hasPassed) {
    throw new GameRuleError('Already revealed this round');
  }

  // Mark player as passed/revealed
  playerState.hasPassed = true;
  state.workerPlacement.passedPlayers = state.workerPlacement.passedPlayers || [];
  state.workerPlacement.passedPlayers.push(playerId);

  // Store pending acquisitions
  state.pendingReveals = state.pendingReveals || {};
  state.pendingReveals[playerId] = { techAcquisitions, marketPurchases };

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `${playerState.faction.toUpperCase()} reveals`,
    playerId,
    type: 'action'
  });

  // Check if all players have revealed
  if (allPlayersPassed(state)) {
    executeAllReveals(state);
  } else {
    advanceToNextPlacer(state);
  }

  return { newState: state };
}

/**
 * Execute all pending reveals atomically
 *
 * @param {Object} state - Game state (mutated)
 */
function executeAllReveals(state) {
  // Transition to reveal phase and collect resources from cards
  transitionToRevealPhase(state);

  // Process each player's acquisitions in player order
  for (const playerId of state.playerOrder) {
    const pending = state.pendingReveals?.[playerId] || {};
    const { techAcquisitions = [], marketPurchases = [] } = pending;
    const playerState = state.players[playerId];

    // Process tech acquisitions using collected research
    for (const techId of techAcquisitions) {
      try {
        processAcquireTechnologyResearch(state, playerId, { techId, _internal: true });
      } catch (e) {
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} could not acquire ${techId}: ${e.message}`,
          playerId,
          type: 'error'
        });
      }
    }

    // Process market purchases using collected influence
    for (const cardId of marketPurchases) {
      try {
        processBuyMarketCard(state, playerId, { cardId, _internal: true });
      } catch (e) {
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} could not buy ${cardId}: ${e.message}`,
          playerId,
          type: 'error'
        });
      }
    }

    // Mark player as done with reveal
    state.revealPhase.techAcquisitionsComplete[playerId] = true;
    state.revealPhase.marketPurchasesComplete[playerId] = true;

    // Replenish R&D Board and Market AFTER this player's purchases
    // This allows later players to see freshly drawn tiles/cards
    refillRDBoard(state);
    refreshMarketRow(state);
  }

  // Clear pending reveals
  delete state.pendingReveals;

  // Transition to income/cleanup since all reveals are now complete
  transitionToIncomeCleanup(state);
}

module.exports = {
  processReveal,
  executeAllReveals
};
