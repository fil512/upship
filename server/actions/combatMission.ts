/**
 * Combat Mission Actions - Age II
 * Per Section 10.5 and Appendix G
 */

import type { GameState, PlayerState, Ship, LogEntry, HazardCard, Blueprint } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { refillMissionRow } = require('../data/combatMissions');

interface ActionResult {
  newState: GameState;
}

interface FlakResult {
  destroyed: boolean;
  reason: string;
}

interface ValidationResult {
  valid: boolean;
  failures: string[];
}

interface UsaRestrictionResult {
  allowed: boolean;
  reason?: string;
}

interface Mission {
  id: string;
  name: string;
  income: number;
  vp?: number;
  range?: number;
  speed?: number;
  ceiling?: number;
  reliability?: number;
  special?: string;
  specialBonus?: { income?: number };
}

interface ShipStats {
  range?: number;
  speed?: number;
  ceiling?: number;
  reliability?: number;
  [key: string]: number | undefined;
}

// Extended types
type CombatPlayerState = PlayerState & {
  completedMissions?: Mission[];
  hazardDeck?: HazardCard[];
  hazardDiscardPile?: HazardCard[];
  fireProtectionUsedThisAge?: boolean;
};

type CombatShip = Omit<Ship, 'pendingHazard'> & {
  stats?: ShipStats;
  pendingMissionId?: string;
  armor?: number;
  gasType?: 'hydrogen' | 'helium';
  launchedAge?: number;
  pendingHazard?: {
    type?: string;
    name?: string;
    category?: string;
    challengeType?: string;
    difficulty?: number;
    flak?: number;
    engineerCost?: number;
    noSave?: boolean;
    hydrogenOnly?: boolean;
    special?: string;
    gasLossOnFailure?: boolean;
    relevantStat?: number;
    statName?: string;
    engineersNeeded?: number;
    autoPass?: boolean;
    autoPassReason?: string | null;
    heliumFireImmunity?: boolean;
    conductiveCoveringImmunity?: boolean;
    fireResistantFabricAvailable?: boolean;
  } | null;
};

type CombatState = GameState & {
  missionRow?: Mission[];
};

// Extended hazard card type with optional properties not in base HazardCard
type ExtendedHazardCard = HazardCard & {
  special?: string;
  gasLossOnFailure?: boolean;
  hazardType?: string;
};

/**
 * Resolve Flak Check after successful mission
 * Per Section 10.5: "If Flak > Armor, ship is destroyed. Max Armor is 4; 5 Flak always destroys."
 */
function resolveFlakCheck(ship: CombatShip, hazardCard: HazardCard): FlakResult {
  const armor = ship.armor || 0;
  const flak = hazardCard.flak || 0;

  if (flak > armor) {
    return {
      destroyed: true,
      reason: `Flak ${flak} exceeds Armor ${armor} - ship destroyed by anti-aircraft fire`
    };
  }

  return {
    destroyed: false,
    reason: `Armor ${armor} withstood Flak ${flak}`
  };
}

/**
 * Check if ship meets mission requirements
 */
function validateMissionRequirements(shipStats: ShipStats, mission: Mission): ValidationResult {
  const failures: string[] = [];

  if (mission.range && (shipStats.range || 0) < mission.range) {
    failures.push(`Range ${shipStats.range || 0} < required ${mission.range}`);
  }
  if (mission.speed && (shipStats.speed || 0) < mission.speed) {
    failures.push(`Speed ${shipStats.speed || 0} < required ${mission.speed}`);
  }
  if (mission.ceiling && (shipStats.ceiling || 0) < mission.ceiling) {
    failures.push(`Ceiling ${shipStats.ceiling || 0} < required ${mission.ceiling}`);
  }
  if (mission.reliability && (shipStats.reliability || 0) < mission.reliability) {
    failures.push(`Reliability ${shipStats.reliability || 0} < required ${mission.reliability}`);
  }

  return {
    valid: failures.length === 0,
    failures
  };
}

/**
 * Process completing a combat mission
 * Per Appendix G: Award income, store for VP, refill Mission Row
 */
