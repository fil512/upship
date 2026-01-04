/**
 * State Machine Registry and Factory
 * Central entry point for game state machines
 */

import type { TurnMachineContext, TurnStateValue } from './turnMachine';

const { createActor } = require('xstate');
const { turnMachine, initialContext, getAllowedEvents, isEventAllowed } = require('./turnMachine');

// Persisted machine state for database storage
interface PersistedMachineState {
  value: TurnStateValue;
  context: TurnMachineContext;
  status: 'active' | 'done' | 'error';
}

// Transition result
interface TransitionResult {
  newMachineState: PersistedMachineState;
  allowed: boolean;
}

// Options for creating turn actor
interface CreateTurnActorOptions {
  playerId?: string;
}

/**
 * Create a new turn machine actor
 * @param options - Optional configuration
 * @returns XState actor instance
 */
function createTurnActor(options: CreateTurnActorOptions = {}): unknown {
  const actor = createActor(turnMachine, {
    input: options.playerId ? { playerId: options.playerId } : undefined
  });
  return actor;
}

/**
 * Rehydrate a turn machine from persisted state
 * @param persistedState - Previously persisted machine state
 * @returns XState actor instance restored to the persisted state
 */
function rehydrateTurnMachine(persistedState: PersistedMachineState | null): unknown {
  if (!persistedState) {
    // No persisted state - create fresh machine in idle state
    return createTurnActor();
  }

  // XState v5 approach: create actor with restored snapshot
  const actor = createActor(turnMachine, {
    snapshot: persistedState
  });

  return actor;
}

/**
 * Get the persisted state from an actor for database storage
 * @param actor - XState actor instance
 * @returns Serializable state object
 */
function getPersistedState(actor: { getSnapshot: () => { value: TurnStateValue; context: TurnMachineContext; status: string } }): PersistedMachineState {
  const snapshot = actor.getSnapshot();
  return {
    value: snapshot.value,
    context: snapshot.context,
    status: snapshot.status as 'active' | 'done' | 'error'
  };
}

/**
 * Initialize turn machine state for a player
 * Called when setting up a new game or when a player doesn't have machine state
 * @param playerId - Player ID
 * @returns Initial machine state for persistence
 */
function initializeTurnMachineState(playerId: string): PersistedMachineState {
  return {
    value: 'idle',
    context: {
      ...initialContext,
      playerId
    },
    status: 'active'
  };
}

/**
 * Get allowed actions for a player based on their machine state
 * @param machineState - Persisted machine state
 * @returns Array of allowed action types
 */
function getAllowedActionsForPlayer(machineState: PersistedMachineState | null): string[] {
  if (!machineState || !machineState.value) {
    return ['ACTIVATE_TURN']; // Idle state default
  }

  return getAllowedEvents(machineState.value);
}

/**
 * Check if an action is allowed for a player's current machine state
 * @param machineState - Persisted machine state
 * @param actionType - Action type to check
 * @returns boolean
 */
function isActionAllowed(machineState: PersistedMachineState | null, actionType: string): boolean {
  if (!machineState || !machineState.value) {
    return actionType === 'ACTIVATE_TURN';
  }

  return isEventAllowed(machineState.value, actionType);
}

/**
 * Map game action types to machine event types
 * Most actions pass through unchanged, but some need mapping
 */
const actionToEventMap: Record<string, string> = {
  PLACE_AGENT: 'PLACE_AGENT',
  REVEAL: 'REVEAL',
  KEEP_HAZARD: 'KEEP_HAZARD',
  DISCARD_HAZARD: 'DISCARD_HAZARD',
  DISCARD_MINISTRY_CARD: 'DISCARD_MINISTRY_CARD',
  LAUNCH_SHIP: 'LAUNCH_SHIP',
  RESPOND_TO_HAZARD: 'RESPOND_TO_HAZARD',
  NO_MORE_LAUNCHES: 'NO_MORE_LAUNCHES'
};

/**
 * Actions that are managed by the turn state machine
 * Other actions bypass machine validation
 */
const machineControlledActions = new Set([
  'PLACE_AGENT',
  'REVEAL',
  'KEEP_HAZARD',
  'DISCARD_HAZARD',
  'DISCARD_MINISTRY_CARD',
  'LAUNCH_SHIP',
  'RESPOND_TO_HAZARD',
  'NO_MORE_LAUNCHES'
]);

/**
 * Check if an action type is controlled by the turn machine
 * @param actionType - Action type to check
 * @returns boolean
 */
function isMachineControlledAction(actionType: string): boolean {
  return machineControlledActions.has(actionType);
}

/**
 * Process a state transition
 * @param machineState - Current persisted machine state
 * @param eventType - Event type
 * @param eventData - Event data
 * @returns { newMachineState, allowed }
 */
function processTransition(
  machineState: PersistedMachineState | null,
  eventType: string,
  eventData: Record<string, unknown> = {}
): TransitionResult {
  // Rehydrate the machine
  const actor = rehydrateTurnMachine(machineState) as {
    start: () => void;
    stop: () => void;
    send: (event: unknown) => void;
    getSnapshot: () => { value: TurnStateValue; context: TurnMachineContext; status: string; can: (event: unknown) => boolean };
  };
  actor.start();

  // Get current snapshot to check if transition is valid
  const currentSnapshot = actor.getSnapshot();

  // Try to send the event
  const event = { type: eventType, ...eventData };

  // Check if the transition would be valid
  const canTransition = currentSnapshot.can(event);

  if (!canTransition) {
    actor.stop();
    return {
      newMachineState: machineState || initializeTurnMachineState(''),
      allowed: false
    };
  }

  // Send the event and get new state
  actor.send(event);
  const newSnapshot = actor.getSnapshot();
  actor.stop();

  return {
    newMachineState: getPersistedState({ getSnapshot: () => newSnapshot }),
    allowed: true
  };
}

export {
  turnMachine,
  createTurnActor,
  rehydrateTurnMachine,
  getPersistedState,
  initializeTurnMachineState,
  getAllowedActionsForPlayer,
  isActionAllowed,
  isMachineControlledAction,
  processTransition,
  actionToEventMap
};

export type {
  PersistedMachineState,
  TransitionResult,
  CreateTurnActorOptions
};

// CommonJS compatibility
module.exports = {
  turnMachine,
  createTurnActor,
  rehydrateTurnMachine,
  getPersistedState,
  initializeTurnMachineState,
  getAllowedActionsForPlayer,
  isActionAllowed,
  isMachineControlledAction,
  processTransition,
  actionToEventMap
};
