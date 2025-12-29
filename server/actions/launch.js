/**
 * Launch Actions
 * LAUNCH_SHIP, CLAIM_ROUTE action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES } = require('../data/upgrades');
const { AGE_BASELINES } = require('../config/constants');

/**
 * Calculate ship stats from blueprint
 */
function calculateBlueprintStats(blueprint, age = 1) {
  const stats = { ...AGE_BASELINES[age] };

  // Add stats from upgrades
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = blueprint[slotKey] || [];
    for (const upgradeId of slotArray) {
      if (!upgradeId) continue;
      const upgrade = UPGRADES[upgradeId];
      if (upgrade?.stats) {
        for (const [stat, value] of Object.entries(upgrade.stats)) {
          stats[stat] = (stats[stat] || 0) + value;
        }
      }
    }
  }

  return stats;
}

/**
 * Calculate weight from blueprint
 */
function calculateBlueprintWeight(blueprint) {
  let weight = 0;
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
  for (const slotKey of slots) {
    const slotArray = blueprint[slotKey] || [];
    for (const upgradeId of slotArray) {
      if (!upgradeId) continue;
      const upgrade = UPGRADES[upgradeId];
      if (upgrade?.weight) {
        weight += Math.abs(upgrade.weight);
      }
    }
  }
  return weight;
}

/**
 * Calculate required gas cubes based on weight
 */
function calculateRequiredGasCubes(blueprint) {
  const weight = calculateBlueprintWeight(blueprint);
  // Minimum 1 gas cube, otherwise ceil(weight / 5)
  return Math.max(1, Math.ceil(weight / 5));
}

/**
 * Launch a ship from hangar
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId, routeId, gasType }
 * @returns {Object} { newState } or throws error
 */
