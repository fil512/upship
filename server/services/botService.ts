/**
 * Bot Strategy Service
 * Ports the Python playtest/strategy.py logic to TypeScript for AI bot opponents.
 */

import type {
  GameState,
  PlayerState,
  Card,
  Ship
} from '@upship/api';

// Import game data for slot type lookup
import type { TechTile } from '../data/upgrades';
const { UPGRADES } = require('../data/upgrades') as { UPGRADES: Record<string, TechTile> };
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

// Blueprint changes for Design Bureau action
export interface BlueprintChanges {
  frameSlots?: (string | null)[];
  fabricSlots?: (string | null)[];
  driveSlots?: (string | null)[];
  componentSlots?: (string | null)[];
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
 * Tech card IDs (e.g., 'internal_keel') map to upgrade tile IDs (e.g., 'semi_rigid_keel')
 * via the 'requiredCard' field on upgrade tiles
 */
function getUpgradeForTech(techId: string): { id: string; slotType: string } | null {
  // Search for the upgrade tile that requires this tech card
  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (upgrade.requiredCard === techId) {
      return {
        id: upgradeId,
        slotType: upgrade.slotType
      };
    }
  }
  return null;
}

/**
 * Calculate ship stats from blueprint
 */
export function calculateShipStats(
  ship: Ship,
  _player: PlayerState
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
 * Determine the desired blueprint configuration for Design Bureau action.
 * Returns the complete blueprint with all slots filled, or null if no changes needed.
 *
 * For age transitions, all empty frame/fabric slots MUST be filled.
 * For normal play, bot will fill empty slots opportunistically.
 */
export function getDesignBureauBlueprint(
  player: PlayerState,
  _currentAge: number = 1,
  isAgeTransition: boolean = false
): BlueprintChanges | null {
  if (!player || !player.blueprint) {
    return null;
  }

  const blueprint = player.blueprint;
  const technologies = player.techCards || [];

  // Start with current blueprint state
  const newBlueprint: BlueprintChanges = {
    frameSlots: [...(blueprint.frameSlots || [])],
    fabricSlots: [...(blueprint.fabricSlots || [])],
    driveSlots: [...(blueprint.driveSlots || [])],
    componentSlots: [...(blueprint.componentSlots || [])]
  };

  // Find empty slot indices
  const emptyFrameIndices = newBlueprint.frameSlots!
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);
  const emptyFabricIndices = newBlueprint.fabricSlots!
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);
  const emptyDriveIndices = newBlueprint.driveSlots!
    .map((s, i) => s === null ? i : -1)
    .filter(i => i !== -1);

  // No empty slots = no changes needed
  if (emptyFrameIndices.length === 0 && emptyFabricIndices.length === 0 && emptyDriveIndices.length === 0) {
    return null;
  }

  // If no technologies, can't fill anything
  if (technologies.length === 0) {
    // For age transition, return current state (server will validate)
    return isAgeTransition ? newBlueprint : null;
  }

  // Track installed drive upgrades (no duplicates allowed)
  const installedDriveUpgrades = new Set(newBlueprint.driveSlots!.filter(s => s !== null));

  // Collect available upgrades from technologies
  const frameUpgrades: string[] = [];
  const fabricUpgrades: string[] = [];
  const driveUpgrades: string[] = [];

  for (const techId of technologies) {
    const upgradeInfo = getUpgradeForTech(techId);
    if (upgradeInfo) {
      // slotType is 'frameSlots', 'fabricSlots', 'driveSlots', etc.
      const slotType = upgradeInfo.slotType;
      if (slotType === 'frameSlots') {
        frameUpgrades.push(upgradeInfo.id);
      } else if (slotType === 'fabricSlots') {
        fabricUpgrades.push(upgradeInfo.id);
      } else if (slotType === 'driveSlots') {
        if (!installedDriveUpgrades.has(upgradeInfo.id)) {
          driveUpgrades.push(upgradeInfo.id);
        }
      }
    }
  }

  // Track changes made
  let changesMade = false;

  // Fill empty frame slots (duplicates allowed for frame/fabric)
  for (const idx of emptyFrameIndices) {
    if (frameUpgrades.length > 0) {
      newBlueprint.frameSlots![idx] = frameUpgrades[0]; // Reuse first available
      changesMade = true;
    }
  }

  // Fill empty fabric slots
  for (const idx of emptyFabricIndices) {
    if (fabricUpgrades.length > 0) {
      newBlueprint.fabricSlots![idx] = fabricUpgrades[0]; // Reuse first available
      changesMade = true;
    }
  }

  // Fill empty drive slots (no duplicates)
  let driveIdx = 0;
  for (const idx of emptyDriveIndices) {
    if (driveIdx < driveUpgrades.length) {
      const upgradeId = driveUpgrades[driveIdx];
      if (!installedDriveUpgrades.has(upgradeId)) {
        newBlueprint.driveSlots![idx] = upgradeId;
        installedDriveUpgrades.add(upgradeId);
        changesMade = true;
        driveIdx++;
      }
    }
  }

  // For age transition, always return the blueprint (even if incomplete - server validates)
  // For normal play, only return if we made changes
  if (isAgeTransition) {
    return newBlueprint;
  }

  return changesMade ? newBlueprint : null;
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

  const availableLocations = Object.values(GROUND_BOARD_LOCATIONS)
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

    case 'design_bureau': {
      const blueprint = getDesignBureauBlueprint(player, state.age || 1);
      return blueprint ? { blueprint } : undefined;
    }

    case 'gas_depot': {
      // USA uses helium, others use hydrogen
      const gasType = player.faction === 'usa' ? 'helium' : 'hydrogen';
      return { gasType, gasAmount: 3 };
    }

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
  getDesignBureauBlueprint,
  findLaunchDecision,
  getRevealAcquisitions,
  getHazardResponse,
  calculateShipStats
};
