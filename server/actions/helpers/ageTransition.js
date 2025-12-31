/**
 * Age Transition Helpers
 * Implementation of Section 12 - Age Transitions
 */

const { TECHNOLOGY_BAG, HAND_SIZE, INITIAL_AGENTS } = require('../../config/constants');
const { setupMissionRow } = require('../../data/combatMissions');
const { shuffleArray } = require('../../utils/random');
const { calculateTurnOrder } = require('./turnOrder');
const { refreshRnDBoard, refreshMarketRow, refillRDBoard } = require('./marketHelpers');

/**
 * Add new age technologies to the tech bag
 * Per Section 3.1: Include (N-1) copies of each tech where N = player count
 *
 * @param {Object} state - Game state (mutated)
 * @param {number} age - Age number (2 or 3)
 */
function addAgeTechnologies(state, age) {
  const newTechs = TECHNOLOGY_BAG[age] || [];
  if (newTechs.length === 0) return;

  const playerCount = state.playerCount || Object.keys(state.players || {}).length;
  const copiesPerTech = Math.max(1, playerCount - 1);

  // Count how many copies of each tech are already owned
  const ownedCounts = {};
  for (const pid of Object.keys(state.players || {})) {
    for (const tech of state.players[pid].technologies || []) {
      ownedCounts[tech] = (ownedCounts[tech] || 0) + 1;
    }
  }

  // Add (N-1) - ownedCount copies of each new age tech
  const techsToAdd = [];
  for (const tech of newTechs) {
    const ownedCount = ownedCounts[tech.id] || 0;
    const copiesToAdd = Math.max(0, copiesPerTech - ownedCount);

    for (let i = 0; i < copiesToAdd; i++) {
      techsToAdd.push({ ...tech, age });
    }
  }

  // Shuffle and add to tech bag
  state.techBag = state.techBag || [];
  state.techBag.push(...shuffleArray(techsToAdd));
}

/**
 * Get all technology definitions flattened from all ages
 */
function getAllTechnologyDefinitions() {
  const allTechs = {};
  for (const age of [1, 2, 3]) {
    for (const tech of (TECHNOLOGY_BAG[age] || [])) {
      allTechs[tech.id] = tech;
    }
  }
  return allTechs;
}

/**
 * Calculate VP from technologies based on their VP values per Section 12.2
 * @param {string[]} techIds - Array of technology IDs
 * @returns {number} Total VP from technologies
 */
function calculateTechnologyVP(techIds) {
  const techDefs = getAllTechnologyDefinitions();
  let totalVP = 0;

  for (const techId of techIds) {
    const tech = techDefs[techId];
    if (tech && typeof tech.vp === 'number') {
      totalVP += tech.vp;
    }
  }

  return totalVP;
}

/**
 * Calculate VP from claimed routes per Section 12.2 and Appendix F
 * Routes have explicit `vp` property per Appendix F specifications
 * @param {Object} state - Game state
 * @param {string} playerId - Player ID
 * @returns {number} Total VP from routes
 */
function calculateRouteVP(state, playerId) {
  const routes = state.map?.routes || [];
  let totalVP = 0;

  for (const route of routes) {
    if (route.claimed === playerId) {
      totalVP += route.vp || 0;
    }
  }

  return totalVP;
}

/**
 * Score VP for a player at age transition per Section 12.1 and 12.2
 * @param {Object} state - Game state
 * @param {string} playerId - Player ID
 * @returns {Object} VP breakdown { routes, technologies, total }
 */
function scoreAgeVP(state, playerId) {
  const playerState = state.players[playerId];

  const routeVP = calculateRouteVP(state, playerId);
  const techVP = calculateTechnologyVP(playerState.technologies || []);

  return {
    routes: routeVP,
    technologies: techVP,
    total: routeVP + techVP
  };
}

/**
 * Score VP for all players during age transition
 * @param {Object} state - Game state (mutated)
 */
