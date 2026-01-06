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
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

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

  // Log resource fountains for research and influence
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';

  // Research fountains: research level (trickle), engineers (conversion), cards (card)
  if (researchLevel > 0) {
    resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', researchLevel, 'trickle', 'Research Level', playerState.research);
  }
  if (engineersInBarracks > 0) {
    resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', engineersInBarracks, 'conversion', 'Engineers in Barracks', playerState.research);
  }
  const cardResearch = researchGained - researchLevel - engineersInBarracks;
  if (cardResearch > 0) {
    resourceFlowLogger.logFountain(flowContext, playerId, faction, 'research', cardResearch, 'card', 'Reveal card bonuses', playerState.research);
  }

  // Influence fountains from cards
  if (influenceGained > 0) {
    resourceFlowLogger.logFountain(flowContext, playerId, faction, 'influence', influenceGained, 'card', 'Reveal card bonuses', playerState.influence);
  }

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

  // Note: Do NOT advance to next placer here!
  // The revealed player stays "current" to make their purchase selections.
  // Only after they click END_TURN (which calls turn.ts processEndTurn for hasPassed players)
  // will the next placer be advanced to.
  // This allows interactive purchase selection after revealing.

  return { newState: state };
}

export { processReveal };

// CommonJS compatibility
module.exports = {
  processReveal
};
