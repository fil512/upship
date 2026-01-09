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

const TOTAL_SHIP_CAPACITY = 6; // Per Section 4.4: 6 ships total (Launch + Repair combined)
const HANGAR_CAPACITY = 3; // Maximum ships in Launch Hangar (ready to launch)
const REPAIR_CAPACITY = 3; // Maximum ships in Repair Bay (damaged, need repair)

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

  // Per Section 4.4: 6 ships total (Launch Hangar + Repair Hangar combined)
  const currentHangarCount = playerState.hangarShips || 0;
  const currentRepairCount = playerState.repairShips || 0;
  const totalShips = currentHangarCount + currentRepairCount;

  if (totalShips + count > TOTAL_SHIP_CAPACITY) {
    throw new GameRuleError(
      `Cannot build ${count} ship(s): would exceed fleet capacity of ${TOTAL_SHIP_CAPACITY}. ` +
      `Current fleet: ${totalShips} ships (${currentHangarCount} ready, ${currentRepairCount} damaged). ` +
      `Max you can build: ${TOTAL_SHIP_CAPACITY - totalShips}`
    );
  }

  // Calculate hull cost from ALL installed tech tiles
  // Formula: sum of hullCost from every installed tile
  let hullCost = 0;

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

  // Add Drive hull costs
  for (const upgradeId of playerState.blueprint.driveSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Gas hull costs
  for (const upgradeId of playerState.blueprint.gasSockets || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Component hull costs
  for (const upgradeId of playerState.blueprint.componentSlots || []) {
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

interface RepairShipData {
  count?: number;
  _internal?: boolean;
}

/**
 * Calculate hull cost from blueprint (for repair cost calculation)
 * Matches the calculation in processBuildShip
 */
function calculateHullCost(playerState: BuildPlayerState): number {
  let hullCost = 0;

  // Add Frame hull costs
  for (const upgradeId of playerState.blueprint.frameSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Fabric hull costs
  for (const upgradeId of playerState.blueprint.fabricSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Drive hull costs
  for (const upgradeId of playerState.blueprint.driveSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Gas hull costs
  for (const upgradeId of playerState.blueprint.gasSockets || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  // Add Component hull costs
  for (const upgradeId of playerState.blueprint.componentSlots || []) {
    if (upgradeId && UPGRADES[upgradeId]?.hullCost) {
      hullCost += UPGRADES[upgradeId].hullCost;
    }
  }

  return hullCost;
}

/**
 * Repair damaged ships at the Repair action space
 * Per Section 6.15/8.4: Repair Cost per ship = floor(Hull Cost / 2) + 1 Engineer
 * Repairs are ONLY available at the Repair worker placement action space
 */
function processRepairShip(state: GameState, playerId: string, data: RepairShipData): ActionResult {
  const { count = 1, _internal = false } = data;
  const playerState = state.players[playerId] as BuildPlayerState;

  // Repairs only happen at the Repair action space during worker placement
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'REPAIR_SHIP not allowed: Repairs are only available at the Repair action space during worker placement. ' +
        'Place an agent at Repair to repair ships.'
      );
    }

    const placement = state.groundBoard?.placements?.repair;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'REPAIR_SHIP not allowed: You must place an agent at Repair to repair ships. ' +
        'Use PLACE_AGENT with locationId "repair" and repairCount parameter.'
      );
    }
  }

  // Check if player has ships to repair
  const repairShips = playerState.repairShips || 0;
  if (repairShips <= 0) {
    throw new GameRuleError('No ships in repair bay to repair');
  }

  if (count > repairShips) {
    throw new GameRuleError(
      `Cannot repair ${count} ship(s): only ${repairShips} damaged ship(s) available`
    );
  }

  // Calculate repair cost per ship: floor(Hull Cost / 2) + 1 Engineer
  const hullCost = calculateHullCost(playerState);
  const cashCostPerShip = Math.floor(hullCost / 2);
  const engineerCostPerShip = 1;

  const totalCashCost = cashCostPerShip * count;
  const totalEngineerCost = engineerCostPerShip * count;

  // Check if player can afford repair (cash)
  if (playerState.cash < totalCashCost) {
    throw new InsufficientFundsError(totalCashCost, playerState.cash);
  }

  // Check if player has enough engineers
  const availableEngineers = playerState.engineers || 0;
  if (availableEngineers < totalEngineerCost) {
    throw new GameRuleError(
      `Not enough Engineers: need ${totalEngineerCost}, have ${availableEngineers}`
    );
  }

  // Pay repair cost (cash)
  playerState.cash -= totalCashCost;

  // Pay repair cost (engineers)
  playerState.engineers = availableEngineers - totalEngineerCost;

  // Log engineer consumption
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'engineers', totalEngineerCost, 'repair', 'Ship repair labor', playerState.engineers);

  // Move ships from Repair Bay to Launch Hangar
  const hangarShips = playerState.hangarShips || 0;
  playerState.repairShips = repairShips - count;
  playerState.hangarShips = hangarShips + count;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Repaired ${count} ship(s) for £${totalCashCost} + ${totalEngineerCost} Engineer(s) (£${cashCostPerShip}/ship from Hull Cost £${hullCost})`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export { processBuildShip, processRepairShip, TOTAL_SHIP_CAPACITY, HANGAR_CAPACITY, REPAIR_CAPACITY, calculateHullCost };

// CommonJS compatibility
module.exports = { processBuildShip, processRepairShip, TOTAL_SHIP_CAPACITY, HANGAR_CAPACITY, REPAIR_CAPACITY, calculateHullCost };
