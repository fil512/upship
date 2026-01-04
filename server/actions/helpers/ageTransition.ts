/**
 * Age Transition Helpers
 * Implementation of Section 12 - Age Transitions
 */

import type { GameState, PlayerState, Technology, Ship, Route, Card, LogEntry } from '@upship/api';

const { TECH_CARD_BAG, HAND_SIZE, INITIAL_AGENTS } = require('../../config/constants');
const { setupMissionRow } = require('../../data/combatMissions');
const { shuffleArray } = require('../../utils/random');
const { calculateTurnOrder } = require('./turnOrder');
const { refreshRnDBoard, refreshMarketRow, refillRDBoard } = require('./marketHelpers');

// Internal tech card type with VP and income (from TECH_CARD_BAG constants)
interface TechCardWithMeta {
  id: string;
  name: string;
  type: string;
  cost: number;
  vp: number;
  income: number;
  age?: number;
  [key: string]: unknown;
}

// Tech card bag type
type TechCardBag = Record<number, TechCardWithMeta[]>;

// Extended state for age transitions
interface AgeTransitionState extends GameState {
  techCardBag?: Technology[];
  missionRow?: unknown[];
  missionDeck?: unknown[];
  ageTransitionDesignBureau?: {
    newAge: number;
    currentPlayerIndex: number;
    completedPlayers: string[];
  };
}

// Extended player state (intersection to allow optional properties)
type ExtendedPlayerState = PlayerState & {
  agents?: number;
  agentsRemaining?: number;
  hasPassed?: boolean;
  fireProtectionUsedThisAge?: boolean;
};

/**
 * Add new age tech cards to the tech card bag
 * Per Section 3.1: Include (N-1) copies of each tech card where N = player count
 */
function addAgeTechCards(state: AgeTransitionState, age: number): void {
  const techBag = TECH_CARD_BAG as TechCardBag;
  const newCards = techBag[age] || [];
  if (newCards.length === 0) return;

  const playerCount = Object.keys(state.players || {}).length;
  const copiesPerCard = Math.max(1, playerCount - 1);

  // Count how many copies of each tech card are already owned
  const ownedCounts: Record<string, number> = {};
  for (const pid of Object.keys(state.players || {})) {
    for (const cardId of state.players[pid].techCards || []) {
      ownedCounts[cardId] = (ownedCounts[cardId] || 0) + 1;
    }
  }

  // Add (N-1) - ownedCount copies of each new age tech card
  const cardsToAdd: Technology[] = [];
  for (const card of newCards) {
    const ownedCount = ownedCounts[card.id] || 0;
    const copiesToAdd = Math.max(0, copiesPerCard - ownedCount);

    for (let i = 0; i < copiesToAdd; i++) {
      cardsToAdd.push({ ...card, age } as unknown as Technology);
    }
  }

  // Shuffle and add to tech card bag
  state.techCardBag = state.techCardBag || [];
  state.techCardBag.push(...(shuffleArray(cardsToAdd) as Technology[]));
}

/**
 * Get all tech card definitions flattened from all ages
 */
function getAllTechCardDefinitions(): Record<string, TechCardWithMeta> {
  const techBag = TECH_CARD_BAG as TechCardBag;
  const allCards: Record<string, TechCardWithMeta> = {};
  for (const age of [1, 2, 3]) {
    for (const card of (techBag[age] || [])) {
      allCards[card.id] = card;
    }
  }
  return allCards;
}

/**
 * Calculate VP from tech cards based on their VP values per Section 12.2
 */
function calculateTechCardVP(cardIds: string[]): number {
  const cardDefs = getAllTechCardDefinitions();
  let totalVP = 0;

  for (const cardId of cardIds) {
    const card = cardDefs[cardId];
    if (card && typeof card.vp === 'number') {
      totalVP += card.vp;
    }
  }

  return totalVP;
}

/**
 * Calculate VP from claimed routes per Section 12.2 and Appendix F
 * Routes have explicit `vp` property per Appendix F specifications
 */
function calculateRouteVP(state: AgeTransitionState, playerId: string): number {
  const routes = (state.map?.routes || []) as Array<Route & { claimed?: string }>;
  let totalVP = 0;

  for (const route of routes) {
    if (route.claimed === playerId) {
      totalVP += route.vp || 0;
    }
  }

  return totalVP;
}

interface VPBreakdown {
  routes: number;
  techCards: number;
  total: number;
}

