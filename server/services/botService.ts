/**
 * Bot Strategy Service
 * Ports the Python playtest/strategy.py logic to TypeScript for AI bot opponents.
 */

import type {
  GameState,
  PlayerState,
  Card,
  Blueprint
} from '@upship/api';

// Import game data for slot type lookup
import type { TechTile } from '../data/upgrades';
const { UPGRADES } = require('../data/upgrades') as { UPGRADES: Record<string, TechTile> };
const { GROUND_BOARD_LOCATIONS } = require('../data/groundBoard');
// Import calculateBlueprintStats from launch.ts for ship stat calculations
const { calculateBlueprintStats } = require('../actions/launch');

// Types for bot decisions
export interface PlacementDecision {
  cardIndex: number;
  locationId: string;
  locationAction?: Record<string, unknown>;
}

export interface LaunchDecision {
  // shipId removed - ships are fungible tokens
  routeId: string;
  gasType: 'hydrogen' | 'helium';
}

// Blueprint changes for Blueprint Design action
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
  hangarShipCount: number;  // Changed from Ship[] to number - ships are now counters
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
function getUpgradeForTech(techId: string): { id: string; slotType: string; tile: TechTile } | null {
  // Search for the upgrade tile that requires this tech card
  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (upgrade.requiredCard === techId) {
      return {
        id: upgradeId,
        slotType: upgrade.slotType,
        tile: upgrade
      };
    }
  }
  return null;
}

/**
 * Get priority for a market card based on symbol usefulness
 * Lower number = higher priority
 */
function getMarketCardPriority(card: Card): number {
  const symbol = (card.symbol || '').toLowerCase();
  if (symbol === 'propeller' || symbol === 'operations') return 1; // Useful for launchpad
  if (symbol === 'wrench' || symbol === 'technical') return 2;     // Useful for construction, blueprint
  if (symbol === 'coin' || symbol === 'business') return 3;        // Useful for gas depot, insurance
  return 4; // Any/wild or unknown
}

/**
 * Calculate a utility score for a tech tile
 * Higher score = better tech. Accounts for stats and weight.
 */
function calculateTechScore(tile: TechTile): number {
  const stats = tile.stats || {};
  let score = 0;

  // Positive stats (each point adds to score)
  score += (stats.speed || 0) * 3;      // Speed is very valuable
  score += (stats.range || 0) * 3;      // Range is very valuable
  score += (stats.ceiling || 0) * 2;    // Ceiling is moderately valuable
  score += (stats.reliability || 0) * 2; // Reliability helps hazards
  score += (stats.income || 0) * 2;     // Income generates money
  score += (stats.luxury || 0) * 1;     // Luxury for passenger routes
  score += (stats.lift || 0) * 1;       // Direct lift is useful
  score += (stats.gas_socket || 0) * 5; // Gas socket = +5 lift each

  // Weight is negative (heavier = worse)
  score -= (tile.weight || 0) * 1;

  return score;
}

/**
 * Check if a new tech tile is superior to what's currently in the slot
 * Returns true if the new tech is better than existing, or slot is empty
 */
