/**
 * Combat Mission Actions - Age II
 * Per Section 10.5 and Appendix G
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { refillMissionRow } = require('../data/combatMissions');

/**
 * Resolve Flak Check after successful mission
 * Per Section 10.5: "If Flak > Armor, ship is destroyed. Max Armor is 4; 5 Flak always destroys."
 *
 * @param {Object} ship - Ship with armor stat
 * @param {Object} hazardCard - Hazard card with flak value
 * @returns {Object} { destroyed: boolean, reason?: string }
 */
function resolveFlakCheck(ship, hazardCard) {
  const armor = ship.armor || 0;
  const flak = hazardCard.flak || 0;

  // Per rules: "If Flak > Armor, ship is destroyed"
  // Max Armor is 4, so Flak 5 always destroys
  if (flak > armor) {
    return {
      destroyed: true,
      reason: `Flak ${flak} exceeds Armor ${armor} - ship destroyed by anti-aircraft fire`
    };
  }

  return {
    destroyed: false,
    reason: `Armor ${armor} withstood Flak ${flak}`
  };
}

/**
 * Check if ship meets mission requirements
 * @param {Object} shipStats - Ship's calculated stats
 * @param {Object} mission - Combat mission with requirements
 * @returns {Object} { valid: boolean, failures: string[] }
 */
function validateMissionRequirements(shipStats, mission) {
  const failures = [];

  if (mission.range && shipStats.range < mission.range) {
    failures.push(`Range ${shipStats.range} < required ${mission.range}`);
  }
  if (mission.speed && shipStats.speed < mission.speed) {
    failures.push(`Speed ${shipStats.speed} < required ${mission.speed}`);
  }
  if (mission.ceiling && shipStats.ceiling < mission.ceiling) {
    failures.push(`Ceiling ${shipStats.ceiling} < required ${mission.ceiling}`);
  }
  if (mission.reliability && shipStats.reliability < mission.reliability) {
    failures.push(`Reliability ${shipStats.reliability} < required ${mission.reliability}`);
  }

  return {
    valid: failures.length === 0,
    failures
  };
}

/**
 * Process completing a combat mission
 * Per Appendix G: Award income, store for VP, refill Mission Row
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Player who completed the mission
 * @param {Object} mission - The completed mission
 */
