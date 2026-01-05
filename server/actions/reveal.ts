/**
 * Reveal Actions
 * REVEAL action processor for atomic reveal phase handling
 *
 * Per Section 5.1: Reveal actions should be bundled atomically.
 * Players submit REVEAL with techAcquisitions[] and marketPurchases[]
 * When all players have revealed, resources are collected and acquisitions processed
 */

import type { GameState, PlayerState, LogEntry, Card } from '@upship/api';

const { GameRuleError } = require('../errors');
const { transitionToIncomeCleanup } = require('./helpers/phaseTransition');
const { processAcquireTechCardResearch } = require('./technology');
const { processBuyMarketCard } = require('./cards');
const { refillRDBoard, refreshMarketRow } = require('./helpers/marketHelpers');

// Extended card type with reveal bonuses
interface RevealCard extends Card {
  reveal?: {
    research?: number;
    influence?: number;
    hydrogen?: number;
    helium?: number;
    cash?: number;
    officers?: number;
    engineers?: number;
    gas?: number;
  };
  revealBonus?: {
    research?: number;
    influence?: number;
    hydrogen?: number;
    helium?: number;
    cash?: number;
    officers?: number;
    engineers?: number;
    gas?: number;
  };
}

// Extended player state
type RevealPlayerState = PlayerState & {
  researchLevel?: number;
};

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
 * Collect resources for a single player when they reveal
 * Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
 */
function collectPlayerRevealResources(state: GameState, playerId: string): void {
  const playerState = state.players[playerId] as RevealPlayerState;
  const hand = (playerState.hand || []) as RevealCard[];

  let researchGained = 0;
  let influenceGained = 0;
  let hydrogenGained = 0;
  let heliumGained = 0;
  let cashGained = 0;
  let officersGained = 0;
  let engineersGained = 0;

  for (const card of hand) {
    const revealData = card.reveal || card.revealBonus;
    if (revealData) {
      researchGained += revealData.research || 0;
      influenceGained += revealData.influence || 0;
      hydrogenGained += revealData.hydrogen || 0;
      heliumGained += revealData.helium || 0;
      cashGained += revealData.cash || 0;
      officersGained += revealData.officers || 0;
      engineersGained += revealData.engineers || 0;

      // Handle generic 'gas' property - defaults to hydrogen
      if (revealData.gas) {
        hydrogenGained += revealData.gas;
      }
    }
  }

  // Per Section 5.1: Research = Research Level + Engineers in Barracks + card bonuses
  const researchLevel = playerState.researchLevel || 0;
  const engineersInBarracks = playerState.engineers || 0;
  researchGained += researchLevel + engineersInBarracks;

  // Apply gains
  playerState.research = researchGained;
  playerState.influence = influenceGained;
  playerState.gasCubes.hydrogen += hydrogenGained;
  playerState.gasCubes.helium += heliumGained;
  playerState.cash += cashGained;
  playerState.officers += officersGained;
  playerState.engineers += engineersGained;

  const resourceLog: string[] = [];
  if (researchGained > 0) resourceLog.push(`${researchGained} Research`);
  if (influenceGained > 0) resourceLog.push(`${influenceGained} Influence`);
  if (cashGained > 0) resourceLog.push(`£${cashGained}`);
  if (officersGained > 0) resourceLog.push(`${officersGained} Officer(s)`);
  if (engineersGained > 0) resourceLog.push(`${engineersGained} Engineer(s)`);
  if (hydrogenGained > 0) resourceLog.push(`${hydrogenGained} Hydrogen`);
  if (heliumGained > 0) resourceLog.push(`${heliumGained} Helium`);

  if (resourceLog.length > 0) {
    state.log = state.log || [];
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${playerState.faction.toUpperCase()} collected: ${resourceLog.join(', ')}`,
      playerId,
      type: 'reveal',
      round: state.round,
      age: state.age
    } as LogEntry);
  }
}

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

  // Collect resources immediately so player can make purchases
  collectPlayerRevealResources(state, playerId);

  // Store pending acquisitions (may be empty if player will select interactively)
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

  // Set phase to reveal (resources already collected when each player revealed)
  state.phase = 'reveal';

  // Initialize reveal phase tracking if not already done
  if (!revealState.revealPhase) {
    revealState.revealPhase = {
      revealedHands: {},
      resourcesCollected: {},
      techAcquisitionsComplete: {},
      marketPurchasesComplete: {}
    } as typeof revealState.revealPhase;
  }

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
