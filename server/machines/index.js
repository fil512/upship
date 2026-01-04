/**
 * State Machine Registry and Factory
 * Central entry point for game state machines
 */

const { createActor } = require('xstate');
const { turnMachine, initialContext, getAllowedEvents, isEventAllowed } = require('./turnMachine');

/**
 * Create a new turn machine actor
 * @param {Object} options - Optional configuration
 * @param {string} options.playerId - Player ID to set in context
 * @returns {Object} - XState actor instance
 */
function createTurnActor(options = {}) {
  const actor = createActor(turnMachine, {
    input: options.playerId ? { playerId: options.playerId } : undefined
  });
  return actor;
}

/**
 * Rehydrate a turn machine from persisted state
 * @param {Object} persistedState - Previously persisted machine state
 * @returns {Object} - XState actor instance restored to the persisted state
 */
function rehydrateTurnMachine(persistedState) {
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
 * @param {Object} actor - XState actor instance
 * @returns {Object} - Serializable state object
 */
function getPersistedState(actor) {
  const snapshot = actor.getSnapshot();
  return {
    value: snapshot.value,
    context: snapshot.context,
    status: snapshot.status
  };
}

/**
 * Initialize turn machine state for a player
 * Called when setting up a new game or when a player doesn't have machine state
 * @param {string} playerId - Player ID
 * @returns {Object} - Initial machine state for persistence
 */
function initializeTurnMachineState(playerId) {
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
 * @param {Object} machineState - Persisted machine state
 * @returns {string[]} - Array of allowed action types
 */
function getAllowedActionsForPlayer(machineState) {
  if (!machineState || !machineState.value) {
    return ['ACTIVATE_TURN']; // Idle state default
  }

  return getAllowedEvents(machineState.value);
}

/**
 * Check if an action is allowed for a player's current machine state
 * @param {Object} machineState - Persisted machine state
 * @param {string} actionType - Action type to check
 * @returns {boolean}
 */
function isActionAllowed(machineState, actionType) {
  if (!machineState || !machineState.value) {
    return actionType === 'ACTIVATE_TURN';
  }

  return isEventAllowed(machineState.value, actionType);
}

/**
 * Map game action types to machine event types
 * Most actions pass through unchanged, but some need mapping
 */
const actionToEventMap = {
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
 * @param {string} actionType - Action type to check
 * @returns {boolean}
 */
function isMachineControlledAction(actionType) {
  return machineControlledActions.has(actionType);
}

/**
 * Process a state transition
 * @param {Object} machineState - Current persisted machine state
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event data
 * @returns {Object} - { newMachineState, allowed }
 */
function processTransition(machineState, eventType, eventData = {}) {
  // Rehydrate the machine
  const actor = rehydrateTurnMachine(machineState);
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
      newMachineState: machineState,
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
