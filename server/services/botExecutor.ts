/**
 * Bot Executor Service
 * Triggers bot moves when it's a bot's turn
 */

import type { Server as SocketIOServer } from 'socket.io';
import type { GameState } from '@upship/api';

const gameService = require('./gameService');
const gameStateService = require('./gameStateService');
const { processAction } = require('../actions');
const { broadcastStateUpdate } = require('../socket');
const botService = require('./botService');
const logger = require('../logger');

// Maximum bot actions per invocation to prevent infinite loops
const MAX_BOT_ACTIONS = 50;

/**
 * Check if it's a bot's turn and execute their move
 * Called after any state change (human action, game start, etc.)
 */
export async function checkAndExecuteBotMoves(
  io: SocketIOServer,
  gameId: string
): Promise<void> {
  logger.info({ gameId }, 'BOT EXECUTOR: checkAndExecuteBotMoves called');
  let actionsExecuted = 0;

  while (actionsExecuted < MAX_BOT_ACTIONS) {
    const executed = await executeOneBotMoveIfNeeded(io, gameId);
    logger.info({ gameId, executed, actionsExecuted }, 'BOT EXECUTOR: executeOneBotMoveIfNeeded result');
    if (!executed) break;
    actionsExecuted++;
  }

  if (actionsExecuted >= MAX_BOT_ACTIONS) {
    logger.warn({ gameId, actionsExecuted }, 'Bot executor reached max actions limit');
  }
}

/**
 * Execute one bot move if the current player is a bot
 * Returns true if a move was executed
 */
async function executeOneBotMoveIfNeeded(
  io: SocketIOServer,
  gameId: string
): Promise<boolean> {
  try {
    // Get current game state
    const gameStateWrapper = await gameStateService.getGameState(gameId);
    if (!gameStateWrapper) {
      logger.info({ gameId }, 'BOT EXECUTOR: No game state found');
      return false;
    }

    const state = gameStateWrapper.state as GameState;
    logger.info({ gameId, phase: state.phase }, 'BOT EXECUTOR: Current phase');

    // Determine current player based on phase
    let currentPlayerId: string | null = null;

    if (state.phase === 'worker_placement' && state.workerPlacement?.placementOrder) {
      const idx = state.workerPlacement.currentPlacerIndex || 0;
      currentPlayerId = state.workerPlacement.placementOrder[idx];
      logger.info({ gameId, idx, currentPlayerId, placementOrder: state.workerPlacement.placementOrder }, 'BOT EXECUTOR: Worker placement - current player');
    } else if (state.phase === 'reveal') {
      // Reveal phase: check all bots and execute their actions
      return await executeBotRevealPhase(io, gameId, state, gameStateWrapper.version);
    } else if (state.phase === 'income_cleanup') {
      currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    } else if (state.phase === 'age_transition_blueprint_design') {
      const idx = (state as GameState & { ageTransitionBlueprintDesign?: { currentPlayerIndex?: number } })
        .ageTransitionBlueprintDesign?.currentPlayerIndex || 0;
      currentPlayerId = state.playerOrder[idx];
    } else {
      currentPlayerId = state.playerOrder[state.currentPlayerIndex];
    }

    if (!currentPlayerId) {
      logger.info({ gameId }, 'BOT EXECUTOR: No current player ID');
      return false;
    }

    // Check if current player is a bot
    const isBot = await isBotPlayer(gameId, currentPlayerId);
    logger.info({ gameId, currentPlayerId, isBot }, 'BOT EXECUTOR: isBotPlayer check');
    if (!isBot) return false;

    // Execute bot move based on phase
    return await executeBotMove(io, gameId, state, currentPlayerId, gameStateWrapper.version);
  } catch (error) {
    const err = error as Error;
    logger.error({
      gameId,
      errorMessage: err?.message || String(error),
      errorStack: err?.stack
    }, 'Error in bot move execution');
    return false;
  }
}

/**
 * Check if a player ID corresponds to a bot
 * For bots, the player ID is the game_players.id (UUID)
 */
async function isBotPlayer(gameId: string, playerId: string): Promise<boolean> {
  try {
    const player = await gameService.getPlayerById(playerId);
    return player?.is_bot || false;
  } catch {
    return false;
  }
}

/**
 * Execute a bot's move for the current phase
 */
