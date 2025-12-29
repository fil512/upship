/**
 * Crew Actions
 * RECRUIT_CREW, UPGRADE_OFFICER_INCOME, UPGRADE_ENGINEER_INCOME action processors
 */

const { GameRuleError, InsufficientFundsError } = require('../errors');
const {
  OFFICER_RECRUIT_COST,
  ENGINEER_RECRUIT_COST,
  FLIGHT_SCHOOL_COST,
  TECHNICAL_INSTITUTE_COST
} = require('../config/constants');

/**
 * Recruit crew at the Academy
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { crewType, count }
 * @returns {Object} { newState } or throws error
 */
function processRecruitCrew(state, playerId, data) {
  const { crewType, count = 1 } = data;
  const playerState = state.players[playerId];

  const costs = {
    officer: OFFICER_RECRUIT_COST,
    engineer: ENGINEER_RECRUIT_COST
  };

  if (!costs[crewType]) {
    throw new GameRuleError('Invalid crew type. Use "officer" or "engineer".');
  }

  const totalCost = costs[crewType] * count;

  if (playerState.cash < totalCost) {
    throw new InsufficientFundsError(totalCost, playerState.cash);
  }

  playerState.cash -= totalCost;

  if (crewType === 'officer') {
    playerState.officers += count;
  } else {
    playerState.engineers += count;
  }

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Recruited ${count} ${crewType}(s) for £${totalCost}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

/**
 * Upgrade Officer Income at Flight School
 * Per Section 6.6: When Officer Income Track reaches +3, gain 3rd Agent
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processUpgradeOfficerIncome(state, playerId, _data) {
  const playerState = state.players[playerId];

  if (playerState.cash < FLIGHT_SCHOOL_COST) {
    throw new InsufficientFundsError(FLIGHT_SCHOOL_COST, playerState.cash);
  }

  playerState.cash -= FLIGHT_SCHOOL_COST;
  playerState.officerIncome = (playerState.officerIncome || 0) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Officer Income to ${playerState.officerIncome}/round for £${FLIGHT_SCHOOL_COST}`,
    playerId,
    type: 'action'
  });

  // Per Section 6.6: "When your Officer Income Track reaches +3, immediately gain your 3rd Agent."
  if (playerState.officerIncome >= 3 && playerState.agents < 3) {
    playerState.agents = 3;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${playerState.faction.toUpperCase()} earned their 3rd Agent from Officer training!`,
      playerId,
      type: 'milestone'
    });
  }

  return { newState: state };
}

/**
 * Upgrade Engineer Income at Technical Institute
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data (unused)
 * @returns {Object} { newState } or throws error
 */
function processUpgradeEngineerIncome(state, playerId, _data) {
  const playerState = state.players[playerId];

  if (playerState.cash < TECHNICAL_INSTITUTE_COST) {
    throw new InsufficientFundsError(TECHNICAL_INSTITUTE_COST, playerState.cash);
  }

  playerState.cash -= TECHNICAL_INSTITUTE_COST;
  playerState.engineerIncome = (playerState.engineerIncome || 1) + 1;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Engineer Income to ${playerState.engineerIncome}/round for £${TECHNICAL_INSTITUTE_COST}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processRecruitCrew,
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome
};
