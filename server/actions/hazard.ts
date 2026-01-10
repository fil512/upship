/**
 * Hazard Actions
 * PERFORM_HAZARD_CHECK action processor
 * Implements hazard checks per Section 8.2, fire hazards per Section 8.3, and Hindenburg Disaster (Section 1.2)
 *
 * Ships are tokens, not individual entities. Ship stats come from pendingLaunch.
 */

import type { GameState, PlayerState, Route, LogEntry, HazardCard, PendingLaunch } from '@upship/api';

// Type alias for slot entries (can be string ID or object with id)
type SlotEntry = string | { id: string } | null;
type SlotType = 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots';

// Blueprint interface for slot access
interface BlueprintSlots {
  frameSlots?: SlotEntry[];
  fabricSlots?: SlotEntry[];
  driveSlots?: SlotEntry[];
  componentSlots?: SlotEntry[];
}

/**
 * Check if a blueprint has a specific upgrade installed in a slot type
 */
function hasUpgrade(blueprint: BlueprintSlots | undefined, slotType: SlotType, upgradeId: string): boolean {
  const slots = blueprint?.[slotType];
  if (!slots) return false;
  return slots.some(slot =>
    slot === upgradeId || (slot && typeof slot === 'object' && slot.id === upgradeId)
  );
}

/**
 * Count filled slots of a given type
 */
function countFilledSlots(blueprint: BlueprintSlots | undefined, slotType: SlotType): number {
  const slots = blueprint?.[slotType];
  return slots?.filter(slot => slot !== null).length || 0;
}

/**
 * Check if hazard is a fire hazard (category fire OR hydrogenOnly)
 */
function isFireHazard(hazard: HazardCard | HazardCardDetails): boolean {
  return hazard.category === 'fire' || !!hazard.hydrogenOnly;
}

const { GameRuleError } = require('../errors');
const { applyCityBonus, CITY_BONUSES } = require('../data/cities');
const { shuffleArray } = require('../utils/random');
const { processCompleteMission, resolveFlakCheck, calculateEquipmentBonus } = require('./combatMission');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');
const { TOTAL_SHIP_CAPACITY } = require('./building');
const { checkAgeTransition } = require('./technology');

// Helper to log launch outcomes
function logOutcome(
  state: GameState,
  playerId: string,
  outcome: 'success' | 'damaged' | 'aborted' | 'destroyed',
  hazard: HazardCard | HazardCardDetails,
  gasType: 'hydrogen' | 'helium',
  reason: string,
  routeId?: string
): void {
  const playerState = state.players[playerId];
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState?.faction || 'unknown';
  resourceFlowLogger.logLaunchOutcome(
    flowContext,
    playerId,
    faction,
    outcome,
    hazard.type,
    hazard.name || hazard.type,
    gasType,
    reason,
    routeId
  );
}

interface ActionResult {
  newState: GameState;
}

// Extended pending launch with hazard info
// Use Omit to avoid type conflict with hazardInfo
interface ExtendedPendingLaunch extends Omit<PendingLaunch, 'hazardInfo'> {
  hazardInfo?: HazardCardDetails;
  stats?: Record<string, number>;
  launchedAge?: number;
}

// Extended types
type HazardPlayerState = PlayerState & {
  hazardDeck?: HazardCard[];
  hazardDiscardPile?: HazardCard[];
  lastHazardCheck?: Record<string, unknown>;
  insurance?: number;
  fireProtectionUsedThisAge?: boolean;
  peekedHazard?: HazardCard;
  vp?: number;
  pendingLaunch?: ExtendedPendingLaunch;
  // Ship counters (ships are tokens)
  hangarShips?: number;
  repairShips?: number;
  // Launch bonuses from card effects
  launchBonuses?: {
    ignoreWeather?: boolean;
    reliability?: number;
    range?: number;
    luxury?: number;
    routeIncomeBonus?: number;
    combatIncomeBonus?: number;
    speed?: number;
  };
};

interface HazardConditions {
  age: number;
  gasType?: 'hydrogen' | 'helium';
  isLuxuryRoute: boolean;
  hazardType: string;
}

// Extended hazard card with additional fields used during hazard resolution
interface HazardCardDetails {
  // From HazardCard
  id: string;
  type: string;
  name: string;
  difficulty: number;
  autoPass?: boolean;
  // Extended fields
  category?: string;
  challengeType?: string;
  engineersNeeded?: number;
  relevantStat?: number;
  statName?: string;
  autoPassReason?: string;
  heliumFireImmunity?: boolean;
  conductiveCoveringImmunity?: boolean;
  fireResistantFabricAvailable?: boolean;
  noSave?: boolean;
  engineerCost?: number;
  hydrogenOnly?: boolean;
  hazardType?: string;
  flak?: number;
  special?: string;
  gasLossOnFailure?: number;
  payloadSlotModifier?: { threshold: number; difficultyIncrease: number };
}

type HazardState = GameState & {
  hindenburgDisaster?: boolean;
  gameEndReason?: string;
  gameEndAfterRound?: boolean;
  missionRow?: { id: string; name?: string; income: number; vp?: number }[];
};