async function executeBotMove(
  io: SocketIOServer,
  gameId: string,
  state: GameState,
  botId: string,
  version: number
): Promise<boolean> {
  const player = state.players[botId];
  if (!player) return false;

  switch (state.phase) {
    case 'worker_placement':
      return await executeBotWorkerPlacement(io, gameId, state, botId, version);

    case 'income_cleanup':
      return await executeBotEndTurn(io, gameId, botId, version);

    case 'age_transition_blueprint_design':
      return await executeBotAgeTransition(io, gameId, state, botId, version);

    default:
      return false;
  }
}

/**
 * Execute worker placement phase for bot
 */
async function executeBotWorkerPlacement(
  io: SocketIOServer,
  gameId: string,
  state: GameState,
  botId: string,
  version: number
): Promise<boolean> {
  logger.info({ gameId, botId }, 'BOT EXECUTOR: executeBotWorkerPlacement called');

  const player = state.players[botId];
  if (!player) {
    logger.warn({ gameId, botId, playerIds: Object.keys(state.players) }, 'BOT EXECUTOR: Player not found');
    return false;
  }

  logger.info({ gameId, botId, agentsRemaining: player.agentsRemaining, handSize: player.hand?.length }, 'BOT EXECUTOR: Player state');

  // Check if bot has already revealed (hasPassed = true)
  if (player.hasPassed) {
    logger.info({ gameId, botId }, 'BOT EXECUTOR: Bot has already revealed, finishing purchase selection');
    // Bot has revealed and needs to finish purchase selection
    // For now, bots don't select purchases interactively, so just end turn
    return await executeBotAction(io, gameId, botId, 'END_TURN', {}, version);
  }

  // Check if bot has agents remaining
  if ((player.agentsRemaining || 0) <= 0) {
    logger.info({ gameId, botId }, 'BOT EXECUTOR: No agents remaining, must reveal');
    // Bot has no agents but hasn't revealed yet - must call REVEAL
    return await executeBotAction(io, gameId, botId, 'REVEAL', {}, version);
  }

  // Find strategic placement
  logger.info({ gameId, botId }, 'BOT EXECUTOR: Finding strategic placement');
  const decision = botService.findStrategicPlacement(state, botId);
  logger.info({ gameId, botId, decision }, 'BOT EXECUTOR: Strategic placement decision');

  if (decision) {
    const actionData: Record<string, unknown> = {
      locationId: decision.locationId,
      cardIndex: decision.cardIndex,
      ...decision.locationAction
    };

    const success = await executeBotAction(io, gameId, botId, 'PLACE_AGENT', actionData, version);

    if (success && decision.locationId === 'launchpad') {
      // Handle launchpad launches
      await executeBotLaunches(io, gameId, botId);
    }

    return success;
  } else {
    // No valid placement, must reveal
    return await executeBotAction(io, gameId, botId, 'END_TURN', {}, version);
  }
}

/**
 * Execute launches for bot at launchpad
 */
async function executeBotLaunches(
  io: SocketIOServer,
  gameId: string,
  botId: string
): Promise<void> {
  let maxLaunches = 10; // Safety limit

  while (maxLaunches > 0) {
    maxLaunches--;

    // Get fresh state
    const gameStateWrapper = await gameStateService.getGameState(gameId);
    if (!gameStateWrapper) return;

    const state = gameStateWrapper.state as GameState;
    const player = state.players[botId];
    if (!player) return;

    // Check for pending hazard response
    const shipAwaitingHazard = (player.ships || []).find(s => s.status === 'awaiting_hazard');
    if (shipAwaitingHazard) {
      await handleBotHazardResponse(io, gameId, state, botId, shipAwaitingHazard.id, gameStateWrapper.version);
      continue;
    }

    // Find best launch decision
    const launchDecision = botService.findLaunchDecision(state, botId);

    if (launchDecision) {
      // Check resources
      const officers = player.officers || 0;
      const officersNeeded = state.age || 1;
      const hydrogen = player.gasCubes?.hydrogen || 0;
      const helium = player.gasCubes?.helium || 0;
      const totalGas = hydrogen + helium;

      if (officers < officersNeeded || totalGas < 1) {
        // Not enough resources, stop launching
        break;
      }

      await executeBotAction(io, gameId, botId, 'LAUNCH_SHIP', {
        shipId: launchDecision.shipId,
        routeId: launchDecision.routeId,
        gasType: launchDecision.gasType
      }, gameStateWrapper.version);
    } else {
      // No more launches possible
      break;
    }
  }

  // Signal no more launches
  const finalState = await gameStateService.getGameState(gameId);
  if (finalState) {
    await executeBotAction(io, gameId, botId, 'NO_MORE_LAUNCHES', {}, finalState.version);
  }
}

