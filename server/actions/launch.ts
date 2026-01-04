/**
 * Launch Actions
 * LAUNCH_SHIP, CLAIM_ROUTE action processors
 */

import type { GameState, PlayerState, Ship, Route, LogEntry, HazardCard, Blueprint } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { TECH_TILES } = require('../data/upgrades');
const { AGE_BASELINES, TECH_CARD_BAG } = require('../config/constants');
const { shuffleArray } = require('../utils/random');

interface ActionResult {
  newState: GameState;
}

interface ShipStats {
  range: number;
  speed: number;
  ceiling?: number;
  reliability?: number;
  luxury?: number;
  [key: string]: number | undefined;
}

interface PendingHazard {
  type: string;
  name: string;
  category: string;
  challengeType: string;
  difficulty: number;
  flak: number;
  engineerCost?: number;
  noSave?: boolean;
  hydrogenOnly?: boolean;
  special?: string;
  gasLossOnFailure?: boolean;
  relevantStat: number;
  statName: string;
  engineersNeeded: number;
  autoPass: boolean;
  autoPassReason: string | null;
  heliumFireImmunity: boolean;
  conductiveCoveringImmunity: boolean;
  fireResistantFabricAvailable: boolean;
}

// Extended types for launch operations
type LaunchPlayerState = PlayerState & {
  fireProtectionUsedThisAge?: boolean;
  hazardDeck?: HazardCard[];
  hazardDiscardPile?: HazardCard[];
  launchBonuses?: Record<string, unknown>;
};

type LaunchShip = Omit<Ship, 'pendingHazard'> & {
  stats?: ShipStats;
  pendingRouteId?: string;
  pendingCityChoice?: string;
  pendingHazard?: PendingHazard;
  gasType?: 'hydrogen' | 'helium';
  launchedAge?: number;
};

type LaunchState = GameState & {
  launchpadActive?: Record<string, boolean>;
};

interface NetworkValidationResult {
  valid: boolean;
  networkFee: number;
  reason?: string;
}

interface ExtendedRoute extends Route {
  claimed?: string;
  claimedBy?: {
    playerId: string;
    shipId: string;
    round: number;
  };
}

interface MapState {
  routes?: ExtendedRoute[];
}

/**
 * Get the auto-pass reason string based on flags
 */
function getAutoPassReason(
  clearWeather: boolean,
  heliumFire: boolean,
  conductiveCovering: boolean,
  fireResistant: boolean
): string | null {
  if (clearWeather) return 'Clear Weather';
  if (heliumFire) return 'Fire Immunity (Helium)';
  if (conductiveCovering) return 'Conductive Covering';
  if (fireResistant) return 'Fire-Resistant Fabric (once per Age)';
  return null;
}

/**
 * Count the number of separate networks a player has claimed
 * Per Section 14.3: "A network is a group of your routes that share at least one city."
 *
 * Uses Union-Find algorithm to count connected components
 */
