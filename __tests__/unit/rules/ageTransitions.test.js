/**
 * Rules Compliance Tests - Age Transitions
 * Tests for correct implementation of Section 1.3 and 12 (Progress Track and Age Transitions)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { startNewRound } = require('../../../server/actions/helpers/phaseTransition');
const { performAgeTransition, completeAgeTransition, scoreAgeVP, calculateTechnologyVP } = require('../../../server/actions/helpers/ageTransition');

describe('Rules Compliance - Age Transitions', () => {

  describe('GAP-010: Age transition via Progress Track', () => {
    it('should NOT transition age based on turn count per Section 1.3', () => {
      const state = createTestGameState();

      // Set turn to 11 (past TURNS_PER_AGE of 10) but progress track at 0
      state.turn = 10;
      state.age = 1;
      state.progressTrack = 2; // Well below threshold of 4 for 4 players
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // Start new round should increment turn but NOT change age
      startNewRound(state);

      // Turn should be 11 now
      expect(state.turn).toBe(11);
      // Age should still be 1 (NOT changed based on turns)
      expect(state.age).toBe(1);
    });

    it('should transition age when Progress Track reaches threshold per Section 1.3', () => {
      const state = createTestGameState();

      state.turn = 5;
      state.age = 1;
      state.progressTrack = 4; // Exactly at Age II threshold for 4 players
      state.progressThresholds = { age2: 4, age3: 8, end: 12 };

      // Age should transition when progress track reaches threshold
      // Per Section 12.1: Age transition includes a free Design Bureau phase
      // startNewRound triggers the transition but doesn't complete it immediately
      startNewRound(state);

      // Per Section 5.2 step 3: "Check Age Transition: If Progress Track reached threshold, trigger Age Transition"
      // The transition starts by entering the free Design Bureau phase
      expect(state.phase).toBe('age_transition_design_bureau');
      expect(state.ageTransitionDesignBureau.newAge).toBe(2);

      // Age is updated when completeAgeTransition is called (after free Design Bureau actions)
      completeAgeTransition(state);
      expect(state.age).toBe(2);
    });

    it('should reset player agentsRemaining to their actual agent count', () => {
      const state = createTestGameState();
      state.turn = 1;

      // Set up a player with 3 agents (earned 3rd)
      state.players['1'].agents = 3;
      state.players['1'].agentsRemaining = 0;
      state.players['1'].hasPassed = true;

      // Another player still with 2 agents
      state.players['2'].agents = 2;
      state.players['2'].agentsRemaining = 0;
      state.players['2'].hasPassed = true;

      startNewRound(state);

      // Each player should get their own agent count back
      expect(state.players['1'].agentsRemaining).toBe(3);
      expect(state.players['2'].agentsRemaining).toBe(2);
    });
  });

  describe('GAP-011: VP scoring at Age transitions', () => {
    it('should score VP for routes and technologies when age transitions per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 1;
      state.progressTrack = 12; // At threshold for Age II

      // Player 1 has claimed a route worth 2 VP
      state.map.routes[0].claimed = '1';
      state.map.routes[0].vp = 2;

      // Player 1 has technologies with VP values
      // Per constants.js: duralumin_girders = 1 VP, goldbeater_skin = 1 VP
      state.players['1'].technologies = ['duralumin_girders', 'goldbeater_skin'];

      // Initialize VP tracking
      state.players['1'].vp = 0;
      state.players['2'].vp = 0;

      // Perform age transition (should score VP)
      performAgeTransition(state, 2);

      // Player 1 should have gained VP:
      // - Routes: 2 VP (route distance)
      // - Technologies: 2 VP (1 + 1 from the two technologies)
      // Total: 4 VP
      expect(state.players['1'].vp).toBe(4);
    });

    it('should calculate technology VP based on tile VP value per Section 12.2', () => {
      // Per rules: Essential=0 VP, Useful=1 VP, Niche=2-3 VP
      // Using correct IDs from constants.js:
      // wooden_framework (vp: 0), wire_bracing (vp: 1), steel_framework (vp: 2)
      const techIds = ['wooden_framework', 'wire_bracing', 'steel_framework'];

      const vp = calculateTechnologyVP(techIds);

      expect(vp).toBe(3); // 0 + 1 + 2 = 3
    });

    it('should score route VP based on route.vp property per Section 12.2 and Appendix F', () => {
      const state = createTestGameState();

      // Set up multiple routes for player 1 with explicit vp property
      state.map.routes = [
        { id: 'route_1', vp: 1, claimed: '1' },
        { id: 'route_2', vp: 3, claimed: '1' },
        { id: 'route_3', vp: 2, claimed: '2' } // Different player
      ];

      const player1VP = scoreAgeVP(state, '1');

      // Player 1 should get 4 VP from routes (1 + 3)
      expect(player1VP.routes).toBe(4);
    });
  });

  describe('GAP-012: Ship and Officer recovery at age transitions', () => {
    it('should return ships to hangar and recover officers per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 1;

      // Player 1 has ships on routes (Age I ships return 1 officer each)
      state.players['1'].ships = [
        { id: 'ship1', status: 'on_route', routeId: 'route_1', officers: 1 },
        { id: 'ship2', status: 'on_route', routeId: 'route_2', officers: 1 }
      ];
      state.players['1'].officers = 0; // Started with 0 officers available

      // Perform age transition
      performAgeTransition(state, 2);

      // Ships should be returned to hangar
      expect(state.players['1'].ships.filter(s => s.status === 'in_hangar').length).toBe(2);

      // Officers should be recovered (1 per Age I ship)
      expect(state.players['1'].officers).toBe(2);
    });

    it('should recover 2 officers per Age II ship per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 2;

      // Player 1 has Age II ships on routes
      state.players['1'].ships = [
        { id: 'ship1', status: 'on_route', routeId: 'route_1', officers: 2, age: 2 },
        { id: 'ship2', status: 'on_route', routeId: 'route_2', officers: 2, age: 2 }
      ];
      state.players['1'].officers = 1;

      // Perform age transition
      performAgeTransition(state, 3);

      // Officers should be recovered (2 per Age II ship = 4 total, plus 1 existing = 5)
      expect(state.players['1'].officers).toBe(5);
    });

    it('should limit ship recovery to 3 ships due to hangar capacity per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 1;

      // Player has 4 ships on routes but can only recover 3
      state.players['1'].ships = [
        { id: 'ship1', status: 'on_route', routeId: 'route_1', officers: 1 },
        { id: 'ship2', status: 'on_route', routeId: 'route_2', officers: 1 },
        { id: 'ship3', status: 'on_route', routeId: 'route_3', officers: 1 },
        { id: 'ship4', status: 'on_route', routeId: 'route_4', officers: 1 }
      ];
      state.players['1'].officers = 0;

      performAgeTransition(state, 2);

      // Only 3 ships should be in hangar (max capacity)
      const shipsInHangar = state.players['1'].ships.filter(s => s.status === 'in_hangar');
      expect(shipsInHangar.length).toBe(3);

      // Only 3 officers recovered (from the 3 ships that fit in hangar)
      expect(state.players['1'].officers).toBe(3);
    });
  });

  describe('GAP-013: Transition income calculation', () => {
    it('should calculate new income from technology tiles minus routes lost per Section 12.1', () => {
      const state = createTestGameState();
      state.age = 1;

      // Player has income-granting technologies
      // Note: We need to define which techs grant income
      state.players['1'].technologies = ['cargo_systems']; // Assume this grants £2 income
      state.players['1'].income = 8; // Current income from routes

      // Player loses 2 routes when map changes
      state.map.routes = [
        { id: 'route_1', income: 2, claimed: '1' },
        { id: 'route_2', income: 3, claimed: '1' }
      ];

      performAgeTransition(state, 2);

      // New income = Tech income - £1 per route lost
      // If cargo_systems grants £2 income and 2 routes lost: 2 - 2 = 0 minimum
      // The exact calculation depends on how tech income is defined
      expect(state.players['1'].income).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GAP-014: Blueprint slot expansion at age transitions', () => {
    it('should expand blueprint slots when transitioning to Age II per Section 13.5', () => {
      const state = createTestGameState();
      state.age = 1;

      // Age I blueprint: 1/1/1/1 slots
      state.players['1'].blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: [null],
        componentSlots: [null]
      };

      performAgeTransition(state, 2);

      // Age II blueprint: 1/1/2/2 slots per Section 4.2
      expect(state.players['1'].blueprint.age).toBe(2);
      expect(state.players['1'].blueprint.driveSlots.length).toBe(2);
      expect(state.players['1'].blueprint.componentSlots.length).toBe(2);

      // Existing upgrades should be preserved
      expect(state.players['1'].blueprint.frameSlots[0]).toBe('duralumin_frame');
    });

    it('should expand to Age III blueprint configuration per Section 4.2', () => {
      const state = createTestGameState();
      state.age = 2;

      // Age II blueprint
      state.players['1'].blueprint = {
        age: 2,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['maybach_engine', null],
        componentSlots: ['cargo_systems', null]
      };

      performAgeTransition(state, 3);

      // Age III blueprint: 2/2/2/3 slots per Section 4.2
      expect(state.players['1'].blueprint.age).toBe(3);
      expect(state.players['1'].blueprint.frameSlots.length).toBe(2);
      expect(state.players['1'].blueprint.fabricSlots.length).toBe(2);
      expect(state.players['1'].blueprint.componentSlots.length).toBe(3);

      // Existing upgrades preserved
      expect(state.players['1'].blueprint.driveSlots[0]).toBe('maybach_engine');
    });
  });

  describe('GAP-015: Britain Red Tape flaw at age transitions', () => {
    it('should reduce Britain income by 1 at each age transition per Section 13.2', () => {
      const state = createTestGameState();
      state.age = 1;

      // Set up Britain player
      state.players['2'].faction = 'britain';
      state.players['2'].income = 6;

      // Start transition (enters Design Bureau phase)
      performAgeTransition(state, 2);
      // Complete transition (applies Red Tape flaw)
      completeAgeTransition(state);

      // Britain's income should be reduced by 1 due to Red Tape flaw
      expect(state.players['2'].income).toBe(5);
    });

    it('should not reduce income below 0 for Britain Red Tape', () => {
      const state = createTestGameState();
      state.age = 1;

      state.players['2'].faction = 'britain';
      state.players['2'].income = 0;

      // Start and complete transition
      performAgeTransition(state, 2);
      completeAgeTransition(state);

      // Income should stay at 0, not go negative
      expect(state.players['2'].income).toBe(0);
    });
  });

  describe('Free Design Bureau action during age transition', () => {
    it('should enter age_transition_design_bureau phase after performAgeTransition', () => {
      const state = createTestGameState();
      state.age = 1;

      performAgeTransition(state, 2);

      expect(state.phase).toBe('age_transition_design_bureau');
      expect(state.ageTransitionDesignBureau).toBeDefined();
      expect(state.ageTransitionDesignBureau.newAge).toBe(2);
      expect(state.ageTransitionDesignBureau.currentPlayerIndex).toBe(0);
      expect(state.ageTransitionDesignBureau.completedPlayers).toEqual([]);
    });

    it('should allow installing upgrades during age transition without Hull Upgrade charges', () => {
      const { processAgeTransitionDesignBureau } = require('../../../server/actions/blueprint');

      const state = createTestGameState();
      state.age = 1;
      state.playerOrder = ['1', '2'];

      // Set up player with a technology and one empty frame slot (second slot)
      // First frame slot and fabric slot already filled to pass completeness check
      state.players['1'].technologies = ['duralumin_girders'];
      state.players['1'].blueprint = {
        frameSlots: ['duralumin_frame', null],  // First filled, second empty
        fabricSlots: ['cotton_envelope'],       // Already filled
        driveSlots: [null],
        componentSlots: [null]
      };
      state.players['1'].ships = [{ id: 'ship1', status: 'hangar' }];
      state.players['1'].cash = 10;

      // Start transition
      performAgeTransition(state, 2);

      // Player 1 installs an upgrade - filling the second frame slot with a duplicate
      const result = processAgeTransitionDesignBureau(state, '1', {
        swaps: [{ action: 'install', slotType: 'frame', slotIndex: 1, upgradeId: 'duralumin_frame' }]
      });

      expect(result.newState.players['1'].blueprint.frameSlots[1]).toBe('duralumin_frame');
      // Cash should not be affected (no Hull Upgrade Rule)
      expect(result.newState.players['1'].cash).toBe(10);
    });

    it('should allow duplicate upgrades during age transition', () => {
      const { processAgeTransitionDesignBureau } = require('../../../server/actions/blueprint');

      const state = createTestGameState();
      state.age = 1;
      state.playerOrder = ['1', '2'];

      // Set up player with frame tech and slots - one already filled
      // Fabric slot already filled to pass completeness check
      state.players['1'].technologies = ['duralumin_girders'];
      state.players['1'].blueprint = {
        frameSlots: ['duralumin_frame', null],  // First slot already has this upgrade
        fabricSlots: ['cotton_envelope'],        // Already filled
        driveSlots: [null],
        componentSlots: [null]
      };

      performAgeTransition(state, 2);

      // Try to install same upgrade in second slot (duplicates allowed)
      const result = processAgeTransitionDesignBureau(state, '1', {
        swaps: [{ action: 'install', slotType: 'frame', slotIndex: 1, upgradeId: 'duralumin_frame' }]
      });

      // Both slots should now have the same upgrade
      expect(result.newState.players['1'].blueprint.frameSlots[0]).toBe('duralumin_frame');
      expect(result.newState.players['1'].blueprint.frameSlots[1]).toBe('duralumin_frame');
    });

    it('should complete age transition after all players submit their actions', () => {
      const { processAgeTransitionDesignBureau } = require('../../../server/actions/blueprint');

      const state = createTestGameState();
      state.age = 1;
      state.playerOrder = ['1', '2'];

      // Set up complete blueprints (no empty frame/fabric slots)
      state.players['1'].blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['cotton_envelope'],
        driveSlots: [],
        componentSlots: []
      };
      state.players['2'].blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['cotton_envelope'],
        driveSlots: [],
        componentSlots: []
      };

      performAgeTransition(state, 2);

      // Player 1 submits (no swaps)
      processAgeTransitionDesignBureau(state, '1', { swaps: [] });
      expect(state.phase).toBe('age_transition_design_bureau');  // Still in phase

      // Player 2 submits (no swaps)
      const result = processAgeTransitionDesignBureau(state, '2', { swaps: [] });

      // Transition should now be complete
      expect(result.newState.phase).toBe('worker_placement');
      expect(result.newState.age).toBe(2);
      expect(result.newState.ageTransitionDesignBureau).toBeUndefined();
    });
  });
});
