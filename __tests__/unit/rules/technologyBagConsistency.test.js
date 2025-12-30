/**
 * Rules Compliance Tests - TECHNOLOGY_BAG Consistency
 * Ensures single source of truth for technology definitions across all modules
 *
 * Bug Report: Game stuck in Age 1 due to mismatched TECHNOLOGY_BAG definitions
 * - constants.js had 29 techs with different IDs
 * - gameStateService.js had 54 techs (correct version)
 * - gameStateHelpers.js had 17 techs (Age 2-3 only)
 */

describe('TECHNOLOGY_BAG Consistency', () => {
  // Import from all three locations to verify they're the same
  const constantsBag = require('../../../server/config/constants').TECHNOLOGY_BAG;

  describe('Single Source of Truth', () => {
    it('should export TECHNOLOGY_BAG from constants.js', () => {
      expect(constantsBag).toBeDefined();
      expect(typeof constantsBag).toBe('object');
    });

    it('gameStateService should re-export same TECHNOLOGY_BAG from constants', () => {
      const gameStateBag = require('../../../server/services/gameStateService').TECHNOLOGY_BAG;
      expect(gameStateBag).toBeDefined();
      // Should be the exact same object or identical content
      expect(JSON.stringify(gameStateBag)).toBe(JSON.stringify(constantsBag));
    });

    it('gameStateHelpers should import TECHNOLOGY_BAG from constants (no local definition)', () => {
      // This test verifies that gameStateHelpers no longer has its own partial definition
      // After fix: it should import from constants.js and have all ages including Age 1
      const helpersBag = require('../../../server/services/gameStateHelpers').TECHNOLOGY_BAG;

      // If helpers defines its own bag, it would be missing Age 1
      // After fix, it should have Age 1 from constants.js
      expect(helpersBag).toBeDefined();
      expect(helpersBag[1]).toBeDefined();
      expect(helpersBag[1].length).toBeGreaterThan(0);
    });
  });

  describe('Technology Counts', () => {
    it('should have 54 total technologies', () => {
      const total = constantsBag[1].length + constantsBag[2].length + constantsBag[3].length;
      expect(total).toBe(54);
    });

    it('should have 12 Age I technologies', () => {
      expect(constantsBag[1].length).toBe(12);
    });

    it('should have 23 Age II technologies', () => {
      expect(constantsBag[2].length).toBe(23);
    });

    it('should have 19 Age III technologies', () => {
      // Note: The comment in gameStateService.js said 20, but actual data has 19
      // The existing technologyTiles.test.js also expects 19
      expect(constantsBag[3].length).toBe(19);
    });
  });

  describe('Technology Properties', () => {
    it('should have income property on all technologies', () => {
      for (const age of [1, 2, 3]) {
        for (const tech of constantsBag[age]) {
          expect(tech.income).toBeDefined();
          expect(typeof tech.income).toBe('number');
        }
      }
    });

    it('should have required properties on all technologies', () => {
      for (const age of [1, 2, 3]) {
        for (const tech of constantsBag[age]) {
          expect(tech.id).toBeDefined();
          expect(tech.name).toBeDefined();
          expect(tech.type).toBeDefined();
          expect(tech.cost).toBeDefined();
          expect(tech.vp).toBeDefined();
        }
      }
    });

    it('should have correct tech IDs for Age I (from gameStateService version)', () => {
      const age1Ids = constantsBag[1].map(t => t.id);

      // These are the correct IDs from gameStateService.js
      // NOT the old constants.js IDs like observation_deck, cargo_systems
      expect(age1Ids).toContain('observation_platform');
      expect(age1Ids).toContain('mail_compartment');
      expect(age1Ids).toContain('cargo_nets');
      expect(age1Ids).toContain('improved_valving');
      expect(age1Ids).toContain('manual_ballonets');

      // These were the WRONG IDs from old constants.js - should NOT be present
      expect(age1Ids).not.toContain('observation_deck');
      expect(age1Ids).not.toContain('cargo_systems');
      expect(age1Ids).not.toContain('goldbeater_skin'); // This is Age II
      expect(age1Ids).not.toContain('maybach_engine'); // This is Age II
    });
  });
});

describe('R&D Board Integrity', () => {
  const { createTestGameState } = require('../../fixtures/testData');
  const { TECHNOLOGY_BAG } = require('../../../server/config/constants');

  // Helper to create a test state with real tech data
  const createStateWithTechs = () => {
    const state = createTestGameState();
    const age1Techs = [...TECHNOLOGY_BAG[1]].map(t => ({ ...t, age: 1 }));
    state.rdBoard = age1Techs.slice(0, 4);
    state.techBag = age1Techs.slice(4);
    state.age = 1;
    return state;
  };

  it('should maintain tech count invariant: rdBoard + techBag + acquired = initial', () => {
    const { processAcquireTechnologyResearch } = require('../../../server/actions/technology');

    const state = createStateWithTechs();
    const initialCount = state.rdBoard.length + state.techBag.length;
    const playerId = state.playerOrder[0];
    const techToAcquire = state.rdBoard[0].id;

    // Setup player to have enough research
    state.players[playerId].research = 10;
    state.players[playerId].technologies = [];
    const startingTechCount = 0;

    // Acquire a tech
    processAcquireTechnologyResearch(state, playerId, {
      techId: techToAcquire,
      _internal: true
    });

    const finalCount = state.rdBoard.length + state.techBag.length;
    const acquiredCount = state.players[playerId].technologies.length - startingTechCount;

    expect(finalCount + acquiredCount).toBe(initialCount);
  });

  it('should refill rdBoard from techBag after acquisition', () => {
    const { processAcquireTechnologyResearch } = require('../../../server/actions/technology');

    const state = createStateWithTechs();
    const initialRdBoardSize = state.rdBoard.length;
    const initialTechBagSize = state.techBag.length;
    const playerId = state.playerOrder[0];

    state.players[playerId].research = 10;
    state.players[playerId].technologies = [];

    processAcquireTechnologyResearch(state, playerId, {
      techId: state.rdBoard[0].id,
      _internal: true
    });

    // rdBoard should still be full if techBag had techs
    if (initialTechBagSize > 0) {
      expect(state.rdBoard.length).toBe(initialRdBoardSize);
      expect(state.techBag.length).toBe(initialTechBagSize - 1);
    }
  });

  it('should not lose techs when acquisition fails validation', () => {
    const { processAcquireTechnologyResearch } = require('../../../server/actions/technology');

    const state = createStateWithTechs();
    const initialTotal = state.rdBoard.length + state.techBag.length;
    const playerId = state.playerOrder[0];

    expect(() => {
      processAcquireTechnologyResearch(state, playerId, {
        techId: 'nonexistent_tech',
        _internal: true
      });
    }).toThrow();

    const finalTotal = state.rdBoard.length + state.techBag.length;
    expect(finalTotal).toBe(initialTotal);
  });
});