function scoreAllPlayersVP(state) {
  for (const playerId of Object.keys(state.players)) {
    const vpScored = scoreAgeVP(state, playerId);
    state.players[playerId].vp = (state.players[playerId].vp || 0) + vpScored.total;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Age ${state.age} scoring: ${vpScored.routes} VP from routes, ${vpScored.technologies} VP from technologies`,
      playerId,
      type: 'scoring'
    });
  }
}

/**
 * Recover ships and officers at age transition per Section 12.1 step 2
 * Ships return to hangar (max 3), officers return based on age
 * @param {Object} state - Game state (mutated)
 */
function recoverShipsAndOfficers(state) {
  const currentAge = state.age;
  const MAX_HANGAR_CAPACITY = 3;

  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];
    const shipsOnRoutes = (playerState.ships || []).filter(s => s.status === 'on_route');

    let shipsRecovered = 0;
    let officersRecovered = 0;

    for (const ship of shipsOnRoutes) {
      if (shipsRecovered >= MAX_HANGAR_CAPACITY) {
        // Ship is lost - remove from player's ships
        ship.status = 'lost';
      } else {
        // Return ship to hangar
        ship.status = 'in_hangar';
        ship.routeId = null;
        shipsRecovered++;

        // Recover officers based on ship's age
        const shipAge = ship.age || currentAge;
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
      });
    }
  }
}

/**
 * Calculate transition income per Section 12.1 step 3
 * New Income = Tech income - £1 per route lost, minimum 0
 * @param {Object} state - Game state (mutated)
 */
function calculateTransitionIncome(state) {
  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];

    // Count routes being lost
    const routes = state.map?.routes || [];
    const routesLost = routes.filter(r => r.claimed === playerId).length;

    // Calculate income from technologies (if they grant income)
    // Note: Most technologies don't grant income, so this is primarily the penalty
    let techIncome = 0;
    // Technologies that grant income would add to techIncome here
    // For now, starting income is the base
    const baseIncome = 5; // Starting income per Section 3.2

    // Apply route loss penalty
    const newIncome = Math.max(0, baseIncome + techIncome - routesLost);

    // Don't reduce below current level if already lower
    playerState.income = Math.max(0, Math.min(playerState.income, newIncome + playerState.income - baseIncome));

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Income adjusted: lost ${routesLost} routes`,
      playerId,
      type: 'age_transition'
    });
  }
}

/**
 * Blueprint slot configurations by age per Section 4.2
 * Note: Italy has -1 componentSlots in Ages II and III (Section 13.4)
 */
const BLUEPRINT_SLOTS = {
  1: { frameSlots: 1, fabricSlots: 1, driveSlots: 1, componentSlots: 1 },
  2: { frameSlots: 1, fabricSlots: 1, driveSlots: 2, componentSlots: 2 },
  3: { frameSlots: 2, fabricSlots: 2, driveSlots: 2, componentSlots: 3 }
};

/**
 * Get blueprint slot configuration for a faction at a given age
 * Applies Italy's "Compact Design" flaw: -1 Payload slot in Ages II and III
 * Per Section 13.4 and Section 13.5
 */
function getBlueprintSlotsForFaction(age, faction) {
  const baseSlots = { ...BLUEPRINT_SLOTS[age] };

  // Italy's Compact Design flaw: one fewer Payload slot in Ages II and III
  if (faction === 'italy' && age >= 2) {
    baseSlots.componentSlots -= 1;
  }

  return baseSlots;
}

/**
 * Expand blueprint slots for new age per Section 12.1 step 4
 * @param {Object} state - Game state (mutated)
 * @param {number} newAge - The age transitioning to
 */
