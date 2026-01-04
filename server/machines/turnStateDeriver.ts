/**
 * Turn State Deriver
 *
 * Derives the current turn state from game state fields.
 * This allows us to compute the "virtual" machine state without
 * actually storing a separate machine state in the database.
 *
 * The derived state can then be used to determine which actions
 * are valid for the current player.
 */

import type { GameState, PlayerState, Ship, Card, HazardCard } from '@upship/api';

const { getAllowedEvents } = require('./turnMachine');

// Turn state values
type TurnStateValue = 'idle' | 'awaiting_action' | 'at_weather_bureau' | 'at_ministry' | 'at_launchpad' | 'awaiting_hazard';

// Extended player state with turn-specific properties
type TurnPlayerState = PlayerState & {
  peekedHazard?: HazardCard | null;
  drawnMinistryCards?: Card[];
};

// Extended state with worker placement
type TurnState = GameState & {
  workerPlacement?: {
    placementOrder?: string[];
    currentPlacerIndex?: number;
  };
  launchpadActive?: Record<string, boolean>;
};

// Action context for UI
interface ActionContext {
  peekedHazard?: HazardCard | null;
  drawnMinistryCards?: Card[];
  shipAwaitingHazard?: Ship;
  pendingHazard?: unknown;
  pendingRouteId?: string;
  launchableShips?: Ship[];
}

// Button configuration for UI
interface ButtonConfig {
  action: string;
  label: string;
  description: string;
  icon: string;
  primary: boolean;
  requiresSelection: boolean;
  selectionType?: string;
  variant?: string;
  disabled?: boolean;
  disabledReason?: string;
  actionData?: Record<string, unknown>;
}

// Player allowed actions result
interface PlayerAllowedActionsResult {
  turnState: TurnStateValue;
  allowedActions: string[];
  actionContext: ActionContext;
}

// Player UI state result
interface PlayerUIStateResult extends PlayerAllowedActionsResult {
  isMyTurn: boolean;
  isBlocked: boolean;
  prompt: string;
  buttons: ButtonConfig[];
}

/**
 * Derive the current turn state for a player from game state
 *
 * @param state - Full game state
 * @param playerId - Player ID to check
 * @returns One of: 'idle', 'awaiting_action', 'at_weather_bureau',
 *          'at_ministry', 'at_launchpad', 'awaiting_hazard'
 */
function deriveTurnState(state: GameState, playerId: string): TurnStateValue {
  const playerState = state.players?.[playerId] as TurnPlayerState | undefined;
  if (!playerState) {
    return 'idle';
  }

  // Check phase-specific states first
  if (state.phase !== 'worker_placement') {
    // During reveal/income phases, different rules apply
    return 'idle';
  }

  // Check if player has passed
  if (playerState.hasPassed) {
    return 'idle';
  }

  // Check if it's this player's turn
  const isMyTurn = isPlayersTurn(state, playerId);

  // Check for multi-step flow states (these apply even if not "your turn"
  // because you're in the middle of completing an action)

  // Check for awaiting_hazard: ship with pending hazard
  const shipAwaitingHazard = playerState.ships?.find(
    s => s.status === 'awaiting_hazard' && s.pendingHazard
  );
  if (shipAwaitingHazard) {
    return 'awaiting_hazard';
  }

  // Check for at_weather_bureau: has peeked hazard
  if (playerState.peekedHazard) {
    return 'at_weather_bureau';
  }

  // Check for at_ministry: has drawn ministry cards
  if (playerState.drawnMinistryCards?.length === 2) {
    return 'at_ministry';
  }

  // Check for at_launchpad: launchpad is active
  const turnState = state as TurnState;
  if (turnState.launchpadActive?.[playerId]) {
    return 'at_launchpad';
  }

  // Normal turn state
  if (isMyTurn) {
    return 'awaiting_action';
  }

  return 'idle';
}

/**
 * Check if it's a player's turn to act
 *
 * @param state - Game state
 * @param playerId - Player ID
 * @returns boolean
 */
function isPlayersTurn(state: GameState, playerId: string): boolean {
  const turnState = state as TurnState;

  if (state.phase === 'worker_placement') {
    const placementOrder = turnState.workerPlacement?.placementOrder || state.playerOrder;
    const currentIndex = turnState.workerPlacement?.currentPlacerIndex || 0;
    return placementOrder[currentIndex] === playerId;
  }

  if (state.phase === 'reveal') {
    // During reveal, all players can act simultaneously
    return true;
  }

  if (state.phase === 'income_cleanup') {
    return state.playerOrder[state.currentPlayerIndex] === playerId;
  }

  return false;
}