type ExtendedRoute = Route & {
  luxury?: number | boolean;
  claimed?: string;
  claimedBy?: { playerId: string; round: number };
};

// ============================================================================
// AUTO-PASS CONDITION SYSTEM
// Order matters: first matching condition wins
// ============================================================================

interface AutoPassContext {
  hazard: HazardCard | HazardCardDetails;
  gasType: 'hydrogen' | 'helium';
  blueprint: BlueprintSlots | undefined;
  launchBonuses?: { ignoreWeather?: boolean; [key: string]: unknown };
  fireProtectionUsedThisAge: boolean;
  playerState: HazardPlayerState;
  state: GameState;
}

interface AutoPassCheck {
  name: string;
  reason: string;
  check: (ctx: AutoPassContext) => boolean;
  onPass?: (ctx: AutoPassContext) => void;
}

const AUTO_PASS_CHECKS: AutoPassCheck[] = [
  // 1. Clear Weather - always passes
  {
    name: 'clearWeather',
    reason: 'Clear Weather - Auto Pass',
    check: (ctx) => !!ctx.hazard.autoPass || ctx.hazard.type === 'clear_weather'
  },
  // 2. Helium + Fire hazard - helium ships immune to fire
  {
    name: 'heliumFire',
    reason: 'Fire Immunity (Helium) - Auto Pass',
    check: (ctx) => isFireHazard(ctx.hazard) && ctx.gasType === 'helium'
  },
  // 3. Conductive Covering + Static Discharge - grounds electrical charge
  {
    name: 'conductiveCovering',
    reason: 'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)',
    check: (ctx) => ctx.hazard.type === 'static_discharge' && hasUpgrade(ctx.blueprint, 'fabricSlots', 'conductive_covering')
  },
  // 4. Rapid Descent System + Weather hazard - emergency venting
  {
    name: 'rapidDescent',
    reason: 'Weather Hazard - Auto Pass (Rapid Descent System enables emergency venting)',
    check: (ctx) => {
      const extHazard = ctx.hazard as HazardCard & { hazardType?: string };
      return extHazard.hazardType === 'weather' && hasUpgrade(ctx.blueprint, 'componentSlots', 'rapid_descent_system');
    }
  },
  // 5. The Weatherman card bonus - ignores weather
  {
    name: 'weatherman',
    reason: 'Weather Hazard - Auto Pass (The Weatherman ignores weather hazards)',
    check: (ctx) => {
      const extHazard = ctx.hazard as HazardCard & { hazardType?: string };
      return extHazard.hazardType === 'weather' && !!ctx.launchBonuses?.ignoreWeather;
    }
  },
  // 6. Fire-Resistant Fabric - once per age, auto-pass fire hazard
  {
    name: 'fireResistantFabric',
    reason: 'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)',
    check: (ctx) => {
      return isFireHazard(ctx.hazard) &&
        hasUpgrade(ctx.blueprint, 'fabricSlots', 'fire_resistant_fabric') &&
        !ctx.fireProtectionUsedThisAge;
    },
    onPass: (ctx) => {
      ctx.playerState.fireProtectionUsedThisAge = true;
      ctx.state.log.push({
        timestamp: new Date().toISOString(),
        message: `Fire-Resistant Fabric activated! Auto-passing ${ctx.hazard.name}.`,
        playerId: Object.keys(ctx.state.players).find(id => ctx.state.players[id] === ctx.playerState),
        type: 'action'
      } as LogEntry);
    }
  }
];

/**
 * Check all auto-pass conditions in order
 * Returns first matching condition or { passes: false }
 */
function checkAutoPass(ctx: AutoPassContext): { passes: boolean; reason?: string } {
  for (const check of AUTO_PASS_CHECKS) {
    if (check.check(ctx)) {
      check.onPass?.(ctx);
      return { passes: true, reason: check.reason };
    }
  }
  return { passes: false };
}

/**
 * Check if Hindenburg Disaster conditions are met per Section 1.2
 * All conditions must be true:
 * - Age III
 * - Hydrogen gas
 * - Luxury route
 * - Catastrophic Explosion hazard
 */
function checkHindenburgDisaster(conditions: HazardConditions): boolean {
  const { age, gasType, isLuxuryRoute, hazardType } = conditions;

  return (
    age === 3 &&
    gasType === 'hydrogen' &&
    isLuxuryRoute === true &&
    hazardType === 'catastrophic_explosion'
  );
}

/**
 * Calculate total difficulty for a hazard check
 * Formula: Total Difficulty = Hazard Difficulty + Route/Mission Difficulty - Ship Reliability (min 0)
 * If Total Difficulty <= 0: Auto-pass
 * If Total Difficulty > 0: Must spend that many engineers to pass
 */
function calculateTotalDifficulty(
  hazardDifficulty: number,
  missionDifficulty: number,
  shipReliability: number,
  reliabilityBonus: number
): number {
  const totalReliability = shipReliability + reliabilityBonus;
  return Math.max(0, hazardDifficulty + missionDifficulty - totalReliability);
}