function expandBlueprintSlots(state, newAge) {
  if (!BLUEPRINT_SLOTS[newAge]) return;

  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];
    const blueprint = playerState.blueprint;

    // Get faction-specific slot configuration (handles Italy's Compact Design flaw)
    const slotConfig = getBlueprintSlotsForFaction(newAge, playerState.faction);

    // Update age
    blueprint.age = newAge;

    // Expand each slot type while preserving existing upgrades
    for (const slotType of ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots']) {
      const targetSize = slotConfig[slotType];
      const currentSlots = blueprint[slotType] || [];

      // Add null slots to reach target size
      while (currentSlots.length < targetSize) {
        currentSlots.push(null);
      }

      blueprint[slotType] = currentSlots;
    }

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Blueprint upgraded to Age ${newAge}`,
      playerId,
      type: 'age_transition'
    });
  }
}

/**
 * Reset Fire-Resistant Fabric protection for new age per GAP-046
 * Per Appendix D: Fire-Resistant Fabric grants "Once per Age, treat one Fire hazard as auto-pass"
 * @param {Object} state - Game state (mutated)
 */
function resetFireProtection(state) {
  for (const playerId of Object.keys(state.players)) {
    state.players[playerId].fireProtectionUsedThisAge = false;
  }
}

/**
 * Apply Britain's Red Tape flaw per Section 13.2
 * Reduce income by 1 at each age transition
 * @param {Object} state - Game state (mutated)
 */
function applyBritainRedTape(state) {
  for (const playerId of Object.keys(state.players)) {
    const playerState = state.players[playerId];

    if (playerState.faction === 'britain') {
      playerState.income = Math.max(0, playerState.income - 1);

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Red Tape: Income reduced by 1 (bureaucratic overhead)`,
        playerId,
        type: 'faction_flaw'
      });
    }
  }
}

/**
 * Start age transition - performs steps 1-4 and enters free Design Bureau phase
 * Per Section 12.1 step 5: Each player gets a free Design Bureau action
 * @param {Object} state - Game state (mutated)
 * @param {number} newAge - The age to transition to
 */
function startAgeTransition(state, newAge) {
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
  });
}

/**
 * Complete age transition after free Design Bureau phase
 * Called when all players have completed their free swaps
 * @param {Object} state - Game state (mutated)
 */
function completeAgeTransition(state) {
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
    for (const route of state.map.routes) {
      route.claimed = null;
    }
  }

  // Set up combat missions for Age II, or clear them for Age III
  if (newAge === 2) {
    // Per Section 10.5 and Appendix G: Set up Combat Mission Row for Age II
    const { missionRow, missionDeck } = setupMissionRow();
    state.missionRow = missionRow;
    state.missionDeck = missionDeck;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Combat Mission Row established with 6 missions.`,
      type: 'system'
    });
  } else if (newAge === 3) {
    // Clear combat missions when leaving Age II
    delete state.missionRow;
    delete state.missionDeck;
  }

  // Add new age technologies to bag per Section 3.1
  addAgeTechnologies(state, newAge);

  // Refill R&D board with new age technologies
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
    const playerState = state.players[playerId];
    playerState.agentsRemaining = playerState.agents || INITIAL_AGENTS;
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

  // Reset reveal phase tracking
  state.revealPhase = {
    revealedHands: {},
    resourcesCollected: {},
    techAcquisitionsComplete: {},
    marketPurchasesComplete: {}
  };

  // Draw cards to hand size of 5 for each player
  for (const playerId of state.playerOrder) {
    const playerState = state.players[playerId];
    const cardsNeeded = HAND_SIZE - (playerState.hand?.length || 0);

    for (let i = 0; i < cardsNeeded; i++) {
      if (playerState.deck.length === 0 && playerState.discardPile.length > 0) {
        // Reshuffle discard into deck
        playerState.deck = shuffleArray([...playerState.discardPile]);
        playerState.discardPile = [];
      }

      if (playerState.deck.length > 0) {
        playerState.hand.push(playerState.deck.pop());
      }
    }
  }

  // Refresh R&D Board (replenish technologies)
  refreshRnDBoard(state);

  // Refill Market Row
  refreshMarketRow(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `=== Age ${newAge} begins! ===`,
    type: 'system'
  });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Turn ${state.turn} begins. Worker Placement phase started.`,
    type: 'phase'
  });
}

/**
 * Perform full age transition per Section 12.1
 * This starts the transition; completeAgeTransition finishes it after Design Bureau phase
 * @param {Object} state - Game state (mutated)
 * @param {number} newAge - The age to transition to
 */
function performAgeTransition(state, newAge) {
  startAgeTransition(state, newAge);
}

module.exports = {
  calculateTechnologyVP,
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
