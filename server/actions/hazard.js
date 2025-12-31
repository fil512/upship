/**
 * Hazard Actions
 * PERFORM_HAZARD_CHECK action processor
 * Implements hazard checks per Section 8.2, fire hazards per Section 8.3, and Hindenburg Disaster (Section 1.2)
 */

const { GameRuleError } = require('../errors');
const { applyCityBonus, CITY_BONUSES } = require('../data/cities');
const { shuffleArray } = require('../utils/random');
const { processCompleteMission, resolveFlakCheck, calculateEquipmentBonus } = require('./combatMission');

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

  // Get pending route or current route
  const pendingRouteId = ship.pendingRouteId || ship.routeId;
  const route = state.map?.routes?.find(r => r.id === pendingRouteId);

  // Draw from hazard deck
  // If deck is empty, shuffle discard pile to create new deck
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    const discardPile = playerState.hazardDiscardPile || [];
    if (discardPile.length === 0) {
      throw new GameRuleError('No hazard cards remaining (deck and discard pile both empty)');
    }
    // Shuffle discard pile to create new deck
    playerState.hazardDeck = shuffleArray([...discardPile]);
    playerState.hazardDiscardPile = [];

    state.log.push({
      timestamp: new Date().toISOString(),
      message: 'Hazard deck exhausted - shuffled discard pile to create new deck',
      playerId,
      type: 'deck'
    });
  }

  const hazard = playerState.hazardDeck.shift();

  // Add drawn hazard to discard pile
  playerState.hazardDiscardPile = playerState.hazardDiscardPile || [];
  playerState.hazardDiscardPile.push(hazard);
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

    // Per Section 14.5: Triggering player gains 3 VP (historical infamy)
    playerState.vp = (playerState.vp || 0) + 3;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `THE HINDENBURG DISASTER! A Catastrophic Explosion has destroyed a luxury hydrogen airship. The era of airships has ended. Triggering player gains 3 VP (historical infamy).`,
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

  // Check for Conductive Covering - grants immunity to Static Discharge per Appendix D
  const playerBlueprint = playerState.blueprint;
  const hasCondictiveCovering = playerBlueprint?.fabricSlots?.some(
    fabric => fabric === 'conductive_covering' || fabric?.id === 'conductive_covering'
  );

  if (hazard.type === 'static_discharge' && hasCondictiveCovering) {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)');
  }

  // GAP-046: Check for Fire-Resistant Fabric - once per Age, auto-pass fire hazard per Appendix D
  const hasFireResistantFabric = playerBlueprint?.fabricSlots?.some(
    fabric => fabric === 'fire_resistant_fabric' || fabric?.id === 'fire_resistant_fabric'
  );
  const fireProtectionAvailable = hasFireResistantFabric && !playerState.fireProtectionUsedThisAge;

  if (isFireHazard && fireProtectionAvailable) {
    // Use the fire protection - mark as used this age
    playerState.fireProtectionUsedThisAge = true;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Fire-Resistant Fabric activated! Auto-passing ${hazard.name}.`,
      playerId,
      type: 'action'
    });

    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)');
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
 * Apply insurance policy to recover crashed ship per Section 6.11
 * "When a ship crashes, discard a policy to recover the ship to your Launch Hangar"
 * @returns {boolean} True if insurance was used and ship recovered
 */
function applyInsuranceRecovery(state, playerId, shipIndex, hazardName) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;
  const insurancePolicies = playerState.insurance || 0;

  if (insurancePolicies > 0) {
    // Discard one insurance policy to recover ship
    playerState.insurance = insurancePolicies - 1;
    // Recover ship to hangar instead of destroying it
    ships[shipIndex].status = 'hangar';
    delete ships[shipIndex].pendingRouteId;
    delete ships[shipIndex].routeId;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazardName}! Insurance claim: ship recovered to Launch Hangar (${playerState.insurance} policies remaining)`,
      playerId,
      type: 'hazard'
    });

    return true;
  }
  return false;
}

/**
 * Handle fire hazard resolution per Section 8.3
 */
function resolveFireHazard(state, playerId, shipIndex, ship, hazard, engineersToSpend, route) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Catastrophic Explosion - no save possible (insurance cannot help)
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
      // GAP-051: Check for insurance recovery per Section 6.11
      if (applyInsuranceRecovery(state, playerId, shipIndex, 'STATIC DISCHARGE')) {
        return { newState: state };
      }

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
    // GAP-051: Check for insurance recovery per Section 6.11
    if (applyInsuranceRecovery(state, playerId, shipIndex, hazard.name)) {
      return { newState: state };
    }

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
 * Resolve successful hazard check - ship claims route or completes mission
 */