/**
 * Handle hazard response for bot
 */
async function handleBotHazardResponse(
  io: SocketIOServer,
  gameId: string,
  state: GameState,
  botId: string,
  shipId: string,
  version: number
): Promise<void> {
  const response = botService.getHazardResponse(state, botId, shipId);

  await executeBotAction(io, gameId, botId, 'RESPOND_TO_HAZARD', {
    shipId,
    spendEngineers: response.spendEngineers
  }, version);
}

/**
 * Execute reveal phase for all bots
 */
async function executeBotRevealPhase(
  io: SocketIOServer,
  gameId: string,
  state: GameState,
  _version: number
): Promise<boolean> {
  let anyActionExecuted = false;

  // Get all bot player IDs in this game
  const botIds = await gameService.getBotsInGame(gameId);

  for (const botId of botIds) {
    const player = state.players[botId];
    if (!player) continue;

    // Check if bot already ended their turn in reveal phase
    const revealPhase = (state as GameState & { revealPhase?: { techAcquisitionsComplete?: Record<string, boolean> } }).revealPhase;
    if (revealPhase?.techAcquisitionsComplete?.[botId]) {
      continue; // Already done
    }

    // Get fresh state for each bot
    const freshState = await gameStateService.getGameState(gameId);
    if (!freshState) break;

    // Get reveal acquisitions
    const acquisitions = botService.getRevealAcquisitions(freshState.state, botId);

    // Acquire techs (tentatively)
    for (const techId of acquisitions.techIds) {
      await executeBotAction(io, gameId, botId, 'ACQUIRE_TECH_CARD_TENTATIVE', { techCardId: techId }, freshState.version);
      anyActionExecuted = true;
    }

    // End turn to finalize
    const latestState = await gameStateService.getGameState(gameId);
    if (latestState) {
      await executeBotAction(io, gameId, botId, 'END_TURN', {}, latestState.version);
      anyActionExecuted = true;
    }
  }

  return anyActionExecuted;
}

/**
 * Execute end turn for bot
 */
async function executeBotEndTurn(
  io: SocketIOServer,
  gameId: string,
  botId: string,
  version: number
): Promise<boolean> {
  return await executeBotAction(io, gameId, botId, 'END_TURN', {}, version);
}

/**
 * Execute age transition design bureau for bot
 */
async function executeBotAgeTransition(
  io: SocketIOServer,
  gameId: string,
  state: GameState,
  botId: string,
  version: number
): Promise<boolean> {
  const player = state.players[botId];
  if (!player) return false;

  // Get desired blueprint configuration (mandatory during age transition)
  const blueprint = botService.getBlueprintDesignBlueprint(player, state.age, true);

  return await executeBotAction(io, gameId, botId, 'AGE_TRANSITION_BLUEPRINT_DESIGN', { blueprint }, version);
}

/**
 * Execute a single action for a bot
 */
async function executeBotAction(
  io: SocketIOServer,
  gameId: string,
  botId: string,
  actionType: string,
  actionData: Record<string, unknown>,
  _expectedVersion: number
): Promise<boolean> {
  try {
    // Get current state
    const gameStateWrapper = await gameStateService.getGameState(gameId);
    if (!gameStateWrapper) return false;

    const state = gameStateWrapper.state as GameState;

    // Process the action
    const result = processAction(state, botId, actionType, actionData);

    if (result.error) {
      logger.warn({ botId, actionType, error: result.error, gameId }, 'Bot action failed');
      return false;
    }

    // Save state with optimistic locking
    const newState = await gameStateService.updateGameState(
      gameId,
      result.newState,
      {
        playerId: botId,
        type: actionType,
        data: actionData
      },
      gameStateWrapper.version
    );

    // Broadcast update
    broadcastStateUpdate(io, gameId, newState, newState.version || 1, actionType);

    // Log bot action
    const player = state.players[botId];
    const faction = player?.faction?.toUpperCase() || 'BOT';
    logger.info({ gameId, faction, actionType }, 'Bot action executed');

    return true;
  } catch (error) {
    logger.error({ error, botId, actionType, gameId }, 'Bot action execution failed');
    return false;
  }
}

// CommonJS compatibility
module.exports = {
  checkAndExecuteBotMoves
};