/**
 * Score VP for a player at age transition per Section 12.1 and 12.2
 */
function scoreAgeVP(state: AgeTransitionState, playerId: string): VPBreakdown {
  const playerState = state.players[playerId];

  const routeVP = calculateRouteVP(state, playerId);
  const techVP = calculateTechCardVP(playerState.techCards || []);

  return {
    routes: routeVP,
    techCards: techVP,
    total: routeVP + techVP
  };
}

/**
 * Score VP for all players during age transition
 */
function scoreAllPlayersVP(state: AgeTransitionState): void {
  for (const playerId of Object.keys(state.players)) {
    const vpScored = scoreAgeVP(state, playerId);
    state.players[playerId].vp = (state.players[playerId].vp || 0) + vpScored.total;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age ${state.age} scoring: ${vpScored.routes} VP from routes, ${vpScored.techCards} VP from tech cards`,
      playerId,
      type: 'scoring'
    } as LogEntry);
  }
}

/**
 * Recover ships and officers at age transition per Section 12.1 step 2
 * Ships return to hangar (max 3), officers return based on age
 */
function recoverShipsAndOfficers(state: AgeTransitionState): void {
  const currentAge = state.age;
  const MAX_HANGAR_CAPACITY = 3;

  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];
    const shipsOnRoutes = (playerState.ships || []).filter(s => s.status === 'on_route');

    let shipsRecovered = 0;
    let officersRecovered = 0;

    for (const ship of shipsOnRoutes) {
      if (shipsRecovered >= MAX_HANGAR_CAPACITY) {
        // Ship is lost - mark as destroyed
        (ship as { status: string }).status = 'destroyed';
      } else {
        // Return ship to hangar
        (ship as { status: string }).status = 'hangar';
        ship.routeId = undefined;
        shipsRecovered++;

        // Recover officers based on ship's age
        const shipAge = (ship as Ship & { age?: number }).age || currentAge;
        officersRecovered += shipAge === 1 ? 1 : 2;
      }
    }

    playerState.officers = (playerState.officers || 0) + officersRecovered;

    if (shipsRecovered > 0 || officersRecovered > 0) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Recovered ${shipsRecovered} ships and ${officersRecovered} officers`,
        playerId,
        type: 'age_transition'
      } as LogEntry);
    }
  }
}

/**
 * Calculate tech card income from owned tech cards
 * Per Section 12.1: Sum income values from all tech cards
 */
function calculateTechCardIncome(cardIds: string[]): number {
  const cardDefs = getAllTechCardDefinitions();
  let totalIncome = 0;

  for (const cardId of (cardIds || [])) {
    const card = cardDefs[cardId];
    if (card && typeof card.income === 'number') {
      totalIncome += card.income;
    }
  }

  return totalIncome;
}

/**
 * Calculate transition income per Section 12.1 step 3
 * New Income = (income from Technology tiles) - (£1 per route lost)
 * Minimum £0
 */
