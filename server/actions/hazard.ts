/**
 * Hazard Actions
 * PERFORM_HAZARD_CHECK action processor
 * Implements hazard checks per Section 8.2, fire hazards per Section 8.3, and Hindenburg Disaster (Section 1.2)
 */

import type { GameState, PlayerState, Ship, Route, LogEntry, HazardCard } from '@upship/api';

// Type alias for slot entries (can be string ID or object with id)
type SlotEntry = string | { id: string } | null;

const { GameRuleError } = require('../errors');
const { applyCityBonus, CITY_BONUSES } = require('../data/cities');
const { shuffleArray } = require('../utils/random');
const { processCompleteMission, resolveFlakCheck, calculateEquipmentBonus } = require('./combatMission');

interface ActionResult {
  newState: GameState;
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
};

type HazardShip = Ship & {
  stats?: Record<string, number>;
  pendingRouteId?: string;
  pendingMissionId?: string;
  pendingCityChoice?: string;
  pendingHazard?: HazardCardDetails;
  armor?: number;
  gasType?: 'hydrogen' | 'helium';
  launchedAge?: number;
  route?: string | null;
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
  claimedBy?: { playerId: string; shipId: string; round: number };
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
  shipId: string;
  engineersToSpend?: number | string;
}

/**
 * Perform a hazard check for a ship awaiting launch
 */
