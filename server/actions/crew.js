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
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with crewType/crewCount params.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { crewType, count, _internal }
 * @returns {Object} { newState } or throws error
 */
function processRecruitCrew(state, playerId, data) {
  const { crewType, count = 1, _internal = false } = data;
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'RECRUIT_CREW not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Academy during worker placement phase to recruit crew.'
      );
    }
    const placement = state.groundBoard?.placements?.academy;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'RECRUIT_CREW not allowed: You must place an agent at Academy to recruit crew. ' +
        'Use PLACE_AGENT with locationId "academy" and crewType/crewCount parameters.'
      );
    }
  }

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
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { levels, _internal }
 * @returns {Object} { newState } or throws error
 */
function processUpgradeOfficerIncome(state, playerId, data) {
  const { _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'UPGRADE_OFFICER_INCOME not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Flight School during worker placement phase to upgrade officer income.'
      );
    }
    const placement = state.groundBoard?.placements?.flight_school;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'UPGRADE_OFFICER_INCOME not allowed: You must place an agent at Flight School to upgrade officer income. ' +
        'Use PLACE_AGENT with locationId "flight_school".'
      );
    }
  }

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
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { levels, _internal }
 * @returns {Object} { newState } or throws error
 */
function processUpgradeEngineerIncome(state, playerId, data) {
  const { _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'UPGRADE_ENGINEER_INCOME not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Technical Institute during worker placement phase to upgrade engineer income.'
      );
    }
    const placement = state.groundBoard?.placements?.technical_institute;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'UPGRADE_ENGINEER_INCOME not allowed: You must place an agent at Technical Institute to upgrade engineer income. ' +
        'Use PLACE_AGENT with locationId "technical_institute".'
      );
    }
  }

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

/**
 * Government Liaison - Spend officers for income boost
 *
 * Per Section 6.8:
 * Cost: 1-3 Officers (from Barracks to shared supply)
 * Effect: Increase your Income Track by 1 step per Officer spent
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 *
 * @param {Object} state - Game state (mutated)
 * @param {string} playerId - Acting player ID
 * @param {Object} data - Action data { officerCount, _internal }
 * @returns {Object} { newState } or throws error
 */
function processGovernmentLiaison(state, playerId, data) {
  const { officerCount, _internal = false } = data || {};
  const playerState = state.players[playerId];

  // Validate that this is called through PLACE_AGENT (Section 5.1)
  if (!_internal) {
    if (state.phase !== 'worker_placement') {
      throw new GameRuleError(
        'GOVERNMENT_LIAISON not allowed: Actions execute immediately when placing an agent (Section 5.1). ' +
        'Place an agent at Government Liaison during worker placement phase.'
      );
    }
    const placement = state.groundBoard?.placements?.government_liaison;
    if (!placement || placement.playerId !== playerId) {
      throw new GameRuleError(
        'GOVERNMENT_LIAISON not allowed: You must place an agent at Government Liaison. ' +
        'Use PLACE_AGENT with locationId "government_liaison" and officerCount parameter.'
      );
    }
  }

  // Validate officer count (must be 1-3 per Section 6.8)
  if (!officerCount || officerCount < 1 || officerCount > 3) {
    throw new GameRuleError(
      'Government Liaison requires officerCount between 1 and 3. You must spend 1-3 officers.'
    );
  }

  // Check if player has enough officers
  if ((playerState.officers || 0) < officerCount) {
    throw new GameRuleError(
      `Not enough officers. Have ${playerState.officers || 0}, need ${officerCount}.`
    );
  }

  // Spend officers and gain income
  playerState.officers -= officerCount;
  playerState.income = (playerState.income || 0) + officerCount;

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Government Liaison: Spent ${officerCount} officer(s) to increase income to ${playerState.income}`,
    playerId,
    type: 'action'
  });

  return { newState: state };
}

module.exports = {
  processRecruitCrew,
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome,
  processGovernmentLiaison
};