function processLaunchShip(state, playerId, data) {
  const { shipId, routeId, gasType = 'hydrogen', retainGas = false } = data;
  const playerState = state.players[playerId];
  const BLAUGAS_COST = 2; // £2 to retain gas cubes per Section 13.1

  // Step 1: Choose a target route
  if (!routeId) {
    throw new GameRuleError('Must specify a route to launch to (routeId required)');
  }

  const route = state.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    throw new GameRuleError(`Route not found: ${routeId}`);
  }
  if (route.claimed) {
    throw new GameRuleError(`Route ${route.from} → ${route.to} is already claimed`);
  }

  // Calculate ship stats to validate against route requirements
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  // Validate Range meets route distance requirement
  if (stats.range < route.distance) {
    throw new GameRuleError(`Ship Range (${stats.range}) does not meet route distance requirement (${route.distance})`);
  }

  // Validate Speed meets route speed requirement (if any)
  const routeSpeed = route.speed || 1;
  if (stats.speed < routeSpeed) {
    throw new GameRuleError(`Ship Speed (${stats.speed}) does not meet route speed requirement (${routeSpeed})`);
  }

  // Step 2: Verify launch requirements
  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Gas type must be hydrogen or helium');
  }

  // Helium requires Helium Handling technology (Section 9.3)
  if (gasType === 'helium') {
    // Technology IDs are lowercase (e.g., 'helium_handling')
    // Technologies array may contain strings (IDs) or objects with id property
    const hasHeliumHandling = playerState.technologies?.some(t =>
      (typeof t === 'string' ? t : t.id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot use Helium without Helium Handling technology');
    }
  }

  // Validate structural slots are filled
  const frameSlots = playerState.blueprint.frameSlots || [];
  const fabricSlots = playerState.blueprint.fabricSlots || [];

  const emptyFrameSlots = frameSlots.filter(s => s === null).length;
  const emptyFabricSlots = fabricSlots.filter(s => s === null).length;

  if (emptyFrameSlots > 0) {
    throw new GameRuleError(`Cannot launch: ${emptyFrameSlots} Frame slot(s) must be filled`);
  }
  if (emptyFabricSlots > 0) {
    throw new GameRuleError(`Cannot launch: ${emptyFabricSlots} Fabric slot(s) must be filled`);
  }

  // Step 3: Select a ship and validate resources
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');

  if (shipIndex === -1) {
    throw new GameRuleError('Ship not found in hangar');
  }

  // Calculate required officers (equal to Age number: 1/2/3)
  const requiredOfficers = state.age || 1;
  const availableOfficers = playerState.officers || 0;

  if (availableOfficers < requiredOfficers) {
    throw new InsufficientFundsError(requiredOfficers, availableOfficers, 'Officers');
  }

  // Calculate required gas cubes
  const requiredCubes = calculateRequiredGasCubes(playerState.blueprint);
  const availableCubes = playerState.gasCubes[gasType] || 0;

  if (availableCubes < requiredCubes) {
    throw new InsufficientFundsError(requiredCubes, availableCubes, gasType);
  }

  // Check Blaugas option (Germany only, per Section 13.1)
  if (retainGas) {
    // Blaugas Fuel System requires blaugas_storage technology
    const hasBlaugas = playerState.technologies?.some(t =>
      (typeof t === 'string' ? t : t.id) === 'blaugas_storage'
    );
    if (!hasBlaugas) {
      throw new GameRuleError('Cannot use retainGas without Blaugas Fuel System technology');
    }

    // Must have enough cash to pay Blaugas cost
    if (playerState.cash < BLAUGAS_COST) {
      throw new InsufficientFundsError(BLAUGAS_COST, playerState.cash, '£ for Blaugas');
    }
  }

  // Pay launch costs
  playerState.officers -= requiredOfficers;

  // Gas handling: consume gas unless using Blaugas to retain
  if (retainGas) {
    // Pay Blaugas cost to retain gas cubes
    playerState.cash -= BLAUGAS_COST;
    // Gas cubes are NOT consumed
  } else {
    // Normal launch: consume gas cubes
    playerState.gasCubes[gasType] -= requiredCubes;
  }

  // Step 4: Set ship to awaiting hazard check per Section 8.3
  // Route is NOT claimed until hazard check is performed
  ships[shipIndex].status = 'awaiting_hazard';
  ships[shipIndex].stats = stats;
  ships[shipIndex].launchedAge = state.age;
  ships[shipIndex].gasType = gasType;
  ships[shipIndex].pendingRouteId = routeId;  // Route to claim if hazard check succeeds

  // Build stats summary for log
  const statParts = [`Range ${stats.range}`, `Speed ${stats.speed}`];
  if (stats.ceiling > 0) statParts.push(`Ceiling ${stats.ceiling}`);
  if (stats.reliability > 0) statParts.push(`Reliability ${stats.reliability}`);
  if (stats.luxury > 0) statParts.push(`Luxury ${stats.luxury}`);

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship toward ${route.from} → ${route.to} (${requiredOfficers} Officer${requiredOfficers > 1 ? 's' : ''}, ${requiredCubes} ${gasType}): ${statParts.join(', ')} - HAZARD CHECK REQUIRED`,
    playerId,
    type: 'action'
  });

  return { newState: state, requiresHazardCheck: true };
}

/**
 * Claim a route with a launched ship
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId, routeId }
 * @returns {Object} { newState } or throws error
 */
function processClaimRoute(state, playerId, data) {
  const { shipId, routeId } = data;
  const playerState = state.players[playerId];

  // Find launched ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'launched');

  if (shipIndex === -1) {
    throw new GameRuleError('No launched ship available');
  }

  const ship = ships[shipIndex];

  // Find route
  const route = state.map?.routes?.find(r => r.id === routeId);
  if (!route) {
    throw new GameRuleError('Route not found');
  }

  // Check if route already claimed
  if (route.claimed) {
    throw new GameRuleError('Route already claimed');
  }

  // Check ship meets route requirements
  const shipStats = ship.stats || { range: 1, speed: 1 };
  if (shipStats.range < route.distance) {
    throw new GameRuleError(`Ship range (${shipStats.range}) < route distance (${route.distance})`);
  }
  if (route.speed && shipStats.speed < route.speed) {
    throw new GameRuleError(`Ship speed (${shipStats.speed}) < route requirement (${route.speed})`);
  }

  // Claim the route
  route.claimed = playerId;
  route.claimedBy = {
    playerId,
    shipId,
    turn: state.turn
  };

  // Update ship to on-route status
  ships[shipIndex].status = 'on_route';
  ships[shipIndex].routeId = routeId;

  // Add route income to player
  playerState.income += route.income;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Claimed route ${route.from} → ${route.to} for +${route.income} income`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processLaunchShip,
  processClaimRoute,
  calculateBlueprintStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes
};
