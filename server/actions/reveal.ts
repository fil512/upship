/**
 * Reveal Actions
 * REVEAL action processor for atomic reveal phase handling
 *
 * Per Section 5.1: Reveal actions should be bundled atomically.
 * Players submit REVEAL with techAcquisitions[] and marketPurchases[]
 * When all players have revealed, resources are collected and acquisitions processed
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError } = require('../errors');
const {
  transitionToRevealPhase,
  transitionToIncomeCleanup
} = require('./helpers/phaseTransition');
const { processAcquireTechCardResearch } = require('./technology');
const { processBuyMarketCard } = require('./cards');
const { refillRDBoard, refreshMarketRow } = require('./helpers/marketHelpers');

interface ActionResult {
  newState: GameState;
}

// Extended state with worker placement and reveal phase
type RevealState = GameState & {
  workerPlacement: {
    currentPlacerIndex: number;
    placementOrder?: string[];
    passedPlayers?: string[];
  };
  pendingReveals?: Record<string, { techAcquisitions: string[]; marketPurchases: string[] }>;
  revealPhase: {
    techAcquisitionsComplete: Record<string, boolean>;
    marketPurchasesComplete: Record<string, boolean>;
  };
  turnInRound?: number;
};

/**
 * Get the current placer during worker placement
 */
function getCurrentPlacer(state: GameState): string {
  const revealState = state as RevealState;
  const placementOrder = revealState.workerPlacement?.placementOrder || state.playerOrder;
  return placementOrder[revealState.workerPlacement?.currentPlacerIndex || 0];
}

/**
 * Check if all players have passed/revealed
 */
function allPlayersPassed(state: GameState): boolean {
  return state.playerOrder.every(pid => state.players[pid].hasPassed);
}

/**
 * Advance to the next placer who hasn't passed
 */
function advanceToNextPlacer(state: GameState): void {
  const revealState = state as RevealState;
  // Increment turn counter within the current round
  revealState.turnInRound = (revealState.turnInRound || 1) + 1;

  const placementOrder = revealState.workerPlacement?.placementOrder || state.playerOrder;
  let nextIndex = (revealState.workerPlacement.currentPlacerIndex + 1) % placementOrder.length;

  // Skip players who have passed
  let attempts = 0;
  while (state.players[placementOrder[nextIndex]]?.hasPassed && attempts < placementOrder.length) {
    nextIndex = (nextIndex + 1) % placementOrder.length;
    attempts++;
  }

  revealState.workerPlacement.currentPlacerIndex = nextIndex;
}

interface RevealData {
  techAcquisitions?: string[];
  marketPurchases?: string[];
}

/**
 * Process atomic REVEAL action
 *
 * This replaces the separate PASS + ACQUIRE_TECHNOLOGY + BUY_MARKET_CARD + END_TURN flow.
 * Player declares what they want to acquire upfront, and when all players have revealed,
 * resources are collected and acquisitions processed in player order.
 */
function processReveal(state: GameState, playerId: string, data: RevealData | undefined): ActionResult {
  const { techAcquisitions = [], marketPurchases = [] } = data || {};
  const revealState = state as RevealState;
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
  revealState.workerPlacement.passedPlayers = revealState.workerPlacement.passedPlayers || [];
  revealState.workerPlacement.passedPlayers.push(playerId);

  // Store pending acquisitions
  revealState.pendingReveals = revealState.pendingReveals || {};
  revealState.pendingReveals[playerId] = { techAcquisitions, marketPurchases };

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `${playerState.faction.toUpperCase()} reveals`,
    playerId,
    type: 'action'
  } as LogEntry);

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
 */
function executeAllReveals(state: GameState): void {
  const revealState = state as RevealState;

  // Transition to reveal phase and collect resources from cards
  transitionToRevealPhase(state);

  // Process each player's acquisitions in player order
  for (const playerId of state.playerOrder) {
    const pending = revealState.pendingReveals?.[playerId] || { techAcquisitions: [], marketPurchases: [] };
    const { techAcquisitions, marketPurchases } = pending;
    const playerState = state.players[playerId];

    // Process tech acquisitions using collected research
    for (const techId of techAcquisitions) {
      try {
        processAcquireTechCardResearch(state, playerId, { techId, _internal: true });
      } catch (e) {
        state.log = state.log || [];
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} could not acquire ${techId}: ${(e as Error).message}`,
          playerId,
          type: 'error'
        } as LogEntry);
      }
    }

    // Process market purchases using collected influence
    for (const cardId of marketPurchases) {
      try {
        processBuyMarketCard(state, playerId, { cardId, _internal: true });
      } catch (e) {
        state.log = state.log || [];
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `${playerState.faction.toUpperCase()} could not buy ${cardId}: ${(e as Error).message}`,
          playerId,
          type: 'error'
        } as LogEntry);
      }
    }

    // Mark player as done with reveal
    revealState.revealPhase.techAcquisitionsComplete[playerId] = true;
    revealState.revealPhase.marketPurchasesComplete[playerId] = true;

    // Replenish R&D Board and Market AFTER this player's purchases
    // This allows later players to see freshly drawn tiles/cards
    refillRDBoard(state);
    refreshMarketRow(state);
  }

  // Clear pending reveals
  delete revealState.pendingReveals;

  // Transition to income/cleanup since all reveals are now complete
  transitionToIncomeCleanup(state);
}

export { processReveal, executeAllReveals };

// CommonJS compatibility
module.exports = {
  processReveal,
  executeAllReveals
};
