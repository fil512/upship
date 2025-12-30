/**
 * Launch Actions
 * LAUNCH_SHIP, CLAIM_ROUTE action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES } = require('../data/upgrades');
const { AGE_BASELINES } = require('../config/constants');
const { processHazardCheck } = require('./hazard');

/**
 * Count the number of separate networks a player has claimed
 * Per Section 14.3: "A network is a group of your routes that share at least one city."
 *
 * Uses Union-Find algorithm to count connected components
 */
function countPlayerNetworks(playerState, map) {
  if (!map?.routes) return 0;

  // Also check if routes are claimed by player ID directly
  const playerId = Object.keys(playerState || {}).includes('cash') ? null : playerState;

  // Find routes claimed by this player
  let claimedRoutes = [];
  if (map.routes) {
    for (const route of map.routes) {
      // Route can be claimed by player ID string
      if (route.claimed && (route.claimed === playerId ||
          (typeof route.claimed === 'string' && playerState))) {
        // Check if this player owns it
        claimedRoutes.push(route);
      }
    }
  }

  // If no routes or passed playerState object, need to find by iterating
  if (claimedRoutes.length === 0 && playerState) {
    // Look for routes claimed by any player ID that matches
    for (const route of (map.routes || [])) {
      if (route.claimed) {
        claimedRoutes.push(route);
      }
    }
    // Filter to only this player's routes
    claimedRoutes = claimedRoutes.filter(_r => {
      // The claimed field should be the player ID
      // We need the actual player ID from the state context
      return true; // Will be filtered by caller context
    });
  }

  if (claimedRoutes.length === 0) return 0;
  if (claimedRoutes.length === 1) return 1;

  // Build a city adjacency graph for this player's routes
  const cityToRoutes = new Map();
  for (const route of claimedRoutes) {
    if (!cityToRoutes.has(route.from)) cityToRoutes.set(route.from, []);
    if (!cityToRoutes.has(route.to)) cityToRoutes.set(route.to, []);
    cityToRoutes.get(route.from).push(route);
    cityToRoutes.get(route.to).push(route);
  }

  // Use BFS to count connected components
  const visitedRoutes = new Set();
  let networkCount = 0;

  for (const route of claimedRoutes) {
    if (visitedRoutes.has(route.id)) continue;

    // Start a new network
    networkCount++;
    const queue = [route];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visitedRoutes.has(current.id)) continue;
      visitedRoutes.add(current.id);

      // Find connected routes (share a city with current route)
      const connectedCities = [current.from, current.to];
      for (const city of connectedCities) {
        for (const connectedRoute of (cityToRoutes.get(city) || [])) {
          if (!visitedRoutes.has(connectedRoute.id)) {
            queue.push(connectedRoute);
          }
        }
      }
    }
  }

  return networkCount;
}

/**
 * Validate network connectivity for Age III routes per Section 14.3
 *
 * Rules:
 * - Age I: No restrictions
 * - Age II: N/A (Combat Missions)
 * - Age III: First ship may claim any route from Major Hub.
 *            Subsequent ships must connect to existing network OR
 *            pay £X to start new network where X = number of existing networks
 *
 * @returns {Object} { valid: boolean, networkFee: number, reason?: string }
 */
function validateNetworkConnectivity(state, playerId, route) {
  // Only applies in Age III
  if (state.age !== 3) {
    return { valid: true, networkFee: 0 };
  }

  const playerRoutes = (state.map?.routes || []).filter(r => r.claimed === playerId);

  // First ship can claim any route from a Major Hub
  if (playerRoutes.length === 0) {
    // Per rules: "First ship may claim any route from a Major Hub"
    // Major Hubs in Age III include London, Frankfurt, New York, etc.
    return { valid: true, networkFee: 0 };
  }

  // Check if this route connects to an existing network
  const playerCities = new Set();
  for (const r of playerRoutes) {
    playerCities.add(r.from);
    playerCities.add(r.to);
  }

  // Route connects if it shares a city with existing routes
  const connects = playerCities.has(route.from) || playerCities.has(route.to);

  if (connects) {
    // Connecting to existing network - no fee
    return { valid: true, networkFee: 0 };
  }

  // Starting a new network - fee = number of existing networks
  const existingNetworks = countPlayerNetworksById(state.map, playerId);
  const networkFee = existingNetworks;

  return {
    valid: true,
    networkFee,
    reason: `Starting network ${existingNetworks + 1} (fee: £${networkFee})`
  };
}

/**
 * Count networks by player ID (helper for validateNetworkConnectivity)
 */
function countPlayerNetworksById(map, playerId) {
  if (!map?.routes) return 0;

  const playerRoutes = map.routes.filter(r => r.claimed === playerId);
  if (playerRoutes.length === 0) return 0;
  if (playerRoutes.length === 1) return 1;

  // Build city adjacency
  const cityToRoutes = new Map();
  for (const route of playerRoutes) {
    if (!cityToRoutes.has(route.from)) cityToRoutes.set(route.from, []);
    if (!cityToRoutes.has(route.to)) cityToRoutes.set(route.to, []);
    cityToRoutes.get(route.from).push(route);
    cityToRoutes.get(route.to).push(route);
  }

  // BFS to count connected components
  const visitedRoutes = new Set();
  let networkCount = 0;

  for (const route of playerRoutes) {
    if (visitedRoutes.has(route.id)) continue;

    networkCount++;
    const queue = [route];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visitedRoutes.has(current.id)) continue;
      visitedRoutes.add(current.id);

      for (const city of [current.from, current.to]) {
        for (const connected of (cityToRoutes.get(city) || [])) {
          if (!visitedRoutes.has(connected.id)) {
            queue.push(connected);
          }
        }
      }
    }
  }

  return networkCount;
}

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
/**
 * Check if player has Trapeze System technology (USA faction ability)
 * Per Section 13.3: "Trapeze Fighter System (ignore one route requirement per launch)"
 */