interface HazardCheckData {
  engineersToSpend?: number | string;
}

/**
 * Perform a hazard check for a ship awaiting launch
 * Ships are tokens - stats come from pendingLaunch (calculated from blueprint at launch time)
 */
function processHazardCheck(state: GameState, playerId: string, data: HazardCheckData): ActionResult {
  const engineersToSpend = Math.max(0, parseInt(String(data.engineersToSpend), 10) || 0);
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;

  // Ships are tokens - check pendingLaunch instead of finding ship by ID
  const pendingLaunch = playerState.pendingLaunch;
  if (!pendingLaunch) {
    throw new GameRuleError('No ship awaiting hazard check');
  }

  const shipStats = pendingLaunch.stats || { speed: 0, reliability: 0, ceiling: 0, range: 0 };
  const gasType = pendingLaunch.gasType;

  const pendingRouteId = pendingLaunch.routeId;
  const route = (state.map?.routes as ExtendedRoute[] | undefined)?.find(r => r.id === pendingRouteId);

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
  const isLuxuryRoute = !!route?.luxury;

  const hindenburgConditions: HazardConditions = {
    age: state.age,
    gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  };

  const isHindenburgDisaster = checkHindenburgDisaster(hindenburgConditions);

  if (isHindenburgDisaster) {
    // Ship destroyed - clear pendingLaunch (ship is lost)
    delete playerState.pendingLaunch;
    hazardState.hindenburgDisaster = true;
    hazardState.gameEndReason = 'hindenburg_disaster';
    hazardState.gameEndAfterRound = true;
    playerState.vp = (playerState.vp || 0) + 3;

    logOutcome(state, playerId, 'destroyed', hazard, gasType!, 'Hindenburg Disaster - catastrophic explosion on luxury hydrogen route', pendingRouteId);

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `THE HINDENBURG DISASTER! A Catastrophic Explosion has destroyed a luxury hydrogen airship. The era of airships has ended. Complete the current round, then final scoring. Triggering player gains 3 VP (historical infamy).`,
      playerId,
      type: 'game_end'
    } as LogEntry);

    return { newState: state };
  }

  // Check all auto-pass conditions using unified system
  const autoPass = checkAutoPass({
    hazard,
    gasType: gasType!,
    blueprint: playerState.blueprint as BlueprintSlots,
    launchBonuses: playerState.launchBonuses,
    fireProtectionUsedThisAge: playerState.fireProtectionUsedThisAge || false,
    playerState,
    state
  });

  if (autoPass.passes) {
    return resolveHazardSuccess(state, playerId, route, hazard, autoPass.reason!);
  }

  // Dispatch to specific resolution handlers based on hazard type
  if (isFireHazard(hazard) && gasType === 'hydrogen') {
    return resolveFireHazard(state, playerId, hazard, engineersToSpend, route);
  }

  // Handle mechanical hazards with engineer costs (like Critical Structural Stress)
  // These work like fire hazards: spend X engineers to save (Damaged) or crash
  const isMechanicalWithEngineerCost = hazard.category === 'mechanical' && hazard.engineerCost;
  if (isMechanicalWithEngineerCost) {
    return resolveMechanicalHazard(state, playerId, hazard, engineersToSpend, route);
  }

  // Simplified hazard resolution:
  // Total Difficulty = Hazard Difficulty + Mission Difficulty - Ship Reliability (min 0)
  // If Total Difficulty <= 0: Auto-pass
  // If Total Difficulty > 0: Must spend that many engineers to pass

  const playerBlueprint = playerState.blueprint as BlueprintSlots;
  const extendedHazard = hazard as HazardCard & { hazardType?: string; payloadSlotModifier?: { threshold: number; difficultyIncrease: number } };

  // Get ship reliability and any bonuses
  const shipReliability = shipStats.reliability || 0;
  const reliabilityBonus = playerState.launchBonuses?.reliability || 0;

  // Apply Italy Articulated Keel -1 Reliability penalty for weather hazards
  const hasFlexibleFrame = hasUpgrade(playerBlueprint, 'frameSlots', 'flexible_frame');
  const isWeatherHazard = extendedHazard.hazardType === 'weather';
  const flexibleFramePenalty = (hasFlexibleFrame && isWeatherHazard) ? 1 : 0;

  // Get mission difficulty (Age II combat missions only; routes have no difficulty)
  let missionDifficulty = 0;
  const missionId = pendingLaunch.missionId;
  if (missionId && state.age === 2) {
    const mission = hazardState.missionRow?.find(m => m.id === missionId);
    if (mission && (mission as { difficulty?: number }).difficulty) {
      missionDifficulty = (mission as { difficulty?: number }).difficulty!;
    }
  }

  // Apply Squall Line-style payload slot modifier (ships with 3+ payload slots suffer +1 difficulty)
  let hazardDifficulty = hazard.difficulty;
  if (extendedHazard.payloadSlotModifier) {
    const payloadSlotCount = countFilledSlots(playerBlueprint, 'componentSlots');
    if (payloadSlotCount >= extendedHazard.payloadSlotModifier.threshold) {
      hazardDifficulty += extendedHazard.payloadSlotModifier.difficultyIncrease;
    }
  }

  // Calculate total difficulty
  const totalDifficulty = calculateTotalDifficulty(
    hazardDifficulty,
    missionDifficulty,
    shipReliability - flexibleFramePenalty,
    reliabilityBonus
  );

  // If total difficulty is 0 or less, auto-pass (reliability overcomes the hazard)
  if (totalDifficulty === 0) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      `Reliability overcomes hazard (${shipReliability + reliabilityBonus - flexibleFramePenalty} reliability >= ${hazardDifficulty + missionDifficulty} difficulty)`);
  }

  // Player must spend engineers equal to total difficulty to pass
  const engineersAvailable = playerState.engineers || 0;
  const engineersToActuallySpend = Math.min(engineersToSpend, engineersAvailable);
  const success = engineersToActuallySpend >= totalDifficulty;

  if (engineersToActuallySpend > 0) {
    playerState.engineers = engineersAvailable - engineersToActuallySpend;
    // Log engineer consumption for hazard check
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineersToActuallySpend, 'hazard', `Hazard check: ${hazard.name}`, playerState.engineers);
  }

  const checkDetails = {
    hazardType: hazard.type,
    difficulty: totalDifficulty,
    reliabilityUsed: shipReliability + reliabilityBonus - flexibleFramePenalty,
    engineersSpent: engineersToActuallySpend,
    success
  };

  playerState.lastHazardCheck = checkDetails;

  if (success) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      `Hazard overcome: spent ${engineersToActuallySpend} engineer(s) to pass difficulty ${totalDifficulty}`);
  } else {
    return resolveHazardAbort(state, playerId, hazard,
      `Hazard failed: needed ${totalDifficulty} engineer(s), spent ${engineersToActuallySpend}`);
  }
}

