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

module.exports = { processBuildShip };