function resolveHazardSuccess(state, playerId, shipIndex, route, hazard, message) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;
  const ship = ships[shipIndex];

  // Check if this is an Age II combat mission
  if (ship.pendingMissionId && state.age === 2) {
    // Find the mission
    const mission = state.missionRow?.find(m => m.id === ship.pendingMissionId);
    if (!mission) {
      // Mission not found - this shouldn't happen but handle gracefully
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Error: Mission ${ship.pendingMissionId} not found in Mission Row`,
        playerId,
        type: 'error'
      });
      ships[shipIndex].status = 'hangar';
      delete ships[shipIndex].pendingMissionId;
      return { newState: state };
    }

    // Per Appendix G: Complete mission first (gain rewards), then check flak
    // "You earn rewards as long as the mission succeeds, even if flak destroys your ship afterward"

    // Calculate equipment bonus income
    const bonusIncome = calculateEquipmentBonus(playerState, mission);

    // Complete the mission - this awards income and stores for VP
    processCompleteMission(state, playerId, {
      ...mission,
      income: mission.income + bonusIncome
    });

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED (${hazard.type}): ${message}`,
      playerId,
      type: 'hazard'
    });

    // Now do the Flak Check per Section 10.5
    // "Compare the Hazard card's Flak value to your ship's Armor. If Flak > Armor, ship is destroyed."
    const flakResult = resolveFlakCheck(ship, hazard);

    if (flakResult.destroyed) {
      ships[shipIndex].status = 'destroyed';
      delete ships[shipIndex].pendingMissionId;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `FLAK! ${flakResult.reason}. Mission completed but ship lost to anti-aircraft fire.`,
        playerId,
        type: 'hazard'
      });
    } else {
      // Ship survives - place on completed mission
      ships[shipIndex].status = 'on_mission';
      ships[shipIndex].missionId = ship.pendingMissionId;
      delete ships[shipIndex].pendingMissionId;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${flakResult.reason}. Ship survived and mission complete.`,
        playerId,
        type: 'action'
      });
    }

    return { newState: state };
  }

  // Age I or Age III: Standard route claiming
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
 * Per Appendix G: "If Aborted: Mission remains in the row (like an unclaimed route)"
 */
function resolveHazardAbort(state, playerId, shipIndex, hazard, message) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Ship returns to hangar (per Section 8.1 outcome table: Aborted)
  ships[shipIndex].status = 'hangar';
  delete ships[shipIndex].pendingRouteId;
  delete ships[shipIndex].pendingMissionId;  // Age II: Mission stays in row
  delete ships[shipIndex].routeId;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check FAILED (${hazard.type}): ${message}. Launch aborted - ship returns to hangar.`,
    playerId,
    type: 'hazard'
  });

  return { newState: state };
}

/**
 * Process player's response to a pending hazard check
 * This is the second step of the launch flow, called after LAUNCH_SHIP draws a hazard
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId, spendEngineers }
 *   - spendEngineers: boolean - whether to spend engineers to pass/control hazard
 * @returns {Object} { newState } or throws error
 */