function processCompleteMission(state: GameState, playerId: string, mission: Mission): void {
  const playerState = state.players[playerId] as CombatPlayerState;
  const combatState = state as CombatState;

  // Award income (increase Income Track)
  playerState.income = (playerState.income || 0) + mission.income;

  // Store completed mission for VP scoring
  if (!playerState.completedMissions) {
    playerState.completedMissions = [];
  }
  playerState.completedMissions.push({ ...mission });

  // Remove mission from Mission Row
  if (combatState.missionRow) {
    const missionIndex = combatState.missionRow.findIndex(m => m.id === mission.id);
    if (missionIndex !== -1) {
      combatState.missionRow.splice(missionIndex, 1);
    }

    // Refill Mission Row to 6 cards
    refillMissionRow(state);
  }

  // Log the completion
  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Completed mission: ${mission.name} (+${mission.income} income, ${mission.vp || 0} VP)`,
    playerId,
    type: 'action'
  } as LogEntry);
}

/**
 * Calculate bonus income from special equipment
 */
function calculateEquipmentBonus(playerState: PlayerState, mission: Mission): number {
  let bonus = 0;
  const componentSlots = playerState.blueprint?.componentSlots || [];

  if (mission.special === 'bombing_equipment_bonus') {
    if (componentSlots.includes('bombing_equipment')) {
      bonus += mission.specialBonus?.income || 0;
    }
  }

  if (mission.special === 'communications_bonus') {
    if (componentSlots.includes('communications_suite')) {
      bonus += mission.specialBonus?.income || 0;
    }
  }

  return bonus;
}

interface LaunchCombatMissionData {
  shipId: string;
  missionId: string;
  gasType?: 'hydrogen' | 'helium';
  _internal?: boolean;
}

/**
 * Process launching a ship for a combat mission in Age II
 */
function processLaunchCombatMission(state: GameState, playerId: string, data: LaunchCombatMissionData): ActionResult {
  const { shipId, missionId, gasType = 'hydrogen' } = data;
  const playerState = state.players[playerId] as CombatPlayerState;
  const combatState = state as CombatState;

  // Verify we're in Age II
  if (state.age !== 2) {
    throw new GameRuleError('Combat Missions are only available in Age II');
  }

  // Check USA faction restriction per Section 13.3
  const usaRestriction = validateUsaMissionRestriction(state, playerId);
  if (!usaRestriction.allowed) {
    throw new GameRuleError(usaRestriction.reason!);
  }

  // Find the mission in the Mission Row
  const missionIndex = combatState.missionRow?.findIndex(m => m.id === missionId);
  if (missionIndex === -1 || missionIndex === undefined) {
    throw new GameRuleError(`Mission not found in Mission Row: ${missionId}`);
  }

  const mission = combatState.missionRow![missionIndex];

  // Validate ship exists in hangar
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'hangar');
  if (shipIndex === -1) {
    throw new GameRuleError('Ship not found in hangar');
  }

  // Calculate ship stats and validate mission requirements
  const { calculateBlueprintStats } = require('./launch');
  const stats: ShipStats = calculateBlueprintStats(playerState.blueprint, state.age);

  const validation = validateMissionRequirements(stats, mission);
  if (!validation.valid) {
    throw new GameRuleError(`Ship does not meet mission requirements: ${validation.failures.join(', ')}`);
  }

  // Validate gas type
  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Gas type must be hydrogen or helium');
  }

  // Helium requires Helium Handling tech card
  if (gasType === 'helium') {
    const hasHeliumHandling = playerState.techCards?.some((t: string | { id: string }) =>
      (typeof t === 'string' ? t : t.id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot use Helium without Helium Handling tech card');
    }
  }

  // Calculate and validate officers
  const requiredOfficers = 2; // Age II requires 2 officers
  if ((playerState.officers || 0) < requiredOfficers) {
    throw new InsufficientFundsError(requiredOfficers, playerState.officers || 0, 'Officers');
  }

  // Calculate and validate gas cubes
  const { calculateRequiredGasCubes } = require('./launch');
  const requiredCubes = calculateRequiredGasCubes(playerState.blueprint);
  const availableCubes = playerState.gasCubes?.[gasType] || 0;

  if (availableCubes < requiredCubes) {
    throw new InsufficientFundsError(requiredCubes, availableCubes, gasType);
  }

  // Spend resources
  playerState.officers -= requiredOfficers;
  playerState.gasCubes[gasType] -= requiredCubes;

  // Set ship to awaiting hazard check
  const combatShip = ships[shipIndex] as CombatShip;
  combatShip.status = 'awaiting_hazard';
  combatShip.stats = stats;
  combatShip.pendingMissionId = missionId;
  combatShip.gasType = gasType;
  combatShip.launchedAge = state.age;

  // Calculate armor for flak check
  const armor = calculateShipArmor(playerState.blueprint);
  combatShip.armor = armor;

  state.log = state.log || [];
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Launched ship for mission: ${mission.name} (Armor ${armor})`,
    playerId,
    type: 'action'
  } as LogEntry);

  // Draw hazard card (same as route launches)
  const { shuffleArray } = require('../utils/random');

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

  const hazard = playerState.hazardDeck!.shift()! as ExtendedHazardCard;
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
    (fabric: string | { id: string } | null) => fabric === 'conductive_covering' || (fabric && typeof fabric === 'object' && fabric.id === 'conductive_covering')
  );
  const autoPassCondictiveCovering = hazard.type === 'static_discharge' && hasCondictiveCovering;

  // Check for Fire-Resistant Fabric (once per age auto-pass fire)
  const hasFireResistantFabric = playerState.blueprint?.fabricSlots?.some(
    (fabric: string | { id: string } | null) => fabric === 'fire_resistant_fabric' || (fabric && typeof fabric === 'object' && fabric.id === 'fire_resistant_fabric')
  );
  const fireProtectionAvailable = isFireHazard && hasFireResistantFabric && !playerState.fireProtectionUsedThisAge;

  // Helper for auto-pass reason
  const getAutoPassReason = (clearWeather: boolean, heliumFire: boolean, conductiveCovering: boolean, fireResistant: boolean): string | null => {
    if (clearWeather) return 'Clear Weather';
    if (heliumFire) return 'Fire Immunity (Helium)';
    if (conductiveCovering) return 'Conductive Covering';
    if (fireResistant) return 'Fire-Resistant Fabric (once per Age)';
    return null;
  };

  // Store pending hazard on ship for client to respond
  combatShip.pendingHazard = {
    type: hazard.type,
    name: hazard.name,
    category: hazard.category,
    challengeType,
    difficulty,
    flak: hazard.flak || 0,
    engineerCost: hazard.engineerCost,
    noSave: hazard.noSave,
    hydrogenOnly: hazard.hydrogenOnly,
    special: hazard.special,
    gasLossOnFailure: hazard.gasLossOnFailure,
    relevantStat,
    statName: challengeType,
    engineersNeeded,
    autoPass: autoPassClearWeather,
    autoPassReason: getAutoPassReason(autoPassClearWeather, autoPassHeliumFire, autoPassCondictiveCovering, fireProtectionAvailable),
    heliumFireImmunity: autoPassHeliumFire,
    conductiveCoveringImmunity: autoPassCondictiveCovering,
    fireResistantFabricAvailable: fireProtectionAvailable
  };

  // Build log message
  const autoPassReason = getAutoPassReason(autoPassClearWeather, autoPassHeliumFire, autoPassCondictiveCovering, fireProtectionAvailable);
  const hazardDetails = autoPassReason
    ? ' (' + autoPassReason + ')'
    : ' (' + challengeType + ' ' + difficulty + ' vs ' + relevantStat + ', Flak ' + hazard.flak + ')';

  state.log.push({
    timestamp: new Date().toISOString(),
    message: 'Hazard drawn: ' + hazard.name + hazardDetails,
    playerId,
    type: 'hazard'
  } as LogEntry);

  return { newState: state };
}