function processHazardCheck(state: GameState, playerId: string, data: HazardCheckData): ActionResult {
  const { shipId } = data;
  const engineersToSpend = Math.max(0, parseInt(String(data.engineersToSpend), 10) || 0);
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;

  const ships = playerState.ships || [];
  let shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'awaiting_hazard');

  if (shipIndex === -1) {
    shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'on_route');
  }

  if (shipIndex === -1) {
    throw new GameRuleError('No ship awaiting hazard check');
  }

  const ship = ships[shipIndex] as HazardShip;
  const shipStats = ship.stats || { speed: 0, reliability: 0, ceiling: 0, range: 0 };

  const pendingRouteId = ship.pendingRouteId || ship.routeId || ship.route;
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
    gasType: ship.gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  };

  const isHindenburgDisaster = checkHindenburgDisaster(hindenburgConditions);

  if (isHindenburgDisaster) {
    ships[shipIndex].status = 'destroyed';
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

  if (hazard.autoPass || hazard.type === 'clear_weather') {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Clear Weather - Auto Pass');
  }

  const isFireHazard = hazard.category === 'fire' || hazard.hydrogenOnly;
  if (isFireHazard && ship.gasType === 'helium') {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Fire Immunity (Helium) - Auto Pass');
  }

  const playerBlueprint = playerState.blueprint;
  const hasCondictiveCovering = playerBlueprint?.fabricSlots?.some(
    (fabric: SlotEntry) => fabric === 'conductive_covering' || (fabric && typeof fabric === 'object' && fabric.id === 'conductive_covering')
  );

  if (hazard.type === 'static_discharge' && hasCondictiveCovering) {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)');
  }

  const hasRapidDescentSystem = playerBlueprint?.componentSlots?.some(
    (comp: SlotEntry) => comp === 'rapid_descent_system' || (comp && typeof comp === 'object' && comp.id === 'rapid_descent_system')
  );

  const extendedHazard = hazard as HazardCard & { hazardType?: string };
  if (extendedHazard.hazardType === 'weather' && hasRapidDescentSystem) {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Weather Hazard - Auto Pass (Rapid Descent System enables emergency venting)');
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

    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)');
  }

  if (isFireHazard && ship.gasType === 'hydrogen') {
    return resolveFireHazard(state, playerId, shipIndex, ship, hazard, engineersToSpend, route);
  }

  const challengeType = hazard.challengeType || 'reliability';
  let relevantStat = getRelevantStat(shipStats, challengeType);
  const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);

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

  if (!playerState.lastHazardCheck) {
    playerState.lastHazardCheck = {};
  }
  playerState.lastHazardCheck[shipId] = checkDetails;

  if (success) {
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${challengeType.toUpperCase()} check passed: ${totalCheck} >= ${hazard.difficulty}`);
  } else {
    return resolveHazardAbort(state, playerId, shipIndex, hazard,
      `${challengeType.toUpperCase()} check failed: ${totalCheck} < ${hazard.difficulty}`);
  }
}

/**
 * Apply insurance policy to recover crashed ship per Section 6.11
 */
function applyInsuranceRecovery(state: GameState, playerId: string, shipIndex: number, hazardName: string): boolean {
  const playerState = state.players[playerId] as HazardPlayerState;
  const ships = playerState.ships as HazardShip[];
  const insurancePolicies = playerState.insurance || 0;

  if (insurancePolicies > 0) {
    playerState.insurance = insurancePolicies - 1;
    ships[shipIndex].status = 'hangar';
    delete ships[shipIndex].pendingRouteId;
    delete ships[shipIndex].route;

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
 */
function resolveFireHazard(state: GameState, playerId: string, shipIndex: number, ship: HazardShip, hazard: HazardCard, engineersToSpend: number, route: ExtendedRoute | undefined): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const ships = playerState.ships as HazardShip[];

  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    ships[shipIndex].status = 'destroyed';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `CATASTROPHIC EXPLOSION! Ship destroyed - no save possible.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  }

  if (hazard.type === 'static_discharge') {
    const shipStats = ship.stats || {};
    const reliabilityStat = shipStats.reliability || 0;
    const engineerBonus = Math.min(engineersToSpend, playerState.engineers || 0);
    const totalCheck = reliabilityStat + engineerBonus;

    if (engineerBonus > 0) {
      playerState.engineers -= engineerBonus;
    }

    if (totalCheck >= hazard.difficulty) {
      return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
        `Static Discharge Reliability check passed: ${totalCheck} >= ${hazard.difficulty}`);
    } else {
      if (applyInsuranceRecovery(state, playerId, shipIndex, 'STATIC DISCHARGE')) {
        return { newState: state };
      }

      ships[shipIndex].status = 'destroyed';

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
    playerState.engineers -= engineerCost;
    ships[shipIndex].status = 'damaged';

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged.`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    return { newState: state };
  } else {
    if (applyInsuranceRecovery(state, playerId, shipIndex, hazard.name || 'Fire Hazard')) {
      return { newState: state };
    }

    ships[shipIndex].status = 'destroyed';

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
 */
function resolveHazardSuccess(state: GameState, playerId: string, shipIndex: number, route: ExtendedRoute | undefined, hazard: HazardCard, message: string): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;
  const ships = playerState.ships as HazardShip[];
  const ship = ships[shipIndex];

  if (ship.pendingMissionId && state.age === 2) {
    const mission = hazardState.missionRow?.find(m => m.id === ship.pendingMissionId);
    if (!mission) {
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Error: Mission ${ship.pendingMissionId} not found in Mission Row`,
        playerId,
        type: 'error'
      } as LogEntry);
      ships[shipIndex].status = 'hangar';
      delete ships[shipIndex].pendingMissionId;
      return { newState: state };
    }

    const bonusIncome = calculateEquipmentBonus(playerState, mission);

    processCompleteMission(state, playerId, {
      ...mission,
      income: mission.income + bonusIncome
    });

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Hazard check PASSED (${hazard.type}): ${message}`,
      playerId,
      type: 'hazard'
    } as LogEntry);

    const flakResult = resolveFlakCheck(ship, hazard);

    if (flakResult.destroyed) {
      ships[shipIndex].status = 'destroyed';
      delete ships[shipIndex].pendingMissionId;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `FLAK! ${flakResult.reason}. Mission completed but ship lost to anti-aircraft fire.`,
        playerId,
        type: 'hazard'
      } as LogEntry);
    } else {
      ships[shipIndex].status = 'on_route';
      (ships[shipIndex] as HazardShip & { missionId?: string }).missionId = ship.pendingMissionId;
      delete ships[shipIndex].pendingMissionId;
      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${flakResult.reason}. Ship survived and mission complete.`,
        playerId,
        type: 'action'
      } as LogEntry);
    }

    return { newState: state };
  }

  ships[shipIndex].status = 'on_route';
  (ships[shipIndex] as HazardShip & { routeId?: string | null }).routeId = route?.id || null;
  const pendingCityChoice = ship.pendingCityChoice;
  delete ships[shipIndex].pendingRouteId;
  delete ships[shipIndex].pendingCityChoice;

  if (route) {
    route.claimed = playerId;
    route.claimedBy = {
      playerId,
      shipId: ships[shipIndex].id,
      round: state.round
    };
    playerState.income += route.income || 0;

    if (CITY_BONUSES) {
      const cityName = pendingCityChoice || route.to || route.from;
      applyCityBonus(playerState, cityName, state, playerId);
    }
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check PASSED (${hazard.type}): ${message}`,
    playerId,
    type: 'hazard'
  } as LogEntry);

  return { newState: state };
}

/**
 * Resolve aborted launch - ship returns to hangar
 */
function resolveHazardAbort(state: GameState, playerId: string, shipIndex: number, hazard: HazardCard, message: string): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const ships = playerState.ships as HazardShip[];

  ships[shipIndex].status = 'hangar';
  delete ships[shipIndex].pendingRouteId;
  delete ships[shipIndex].pendingMissionId;
  delete ships[shipIndex].route;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Hazard check FAILED (${hazard.type}): ${message}. Launch aborted - ship returns to hangar.`,
    playerId,
    type: 'hazard'
  } as LogEntry);

  return { newState: state };
}

