/**
 * Building Actions
 * BUILD_SHIP and REPAIR_SHIP action processors
 *
 * Ships are tokens, not individual entities with stats.
 * Ship stats come from the current blueprint at launch time.
 */

import type { GameState, PlayerState, LogEntry, Blueprint } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES } = require('../data/upgrades');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

// Extended blueprint type with gas sockets
type ExtendedBlueprint = Blueprint & {
  gasSockets?: string[];
};

// Extended player state with building-related properties
type BuildPlayerState = PlayerState & {
  buildDiscount?: number;
  ignoreFrameCost?: boolean;
  blueprint: ExtendedBlueprint;
};

interface BuildShipData {
  count?: number;
  _internal?: boolean;
}

const HANGAR_CAPACITY = 3; // Per Section 4.4 and 6.3
const REPAIR_CAPACITY = 3; // Max ships in repair bay

/**
 * Build a ship at the Construction Hall
 *
 * Per Section 5.1: Actions execute IMMEDIATELY when placing an agent.
 * Ships are tokens - stats come from blueprint at launch time, not build time.
 */
function processBuildShip(state: GameState, playerId: string, data: BuildShipData): ActionResult {
  const { count = 1, _internal = false } = data;
  const playerState = state.players[playerId] as BuildPlayerState;

  // Per Section 5.1: Actions execute when placing agent, not separately
  // Only allow direct calls during worker_placement when player has agent at construction_hall
  // Internal calls (from processPlaceAgent) bypass this check
  if (!_internal) {
    // Validate phase - build only happens during worker_placement via agent placement
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'BUILD_SHIP not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Construction Hall during worker placement phase to build ships.'
      );
    }

    // Validate the player has an agent at construction_hall
    const placement = state.groundBoard?.placements?.construction_hall;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'BUILD_SHIP not allowed: You must place an agent at Construction Hall to build ships. ' +
        'Use PLACE_AGENT with locationId "construction_hall" and buildCount parameter.'
      );
    }
  }

  // Per Section 6.3: "Limit: You may never have more than 3 ships in your Hangar at any time"
  const currentHangarCount = playerState.hangarShips || 0;

  if (currentHangarCount + count > HANGAR_CAPACITY) {
    throw new GameRuleError(
      `Cannot build ${count} ship(s): would exceed hangar capacity of ${HANGAR_CAPACITY}. ` +
      `Current hangar: ${currentHangarCount} ships. Max you can build: ${HANGAR_CAPACITY - currentHangarCount}`
    );
  }

  // Calculate hull cost from installed upgrades
  let hullCost = 2; // Base cost

  // Add Frame hull costs (unless Duralumin Man ignoreFrameCost is active)
  if (!playerState.ignoreFrameCost) {
    for (const upgradeId of playerState.blueprint.frameSlots || []) {
      if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
        hullCost += UPGRADES[upgradeId].hullCost;
      }
    }
  }

  // Add Fabric hull costs
  for (const upgradeId of playerState.blueprint.fabricSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // GAP-049: Apply Rigger card discount per ship (if any)
  const buildDiscount = playerState.buildDiscount || 0;
  const effectiveHullCost = Math.max(0, hullCost - buildDiscount);

  const totalCost = effectiveHullCost * count;

  if (playerState.cash < totalCost) {
    throw new InsufficientFundsError(totalCost, playerState.cash);
  }

  if (count > 3) {
    throw new GameRuleError('Can only build up to 3 ships per action');
  }

  // Pay the cost
  playerState.cash -= totalCost;

  // Add ships to hangar (ships are just counters now)
  playerState.hangarShips = (playerState.hangarShips || 0) + count;

  // Capture bonus info before clearing
  const hadFrameCostWaiver = playerState.ignoreFrameCost;

  // Clear build bonuses after use (they're per-action bonuses)
  playerState.buildDiscount = 0;
  playerState.ignoreFrameCost = false;

  // Build log message with applicable discounts
  const discountParts: string[] = [];
  if (buildDiscount > 0) discountParts.push(`£${buildDiscount} discount`);
  if (hadFrameCostWaiver) discountParts.push('frame costs waived');
  const discountMsg = discountParts.length > 0 ? `, ${discountParts.join(', ')}` : '';

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Built ${count} ship(s) for £${totalCost} (£${effectiveHullCost}/ship${discountMsg})`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

// Ships are fungible tokens - no shipId needed for repair
type RepairShipData = Record<string, never>;

/**
 * Repair a damaged ship
 * Per Section 4.4/8.4: Repair Cost: £3 + 1 Engineer per ship to move from Repair Hangar to Launch Hangar
 */
function processRepairShip(state: GameState, playerId: string, _data: RepairShipData): ActionResult {
  const playerState = state.players[playerId];
  const REPAIR_COST_CASH = 3; // £3 per Section 4.4
  const REPAIR_COST_ENGINEER = 1; // 1 Engineer per Section 8.4

  // Check if player has ships to repair
  const repairShips = playerState.repairShips || 0;
  if (repairShips <= 0) {
    throw new GameRuleError('No ships in repair bay to repair');
  }

  // Check hangar capacity
  const hangarShips = playerState.hangarShips || 0;
  if (hangarShips >= HANGAR_CAPACITY) {
    throw new GameRuleError(`Cannot repair: hangar is full (${HANGAR_CAPACITY} ships)`);
  }

  // Check if player can afford repair (cash)
  if (playerState.cash < REPAIR_COST_CASH) {
    throw new InsufficientFundsError(REPAIR_COST_CASH, playerState.cash);
  }

  // Check if player has enough engineers
  const availableEngineers = playerState.engineers || 0;
  if (availableEngineers < REPAIR_COST_ENGINEER) {
    throw new GameRuleError(`Not enough Engineers: need ${REPAIR_COST_ENGINEER}, have ${availableEngineers}`);
  }

  // Pay repair cost (cash)
  playerState.cash -= REPAIR_COST_CASH;

  // Pay repair cost (engineer)
  playerState.engineers = availableEngineers - REPAIR_COST_ENGINEER;

  // Log engineer consumption
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', REPAIR_COST_ENGINEER, 'repair', 'Ship repair labor', playerState.engineers);

  // Move ship from Repair Bay to Launch Hangar
  playerState.repairShips = repairShips - 1;
  playerState.hangarShips = hangarShips + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Repaired ship for £${REPAIR_COST_CASH} + ${REPAIR_COST_ENGINEER} Engineer`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export { processBuildShip, processRepairShip, HANGAR_CAPACITY, REPAIR_CAPACITY };

// CommonJS compatibility
module.exports = { processBuildShip, processRepairShip, HANGAR_CAPACITY, REPAIR_CAPACITY };
