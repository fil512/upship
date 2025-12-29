/**
 * Hazard Actions
 * PERFORM_HAZARD_CHECK action processor
 * Implements hazard checks and Hindenburg Disaster (Section 1.2)
 */

const { GameRuleError } = require('../errors');

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
 * Perform a hazard check for a ship on a route
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId }
 * @returns {Object} { newState } or throws error
 */
function processHazardCheck(state, playerId, data) {
  const { shipId } = data;
  const playerState = state.players[playerId];

  // Find the ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'on_route');

  if (shipIndex === -1) {
    throw new GameRuleError('No ship on route to check');
  }

  const ship = ships[shipIndex];

  // Draw from hazard deck
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    throw new GameRuleError('No hazard cards remaining');
  }

  const hazard = playerState.hazardDeck.shift();

  // Calculate safety rating
  // Base reliability from ship stats + crew bonus (1 per officer)
  // Helium ships get +1 safety (helium is non-flammable, unlike hydrogen)
  const shipStats = ship.stats || { reliability: 0 };
  const heliumBonus = ship.gasType === 'helium' ? 1 : 0;
  const safetyRating = (shipStats.reliability || 0) + (playerState.officers || 0) + heliumBonus;

  // Compare to hazard difficulty
  const success = safetyRating >= hazard.difficulty;

  // Store hazard check result
  const checkResult = {
    hazardType: hazard.type,
    difficulty: hazard.difficulty,
    safetyRating,
    success,
    timestamp: new Date().toISOString()
  };

  // Check for route details to determine if it's a Luxury route
  const route = state.map?.routes?.find(r => r.id === ship.routeId);
  const isLuxuryRoute = route?.luxury === true;

  // Check for Hindenburg Disaster per Section 1.2
  // Must be: Age III + Hydrogen + Luxury route + Catastrophic Explosion
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

    // The game should end after current round - mark state
    if (route) {
      playerState.income = Math.max(0, playerState.income - (route.income || 0));
      route.claimed = null;
    }
  } else if (success) {
    // Ship survives
    const heliumNote = heliumBonus > 0 ? ' (helium +1)' : '';
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}${heliumNote}`,
      playerId,
      type: 'hazard'
    });
  } else {
    // Ship takes damage or crashes
    const crashSeverity = hazard.difficulty - safetyRating;

    if (crashSeverity >= 3 || hazard.type === 'critical' || hazard.type === 'catastrophic_explosion') {
      // Ship destroyed
      ships[shipIndex].status = 'destroyed';

      // Remove income from the route
      if (route) {
        playerState.income = Math.max(0, playerState.income - (route.income || 0));
        route.claimed = null;
        route.claimedBy = null;
      }

      // Insurance mitigation
      const insurancePolicies = playerState.insurance || 0;
      if (insurancePolicies > 0) {
        // Discard one insurance policy to recover ship
        playerState.insurance = insurancePolicies - 1;
        // Recover ship to hangar instead of destroying it
        ships[shipIndex].status = 'hangar';
        ships[shipIndex].damaged = false;
        state.log.push({
          timestamp: new Date().toISOString(),
          message: `Insurance claim: ship recovered to Launch Hangar (${playerState.insurance} policies remaining)`,
          playerId,
          type: 'action'
        });
      }

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `DISASTER! ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship destroyed!`,
        playerId,
        type: 'hazard'
      });
    } else {
      // Ship damaged but survives
      ships[shipIndex].damaged = true;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hazard check FAILED: ${hazard.type} (${hazard.difficulty}) vs Safety ${safetyRating}. Ship damaged.`,
        playerId,
        type: 'hazard'
      });
    }
  }

  // Track the hazard check result on the player state
  if (!playerState.lastHazardCheck) {
    playerState.lastHazardCheck = {};
  }
  playerState.lastHazardCheck[shipId] = checkResult;

  return { newState: state };
}

module.exports = { processHazardCheck, checkHindenburgDisaster };
