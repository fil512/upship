/**
 * Technology Actions
 * ACQUIRE_TECHNOLOGY, ACQUIRE_TECHNOLOGY_RESEARCH, GAIN_RESEARCH action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { refillRDBoard } = require('./helpers/marketHelpers');
const { TECHNOLOGY_BAG, RESEARCH_INSTITUTE_COST } = require('../config/constants');
const { performAgeTransition } = require('./helpers/ageTransition');

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
 * Check and handle age transition based on progress track
 * Per Section 12.1, this triggers all age transition steps when threshold reached
 *
 * @param {Object} state - Game state (mutated)
 */
function checkAgeTransition(state) {
  const thresholds = state.progressThresholds || { age2: 10, age3: 20, end: 30 };

  if (state.age === 1 && state.progressTrack >= thresholds.age2) {
    // Perform full age transition per Section 12.1
    performAgeTransition(state, 2);

    // Add new age technologies to bag
    addAgeTechnologies(state, 2);
    refillRDBoard(state);

    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `New technologies available. Gas market reset.`,
      type: 'system'
    });
  } else if (state.age === 2 && state.progressTrack >= thresholds.age3) {
    // Perform full age transition per Section 12.1
    performAgeTransition(state, 3);

    // Add new age technologies to bag
    addAgeTechnologies(state, 3);
    refillRDBoard(state);

    // Reset gas market prices for new age (Section 4.4: Helium resets to £2 at Age Transitions)
    state.gasMarket = { hydrogen: 1, helium: 2 };

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Final era technologies unlocked. Gas market reset.`,
      type: 'system'
    });
  }
}

/**
 * Acquire technology from R&D board using cash
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { techId }
 * @returns {Object} { newState } or throws error
 */
function processAcquireTechnology(state, playerId, data) {
  const { techId } = data;
  const playerState = state.players[playerId];

  const techIndex = state.rdBoard.findIndex(t => t.id === techId);
  if (techIndex === -1) {
    throw new GameRuleError('Technology not available');
  }

  const tech = state.rdBoard[techIndex];

  if (playerState.cash < tech.cost) {
    throw new InsufficientFundsError(tech.cost, playerState.cash);
  }

  // Check if player already has this technology
  if (playerState.technologies.includes(techId)) {
    throw new GameRuleError('Already own this technology');
  }

  playerState.cash -= tech.cost;
  playerState.technologies.push(techId);

  // Remove from R&D board
  state.rdBoard.splice(techIndex, 1);

  // Draw replacement from tech bag if available
  if (state.techBag && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }

  // Advance progress track
  state.progressTrack = (state.progressTrack || 0) + 1;

  // Check for age transition
  checkAgeTransition(state);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} technology. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Build a lookup map of tech ID -> type from TECHNOLOGY_BAG
 * Per Section 4.1: Technologies are organized into four Drawing Office tracks:
 * - Propulsion (drive): Engine and drive technologies
 * - Structure: Frame, hull, and safety systems
 * - Gas Systems (gas): Lifting gas and fuel technologies
 * - Payload (component): Passenger, cargo, and mission equipment
 * - Fabric: Outer covering materials (treated as a separate track)
 */
function buildTechTypeMap() {
  const map = {};
  for (const age of [1, 2, 3]) {
    for (const tech of TECHNOLOGY_BAG[age] || []) {
      map[tech.id] = tech.type;
    }
  }
  // Add faction starting technologies that may not be in TECHNOLOGY_BAG
  // These are mapped to their logical tracks
  map['blaugas_storage'] = 'gas';
  map['helium_handling'] = 'gas';
  map['imperial_mooring'] = 'structure';
  map['trapeze_system'] = 'component';
  map['articulated_keel'] = 'structure';
  map['gelatinized_latex'] = 'fabric';
  return map;
}

const TECH_TYPE_MAP = buildTechTypeMap();

/**
 * Calculate specialization discount based on techs in same track
 * Per Section 4.1 Specialization Discount:
 * - 1-2 techs in track: No discount
 * - 3-4 techs in track: -1 Research discount
 * - 5+ techs in track: -2 Research discount
 *
 * @param {string[]} playerTechs - Array of technology IDs player owns
 * @param {string} techType - Type of technology being acquired
 * @returns {number} Discount amount
 */
function calculateSpecializationDiscount(playerTechs, techType) {
  // Count player's technologies that match the target type
  const techsInTrack = playerTechs.filter(techId => {
    const existingType = TECH_TYPE_MAP[techId];
    return existingType === techType;
  }).length;

  if (techsInTrack >= 5) return 2;
  if (techsInTrack >= 3) return 1;
  return 0;
}

/**
 * Acquire technology using research points
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { techId }
 * @returns {Object} { newState } or throws error
 */
function processAcquireTechnologyResearch(state, playerId, data) {
  const { techId, _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Per Section 5.1: Tech acquisitions during reveal must go through atomic REVEAL action
  if (!_internal) {
    throw new GameRuleError(
      'ACQUIRE_TECHNOLOGY_RESEARCH not allowed: Use the atomic REVEAL action to acquire technologies (Section 5.1). ' +
      'Submit your techAcquisitions[] when calling REVEAL.'
    );
  }

  const techIndex = state.rdBoard.findIndex(t => t.id === techId);
  if (techIndex === -1) {
    throw new GameRuleError('Technology not available on R&D Board');
  }

  const tech = state.rdBoard[techIndex];

  // Check if player already has this technology
  if (playerState.technologies.includes(techId)) {
    throw new GameRuleError('Already own this technology');
  }

  // Calculate cost with specialization discount
  const discount = calculateSpecializationDiscount(playerState.technologies, tech.type);
  const cost = Math.max(0, tech.cost - discount);

  // Calculate available research
  const availableResearch = (playerState.research || 0) + (playerState.engineers || 0);

  if (availableResearch < cost) {
    throw new InsufficientFundsError(cost, availableResearch, 'research');
  }

  // Spend research (from saved first, then engineers provide the rest)
  const savedResearch = playerState.research || 0;
  if (savedResearch >= cost) {
    playerState.research = savedResearch - cost;
  } else {
    playerState.research = 0;
    // The rest comes from engineers (they're not spent, just used)
  }

  // Add technology
  playerState.technologies.push(techId);

  // Remove from R&D board
  state.rdBoard.splice(techIndex, 1);

  // Draw replacement from tech bag if available
  if (state.techBag && state.techBag.length > 0) {
    state.rdBoard.push(state.techBag.shift());
  }

  // Advance progress track
  state.progressTrack = (state.progressTrack || 0) + 1;

  // Check for age transition
  checkAgeTransition(state);

  const discountNote = discount > 0 ? ` (${discount} discount)` : '';
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} for ${cost} research${discountNote}. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Gain research points (from card effects)
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { amount }
 * @returns {Object} { newState } or throws error
 */
function processGainResearch(state, playerId, data) {
  const { amount = 1 } = data;
  const playerState = state.players[playerId];

  playerState.research = (playerState.research || 0) + amount;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Gained ${amount} research point(s). Total saved: ${playerState.research}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Upgrade Research Level Track at Research Institute
 *
 * Per Section 6.1:
 * Cost: £4 per level.
 * Effect: Increase your Research Level Track by 1 step.
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { levels, _internal }
 * @returns {Object} { newState } or throws error
 */
function processUpgradeResearchLevel(state, playerId, data) {
  const { levels = 1, _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'UPGRADE_RESEARCH_LEVEL not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Research Institute during worker placement phase to upgrade research level.'
      );
    }
    const placement = state.groundBoard?.placements?.research_institute;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'UPGRADE_RESEARCH_LEVEL not allowed: You must place an agent at Research Institute to upgrade research level. ' +
        'Use PLACE_AGENT with locationId "research_institute" and levels parameter.'
      );
    }
  }

  // Handle levels=0 as a no-op (just visiting the location)
  if (levels === 0) {
    return { newState: state };
  }

  const totalCost = RESEARCH_INSTITUTE_COST * levels;

  if (playerState.cash < totalCost) {
    throw new InsufficientFundsError(totalCost, playerState.cash);
  }

  playerState.cash -= totalCost;
  playerState.researchLevel = (playerState.researchLevel || 0) + levels;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Research Level to ${playerState.researchLevel} for £${totalCost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processAcquireTechnology,
  processAcquireTechnologyResearch,
  processGainResearch,
  processUpgradeResearchLevel,
  addAgeTechnologies,
  calculateSpecializationDiscount
};