/**
 * Apply insurance policy to recover crashed ship per Section 6.11
 * Ships are tokens - recovery means incrementing hangarShips counter
 * Per Section 4.4: Total fleet limited to 6 ships (hangar + repair combined)
 */
function applyInsuranceRecovery(state: GameState, playerId: string, hazardName: string): boolean {
  const playerState = state.players[playerId] as HazardPlayerState;
  const insurancePolicies = playerState.insurance || 0;

  if (insurancePolicies > 0) {
    // Check combined fleet capacity
    const currentHangar = playerState.hangarShips || 0;
    const currentRepair = playerState.repairShips || 0;
    const totalFleet = currentHangar + currentRepair;

    if (totalFleet >= TOTAL_SHIP_CAPACITY) {
      // Fleet at capacity - insurance cannot recover
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${hazardName}! Insurance claim failed: fleet at capacity (${totalFleet}/${TOTAL_SHIP_CAPACITY} ships)`,
        playerId,
        type: 'hazard'
      } as LogEntry);
      return false;
    }

    playerState.insurance = insurancePolicies - 1;
    // Ship recovered - increment hangar counter
    playerState.hangarShips = currentHangar + 1;
    // Clear pending launch
    delete playerState.pendingLaunch;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazardName}! Insurance claim: ship recovered to Launch Hangar (${playerState.insurance} policies remaining)`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return true;
  }
  return false;
}

/**
 * Handle fire hazard resolution per Section 8.3
 * Ships are tokens - damage moves to repair bay, destruction clears pendingLaunch
 */
function resolveFireHazard(state: GameState, playerId: string, hazard: HazardCard, engineersToSpend: number, route: ExtendedRoute | undefined): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const pendingLaunch = playerState.pendingLaunch;
  const shipStats = pendingLaunch?.stats || {};
  const gasType = pendingLaunch?.gasType || 'hydrogen';
  const routeId = pendingLaunch?.routeId;

  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    // Log before clearing pendingLaunch
    logOutcome(state, playerId, 'destroyed', hazard, gasType, 'Catastrophic Explosion - no save possible', routeId);
    // Ship destroyed - clear pendingLaunch (ship is lost)
    delete playerState.pendingLaunch;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `CATASTROPHIC EXPLOSION! Ship destroyed - no save possible.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  }

  if (hazard.type === 'static_discharge') {
    // Static discharge uses simplified formula: Total Difficulty = Hazard Difficulty - Ship Reliability (min 0)
    // If Total Difficulty > 0, must spend that many engineers to pass, else ship crashes
    const reliabilityStat = shipStats.reliability || 0;
    const totalDifficulty = Math.max(0, hazard.difficulty - reliabilityStat);

    // If reliability overcomes difficulty, auto-pass
    if (totalDifficulty === 0) {
      return resolveHazardSuccess(state, playerId, route, hazard,
        `Static Discharge overcome by reliability (${reliabilityStat} >= ${hazard.difficulty})`);
    }

    // Must spend engineers equal to total difficulty
    const engineersAvailable = playerState.engineers || 0;
    const engineersToActuallySpend = Math.min(engineersToSpend, engineersAvailable);

    if (engineersToActuallySpend >= totalDifficulty) {
      playerState.engineers = engineersAvailable - engineersToActuallySpend;
      // Log engineer consumption for static discharge
      const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
      const faction = playerState.faction || 'unknown';
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineersToActuallySpend, 'hazard', 'Static discharge', playerState.engineers);
      return resolveHazardSuccess(state, playerId, route, hazard,
        `Static Discharge overcome: spent ${engineersToActuallySpend} engineer(s) for difficulty ${totalDifficulty}`);
    } else {
      // Insufficient engineers - ship crashes
      if (applyInsuranceRecovery(state, playerId, 'STATIC DISCHARGE')) {
        logOutcome(state, playerId, 'destroyed', hazard, gasType, `Static Discharge failed (needed ${totalDifficulty} engineers), recovered by insurance`, routeId);
        return { newState: state };
      }

      logOutcome(state, playerId, 'destroyed', hazard, gasType, `Static Discharge failed: needed ${totalDifficulty} engineer(s), had ${engineersAvailable}`, routeId);
      delete playerState.pendingLaunch;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `STATIC DISCHARGE! Needed ${totalDifficulty} engineer(s) to overcome, had ${engineersAvailable}. Ship destroyed!`,
        playerId,
        type: 'hazard'
      } as LogEntry);

      return { newState: state };
    }
  }

  const engineerCost = hazard.engineerCost || 1;
  const availableEngineers = playerState.engineers || 0;
  const actualSpend = Math.min(engineersToSpend, availableEngineers);

  if (actualSpend >= engineerCost) {
    // Log before clearing pendingLaunch
    logOutcome(state, playerId, 'damaged', hazard, gasType, `Fire controlled with ${engineerCost} engineer(s), ship to repair bay`, routeId);
    playerState.engineers -= engineerCost;
    // Ship damaged - move to repair bay (combined capacity limit: 6 ships total)
    const currentTotal = (playerState.hangarShips || 0) + (playerState.repairShips || 0);
    if (currentTotal < TOTAL_SHIP_CAPACITY) {
      playerState.repairShips = (playerState.repairShips || 0) + 1;
    }
    delete playerState.pendingLaunch;

    // Log engineer consumption for fire hazard
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineerCost, 'hazard', `Fire hazard: ${hazard.name}`, playerState.engineers);

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged - moved to Repair Bay.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  } else {
    if (applyInsuranceRecovery(state, playerId, hazard.name || 'Fire Hazard')) {
      logOutcome(state, playerId, 'destroyed', hazard, gasType, `Fire hazard, insufficient engineers (need ${engineerCost}, have ${availableEngineers}), recovered by insurance`, routeId);
      return { newState: state };
    }

    // Log before clearing pendingLaunch
    logOutcome(state, playerId, 'destroyed', hazard, gasType, `Insufficient engineers (need ${engineerCost}, have ${availableEngineers})`, routeId);
    // Ship destroyed - clear pendingLaunch
    delete playerState.pendingLaunch;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name}! Insufficient Engineers (need ${engineerCost}, have ${availableEngineers}). Ship destroyed!`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  }
}

