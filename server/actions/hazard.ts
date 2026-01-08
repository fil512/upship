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

const { GameRuleError } = require('../errors');
const { applyCityBonus, CITY_BONUSES } = require('../data/cities');
const { shuffleArray } = require('../utils/random');
const { processCompleteMission, resolveFlakCheck, calculateEquipmentBonus } = require('./combatMission');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');
const { HANGAR_CAPACITY, REPAIR_CAPACITY } = require('./building');
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
interface ExtendedPendingLaunch extends PendingLaunch {
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
  gasLossOnFailure?: boolean;
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
 * Get the relevant ship stat for a hazard's challenge type
 */
function getRelevantStat(shipStats: Record<string, number>, challengeType: string): number {
  switch (challengeType) {
    case 'speed':
      return shipStats.speed || 0;
    case 'reliability':
      return shipStats.reliability || 0;
    case 'ceiling':
      return shipStats.ceiling || 0;
    case 'range':
      return shipStats.range || 0;
    default:
      return shipStats.reliability || 0;
  }
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

  if (hazard.autoPass || hazard.type === 'clear_weather') {
    return resolveHazardSuccess(state, playerId, route, hazard, 'Clear Weather - Auto Pass');
  }

  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  if (isFireHazard && gasType === 'helium') {
    return resolveHazardSuccess(state, playerId, route, hazard, 'Fire Immunity (Helium) - Auto Pass');
  }

  const playerBlueprint = playerState.blueprint;
  const hasCondictiveCovering = playerBlueprint?.fabricSlots?.some(
    (fabric: SlotEntry) => fabric === 'conductive_covering' || (fabric && typeof fabric === 'object' && fabric.id === 'conductive_covering')
  );

  if (hazard.type === 'static_discharge' && hasCondictiveCovering) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)');
  }

  const hasRapidDescentSystem = playerBlueprint?.componentSlots?.some(
    (comp: SlotEntry) => comp === 'rapid_descent_system' || (comp && typeof comp === 'object' && comp.id === 'rapid_descent_system')
  );

  const extendedHazard = hazard as HazardCard & { hazardType?: string };
  if (extendedHazard.hazardType === 'weather' && hasRapidDescentSystem) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      'Weather Hazard - Auto Pass (Rapid Descent System enables emergency venting)');
  }

  // Check for The Weatherman card bonus: ignoreWeather
  if (extendedHazard.hazardType === 'weather' && playerState.launchBonuses?.ignoreWeather) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      'Weather Hazard - Auto Pass (The Weatherman ignores weather hazards)');
  }

  const hasFireResistantFabric = playerBlueprint?.fabricSlots?.some(
    (fabric: SlotEntry) => fabric === 'fire_resistant_fabric' || (fabric && typeof fabric === 'object' && fabric.id === 'fire_resistant_fabric')
  );
  const fireProtectionAvailable = hasFireResistantFabric && !playerState.fireProtectionUsedThisAge;

  if (isFireHazard && fireProtectionAvailable) {
    playerState.fireProtectionUsedThisAge = true;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Fire-Resistant Fabric activated! Auto-passing ${hazard.name}.`,
      playerId,
      type: 'action'
    } as LogEntry);

    return resolveHazardSuccess(state, playerId, route, hazard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)');
  }

  if (isFireHazard && gasType === 'hydrogen') {
    return resolveFireHazard(state, playerId, hazard, engineersToSpend, route);
  }

  const challengeType = hazard.challengeType || 'reliability';
  let relevantStat = getRelevantStat(shipStats, challengeType);
  const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);

  // Apply card bonuses from Kite Jockey/Scrutineer (+2 Reliability)
  if (challengeType === 'reliability' && playerState.launchBonuses?.reliability) {
    relevantStat += playerState.launchBonuses.reliability;
  }
  // Apply Helmsman speed bonus (+1 Speed)
  if (challengeType === 'speed' && playerState.launchBonuses?.speed) {
    relevantStat += playerState.launchBonuses.speed;
  }

  let weatherPenalty = 0;
  const hasFlexibleFrame = playerBlueprint?.frameSlots?.some(
    (frame: SlotEntry) => frame === 'flexible_frame' || (frame && typeof frame === 'object' && frame.id === 'flexible_frame')
  );
  const isWeatherHazard = extendedHazard.hazardType === 'weather';

  if (hasFlexibleFrame && isWeatherHazard && challengeType === 'reliability') {
    weatherPenalty = 1;
    relevantStat = Math.max(0, relevantStat - weatherPenalty);
  }

  const totalCheck = relevantStat + engineerBonus;
  const success = totalCheck >= hazard.difficulty;

  if (engineerBonus > 0) {
    playerState.engineers -= engineerBonus;
    // Log engineer consumption for hazard check
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineerBonus, 'hazard', `Hazard check: ${hazard.name}`, playerState.engineers);
  }

  const checkDetails = {
    hazardType: hazard.type,
    challengeType,
    difficulty: hazard.difficulty,
    statValue: relevantStat,
    engineersSpent: engineerBonus,
    totalCheck,
    success
  };

  playerState.lastHazardCheck = checkDetails;

  if (success) {
    return resolveHazardSuccess(state, playerId, route, hazard,
      `${challengeType.toUpperCase()} check passed: ${totalCheck} >= ${hazard.difficulty}`);
  } else {
    return resolveHazardAbort(state, playerId, hazard,
      `${challengeType.toUpperCase()} check failed: ${totalCheck} < ${hazard.difficulty}`);
  }
}

/**
 * Apply insurance policy to recover crashed ship per Section 6.11
 * Ships are tokens - recovery means incrementing hangarShips counter
 */
function applyInsuranceRecovery(state: GameState, playerId: string, hazardName: string): boolean {
  const playerState = state.players[playerId] as HazardPlayerState;
  const insurancePolicies = playerState.insurance || 0;

  if (insurancePolicies > 0) {
    playerState.insurance = insurancePolicies - 1;
    // Ship recovered - increment hangar counter
    playerState.hangarShips = Math.min(HANGAR_CAPACITY, (playerState.hangarShips || 0) + 1);
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
    const reliabilityStat = shipStats.reliability || 0;
    const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);
    const totalCheck = reliabilityStat + engineerBonus;

    if (engineerBonus > 0) {
      playerState.engineers -= engineerBonus;
      // Log engineer consumption for static discharge
      const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
      const faction = playerState.faction || 'unknown';
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineerBonus, 'hazard', 'Static discharge', playerState.engineers);
    }

    if (totalCheck >= hazard.difficulty) {
      return resolveHazardSuccess(state, playerId, route, hazard,
        `Static Discharge Reliability check passed: ${totalCheck} >= ${hazard.difficulty}`);
    } else {
      if (applyInsuranceRecovery(state, playerId, 'STATIC DISCHARGE')) {
        logOutcome(state, playerId, 'destroyed', hazard, gasType, `Static Discharge failed (${totalCheck} < ${hazard.difficulty}), recovered by insurance`, routeId);
        return { newState: state };
      }

      // Log before clearing pendingLaunch
      logOutcome(state, playerId, 'destroyed', hazard, gasType, `Static Discharge Reliability check failed: ${totalCheck} < ${hazard.difficulty}`, routeId);
      // Ship destroyed - clear pendingLaunch
      delete playerState.pendingLaunch;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `STATIC DISCHARGE! Reliability check failed (${totalCheck} < ${hazard.difficulty}). Ship destroyed!`,
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
    // Ship damaged - move to repair bay
    playerState.repairShips = Math.min(REPAIR_CAPACITY, (playerState.repairShips || 0) + 1);
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
      // Return ship to hangar
      playerState.hangarShips = Math.min(HANGAR_CAPACITY, (playerState.hangarShips || 0) + 1);
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

  // Log aborted outcome
  logOutcome(state, playerId, 'aborted', hazard, gasType, message, routeId);

  // Ship returns to hangar - increment counter
  playerState.hangarShips = Math.min(HANGAR_CAPACITY, (playerState.hangarShips || 0) + 1);
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

  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  if (isFireHazard && hazard.engineerCost !== undefined) {
    const engineerCost = hazard.engineerCost;
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineerCost) {
      playerState.engineers -= engineerCost;
      // Ship damaged - move to repair bay
      playerState.repairShips = Math.min(REPAIR_CAPACITY, (playerState.repairShips || 0) + 1);
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

  if (hazard.type === 'static_discharge') {
    const reliabilityStat = shipStats.reliability || 0;
    const engineersNeeded = hazard.engineersNeeded || Math.max(0, hazard.difficulty - reliabilityStat);
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineersNeeded) {
      playerState.engineers -= engineersNeeded;
      // Log engineer consumption for static discharge response
      const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
      const faction = playerState.faction || 'unknown';
      resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineersNeeded, 'hazard', 'Static discharge response', playerState.engineers);
      return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
        `Static Discharge Reliability check passed: ${reliabilityStat + engineersNeeded} >= ${hazard.difficulty}`, cityChoice);
    } else if (!spendEngineers || availableEngineers < engineersNeeded) {
      return resolveFireCrash(state, playerId, hazard as HazardCard);
    }
  }

  const availableEngineers = playerState.engineers || 0;
  const engineersNeeded = hazard.engineersNeeded || 0;
  const relevantStat = hazard.relevantStat || 0;

  if (engineersNeeded === 0) {
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} >= ${hazard.difficulty}`, cityChoice);
  }

  if (spendEngineers && availableEngineers >= engineersNeeded) {
    playerState.engineers -= engineersNeeded;
    // Log engineer consumption for hazard response
    const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
    const faction = playerState.faction || 'unknown';
    resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', engineersNeeded, 'hazard', `Hazard response: ${hazard.name}`, playerState.engineers);
    return resolveHazardSuccess(state, playerId, route, hazard as HazardCard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} + ${engineersNeeded} engineers >= ${hazard.difficulty}`, cityChoice);
  } else {
    return resolveHazardAbort(state, playerId, hazard as HazardCard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} failed: chose to abort rather than spend ${engineersNeeded} engineers`);
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
