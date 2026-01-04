/**
 * Player Turn State Machine
 * Manages multi-step player turn flows using XState
 *
 * Flows handled:
 * - Weather Bureau: Peek hazard → KEEP_HAZARD or DISCARD_HAZARD
 * - Ministry: Draw 2 cards → DISCARD_MINISTRY_CARD
 * - Launchpad: Activate → (LAUNCH_SHIP → RESPOND_TO_HAZARD)* → NO_MORE_LAUNCHES
 */

import type { Card, HazardCard, GasType } from '@upship/api';

const { createMachine, assign } = require('xstate');

// Type definitions for machine context
interface PendingLaunch {
  shipId: string;
  routeId: string;
  gasType: GasType;
  hazard: HazardCard | null;
}

interface TurnMachineContext {
  playerId: string | null;
  peekedHazard: HazardCard | null;
  drawnCards: Card[];
  launchpadActive: boolean;
  pendingLaunch: PendingLaunch | null;
}

// Event types
interface ActivateTurnEvent {
  type: 'ACTIVATE_TURN';
  playerId: string;
}

interface PlaceAgentEvent {
  type: 'PLACE_AGENT';
  locationId: string;
  hazard?: HazardCard;
  cards?: Card[];
}

interface RevealEvent {
  type: 'REVEAL';
}

interface KeepHazardEvent {
  type: 'KEEP_HAZARD';
}

interface DiscardHazardEvent {
  type: 'DISCARD_HAZARD';
}

interface DiscardMinistryCardEvent {
  type: 'DISCARD_MINISTRY_CARD';
  cardIndex: number;
}

interface LaunchShipEvent {
  type: 'LAUNCH_SHIP';
  shipId: string;
  routeId: string;
  gasType: GasType;
  hazard?: HazardCard;
}

interface NoMoreLaunchesEvent {
  type: 'NO_MORE_LAUNCHES';
}

interface RespondToHazardEvent {
  type: 'RESPOND_TO_HAZARD';
  spendEngineers: boolean;
}

type TurnMachineEvent =
  | ActivateTurnEvent
  | PlaceAgentEvent
  | RevealEvent
  | KeepHazardEvent
  | DiscardHazardEvent
  | DiscardMinistryCardEvent
  | LaunchShipEvent
  | NoMoreLaunchesEvent
  | RespondToHazardEvent;

// Type for guard/action context
interface GuardContext {
  context: TurnMachineContext;
  event: TurnMachineEvent;
}

/**
 * Guard functions for state transitions
 */
const guards = {
  isWeatherBureau: ({ event }: GuardContext) => (event as PlaceAgentEvent).locationId === 'weather-bureau',
  isMinistry: ({ event }: GuardContext) => (event as PlaceAgentEvent).locationId === 'ministry',
  isLaunchpad: ({ event }: GuardContext) => (event as PlaceAgentEvent).locationId === 'launchpad',

  isValidMinistryDiscard: ({ context, event }: GuardContext) => {
    // Must discard one of the two drawn cards
    const { cardIndex } = event as DiscardMinistryCardEvent;
    return context.drawnCards &&
           context.drawnCards.length === 2 &&
           (cardIndex === 0 || cardIndex === 1);
  },

  canLaunch: ({ context, event }: GuardContext) => {
    // Basic validation - detailed validation happens in action handler
    const launchEvent = event as LaunchShipEvent;
    return context.launchpadActive &&
           launchEvent.shipId &&
           launchEvent.routeId;
  },

  hasShipAwaitingHazard: ({ context }: GuardContext) => {
    return context.pendingLaunch !== null &&
           context.pendingLaunch.hazard !== null;
  }
};

/**
 * Action functions for state transitions
 * These update machine context only - game state updates happen in action handlers
 */
const actions = {
  // Weather Bureau actions
  setPeekedHazard: assign({
    peekedHazard: ({ event }: { event: PlaceAgentEvent }) => event.hazard || null
  }),

  clearPeekedHazard: assign({
    peekedHazard: null
  }),

  // Ministry actions
  setDrawnCards: assign({
    drawnCards: ({ event }: { event: PlaceAgentEvent }) => event.cards || []
  }),

  clearDrawnCards: assign({
    drawnCards: []
  }),

  // Launchpad actions
  activateLaunchpad: assign({
    launchpadActive: true
  }),

  deactivateLaunchpad: assign({
    launchpadActive: false
  }),

  // Launch flow actions
  setPendingLaunch: assign({
    pendingLaunch: ({ event }: { event: LaunchShipEvent }) => ({
      shipId: event.shipId,
      routeId: event.routeId,
      gasType: event.gasType,
      hazard: event.hazard || null
    })
  }),

  clearPendingLaunch: assign({
    pendingLaunch: null
  }),

  // Context initialization
  setPlayerId: assign({
    playerId: ({ event }: { event: ActivateTurnEvent }) => event.playerId
  })
};

