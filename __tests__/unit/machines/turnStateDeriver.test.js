/**
 * Turn State Deriver Tests
 *
 * Tests for deriving turn state from game state and mapping to UI buttons.
 */

const {
  deriveTurnState,
  isPlayersTurn,
  getPlayerAllowedActions,
  mapActionsToButtons,
  getPlayerUIState,
  getStatePrompt
} = require('../../../server/machines/turnStateDeriver');

describe('Turn State Deriver', () => {
  const playerId = 'player1';
  const player2Id = 'player2';

  let mockState;

  beforeEach(() => {
    mockState = {
      phase: 'worker_placement',
      playerOrder: [playerId, player2Id],
      currentPlayerIndex: 0,
      players: {
        [playerId]: {
          faction: 'germany',
          hasPassed: false,
          ships: [],
          hand: [{ name: 'Test Card', symbol: 'propeller' }],
          hazardDeck: [{ id: 'h1', type: 'storm', difficulty: 2 }]
        },
        [player2Id]: {
          faction: 'britain',
          hasPassed: false,
          ships: []
        }
      },
      workerPlacement: {
        passedPlayers: [],
        placementOrder: [playerId, player2Id],
        currentPlacerIndex: 0
      }
    };
  });

  describe('deriveTurnState', () => {
    it('should return idle for non-worker_placement phase', () => {
      mockState.phase = 'reveal';
      expect(deriveTurnState(mockState, playerId)).toBe('idle');
    });

    it('should return idle if player has passed', () => {
      mockState.players[playerId].hasPassed = true;
      expect(deriveTurnState(mockState, playerId)).toBe('idle');
    });

    it('should return idle if not player\'s turn', () => {
      mockState.workerPlacement.currentPlacerIndex = 1;
      expect(deriveTurnState(mockState, playerId)).toBe('idle');
    });

    it('should return awaiting_action when it is player\'s turn', () => {
      expect(deriveTurnState(mockState, playerId)).toBe('awaiting_action');
    });

    it('should return at_weather_bureau when player has peekedHazard', () => {
      mockState.players[playerId].peekedHazard = { id: 'h1', type: 'storm' };
      expect(deriveTurnState(mockState, playerId)).toBe('at_weather_bureau');
    });

    it('should return at_ministry when player has 2 drawn ministry cards', () => {
      mockState.players[playerId].drawnMinistryCards = [
        { name: 'Card 1' },
        { name: 'Card 2' }
      ];
      expect(deriveTurnState(mockState, playerId)).toBe('at_ministry');
    });

    it('should return at_launchpad when launchpadActive for player', () => {
      mockState.launchpadActive = { [playerId]: true };
      expect(deriveTurnState(mockState, playerId)).toBe('at_launchpad');
    });

    it('should return awaiting_hazard when ship has pending hazard', () => {
      mockState.players[playerId].ships = [
        { id: 'ship1', status: 'awaiting_hazard', pendingHazard: { id: 'h1' } }
      ];
      expect(deriveTurnState(mockState, playerId)).toBe('awaiting_hazard');
    });

    it('should prioritize awaiting_hazard over other states', () => {
      // Even if launchpad is active, awaiting_hazard takes priority
      mockState.launchpadActive = { [playerId]: true };
      mockState.players[playerId].ships = [
        { id: 'ship1', status: 'awaiting_hazard', pendingHazard: { id: 'h1' } }
      ];
      expect(deriveTurnState(mockState, playerId)).toBe('awaiting_hazard');
    });
  });

  describe('isPlayersTurn', () => {
    it('should return true for current placer in worker_placement', () => {
      expect(isPlayersTurn(mockState, playerId)).toBe(true);
      expect(isPlayersTurn(mockState, player2Id)).toBe(false);
    });

    it('should return true for all players in reveal phase', () => {
      mockState.phase = 'reveal';
      expect(isPlayersTurn(mockState, playerId)).toBe(true);
      expect(isPlayersTurn(mockState, player2Id)).toBe(true);
    });

    it('should return true for current player in cleanup', () => {
      mockState.phase = 'cleanup';
      mockState.currentPlayerIndex = 0;
      expect(isPlayersTurn(mockState, playerId)).toBe(true);
      expect(isPlayersTurn(mockState, player2Id)).toBe(false);
    });
  });

  describe('getPlayerAllowedActions', () => {
    it('should return PLACE_AGENT and REVEAL for awaiting_action', () => {
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('awaiting_action');
      expect(result.allowedActions).toContain('PLACE_AGENT');
      expect(result.allowedActions).toContain('REVEAL');
    });

    it('should return KEEP_HAZARD and DISCARD_HAZARD for at_weather_bureau', () => {
      mockState.players[playerId].peekedHazard = { id: 'h1', name: 'Storm' };
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('at_weather_bureau');
      expect(result.allowedActions).toContain('KEEP_HAZARD');
      expect(result.allowedActions).toContain('DISCARD_HAZARD');
      expect(result.actionContext.peekedHazard.name).toBe('Storm');
    });

    it('should return DISCARD_MINISTRY_CARD for at_ministry', () => {
      mockState.players[playerId].drawnMinistryCards = [
        { name: 'Card A' },
        { name: 'Card B' }
      ];
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('at_ministry');
      expect(result.allowedActions).toContain('DISCARD_MINISTRY_CARD');
      expect(result.actionContext.drawnMinistryCards).toHaveLength(2);
    });

    it('should return LAUNCH_SHIP and NO_MORE_LAUNCHES for at_launchpad', () => {
      mockState.launchpadActive = { [playerId]: true };
      mockState.players[playerId].ships = [{ id: 's1', status: 'hangar' }];
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('at_launchpad');
      expect(result.allowedActions).toContain('LAUNCH_SHIP');
      expect(result.allowedActions).toContain('NO_MORE_LAUNCHES');
      expect(result.actionContext.launchableShips).toHaveLength(1);
    });

    it('should return RESPOND_TO_HAZARD for awaiting_hazard', () => {
      mockState.players[playerId].ships = [
        {
          id: 'ship1',
          status: 'awaiting_hazard',
          pendingHazard: { id: 'h1', name: 'Engine Failure' },
          pendingRouteId: 'route1'
        }
      ];
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('awaiting_hazard');
      expect(result.allowedActions).toContain('RESPOND_TO_HAZARD');
      expect(result.actionContext.pendingHazard.name).toBe('Engine Failure');
      expect(result.actionContext.pendingRouteId).toBe('route1');
    });

    it('should return only internal event for idle state', () => {
      mockState.workerPlacement.currentPlacerIndex = 1;
      const result = getPlayerAllowedActions(mockState, playerId);
      expect(result.turnState).toBe('idle');
      // ACTIVATE_TURN is internal, not shown to user
      expect(result.allowedActions).toEqual(['ACTIVATE_TURN']);
    });
  });

  describe('mapActionsToButtons', () => {
    it('should map PLACE_AGENT to button config', () => {
      const buttons = mapActionsToButtons(['PLACE_AGENT'], {});
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toMatchObject({
        action: 'PLACE_AGENT',
        label: 'Place Agent',
        primary: true,
        requiresSelection: true,
        selectionType: 'location_and_card'
      });
    });

    it('should map REVEAL to button config', () => {
      const buttons = mapActionsToButtons(['REVEAL'], {});
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toMatchObject({
        action: 'REVEAL',
        label: 'Reveal & Pass',
        primary: false
      });
    });

    it('should map Weather Bureau actions with hazard name', () => {
      const context = { peekedHazard: { name: 'Thunderstorm' } };
      const buttons = mapActionsToButtons(['KEEP_HAZARD', 'DISCARD_HAZARD'], context);
      expect(buttons).toHaveLength(2);
      expect(buttons[0].description).toContain('Thunderstorm');
      expect(buttons[1].description).toContain('Thunderstorm');
    });

    it('should map Ministry discard to two buttons', () => {
      const context = {
        drawnMinistryCards: [
          { name: 'Investor' },
          { name: 'Admiral' }
        ]
      };
      const buttons = mapActionsToButtons(['DISCARD_MINISTRY_CARD'], context);
      expect(buttons).toHaveLength(2);
      expect(buttons[0].actionData).toEqual({ cardIndex: 0 });
      expect(buttons[0].label).toContain('Admiral'); // Keep card 2
      expect(buttons[1].actionData).toEqual({ cardIndex: 1 });
      expect(buttons[1].label).toContain('Investor'); // Keep card 1
    });

    it('should map LAUNCH_SHIP with disabled state when no ships', () => {
      const context = { launchableShips: [] };
      const buttons = mapActionsToButtons(['LAUNCH_SHIP', 'NO_MORE_LAUNCHES'], context);
      const launchButton = buttons.find(b => b.action === 'LAUNCH_SHIP');
      expect(launchButton.disabled).toBe(true);
      expect(launchButton.disabledReason).toBe('No ships available to launch');
    });

    it('should map RESPOND_TO_HAZARD to two buttons', () => {
      const context = {
        pendingHazard: { name: 'Engine Fire', engineerCost: 2 },
        shipAwaitingHazard: { id: 's1', engineers: 3 }
      };
      const buttons = mapActionsToButtons(['RESPOND_TO_HAZARD'], context);
      expect(buttons).toHaveLength(2);

      const riskButton = buttons.find(b => b.actionData?.spendEngineers === false);
      expect(riskButton.label).toBe('Accept Risk');

      const spendButton = buttons.find(b => b.actionData?.spendEngineers === true);
      expect(spendButton.label).toBe('Spend 2 Engineer(s)');
      expect(spendButton.variant).toBe('success');
    });
  });

  describe('getStatePrompt', () => {
    it('should return waiting message for idle', () => {
      expect(getStatePrompt('idle', {})).toBe('Waiting for your turn...');
    });

    it('should return action prompt for awaiting_action', () => {
      expect(getStatePrompt('awaiting_action', {})).toBe('Place an agent or reveal your hand');
    });

    it('should include hazard name for at_weather_bureau', () => {
      const prompt = getStatePrompt('at_weather_bureau', { peekedHazard: { name: 'Storm' } });
      expect(prompt).toContain('Storm');
    });

    it('should return ministry prompt for at_ministry', () => {
      expect(getStatePrompt('at_ministry', {})).toBe('Ministry: Choose which card to keep');
    });

    it('should return launchpad prompt for at_launchpad', () => {
      expect(getStatePrompt('at_launchpad', {})).toBe('Launchpad: Launch ships or finish');
    });

    it('should include hazard name for awaiting_hazard', () => {
      const prompt = getStatePrompt('awaiting_hazard', { pendingHazard: { name: 'Crosswind' } });
      expect(prompt).toContain('Crosswind');
    });
  });

  describe('getPlayerUIState', () => {
    it('should return complete UI state for awaiting_action', () => {
      const uiState = getPlayerUIState(mockState, playerId);
      expect(uiState.turnState).toBe('awaiting_action');
      expect(uiState.isMyTurn).toBe(true);
      expect(uiState.isBlocked).toBe(false);
      expect(uiState.prompt).toBe('Place an agent or reveal your hand');
      expect(uiState.buttons.length).toBeGreaterThan(0);
    });

    it('should mark player as blocked for multi-step states', () => {
      mockState.players[playerId].peekedHazard = { id: 'h1', name: 'Storm' };
      const uiState = getPlayerUIState(mockState, playerId);
      expect(uiState.isBlocked).toBe(true);
      expect(uiState.turnState).toBe('at_weather_bureau');
    });

    it('should include actionContext in UI state', () => {
      mockState.players[playerId].drawnMinistryCards = [
        { name: 'Card 1' },
        { name: 'Card 2' }
      ];
      const uiState = getPlayerUIState(mockState, playerId);
      expect(uiState.actionContext.drawnMinistryCards).toHaveLength(2);
    });
  });
});
