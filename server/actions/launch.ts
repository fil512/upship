/**
 * Launch Actions
 * LAUNCH_SHIP, CLAIM_ROUTE action processors
 *
 * Ships are tokens, not individual entities. Ship stats come from
 * the current blueprint at launch time.
 */

import type { GameState, PlayerState, Route, LogEntry, HazardCard, Blueprint, PendingLaunch } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { TECH_TILES } = require('../data/upgrades');
const { AGE_BASELINES } = require('../config/constants');
const { shuffleArray } = require('../utils/random');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

interface ShipStats {
  range: number;
  speed: number;
  ceiling?: number;
  reliability?: number;
  luxury?: number;
  income?: number;
  [key: string]: number | undefined;
}

// Extended hazard info stored during pending launch
interface PendingHazardInfo {
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

// Extended pending launch with hazard info
type ExtendedPendingLaunch = PendingLaunch & {
  hazardInfo?: PendingHazardInfo;
  stats?: ShipStats;
  launchedAge?: number;
};

// Extended types for launch operations
type LaunchPlayerState = PlayerState & {
  fireProtectionUsedThisAge?: boolean;
  hazardDeck?: HazardCard[];
  hazardDiscardPile?: HazardCard[];
  launchBonuses?: {
    range?: number;
    luxury?: number;
    speed?: number;
    reliability?: number;
    ignoreWeather?: boolean;
    routeIncomeBonus?: number;
    combatIncomeBonus?: number;
  };
  pendingLaunch?: ExtendedPendingLaunch;
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
    round: number;
    // shipId removed - ships are fungible tokens
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
  // All stats come from installed tiles in the blueprint
  // Tech cards only unlock tiles, they don't provide stats directly
  return calculateBlueprintStats(playerState.blueprint, age);
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
  // shipId removed - ships are fungible tokens
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
 * Ships are tokens - stats come from blueprint at launch time.
 */
function processLaunchShip(state: GameState, playerId: string, data: LaunchShipData): ActionResult {
  const { routeId, missionId, gasType = 'hydrogen', retainGas = false, bypassRequirement = null, cityChoice = null, _internal = false } = data;
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
    return processLaunchCombatMission(state, playerId, { missionId, gasType, _internal });
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

  // Double track restriction: same player cannot claim both tracks
  if (route.track) {
    const otherTrack = mapState?.routes?.find(r =>
      r.from === route.from && r.to === route.to &&
      r.track && r.track !== route.track &&
      r.claimed === playerId
    );
    if (otherTrack) {
      throw new GameRuleError(`You already own the other track of ${route.from} → ${route.to}. The same player cannot claim both tracks of a double-track route.`);
    }
  }

  // Calculate ship stats to validate against route requirements
  const stats = calculateBlueprintStats(playerState.blueprint, state.age);

  // Apply launch bonuses from card effects (Navigator +1 Range, Cook's Man +1 Luxury, Helmsman +1 Speed)
  const launchBonuses = (playerState as LaunchPlayerState).launchBonuses;
  if (launchBonuses) {
    if (launchBonuses.range) stats.range += launchBonuses.range;
    if (launchBonuses.luxury) stats.luxury = (stats.luxury || 0) + launchBonuses.luxury;
    if (launchBonuses.speed) stats.speed += launchBonuses.speed;
  }

  // Validate minimum ship stats required to launch
  // Ships must have Range >= 1 and Speed >= 1 to reach any destination
  if (stats.range < 1) {
    throw new GameRuleError('Cannot launch: Ship Range must be at least 1. Install drive or component tiles that provide Range.');
  }
  if (stats.speed < 1) {
    throw new GameRuleError('Cannot launch: Ship Speed must be at least 1. Install drive tiles that provide Speed.');
  }

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
  const routeSpeed = route.speed || 0;
  if (bypassRequirement !== 'speed' && routeSpeed > 0 && stats.speed < routeSpeed) {
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

  // Validate minimum components installed (at least one Frame, one Fabric, one Drive)
  const frameSlots = playerState.blueprint.frameSlots || [];
  const fabricSlots = playerState.blueprint.fabricSlots || [];
  const driveSlots = playerState.blueprint.driveSlots || [];

  const hasFrame = frameSlots.some(s => s !== null);
  const hasFabric = fabricSlots.some(s => s !== null);
  const hasDrive = driveSlots.some(s => s !== null);

  if (!hasFrame) {
    throw new GameRuleError('Cannot launch: At least one Frame tile must be installed.');
  }
  if (!hasFabric) {
    throw new GameRuleError('Cannot launch: At least one Fabric tile must be installed.');
  }
  if (!hasDrive) {
    throw new GameRuleError('Cannot launch: At least one Drive tile must be installed.');
  }

  // Step 3: Validate ship availability and resources
  // Ships are fungible tokens - just check if there's one in the hangar
  const hangarShips = playerState.hangarShips || 0;

  if (hangarShips <= 0) {
    throw new GameRuleError('No ships available in hangar');
  }

  // Check if already mid-launch (only one launch at a time)
  if (playerState.pendingLaunch) {
    throw new GameRuleError('Already have a ship mid-launch awaiting hazard resolution');
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

  // Log resource flows
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'officers', requiredOfficers, 'launch', 'Ship launch', playerState.officers);

  // Gas handling: consume gas unless using Blaugas to retain
  if (retainGas) {
    // Pay Blaugas cost to retain gas cubes
    playerState.cash -= BLAUGAS_COST;
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'cash', BLAUGAS_COST, 'launch', 'Blaugas cost', playerState.cash);
    // Gas cubes are NOT consumed
  } else {
    // Normal launch: consume gas cubes
    playerState.gasCubes[gasType] -= requiredCubes;
    const resourceType = gasType === 'hydrogen' ? 'hydrogen' : 'helium';
    resourceFlowLogger.logSink(flowContext, playerId, faction, resourceType, requiredCubes, 'launch', 'Gas consumption', playerState.gasCubes[gasType]);
  }

  // Step 4: Decrement hangar and set pending launch
  // Ship is now "in transit" awaiting hazard check per Section 8.3
  playerState.hangarShips = hangarShips - 1;

  // Initialize pendingLaunch (will add hazard info below)
  playerState.pendingLaunch = {
    routeId: routeId!,
    gasType,
    cityChoice: selectedCityChoice || undefined,
    stats,
    launchedAge: state.age
  };

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

  // Calculate engineers needed to pass
  let engineersNeeded = 0;
  if (!hazard.autoPass) {
    if (hazard.category === 'fire' && hazard.engineerCost) {
      // Fire hazards use engineerCost (Engine Fire = 1, Gas Cell Rupture = 2)
      engineersNeeded = hazard.engineerCost;
    } else if (hazard.category !== 'fire') {
      // Non-fire hazards: engineers make up the difference between stat and difficulty
      engineersNeeded = Math.max(0, difficulty - relevantStat);
    }
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

  // Store pending hazard info for client to respond
  playerState.pendingLaunch!.hazardInfo = {
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

  // Also store hazard on pendingLaunch for API compatibility
  playerState.pendingLaunch!.hazard = hazard;

  // Build log message
  const autoPassReason = playerState.pendingLaunch!.hazardInfo!.autoPassReason;
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
  routeId: string;
  // shipId removed - ships are fungible tokens
}

/**
 * Claim a route with a launched ship
 * NOTE: In the new model, routes are typically claimed via RESPOND_TO_HAZARD
 * when the hazard check passes. This function is kept for backwards compatibility.
 */
function processClaimRoute(state: GameState, playerId: string, data: ClaimRouteData): ActionResult {
  const { routeId } = data;
  const playerState = state.players[playerId] as LaunchPlayerState;

  // Check if there's a pending launch (ship in transit after hazard passed)
  if (!playerState.pendingLaunch) {
    throw new GameRuleError('No ship in transit to claim route with');
  }

  const pendingLaunch = playerState.pendingLaunch;
  const stats = pendingLaunch.stats || { range: 1, speed: 1 };

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

  // Double track restriction: same player cannot claim both tracks
  if (route.track) {
    const otherTrack = mapState?.routes?.find(r =>
      r.from === route.from && r.to === route.to &&
      r.track && r.track !== route.track &&
      r.claimed === playerId
    );
    if (otherTrack) {
      throw new GameRuleError(`You already own the other track of ${route.from} → ${route.to}. The same player cannot claim both tracks of a double-track route.`);
    }
  }

  // Check ship meets route requirements
  if (stats.range < (route.distance || 1)) {
    throw new GameRuleError(`Ship range (${stats.range}) < route distance (${route.distance})`);
  }
  if (route.speed && stats.speed < route.speed) {
    throw new GameRuleError(`Ship speed (${stats.speed}) < route requirement (${route.speed})`);
  }

  // Claim the route
  route.claimed = playerId;
  route.claimedBy = {
    playerId,
    round: state.round
  };

  // Add route income + ship income bonus to player
  const shipIncome = stats.income || 0;
  const totalIncome = route.income + shipIncome;
  playerState.income += totalIncome;

  // Clear pending launch (ship is now "on route")
  delete playerState.pendingLaunch;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: shipIncome > 0
      ? `Claimed route ${route.from} → ${route.to} for +${route.income} route income +${shipIncome} ship income = +${totalIncome} total`
      : `Claimed route ${route.from} → ${route.to} for +${route.income} income`,
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
