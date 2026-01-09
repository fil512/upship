/**
 * Bot Strategy Service
 * Ports the Python playtest/strategy.py logic to TypeScript for AI bot opponents.
 *
 * SYNC: Keep in sync with playtest/strategy.py and playtest/phases.py
 * Run `/bot-logic` command to analyze sync status between server and playtest bots.
 */

import type {
  GameState,
  PlayerState,
  Card
} from '@upship/api';

// Import game data for slot type lookup
import type { TechTile } from '../data/upgrades';
import type { CombatMission } from '../data/combatMissions';
const { UPGRADES } = require('../data/upgrades') as { UPGRADES: Record<string, TechTile> };
const { GROUND_BOARD_LOCATIONS } = require('../data/groundBoard');
// Import calculateBlueprintStats from launch.ts for ship stat calculations
const { calculateBlueprintStats } = require('../actions/launch');
// Import calculateHullCost for retrofit cost calculations
const { calculateHullCost } = require('../actions/blueprint');

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

export interface CombatMissionDecision {
  missionId: string;
  gasType: 'hydrogen' | 'helium';
}

export interface MissionReadinessResult {
  mission: CombatMission;
  canAttempt: boolean;
  failures: string[];
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
 * Get ALL upgrade tiles for a technology ID
 * Tech card IDs (e.g., 'daimler_engine') can map to MULTIPLE upgrade tiles
 * (e.g., 'basic_engine' AND 'daimler_drive') via the 'requiredCard' field
 */
function getUpgradesForTech(techId: string): Array<{ id: string; slotType: string; tile: TechTile }> {
  const results: Array<{ id: string; slotType: string; tile: TechTile }> = [];
  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (upgrade.requiredCard === techId) {
      results.push({
        id: upgradeId,
        slotType: upgrade.slotType,
        tile: upgrade
      });
    }
  }
  return results;
}

/**
 * Get first upgrade info for a technology ID (legacy compatibility)
 * @deprecated Use getUpgradesForTech for complete results
 */
function getUpgradeForTech(techId: string): { id: string; slotType: string; tile: TechTile } | null {
  const upgrades = getUpgradesForTech(techId);
  return upgrades.length > 0 ? upgrades[0] : null;
}

/**
 * Get priority for a market card based on symbol usefulness
 * Lower number = higher priority
 * [BOT-CARD-PRIORITY-01] SYNC: Keep in sync with get_card_priority() in playtest/strategy.py
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
 * [BOT-TECH-SCORE-01] SYNC: Keep in sync with get_tech_priority() in playtest/strategy.py
 */
// [BOT-TECH-SCORE-01] Calculate tech tile score for prioritization
// Note: VP bonus is handled separately at the TechCard level in getRevealAcquisitions()
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
 * Calculate a weighted stat score for tile comparison, with configurable priority stats.
 * Used for blueprint tile replacement decisions.
 * [BOT-BLUEPRINT-01] SYNC: Keep in sync with _calculate_stat_score() in playtest/strategy.py
 *
 * @param stats - Tile stats object
 * @param priorityStats - Stats to prioritize with 10x weight (default: range, ceiling for Age 2 missions)
 * @returns Weighted score (higher = better)
 */
function calculateStatScore(
  stats: Record<string, number>,
  priorityStats: string[] = ['range', 'ceiling']
): number {
  // Priority stats get 10x weight each
  let priorityValue = 0;
  for (const stat of priorityStats) {
    priorityValue += (stats[stat] || 0) * 10;
  }

  // Secondary stats get normal weight
  let secondaryValue = 0;
  for (const [key, value] of Object.entries(stats)) {
    if (!priorityStats.includes(key) && typeof value === 'number') {
      secondaryValue += value;
    }
  }

  return priorityValue + secondaryValue;
}

/**
 * Get stats from a tile for comparison purposes.
 * [BOT-BLUEPRINT-01] SYNC: Keep in sync with _get_tile_stats() in playtest/strategy.py
 */
function getTileStats(tileId: string | null): Record<string, number> {
  if (!tileId) {
    return { range: 0, speed: 0, ceiling: 0, reliability: 0, luxury: 0, income: 0 };
  }
  const tile = UPGRADES[tileId] as TechTile | undefined;
  if (!tile) {
    return { range: 0, speed: 0, ceiling: 0, reliability: 0, luxury: 0, income: 0 };
  }
  const stats = tile.stats || {};
  return {
    range: stats.range || 0,
    speed: stats.speed || 0,
    ceiling: stats.ceiling || 0,
    reliability: stats.reliability || 0,
    luxury: stats.luxury || 0,
    income: stats.income || 0,
  };
}

