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

    it('should contain exactly 8 Minor Hazard cards (difficulty 2-3)', () => {
      const deck = createHazardDeck();
      const minorHazards = deck.filter(card => card.category === 'minor');
      expect(minorHazards.length).toBe(8);

      // All minor hazards should have difficulty 2 or 3
      minorHazards.forEach(card => {
        expect(card.difficulty).toBeGreaterThanOrEqual(2);
        expect(card.difficulty).toBeLessThanOrEqual(3);
      });

      // Minor hazards should have challenge types
      minorHazards.forEach(card => {
        expect(['speed', 'reliability', 'ceiling', 'range']).toContain(card.challengeType);
      });
    });

    it('should contain exactly 8 Major Hazard cards (difficulty 4-5)', () => {
      const deck = createHazardDeck();
      const majorHazards = deck.filter(card => card.category === 'major');
      expect(majorHazards.length).toBe(8);

      // All major hazards should have difficulty 4 or 5
      majorHazards.forEach(card => {
        expect(card.difficulty).toBeGreaterThanOrEqual(4);
        expect(card.difficulty).toBeLessThanOrEqual(5);
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

    it('should have Static Discharge with difficulty 4 Reliability check', () => {
      const deck = createHazardDeck();
      const staticDischarge = deck.find(card => card.type === 'static_discharge');

      expect(staticDischarge).toBeDefined();
      expect(staticDischarge.difficulty).toBe(4);
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
});
