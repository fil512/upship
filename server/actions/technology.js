/**
 * Technology Actions
 * ACQUIRE_TECHNOLOGY, ACQUIRE_TECHNOLOGY_RESEARCH, GAIN_RESEARCH action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { shuffleArray } = require('../utils/random');
const { refillRDBoard } = require('./helpers/marketHelpers');
const { TECHNOLOGY_BAG } = require('../config/constants');
const { performAgeTransition } = require('./helpers/ageTransition');

/**
 * Add new age technologies to the tech bag
 *
 * @param {Object} state - Game state (mutated)
 * @param {number} age - Age number (2 or 3)
 */
function addAgeTechnologies(state, age) {
  const newTechs = TECHNOLOGY_BAG[age] || [];
  if (newTechs.length > 0) {
    // Collect all technologies already owned by any player
    const ownedTechs = new Set();
    for (const pid of Object.keys(state.players || {})) {
      for (const tech of state.players[pid].technologies || []) {
        ownedTechs.add(tech);
      }
    }

    // Filter out already-owned technologies and add age marker
    const techsWithAge = newTechs
      .filter(t => !ownedTechs.has(t.id))
      .map(t => ({ ...t, age }));

    // Shuffle and add to tech bag
    state.techBag = state.techBag || [];
    state.techBag.push(...shuffleArray(techsWithAge));
  }
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
 * Calculate specialization discount based on techs in same track
 *
 * @param {string[]} playerTechs - Array of technology IDs player owns
 * @param {string} techType - Type of technology being acquired
 * @returns {number} Discount amount
 */
function calculateSpecializationDiscount(playerTechs, techType) {
  const techTypeMap = {
    structure: ['rigid_frame', 'duralumin_girders', 'wooden_framework', 'wire_bracing', 'steel_framework', 'internal_keel', 'geodetic_structure', 'modular_construction'],
    fabric: ['dining_saloon', 'rubberized_cotton', 'doped_canvas', 'goldbeater_skin', 'fireproof_coating', 'aluminum_doping', 'composite_covering'],
    drive: ['maybach_engine', 'daimler_engine', 'improved_propeller', 'dual_engine_mount', 'diesel_powerplant', 'streamlined_nacelle', 'supercharged_engine'],
    component: ['passenger_gondola', 'observation_deck', 'cargo_systems', 'radio_equipment', 'sleeping_quarters', 'mail_systems', 'luxury_fittings', 'advanced_navigation', 'pressurization'],
    gas: ['helium_handling']
  };

  const techsInTrack = playerTechs.filter(t => {
    for (const [type, ids] of Object.entries(techTypeMap)) {
      if (ids.includes(t) && type === techType) return true;
    }
    return false;
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
  const { techId } = data;
  const playerState = state.players[playerId];

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

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Acquired ${tech.name} for ${cost} research${discount > 0 ? ` (${discount} discount)` : ''}. Progress: ${state.progressTrack}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Gain research points (from Research Institute or card effects)
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

module.exports = {
  processAcquireTechnology,
  processAcquireTechnologyResearch,
  processGainResearch,
  addAgeTechnologies,
  calculateSpecializationDiscount
};