interface RespondToHazardData {
  shipId: string;
  spendEngineers?: boolean;
}

/**
 * Process player's response to a pending hazard check
 */
function processRespondToHazard(state: GameState, playerId: string, data: RespondToHazardData): ActionResult {
  const { shipId } = data;
  const spendEngineers = data.spendEngineers === true;
  const playerState = state.players[playerId] as HazardPlayerState;
  const hazardState = state as HazardState;

  const ships = playerState.ships as HazardShip[];
  const shipIndex = ships.findIndex(s => s.id === shipId && s.status === 'awaiting_hazard' && s.pendingHazard);

  if (shipIndex === -1) {
    throw new GameRuleError('No ship awaiting hazard response');
  }

  const ship = ships[shipIndex];
  const hazard = ship.pendingHazard!;
  const pendingRouteId = ship.pendingRouteId;
  const route = (state.map?.routes as ExtendedRoute[] | undefined)?.find(r => r.id === pendingRouteId);

  const isLuxuryRoute = !!route?.luxury;
  if (checkHindenburgDisaster({
    age: state.age,
    gasType: ship.gasType,
    isLuxuryRoute,
    hazardType: hazard.type
  })) {
    ships[shipIndex].status = 'destroyed';
    delete ships[shipIndex].pendingHazard;

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
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Clear Weather - Auto Pass');
  }

  if (hazard.heliumFireImmunity) {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard, 'Fire Immunity (Helium) - Auto Pass');
  }

  if (hazard.conductiveCoveringImmunity) {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Static Discharge - Auto Pass (Conductive Covering grounds electrical charge)');
  }

  if (hazard.fireResistantFabricAvailable) {
    playerState.fireProtectionUsedThisAge = true;
    delete ships[shipIndex].pendingHazard;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Fire-Resistant Fabric activated! Auto-passing ${hazard.name}.`,
      playerId,
      type: 'action'
    } as LogEntry);

    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      'Fire Hazard - Auto Pass (Fire-Resistant Fabric, once per Age)');
  }

  if (hazard.noSave || hazard.type === 'catastrophic_explosion') {
    ships[shipIndex].status = 'destroyed';
    delete ships[shipIndex].pendingHazard;

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
      ships[shipIndex].status = 'damaged';
      delete ships[shipIndex].pendingHazard;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `${hazard.name} controlled! Spent ${engineerCost} Engineer(s). Ship damaged.`,
        playerId,
        type: 'hazard'
      } as LogEntry);

      return { newState: state };
    } else {
      return resolveFireCrash(state, playerId, shipIndex, hazard);
    }
  }

  if (hazard.type === 'static_discharge') {
    const shipStats = ship.stats || {};
    const reliabilityStat = shipStats.reliability || 0;
    const engineersNeeded = hazard.engineersNeeded || Math.max(0, hazard.difficulty - reliabilityStat);
    const availableEngineers = playerState.engineers || 0;

    if (spendEngineers && availableEngineers >= engineersNeeded) {
      playerState.engineers -= engineersNeeded;
      delete ships[shipIndex].pendingHazard;
      return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
        `Static Discharge Reliability check passed: ${reliabilityStat + engineersNeeded} >= ${hazard.difficulty}`);
    } else if (!spendEngineers || availableEngineers < engineersNeeded) {
      return resolveFireCrash(state, playerId, shipIndex, hazard);
    }
  }

  const availableEngineers = playerState.engineers || 0;
  const engineersNeeded = hazard.engineersNeeded || 0;
  const relevantStat = hazard.relevantStat || 0;

  if (engineersNeeded === 0) {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} >= ${hazard.difficulty}`);
  }

  if (spendEngineers && availableEngineers >= engineersNeeded) {
    playerState.engineers -= engineersNeeded;
    delete ships[shipIndex].pendingHazard;
    return resolveHazardSuccess(state, playerId, shipIndex, route, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} passed: ${relevantStat} + ${engineersNeeded} engineers >= ${hazard.difficulty}`);
  } else {
    delete ships[shipIndex].pendingHazard;
    return resolveHazardAbort(state, playerId, shipIndex, hazard,
      `${hazard.statName?.toUpperCase() || 'CHECK'} failed: chose to abort rather than spend ${engineersNeeded} engineers`);
  }
}

/**
 * Resolve fire crash - ship destroyed (with insurance check)
 */
function resolveFireCrash(state: GameState, playerId: string, shipIndex: number, hazard: HazardCard): ActionResult {
  const playerState = state.players[playerId] as HazardPlayerState;
  const ships = playerState.ships as HazardShip[];

  if (applyInsuranceRecovery(state, playerId, shipIndex, hazard.name || 'Fire Hazard')) {
    delete ships[shipIndex].pendingHazard;
    return { newState: state };
  }

  ships[shipIndex].status = 'destroyed';
  delete ships[shipIndex].pendingHazard;

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
