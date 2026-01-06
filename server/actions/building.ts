/**
 * Building Actions
 * BUILD_SHIP action processor
 */

import type { GameState, PlayerState, Ship, LogEntry, Blueprint } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES, calculateShipStats } = require('../data/upgrades');
const { generateId } = require('../utils/random');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

// Extended blueprint type with gas sockets
type ExtendedBlueprint = Blueprint & {
  gasSockets?: string[];
};

// Extended player state with building-related properties
type BuildPlayerState = Omit<PlayerState, 'blueprint'> & {
  buildDiscount?: number;
  blueprint: ExtendedBlueprint;
};

interface BuildShipData {
  count?: number;
  _internal?: boolean;
}

/**
 * Build a ship at the Construction Hall
 *
 * Per Section 5.1: Actions execute IMMEDIATELY when placing an agent.
 * This action should only be called:
 * 1. Internally from processPlaceAgent when placing at construction_hall
 * 2. NOT directly during reveal phase or without proper agent placement
 */
function processBuildShip(state: GameState, playerId: string, data: BuildShipData): ActionResult {
  const { count = 1, _internal = false } = data;
  const playerState = state.players[playerId] as BuildPlayerState;
  const HANGAR_CAPACITY = 3; // Per Section 4.4 and 6.3

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
  // Count ships currently in Launch Hangar (status === 'hangar')
  const ships = playerState.ships || [];
  const currentHangarCount = ships.filter(s => s.status === 'hangar').length;

  if (currentHangarCount + count > HANGAR_CAPACITY) {
    throw new GameRuleError(
      `Cannot build ${count} ship(s): would exceed hangar capacity of ${HANGAR_CAPACITY}. ` +
      `Current hangar: ${currentHangarCount} ships. Max you can build: ${HANGAR_CAPACITY - currentHangarCount}`
    );
  }

  // Calculate hull cost from installed upgrades
  let hullCost = 2; // Base cost

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

  playerState.cash -= totalCost;

  // Initialize ships array if needed
  if (!playerState.ships) {
    playerState.ships = [];
  }

  // Calculate ship stats from blueprint at build time
  // This captures the stats when the ship was built (lift comes from gas_socket on frame tiles)
  const shipStats = calculateShipStats(playerState.blueprint, {}, state.age);
  const lift = shipStats.lift;

  // Calculate weight from frame/fabric upgrades
  let weight = 0;
  for (const upgradeId of [...(playerState.blueprint.frameSlots || []), ...(playerState.blueprint.fabricSlots || [])]) {
    if (upgradeId && UPGRADES[upgradeId]?.weight) {
      weight += UPGRADES[upgradeId].weight;
    }
  }

  // Add ships to hangar with stats
  for (let i = 0; i < count; i++) {
    const newShip: Ship = {
      id: generateId('ship'),
      status: 'hangar', // hangar, launched, damaged
      routeId: null,
      // Stats from blueprint at build time
      lift,
      weight,
      speed: shipStats.speed,
      range: shipStats.range,
      ceiling: shipStats.ceiling,
      reliability: shipStats.reliability,
      luxury: shipStats.luxury
    };
    playerState.ships.push(newShip);
  }

  // Clear buildDiscount after use (it's a per-action bonus)
  playerState.buildDiscount = 0;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: buildDiscount > 0
      ? `Built ${count} ship(s) for £${totalCost} (£${effectiveHullCost}/ship, £${buildDiscount} Rigger discount applied)`
      : `Built ${count} ship(s) for £${totalCost} (£${effectiveHullCost}/ship)`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface RepairShipData {
  shipId: string;
}

/**
 * Repair a damaged ship
 * Per Section 4.4/8.4: Repair Cost: £3 + 1 Engineer per ship to move from Repair Hangar to Launch Hangar
 */
function processRepairShip(state: GameState, playerId: string, data: RepairShipData): ActionResult {
  const { shipId } = data;
  const playerState = state.players[playerId];
  const REPAIR_COST_CASH = 3; // £3 per Section 4.4
  const REPAIR_COST_ENGINEER = 1; // 1 Engineer per Section 8.4

  // Find the ship
  const ships = playerState.ships || [];
  const shipIndex = ships.findIndex(s => s.id === shipId);

  if (shipIndex === -1) {
    throw new GameRuleError(`Ship not found: ${shipId}`);
  }

  const ship = ships[shipIndex];

  // Check if ship is damaged
  if (ship.status !== 'damaged') {
    throw new GameRuleError('Ship is not damaged and does not need repair');
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

  // Move ship from Repair Hangar to Launch Hangar
  ship.status = 'hangar';
  (ship as Ship & { damaged?: boolean }).damaged = false;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Repaired ship for £${REPAIR_COST_CASH} + ${REPAIR_COST_ENGINEER} Engineer`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export { processBuildShip, processRepairShip };

// CommonJS compatibility
module.exports = { processBuildShip, processRepairShip };
