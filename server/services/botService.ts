/**
 * Bot Strategy Service
 * Ports the Python playtest/strategy.py logic to TypeScript for AI bot opponents.
 */

import type {
  GameState,
  PlayerState,
  Card,
  Route,
  Ship,
  Blueprint,
  Technology
} from '@upship/api';

// Import game data for slot type lookup
const { UPGRADES } = require('../data/upgrades');
const { GROUND_BOARD_LOCATIONS } = require('../data/groundBoard');

// Types for bot decisions
export interface PlacementDecision {
  cardIndex: number;
  locationId: string;
  locationAction?: Record<string, unknown>;
}

export interface LaunchDecision {
  shipId: string;
  routeId: string;
  gasType: 'hydrogen' | 'helium';
}

export interface DesignBureauSwap {
  action: 'install';
  slotType: string;
  slotIndex: number;
  upgradeId: string;
}

export interface LaunchReadiness {
  canLaunch: boolean;
  hasAchievableTarget: boolean;
  missing: string[];
  priorities: string[];
  hangarShips: Ship[];
  totalGas: number;
  engineers: number;
}

export interface RevealDecision {
  techIds: string[];
  cardIds: string[];
}

/**
 * Find a card that can be played at an available location
 */
function findPlayableCard(
  hand: Card[],
  locations: Array<{ id: string; symbol: string }>
): { card: Card; location: { id: string; symbol: string }; cardIndex: number } | null {
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    const cardSymbol = card.symbol || 'any';
    for (const loc of locations) {
      if (cardSymbol === loc.symbol || cardSymbol === 'any') {
        return { card, location: loc, cardIndex: i };
      }
    }
  }
  return null;
}

/**
 * Get upgrade info for a technology ID
 */
function getUpgradeForTech(techId: string): { id: string; slotType: string } | null {
  // Map tech IDs to their corresponding upgrade and slot type
  // The upgrade ID is typically the same as the tech ID for most technologies
  const upgrade = UPGRADES.find((u: { id: string }) => u.id === techId);
  if (upgrade) {
    return {
      id: upgrade.id,
      slotType: upgrade.slotType
    };
  }
  return null;
}

/**
 * Get slot type property name from short form
 */
function getSlotPropertyName(slotType: string): string {
  const mapping: Record<string, string> = {
    'frame': 'frameSlots',
    'fabric': 'fabricSlots',
    'drive': 'driveSlots',
    'component': 'componentSlots'
  };
  return mapping[slotType] || slotType;
}

/**
 * Calculate ship stats from blueprint
 */
export function calculateShipStats(
  ship: Ship,
  player: PlayerState
): { lift: number; weight: number; range: number; speed: number; ceiling: number; reliability: number } {
  // Ships have their stats calculated at build time
  // Use the stats directly from the ship object
  return {
    lift: ship.lift || 0,
    weight: ship.weight || 0,
    range: ship.range || 1,
    speed: ship.speed || 0,
    ceiling: ship.ceiling || 0,
    reliability: ship.reliability || 0
  };
}

/**
 * Determine which upgrades to install at Design Bureau
 */
