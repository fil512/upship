/**
 * Economy Actions
 * TAKE_LOAN, BUY_INSURANCE, COLLECT_INCOME action processors
 */

const { GameRuleError } = require('../errors');
const { MAX_LOANS, LOAN_AMOUNT, LOAN_INCOME_PENALTY, MAX_INSURANCE_POLICIES } = require('../config/constants');

/**
 * Take a loan at The Bank
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processTakeLoan(state, playerId, _data) {
  const playerState = state.players[playerId];

  // Limit maximum loans to 2
  const currentLoans = playerState.loans || 0;
  if (currentLoans >= MAX_LOANS) {
    throw new GameRuleError(`Maximum ${MAX_LOANS} loans allowed. Pay off existing debt first.`);
  }

  // Give the player £30
  playerState.cash += LOAN_AMOUNT;

  // Reduce income track by 3 (permanent penalty, minimum 0)
  playerState.income = Math.max(0, playerState.income - LOAN_INCOME_PENALTY);

  // Track loan count for reference
  playerState.loans = currentLoans + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Took loan ${playerState.loans}/${MAX_LOANS}: gained £${LOAN_AMOUNT}, income reduced by ${LOAN_INCOME_PENALTY}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Buy insurance at Insurance Bureau
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processBuyInsurance(state, playerId, _data) {
  const playerState = state.players[playerId];

  // Track insurance policies
  const currentPolicies = playerState.insurance || 0;

  if (currentPolicies >= MAX_INSURANCE_POLICIES) {
    throw new GameRuleError(`Maximum ${MAX_INSURANCE_POLICIES} insurance policies`);
  }

  // Cost is -1 Income (permanent)
  playerState.income = Math.max(0, playerState.income - 1);
  playerState.insurance = currentPolicies + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Purchased insurance policy (${playerState.insurance}/${MAX_INSURANCE_POLICIES}). Income reduced by 1.`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Collect income at end of round
 * Note: Income is now auto-collected when entering income phase
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processCollectIncome(state, playerId, _data) {
  // Income is now auto-collected when entering income phase
  // This action is kept for backwards compatibility but restricted to income phase
  if (state.phase !== 'income') {
    throw new GameRuleError('Can only collect income during the Income phase (income is auto-collected when the phase begins)');
  }

  const playerState = state.players[playerId];

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
  });

  return { newState: state };
}

module.exports = {
  processTakeLoan,
  processBuyInsurance,
  processCollectIncome
};