/**
 * Handle mechanical hazard resolution per Appendix E (Critical Structural Stress)
 * Mechanical hazards work like fire hazards: spend X engineers → Damaged, else → Crash
 * Unlike fire hazards, mechanical hazards affect ALL ships (both hydrogen and helium)
 */
function resolveMechanicalHazard(state: GameState, playerId: string, hazard: HazardCard, engineersToSpend: number, _route: ExtendedRoute | undefined): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const pendingLaunch = playerState.pendingLaunch;
  const gasType = pendingLaunch?.gasType || 'hydrogen';
  const routeId = pendingLaunch?.routeId;

  const engineerCost = hazard.engineerCost || 2;
  const availableEngineers = playerState.engineers || 0;
  const actualSpend = Math.min(engineersToSpend, availableEngineers);

  if (actualSpend >= engineerCost) {
    // Ship damaged but saved - move to repair bay
    logOutcome(state, playerId, 'damaged', hazard, gasType, `Mechanical damage controlled with ${engineerCost} engineer(s), ship to repair bay`, routeId);
    playerState.engineers -= engineerCost;

    // Ship damaged - move to repair bay (combined capacity limit: 6 ships total)
    const currentTotal = (playerState.hangarShips || 0) + (playerState.repairShips || 0);
    if (currentTotal < TOTAL_SHIP_CAPACITY) {
      playerState.repairShips = (playerState.repairShips || 0) + 1;
    }
    delete playerState.pendingLaunch;

    // Log engineer consumption
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineerCost, 'hazard', `Mechanical hazard: ${hazard.name}`, playerState.engineers);

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged - moved to Repair Bay.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  } else {
    // Insufficient engineers - ship destroyed
    if (applyInsuranceRecovery(state, playerId, hazard.name || 'Mechanical Hazard')) {
      logOutcome(state, playerId, 'destroyed', hazard, gasType, `Mechanical hazard, insufficient engineers (need ${engineerCost}, have ${availableEngineers}), recovered by insurance`, routeId);
      return { newState: state };
    }

    logOutcome(state, playerId, 'destroyed', hazard, gasType, `Insufficient engineers (need ${engineerCost}, have ${availableEngineers})`, routeId);
    delete playerState.pendingLaunch;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name}! Insufficient Engineers (need ${engineerCost}, have ${availableEngineers}). Ship destroyed!`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  }
}

/**
 * Resolve successful hazard check - ship claims route or completes mission
 * Ships are tokens - stats come from pendingLaunch, income bonus added to route
 * @param cityChoice - Optional city choice from RESPOND_TO_HAZARD action
 */
function resolveHazardSuccess(state: GameState, playerId: string, route: ExtendedRoute | undefined, hazard: HazardCard, message: string, cityChoice?: string): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;
  const pendingLaunch = playerState.pendingLaunch;

  if (!pendingLaunch) {
    throw new GameRuleError('No pending launch to resolve');
  }

  const shipStats = pendingLaunch.stats || {};
  const gasType = pendingLaunch.gasType || 'hydrogen';

  // Log success outcome
  logOutcome(state, playerId, 'success', hazard, gasType, message, pendingLaunch.routeId);

  // Handle Age 2 combat missions
  if (pendingLaunch.missionId && state.age === 2) {
    const mission = hazardState.missionRow?.find(m => m.id === pendingLaunch.missionId);
    if (!mission) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Error: Mission ${pendingLaunch.missionId} not found in Mission Row`,
        playerId,
        type: 'error'
      } as LogEntry);
      // Return ship to hangar (combined capacity limit: 6 ships total)
      const currentTotal = (playerState.hangarShips || 0) + (playerState.repairShips || 0);
      if (currentTotal < TOTAL_SHIP_CAPACITY) {
        playerState.hangarShips = (playerState.hangarShips || 0) + 1;
      }
      delete playerState.pendingLaunch;
      return { newState: state };
    }

    const bonusIncome = calculateEquipmentBonus(playerState, mission);
    // Apply Old Contemptible bonus (+2 Income for combat missions)
    const combatCardBonus = playerState.launchBonuses?.combatIncomeBonus || 0;

    processCompleteMission(state, playerId, {
      ...mission,
      income: mission.income + bonusIncome + combatCardBonus
    });

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED (${hazard.type}): ${message}`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    const flakResult = resolveFlakCheck({ stats: shipStats }, hazard);

    if (flakResult.destroyed) {
      // Ship destroyed by flak - clear pendingLaunch
      delete playerState.pendingLaunch;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `FLAK! ${flakResult.reason}. Mission completed but ship lost to anti-aircraft fire.`,
        playerId,
        type: 'hazard'
      } as LogEntry);
    } else {
      // Mission complete, ship survives - clear pendingLaunch (ship on route)
      delete playerState.pendingLaunch;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${flakResult.reason}. Ship survived and mission complete.`,
        playerId,
        type: 'action'
      } as LogEntry);
    }

    // Advance progress track for successful launch (Section 1.3)
    const progressState = state as GameState & { progressTrack?: number };
    progressState.progressTrack = (progressState.progressTrack || 0) + 1;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Progress Track: ${progressState.progressTrack} (successful mission)`,
      type: 'system'
    } as LogEntry);

    // Check for age transition
    checkAgeTransition(state);

    return { newState: state };
  }

  // Clear pending launch - ship is now on route
  const pendingCityChoice = pendingLaunch.cityChoice;
  delete playerState.pendingLaunch;

  if (route) {
    route.claimed = playerId;
    route.claimedBy = {
      playerId,
      round: state.round
    };

    // Calculate income: route income + ship income bonus from components + card bonuses
    const routeIncome = route.income || 0;
    const shipIncome = shipStats.income || 0;
    // Apply Merchant Prince bonus (+2 Income from this route)
    const cardIncomeBonus = playerState.launchBonuses?.routeIncomeBonus || 0;
    const totalIncome = routeIncome + shipIncome + cardIncomeBonus;
    playerState.income += totalIncome;

    if (CITY_BONUSES) {
      // Prefer cityChoice from action, fall back to pendingCityChoice, then route endpoint
      const cityName = cityChoice || pendingCityChoice || route.to || route.from;
      applyCityBonus(playerState, cityName, state, playerId);
    }

    // Log with income bonus if applicable
    let incomeMessage = '';
    if (shipIncome > 0 || cardIncomeBonus > 0) {
      const bonusParts: string[] = [];
      if (shipIncome > 0) bonusParts.push(`£${shipIncome} ship`);
      if (cardIncomeBonus > 0) bonusParts.push(`£${cardIncomeBonus} card`);
      incomeMessage = ` Route income: £${routeIncome} + ${bonusParts.join(' + ')} = £${totalIncome}`;
    }

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED (${hazard.type}): ${message}${incomeMessage}`,
      playerId,
      type: 'hazard'
    } as LogEntry);
  } else {
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED (${hazard.type}): ${message}`,
      playerId,
      type: 'hazard'
    } as LogEntry);
  }

  // Advance progress track for successful launch (Section 1.3)
  const progressState = state as GameState & { progressTrack?: number };
  progressState.progressTrack = (progressState.progressTrack || 0) + 1;
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Progress Track: ${progressState.progressTrack} (successful launch)`,
    type: 'system'
  } as LogEntry);

  // Check for age transition
  checkAgeTransition(state);

  return { newState: state };
}

