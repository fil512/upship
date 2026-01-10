/**
 * Rules Compliance Tests - Hazard Deck Composition
 * Tests for correct implementation of Appendix D (Hazard Deck)
 */

// We need to access the createHazardDeck function from gameStateService
// Since it's not exported, we'll need to import the module and test via player state creation

describe('Rules Compliance - Hazard Deck', () => {

  describe('GAP-030: Hazard Deck composition', () => {
    // Import the function - we'll need to export it or test via player state
    let createHazardDeck;

    beforeAll(() => {
      // The createHazardDeck function is defined in gameStateService.js
      // We'll need to test it through the module
      const gameStateService = require('../../../server/services/gameStateService');
      createHazardDeck = gameStateService.createHazardDeck;
    });

    it('should create a deck of 27 cards per Appendix D', () => {
      const deck = createHazardDeck();
      expect(deck.length).toBe(27);
    });

    it('should contain exactly 4 Clear Weather cards (auto-pass)', () => {
      const deck = createHazardDeck();
      const clearWeather = deck.filter(card => card.type === 'clear_weather');
      expect(clearWeather.length).toBe(4);

      // Clear weather cards should have autoPass property
      clearWeather.forEach(card => {
        expect(card.autoPass).toBe(true);
      });
    });

    it('should contain 17 standard Hazard cards (category: hazard)', () => {
      const deck = createHazardDeck();
      // Standard hazards now include all former minor/major + Critical Structural Stress
      const standardHazards = deck.filter(card => card.category === 'hazard');
      expect(standardHazards.length).toBe(17);

      // All standard hazards should have difficulty 1-4
      standardHazards.forEach(card => {
        expect(card.difficulty).toBeGreaterThanOrEqual(1);
        expect(card.difficulty).toBeLessThanOrEqual(4);
      });
    });

    it('should contain exactly 5 Fire Hazard cards with correct distribution', () => {
      const deck = createHazardDeck();
      const fireHazards = deck.filter(card => card.category === 'fire');
      expect(fireHazards.length).toBe(5);

      // Check distribution: 2x Engine Fire, 2x Gas Cell Rupture, 1x Static Discharge
      // Note: Catastrophic Explosion is now category: 'catastrophic'
      const engineFires = fireHazards.filter(card => card.type === 'engine_fire');
      const gasCellRuptures = fireHazards.filter(card => card.type === 'gas_cell_rupture');
      const staticDischarges = fireHazards.filter(card => card.type === 'static_discharge');

      expect(engineFires.length).toBe(2);
      expect(gasCellRuptures.length).toBe(2);
      expect(staticDischarges.length).toBe(1);
    });

    it('should contain exactly 1 Catastrophic hazard (Catastrophic Explosion)', () => {
      const deck = createHazardDeck();
      const catastrophicHazards = deck.filter(card => card.category === 'catastrophic');
      expect(catastrophicHazards.length).toBe(1);
      expect(catastrophicHazards[0].type).toBe('catastrophic_explosion');
      expect(catastrophicHazards[0].noSave).toBe(true);
    });

    it('should have Engine Fire cards with difficulty 2', () => {
      const deck = createHazardDeck();
      const engineFires = deck.filter(card => card.type === 'engine_fire');

      engineFires.forEach(card => {
        expect(card.difficulty).toBe(2);
        expect(card.hydrogenOnly).toBe(true);
        expect(card.engineerCost).toBeUndefined(); // No longer uses fixed cost
      });
    });

    it('should have Gas Cell Rupture cards with difficulty 3', () => {
      const deck = createHazardDeck();
      const gasCellRuptures = deck.filter(card => card.type === 'gas_cell_rupture');

      gasCellRuptures.forEach(card => {
        expect(card.difficulty).toBe(3);
        expect(card.hydrogenOnly).toBe(true);
        expect(card.engineerCost).toBeUndefined(); // No longer uses fixed cost
      });
    });

    it('should have Static Discharge with difficulty 2', () => {
      const deck = createHazardDeck();
      const staticDischarge = deck.find(card => card.type === 'static_discharge');

      expect(staticDischarge).toBeDefined();
      // Simplified: Total Difficulty = 2 - Ship Reliability. If > 0, spend engineers.
      expect(staticDischarge.difficulty).toBe(2);
      expect(staticDischarge.hydrogenOnly).toBe(true);
    });

    it('should have Catastrophic Explosion with no save', () => {
      const deck = createHazardDeck();
      const catastrophic = deck.find(card => card.type === 'catastrophic_explosion');

      expect(catastrophic).toBeDefined();
      expect(catastrophic.noSave).toBe(true);
      expect(catastrophic.hydrogenOnly).toBe(true);
    });

    it('should contain exactly 1 Critical Structural Stress card', () => {
      const deck = createHazardDeck();
      const criticalStress = deck.find(card => card.type === 'critical_structural_stress');
      expect(criticalStress).toBeDefined();
      expect(criticalStress.difficulty).toBe(3); // Uses unified difficulty formula
      expect(criticalStress.engineerCost).toBeUndefined(); // No longer uses fixed cost
    });

    it('should have all cards with unique IDs', () => {
      const deck = createHazardDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(27);
    });
  });

  describe('GAP-038: Hazard cards Flak values for Age II', () => {
    let createHazardDeck;

    beforeAll(() => {
      const gameStateService = require('../../../server/services/gameStateService');
      createHazardDeck = gameStateService.createHazardDeck;
    });

    it('should have flak property on all 27 hazard cards', () => {
      const deck = createHazardDeck();
      deck.forEach(card => {
        expect(card).toHaveProperty('flak');
        expect(typeof card.flak).toBe('number');
        expect(card.flak).toBeGreaterThanOrEqual(0);
        expect(card.flak).toBeLessThanOrEqual(5);
      });
    });

    it('should have correct Flak distribution per Appendix E', () => {
      const deck = createHazardDeck();
      // Per Appendix E detailed breakdown:
      // Clear Weather (4): 0 Flak each
      // Minor Hazards (8): 0-2 Flak
      // Major Hazards (8): 2-4 Flak
      // Fire Hazards (6): 2-5 Flak
      // Mechanical (1): 4 Flak

      const flakCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      deck.forEach(card => {
        flakCounts[card.flak] = (flakCounts[card.flak] || 0) + 1;
      });

      // Flak values reduced for ~50% survival with typical armor (0-2)
      // 0 Flak (10): Clear Weather x4, Light Turbulence, Minor Engine Trouble, Crosswind, Low Visibility, Fuel Concern, Headwind
      // 1 Flak (8): Gas Leak, Structural Stress, Strong Headwind, Icing Conditions, Navigation Error, Severe Icing, Engine Fire x2
      // 2 Flak (8): Engine Failure, Storm System, Structural Damage, Squall Line, Gas Cell Rupture x2, Static Discharge, Critical Structural Stress
      // 3 Flak (1): Catastrophic Explosion
      expect(flakCounts[0]).toBe(10);
      expect(flakCounts[1]).toBe(8);
      expect(flakCounts[2]).toBe(8);
      expect(flakCounts[3]).toBe(1);
    });

    it('should have Clear Weather cards with 0 Flak', () => {
      const deck = createHazardDeck();
      const clearWeather = deck.filter(card => card.type === 'clear_weather');
      clearWeather.forEach(card => {
        expect(card.flak).toBe(0);
      });
    });

    it('should have Engine Fire cards with 1 Flak', () => {
      const deck = createHazardDeck();
      const engineFires = deck.filter(card => card.type === 'engine_fire');
      engineFires.forEach(card => {
        expect(card.flak).toBe(1);
      });
    });

    it('should have Gas Cell Rupture cards with 2 Flak', () => {
      const deck = createHazardDeck();
      const gasCellRuptures = deck.filter(card => card.type === 'gas_cell_rupture');
      gasCellRuptures.forEach(card => {
        expect(card.flak).toBe(2);
      });
    });

    it('should have Static Discharge with 2 Flak', () => {
      const deck = createHazardDeck();
      const staticDischarge = deck.find(card => card.type === 'static_discharge');
      expect(staticDischarge.flak).toBe(2);
    });

    it('should have Catastrophic Explosion with 3 Flak', () => {
      const deck = createHazardDeck();
      const catastrophic = deck.find(card => card.type === 'catastrophic_explosion');
      expect(catastrophic.flak).toBe(3);
    });

    it('should have Critical Structural Stress with 2 Flak', () => {
      const deck = createHazardDeck();
      const criticalStress = deck.find(card => card.type === 'critical_structural_stress');
      expect(criticalStress.flak).toBe(2);
    });
  });

  describe('Simplified hazard system (no special effects)', () => {
    let createHazardDeck;

    beforeAll(() => {
      const gameStateService = require('../../../server/services/gameStateService');
      createHazardDeck = gameStateService.createHazardDeck;
    });

    it('should NOT have special gas loss effects on Icing cards', () => {
      const deck = createHazardDeck();
      const icingConditions = deck.find(card => card.name === 'Icing Conditions');
      expect(icingConditions).toBeDefined();
      expect(icingConditions.special).toBeUndefined();
      expect(icingConditions.gasLossOnFailure).toBeUndefined();
      // Should have standard difficulty
      expect(icingConditions.difficulty).toBe(3);
    });

    it('should NOT have special gas loss effects on Severe Icing', () => {
      const deck = createHazardDeck();
      const severeIcing = deck.find(card => card.name === 'Severe Icing');
      expect(severeIcing).toBeDefined();
      expect(severeIcing.special).toBeUndefined();
      expect(severeIcing.gasLossOnFailure).toBeUndefined();
      // Should have standard difficulty
      expect(severeIcing.difficulty).toBe(2);
    });

    it('should NOT have payload slot modifier on Squall Line', () => {
      const deck = createHazardDeck();
      const squallLine = deck.find(card => card.name === 'Squall Line');
      expect(squallLine).toBeDefined();
      expect(squallLine.special).toBeUndefined();
      expect(squallLine.payloadSlotModifier).toBeUndefined();
      // Should have standard difficulty
      expect(squallLine.difficulty).toBe(4);
    });
  });

  describe('GAP-045: Conductive Covering Static Discharge immunity', () => {
    // This tests that the hazard action checks for conductive covering
    // We'll test the hazard.js processHazardCheck function
    let processHazardCheck;

    beforeAll(() => {
      const hazardActions = require('../../../server/actions/hazard');
      processHazardCheck = hazardActions.processHazardCheck;
    });

    it('should auto-pass Static Discharge if ship has Conductive Covering fabric', () => {
      // Create a test state with a pending launch (ships are tokens now)
      const state = {
        age: 1,
        players: {
          player1: {
            engineers: 0,
            hangarShips: 0,  // Ship is mid-launch
            pendingLaunch: {
              routeId: 'route1',
              gasType: 'hydrogen',
              stats: { speed: 1, reliability: 0, ceiling: 0, range: 1 }
            },
            hazardDeck: [{
              id: 'static_discharge_0',
              type: 'static_discharge',
              category: 'fire',
              name: 'Static Discharge',
              hydrogenOnly: true,
              difficulty: 2,
              flak: 2  // Reduced for ~50% survival
            }],
            hazardDiscardPile: [],
            blueprint: {
              fabricSlots: ['conductive_covering'] // Has conductive covering installed
            }
          }
        },
        map: {
          routes: [{ id: 'route1', from: 'A', to: 'B', income: 2, claimed: null }]
        },
        log: []
      };

      const result = processHazardCheck(state, 'player1', {});

      // Should pass without needing engineers due to Conductive Covering
      // Route should be claimed (pendingLaunch cleared)
      expect(result.newState.players.player1.pendingLaunch).toBeUndefined();
      expect(result.newState.map.routes[0].claimed).toBe('player1');
    });
  });
});