export function getDesignBureauSwaps(
  player: PlayerState,
  currentAge: number = 1,
  isAgeTransition: boolean = false
): DesignBureauSwap[] {
  const swaps: DesignBureauSwap[] = [];

  if (!player || !player.blueprint) {
    return swaps;
  }

  const blueprint = player.blueprint;
  const technologies = player.techCards || [];

  if (technologies.length === 0) {
    return swaps;
  }

  const frameSlots = blueprint.frameSlots || [];
  const fabricSlots = blueprint.fabricSlots || [];
  const driveSlots = blueprint.driveSlots || [];

  const emptyFrameIndices = frameSlots
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);
  const emptyFabricIndices = fabricSlots
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);
  const emptyDriveIndices = driveSlots
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);

  // Track installed drive upgrades (no duplicates allowed)
  const installedDriveUpgrades = new Set(driveSlots.filter(s => s !== null));

  // Collect available upgrades from technologies
  const frameUpgrades: Array<{ upgradeId: string }> = [];
  const fabricUpgrades: Array<{ upgradeId: string }> = [];
  const driveUpgrades: Array<{ upgradeId: string }> = [];

  for (const techId of technologies) {
    const upgradeInfo = getUpgradeForTech(techId);
    if (upgradeInfo) {
      const slotType = upgradeInfo.slotType;
      if (slotType === 'frame') {
        frameUpgrades.push({ upgradeId: upgradeInfo.id });
      } else if (slotType === 'fabric') {
        fabricUpgrades.push({ upgradeId: upgradeInfo.id });
      } else if (slotType === 'drive') {
        if (!installedDriveUpgrades.has(upgradeInfo.id)) {
          driveUpgrades.push({ upgradeId: upgradeInfo.id });
        }
      }
    }
  }

  // Expand frame/fabric upgrades for duplicates if needed
  function expandForDuplicates(upgrades: Array<{ upgradeId: string }>, emptyCount: number): Array<{ upgradeId: string }> {
    if (upgrades.length === 0 || emptyCount === 0) return upgrades;
    const result = [...upgrades];
    while (result.length < emptyCount && upgrades.length > 0) {
      result.push({ ...upgrades[0] });
    }
    return result;
  }

  const expandedFrame = expandForDuplicates(frameUpgrades, emptyFrameIndices.length);
  const expandedFabric = expandForDuplicates(fabricUpgrades, emptyFabricIndices.length);

  // Determine priority based on context
  type UpgradeOrder = [Array<{ upgradeId: string }>, number[], string];
  let upgradeOrder: UpgradeOrder[];

  if (isAgeTransition || currentAge === 1) {
    // Age transition or Age I: structural slots first
    upgradeOrder = [
      [expandedFrame, [...emptyFrameIndices], 'frame'],
      [expandedFabric, [...emptyFabricIndices], 'fabric'],
      [driveUpgrades, [...emptyDriveIndices], 'drive']
    ];
  } else {
    // Age II/III: prioritize drive for range/speed
    upgradeOrder = [
      [driveUpgrades, [...emptyDriveIndices], 'drive'],
      [expandedFrame, [...emptyFrameIndices], 'frame'],
      [expandedFabric, [...emptyFabricIndices], 'fabric']
    ];
  }

  // Apply swap limit (none for age transition, 2 for normal)
  const maxSwaps = isAgeTransition ? Infinity : 2;

  for (const [upgrades, emptyIndices, slotType] of upgradeOrder) {
    for (const upgrade of upgrades) {
      if (emptyIndices.length > 0 && swaps.length < maxSwaps) {
        const slotIndex = emptyIndices.shift()!;
        swaps.push({
          action: 'install',
          slotType,
          slotIndex,
          upgradeId: upgrade.upgradeId
        });
      }
    }
  }

  return swaps;
}

/**
 * Evaluate what a player needs to be able to launch
 */
export function evaluateLaunchReadiness(
  state: GameState,
  playerId: string
): LaunchReadiness {
  const player = state.players[playerId];
  if (!player) {
    return {
      canLaunch: false,
      hasAchievableTarget: false,
      missing: ['player not found'],
      priorities: [],
      hangarShips: [],
      totalGas: 0,
      engineers: 0
    };
  }

  const hangarShips = (player.ships || []).filter(s => s.status === 'hangar');
  const hydrogen = player.gasCubes?.hydrogen || 0;
  const helium = player.gasCubes?.helium || 0;
  const totalGas = hydrogen + helium;
  const engineers = player.engineers || 0;
  const officers = player.officers || 0;
  const cash = player.cash || 0;
  const currentAge = state.age || 1;

  const missing: string[] = [];
  const priorities: string[] = [];

  // Check 1: Do we have a ship?
  if (hangarShips.length === 0) {
    missing.push('no ship in hangar');
    if (cash >= 5) {
      priorities.push('construction_hall');
    } else {
      priorities.push('government_liaison');
      priorities.push('construction_hall');
    }
    return {
      canLaunch: false,
      hasAchievableTarget: false,
      missing,
      priorities,
      hangarShips,
      totalGas,
      engineers
    };
  }

  // Check 2: Are all frame and fabric slots filled?
  let slotsReady = true;
  if (player.blueprint) {
    const frameSlots = player.blueprint.frameSlots || [];
    const fabricSlots = player.blueprint.fabricSlots || [];
    const emptyFrame = frameSlots.filter(s => s === null).length;
    const emptyFabric = fabricSlots.filter(s => s === null).length;

    if (emptyFrame > 0) {
      missing.push(`${emptyFrame} empty Frame slot(s)`);
      priorities.push('design_bureau');
      slotsReady = false;
    }
    if (emptyFabric > 0) {
      missing.push(`${emptyFabric} empty Fabric slot(s)`);
      if (!priorities.includes('design_bureau')) {
        priorities.push('design_bureau');
      }
      slotsReady = false;
    }
  }

  // Check 3: Do we have enough officers?
  const officersNeeded = currentAge;
  if (officers < officersNeeded) {
    missing.push(`need ${officersNeeded - officers} more officer(s) for Age ${currentAge}`);
    priorities.push('academy');
  }

  // Check 4: Do we have gas?
  if (totalGas < 1) {
    missing.push('need gas');
    priorities.push('gas_depot');
  }

  // Check 5: Do we have achievable routes?
  let hasAchievableTarget = false;
  const routes = (state.map?.routes || []).filter(r => !r.claimed);

  if (hangarShips.length > 0 && routes.length > 0) {
    const ship = hangarShips[0];
    const shipStats = calculateShipStats(ship, player);

    for (const route of routes) {
      const routeRange = route.distance || route.range || 1;
      const routeSpeed = route.speedRequirement || route.speed || 0;
      const routeCeiling = route.ceilingRequirement || route.ceiling || 0;

      if (shipStats.range >= routeRange &&
          shipStats.speed >= routeSpeed &&
          shipStats.ceiling >= routeCeiling) {
        hasAchievableTarget = true;
        break;
      }
    }

    if (!hasAchievableTarget) {
      missing.push(`no reachable routes (range=${shipStats.range}, speed=${shipStats.speed})`);
      priorities.unshift('research_institute');
      priorities.splice(1, 0, 'design_bureau');
    }
  }

  // Check 6: Do we have engineers for hazard mitigation?
  if (engineers < 2) {
    missing.push(`low engineers (${engineers}/2 recommended)`);
    priorities.push('technical_institute');
  }

  const canLaunch = hangarShips.length > 0 && slotsReady &&
                    officers >= officersNeeded && totalGas >= 1 &&
                    hasAchievableTarget;

  return {
    canLaunch,
    hasAchievableTarget,
    missing,
    priorities,
    hangarShips,
    totalGas,
    engineers
  };
}