/**
 * Resolve aborted launch - ship returns to hangar
 * Ships are tokens - abort increments hangarShips counter
 * Per Section 8.2: On abort, officers are KEPT (refunded), gas is spent
 */
function resolveHazardAbort(state: GameState, playerId: string, hazard: HazardCard, message: string): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const pendingLaunch = playerState.pendingLaunch;
  const gasType = pendingLaunch?.gasType || 'hydrogen';
  const routeId = pendingLaunch?.routeId;

  // Handle Icing Conditions / Severe Icing gas loss on failure
  const extHazard = hazard as HazardCard & { gasLossOnFailure?: number };
  if (extHazard.gasLossOnFailure && extHazard.gasLossOnFailure > 0) {
    const gasCubes = playerState.gasCubes || { hydrogen: 0, helium: 0 };
    const currentGas = gasCubes[gasType] || 0;
    const gasLoss = Math.min(extHazard.gasLossOnFailure, currentGas);
    gasCubes[gasType] = currentGas - gasLoss;
    playerState.gasCubes = gasCubes;

    // Log gas loss
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, gasType, gasLoss, 'hazard', `${hazard.name} gas loss`, gasCubes[gasType]);

    // If ship has no gas remaining, it's destroyed instead of aborted
    if (currentGas <= extHazard.gasLossOnFailure) {
      logOutcome(state, playerId, 'destroyed', hazard, gasType, `${message}. Lost ${gasLoss} ${gasType} cube(s), ship destroyed (no gas remaining)`, routeId);
      delete playerState.pendingLaunch;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hazard check FAILED (${hazard.type}): ${message}. Lost ${gasLoss} ${gasType} cube(s). Ship destroyed - no gas remaining!`,
        playerId,
        type: 'hazard'
      } as LogEntry);

      return { newState: state };
    }

    // Gas lost but ship survives - continue to normal abort
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name}: Lost ${gasLoss} ${gasType} cube(s) (${gasCubes[gasType]} remaining)`,
      playerId,
      type: 'hazard'
    } as LogEntry);
  }

  // Log aborted outcome
  logOutcome(state, playerId, 'aborted', hazard, gasType, message, routeId);

  // Ship returns to hangar (combined capacity limit: 6 ships total)
  const currentTotal = (playerState.hangarShips || 0) + (playerState.repairShips || 0);
  if (currentTotal < TOTAL_SHIP_CAPACITY) {
    playerState.hangarShips = (playerState.hangarShips || 0) + 1;
  }
  // Clear pending launch
  delete playerState.pendingLaunch;

  // Refund officers per Section 8.2 - officers are KEPT on abort
  const officersToRefund = state.age || 1;
  playerState.officers = (playerState.officers || 0) + officersToRefund;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check FAILED (${hazard.type}): ${message}. Launch aborted - ship returns to hangar, ${officersToRefund} officer(s) refunded.`,
    playerId,
    type: 'hazard'
  } as LogEntry);

  return { newState: state };
}

interface RespondToHazardData {
  spendEngineers?: boolean;
  cityChoice?: string;  // Which route endpoint to receive city bonus from
}

/**
 * Process player's response to a pending hazard check
 * Ships are tokens - hazard info and stats come from pendingLaunch
 */
function processRespondToHazard(state: GameState, playerId: string, data: RespondToHazardData): ActionResult {
  const { cityChoice } = data;
  const spendEngineers = data.spendEngineers === true;
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;

  // Ships are tokens - check pendingLaunch instead of finding ship by ID
  const pendingLaunch = playerState.pendingLaunch;
  if (!pendingLaunch || !pendingLaunch.hazardInfo) {
    throw new GameRuleError('No ship awaiting hazard response');
  }

  const hazard = pendingLaunch.hazardInfo as HazardCardDetails;
  const shipStats = pendingLaunch.stats || {};
  const gasType = pendingLaunch.gasType;
  const pendingRouteId = pendingLaunch.routeId;
  const route = (state.map?.routes as ExtendedRoute[] | undefined)?.find(r => r.id === pendingRouteId);

  const isLuxuryRoute = !!route?.luxury;
  if (checkHindenburgDisaster({
    age: state.age,
    gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  })) {
    // Ship destroyed - clear pendingLaunch
    delete playerState.pendingLaunch;

    hazardState.hindenburgDisaster = true;
    hazardState.gameEndReason = 'hindenburg_disaster';
    hazardState.gameEndAfterRound = true;
    playerState.vp = (playerState.vp || 0) + 3;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `THE HINDENBURG DISASTER! A Catastrophic Explosion has destroyed a luxury hydrogen airship. The era of airships has ended. Complete the current round, then final scoring. Triggering player gains 3 VP (historical infamy).`,
      playerId,
      type: 'game_end'
    } as LogEntry);

    return { newState: state };
  }

  if (hazard.autoPass || hazard.autoPassReason === 'Clear Weather') {
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard, 'Clear Weather - Auto Pass', cityChoice);
  }

  if (hazard.heliumFireImmunity) {
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard, 'Fire Immunity (Helium) - Auto Pass', cityChoice);
  }

  if (hazard.conductiveCoveringImmunity) {
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)', cityChoice);
  }

  if (hazard.fireResistantFabricAvailable) {
    playerState.fireProtectionUsedThisAge = true;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Fire-Resistant Fabric activated! Auto-passing ${hazard.name}.`,
      playerId,
      type: 'action'
    } as LogEntry);

    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)', cityChoice);
  }

  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    // Ship destroyed - clear pendingLaunch
    delete playerState.pendingLaunch;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `CATASTROPHIC EXPLOSION! Ship destroyed - no save possible.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  }

  if (isFireHazard(hazard) && hazard.engineerCost !== undefined) {
    const engineerCost = hazard.engineerCost;
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineerCost) {
      playerState.engineers -= engineerCost;
      // Ship damaged - move to repair bay (combined capacity limit: 6 ships total)
      const currentTotal = (playerState.hangarShips || 0) + (playerState.repairShips || 0);
      if (currentTotal < TOTAL_SHIP_CAPACITY) {
        playerState.repairShips = (playerState.repairShips || 0) + 1;
      }
      delete playerState.pendingLaunch;

      // Log engineer consumption for fire hazard response
      const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
      const faction = playerState.faction || 'unknown';
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineerCost, 'hazard', `Fire hazard: ${hazard.name}`, playerState.engineers);

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged - moved to Repair Bay.`,
        playerId,
        type: 'hazard'
      } as LogEntry);

      return { newState: state };
    } else {
      return resolveFireCrash(state, playerId, hazard as HazardCard);
    }
  }

  // Simplified hazard response: Total Difficulty = Hazard Difficulty - Ship Reliability (min 0)
  // If Total Difficulty > 0, must spend that many engineers to pass
  const reliabilityStat = shipStats.reliability || 0;
  const totalDifficulty = Math.max(0, hazard.difficulty - reliabilityStat);

  // Handle static discharge (fire hazard with reliability check)
  if (hazard.type === 'static_discharge') {
    if (totalDifficulty === 0) {
      return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
        `Static Discharge overcome by reliability (${reliabilityStat} >= ${hazard.difficulty})`, cityChoice);
    }

    const availableEngineers = playerState.engineers || 0;
    if (spendEngineers && availableEngineers >= totalDifficulty) {
      playerState.engineers -= totalDifficulty;
      const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
      const faction = playerState.faction || 'unknown';
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', totalDifficulty, 'hazard', 'Static discharge response', playerState.engineers);
      return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
        `Static Discharge overcome: spent ${totalDifficulty} engineer(s)`, cityChoice);
    } else {
      return resolveFireCrash(state, playerId, hazard as HazardCard);
    }
  }

  // Standard hazard response
  if (totalDifficulty === 0) {
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      `Hazard overcome by reliability (${reliabilityStat} >= ${hazard.difficulty})`, cityChoice);
  }

  const availableEngineers = playerState.engineers || 0;
  if (spendEngineers && availableEngineers >= totalDifficulty) {
    playerState.engineers -= totalDifficulty;
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', totalDifficulty, 'hazard', `Hazard response: ${hazard.name}`, playerState.engineers);
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      `Hazard overcome: spent ${totalDifficulty} engineer(s)`, cityChoice);
  } else {
    return resolveHazardAbort(state, playerId, hazard as HazardCard,
      `Hazard failed: needed ${totalDifficulty} engineer(s), chose to abort`);
  }
}

/**
 * Resolve fire crash - ship destroyed (with insurance check)
 * Ships are tokens - destruction clears pendingLaunch
 */
function resolveFireCrash(state: GameState, playerId: string, hazard: HazardCard): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const pendingLaunch = playerState.pendingLaunch;
  const gasType = pendingLaunch?.gasType || 'hydrogen';
  const routeId = pendingLaunch?.routeId;

  if (applyInsuranceRecovery(state, playerId, hazard.name || 'Fire Hazard')) {
    logOutcome(state, playerId, 'destroyed', hazard, gasType, `${hazard.name} - recovered by insurance`, routeId);
    return { newState: state };
  }

  // Log before clearing pendingLaunch
  logOutcome(state, playerId, 'destroyed', hazard, gasType, `${hazard.name} - ship destroyed`, routeId);
  // Ship destroyed - clear pendingLaunch
  delete playerState.pendingLaunch;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `${hazard.name}! Ship destroyed!`,
    playerId,
    type: 'hazard'
  } as LogEntry);

  return { newState: state };
}

export { processHazardCheck, processRespondToHazard, checkHindenburgDisaster };

// CommonJS compatibility
module.exports = { processHazardCheck, processRespondToHazard, checkHindenburgDisaster };
