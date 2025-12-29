/**
 * Blueprint Actions
 * INSTALL_UPGRADE, REMOVE_UPGRADE action processors
 * Implements Section 6.2 (Design Bureau) including Hull Upgrade Rule and swap limits
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { UPGRADES, TECHNOLOGIES } = require('../data/upgrades');

/**
 * Calculate effective swap limit for player per Section 6.2 and Appendix D
 * Base swaps: Germany/USA 2, Britain 1, Italy 4
 * Modular Frame upgrade grants +2 swaps per Appendix D
 */
function getEffectiveSwapLimit(playerState) {
  const baseSwaps = playerState.upgradeSwaps || 2;

  // GAP-047: Check if Modular Frame is installed, granting +2 swaps
  const hasModularFrame = playerState.blueprint?.frameSlots?.some(
    frame => frame === 'modular_frame' || frame?.id === 'modular_frame'
  );

  return baseSwaps + (hasModularFrame ? 2 : 0);
}

/**
 * Calculate hull cost for an upgrade
 * Only Frame and Fabric upgrades contribute to hull cost per Section 7.1
 */
function getUpgradeHullCost(upgradeId) {
  if (!upgradeId) return 0;
  const upgrade = UPGRADES[upgradeId];
  return upgrade?.hullCost || 0;
}

/**
 * Calculate total hull cost for a blueprint
 */
function calculateHullCost(blueprint) {
  let cost = 2; // Base cost per Section 7.1

  // Add Frame hull costs
  for (const upgradeId of blueprint.frameSlots || []) {
    cost += getUpgradeHullCost(upgradeId);
  }

  // Add Fabric hull costs
  for (const upgradeId of blueprint.fabricSlots || []) {
    cost += getUpgradeHullCost(upgradeId);
  }

  return cost;
}

/**
 * Install upgrade on blueprint
 * Per Section 6.2:
 * - Each install or removal counts as 1 swap
 * - Swap limit per visit: Britain 1, Germany/USA 2, Italy 4
 * - Hull Upgrade Rule: When upgrading Frame/Fabric, pay hull cost difference per ship in hangar
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex, upgradeId }
 * @returns {Object} { newState } or throws error
 */
function processInstallUpgrade(state, playerId, data) {
  const { slotType, slotIndex, upgradeId } = data;
  const playerState = state.players[playerId];

  // GAP-033 & GAP-047: Check swap limit (including Modular Frame bonus)
  const swapLimit = getEffectiveSwapLimit(playerState);
  const swapsUsed = playerState.swapsUsedThisVisit || 0;

  if (swapsUsed >= swapLimit) {
    throw new GameRuleError(`Design Bureau swap limit reached (${swapLimit}). Cannot install more upgrades this visit.`);
  }

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    throw new GameRuleError('Invalid slot type');
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    throw new GameRuleError('Invalid slot index');
  }

  // Check if slot is already occupied
  if (playerState.blueprint[slotKey][slotIndex]) {
    throw new GameRuleError('Slot already occupied. Remove current upgrade first.');
  }

  // Validate upgrade exists
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) {
    throw new GameRuleError('Unknown upgrade');
  }

  // Validate upgrade goes in correct slot type
  if (upgrade.slotType !== slotKey) {
    throw new GameRuleError(`${upgrade.name} must be installed in ${upgrade.slotType}`);
  }

  // Validate age requirement
  if (upgrade.age > state.age) {
    throw new GameRuleError(`${upgrade.name} not available until Age ${upgrade.age}`);
  }

  // Validate player owns required technology
  if (!playerState.technologies.includes(upgrade.requiredTech)) {
    const tech = TECHNOLOGIES[upgrade.requiredTech];
    throw new GameRuleError(`Requires ${tech ? tech.name : upgrade.requiredTech} technology`);
  }

  // GAP-032: Hull Upgrade Rule - charge hull cost difference for ships in hangar
  // Only applies to Frame and Fabric slots per Section 6.2
  const isStructuralSlot = slotKey === 'frameSlots' || slotKey === 'fabricSlots';
  const shipsInHangar = (playerState.ships || []).filter(s => s.status === 'hangar').length;

  if (isStructuralSlot && shipsInHangar > 0) {
    const oldHullCost = getUpgradeHullCost(playerState.blueprint[slotKey][slotIndex]);
    const newHullCost = getUpgradeHullCost(upgradeId);
    const hullCostIncrease = Math.max(0, newHullCost - oldHullCost);

    if (hullCostIncrease > 0) {
      const totalCharge = hullCostIncrease * shipsInHangar;

      if (playerState.cash < totalCharge) {
        throw new InsufficientFundsError(totalCharge, playerState.cash,
          `Hull Upgrade Rule: £${hullCostIncrease} per ship × ${shipsInHangar} ships in hangar`);
      }

      playerState.cash -= totalCharge;

      state.log.push({
        timestamp: new Date().toISOString(),
        message: `Hull Upgrade Rule: Paid £${totalCharge} (£${hullCostIncrease} × ${shipsInHangar} ships)`,
        playerId,
        type: 'action'
      });
    }
  }

  // Install the upgrade
  playerState.blueprint[slotKey][slotIndex] = upgradeId;

  // Track swap used (GAP-033)
  playerState.swapsUsedThisVisit = (playerState.swapsUsedThisVisit || 0) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Installed ${upgrade.name} in ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Remove upgrade from blueprint
 * Per Section 6.2: Each removal counts as 1 swap
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex }
 * @returns {Object} { newState } or throws error
 */
function processRemoveUpgrade(state, playerId, data) {
  const { slotType, slotIndex } = data;
  const playerState = state.players[playerId];

  // GAP-033 & GAP-047: Check swap limit (including Modular Frame bonus)
  const swapLimit = getEffectiveSwapLimit(playerState);
  const swapsUsed = playerState.swapsUsedThisVisit || 0;

  if (swapsUsed >= swapLimit) {
    throw new GameRuleError(`Design Bureau swap limit reached (${swapLimit}). Cannot remove more upgrades this visit.`);
  }

  const slotKey = `${slotType}Slots`;
  if (!playerState.blueprint[slotKey]) {
    throw new GameRuleError('Invalid slot type');
  }

  if (slotIndex < 0 || slotIndex >= playerState.blueprint[slotKey].length) {
    throw new GameRuleError('Invalid slot index');
  }

  const currentUpgrade = playerState.blueprint[slotKey][slotIndex];
  if (!currentUpgrade) {
    throw new GameRuleError('Slot is already empty');
  }

  const upgrade = UPGRADES[currentUpgrade];
  const upgradeName = upgrade ? upgrade.name : currentUpgrade;

  // Remove the upgrade
  playerState.blueprint[slotKey][slotIndex] = null;

  // Track swap used (GAP-033)
  playerState.swapsUsedThisVisit = (playerState.swapsUsedThisVisit || 0) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Removed ${upgradeName} from ${slotType} slot ${slotIndex + 1}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processInstallUpgrade,
  processRemoveUpgrade,
  calculateHullCost  // Exported for testing
};
