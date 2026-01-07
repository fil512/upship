/**
 * Crew Actions
 * UPGRADE_OFFICER_INCOME, UPGRADE_ENGINEER_INCOME action processors
 */

import type { GameState, PlayerState, LogEntry } from '@upship/api';

const { GameRuleError, InsufficientFundsError } = require('../errors');
const {
  FLIGHT_SCHOOL_COST,
  TECHNICAL_INSTITUTE_COST
} = require('../config/constants');
const { resourceFlowLogger, createFlowContext } = require('../services/resourceFlowLogger');

interface ActionResult {
  newState: GameState;
}

// Extended player state with crew income properties
type CrewPlayerState = PlayerState & {
  officerIncome?: number;
  engineerIncome?: number;
  agents?: number;
};

interface InternalData {
  levels?: number;
  _internal?: boolean;
}

/**
 * Upgrade Officer Income at Flight School
 * Per Section 6.6: When Officer Income Track reaches +3, gain 3rd Agent
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 */
function processUpgradeOfficerIncome(state: GameState, playerId: string, data: InternalData | undefined): ActionResult {
  const { _internal = false } = data || {};
  const playerState = state.players[playerId] as CrewPlayerState;

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

  if (playerState.cash < (FLIGHT_SCHOOL_COST as number)) {
    throw new InsufficientFundsError(FLIGHT_SCHOOL_COST as number, playerState.cash);
  }

  playerState.cash -= FLIGHT_SCHOOL_COST as number;
  playerState.officerIncome = (playerState.officerIncome || 1) + 1;

  // Log resource flows
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'cash', FLIGHT_SCHOOL_COST as number, 'purchase', 'Upgrade Officer Income', playerState.cash, { location: 'flight_school' });
  resourceFlowLogger.logFountain(flowContext, playerId, faction, 'officer_income', 1, 'action', 'Upgrade Officer Income', playerState.officerIncome, { location: 'flight_school' });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Officer Income to ${playerState.officerIncome}/round for £${FLIGHT_SCHOOL_COST}`,
    playerId,
    type: 'action'
  } as LogEntry);

  // Per Section 6.6: "When your Officer Income Track reaches +3, immediately gain your 3rd Agent."
  if (playerState.officerIncome >= 3 && (playerState.agents || 2) < 3) {
    playerState.agents = 3;
    state.log.push({
      timestamp: new Date().toISOString(),
      message: `${playerState.faction.toUpperCase()} earned their 3rd Agent from Officer training!`,
      playerId,
      type: 'milestone'
    } as LogEntry);
  }

  return { newState: state };
}

/**
 * Upgrade Engineer Income at Technical Institute
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 * Direct API calls are rejected - must go through PLACE_AGENT with levels param.
 */
function processUpgradeEngineerIncome(state: GameState, playerId: string, data: InternalData | undefined): ActionResult {
  const { _internal = false } = data || {};
  const playerState = state.players[playerId] as CrewPlayerState;

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

  if (playerState.cash < (TECHNICAL_INSTITUTE_COST as number)) {
    throw new InsufficientFundsError(TECHNICAL_INSTITUTE_COST as number, playerState.cash);
  }

  playerState.cash -= TECHNICAL_INSTITUTE_COST as number;
  playerState.engineerIncome = (playerState.engineerIncome || 1) + 1;

  // Log resource flows
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'cash', TECHNICAL_INSTITUTE_COST as number, 'purchase', 'Upgrade Engineer Income', playerState.cash, { location: 'technical_institute' });
  resourceFlowLogger.logFountain(flowContext, playerId, faction, 'engineer_income', 1, 'action', 'Upgrade Engineer Income', playerState.engineerIncome, { location: 'technical_institute' });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Upgraded Engineer Income to ${playerState.engineerIncome}/round for £${TECHNICAL_INSTITUTE_COST}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

interface GovernmentLiaisonData {
  officerCount: number;
  _internal?: boolean;
}

/**
 * Government Liaison - Spend officers for income boost
 *
 * Per Section 6.8:
 * Cost: 1-3 Officers (from Barracks to shared supply)
 * Effect: Increase your Income Track by 1 step per Officer spent
 *
 * Per Section 5.1: Location actions execute IMMEDIATELY when placing an agent.
 */
function processGovernmentLiaison(state: GameState, playerId: string, data: GovernmentLiaisonData | undefined): ActionResult {
  const { officerCount, _internal = false } = data || { officerCount: 0 };
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

  // Log resource flows (conversion: officers -> income)
  const flowContext = createFlowContext(state, (state as { gameId?: string }).gameId || 'unknown');
  const faction = playerState.faction || 'unknown';
  resourceFlowLogger.logSink(flowContext, playerId, faction, 'officers', officerCount, 'conversion', 'Government Liaison', playerState.officers, { location: 'government_liaison' });
  resourceFlowLogger.logFountain(flowContext, playerId, faction, 'income', officerCount, 'conversion', 'Government Liaison', playerState.income, { location: 'government_liaison' });

  state.log.push({
    timestamp: new Date().toISOString(),
    message: `Government Liaison: Spent ${officerCount} officer(s) to increase income to ${playerState.income}`,
    playerId,
    type: 'action'
  } as LogEntry);

  return { newState: state };
}

export {
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome,
  processGovernmentLiaison
};

// CommonJS compatibility
module.exports = {
  processUpgradeOfficerIncome,
  processUpgradeEngineerIncome,
  processGovernmentLiaison
};
