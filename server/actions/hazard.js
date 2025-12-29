/**
 * Hazard Actions
 * PERFORM_HAZARD_CHECK action processor
 * Implements hazard checks per Section 8.2, fire hazards per Section 8.3, and Hindenburg Disaster (Section 1.2)
 */

const { GameRuleError } = require('../errors');
const { applyCityBonus, CITY_BONUSES } = require('../data/cities');

/**
 * Check if Hindenburg Disaster conditions are met per Section 1.2
 * All conditions must be true:
 * - Age III
 * - Hydrogen gas
 * - Luxury route
 * - Catastrophic Explosion hazard
 *
 * @param {Object} conditions - { age, gasType, isLuxuryRoute, hazardType }
 * @returns {boolean} True if Hindenburg Disaster triggered
 */
function checkHindenburgDisaster(conditions) {
  const { age, gasType, isLuxuryRoute, hazardType } = conditions;

  return (
    age === 3 &&
    gasType === 'hydrogen' &&
    isLuxuryRoute === true &&
    hazardType === 'catastrophic_explosion'
  );
}

/**
 * Get the relevant ship stat for a hazard's challenge type
 *
 * @param {Object} shipStats - Ship's stats object
 * @param {string} challengeType - Challenge type (speed, reliability, ceiling, range)
 * @returns {number} The stat value
 */
function getRelevantStat(shipStats, challengeType) {
  switch (challengeType) {
    case 'speed':
      return shipStats.speed || 0;
    case 'reliability':
      return shipStats.reliability || 0;
    case 'ceiling':
      return shipStats.ceiling || 0;
    case 'range':
      return shipStats.range || 0;
    default:
      // Default to reliability for backwards compatibility
      return shipStats.reliability || 0;
  }
}

/**
 * Perform a hazard check for a ship awaiting launch
 *
 * Per Section 8.2:
 * 1. Check if auto-pass (Clear Weather or Helium vs Fire)
 * 2. Compare your Blueprint's relevant stat to the Difficulty
 * 3. If stat >= Difficulty, you pass
 * 4. If stat < Difficulty, you may spend Engineers (+1 each) to boost your check
 * 5. If still failing, the launch is Aborted
 *
 * Per Section 8.3 (Fire Hazards):
 * - Fire hazards only affect Hydrogen ships (Helium auto-passes)
 * - Engine Fire: Spend 1 Engineer -> Damaged, Fail -> Crash
 * - Gas Cell Rupture: Spend 2 Engineers -> Damaged, Fail -> Crash
 * - Static Discharge: Difficulty 4 Reliability check, Fail -> Crash
 * - Catastrophic Explosion: No save, Crash
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId, engineersToSpend }
 * @returns {Object} { newState } or throws error
 */
