/**
 * Building Actions
 * BUILD_SHIP action processor
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES } = require('../data/upgrades');
const { generateId } = require('../utils/random');

/**
 * Build a ship at the Construction Hall
 *
 * Per Section 5.1: Actions execute IMMEDIATELY when placing an agent.
 * This action should only be called:
 * 1. Internally from processPlaceAgent when placing at construction_hall
 * 2. NOT directly during reveal phase or without proper agent placement
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { count, _internal }
 * @returns {Object} { newState } or throws error
 */
function processBuildShip(state, playerId, data) {
  const { count = 1, _internal = false } = data;
  const playerState = state.players[playerId];
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

  // Add ships to hangar
  for (let i = 0; i < count; i++) {
    playerState.ships.push({
      id: generateId('ship'),
      status: 'hangar', // hangar, launched, damaged
      route: null
    });
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
  });

  return { newState: state };
}

/**
 * Repair a damaged ship
 * Per Section 4.4: Repair Cost: £3 per ship to move from Repair Hangar to Launch Hangar
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { shipId }
 * @returns {Object} { newState } or throws error
 */
function processRepairShip(state, playerId, data) {
  const { shipId } = data;
  const playerState = state.players[playerId];
  const REPAIR_COST = 3; // £3 per Section 4.4

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

  // Check if player can afford repair
  if (playerState.cash < REPAIR_COST) {
    throw new InsufficientFundsError(REPAIR_COST, playerState.cash);
  }

  // Pay repair cost
  playerState.cash -= REPAIR_COST;

  // Move ship from Repair Hangar to Launch Hangar
  ship.status = 'hangar';
  ship.damaged = false;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Repaired ship for £${REPAIR_COST}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = { processBuildShip, processRepairShip };
