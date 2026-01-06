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

    it('should contain exactly 8 Minor Hazard cards (difficulty 3-4)', () => {
      const deck = createHazardDeck();
      const minorHazards = deck.filter(card => card.category === 'minor');
      expect(minorHazards.length).toBe(8);

      // All minor hazards should have difficulty 3 or 4
      // (increased from 2-3 to require more engineer intervention)
      minorHazards.forEach(card => {
        expect(card.difficulty).toBeGreaterThanOrEqual(3);
        expect(card.difficulty).toBeLessThanOrEqual(4);
      });

      // Minor hazards should have challenge types
      minorHazards.forEach(card => {
        expect(['speed', 'reliability', 'ceiling', 'range']).toContain(card.challengeType);
      });
    });

    it('should contain exactly 8 Major Hazard cards (difficulty 5-6)', () => {
      const deck = createHazardDeck();
      const majorHazards = deck.filter(card => card.category === 'major');
      expect(majorHazards.length).toBe(8);

      // All major hazards should have difficulty 5 or 6
      // (increased from 4-5 to require more engineer intervention)
      majorHazards.forEach(card => {
        expect(card.difficulty).toBeGreaterThanOrEqual(5);
        expect(card.difficulty).toBeLessThanOrEqual(6);
      });

      // Major hazards should have challenge types
      majorHazards.forEach(card => {
        expect(['speed', 'reliability', 'ceiling', 'range']).toContain(card.challengeType);
      });
    });

    it('should contain exactly 6 Fire Hazard cards with correct distribution', () => {
      const deck = createHazardDeck();
      const fireHazards = deck.filter(card => card.category === 'fire');
      expect(fireHazards.length).toBe(6);

      // Check exact distribution: 2x Engine Fire, 2x Gas Cell Rupture, 1x Static Discharge, 1x Catastrophic Explosion
      const engineFires = fireHazards.filter(card => card.type === 'engine_fire');
      const gasCellRuptures = fireHazards.filter(card => card.type === 'gas_cell_rupture');
      const staticDischarges = fireHazards.filter(card => card.type === 'static_discharge');
      const catastrophicExplosions = fireHazards.filter(card => card.type === 'catastrophic_explosion');

      expect(engineFires.length).toBe(2);
      expect(gasCellRuptures.length).toBe(2);
      expect(staticDischarges.length).toBe(1);
      expect(catastrophicExplosions.length).toBe(1);
    });

    it('should have Engine Fire cards requiring 1 Engineer to save', () => {
      const deck = createHazardDeck();
      const engineFires = deck.filter(card => card.type === 'engine_fire');

      engineFires.forEach(card => {
        expect(card.engineerCost).toBe(1);
        expect(card.hydrogenOnly).toBe(true);
      });
    });

    it('should have Gas Cell Rupture cards requiring 2 Engineers to save', () => {
      const deck = createHazardDeck();
      const gasCellRuptures = deck.filter(card => card.type === 'gas_cell_rupture');

      gasCellRuptures.forEach(card => {
        expect(card.engineerCost).toBe(2);
        expect(card.hydrogenOnly).toBe(true);
      });
    });

    it('should have Static Discharge with difficulty 5 Reliability check', () => {
      const deck = createHazardDeck();
      const staticDischarge = deck.find(card => card.type === 'static_discharge');

      expect(staticDischarge).toBeDefined();
      // Difficulty increased from 4 to 5 to require more engineer intervention
      expect(staticDischarge.difficulty).toBe(5);
      expect(staticDischarge.challengeType).toBe('reliability');
      expect(staticDischarge.hydrogenOnly).toBe(true);
    });

    it('should have Catastrophic Explosion with no save', () => {
      const deck = createHazardDeck();
      const catastrophic = deck.find(card => card.type === 'catastrophic_explosion');

      expect(catastrophic).toBeDefined();
      expect(catastrophic.noSave).toBe(true);
      expect(catastrophic.hydrogenOnly).toBe(true);
    });

    it('should contain exactly 1 Mechanical Hazard (Critical Structural Stress)', () => {
      const deck = createHazardDeck();
      const mechanicalHazards = deck.filter(card => card.category === 'mechanical');
      expect(mechanicalHazards.length).toBe(1);

      const criticalStress = mechanicalHazards[0];
      expect(criticalStress.type).toBe('critical_structural_stress');
      expect(criticalStress.engineerCost).toBe(2);
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

      // From Appendix E detailed tables:
      // 0 Flak (7): Clear Weather x4, Light Turbulence, Crosswind, Fuel Concern
      // 1 Flak (4): Minor Engine Trouble, Gas Leak, Low Visibility, Headwind
      // 2 Flak (6): Structural Stress, Strong Headwind, Icing Conditions, Severe Icing, Engine Fire x2
      // 3 Flak (6): Engine Failure, Storm System, Navigation Error, Squall Line, Gas Cell Rupture x2
      // 4 Flak (3): Structural Damage, Static Discharge, Critical Structural Stress
      // 5 Flak (1): Catastrophic Explosion
      expect(flakCounts[0]).toBe(7);
      expect(flakCounts[1]).toBe(4);
      expect(flakCounts[2]).toBe(6);
      expect(flakCounts[3]).toBe(6); // Appendix E summary says 5, but detailed table shows 6
      expect(flakCounts[4]).toBe(3);
      expect(flakCounts[5]).toBe(1);
    });

    it('should have Clear Weather cards with 0 Flak', () => {
      const deck = createHazardDeck();
      const clearWeather = deck.filter(card => card.type === 'clear_weather');
      clearWeather.forEach(card => {
        expect(card.flak).toBe(0);
      });
    });

    it('should have Engine Fire cards with 2 Flak', () => {
      const deck = createHazardDeck();
      const engineFires = deck.filter(card => card.type === 'engine_fire');
      engineFires.forEach(card => {
        expect(card.flak).toBe(2);
      });
    });

    it('should have Gas Cell Rupture cards with 3 Flak', () => {
      const deck = createHazardDeck();
      const gasCellRuptures = deck.filter(card => card.type === 'gas_cell_rupture');
      gasCellRuptures.forEach(card => {
        expect(card.flak).toBe(3);
      });
    });

    it('should have Static Discharge with 4 Flak', () => {
      const deck = createHazardDeck();
      const staticDischarge = deck.find(card => card.type === 'static_discharge');
      expect(staticDischarge.flak).toBe(4);
    });

    it('should have Catastrophic Explosion with 5 Flak', () => {
      const deck = createHazardDeck();
      const catastrophic = deck.find(card => card.type === 'catastrophic_explosion');
      expect(catastrophic.flak).toBe(5);
    });

    it('should have Critical Structural Stress with 4 Flak', () => {
      const deck = createHazardDeck();
      const criticalStress = deck.find(card => card.type === 'critical_structural_stress');
      expect(criticalStress.flak).toBe(4);
    });
  });

  describe('GAP-039: Special hazard effects (Icing, Squall Line)', () => {
    let createHazardDeck;

    beforeAll(() => {
      const gameStateService = require('../../../server/services/gameStateService');
      createHazardDeck = gameStateService.createHazardDeck;
    });

    it('should have Icing Conditions with special gas loss effect', () => {
      const deck = createHazardDeck();
      const icingConditions = deck.find(card => card.name === 'Icing Conditions');
      expect(icingConditions).toBeDefined();
      expect(icingConditions.special).toBeDefined();
      expect(icingConditions.special).toContain('gas');
      expect(icingConditions.gasLossOnFailure).toBe(1);
    });

    it('should have Severe Icing with special gas loss effect', () => {
      const deck = createHazardDeck();
      const severeIcing = deck.find(card => card.name === 'Severe Icing');
      expect(severeIcing).toBeDefined();
      expect(severeIcing.special).toBeDefined();
      expect(severeIcing.gasLossOnFailure).toBe(2);
    });

    it('should have Squall Line with payload slot difficulty modifier', () => {
      const deck = createHazardDeck();
      const squallLine = deck.find(card => card.name === 'Squall Line');
      expect(squallLine).toBeDefined();
      expect(squallLine.special).toBeDefined();
      expect(squallLine.payloadSlotModifier).toBeDefined();
      expect(squallLine.payloadSlotModifier.threshold).toBe(3);
      expect(squallLine.payloadSlotModifier.difficultyIncrease).toBe(1);
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
      // Create a test state with a ship that has conductive_covering fabric
      const state = {
        age: 1,
        players: {
          player1: {
            engineers: 0,
            ships: [{
              id: 'ship1',
              status: 'awaiting_hazard',
              pendingRouteId: 'route1',
              gasType: 'hydrogen',
              stats: { speed: 1, reliability: 0, ceiling: 0, range: 1 }
            }],
            hazardDeck: [{
              id: 'static_discharge_0',
              type: 'static_discharge',
              category: 'fire',
              name: 'Static Discharge',
              hydrogenOnly: true,
              challengeType: 'reliability',
              difficulty: 5,
              flak: 4
            }],
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

      // Should pass without needing engineers due to Conductive Covering
      const result = processHazardCheck(state, 'player1', { shipId: 'ship1', engineersToSpend: 0 });
      expect(result.newState.players.player1.ships[0].status).toBe('on_route');
    });
  });
});
