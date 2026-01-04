/**
 * Gas Actions
 * BUY_GAS action processor
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const { advanceHeliumMarket } = require('./helpers/marketHelpers');

interface BuyGasData {
  gasType: 'hydrogen' | 'helium';
  amount: number;
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
  const { gasType, amount, _internal = false } = data;
  const playerState = state.players[playerId];

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

  // Helium requires Helium Handling tech card (Section 9.3)
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

  let price = state.gasMarket[gasType] * amount;

  // GAP-076: Reclamation System provides -£2 Lifting Gas cost per Appendix D
  const componentSlots = (playerState.blueprint as { componentSlots?: (string | { id: string } | null)[] })?.componentSlots;
  const hasReclamationSystem = componentSlots?.some(
    (comp: string | { id: string } | null) => comp === 'reclamation_system' || (comp && typeof comp === 'object' && comp.id === 'reclamation_system')
  );
  if (hasReclamationSystem) {
    price = Math.max(0, price - 2);
  }

  // GAP-077: Exhaust Condensers provides -£3 Helium cost per Appendix D (USA specialty)
  const hasExhaustCondensers = componentSlots?.some(
    (comp: string | { id: string } | null) => comp === 'exhaust_condensers' || (comp && typeof comp === 'object' && comp.id === 'exhaust_condensers')
  );
  if (hasExhaustCondensers && gasType === 'helium') {
    price = Math.max(0, price - 3);
  }

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
  } as LogEntry);

  return { newState: state };
}

export { processBuyGas };

// CommonJS compatibility
module.exports = { processBuyGas };