function isTechSuperiorToInstalled(
  newTile: TechTile,
  player: PlayerState
): boolean {
  const blueprint = player.blueprint;
  if (!blueprint) {
    console.log(`[SUPERIOR CHECK] No blueprint - accepting`);
    return true;
  }

  const slotType = newTile.slotType as keyof typeof blueprint;
  const installedTiles = blueprint[slotType] as (string | null)[] | undefined;

  console.log(`[SUPERIOR CHECK] Tile ${newTile.id} slotType=${slotType}, installedTiles=${JSON.stringify(installedTiles)}`);

  if (!installedTiles || installedTiles.length === 0) {
    console.log(`[SUPERIOR CHECK] Empty slots array - accepting`);
    return true;
  }

  // Calculate score for the new tile
  const newScore = calculateTechScore(newTile);
  console.log(`[SUPERIOR CHECK] New tile score: ${newScore}`);

  // Check all installed tiles in this slot type
  // If the new tile is better than ANY installed tile, it's worth acquiring
  // (Bot can potentially upgrade a slot later)
  for (const installedId of installedTiles) {
    if (!installedId) {
      console.log(`[SUPERIOR CHECK] Found null slot - accepting`);
      return true;
    }

    const installedTile = UPGRADES[installedId];
    if (!installedTile) {
      console.log(`[SUPERIOR CHECK] Installed ${installedId} not found in UPGRADES - skipping`);
      continue;
    }

    const installedScore = calculateTechScore(installedTile);
    console.log(`[SUPERIOR CHECK] Comparing: new=${newScore} vs installed ${installedId}=${installedScore}`);

    // If new tile is better than any installed tile, it's superior
    if (newScore > installedScore) {
      console.log(`[SUPERIOR CHECK] New tile is better - accepting`);
      return true;
    }
  }

  console.log(`[SUPERIOR CHECK] New tile not better than any installed - rejecting`);
  return false;
}

// calculateShipStats removed - ships are now fungible tokens
// Ship stats come from calculateBlueprintStats(player.blueprint, age) in launch.ts

/**
 * Determine the desired blueprint configuration for Blueprint Design action.
 * Returns the complete blueprint with all slots filled, or null if no changes needed.
 *
 * For age transitions, all empty frame/fabric slots MUST be filled.
 * For normal play, bot will fill empty slots opportunistically.
 */
