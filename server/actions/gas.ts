/**
 * Gas Actions
 * BUY_GAS action processor
 */

import type { GameState, LogEntry } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const {
  getCurrentHeliumPrice,
  getAvailableHeliumCubes,
  calculateHeliumCost,
  purchaseHeliumFromMarket
} = require('../services/gameStateHelpers');
const { USA_DOMESTIC_HELIUM_PRICE } = require('../config/constants');

// Type alias for component slot entries (can be string ID or object with id)
type ComponentSlotEntry = string | { id: string } | null;

interface BuyGasData {
  gasType: 'hydrogen' | 'helium';
  amount: number;
  source?: 'market' | 'domestic';  // USA only: 'domestic' for £2/cube fixed price
  _internal?: boolean;
}

interface ActionResult {
  newState: GameState;
}

/**
 * Buy gas cubes from the gas depot
 *
 * Per Section 5.1: Actions execute IMMEDIATELY when placing an agent.
 * This action should only be called:
 * 1. Internally from processPlaceAgent when placing at gas_depot
 * 2. NOT directly during reveal phase or without proper agent placement
 */
function processBuyGas(state: GameState, playerId: string, data: BuyGasData): ActionResult {
  const { gasType, amount, source = 'market', _internal = false } = data;
  const playerState = state.players[playerId];
  const isUSA = playerState.faction === 'usa';

  // Per Section 5.1: Actions execute when placing agent, not separately
  // Only allow direct calls during worker_placement when player has agent at gas_depot
  // Internal calls (from processPlaceAgent) bypass this check
  if (!_internal) {
    // Validate phase - gas buying only happens during worker_placement via agent placement
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'BUY_GAS not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Gas Depot during worker placement phase to buy gas.'
      );
    }

    // Validate the player has an agent at gas_depot
    const placement = state.groundBoard?.placements?.gas_depot;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'BUY_GAS not allowed: You must place an agent at Gas Depot to buy gas. ' +
        'Use PLACE_AGENT with locationId "gas_depot" and gasType/gasAmount parameters.'
      );
    }
  }

  if (!['hydrogen', 'helium'].includes(gasType)) {
    throw new GameRuleError('Invalid gas type');
  }

  // Helium requires Helium Handling tech card (Section 9.4)
  if (gasType === 'helium') {
    // Tech card IDs are lowercase (e.g., 'helium_handling')
    // Tech cards array may contain strings (IDs) or objects with id property
    const hasHeliumHandling = playerState.techCards?.some((t: string | { id: string }) =>
      (typeof t === 'string' ? t : t.id) === 'helium_handling'
    );
    if (!hasHeliumHandling) {
      throw new GameRuleError('Cannot purchase Helium without Helium Handling tech card');
    }
  }

  // Component-based cost reductions
  const componentSlots = (playerState.blueprint as { componentSlots?: ComponentSlotEntry[] })?.componentSlots;
  const hasReclamationSystem = componentSlots?.some(
    (comp: ComponentSlotEntry) => comp === 'reclamation_system' || (comp && typeof comp === 'object' && comp.id === 'reclamation_system')
  );
  const hasExhaustCondensers = componentSlots?.some(
    (comp: ComponentSlotEntry) => comp === 'exhaust_condensers' || (comp && typeof comp === 'object' && comp.id === 'exhaust_condensers')
  );

  // HYDROGEN: Fixed price £1/cube
  if (gasType === 'hydrogen') {
    let price = state.gasMarket.hydrogen * amount;
    // GAP-076: Reclamation System provides -£2 Lifting Gas cost per Appendix D
    if (hasReclamationSystem) {
      price = Math.max(0, price - 2);
    }
    if (playerState.cash < price) {
      throw new InsufficientFundsError(price, playerState.cash);
    }
    playerState.cash -= price;
    playerState.gasCubes.hydrogen += amount;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `Bought ${amount} hydrogen for £${price}`,
      playerId,
      type: 'action'
    } as LogEntry);
    return { newState: state };
  }

  // HELIUM: Brass-style supply market (Section 9.4)

  // USA can choose domestic supply at £2/cube (Section 9.4.6)
  if (source === 'domestic') {
    if (!isUSA) {
      throw new GameRuleError('Only USA can purchase from domestic helium supply');
    }
    let price = USA_DOMESTIC_HELIUM_PRICE * amount;
    // Apply cost reductions
    if (hasReclamationSystem) price = Math.max(0, price - 2);
    if (hasExhaustCondensers) price = Math.max(0, price - 3);

    if (playerState.cash < price) {
      throw new InsufficientFundsError(price, playerState.cash);
    }
    playerState.cash -= price;
    playerState.gasCubes.helium += amount;

    state.log.push({
      timestamp: new Date().toISOString(),
      message: `USA bought ${amount} helium from domestic supply for £${price}`,
      playerId,
      type: 'action'
    } as LogEntry);
    return { newState: state };
  }

  // Market purchase
  const available = getAvailableHeliumCubes(state);
  if (available === 0) {
    if (isUSA) {
      throw new GameRuleError('Market is empty. USA can still buy from domestic supply (source: "domestic").');
    }
    throw new GameRuleError('Helium market is empty. Wait for Ministry replenishment.');
  }

  if (amount > available) {
    throw new GameRuleError(`Only ${available} helium cubes available in market`);
  }

  let price = calculateHeliumCost(state, amount);
  // Apply cost reductions
  if (hasReclamationSystem) price = Math.max(0, price - 2);
  if (hasExhaustCondensers) price = Math.max(0, price - 3);

  if (playerState.cash < price) {
    throw new InsufficientFundsError(price, playerState.cash);
  }

  // Execute purchase (removes cubes from market)
  const actualBaseCost = purchaseHeliumFromMarket(state, amount);
  // Recalculate actual price with reductions
  let actualPrice = actualBaseCost;
  if (hasReclamationSystem) actualPrice = Math.max(0, actualPrice - 2);
  if (hasExhaustCondensers) actualPrice = Math.max(0, actualPrice - 3);

  playerState.cash -= actualPrice;
  playerState.gasCubes.helium += amount;

  const newPrice = getCurrentHeliumPrice(state);
  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Bought ${amount} helium from market for £${actualPrice} (new price: £${newPrice || 'empty'})`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export { processBuyGas };

// CommonJS compatibility
module.exports = { processBuyGas };