function processHazardCheck(state, playerId, data) {
  const { shipId, engineersToSpend = 0 } = data;
  const playerState = state.players[playerId];

  // Find the ship - accept both 'awaiting_hazard' and legacy 'on_route' status
  const ships = playerState.ships || [];
  let shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'awaiting_hazard');

  // Legacy support: also check for 'on_route' status for backwards compatibility with existing tests
  if (shipIndex === -1) {
    shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'on_route');
  }

  if (shipIndex === -1) {
    throw new GameRuleError('No ship awaiting hazard check');
  }

  const ship = ships[shipIndex];
  const shipStats = ship.stats || { speed: 0, reliability: 0, ceiling: 0, range: 0 };

  // Draw from hazard deck
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    throw new GameRuleError('No hazard cards remaining');
  }

  const hazard = playerState.hazardDeck.shift();

  // Get pending route or current route
  const pendingRouteId = ship.pendingRouteId || ship.routeId;
  const route = state.map?.routes?.find(r => r.id === pendingRouteId);
  const isLuxuryRoute = route?.luxury === true;

  // Check for Hindenburg Disaster conditions first
  const hindenburgConditions = {
    age: state.age,
    gasType: ship.gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  };

  const isHindenburgDisaster = checkHindenburgDisaster(hindenburgConditions);

  if (isHindenburgDisaster) {
    // THE HINDENBURG DISASTER - Game ends immediately per Section 1.2
    ships[shipIndex].status = 'destroyed';

    state.hindenburgDisaster = true;
    state.gameEndReason = 'hindenburg_disaster';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `THE HINDENBURG DISASTER! A Catastrophic Explosion has destroyed a luxury hydrogen airship. The era of airships has ended.`,
      playerId,
      type: 'game_end'
    });

    return { newState: state };
  }

  // Step 1: Check for auto-pass conditions
  // Clear Weather always auto-passes
  if (hazard.autoPass || hazard.type === 'clear_weather') {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Clear Weather - Auto Pass');
  }

  // Helium ships auto-pass fire hazards per Section 8.3
  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  if (isFireHazard && ship.gasType === 'helium') {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Fire Immunity (Helium) - Auto Pass');
  }

  // Step 2: Handle fire hazards specially per Section 8.3
  if (isFireHazard && ship.gasType === 'hydrogen') {
    return resolveFireHazard(state, playerId, shipIndex, ship, hazard, engineersToSpend, route);
  }

  // Step 3: Standard hazard check - compare challenge type stat to difficulty
  const challengeType = hazard.challengeType || 'reliability';
  const relevantStat = getRelevantStat(shipStats, challengeType);
  const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);
  const totalCheck = relevantStat + engineerBonus;
  const success = totalCheck >= hazard.difficulty;

  // Deduct spent engineers
  if (engineerBonus > 0) {
    playerState.engineers -= engineerBonus;
  }

  const checkDetails = {
    hazardType: hazard.type,
    challengeType,
    difficulty: hazard.difficulty,
    statValue: relevantStat,
    engineersSpent: engineerBonus,
    totalCheck,
    success
  };

  // Store hazard check result
  if (!playerState.lastHazardCheck) {
    playerState.lastHazardCheck = {};
  }
  playerState.lastHazardCheck[shipId] = checkDetails;

  if (success) {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${challengeType.toUpperCase()} check passed: ${totalCheck} >= ${hazard.difficulty}`);
  } else {
    return resolveHazardAbort(state, playerId, shipIndex, hazard,
      `${challengeType.toUpperCase()} check failed: ${totalCheck} < ${hazard.difficulty}`);
  }
}

/**
 * Handle fire hazard resolution per Section 8.3
 */
function resolveFireHazard(state, playerId, shipIndex, ship, hazard, engineersToSpend, route) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Catastrophic Explosion - no save possible
  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    ships[shipIndex].status = 'destroyed';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `CATASTROPHIC EXPLOSION! Ship destroyed - no save possible.`,
      playerId,
      type: 'hazard'
    });

    return { newState: state };
  }

  // Static Discharge - Difficulty 4 Reliability check, Fail = Crash
  if (hazard.type === 'static_discharge') {
    const shipStats = ship.stats || {};
    const reliabilityStat = shipStats.reliability || 0;
    const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);
    const totalCheck = reliabilityStat + engineerBonus;

    if (engineerBonus > 0) {
      playerState.engineers -= engineerBonus;
    }

    if (totalCheck >= hazard.difficulty) {
      return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
        `Static Discharge Reliability check passed: ${totalCheck} >= ${hazard.difficulty}`);
    } else {
      ships[shipIndex].status = 'destroyed';

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `STATIC DISCHARGE! Reliability check failed (${totalCheck} < ${hazard.difficulty}). Ship destroyed!`,
        playerId,
        type: 'hazard'
      });

      return { newState: state };
    }
  }

  // Engine Fire / Gas Cell Rupture - requires specific engineer cost to save
  const engineerCost = hazard.engineerCost || 1;
  const availableEngineers = playerState.engineers || 0;
  const actualSpend = Math.min(engineersToSpend, availableEngineers);

  if (actualSpend >= engineerCost) {
    // Fire controlled - ship is DAMAGED, not destroyed
    playerState.engineers -= engineerCost;
    ships[shipIndex].status = 'damaged';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged.`,
      playerId,
      type: 'hazard'
    });

    return { newState: state };
  } else {
    // Insufficient engineers - crash
    ships[shipIndex].status = 'destroyed';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name}! Insufficient Engineers (need ${engineerCost}, have ${availableEngineers}). Ship destroyed!`,
      playerId,
      type: 'hazard'
    });

    return { newState: state };
  }
}

/**
 * Resolve successful hazard check - ship claims route
 */
function resolveHazardSuccess(state, playerId, shipIndex, route, hazard, message) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Ship successfully claims route
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].routeId = route?.id;
  delete ships[shipIndex].pendingRouteId;

  // Claim the route and add income
  if (route) {
    route.claimed = playerId;
    route.claimedBy = {
      playerId,
      shipId: ships[shipIndex].id,
      turn: state.turn
    };
    playerState.income += route.income || 0;

    // Apply city bonus per Section 10.4
    // For simplicity, we automatically choose the 'to' city for the bonus
    // In a more complete implementation, this would be a player choice
    if (CITY_BONUSES) {
      const cityName = route.to || route.from;
      applyCityBonus(state, playerId, cityName);
    }
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check PASSED (${hazard.type}): ${message}`,
    playerId,
    type: 'hazard'
  });

  return { newState: state };
}

/**
 * Resolve aborted launch - ship returns to hangar
 */
function resolveHazardAbort(state, playerId, shipIndex, hazard, message) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Ship returns to hangar (per Section 8.1 outcome table: Aborted)
  ships[shipIndex].status = 'hangar';
  delete ships[shipIndex].pendingRouteId;
  delete ships[shipIndex].routeId;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check FAILED (${hazard.type}): ${message}. Launch aborted - ship returns to hangar.`,
    playerId,
    type: 'hazard'
  });

  return { newState: state };
}

module.exports = { processHazardCheck, checkHindenburgDisaster };