function countPlayerNetworks(playerState: PlayerState | string, map: MapState): number {
  if (!map?.routes) return 0;

  // Also check if routes are claimed by player ID directly
  const playerId = typeof playerState === 'string' ? playerState : null;

  // Find routes claimed by this player
  let claimedRoutes: ExtendedRoute[] = [];
  if (map.routes) {
    for (const route of map.routes) {
      // Route can be claimed by player ID string
      if (route.claimed && (route.claimed === playerId ||
          (typeof route.claimed === 'string' && typeof playerState !== 'string'))) {
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
  const cityToRoutes = new Map<string, ExtendedRoute[]>();
  for (const route of claimedRoutes) {
    if (!cityToRoutes.has(route.from)) cityToRoutes.set(route.from, []);
    if (!cityToRoutes.has(route.to)) cityToRoutes.set(route.to, []);
    cityToRoutes.get(route.from)!.push(route);
    cityToRoutes.get(route.to)!.push(route);
  }

  // Use BFS to count connected components
  const visitedRoutes = new Set<string>();
  let networkCount = 0;

  for (const route of claimedRoutes) {
    if (visitedRoutes.has(route.id)) continue;

    // Start a new network
    networkCount++;
    const queue: ExtendedRoute[] = [route];

    while (queue.length > 0) {
      const current = queue.shift()!;
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
 */
function validateNetworkConnectivity(state: GameState, playerId: string, route: ExtendedRoute): NetworkValidationResult {
  // Only applies in Age III
  if (state.age !== 3) {
    return { valid: true, networkFee: 0 };
  }

  const mapState = state.map as MapState | undefined;
  const playerRoutes = (mapState?.routes || []).filter(r => r.claimed === playerId);

  // First ship can claim any route from a Major Hub
  if (playerRoutes.length === 0) {
    // Per rules: "First ship may claim any route from a Major Hub"
    // Major Hubs in Age III include London, Frankfurt, New York, etc.
    return { valid: true, networkFee: 0 };
  }

  // Check if this route connects to an existing network
  const playerCities = new Set<string>();
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
  const existingNetworks = countPlayerNetworksById(mapState, playerId);
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
function countPlayerNetworksById(map: MapState | undefined, playerId: string): number {
  if (!map?.routes) return 0;

  const playerRoutes = map.routes.filter(r => r.claimed === playerId);
  if (playerRoutes.length === 0) return 0;
  if (playerRoutes.length === 1) return 1;

  // Build city adjacency
  const cityToRoutes = new Map<string, ExtendedRoute[]>();
  for (const route of playerRoutes) {
    if (!cityToRoutes.has(route.from)) cityToRoutes.set(route.from, []);
    if (!cityToRoutes.has(route.to)) cityToRoutes.set(route.to, []);
    cityToRoutes.get(route.from)!.push(route);
    cityToRoutes.get(route.to)!.push(route);
  }

  // BFS to count connected components
  const visitedRoutes = new Set<string>();
  let networkCount = 0;

  for (const route of playerRoutes) {
    if (visitedRoutes.has(route.id)) continue;

    networkCount++;
    const queue: ExtendedRoute[] = [route];

    while (queue.length > 0) {
      const current = queue.shift()!;
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
function calculateBlueprintStats(blueprint: Blueprint, age: number = 1): ShipStats {
  const stats: ShipStats = { ...(AGE_BASELINES as Record<number, ShipStats>)[age] };

  // Add stats from tech tiles
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'] as const;
  for (const slotKey of slots) {
    const slotArray = (blueprint as unknown as Record<string, (string | null)[]>)[slotKey] || [];
    for (const tileId of slotArray) {
      if (!tileId) continue;
      const tile = (TECH_TILES as Record<string, { stats?: Record<string, number> }>)[tileId];
      if (tile?.stats) {
        for (const [stat, value] of Object.entries(tile.stats)) {
          stats[stat] = (stats[stat] || 0) + value;
        }
      }
    }
  }

  return stats;
}

/**
 * Calculate ship stats from player state (includes blueprint + technology bonuses)
 * Per spec, some technologies provide stat bonuses:
 * - Blaugas Fuel System: +1 Range (Section 13.1)
 * - Aerodynamic Hull Design: +2 Lift (GAP-066)
 * - Dynamic Lift Surfaces: +4 Lift (GAP-066)
 */
function calculateShipStats(playerState: PlayerState, age: number = 1): ShipStats {
  const stats = calculateBlueprintStats(playerState.blueprint, age);

  // Add stats from tech cards
  const techCards = playerState.techCards || [];
  const techCardBag = TECH_CARD_BAG as Record<number, Array<{ id: string; stats?: Record<string, number> }>>;
  const allCards = [...(techCardBag[1] || []), ...(techCardBag[2] || []), ...(techCardBag[3] || [])];

  for (const cardRef of techCards) {
    const cardId = typeof cardRef === 'string' ? cardRef : (cardRef as { id?: string })?.id;
    if (!cardId) continue;

    // Find card definition in TECH_CARD_BAG
    const card = allCards.find(c => c.id === cardId);
    if (card?.stats) {
      for (const [stat, value] of Object.entries(card.stats)) {
        stats[stat] = (stats[stat] || 0) + value;
      }
    }
  }

  return stats;
}

/**
 * Calculate weight from blueprint
 */
function calculateBlueprintWeight(blueprint: Blueprint): number {
  let weight = 0;
  const slots = ['frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'] as const;
  for (const slotKey of slots) {
    const slotArray = (blueprint as unknown as Record<string, (string | null)[]>)[slotKey] || [];
    for (const tileId of slotArray) {
      if (!tileId) continue;
      const tile = (TECH_TILES as Record<string, { weight?: number }>)[tileId];
      if (tile?.weight) {
        weight += Math.abs(tile.weight);
      }
    }
  }
  return weight;
}

/**
 * Calculate required gas cubes based on weight
 */
function calculateRequiredGasCubes(blueprint: Blueprint): number {
  const weight = calculateBlueprintWeight(blueprint);
  // Minimum 1 gas cube, otherwise ceil(weight / 5)
  return Math.max(1, Math.ceil(weight / 5));
}

/**
 * Check if player has Sparrowhawk Hangar upgrade installed (USA faction ability)
 * GAP-079: Per Appendix D, the UPGRADE sparrowhawk_hangar provides the ability
 * to bypass one route requirement per launch - not just owning the technology.
 * Per Section 13.3: "Trapeze Fighter System (ignore one route requirement per launch)"
 */
function hasSparrowhawkHangar(playerState: PlayerState): boolean {
  return playerState.blueprint?.componentSlots?.some(
    comp => comp === 'sparrowhawk_hangar' || (comp && typeof comp === 'object' && (comp as { id?: string }).id === 'sparrowhawk_hangar')
  ) || false;
}

interface LaunchShipData {
  shipId: string;
  routeId?: string;
  missionId?: string;
  gasType?: 'hydrogen' | 'helium';
  retainGas?: boolean;
  bypassRequirement?: 'range' | 'speed' | 'ceiling' | 'luxury' | null;
  cityChoice?: string | null;
  _internal?: boolean;
}

/**
 * Launch a ship from hangar
 */
function processLaunchShip(state: GameState, playerId: string, data: LaunchShipData): ActionResult {
  const { shipId, routeId, missionId, gasType = 'hydrogen', retainGas = false, bypassRequirement = null, cityChoice = null, _internal = false } = data;
  const launchState = state as LaunchState;
  const playerState = state.players[playerId] as LaunchPlayerState;
  const BLAUGAS_COST = 2; // £2 to retain gas cubes per Section 13.1

  // Validate that this is called through PLACE_AGENT at launchpad (Section 5.1)
  if (!_internal) {
    // Check if launchpad is active for this player
    if (!launchState.launchpadActive?.[playerId]) {
      throw new GameRuleError(
        'LAUNCH_SHIP not allowed: You must place an agent at Launchpad to launch ships (Section 5.1). ' +
        'Use PLACE_AGENT with locationId "launchpad" first.'
      );
    }
  }

  // Age II: Combat Missions replace routes per Section 10.5
  if (state.age === 2) {
    if (routeId && !missionId) {
      throw new GameRuleError('Age II uses Combat Missions instead of routes. Provide missionId, not routeId.');
    }
    if (!missionId) {
      throw new GameRuleError('Age II requires a missionId from the Mission Row. Use LAUNCH_SHIP with missionId parameter.');
    }
    // Delegate to combat mission launch logic
    const { processLaunchCombatMission } = require('./combatMission');
    return processLaunchCombatMission(state, playerId, { shipId, missionId, gasType, _internal });
  }

  // Step 1: Choose a target route (Age I or Age III)
  if (!routeId) {
    throw new GameRuleError('Must specify a route to launch to (routeId required)');
  }

  const mapState = state.map as MapState | undefined;
  const route = mapState?.routes?.find(r => r.id === routeId) as ExtendedRoute | undefined;
  if (!route) {
    throw new GameRuleError(`Route not found: ${routeId}`);
  }
  if (route.claimed) {
    throw new GameRuleError(`Route ${route.from} → ${route.to} is already claimed`);
  }

  // Calculate ship stats to validate against route requirements
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  // GAP-048/GAP-079: Check if player has Sparrowhawk Hangar UPGRADE installed for bypassing one requirement
  const canBypassRequirement = hasSparrowhawkHangar(playerState);
  const validBypassTypes = ['range', 'speed', 'ceiling', 'luxury'];

  // Validate bypassRequirement parameter if provided
  if (bypassRequirement) {
    if (!canBypassRequirement) {
      throw new GameRuleError('Cannot bypass route requirement without Sparrowhawk Hangar upgrade installed');
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
  if (bypassRequirement !== 'ceiling' && routeCeiling > 0 && (stats.ceiling || 0) < routeCeiling) {
    throw new GameRuleError(`Ship Ceiling (${stats.ceiling || 0}) does not meet route ceiling requirement (${routeCeiling})`);
  }

  // Validate Luxury meets route luxury requirement (unless bypassed)
  // Per Section 8.5/10.1: Routes marked Luxury require ships with the Luxury stat
  const routeLuxury = route.luxury || 0;
  const shipLuxury = stats.luxury || 0;
  if (bypassRequirement !== 'luxury' && routeLuxury > 0 && shipLuxury < routeLuxury) {
    throw new GameRuleError(`Ship Luxury (${shipLuxury}) does not meet route luxury requirement (${routeLuxury})`);
  }

  // Validate cityChoice per Section 10.4: Must be one of the route endpoints
  // Player chooses which endpoint city's bonus to receive
  let selectedCityChoice = cityChoice;
  if (cityChoice) {
    if (cityChoice !== route.from && cityChoice !== route.to) {
      throw new GameRuleError(`City "${cityChoice}" is not an endpoint of this route. Choose "${route.from}" or "${route.to}".`);
    }
  } else {
    // Default to 'to' city for backwards compatibility
    selectedCityChoice = route.to || route.from;
  }

  // Step 2: Verify launch requirements
  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Gas type must be hydrogen or helium');
  }

  // Helium requires Helium Handling tech card (Section 9.3)
  if (gasType === 'helium') {
    // Tech card IDs are lowercase (e.g., 'helium_handling')
    // Tech cards array may contain strings (IDs) or objects with id property
    const hasHeliumHandling = playerState.techCards?.some(t =>
      (typeof t === 'string' ? t : (t as { id?: string }).id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot use Helium without Helium Handling tech card');
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
  const ships = (playerState.ships || []) as unknown as LaunchShip[];
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
    // Blaugas Fuel System requires blaugas_storage tech card
    const hasBlaugas = playerState.techCards?.some(t =>
      (typeof t === 'string' ? t : (t as { id?: string }).id) === 'blaugas_storage'
    );
    if (!hasBlaugas) {
      throw new GameRuleError('Cannot use retainGas without Blaugas Fuel System tech card');
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
  ships[shipIndex].pendingCityChoice = selectedCityChoice || undefined;  // City bonus choice per Section 10.4

  // Build stats summary for log
  const statParts = [`Range ${stats.range}`, `Speed ${stats.speed}`];
  if (stats.ceiling && stats.ceiling > 0) statParts.push(`Ceiling ${stats.ceiling}`);
  if (stats.reliability && stats.reliability > 0) statParts.push(`Reliability ${stats.reliability}`);
  if (stats.luxury && stats.luxury > 0) statParts.push(`Luxury ${stats.luxury}`);

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship toward ${route.from} → ${route.to} (${requiredOfficers} Officer${requiredOfficers > 1 ? 's' : ''}, ${requiredCubes} ${gasType}): ${statParts.join(', ')}`,
    playerId,
    type: 'action'
  } as LogEntry);

  // Step 5: Draw hazard card and store for client response
  // Per Section 8.2: Player must see hazard and choose whether to spend engineers

  // Draw from hazard deck (reshuffle discard if needed)
  if (!playerState.hazardDeck || playerState.hazardDeck.length === 0) {
    const discardPile = playerState.hazardDiscardPile || [];
    if (discardPile.length === 0) {
      throw new GameRuleError('No hazard cards remaining (deck and discard pile both empty)');
    }
    playerState.hazardDeck = shuffleArray([...discardPile]);
    playerState.hazardDiscardPile = [];
    state.log.push({
      timestamp: new Date().toISOString(),
      message: 'Hazard deck exhausted - shuffled discard pile to create new deck',
      playerId,
      type: 'deck'
    } as LogEntry);
  }

  const hazard = playerState.hazardDeck!.shift()!;
  playerState.hazardDiscardPile = playerState.hazardDiscardPile || [];
  playerState.hazardDiscardPile.push(hazard);

  // Determine relevant stat for this hazard
  const challengeType = hazard.challengeType || 'reliability';
  const relevantStat = stats[challengeType] || 0;
  const difficulty = hazard.difficulty || 0;

  // Calculate engineers needed to pass (for non-fire, non-auto-pass hazards)
  let engineersNeeded = 0;
  if (!hazard.autoPass && hazard.category !== 'fire') {
    engineersNeeded = Math.max(0, difficulty - relevantStat);
  }

  // Check for auto-pass conditions
  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  const autoPassHeliumFire = isFireHazard && gasType === 'helium';
  const autoPassClearWeather = hazard.autoPass || hazard.type === 'clear_weather';

  // Check for Conductive Covering (auto-pass static discharge)
  const hasCondictiveCovering = playerState.blueprint?.fabricSlots?.some(
    fabric => fabric === 'conductive_covering' || (fabric && typeof fabric === 'object' && (fabric as { id?: string }).id === 'conductive_covering')
  );
  const autoPassCondictiveCovering = hazard.type === 'static_discharge' && hasCondictiveCovering;

  // Check for Fire-Resistant Fabric (once per age auto-pass fire)
  const hasFireResistantFabric = playerState.blueprint?.fabricSlots?.some(
    fabric => fabric === 'fire_resistant_fabric' || (fabric && typeof fabric === 'object' && (fabric as { id?: string }).id === 'fire_resistant_fabric')
  );
  const fireProtectionAvailable = isFireHazard && hasFireResistantFabric && !playerState.fireProtectionUsedThisAge;

  // Extended hazard properties that may exist on runtime hazard cards
  const extendedHazard = hazard as HazardCard & { special?: string; gasLossOnFailure?: boolean };

  // Store pending hazard on ship for client to respond
  ships[shipIndex].pendingHazard = {
    // Core hazard info
    type: hazard.type,
    name: hazard.name,
    category: hazard.category,
    challengeType,
    difficulty,
    flak: hazard.flak || 0,

    // Fire hazard specific
    engineerCost: hazard.engineerCost,  // for Engine Fire, Gas Cell Rupture
    noSave: hazard.noSave,              // for Catastrophic Explosion
    hydrogenOnly: hazard.hydrogenOnly,

    // Special effects
    special: extendedHazard.special,
    gasLossOnFailure: extendedHazard.gasLossOnFailure,

    // Ship stats for comparison
    relevantStat,
    statName: challengeType,
    engineersNeeded,

    // Auto-pass flags (client uses these to show appropriate UI)
    autoPass: autoPassClearWeather,
    autoPassReason: getAutoPassReason(autoPassClearWeather, autoPassHeliumFire, autoPassCondictiveCovering || false, fireProtectionAvailable),
    heliumFireImmunity: autoPassHeliumFire,
    conductiveCoveringImmunity: autoPassCondictiveCovering || false,
    fireResistantFabricAvailable: fireProtectionAvailable
  };

  // Build log message
  const autoPassReason = ships[shipIndex].pendingHazard!.autoPassReason;
  const hazardDetails = autoPassReason
    ? ' (' + autoPassReason + ')'
    : ' (' + challengeType + ' ' + difficulty + ' vs ' + relevantStat + ')';

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Hazard drawn: ' + hazard.name + hazardDetails,
    playerId,
    type: 'hazard'
  } as LogEntry);

  // Return - client must call RESPOND_TO_HAZARD to continue
  return { newState: state };
}

interface ClaimRouteData {
  shipId: string;
  routeId: string;
}

/**
 * Claim a route with a launched ship
 */
function processClaimRoute(state: GameState, playerId: string, data: ClaimRouteData): ActionResult {
  const { shipId, routeId } = data;
  const playerState = state.players[playerId];

  // Find launched ship
  const ships = (playerState.ships || []) as unknown as LaunchShip[];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'launched');

  if (shipIndex === -1) {
    throw new GameRuleError('No launched ship available');
  }

  const ship = ships[shipIndex];

  // Find route
  const mapState = state.map as MapState | undefined;
  const route = mapState?.routes?.find(r => r.id === routeId) as ExtendedRoute | undefined;
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
    round: state.round
  };

  // Update ship to on-route status
  ships[shipIndex].status = 'on_route';
  (ships[shipIndex] as unknown as Ship & { routeId?: string }).routeId = routeId;

  // Add route income to player
  playerState.income += route.income;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Claimed route ${route.from} → ${route.to} for +${route.income} income`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

/**
 * Signal completion of launches at launchpad
 * Per Section 6.4: Launchpad is a multi-step location
 * - Place agent to enable launching
 * - Can launch multiple ships while at launchpad
 * - Call NO_MORE_LAUNCHES to signal completion and advance turn
 */
function processNoMoreLaunches(state: GameState, playerId: string): ActionResult {
  const launchState = state as LaunchState;

  // Validate launchpad is active for this player
  if (!launchState.launchpadActive?.[playerId]) {
    throw new GameRuleError(
      'NO_MORE_LAUNCHES not allowed: You are not at the Launchpad. ' +
      'Place an agent at Launchpad first using PLACE_AGENT.'
    );
  }

  // Deactivate launchpad
  launchState.launchpadActive[playerId] = false;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Finished launching ships at Launchpad',
    playerId,
    type: 'action'
  } as LogEntry);

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

export {
  processLaunchShip,
  processClaimRoute,
  processNoMoreLaunches,
  calculateBlueprintStats,
  calculateShipStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes,
  countPlayerNetworks,
  countPlayerNetworksById,
  validateNetworkConnectivity
};

// CommonJS compatibility
module.exports = {
  processLaunchShip,
  processClaimRoute,
  processNoMoreLaunches,
  calculateBlueprintStats,
  calculateShipStats,
  calculateBlueprintWeight,
  calculateRequiredGasCubes,
  countPlayerNetworks,
  countPlayerNetworksById,
  validateNetworkConnectivity
};
