/**
 * Economy Actions
 * BUY_INSURANCE action processor
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError } = require('../errors');
const { MAX_INSURANCE_POLICIES, MIN_INCOME } = require('../config/constants');

interface ActionResult {
  newState: GameState;
}

// Extended player state with economy properties
type EconomyPlayerState = PlayerState & {
  insurance?: number;
  officerIncome?: number;
  engineerIncome?: number;
};

interface InternalData {
  _internal?: boolean;
}

/**
 * Buy insurance at Insurance Bureau
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT.
 */
function processBuyInsurance(state: GameState, playerId: string, data: InternalData | undefined): ActionResult {
  const { _internal = false } = data || {};
  const playerState = state.players[playerId] as EconomyPlayerState;

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'BUY_INSURANCE not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Insurance Bureau during worker placement phase to buy insurance.'
      );
    }
    const placement = state.groundBoard?.placements?.insurance_bureau;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'BUY_INSURANCE not allowed: You must place an agent at Insurance Bureau to buy insurance. ' +
        'Use PLACE_AGENT with locationId "insurance_bureau".'
      );
    }
  }

  // Track insurance policies
  const currentPolicies = playerState.insurance || 0;

  if (currentPolicies >= (MAX_INSURANCE_POLICIES as number)) {
    throw new GameRuleError(`Maximum ${MAX_INSURANCE_POLICIES} insurance policies`);
  }

  // Per Section 5.3 principle: Income cannot go below -10
  const currentIncome = playerState.income || 0;
  if (currentIncome - 1 < (MIN_INCOME as number)) {
    throw new GameRuleError(
      `Cannot buy insurance: Income would drop below the debt limit of ${MIN_INCOME}. ` +
      `Current income: ${currentIncome}.`
    );
  }

  // Cost is -1 Income (permanent), minimum -10 per debt limit
  playerState.income = Math.max(MIN_INCOME as number, currentIncome - 1);
  playerState.insurance = currentPolicies + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Purchased insurance policy (${playerState.insurance}/${MAX_INSURANCE_POLICIES}). Income reduced by 1.`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export {
  processBuyInsurance
};

// CommonJS compatibility
module.exports = {
  processBuyInsurance
};