/**
 * Get allowed actions for a player based on current game state
 *
 * @param state - Game state
 * @param playerId - Player ID
 * @returns { turnState, allowedActions, actionContext }
 */
function getPlayerAllowedActions(state: GameState, playerId: string): PlayerAllowedActionsResult {
  const turnState = deriveTurnState(state, playerId);
  const allowedEvents = getAllowedEvents(turnState);
  const playerState = state.players?.[playerId] as TurnPlayerState | undefined;

  // Build context for UI to use
  const actionContext: ActionContext = {};

  if (turnState === 'at_weather_bureau' && playerState?.peekedHazard) {
    actionContext.peekedHazard = playerState.peekedHazard;
  }

  if (turnState === 'at_ministry' && playerState?.drawnMinistryCards) {
    actionContext.drawnMinistryCards = playerState.drawnMinistryCards;
  }

  if (turnState === 'awaiting_hazard') {
    const ship = playerState?.ships?.find(s => s.status === 'awaiting_hazard');
    if (ship) {
      actionContext.shipAwaitingHazard = ship;
      actionContext.pendingHazard = ship.pendingHazard;
      actionContext.pendingRouteId = (ship as Ship & { pendingRouteId?: string }).pendingRouteId;
    }
  }

  if (turnState === 'at_launchpad') {
    actionContext.launchableShips = playerState?.ships?.filter(s => s.status === 'hangar') || [];
  }

  return {
    turnState,
    allowedActions: allowedEvents,
    actionContext
  };
}

/**
 * Map action types to UI button configurations
 *
 * @param allowedActions - List of allowed action types
 * @param actionContext - Context data for actions
 * @returns Array of button configurations
 */
function mapActionsToButtons(allowedActions: string[], actionContext: ActionContext = {}): ButtonConfig[] {
  const buttonConfigs: ButtonConfig[] = [];

  for (const action of allowedActions) {
    switch (action) {
      case 'PLACE_AGENT':
        buttonConfigs.push({
          action: 'PLACE_AGENT',
          label: 'Place Agent',
          description: 'Place an agent on a Ground Board location',
          icon: 'agent',
          primary: true,
          requiresSelection: true, // Needs location + card selection
          selectionType: 'location_and_card'
        });
        break;

      case 'REVEAL':
        buttonConfigs.push({
          action: 'REVEAL',
          label: 'Reveal & Pass',
          description: 'Reveal your hand and exit worker placement',
          icon: 'reveal',
          primary: false,
          requiresSelection: false
        });
        break;

      case 'KEEP_HAZARD':
        buttonConfigs.push({
          action: 'KEEP_HAZARD',
          label: 'Keep Hazard',
          description: `Keep "${(actionContext.peekedHazard as HazardCard | undefined)?.name || 'hazard'}" on top of deck`,
          icon: 'keep',
          primary: false,
          requiresSelection: false,
          variant: 'warning'
        });
        break;

      case 'DISCARD_HAZARD':
        buttonConfigs.push({
          action: 'DISCARD_HAZARD',
          label: 'Discard Hazard',
          description: `Discard "${(actionContext.peekedHazard as HazardCard | undefined)?.name || 'hazard'}" from deck`,
          icon: 'discard',
          primary: true,
          requiresSelection: false,
          variant: 'success'
        });
        break;

      case 'DISCARD_MINISTRY_CARD':
        // Create two buttons - one for each card
        if (actionContext.drawnMinistryCards?.length === 2) {
          buttonConfigs.push({
            action: 'DISCARD_MINISTRY_CARD',
            label: `Keep "${actionContext.drawnMinistryCards[1]?.name || 'Card 2'}"`,
            description: `Discard "${actionContext.drawnMinistryCards[0]?.name || 'Card 1'}"`,
            icon: 'card',
            primary: false,
            requiresSelection: false,
            actionData: { cardIndex: 0 }
          });
          buttonConfigs.push({
            action: 'DISCARD_MINISTRY_CARD',
            label: `Keep "${actionContext.drawnMinistryCards[0]?.name || 'Card 1'}"`,
            description: `Discard "${actionContext.drawnMinistryCards[1]?.name || 'Card 2'}"`,
            icon: 'card',
            primary: false,
            requiresSelection: false,
            actionData: { cardIndex: 1 }
          });
        }
        break;

      case 'LAUNCH_SHIP':
        buttonConfigs.push({
          action: 'LAUNCH_SHIP',
          label: 'Launch Ship',
          description: 'Launch a ship to claim a route',
          icon: 'launch',
          primary: true,
          requiresSelection: true,
          selectionType: 'ship_and_route',
          disabled: (actionContext.launchableShips?.length || 0) === 0,
          disabledReason: 'No ships available to launch'
        });
        break;

      case 'NO_MORE_LAUNCHES':
        buttonConfigs.push({
          action: 'NO_MORE_LAUNCHES',
          label: 'Done Launching',
          description: 'End your turn at the launchpad',
          icon: 'done',
          primary: false,
          requiresSelection: false
        });
        break;

      case 'RESPOND_TO_HAZARD':
        // Create buttons based on hazard type and player resources
        if (actionContext.pendingHazard) {
          const hazard = actionContext.pendingHazard as { engineerCost?: number; name?: string };
          const canSpend = ((actionContext.shipAwaitingHazard as Ship & { engineers?: number })?.engineers || 0) > 0;

          buttonConfigs.push({
            action: 'RESPOND_TO_HAZARD',
            label: 'Accept Risk',
            description: 'Attempt to pass without spending engineers',
            icon: 'dice',
            primary: !canSpend,
            requiresSelection: false,
            actionData: { spendEngineers: false }
          });

          if (hazard.engineerCost && canSpend) {
            buttonConfigs.push({
              action: 'RESPOND_TO_HAZARD',
              label: `Spend ${hazard.engineerCost} Engineer(s)`,
              description: 'Guarantee passing the hazard check',
              icon: 'engineer',
              primary: true,
              requiresSelection: false,
              actionData: { spendEngineers: true },
              variant: 'success'
            });
          }
        }
        break;

      case 'ACTIVATE_TURN':
        // Internal event, not shown to user
        break;

      default:
        // Unknown action - skip
        break;
    }
  }

  return buttonConfigs;
}