function calculateTransitionIncome(state: AgeTransitionState): void {
  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];

    // Count routes being lost
    const routes = (state.map?.routes || []) as Array<Route & { claimed?: string }>;
    const routesLost = routes.filter(r => r.claimed === playerId).length;

    // Calculate income from tech cards per Section 12.1 step 3
    // Each tech card has an income value (1-3 per Appendix C)
    const techIncome = calculateTechCardIncome(playerState.techCards || []);

    // Per Section 12.1 step 3: "New Income = (income from Technology tiles) - (£1 per route lost)"
    // This REPLACES the old income, not adds to it
    const newIncome = Math.max(0, techIncome - routesLost);

    playerState.income = newIncome;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Income reset: £${techIncome} from tech cards - £${routesLost} route loss penalty = £${newIncome}`,
      playerId,
      type: 'age_transition'
    } as LogEntry);
  }
}

/**
 * Blueprint slot configurations by age per Section 4.2
 * Note: Italy has -1 componentSlots in Ages II and III (Section 13.4)
 */
const BLUEPRINT_SLOTS: Record<number, { frameSlots: number; fabricSlots: number; driveSlots: number; componentSlots: number }> = {
  1: { frameSlots: 1, fabricSlots: 1, driveSlots: 1, componentSlots: 1 },
  2: { frameSlots: 1, fabricSlots: 1, driveSlots: 2, componentSlots: 2 },
  3: { frameSlots: 2, fabricSlots: 2, driveSlots: 2, componentSlots: 3 }
};

/**
 * Get blueprint slot configuration for a faction at a given age
 * Applies Italy's "Compact Design" flaw: -1 Payload slot in Ages II and III
 * Per Section 13.4 and Section 13.5
 */
function getBlueprintSlotsForFaction(age: number, faction: string): { frameSlots: number; fabricSlots: number; driveSlots: number; componentSlots: number } {
  const baseSlots = { ...BLUEPRINT_SLOTS[age] };

  // Italy's Compact Design flaw: one fewer Payload slot in Ages II and III
  if (faction === 'italy' && age >= 2) {
    baseSlots.componentSlots -= 1;
  }

  return baseSlots;
}

/**
 * Expand blueprint slots for new age per Section 12.1 step 4
 */
function expandBlueprintSlots(state: AgeTransitionState, newAge: number): void {
  if (!BLUEPRINT_SLOTS[newAge]) return;

  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];
    const blueprint = playerState.blueprint;

    // Get faction-specific slot configuration (handles Italy's Compact Design flaw)
    const slotConfig = getBlueprintSlotsForFaction(newAge, playerState.faction);

    // Update age
    (blueprint as { age?: number }).age = newAge;

    // Expand each slot type while preserving existing upgrades
    const slotTypes = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'] as const;
    const blueprintAny = blueprint as unknown as Record<string, (string | null)[]>;
    for (const slotType of slotTypes) {
      const targetSize = slotConfig[slotType];
      const currentSlots = blueprintAny[slotType] || [];

      // Add null slots to reach target size
      while (currentSlots.length < targetSize) {
        currentSlots.push(null);
      }

      blueprintAny[slotType] = currentSlots;
    }

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Blueprint upgraded to Age ${newAge}`,
      playerId,
      type: 'age_transition'
    } as LogEntry);
  }
}

/**
 * Reset Fire-Resistant Fabric protection for new age per GAP-046
 * Per Appendix D: Fire-Resistant Fabric grants "Once per Age, treat one Fire hazard as auto-pass"
 */
function resetFireProtection(state: AgeTransitionState): void {
  for (const playerId of Object.keys(state.players)) {
    (state.players[playerId] as ExtendedPlayerState).fireProtectionUsedThisAge = false;
  }
}

/**
 * Apply Britain's Red Tape flaw per Section 13.2
 * Reduce income by 1 at each age transition
 */
function applyBritainRedTape(state: AgeTransitionState): void {
  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];

    if (playerState.faction === 'britain') {
      playerState.income = Math.max(0, playerState.income - 1);

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Red Tape: Income reduced by 1 (bureaucratic overhead)`,
        playerId,
        type: 'faction_flaw'
      } as LogEntry);
    }
  }
}

/**
 * Start age transition - performs steps 1-4 and enters free Design Bureau phase
 * Per Section 12.1 step 5: Each player gets a free Design Bureau action
 */
function startAgeTransition(state: AgeTransitionState, newAge: number): void {
  // Step 1: Score VP for routes and technologies
  scoreAllPlayersVP(state);

  // Step 2: Recover ships and officers
  recoverShipsAndOfficers(state);

  // Step 3: Calculate transition income
  calculateTransitionIncome(state);

  // Step 4: Replace Blueprint (expand slots)
  expandBlueprintSlots(state, newAge);

  // Step 5: Enter free Design Bureau phase
  // Players take turns installing upgrades (no Hull Upgrade Rule charges)
  state.phase = 'age_transition_design_bureau';
  state.ageTransitionDesignBureau = {
    newAge,
    currentPlayerIndex: 0,
    completedPlayers: []
  };

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Age transition to Age ${newAge} - Free Blueprint Upgrade phase begins`,
    type: 'system'
  } as LogEntry);
}

/**
 * Complete age transition after free Design Bureau phase
 * Called when all players have completed their free swaps
 */