/**
 * Find strategic card/location placement for worker placement phase
 */
export function findStrategicPlacement(
  state: GameState,
  playerId: string
): PlacementDecision | null {
  const player = state.players[playerId];
  if (!player) return null;

  const hand = player.hand || [];
  if (hand.length === 0) return null;

  // Get available locations (not occupied)
  const occupiedLocations = new Set(
    Object.keys(state.groundBoard?.placements || {})
  );

  const availableLocations = GROUND_BOARD_LOCATIONS
    .filter((loc: { id: string }) => !occupiedLocations.has(loc.id))
    .map((loc: { id: string; symbol: string }) => ({ id: loc.id, symbol: loc.symbol }));

  if (availableLocations.length === 0) return null;

  // Evaluate launch readiness
  const launchEval = evaluateLaunchReadiness(state, playerId);

  // Build priority list
  const priorityLocations: string[] = [];

  // Phase 1: If launch-ready, go to launchpad
  if (launchEval.canLaunch) {
    priorityLocations.push('launchpad');
  }

  // Add priorities from launch evaluation
  priorityLocations.push(...launchEval.priorities);

  // Phase 2: Strategic investments based on state
  const cash = player.cash || 0;
  const totalGas = launchEval.totalGas;
  const officers = player.officers || 0;
  const hangarCount = launchEval.hangarShips.length;
  const onRouteCount = (player.ships || []).filter(s => s.status === 'on_route').length;

  if (onRouteCount >= 2) {
    priorityLocations.push('research_institute');
    priorityLocations.push('flight_school');
    priorityLocations.push('technical_institute');
  }

  if (hangarCount < 2 && cash >= 5) {
    priorityLocations.push('construction_hall');
  }

  if (totalGas < 3) {
    priorityLocations.push('gas_depot');
  }

  if (officers < 2 && cash >= 2) {
    priorityLocations.push('academy');
  }

  if (hangarCount > 0 || onRouteCount > 0) {
    priorityLocations.push('insurance_bureau');
  }

  // Phase 3: Fallback priorities
  const fallbackPriorities = [
    'design_bureau', 'research_institute', 'construction_hall',
    'gas_depot', 'academy', 'technical_institute', 'ministry',
    'flight_school', 'weather_bureau', 'government_liaison',
    'insurance_bureau', 'launchpad'
  ];

  for (const loc of fallbackPriorities) {
    if (!priorityLocations.includes(loc)) {
      priorityLocations.push(loc);
    }
  }

  // Phase 4: Find first available location with matching card
  const availableIds = new Set(availableLocations.map((l: { id: string }) => l.id));

  for (const locId of priorityLocations) {
    if (!availableIds.has(locId)) continue;

    const loc = availableLocations.find((l: { id: string }) => l.id === locId);
    if (!loc) continue;

    for (let cardIndex = 0; cardIndex < hand.length; cardIndex++) {
      const card = hand[cardIndex];
      const cardSymbol = card.symbol || 'any';
      if (cardSymbol === loc.symbol || cardSymbol === 'any') {
        return {
          cardIndex,
          locationId: locId,
          locationAction: buildLocationAction(locId, state, playerId)
        };
      }
    }
  }

  // Fallback: any playable card
  const fallback = findPlayableCard(hand, availableLocations);
  if (fallback) {
    return {
      cardIndex: fallback.cardIndex,
      locationId: fallback.location.id,
      locationAction: buildLocationAction(fallback.location.id, state, playerId)
    };
  }

  return null;
}

