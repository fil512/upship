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

// Per Section 4.4: 6 ships total in hangar (simplified system, no repair bay)
const TOTAL_SHIP_CAPACITY = 6;

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

  // Per Section 4.4: 6 ships total in hangar (no repair hangar in simplified system)
  const currentHangarCount = playerState.hangarShips || 0;

  if (currentHangarCount + count > TOTAL_SHIP_CAPACITY) {
    throw new GameRuleError(
      `Cannot build ${count} ship(s): would exceed fleet capacity of ${TOTAL_SHIP_CAPACITY}. ` +
      `Current fleet: ${currentHangarCount} ships in hangar. ` +
      `Max you can build: ${TOTAL_SHIP_CAPACITY - currentHangarCount}`
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

// NOTE: RepairShipData and processRepairShip removed - no repair bay in simplified hazard system

/**
 * Calculate hull cost from blueprint
 * Used for ship build cost calculation
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

// NOTE: processRepairShip removed - no repair bay in simplified hazard system

export { processBuildShip, TOTAL_SHIP_CAPACITY, calculateHullCost };

// CommonJS compatibility
module.exports = { processBuildShip, TOTAL_SHIP_CAPACITY, calculateHullCost };