export function getBlueprintDesignBlueprint(
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
 * NOTE: Ships are now counters (hangarShips: number), not an array of Ship objects.
 * Ship stats come from the player's current blueprint at launch time.
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
      hangarShipCount: 0,
      totalGas: 0,
      engineers: 0
    };
  }

  // Ships are now counters, not an array
  const hangarShipCount = player.hangarShips || 0;
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
  if (hangarShipCount === 0) {
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
      hangarShipCount,
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
      priorities.push('blueprint_design');
      slotsReady = false;
    }
    if (emptyFabric > 0) {
      missing.push(`${emptyFabric} empty Fabric slot(s)`);
      if (!priorities.includes('blueprint_design')) {
        priorities.push('blueprint_design');
      }
      slotsReady = false;
    }
  }

  // Check 3: Do we have enough officers?
  const officersNeeded = currentAge;
  if (officers < officersNeeded) {
    missing.push(`need ${officersNeeded - officers} more officer(s) for Age ${currentAge}`);
    priorities.push('flight_school');  // Build officer income
  }

  // Check 4: Do we have gas?
  if (totalGas < 1) {
    missing.push('need gas');
    priorities.push('gas_depot');
  }

  // Check 5: Do we have achievable routes?
  // Ship stats now come from blueprint, not from ship objects
  let hasAchievableTarget = false;
  const routes = (state.map?.routes || []).filter(r => !r.claimed);

  if (hangarShipCount > 0 && routes.length > 0 && player.blueprint) {
    // Calculate ship stats from blueprint (this is how launch.ts does it)
    const shipStats = calculateBlueprintStats(player.blueprint, currentAge);

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
      priorities.splice(1, 0, 'blueprint_design');
    }
  }

  // Check 6: Do we have engineers for hazard mitigation?
  if (engineers < 2) {
    missing.push(`low engineers (${engineers}/2 recommended)`);
    priorities.push('technical_institute');
  }

  const canLaunch = hangarShipCount > 0 && slotsReady &&
                    officers >= officersNeeded && totalGas >= 1 &&
                    hasAchievableTarget;

  return {
    canLaunch,
    hasAchievableTarget,
    missing,
    priorities,
    hangarShipCount,
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
  const hangarCount = launchEval.hangarShipCount;
  // Routes are now tracked by claimed routes on the map, not player.ships
  const claimedRouteCount = (state.map?.routes || []).filter(r => r.claimed === playerId).length;

  if (claimedRouteCount >= 2) {
    priorityLocations.push('research_institute');
    priorityLocations.push('flight_school');
    priorityLocations.push('technical_institute');
  }

  // Target research_level = age + 1 (max 3) for tech purchasing power
  const currentAge = state.age || 1;
  const researchLevel = player.researchLevel || 0;
  const targetResearchLevel = Math.min(currentAge + 1, 3);
  if (researchLevel < targetResearchLevel && cash >= 4) {
    priorityLocations.push('research_institute');
  }

  // Only build ships if we have room (max 3 in hangar)
  if (hangarCount < 2 && cash >= 5) {
    priorityLocations.push('construction_hall');
  }

  // Collect cash from income track if running low
  if (cash < 10) {
    priorityLocations.push('treasury');
  }

  if (totalGas < 3) {
    priorityLocations.push('gas_depot');
  }

  if (officers < 2 && cash >= 5) {
    priorityLocations.push('flight_school');  // Build officer income
  }

  if (hangarCount > 0 || claimedRouteCount > 0) {
    priorityLocations.push('insurance_bureau');
  }

  // Phase 3: Fallback priorities
  const fallbackPriorities = [
    'blueprint_design', 'research_institute', 'construction_hall',
    'gas_depot', 'technical_institute', 'ministry',
    'flight_school', 'weather_bureau', 'government_liaison',
    'insurance_bureau', 'launchpad', 'launchpad_2',
    'personnel_office', 'engineering_depot', 'treasury'
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

    case 'blueprint_design': {
      const blueprint = getBlueprintDesignBlueprint(player, state.age || 1);
      return blueprint ? { blueprint } : undefined;
    }

    case 'gas_depot': {
      // USA uses helium, others use hydrogen
      const gasType = player.faction === 'usa' ? 'helium' : 'hydrogen';
      return { gasType, gasAmount: 3 };
    }

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
 * NOTE: Ships are now fungible tokens. Stats come from blueprint.
 */
export function findLaunchDecision(
  state: GameState,
  playerId: string
): LaunchDecision | null {
  const player = state.players[playerId];
  if (!player) return null;

  // Ships are counters now
  const hangarShipCount = player.hangarShips || 0;
  if (hangarShipCount === 0) return null;

  const routes = (state.map?.routes || []).filter(r => !r.claimed);
  if (routes.length === 0) return null;

  // Ship stats come from blueprint
  if (!player.blueprint) return null;
  const shipStats = calculateBlueprintStats(player.blueprint, state.age || 1);

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
    routeId: achievableRoutes[0].id,
    gasType
  };
}

/**
 * Get reveal phase acquisitions (tech priorities and market cards)
 * Only acquires techs that are superior to what's already installed
 * Returns all market cards sorted by priority - executor tries each in order
 */
export function getRevealAcquisitions(
  state: GameState,
  playerId: string
): RevealDecision {
  const player = state.players[playerId];
  const techIds: string[] = [];
  const cardIds: string[] = [];

  if (!player) return { techIds, cardIds };

  // ============ TECH ACQUISITIONS ============
  const rdBoard = state.rdBoard || [];
  const ownedTechs = new Set(player.techCards || []);

  console.log(`[BOT REVEAL] Player ${player.faction}: rdBoard has ${rdBoard.length} cards, owns ${ownedTechs.size} techs`);

  // Filter to available techs not already owned
  const availableTechs = rdBoard.filter(t => !ownedTechs.has(t.id));
  console.log(`[BOT REVEAL] Available (not owned): ${availableTechs.length} techs: ${availableTechs.map(t => t.id).join(', ')}`);

  if (availableTechs.length > 0) {
    // Calculate tech value: direct card benefits (VP, income) + upgrade tile score
    const techsWithValue = availableTechs.map(techCard => {
      const cardVp = (techCard as { vp?: number }).vp || 0;
      const cardIncome = (techCard as { income?: number }).income || 0;
      const upgradeInfo = getUpgradeForTech(techCard.id);
      const upgradeScore = upgradeInfo ? calculateTechScore(upgradeInfo.tile) : 0;
      // VP worth ~3 points, income worth ~2 points, upgrade score as-is
      const totalValue = cardVp * 3 + cardIncome * 2 + upgradeScore;
      return { tech: techCard, value: totalValue };
    });

    // Sort by value (highest first)
    techsWithValue.sort((a, b) => b.value - a.value);

    // Calculate available research: saved research + engineers (matches technology.ts logic)
    const savedResearch = (player as PlayerState & { research?: number }).research || 0;
    const engineers = player.engineers || 0;
    let availableResearch = savedResearch + engineers;

    console.log(`[BOT REVEAL] Available research: ${availableResearch} (saved=${savedResearch}, engineers=${engineers})`);

    // Buy techs by value until out of research
    for (const { tech, value } of techsWithValue) {
      const cost = (tech as { cost?: number }).cost || 0;
      console.log(`[BOT REVEAL] Considering ${tech.id}: cost=${cost}, value=${value}, affordable=${cost <= availableResearch}`);
      if (cost <= availableResearch) {
        techIds.push(tech.id);
        availableResearch -= cost;
        console.log(`[BOT REVEAL] → BUYING ${tech.id}, remaining research=${availableResearch}`);
        if (availableResearch <= 0) break;
      }
    }
  }

  // ============ MARKET CARD PURCHASES ============
  // Return ALL market cards sorted by priority - executor tries each in order
  // and stops when influence runs out or all cards attempted
  const marketCards = state.marketCards || [];

  // Include reserve card (always available) as lowest priority fallback
  const allCards = [...marketCards];
  if (state.reserveCard) {
    allCards.push(state.reserveCard);
  }

  if (allCards.length > 0) {
    // Sort by priority (lower = better), then by cost (cheaper first)
    // Reserve card gets priority 5 (lowest) since it's a fallback
    const sortedCards = allCards.sort((a, b) => {
      const isReserveA = a.id === 'reserve_aeronaut';
      const isReserveB = b.id === 'reserve_aeronaut';
      const priorityA = isReserveA ? 5 : getMarketCardPriority(a);
      const priorityB = isReserveB ? 5 : getMarketCardPriority(b);
      const priorityDiff = priorityA - priorityB;
      if (priorityDiff !== 0) return priorityDiff;
      const costA = (a as { cost?: number }).cost || 3;
      const costB = (b as { cost?: number }).cost || 3;
      return costA - costB;
    });

    // Return all card IDs - executor will try them in order
    for (const card of sortedCards) {
      cardIds.push(card.id);
    }
  }

  return { techIds, cardIds };
}

/**
 * Decide whether to spend engineers on hazard response
 * NOTE: Hazard info is now in player.pendingLaunch.hazardInfo, not ship.pendingHazard
 */
export function getHazardResponse(
  state: GameState,
  playerId: string
): { spendEngineers: boolean } {
  const player = state.players[playerId];
  if (!player) return { spendEngineers: false };

  // Hazard info is now in pendingLaunch
  const pendingLaunch = player.pendingLaunch as { hazardInfo?: { engineersNeeded?: number } } | undefined;
  if (!pendingLaunch?.hazardInfo) return { spendEngineers: false };

  const hazardInfo = pendingLaunch.hazardInfo;
  const engineers = player.engineers || 0;
  const engineersNeeded = hazardInfo.engineersNeeded || 0;

  // Spend engineers if we have enough
  return { spendEngineers: engineers >= engineersNeeded };
}

// CommonJS compatibility
module.exports = {
  findStrategicPlacement,
  evaluateLaunchReadiness,
  getBlueprintDesignBlueprint,
  findLaunchDecision,
  getRevealAcquisitions,
  getHazardResponse
  // calculateShipStats removed - use calculateBlueprintStats from launch.ts
};
