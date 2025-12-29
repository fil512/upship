/**
 * Gas Actions
 * BUY_GAS action processor
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { advanceHeliumMarket } = require('./helpers/marketHelpers');

/**
 * Buy gas cubes from the gas depot
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { gasType, amount }
 * @returns {Object} { newState } or throws error
 */
function processBuyGas(state, playerId, data) {
  const { gasType, amount } = data;
  const playerState = state.players[playerId];

  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Invalid gas type');
  }

  // Helium requires Helium Handling technology (Section 9.3)
  if (gasType === 'helium') {
    // Technology IDs are lowercase (e.g., 'helium_handling')
    // Technologies array may contain strings (IDs) or objects with id property
    const hasHeliumHandling = playerState.technologies?.some(t =>
      (typeof t === 'string' ? t : t.id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot purchase Helium without Helium Handling technology');
    }
  }

  const price = state.gasMarket[gasType] * amount;

  if (playerState.cash < price) {
    throw new InsufficientFundsError(price, playerState.cash);
  }

  playerState.cash -= price;
  playerState.gasCubes[gasType] += amount;

  // Advance market price (unless USA buying helium)
  const isUSA = playerState.faction === 'usa';
  if (gasType === 'helium' && !isUSA) {
    // Helium uses stepped progression: advance 1 step per cube purchased
    advanceHeliumMarket(state, amount);
  }
  // Note: Hydrogen price is fixed at £1 per Section 4.4

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${amount} ${gasType} for £${price}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = { processBuyGas };