/**
 * Get complete UI state for a player
 *
 * @param state - Game state
 * @param playerId - Player ID
 * @returns Complete UI state including buttons
 */
function getPlayerUIState(state: GameState, playerId: string): PlayerUIStateResult {
  const { turnState, allowedActions, actionContext } = getPlayerAllowedActions(state, playerId);
  const buttons = mapActionsToButtons(allowedActions, actionContext);

  // Determine if player is blocked (must complete a multi-step action)
  const isBlocked = ['at_weather_bureau', 'at_ministry', 'awaiting_hazard'].includes(turnState);

  // Get a human-readable prompt
  const prompt = getStatePrompt(turnState, actionContext);

  return {
    turnState,
    allowedActions,
    actionContext,
    isMyTurn: turnState !== 'idle',
    isBlocked,
    prompt,
    buttons
  };
}

/**
 * Get a human-readable prompt for the current state
 */
function getStatePrompt(turnState: TurnStateValue, actionContext: ActionContext): string {
  switch (turnState) {
    case 'idle':
      return 'Waiting for your turn...';
    case 'awaiting_action':
      return 'Place an agent or reveal your hand';
    case 'at_weather_bureau':
      return `Weather Bureau: Keep or discard "${(actionContext.peekedHazard as HazardCard | undefined)?.name || 'this hazard'}"?`;
    case 'at_ministry':
      return 'Ministry: Choose which card to keep';
    case 'at_launchpad':
      return 'Launchpad: Launch ships or finish';
    case 'awaiting_hazard':
      return `Hazard Check: ${(actionContext.pendingHazard as { name?: string } | undefined)?.name || 'Resolve hazard'}`;
    default:
      return '';
  }
}

export {
  deriveTurnState,
  isPlayersTurn,
  getPlayerAllowedActions,
  mapActionsToButtons,
  getPlayerUIState,
  getStatePrompt
};

export type {
  TurnStateValue,
  ActionContext,
  ButtonConfig,
  PlayerAllowedActionsResult,
  PlayerUIStateResult
};

// CommonJS compatibility
module.exports = {
  deriveTurnState,
  isPlayersTurn,
  getPlayerAllowedActions,
  mapActionsToButtons,
  getPlayerUIState,
  getStatePrompt
};
