/**
 * Blueprint Actions
 * INSTALL_UPGRADE, REMOVE_UPGRADE action processors
 */

const { GameRuleError } = require('../errors');
const { UPGRADES, TECHNOLOGIES } = require('../data/upgrades');

/**
 * Install upgrade on blueprint
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex, upgradeId }
 * @returns {Object} { newState } or throws error
 */
function processInstallUpgrade(state, playerId, data) {
  const { slotType, slotIndex, upgradeId } = data;
  const playerState = state.players[playerId];

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

  // Install the upgrade
  playerState.blueprint[slotKey][slotIndex] = upgradeId;

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
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { slotType, slotIndex }
 * @returns {Object} { newState } or throws error
 */
function processRemoveUpgrade(state, playerId, data) {
  const { slotType, slotIndex } = data;
  const playerState = state.players[playerId];

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
  processRemoveUpgrade
};