function completeAgeTransition(state: AgeTransitionState): void {
  const newAge = state.ageTransitionDesignBureau?.newAge || state.age + 1;

  // Apply faction-specific flaws
  applyBritainRedTape(state);

  // GAP-046: Reset Fire-Resistant Fabric protection for new age
  resetFireProtection(state);

  // Update game age
  state.age = newAge;

  // Clear map routes (they're lost at age transition) or replace with new map
  if (newAge === 3) {
    // Age III uses a completely different map (The Atlantic)
    const { createAgeIIIMap } = require('../../services/gameStateService');
    state.map = createAgeIIIMap();
  } else if (state.map && state.map.routes) {
    // Age II keeps same map but clears claims
    for (const route of state.map.routes as Array<Route & { claimed?: string | null }>) {
      route.claimed = null;
    }
  }

  // Set up combat missions for Age II, or clear them for Age III
  if (newAge === 2) {
    // Per Section 10.5 and Appendix G: Set up Combat Mission Row for Age II
    const { missionRow, missionDeck } = setupMissionRow() as { missionRow: unknown[]; missionDeck: unknown[] };
    state.missionRow = missionRow;
    state.missionDeck = missionDeck;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Combat Mission Row established with 6 missions.`,
      type: 'system'
    } as LogEntry);
  } else if (newAge === 3) {
    // Clear combat missions when leaving Age II
    delete state.missionRow;
    delete state.missionDeck;
  }

  // Add new age tech cards to bag per Section 3.1
  addAgeTechCards(state, newAge);

  // Refill R&D board with new age tech cards
  refillRDBoard(state);

  // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
  state.gasMarket = { hydrogen: 1, helium: 2 };

  // Clean up transition state
  delete state.ageTransitionDesignBureau;

  // Return to worker placement for new age
  state.phase = 'worker_placement';

  // === Worker Placement Setup ===
  // This was skipped in startNewRound because of the age transition

  // Reset worker placement state for all players
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId] as ExtendedPlayerState;
    playerState.agentsRemaining = playerState.agents || (INITIAL_AGENTS as number);
    playerState.hasPassed = false;
  }

  // Clear Ground Board placements
  state.groundBoard.placements = {};

  // Calculate new turn order based on income
  state.workerPlacement = {
    passedPlayers: [],
    ministryVisitors: [],
    placementOrder: calculateTurnOrder(state),
    currentPlacerIndex: 0
  };

  // Reset reveal phase
  (state as GameState & { revealPhase?: unknown }).revealPhase = {
    revealedHands: {},
    resourcesCollected: {},
    techAcquisitionsComplete: {},
    marketPurchasesComplete: {}
  };

  // Draw cards to hand size of 5 for each player
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    const cardsNeeded = (HAND_SIZE as number) - (playerState.hand?.length || 0);

    for (let i = 0; i < cardsNeeded; i++) {
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        // Reshuffle discard into deck
        playerState.deck = shuffleArray([...playerState.discardPile]) as Card[];
        playerState.discardPile = [];
      }

      if (playerState.deck.length > 0) {
        const card = playerState.deck.pop();
        if (card) {
          playerState.hand.push(card);
        }
      }
    }
  }

  // Refresh R&D Board (replenish tech cards)
  refreshRnDBoard(state);

  // Refill Market Row
  refreshMarketRow(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `=== Age ${newAge} begins! ===`,
    type: 'system'
  } as LogEntry);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Round ${state.round} begins. Worker Placement phase started.`,
    type: 'phase'
  } as LogEntry);
}

/**
 * Perform full age transition per Section 12.1
 * This starts the transition; completeAgeTransition finishes it after Design Bureau phase
 */
function performAgeTransition(state: AgeTransitionState, newAge: number): void {
  startAgeTransition(state, newAge);
}

export {
  calculateTechCardVP,
  calculateRouteVP,
  scoreAgeVP,
  scoreAllPlayersVP,
  recoverShipsAndOfficers,
  calculateTransitionIncome,
  expandBlueprintSlots,
  applyBritainRedTape,
  resetFireProtection,
  performAgeTransition,
  startAgeTransition,
  completeAgeTransition,
  getBlueprintSlotsForFaction,
  BLUEPRINT_SLOTS
};

// Legacy aliases for backwards compatibility during migration
export const calculateTechnologyVP = calculateTechCardVP;
export const addAgeTechnologies = addAgeTechCards;

// CommonJS compatibility
module.exports = {
  calculateTechCardVP,
  calculateRouteVP,
  scoreAgeVP,
  scoreAllPlayersVP,
  recoverShipsAndOfficers,
  calculateTransitionIncome,
  expandBlueprintSlots,
  applyBritainRedTape,
  resetFireProtection,
  performAgeTransition,
  startAgeTransition,
  completeAgeTransition,
  getBlueprintSlotsForFaction,
  BLUEPRINT_SLOTS,
  // Legacy aliases for backwards compatibility during migration
  calculateTechnologyVP: calculateTechCardVP,
  addAgeTechnologies: addAgeTechCards
};