/**
 * Check if a new tech tile is superior to what's currently in the slot
 * Returns true if the new tech is better than existing, or slot is empty
 */
function _isTechSuperiorToInstalled(
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
 * Calculate expected engineers needed for a safe launch.
 * Uses the hazard check formula (Section 8.2):
 *   Net Difficulty = Hazard Difficulty + Route/Mission Difficulty - Ship Reliability (min 0)
 *   Ship Stat + Engineers >= Net Difficulty to pass
 *
 * [BOT-LAUNCH-READY-01] SYNC: Keep in sync with calculate_expected_engineers_for_launch() in playtest/strategy.py
 *
 * @param shipReliability - Ship's reliability stat
 * @param currentAge - Current game age (1, 2, or 3)
 * @param missions - List of combat missions (for Age II)
 * @returns Object with engineersNeeded and reason string
 */
function calculateExpectedEngineersForLaunch(
  shipReliability: number,
  currentAge: number,
  missions?: CombatMission[]
): { engineersNeeded: number; reason: string } {
  // Average hazard difficulty in the deck is about 3-4
  // Using 4 as a conservative estimate for safety
  const AVG_HAZARD_DIFFICULTY = 4;

  // Mission/route difficulty
  // Age I/III routes have difficulty 0
  // Age II missions have difficulty 2-3
  let missionDifficulty = 0;
  if (currentAge === 2 && missions && missions.length > 0) {
    // Find the lowest difficulty mission that's achievable (prefer easier ones)
    const difficulties = missions.map(m => (m as { difficulty?: number }).difficulty || 0);
    missionDifficulty = Math.min(...difficulties);
  }

  // Net difficulty formula: Hazard + Mission - Reliability (min 0)
  const netDifficulty = Math.max(0, AVG_HAZARD_DIFFICULTY + missionDifficulty - shipReliability);

  // Engineers needed to pass: max(0, net_difficulty - avg_ship_stat)
  // Assuming average ship stat of 2-3, we need net_difficulty - 2 engineers
  const AVG_SHIP_STAT = 2;
  const engineersNeeded = Math.max(0, netDifficulty - AVG_SHIP_STAT);

  // Build explanation
  let reason: string;
  if (currentAge === 2) {
    reason = `hazard(~${AVG_HAZARD_DIFFICULTY}) + mission(${missionDifficulty}) ` +
             `- reliability(${shipReliability}) = net(${netDifficulty}), ` +
             `need ~${engineersNeeded} engineers`;
  } else {
    reason = `hazard(~${AVG_HAZARD_DIFFICULTY}) - reliability(${shipReliability}) ` +
             `= net(${netDifficulty}), need ~${engineersNeeded} engineers`;
  }

  return { engineersNeeded, reason };
}

/**
 * Get hull cost of a single tech tile
 */
function getTileHullCost(tileId: string | null): number {
  if (!tileId) return 0;
  const tile = UPGRADES[tileId] as TechTile | undefined;
  return tile?.hullCost || 0;
}

/**
 * Determine the desired blueprint configuration for Blueprint Design action.
 * Returns the complete blueprint with all slots filled, or null if no changes needed.
 *
 * For age transitions, all empty frame/fabric slots MUST be filled (retrofit is free).
 * For normal play, bot will fill empty slots opportunistically, considering retrofit costs.
 * [BOT-BLUEPRINT-01] SYNC: Keep in sync with get_blueprint_design_blueprint() in playtest/strategy.py
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

  // Track ALL installed tiles across all slot types (no duplicates per Section 4.2)
  const installedTiles = new Set<string>();
  for (const s of newBlueprint.frameSlots!) {
    if (s !== null) installedTiles.add(s);
  }
  for (const s of newBlueprint.fabricSlots!) {
    if (s !== null) installedTiles.add(s);
  }
  for (const s of newBlueprint.driveSlots!) {
    if (s !== null) installedTiles.add(s);
  }
  for (const s of newBlueprint.componentSlots!) {
    if (s !== null) installedTiles.add(s);
  }

  // Collect available upgrades from technologies (excluding already installed)
  // Note: A single tech card can enable MULTIPLE upgrade tiles (e.g., daimler_engine -> basic_engine OR daimler_drive)
  const frameUpgrades: string[] = [];
  const fabricUpgrades: string[] = [];
  const driveUpgrades: string[] = [];

  for (const techId of technologies) {
    // Get ALL upgrades this tech card can install (not just the first one)
    const allUpgrades = getUpgradesForTech(techId);
    for (const upgradeInfo of allUpgrades) {
      // Only include if not already installed anywhere in blueprint
      if (!installedTiles.has(upgradeInfo.id)) {
        const slotType = upgradeInfo.slotType;
        if (slotType === 'frameSlots') {
          frameUpgrades.push(upgradeInfo.id);
        } else if (slotType === 'fabricSlots') {
          fabricUpgrades.push(upgradeInfo.id);
        } else if (slotType === 'driveSlots') {
          driveUpgrades.push(upgradeInfo.id);
        }
      }
    }
  }

  // Track changes made
  let changesMade = false;

  // Calculate retrofit cost constraints (only for normal play, not age transition)
  // Retrofit cost = (new hull cost - old hull cost) × (hangarShips + repairShips)
  const shipsToRetrofit = (player.hangarShips || 0) + (player.repairShips || 0);
  const playerCash = player.cash || 0;
  const oldHullCost = calculateHullCost(blueprint);
  let currentHullCost = oldHullCost; // Track cumulative hull cost as we add tiles

  // Sort upgrades by hull cost (prefer cheaper tiles first to maximize what we can afford)
  const sortByHullCost = (a: string, b: string) => getTileHullCost(a) - getTileHullCost(b);
  frameUpgrades.sort(sortByHullCost);
  fabricUpgrades.sort(sortByHullCost);
  driveUpgrades.sort(sortByHullCost);

  // Helper to check if we can afford to add a tile
  const canAffordTile = (tileId: string): boolean => {
    if (isAgeTransition) return true; // Free during age transition
    if (shipsToRetrofit === 0) return true; // No retrofit cost if no ships

    const tileHullCost = getTileHullCost(tileId);
    const newTotalHullCost = currentHullCost + tileHullCost;
    const retrofitCost = Math.max(0, newTotalHullCost - oldHullCost) * shipsToRetrofit;
    return playerCash >= retrofitCost;
  };

  // Helper to add a tile and update cost tracking
  const addTile = (tileId: string) => {
    const tileHullCost = getTileHullCost(tileId);
    currentHullCost += tileHullCost;
    installedTiles.add(tileId);
    changesMade = true;
  };

  // Fill empty frame slots (no duplicates - each tile can only be used once)
  for (const idx of emptyFrameIndices) {
    // Find first affordable upgrade not yet installed
    const affordableUpgrade = frameUpgrades.find(id => !installedTiles.has(id) && canAffordTile(id));
    if (affordableUpgrade) {
      newBlueprint.frameSlots![idx] = affordableUpgrade;
      addTile(affordableUpgrade);
    }
  }

  // Fill empty fabric slots (no duplicates - each tile can only be used once)
  for (const idx of emptyFabricIndices) {
    const affordableUpgrade = fabricUpgrades.find(id => !installedTiles.has(id) && canAffordTile(id));
    if (affordableUpgrade) {
      newBlueprint.fabricSlots![idx] = affordableUpgrade;
      addTile(affordableUpgrade);
    }
  }

  // Fill empty drive slots (no duplicates)
  for (const idx of emptyDriveIndices) {
    const affordableUpgrade = driveUpgrades.find(id => !installedTiles.has(id) && canAffordTile(id));
    if (affordableUpgrade) {
      newBlueprint.driveSlots![idx] = affordableUpgrade;
      addTile(affordableUpgrade);
    }
  }

  // === REPLACEMENT LOGIC ===
  // [BOT-BLUEPRINT-01] SYNC: Keep in sync with replacement logic in playtest/strategy.py
  // Consider replacing existing tiles with better ones (especially for Range in Age 2)
  // Only do this if not during age transition (free retrofits make this moot)
  // and if we have cash to afford potential retrofit costs

  // Find filled slot indices
  const filledFrameIndices = newBlueprint.frameSlots!
    .map((s, i) => s !== null ? i : -1)
    .filter(i => i !== -1);
  const filledFabricIndices = newBlueprint.fabricSlots!
    .map((s, i) => s !== null ? i : -1)
    .filter(i => i !== -1);
  const filledDriveIndices = newBlueprint.driveSlots!
    .map((s, i) => s !== null ? i : -1)
    .filter(i => i !== -1);

  // Determine priority stats based on age
  // Age 2+ missions require BOTH range AND ceiling, so prioritize both
  const priorityStats = _currentAge >= 2 ? ['range', 'ceiling'] : ['speed', 'range'];

  // Helper to check if we can afford to replace a tile
  const canAffordReplacement = (oldTileId: string, newTileId: string): boolean => {
    if (isAgeTransition) return true; // Free during age transition
    if (shipsToRetrofit === 0) return true; // No retrofit cost if no ships

    const oldHull = getTileHullCost(oldTileId);
    const newHull = getTileHullCost(newTileId);
    const hullDelta = newHull - oldHull;
    if (hullDelta <= 0) return true; // Cheaper or same cost, always affordable

    const retrofitCost = hullDelta * shipsToRetrofit;
    return playerCash >= retrofitCost;
  };

  // Helper to find best replacement for a current tile
  const findBestReplacement = (
    currentTileId: string,
    availableUpgrades: string[]
  ): string | null => {
    if (!currentTileId) return null;

    const currentStats = getTileStats(currentTileId);
    const currentScore = calculateStatScore(currentStats, priorityStats);

    let bestReplacement: string | null = null;
    let bestScore = currentScore;

    for (const upgradeId of availableUpgrades) {
      if (installedTiles.has(upgradeId)) continue; // Can't use a tile that's already installed elsewhere
      if (!canAffordReplacement(currentTileId, upgradeId)) continue; // Can't afford the retrofit

      const upgradeStats = getTileStats(upgradeId);
      const upgradeScore = calculateStatScore(upgradeStats, priorityStats);

      // Only replace if the new tile is significantly better (score > current + 5)
      // This prevents unnecessary churn for marginal improvements
      if (upgradeScore > bestScore + 5) {
        bestReplacement = upgradeId;
        bestScore = upgradeScore;
      }
    }

    return bestReplacement;
  };

  // Helper to execute a tile replacement
  const doReplacement = (
    slotKey: 'frameSlots' | 'fabricSlots' | 'driveSlots',
    idx: number,
    oldTileId: string,
    newTileId: string
  ): void => {
    const oldHull = getTileHullCost(oldTileId);
    const newHull = getTileHullCost(newTileId);
    currentHullCost = currentHullCost - oldHull + newHull;
    installedTiles.delete(oldTileId);
    installedTiles.add(newTileId);
    newBlueprint[slotKey]![idx] = newTileId;
    changesMade = true;
  };

  // Try to replace drive tiles first (most important for Range/Speed stats)
  for (const idx of filledDriveIndices) {
    const currentTile = newBlueprint.driveSlots![idx];
    if (!currentTile) continue;
    const replacement = findBestReplacement(currentTile, driveUpgrades);
    if (replacement) {
      doReplacement('driveSlots', idx, currentTile, replacement);
    }
  }

  // Also consider replacing frame tiles if they provide stats
  for (const idx of filledFrameIndices) {
    const currentTile = newBlueprint.frameSlots![idx];
    if (!currentTile) continue;
    const replacement = findBestReplacement(currentTile, frameUpgrades);
    if (replacement) {
      doReplacement('frameSlots', idx, currentTile, replacement);
    }
  }

  // Also consider replacing fabric tiles if they provide stats
  for (const idx of filledFabricIndices) {
    const currentTile = newBlueprint.fabricSlots![idx];
    if (!currentTile) continue;
    const replacement = findBestReplacement(currentTile, fabricUpgrades);
    if (replacement) {
      doReplacement('fabricSlots', idx, currentTile, replacement);
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
 * [BOT-LAUNCH-READY-01] SYNC: Keep in sync with evaluate_launch_readiness() in playtest/strategy.py
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

  // Check 2: Do we have minimum required components? (at least one Frame, one Fabric, one Drive)
  let slotsReady = true;
  if (player.blueprint) {
    const frameSlots = player.blueprint.frameSlots || [];
    const fabricSlots = player.blueprint.fabricSlots || [];
    const driveSlots = player.blueprint.driveSlots || [];

    const hasFrame = frameSlots.some(s => s !== null);
    const hasFabric = fabricSlots.some(s => s !== null);
    const hasDrive = driveSlots.some(s => s !== null);

    if (!hasFrame) {
      missing.push('need at least one Frame tile');
      priorities.push('blueprint_design');
      slotsReady = false;
    }
    if (!hasFabric) {
      missing.push('need at least one Fabric tile');
      if (!priorities.includes('blueprint_design')) {
        priorities.push('blueprint_design');
      }
      slotsReady = false;
    }
    if (!hasDrive) {
      missing.push('need at least one Drive tile');
      if (!priorities.includes('blueprint_design')) {
        priorities.push('blueprint_design');
      }
      slotsReady = false;
    }
  }

  // Check 3: Do we have enough officers?
  // [BOT-LAUNCH-READY-01] SYNC: Match playtest - personnel_office first (collect), then flight_school (build)
  const officersNeeded = currentAge;
  if (officers < officersNeeded) {
    missing.push(`need ${officersNeeded - officers} more officer(s) for Age ${currentAge}`);
    priorities.push('personnel_office');  // Collect officers from income track
    priorities.push('flight_school');     // Build officer income
  }

  // Check 4: Do we have gas?
  if (totalGas < 1) {
    missing.push('need gas');
    priorities.push('gas_depot');
  }

  // Check 5: Do we have minimum Range and Speed? (must be >= 1 to launch)
  // Ship stats now come from blueprint, not from ship objects
  let statsReady = true;
  let hasAchievableTarget = false;
  const routes = (state.map?.routes || []).filter(r => !r.claimed);

  if (player.blueprint) {
    // Calculate ship stats from blueprint (this is how launch.ts does it)
    const shipStats = calculateBlueprintStats(player.blueprint, currentAge);

    // Check minimum stats required to launch (Range >= 1 and Speed >= 1)
    if (shipStats.range < 1) {
      missing.push('need Range >= 1 (install Drive tiles)');
      if (!priorities.includes('blueprint_design')) {
        priorities.push('blueprint_design');
      }
      priorities.push('research_institute');
      statsReady = false;
    }
    if (shipStats.speed < 1) {
      missing.push('need Speed >= 1 (install Drive tiles)');
      if (!priorities.includes('blueprint_design')) {
        priorities.push('blueprint_design');
      }
      if (!priorities.includes('research_institute')) {
        priorities.push('research_institute');
      }
      statsReady = false;
    }

    // Check 6: Do we have achievable routes/missions?
    // Get missions for Age II
    const missions = currentAge === 2
      ? (state as { missionRow?: CombatMission[] }).missionRow || []
      : [];

    if (hangarShipCount > 0 && statsReady) {
      if (currentAge === 2 && missions.length > 0) {
        // Age II: Check combat missions (only range, speed, ceiling are prerequisites)
        for (const mission of missions) {
          if (shipStats.range >= mission.range &&
              shipStats.speed >= (mission.speed || 0) &&
              shipStats.ceiling >= (mission.ceiling || 0)) {
            hasAchievableTarget = true;
            break;
          }
        }
        if (!hasAchievableTarget) {
          missing.push(`no achievable missions (range=${shipStats.range}, speed=${shipStats.speed}, ceil=${shipStats.ceiling})`);
          priorities.unshift('research_institute');
          priorities.splice(1, 0, 'blueprint_design');
        }
      } else if (routes.length > 0) {
        // Age I/III: Check routes
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
    }

    // Check 7: Do we have engineers for hazard mitigation?
    // [BOT-LAUNCH-READY-01] SYNC: Use dynamic calculation based on ship reliability and mission difficulty
    // Uses the hazard formula (Section 8.2):
    //   Net Difficulty = Hazard Difficulty + Route/Mission Difficulty - Ship Reliability (min 0)
    //   Ship Stat + Engineers >= Net Difficulty to pass
    const shipReliability = shipStats.reliability || 0;
    const { engineersNeeded: minEngineersForSafeLaunch, reason: engineerReason } =
      calculateExpectedEngineersForLaunch(shipReliability, currentAge, missions);

    if (engineers < minEngineersForSafeLaunch) {
      missing.push(`need ${minEngineersForSafeLaunch - engineers} more engineer(s) (${engineerReason})`);
      priorities.push('engineering_depot');   // Collect engineers from income track
      priorities.push('technical_institute'); // Build engineer income
    }

    const canLaunch = hangarShipCount > 0 && slotsReady && statsReady &&
                      officers >= officersNeeded && totalGas >= 1 &&
                      hasAchievableTarget && engineers >= minEngineersForSafeLaunch;

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

  // Fallback if no blueprint - use default engineer requirement
  const minEngineersForSafeLaunch = 2;
  if (engineers < minEngineersForSafeLaunch) {
    missing.push(`need ${minEngineersForSafeLaunch - engineers} more engineer(s) for safe launch`);
    priorities.push('engineering_depot');
    priorities.push('technical_institute');
  }

  const canLaunch = hangarShipCount > 0 && slotsReady &&
                    officers >= officersNeeded && totalGas >= 1 &&
                    engineers >= minEngineersForSafeLaunch;

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
 * [BOT-PLACEMENT-01] SYNC: Keep in sync with find_strategic_placement() in playtest/strategy.py
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

  // [BOT-PLACEMENT-01] SYNC: VP-MAXIMIZING STRATEGY from playtest
  // Phase 1: LAUNCH if ready - this is how you score VP!
  // There are TWO launchpad spaces - try both!
  if (launchEval.canLaunch) {
    priorityLocations.push('launchpad');
    priorityLocations.push('launchpad_2');  // Second launchpad space
  }

  // Add priorities from launch evaluation (fixes for missing requirements)
  priorityLocations.push(...launchEval.priorities);

  // [BOT-PLACEMENT-01] SYNC: VP-MAXIMIZING STRATEGY from playtest
  // Phase 2: Fix launch blockers in order of importance
  const cash = player.cash || 0;
  const totalGas = launchEval.totalGas;
  const officers = player.officers || 0;
  const engineers = launchEval.engineers;
  const hangarCount = launchEval.hangarShipCount;
  const currentAge = state.age || 1;
  const researchLevel = player.researchLevel || 0;
  // Routes are now tracked by claimed routes on the map, not player.ships
  const claimedRouteCount = (state.map?.routes || []).filter(r => r.claimed === playerId).length;

  // Officers are needed per Age (1/2/3) - critical blocker
  const officersNeeded = currentAge;
  if (officers < officersNeeded) {
    if (!priorityLocations.includes('personnel_office')) {
      priorityLocations.push('personnel_office');  // Collect officers from track
    }
  }

  // Need a ship to launch
  if (hangarCount === 0) {
    if (cash >= 5) {
      priorityLocations.push('construction_hall');
    } else {
      priorityLocations.push('treasury');  // Get cash first
      priorityLocations.push('construction_hall');
    }
  }

  // REPAIR: If we have damaged ships, repair them to get ships back in hangar
  // Repair cost per ship: floor(Hull Cost / 2) + 1 Engineer
  const repairShipCount = player.repairShips || 0;
  if (repairShipCount > 0) {
    const hullCost = calculateHullCost(player);
    const repairCashCost = Math.floor(hullCost / 2);
    // Can we afford at least one repair?
    if (cash >= repairCashCost && engineers >= 1) {
      priorityLocations.push('repair');
    } else if (engineers < 1) {
      // Need engineers first to repair
      priorityLocations.push('engineering_depot');
    } else {
      // Need cash first to repair
      priorityLocations.push('treasury');
    }
  }

  // Need gas to launch
  if (totalGas < 1) {
    priorityLocations.push('gas_depot');
  }

  // Need blueprint slots filled - but only if we can actually install something
  // getBlueprintDesignBlueprint returns null if tech cards don't map to installable tiles
  if (player.blueprint) {
    const blueprintChanges = getBlueprintDesignBlueprint(player, state.age || 1);
    if (blueprintChanges !== null) {
      priorityLocations.push('blueprint_design');
    }
  }

  // Phase 3: Build up for NEXT launch (secondary)
  // Build more ships if we have cash and hangar is low
  if (hangarCount < 2 && cash >= 5) {
    priorityLocations.push('construction_hall');
  }

  // Stock up on gas for next launch
  if (totalGas < 2) {
    priorityLocations.push('gas_depot');
  }

  // Get engineers for hazard mitigation (2 is a good safety buffer)
  if (engineers < 2) {
    priorityLocations.push('engineering_depot');  // Collect from track
  }

  // Phase 4: Income investments ONLY if we have excess actions
  // These are low priority - VP comes from routes, not income tracks

  // Research level helps buy techs (which may give VP)
  // But only invest if we're otherwise blocked
  if (researchLevel < 2 && cash >= 4 && hangarCount >= 1 && totalGas >= 1) {
    priorityLocations.push('research_institute');
  }

  // Officer income only if we keep running out
  if (officers < officersNeeded && cash >= 4) {
    priorityLocations.push('flight_school');
  }

  // Engineer income only if we keep running out
  if (engineers < 1 && cash >= 4) {
    priorityLocations.push('technical_institute');
  }

  // Phase 5: Insurance only if we have ships at risk
  if (claimedRouteCount > 0) {
    priorityLocations.push('insurance_bureau');
  }

  // Phase 6: Treasury to collect income if low on cash
  if (cash < 5) {
    priorityLocations.push('treasury');
  }

  // Phase 7: Fallback priorities (match playtest order)
  // Note: launchpad at END - only use if no better option (wasteful without resources)
  const fallbackPriorities = [
    'construction_hall', 'gas_depot', 'blueprint_design', 'repair',
    'personnel_office', 'engineering_depot', 'treasury',
    'ministry', 'weather_bureau', 'research_institute',
    'technical_institute', 'flight_school', 'government_liaison',
    'insurance_bureau', 'launchpad', 'launchpad_2'
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
 * [BOT-LOC-ACTION-01] SYNC: Keep in sync with _execute_placement() kwargs in playtest/phases.py
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

    case 'repair': {
      // Repair as many ships as we can afford
      // Cost per ship: floor(Hull Cost / 2) + 1 Engineer
      const repairShipCount = player.repairShips || 0;
      if (repairShipCount === 0) return undefined;

      const hullCost = calculateHullCost(player);
      const cashCostPerShip = Math.floor(hullCost / 2);
      const cash = player.cash || 0;
      const engineers = player.engineers || 0;

      // Calculate how many we can afford
      const affordableByCash = cashCostPerShip > 0 ? Math.floor(cash / cashCostPerShip) : repairShipCount;
      const affordableByEngineers = engineers;
      const canRepair = Math.min(repairShipCount, affordableByCash, affordableByEngineers);

      return canRepair > 0 ? { repairCount: canRepair } : undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Find best launch decision for a ship
 * NOTE: Ships are now fungible tokens. Stats come from blueprint.
 * [BOT-LAUNCH-01] SYNC: Keep in sync with _attempt_route_launches() in playtest/phases.py
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
 * Evaluate which combat missions a ship can attempt
 * [BOT-COMBAT-01] SYNC: Keep in sync with evaluate_combat_mission_readiness() in playtest/strategy.py
 *
 * @param missions - Available combat missions
 * @param shipStats - Ship's calculated stats (range, speed, ceiling, reliability)
 * @returns Array of mission evaluations sorted by value (achievable first, then by VP)
 */
export function evaluateCombatMissionReadiness(
  missions: CombatMission[],
  shipStats: { range: number; speed: number; ceiling: number; reliability: number }
): MissionReadinessResult[] {
  const results: MissionReadinessResult[] = [];

  for (const mission of missions) {
    const failures: string[] = [];

    // Check stat requirements (only range, speed, ceiling are prerequisites)
    // Note: mission.difficulty is NOT a prerequisite - it modifies hazard checks
    if (mission.range > 0 && shipStats.range < mission.range) {
      failures.push(`Range ${shipStats.range} < required ${mission.range}`);
    }
    if ((mission.speed || 0) > 0 && shipStats.speed < (mission.speed || 0)) {
      failures.push(`Speed ${shipStats.speed} < required ${mission.speed}`);
    }
    if ((mission.ceiling || 0) > 0 && shipStats.ceiling < (mission.ceiling || 0)) {
      failures.push(`Ceiling ${shipStats.ceiling} < required ${mission.ceiling}`);
    }

    results.push({
      mission,
      canAttempt: failures.length === 0,
      failures
    });
  }

  // Sort: achievable first, then by VP (highest), then by income (highest)
  results.sort((a, b) => {
    if (a.canAttempt !== b.canAttempt) {
      return a.canAttempt ? -1 : 1;
    }
    if (a.mission.vp !== b.mission.vp) {
      return b.mission.vp - a.mission.vp;
    }
    return b.mission.income - a.mission.income;
  });

  return results;
}

/**
 * Find best combat mission for a player's ships (Age II)
 * [BOT-COMBAT-02] SYNC: Keep in sync with find_best_combat_mission() in playtest/strategy.py
 *
 * @param state - Current game state
 * @param playerId - Player ID
 * @returns Best mission decision or null if none achievable
 */
export function findBestCombatMission(
  state: GameState,
  playerId: string
): CombatMissionDecision | null {
  const player = state.players[playerId];
  if (!player) return null;

  // Only valid in Age II
  if ((state.age || 1) !== 2) return null;

  // Ships are counters now
  const hangarShipCount = player.hangarShips || 0;
  if (hangarShipCount === 0) return null;

  // Get available missions from missionRow
  const missionRow = (state as { missionRow?: CombatMission[] }).missionRow || [];
  if (missionRow.length === 0) return null;

  // Ship stats come from blueprint
  if (!player.blueprint) return null;
  const shipStats = calculateBlueprintStats(player.blueprint, state.age || 1);

  // USA faction restriction: cannot be the first to complete a mission
  if (player.faction === 'usa') {
    const anyOtherHasMission = Object.entries(state.players).some(([pid, p]) => {
      if (pid === playerId) return false; // Skip self
      const completed = (p as { completedMissions?: unknown[] }).completedMissions || [];
      return completed.length > 0;
    });
    if (!anyOtherHasMission) {
      return null;
    }
  }

  // Evaluate all missions
  const shipReliability = shipStats.reliability || 0;
  const engineers = player.engineers || 0;

  const evaluations = evaluateCombatMissionReadiness(missionRow, {
    range: shipStats.range,
    speed: shipStats.speed,
    ceiling: shipStats.ceiling,
    reliability: shipReliability
  });

  // [BOT-COMBAT-02] SYNC: Find best mission using risk-adjusted value calculation
  // Value = VP * 10 + income - (risk_factor * 5)
  // Risk factor accounts for mission difficulty vs ship reliability and available engineers
  let bestMission: CombatMission | null = null;
  let bestValue = -Infinity;

  const AVG_HAZARD_DIFFICULTY = 4;

  for (const evaluation of evaluations) {
    if (!evaluation.canAttempt) continue;

    const mission = evaluation.mission;
    const missionDifficulty = (mission as { difficulty?: number }).difficulty || 0;

    // Calculate net difficulty using formula (Section 8.2):
    // Net Difficulty = Hazard Difficulty + Mission Difficulty - Ship Reliability (min 0)
    const netDifficulty = Math.max(0, AVG_HAZARD_DIFFICULTY + missionDifficulty - shipReliability);

    // Estimate hazard pass chance based on engineers available
    // Higher engineers = better chance = we can take harder missions
    // If net_difficulty - engineers <= 2, we have good odds with average ship stats
    const riskFactor = Math.max(0, netDifficulty - engineers - 2);

    // Value = VP * 10 + income - risk penalty
    // Risk penalty: each point of unfavorable difficulty costs 5 value points
    const value = mission.vp * 10 + mission.income - (riskFactor * 5);

    if (value > bestValue) {
      bestValue = value;
      bestMission = mission;
    }
  }

  if (!bestMission) return null;

  // Use helium for USA, hydrogen for others
  const gasType = player.faction === 'usa' ? 'helium' : 'hydrogen';

  return {
    missionId: bestMission.id,
    gasType
  };
}

/**
 * Get reveal phase acquisitions (tech priorities and market cards)
 * Only acquires techs that are superior to what's already installed
 * Returns all market cards sorted by priority - executor tries each in order
 * [BOT-REVEAL-01] SYNC: Keep in sync with get_reveal_acquisitions() in playtest/strategy.py
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

    // [BOT-REVEAL-01] Calculate available research: saved research + engineers + card bonus estimate
    // Card bonus estimate matches playtest/strategy.py behavior
    const savedResearch = (player as PlayerState & { research?: number }).research || 0;
    const engineers = player.engineers || 0;
    const cardBonusEstimate = 1; // Conservative estimate for card research bonuses
    let availableResearch = savedResearch + engineers + cardBonusEstimate;

    console.log(`[BOT REVEAL] Available research: ${availableResearch} (saved=${savedResearch}, engineers=${engineers}, cardBonus=${cardBonusEstimate})`);

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
 * [BOT-HAZARD-01] SYNC: Keep in sync with _handle_hazard_response() in playtest/phases.py
 */
export function getHazardResponse(
  state: GameState,
  playerId: string
): { spendEngineers: boolean } {
  const player = state.players[playerId];
  if (!player) return { spendEngineers: false };

  // Hazard info is now in pendingLaunch
  interface HazardInfo {
    engineersNeeded?: number;
    engineerCost?: number;    // Fire hazard specific cost
    autoPassReason?: string;  // Auto-pass (e.g., "helium immunity")
    noSave?: boolean;         // Cannot be saved, must abort
  }
  const pendingLaunch = player.pendingLaunch as { hazardInfo?: HazardInfo } | undefined;
  if (!pendingLaunch?.hazardInfo) return { spendEngineers: false };

  const hazardInfo = pendingLaunch.hazardInfo;
  const engineers = player.engineers || 0;

  // Case 1: Auto-pass (e.g., helium immunity, stat already sufficient)
  if (hazardInfo.autoPassReason) {
    return { spendEngineers: true };
  }

  // Case 2: No save possible - cannot spend engineers to fix this
  if (hazardInfo.noSave) {
    return { spendEngineers: false };
  }

  // Case 3: Fire hazard with specific engineer cost
  if (hazardInfo.engineerCost !== undefined) {
    return { spendEngineers: engineers >= hazardInfo.engineerCost };
  }

  // Case 4: Standard hazard - check if engineers needed is 0 (stat sufficient)
  const engineersNeeded = hazardInfo.engineersNeeded || 0;
  if (engineersNeeded === 0) {
    return { spendEngineers: true };
  }

  // Case 5: Standard hazard - spend engineers if we have enough
  return { spendEngineers: engineers >= engineersNeeded };
}

// CommonJS compatibility
module.exports = {
  findStrategicPlacement,
  evaluateLaunchReadiness,
  getBlueprintDesignBlueprint,
  findLaunchDecision,
  getRevealAcquisitions,
  getHazardResponse,
  // [BOT-COMBAT-01/02] Combat mission functions for Age II
  evaluateCombatMissionReadiness,
  findBestCombatMission
  // calculateShipStats removed - use calculateBlueprintStats from launch.ts
};
