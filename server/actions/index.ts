/**
 * Action Registry and Dispatcher
 * Central entry point for all game action processing
 */

import type { GameState } from '@upship/api';

const { GameRuleError } = require('../errors');

// Import all action processors
const { processBuyGas } = require('./gas');
const { processAcquireTechCard, processAcquireTechCardResearch, processGainResearch } = require('./technology');
const { processInstallTechTile, processRemoveTechTile, processAgeTransitionBlueprintDesign } = require('./blueprint');
const { processBuildShip } = require('./building');
const { processLaunchShip, processClaimRoute, processNoMoreLaunches } = require('./launch');
const { processLaunchCombatMission } = require('./combatMission');
const { processRespondToHazard } = require('./hazard');
const { processPlaceAgent, processRecallAgents } = require('./worker');
const { processTakeLoan, processBuyInsurance, processCollectIncome } = require('./economy');
const { processRecruitCrew, processUpgradeOfficerIncome, processUpgradeEngineerIncome } = require('./crew');
const { processPlayCard, processDrawCards, processBuyMarketCard, processDiscardHazard, processKeepHazard, processDiscardMinistryCard, processDiscardMarketCard } = require('./cards');
const { processEndTurn } = require('./turn');
const { processCalculateScores } = require('./scoring');
const { processReveal } = require('./reveal');
const { processBuyMarketCardTentative, processAcquireTechCardTentative, processUndoMarketPurchase } = require('./marketPurchase');

interface ActionResult {
  newState: GameState;
}

type ActionHandler = (state: GameState, playerId: string, data?: unknown) => ActionResult;

/**
 * Action handler registry
 * Maps action types to their processor functions
 */
const ACTION_HANDLERS: Record<string, ActionHandler> = {
  // Turn management
  END_TURN: processEndTurn,

  // Gas market
  BUY_GAS: processBuyGas,

  // Tech Cards
  ACQUIRE_TECH_CARD: processAcquireTechCard,
  ACQUIRE_TECH_CARD_RESEARCH: processAcquireTechCardResearch,
  GAIN_RESEARCH: processGainResearch,
  // Legacy aliases for backwards compatibility
  ACQUIRE_TECHNOLOGY: processAcquireTechCard,
  ACQUIRE_TECHNOLOGY_RESEARCH: processAcquireTechCardResearch,

  // Tech Tiles / Blueprint
  INSTALL_TECH_TILE: processInstallTechTile,
  REMOVE_TECH_TILE: processRemoveTechTile,
  AGE_TRANSITION_BLUEPRINT_DESIGN: processAgeTransitionBlueprintDesign,
  // Legacy aliases for backwards compatibility
  INSTALL_UPGRADE: processInstallTechTile,
  REMOVE_UPGRADE: processRemoveTechTile,

  // Building
  BUILD_SHIP: processBuildShip,

  // Launch and routes
  LAUNCH_SHIP: processLaunchShip,
  LAUNCH_COMBAT_MISSION: processLaunchCombatMission,
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
  KEEP_HAZARD: processKeepHazard,
  DISCARD_MINISTRY_CARD: processDiscardMinistryCard,
  DISCARD_MARKET_CARD: processDiscardMarketCard,

  // Tentative purchases during reveal phase
  BUY_MARKET_CARD_TENTATIVE: processBuyMarketCardTentative,
  ACQUIRE_TECH_CARD_TENTATIVE: processAcquireTechCardTentative,
  UNDO_MARKET_PURCHASE: processUndoMarketPurchase,

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
 * @param state - Current game state (will be deep cloned)
 * @param playerId - ID of the acting player
 * @param actionType - Type of action to perform
 * @param data - Action-specific data
 * @returns The new game state after action
 * @throws GameRuleError If action is invalid or cannot be performed
 */
function processAction(state: GameState, playerId: string, actionType: string, data?: unknown): ActionResult {
  // Deep clone state to avoid mutations on error (structuredClone is faster than JSON.parse/stringify)
  const newState = structuredClone(state);
  const playerState = newState.players[playerId];

  if (!playerState) {
    throw new GameRuleError('Player not found in game');
  }

  const handler = ACTION_HANDLERS[actionType];
  if (!handler) {
    throw new GameRuleError(`Unknown action type: ${actionType}`);
  }

  // SECURITY: Sanitize client data - strip internal flags that should only be set server-side
  // The _internal flag is used by location actions (e.g., gas_depot calling BUY_GAS)
  // and should never be accepted from client requests
  const sanitizedData = data ? { ...(data as Record<string, unknown>) } : {};
  delete sanitizedData._internal;

  // Execute the action handler
  // Handlers throw errors on failure or return { newState }
  return handler(newState, playerId, sanitizedData);
}

/**
 * Get list of all registered action types
 */
function getActionTypes(): string[] {
  return Object.keys(ACTION_HANDLERS);
}

/**
 * Check if an action type is valid
 */
function isValidActionType(actionType: string): boolean {
  return actionType in ACTION_HANDLERS;
}

export {
  processAction,
  getActionTypes,
  isValidActionType,
  ACTION_HANDLERS
};

// CommonJS compatibility
module.exports = {
  processAction,
  getActionTypes,
  isValidActionType,
  ACTION_HANDLERS
};
