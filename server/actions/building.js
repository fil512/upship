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
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { count }
 * @returns {Object} { newState } or throws error
 */
function processBuildShip(state, playerId, data) {
  const { count = 1 } = data;
  const playerState = state.players[playerId];
  const HANGAR_CAPACITY = 3; // Per Section 4.4 and 6.3

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

  const totalCost = hullCost * count;

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

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Built ${count} ship(s) for £${totalCost} (£${hullCost}/ship)`,
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
