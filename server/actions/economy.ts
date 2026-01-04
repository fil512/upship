/**
 * Economy Actions
 * TAKE_LOAN, BUY_INSURANCE, COLLECT_INCOME action processors
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError } = require('../errors');
const { MAX_LOANS, LOAN_AMOUNT, LOAN_INCOME_PENALTY, MAX_INSURANCE_POLICIES, MIN_INCOME } = require('../config/constants');

interface ActionResult {
  newState: GameState;
}

// Extended player state with economy properties
type EconomyPlayerState = PlayerState & {
  loans?: number;
  insurance?: number;
  officerIncome?: number;
  engineerIncome?: number;
};

/**
 * Take a loan at The Bank
 */
function processTakeLoan(state: GameState, playerId: string, _data: unknown): ActionResult {
  const playerState = state.players[playerId] as EconomyPlayerState;

  // Limit maximum loans to 2
  const currentLoans = playerState.loans || 0;
  if (currentLoans >= (MAX_LOANS as number)) {
    throw new GameRuleError(`Maximum ${MAX_LOANS} loans allowed. Pay off existing debt first.`);
  }

  // Per Section 5.3: "If a loan would push you below -10, you cannot take it"
  const currentIncome = playerState.income || 0;
  const newIncome = currentIncome - (LOAN_INCOME_PENALTY as number);
  if (newIncome < (MIN_INCOME as number)) {
    throw new GameRuleError(
      `Cannot take loan: Income would drop to ${newIncome}, below the debt limit of ${MIN_INCOME}. ` +
      `Current income: ${currentIncome}.`
    );
  }

  // Give the player £30
  playerState.cash += LOAN_AMOUNT as number;

  // Reduce income track by 3 (minimum -10 per Section 5.3)
  playerState.income = Math.max(MIN_INCOME as number, currentIncome - (LOAN_INCOME_PENALTY as number));

  // Track loan count for reference
  playerState.loans = currentLoans + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Took loan ${playerState.loans}/${MAX_LOANS}: gained £${LOAN_AMOUNT}, income reduced by ${LOAN_INCOME_PENALTY}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

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

/**
 * Collect income at end of round
 * Note: Income is now auto-collected when entering income phase
 */
function processCollectIncome(state: GameState, playerId: string, _data: unknown): ActionResult {
  // Income is now auto-collected when entering income phase
  // This action is kept for backwards compatibility but restricted to income_cleanup phase
  if (state.phase !== 'income_cleanup') {
    throw new GameRuleError('Can only collect income during the Income/Cleanup phase (income is auto-collected when the phase begins)');
  }

  const playerState = state.players[playerId] as EconomyPlayerState;

  // Collect cash from income track
  const incomeGained = playerState.income;
  playerState.cash += incomeGained;

  // Gain crew from income tracks
  const officersGained = playerState.officerIncome || 0;
  const engineersGained = playerState.engineerIncome || 1;

  playerState.officers += officersGained;
  playerState.engineers += engineersGained;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Collected income: £${incomeGained}, +${officersGained} Officer(s), +${engineersGained} Engineer(s)`,
    playerId,
    type: 'income'
  } as LogEntry);

  return { newState: state };
}

export {
  processTakeLoan,
  processBuyInsurance,
  processCollectIncome
};

// CommonJS compatibility
module.exports = {
  processTakeLoan,
  processBuyInsurance,
  processCollectIncome
};