function processRespondToHazard(state, playerId, data) {
  const { shipId, spendEngineers = false } = data;
  const playerState = state.players[playerId];

  // Find ship with pending hazard
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'awaiting_hazard' && s.pendingHazard);

  if (shipIndex === -1) {
    throw new GameRuleError('No ship awaiting hazard response');
  }

  const ship = ships[shipIndex];
  const hazard = ship.pendingHazard;
  const pendingRouteId = ship.pendingRouteId;
  const route = state.map?.routes?.find(r => r.id === pendingRouteId);

  // Check for Hindenburg Disaster conditions first (Catastrophic Explosion)
  const isLuxuryRoute = route?.luxury === true;
  if (checkHindenburgDisaster({
    age: state.age,
    gasType: ship.gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  })) {
    ships[shipIndex].status = 'destroyed';
    delete ships[shipIndex].pendingHazard;

    state.hindenburgDisaster = true;
    state.gameEndReason = 'hindenburg_disaster';
    playerState.vp = (playerState.vp || 0) + 3;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `THE HINDENBURG DISASTER! A Catastrophic Explosion has destroyed a luxury hydrogen airship. The era of airships has ended. Triggering player gains 3 VP (historical infamy).`,
      playerId,
      type: 'game_end'
    });

    return { newState: state };
  }

  // Handle auto-pass cases
  if (hazard.autoPass || hazard.autoPassReason === 'Clear Weather') {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Clear Weather - Auto Pass');
  }

  // Handle Helium vs Fire immunity
  if (hazard.heliumFireImmunity) {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Fire Immunity (Helium) - Auto Pass');
  }

  // Handle Conductive Covering immunity (static discharge)
  if (hazard.conductiveCoveringImmunity) {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)');
  }

  // Handle Fire-Resistant Fabric (once per age)
  if (hazard.fireResistantFabricAvailable) {
    playerState.fireProtectionUsedThisAge = true;
    delete ships[shipIndex].pendingHazard;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Fire-Resistant Fabric activated! Auto-passing ${hazard.name}.`,
      playerId,
      type: 'action'
    });

    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)');
  }

  // Handle Catastrophic Explosion (no save possible)
  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    ships[shipIndex].status = 'destroyed';
    delete ships[shipIndex].pendingHazard;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `CATASTROPHIC EXPLOSION! Ship destroyed - no save possible.`,
      playerId,
      type: 'hazard'
    });

    return { newState: state };
  }

  // Handle fire hazards with engineer cost (Engine Fire, Gas Cell Rupture)
  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  if (isFireHazard && hazard.engineerCost !== undefined) {
    const engineerCost = hazard.engineerCost;
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineerCost) {
      // Fire controlled - ship is DAMAGED
      playerState.engineers -= engineerCost;
      ships[shipIndex].status = 'damaged';
      delete ships[shipIndex].pendingHazard;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged.`,
        playerId,
        type: 'hazard'
      });

      return { newState: state };
    } else {
      // Not spending or insufficient engineers - crash
      return resolveFireCrash(state, playerId, shipIndex, hazard);
    }
  }

  // Handle Static Discharge (special fire hazard with reliability check)
  if (hazard.type === 'static_discharge') {
    const shipStats = ship.stats || {};
    const reliabilityStat = shipStats.reliability || 0;
    const engineersNeeded = hazard.engineersNeeded || Math.max(0, hazard.difficulty - reliabilityStat);
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineersNeeded) {
      playerState.engineers -= engineersNeeded;
      delete ships[shipIndex].pendingHazard;
      return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
        `Static Discharge Reliability check passed: ${reliabilityStat + engineersNeeded} >= ${hazard.difficulty}`);
    } else if (!spendEngineers || availableEngineers < engineersNeeded) {
      return resolveFireCrash(state, playerId, shipIndex, hazard);
    }
  }

  // Handle regular hazards (minor/major with stat check)
  const availableEngineers = playerState.engineers || 0;
  const engineersNeeded = hazard.engineersNeeded || 0;
  const relevantStat = hazard.relevantStat || 0;

  if (engineersNeeded === 0) {
    // Ship stat already passes - auto success
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} >= ${hazard.difficulty}`);
  }

  if (spendEngineers && availableEngineers >= engineersNeeded) {
    // Spending engineers to pass
    playerState.engineers -= engineersNeeded;
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} + ${engineersNeeded} engineers >= ${hazard.difficulty}`);
  } else {
    // Not spending or can't afford - abort
    delete ships[shipIndex].pendingHazard;
    return resolveHazardAbort(state, playerId, shipIndex, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} failed: chose to abort rather than spend ${engineersNeeded} engineers`);
  }
}

// Note: processRespondToHazard reuses resolveHazardSuccess and resolveHazardAbort from above

/**
 * Resolve fire crash - ship destroyed (with insurance check)
 */
function resolveFireCrash(state, playerId, shipIndex, hazard) {
  const playerState = state.players[playerId];
  const ships = playerState.ships;

  // Check for insurance recovery
  if (applyInsuranceRecovery(state, playerId, shipIndex, hazard.name)) {
    delete ships[shipIndex].pendingHazard;
    return { newState: state };
  }

  ships[shipIndex].status = 'destroyed';
  delete ships[shipIndex].pendingHazard;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `${hazard.name}! Ship destroyed!`,
    playerId,
    type: 'hazard'
  });

  return { newState: state };
}

module.exports = { processHazardCheck, processRespondToHazard, checkHindenburgDisaster };
