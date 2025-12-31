/**
 * Action Registry and Dispatcher
 * Central entry point for all game action processing
 */

const { GameRuleError } = require('../errors');

// Import all action processors
const { processBuyGas } = require('./gas');
const { processAcquireTechnology, processAcquireTechnologyResearch, processGainResearch } = require('./technology');
const { processInstallUpgrade, processRemoveUpgrade, processAgeTransitionDesignBureau } = require('./blueprint');
const { processBuildShip } = require('./building');
const { processLaunchShip, processClaimRoute, processNoMoreLaunches } = require('./launch');
const { processRespondToHazard } = require('./hazard');
const { processPlaceAgent, processRecallAgents } = require('./worker');
const { processTakeLoan, processBuyInsurance, processCollectIncome } = require('./economy');
const { processRecruitCrew, processUpgradeOfficerIncome, processUpgradeEngineerIncome } = require('./crew');
const { processPlayCard, processDrawCards, processBuyMarketCard, processDiscardHazard, processDiscardMarketCard } = require('./cards');
const { processEndTurn } = require('./turn');
const { processCalculateScores } = require('./scoring');
const { processReveal } = require('./reveal');

/**
 * Action handler registry
 * Maps action types to their processor functions
 */
const ACTION_HANDLERS = {
  // Turn management
  END_TURN: processEndTurn,

  // Gas market
  BUY_GAS: processBuyGas,

  // Technology
  ACQUIRE_TECHNOLOGY: processAcquireTechnology,
  ACQUIRE_TECHNOLOGY_RESEARCH: processAcquireTechnologyResearch,
  GAIN_RESEARCH: processGainResearch,

  // Blueprint
  INSTALL_UPGRADE: processInstallUpgrade,
  REMOVE_UPGRADE: processRemoveUpgrade,
  AGE_TRANSITION_DESIGN_BUREAU: processAgeTransitionDesignBureau,

  // Building
  BUILD_SHIP: processBuildShip,

  // Launch and routes
  LAUNCH_SHIP: processLaunchShip,
  RESPOND_TO_HAZARD: processRespondToHazard,
  CLAIM_ROUTE: processClaimRoute,

  // Worker placement
  PLACE_AGENT: processPlaceAgent,
  RECALL_AGENTS: processRecallAgents,
  NO_MORE_LAUNCHES: processNoMoreLaunches,
  // Note: PASS action removed - players must use REVEAL to exit worker placement

  // Reveal
  REVEAL: processReveal,

  // Economy
  TAKE_LOAN: processTakeLoan,
  BUY_INSURANCE: processBuyInsurance,
  COLLECT_INCOME: processCollectIncome,

  // Crew
  RECRUIT_CREW: processRecruitCrew,
  UPGRADE_OFFICER_INCOME: processUpgradeOfficerIncome,
  UPGRADE_ENGINEER_INCOME: processUpgradeEngineerIncome,

  // Cards
  PLAY_CARD: processPlayCard,
  DRAW_CARDS: processDrawCards,
  BUY_MARKET_CARD: processBuyMarketCard,
  DISCARD_HAZARD: processDiscardHazard,
  DISCARD_MARKET_CARD: processDiscardMarketCard,

  // Scoring
  CALCULATE_SCORES: processCalculateScores,

  // Deprecated actions (kept for backwards compatibility)
  LOAD_GAS: () => {
    throw new GameRuleError('LOAD_GAS is deprecated. Gas is spent from reserve when launching - use LAUNCH_SHIP with gasType parameter.');
  },
  UNLOAD_GAS: () => {
    throw new GameRuleError('UNLOAD_GAS is deprecated. Gas is spent from reserve when launching.');
  }
};

/**
 * Process a game action
 *
 * @param {Object} state - Current game state (will be deep cloned)
 * @param {string} playerId - ID of the acting player
 * @param {string} actionType - Type of action to perform
 * @param {Object} data - Action-specific data
 * @returns {Object} { newState } - The new game state after action
 * @throws {GameRuleError} If action is invalid or cannot be performed
 */
function processAction(state, playerId, actionType, data) {
  // Deep clone state to avoid mutations on error
  const newState = JSON.parse(JSON.stringify(state));
  const playerState = newState.players[playerId];

  if (!playerState) {
    throw new GameRuleError('Player not found in game');
  }

  const handler = ACTION_HANDLERS[actionType];
  if (!handler) {
    throw new GameRuleError(`Unknown action type: ${actionType}`);
  }

  // Execute the action handler
  // Handlers throw errors on failure or return { newState }
  return handler(newState, playerId, data);
}

/**
 * Get list of all registered action types
 *
 * @returns {string[]} Array of action type names
 */
function getActionTypes() {
  return Object.keys(ACTION_HANDLERS);
}

/**
 * Check if an action type is valid
 *
 * @param {string} actionType - Action type to check
 * @returns {boolean} True if action type is registered
 */
function isValidActionType(actionType) {
  return actionType in ACTION_HANDLERS;
}

module.exports = {
  processAction,
  getActionTypes,
  isValidActionType,
  ACTION_HANDLERS
};