/**
 * Initial context for a new turn machine
 */
const initialContext: TurnMachineContext = {
  playerId: null,
  peekedHazard: null,
  drawnCards: [],
  launchpadActive: false,
  pendingLaunch: null
};

/**
 * The main turn state machine
 *
 * States:
 * - idle: Not this player's turn (or turn just ended)
 * - awaiting_action: Player's turn, can place agent or reveal
 * - at_weather_bureau: Must choose KEEP_HAZARD or DISCARD_HAZARD
 * - at_ministry: Must choose which card to discard
 * - at_launchpad: Can launch ships or end launchpad
 * - awaiting_hazard: Must respond to hazard check
 */
const turnMachine = createMachine({
  id: 'playerTurn',
  initial: 'idle',
  context: initialContext,

  states: {
    idle: {
      description: 'Not this player\'s turn or turn just ended',
      on: {
        ACTIVATE_TURN: {
          target: 'awaiting_action',
          actions: 'setPlayerId'
        }
      }
    },

    awaiting_action: {
      description: 'Player can place an agent or reveal',
      on: {
        PLACE_AGENT: [
          {
            target: 'at_weather_bureau',
            guard: 'isWeatherBureau',
            actions: 'setPeekedHazard'
          },
          {
            target: 'at_ministry',
            guard: 'isMinistry',
            actions: 'setDrawnCards'
          },
          {
            target: 'at_launchpad',
            guard: 'isLaunchpad',
            actions: 'activateLaunchpad'
          },
          // All other locations: immediate resolution, back to idle
          {
            target: 'idle'
          }
        ],
        REVEAL: {
          target: 'idle'
        }
      }
    },

    at_weather_bureau: {
      description: 'Player has peeked at hazard, must keep or discard',
      on: {
        KEEP_HAZARD: {
          target: 'idle',
          actions: 'clearPeekedHazard'
        },
        DISCARD_HAZARD: {
          target: 'idle',
          actions: 'clearPeekedHazard'
        }
      }
    },

    at_ministry: {
      description: 'Player drew 2 cards, must discard 1',
      on: {
        DISCARD_MINISTRY_CARD: {
          target: 'idle',
          guard: 'isValidMinistryDiscard',
          actions: 'clearDrawnCards'
        }
      }
    },

    at_launchpad: {
      description: 'Player can launch ships or end launchpad',
      on: {
        LAUNCH_SHIP: {
          target: 'awaiting_hazard',
          guard: 'canLaunch',
          actions: 'setPendingLaunch'
        },
        NO_MORE_LAUNCHES: {
          target: 'idle',
          actions: 'deactivateLaunchpad'
        }
      }
    },

    awaiting_hazard: {
      description: 'Ship launched, awaiting hazard response',
      on: {
        RESPOND_TO_HAZARD: {
          target: 'at_launchpad',
          actions: 'clearPendingLaunch'
        }
      }
    }
  }
}, {
  guards,
  actions
});

// State value type
type TurnStateValue = 'idle' | 'awaiting_action' | 'at_weather_bureau' | 'at_ministry' | 'at_launchpad' | 'awaiting_hazard';

/**
 * Get allowed events for a given state
 * @param stateValue - Current state value (e.g., 'awaiting_action')
 * @returns Array of allowed event types
 */
function getAllowedEvents(stateValue: TurnStateValue): string[] {
  const allowedByState: Record<TurnStateValue, string[]> = {
    idle: ['ACTIVATE_TURN'],
    awaiting_action: ['PLACE_AGENT', 'REVEAL'],
    at_weather_bureau: ['KEEP_HAZARD', 'DISCARD_HAZARD'],
    at_ministry: ['DISCARD_MINISTRY_CARD'],
    at_launchpad: ['LAUNCH_SHIP', 'NO_MORE_LAUNCHES'],
    awaiting_hazard: ['RESPOND_TO_HAZARD']
  };

  return allowedByState[stateValue] || [];
}

/**
 * Check if an event is allowed in the current state
 * @param stateValue - Current state value
 * @param eventType - Event type to check
 * @returns boolean
 */
function isEventAllowed(stateValue: TurnStateValue, eventType: string): boolean {
  return getAllowedEvents(stateValue).includes(eventType);
}

export {
  turnMachine,
  initialContext,
  guards,
  actions,
  getAllowedEvents,
  isEventAllowed
};

export type {
  TurnMachineContext,
  TurnMachineEvent,
  TurnStateValue,
  PendingLaunch
};

// CommonJS compatibility
module.exports = {
  turnMachine,
  initialContext,
  guards,
  actions,
  getAllowedEvents,
  isEventAllowed
};