function hasTrapezeSytem(playerState) {
  return playerState.technologies?.some(t =>
    (typeof t === 'string' ? t : t.id) === 'trapeze_system'
  );
}

function processLaunchShip(state, playerId, data) {
  const { shipId, routeId, gasType = 'hydrogen', retainGas = false, bypassRequirement = null, _internal = false } = data;
  const playerState = state.players[playerId];
  const BLAUGAS_COST = 2; // £2 to retain gas cubes per Section 13.1

  // Validate that this is called through PLACE_AGENT at launchpad (Section 5.1)
  if (!_internal) {
    // Check if launchpad is active for this player
    if (!state.launchpadActive?.[playerId]) {
      throw new GameRuleError(
        'LAUNCH_SHIP not allowed: You must place an agent at Launchpad to launch ships (Section 5.1). ' +
        'Use PLACE_AGENT with locationId "launchpad" first.'
      );
    }
  }

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

  // GAP-048: Check if player has Trapeze System for bypassing one requirement
  const canBypassRequirement = hasTrapezeSytem(playerState);
  const validBypassTypes = ['range', 'speed', 'ceiling', 'luxury'];

  // Validate bypassRequirement parameter if provided
  if (bypassRequirement) {
    if (!canBypassRequirement) {
      throw new GameRuleError('Cannot bypass route requirement without Trapeze Fighter System technology');
    }
    if (!validBypassTypes.includes(bypassRequirement)) {
      throw new GameRuleError(`Invalid bypass requirement type: ${bypassRequirement}. Must be one of: ${validBypassTypes.join(', ')}`);
    }
  }

  // Validate Range meets route distance requirement (unless bypassed)
  if (bypassRequirement !== 'range' && stats.range < route.distance) {
    throw new GameRuleError(`Ship Range (${stats.range}) does not meet route distance requirement (${route.distance})`);
  }

  // Validate Speed meets route speed requirement (unless bypassed)
  const routeSpeed = route.speed || 1;
  if (bypassRequirement !== 'speed' && stats.speed < routeSpeed) {
    throw new GameRuleError(`Ship Speed (${stats.speed}) does not meet route speed requirement (${routeSpeed})`);
  }

  // Validate Ceiling meets route ceiling requirement (unless bypassed)
  const routeCeiling = route.ceiling || 0;
  if (bypassRequirement !== 'ceiling' && routeCeiling > 0 && stats.ceiling < routeCeiling) {
    throw new GameRuleError(`Ship Ceiling (${stats.ceiling}) does not meet route ceiling requirement (${routeCeiling})`);
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
    message: `Launched ship toward ${route.from} → ${route.to} (${requiredOfficers} Officer${requiredOfficers > 1 ? 's' : ''}, ${requiredCubes} ${gasType}): ${statParts.join(', ')}`,
    playerId,
    type: 'action'
  });

  // Step 5: Automatically perform hazard check
  // Hazard check happens immediately upon launch - no client action needed
  return processHazardCheck(state, playerId, { shipId, engineersToSpend: 0 });
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

/**
 * Signal completion of launches at launchpad
 * Per Section 6.4: Launchpad is a multi-step location
 * - Place agent to enable launching
 * - Can launch multiple ships while at launchpad
 * - Call NO_MORE_LAUNCHES to signal completion and advance turn
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @returns {Object} { newState } or throws error
 */
function processNoMoreLaunches(state, playerId) {
  // Validate launchpad is active for this player
  if (!state.launchpadActive?.[playerId]) {
    throw new GameRuleError(
      'NO_MORE_LAUNCHES not allowed: You are not at the Launchpad. ' +
      'Place an agent at Launchpad first using PLACE_AGENT.'
    );
  }

  // Deactivate launchpad
  state.launchpadActive[playerId] = false;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Finished launching ships at Launchpad',
    playerId,
    type: 'action'
  });

  // Import here to avoid circular dependency
  const { advanceToNextPlacer, allPlayersPassed } = require('./helpers/turnOrder');
  const { transitionToRevealPhase } = require('./helpers/phaseTransition');

  // IMPORTANT: Do NOT auto-pass players here.
  // Players must explicitly call REVEAL to exit worker placement phase.
  // This ensures all players have a chance to declare their tech/market acquisitions.

  // Advance turn or transition phase (if somehow all have revealed)
  if (allPlayersPassed(state)) {
    transitionToRevealPhase(state);
  } else {
    advanceToNextPlacer(state);
  }

  return { newState: state };
}

module.exports = {
  processLaunchShip,
  processClaimRoute,
  processNoMoreLaunches,
  calculateBlueprintStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes,
  countPlayerNetworks,
  countPlayerNetworksById,
  validateNetworkConnectivity
};