/**
 * Calculate ship's Armor stat from blueprint
 * Per Section 10.5: Light Armor Plating (+1), Heavy Armor Plating (+2)
 */
function calculateShipArmor(blueprint: Blueprint): number {
  let armor = 0;
  const componentSlots = blueprint?.componentSlots || [];

  for (const upgradeId of componentSlots) {
    if (upgradeId === 'light_armor_plating') armor += 1;
    if (upgradeId === 'heavy_armor_plating') armor += 2;
  }

  // Max armor is 4
  return Math.min(armor, 4);
}

/**
 * Validate USA faction's late war entry restriction
 * Per Section 13.3: "Flaw: Late to enter war. Cannot acquire a combat
 * mission until all other players have one."
 */
function validateUsaMissionRestriction(state: GameState, playerId: string): UsaRestrictionResult {
  const playerState = state.players[playerId] as CombatPlayerState;

  // Only applies to USA faction
  if (playerState.faction !== 'usa') {
    return { allowed: true };
  }

  // If USA already has at least one mission, no restriction
  if (playerState.completedMissions && playerState.completedMissions.length > 0) {
    return { allowed: true };
  }

  // Check if all other players have at least one completed mission
  for (const otherId of Object.keys(state.players)) {
    if (otherId === playerId) continue;

    const otherPlayer = state.players[otherId] as CombatPlayerState;
    const otherMissions = otherPlayer.completedMissions || [];

    if (otherMissions.length === 0) {
      return {
        allowed: false,
        reason: 'Late to enter war: USA cannot acquire a combat mission until all other players have one'
      };
    }
  }

  // All other players have at least one mission
  return { allowed: true };
}

export {
  resolveFlakCheck,
  validateMissionRequirements,
  processCompleteMission,
  processLaunchCombatMission,
  calculateEquipmentBonus,
  calculateShipArmor,
  validateUsaMissionRestriction
};

// CommonJS compatibility
module.exports = {
  resolveFlakCheck,
  validateMissionRequirements,
  processCompleteMission,
  processLaunchCombatMission,
  calculateEquipmentBonus,
  calculateShipArmor,
  validateUsaMissionRestriction
};