/**
 * Build location-specific action parameters
 */
function buildLocationAction(
  locationId: string,
  state: GameState,
  playerId: string
): Record<string, unknown> | undefined {
  const player = state.players[playerId];
  if (!player) return undefined;

  switch (locationId) {
    case 'construction_hall':
      return { buildCount: 1 };

    case 'design_bureau':
      const swaps = getDesignBureauSwaps(player, state.age || 1);
      return swaps.length > 0 ? { swaps } : undefined;

    case 'gas_depot':
      // USA uses helium, others use hydrogen
      const gasType = player.faction === 'usa' ? 'helium' : 'hydrogen';
      return { gasType, gasAmount: 3 };

    case 'academy':
      return { crewType: 'officer', crewCount: 1 };

    case 'flight_school':
    case 'technical_institute':
    case 'research_institute':
      return { levels: 1 };

    case 'insurance_bureau':
      return { policyCount: 1 };

    default:
      return undefined;
  }
}

/**
 * Find best launch decision for a ship
 */
export function findLaunchDecision(
  state: GameState,
  playerId: string
): LaunchDecision | null {
  const player = state.players[playerId];
  if (!player) return null;

  const hangarShips = (player.ships || []).filter(s => s.status === 'hangar');
  if (hangarShips.length === 0) return null;

  const routes = (state.map?.routes || []).filter(r => !r.claimed);
  if (routes.length === 0) return null;

  const ship = hangarShips[0];
  const shipStats = calculateShipStats(ship, player);

  // Find achievable routes
  const achievableRoutes = routes.filter(route => {
    const routeRange = route.distance || route.range || 1;
    const routeSpeed = route.speedRequirement || route.speed || 0;
    const routeCeiling = route.ceilingRequirement || route.ceiling || 0;

    return shipStats.range >= routeRange &&
           shipStats.speed >= routeSpeed &&
           shipStats.ceiling >= routeCeiling;
  });

  if (achievableRoutes.length === 0) return null;

  // Sort by VP (highest first)
  achievableRoutes.sort((a, b) => (b.vp || 0) - (a.vp || 0));

  // Use helium for USA, hydrogen for others
  const gasType = player.faction === 'usa' ? 'helium' : 'hydrogen';

  return {
    shipId: ship.id,
    routeId: achievableRoutes[0].id,
    gasType
  };
}

/**
 * Get reveal phase acquisitions (tech priorities)
 */
export function getRevealAcquisitions(
  state: GameState,
  playerId: string
): RevealDecision {
  const player = state.players[playerId];
  const techIds: string[] = [];
  const cardIds: string[] = [];

  if (!player) return { techIds, cardIds };

  const rdBoard = state.rdBoard || [];
  const ownedTechs = new Set(player.techCards || []);

  // Priority: drive technologies for range/speed
  const driveTechNames = new Set([
    'basic_engine', 'efficient_propeller', 'diesel_engine',
    'supercharger', 'advanced_propeller', 'rotary_engine',
    'turbocharger', 'triple_engine', 'jet_engine', 'variable_pitch_propeller'
  ]);

  // Filter to available techs not already owned
  const availableTechs = rdBoard.filter(t => !ownedTechs.has(t.id));

  if (availableTechs.length === 0) return { techIds, cardIds };

  // Prioritize drive technologies
  const driveTechs = availableTechs.filter(t => driveTechNames.has(t.id));
  const otherTechs = availableTechs.filter(t => !driveTechNames.has(t.id));

  // Pick the best available
  if (driveTechs.length > 0) {
    techIds.push(driveTechs[0].id);
  } else if (otherTechs.length > 0) {
    techIds.push(otherTechs[0].id);
  }

  return { techIds, cardIds };
}

/**
 * Decide whether to spend engineers on hazard response
 */
export function getHazardResponse(
  state: GameState,
  playerId: string,
  shipId: string
): { spendEngineers: boolean } {
  const player = state.players[playerId];
  if (!player) return { spendEngineers: false };

  // Find the ship with pending hazard
  const ship = (player.ships || []).find(s => s.id === shipId);
  if (!ship || !ship.pendingHazard) return { spendEngineers: false };

  const hazard = ship.pendingHazard;
  const engineers = player.engineers || 0;
  const engineersNeeded = hazard.engineerCost || 0;

  // Spend engineers if we have enough
  return { spendEngineers: engineers >= engineersNeeded };
}

// CommonJS compatibility
module.exports = {
  findStrategicPlacement,
  evaluateLaunchReadiness,
  getDesignBureauSwaps,
  findLaunchDecision,
  getRevealAcquisitions,
  getHazardResponse,
  calculateShipStats
};