function processCompleteMission(state, playerId, mission) {
  const playerState = state.players[playerId];

  // Award income (increase Income Track)
  playerState.income = (playerState.income || 0) + mission.income;

  // Store completed mission for VP scoring
  if (!playerState.completedMissions) {
    playerState.completedMissions = [];
  }
  playerState.completedMissions.push({ ...mission });

  // Remove mission from Mission Row
  if (state.missionRow) {
    const missionIndex = state.missionRow.findIndex(m => m.id === mission.id);
    if (missionIndex !== -1) {
      state.missionRow.splice(missionIndex, 1);
    }

    // Refill Mission Row to 6 cards
    refillMissionRow(state);
  }

  // Log the completion
  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Completed mission: ${mission.name} (+${mission.income} income, ${mission.vp} VP)`,
    playerId,
    type: 'action'
  });
}

/**
 * Calculate bonus income from special equipment
 * @param {Object} playerState - Player state with blueprint
 * @param {Object} mission - Mission with potential bonuses
 * @returns {number} Additional income from equipment bonuses
 */
function calculateEquipmentBonus(playerState, mission) {
  let bonus = 0;
  const componentSlots = playerState.blueprint?.componentSlots || [];

  if (mission.special === 'bombing_equipment_bonus') {
    if (componentSlots.includes('bombing_equipment')) {
      bonus += mission.specialBonus?.income || 0;
    }
  }

  if (mission.special === 'communications_bonus') {
    if (componentSlots.includes('communications_suite')) {
      bonus += mission.specialBonus?.income || 0;
    }
  }

  return bonus;
}

/**
 * Process launching a ship for a combat mission in Age II
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId, missionId, gasType }
 * @returns {Object} { newState, requiresHazardCheck: true }
 */
function processLaunchCombatMission(state, playerId, data) {
  const { shipId, missionId, gasType = 'hydrogen' } = data;
  const playerState = state.players[playerId];

  // Verify we're in Age II
  if (state.age !== 2) {
    throw new GameRuleError('Combat Missions are only available in Age II');
  }

  // Find the mission in the Mission Row
  const missionIndex = state.missionRow?.findIndex(m => m.id === missionId);
  if (missionIndex === -1 || missionIndex === undefined) {
    throw new GameRuleError(`Mission not found in Mission Row: ${missionId}`);
  }

  const mission = state.missionRow[missionIndex];

  // Validate ship exists in hangar
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');
  if (shipIndex === -1) {
    throw new GameRuleError('Ship not found in hangar');
  }

  // Calculate ship stats and validate mission requirements
  const { calculateBlueprintStats } = require('./launch');
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  const validation = validateMissionRequirements(stats, mission);
  if (!validation.valid) {
    throw new GameRuleError(`Ship does not meet mission requirements: ${validation.failures.join(', ')}`);
  }

  // Validate gas type
  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Gas type must be hydrogen or helium');
  }

  // Helium requires Helium Handling technology
  if (gasType === 'helium') {
    const hasHeliumHandling = playerState.technologies?.some(t =>
      (typeof t === 'string' ? t : t.id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot use Helium without Helium Handling technology');
    }
  }

  // Calculate and validate officers
  const requiredOfficers = 2; // Age II requires 2 officers
  if ((playerState.officers || 0) < requiredOfficers) {
    throw new InsufficientFundsError(requiredOfficers, playerState.officers || 0, 'Officers');
  }

  // Calculate and validate gas cubes
  const { calculateRequiredGasCubes } = require('./launch');
  const requiredCubes = calculateRequiredGasCubes(playerState.blueprint);
  const availableCubes = playerState.gasCubes?.[gasType] || 0;

  if (availableCubes < requiredCubes) {
    throw new InsufficientFundsError(requiredCubes, availableCubes, gasType);
  }

  // Spend resources
  playerState.officers -= requiredOfficers;
  playerState.gasCubes[gasType] -= requiredCubes;

  // Set ship to awaiting hazard check
  ships[shipIndex].status = 'awaiting_hazard';
  ships[shipIndex].stats = stats;
  ships[shipIndex].pendingMissionId = missionId;
  ships[shipIndex].gasType = gasType;
  ships[shipIndex].launchedAge = state.age;

  // Calculate armor for flak check
  const armor = calculateShipArmor(playerState.blueprint);
  ships[shipIndex].armor = armor;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship for mission: ${mission.name} - HAZARD CHECK REQUIRED`,
    playerId,
    type: 'action'
  });

  return { newState: state, requiresHazardCheck: true };
}

/**
 * Calculate ship's Armor stat from blueprint
 * Per Section 10.5: Light Armor Plating (+1), Heavy Armor Plating (+2)
 */
function calculateShipArmor(blueprint) {
  let armor = 0;
  const componentSlots = blueprint?.componentSlots || [];

  for (const upgradeId of componentSlots) {
    if (upgradeId === 'light_armor_plating') armor += 1;
    if (upgradeId === 'heavy_armor_plating') armor += 2;
  }

  // Max armor is 4
  return Math.min(armor, 4);
}

/**
 * Validate USA faction's late war entry restriction
 * Per Section 13.3: "Flaw: Late to enter war. Cannot acquire a combat
 * mission until all other players have one."
 *
 * @param {Object} state - Game state
 * @param {string} playerId - Player attempting to acquire mission
 * @returns {Object} { allowed: boolean, reason?: string }
 */
function validateUsaMissionRestriction(state, playerId) {
  const playerState = state.players[playerId];

  // Only applies to USA faction
  if (playerState.faction !== 'usa') {
    return { allowed: true };
  }

  // If USA already has at least one mission, no restriction
  if (playerState.completedMissions && playerState.completedMissions.length > 0) {
    return { allowed: true };
  }

  // Check if all other players have at least one completed mission
  for (const otherId of Object.keys(state.players)) {
    if (otherId === playerId) continue;

    const otherPlayer = state.players[otherId];
    const otherMissions = otherPlayer.completedMissions || [];

    if (otherMissions.length === 0) {
      return {
        allowed: false,
        reason: 'Late to enter war: USA cannot acquire a combat mission until all other players have one'
      };
    }
  }

  // All other players have at least one mission
  return { allowed: true };
}

module.exports = {
  resolveFlakCheck,
  validateMissionRequirements,
  processCompleteMission,
  processLaunchCombatMission,
  calculateEquipmentBonus,
  calculateShipArmor,
  validateUsaMissionRestriction
};
