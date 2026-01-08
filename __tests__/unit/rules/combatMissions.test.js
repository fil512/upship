/**
 * Rules Compliance Tests - Combat Missions (Age II)
 * Tests for correct implementation of Section 10.5 and Appendix G
 */

const { createTestGameState } = require('../../fixtures/testData');

describe('Rules Compliance - Combat Missions (GAP-028)', () => {
  // Per rules Section 10.5 and Appendix G:
  // - Age II uses Combat Missions instead of map routes
  // - Mission Row of 6 face-up missions
  // - Mission flow: Hazard Check -> Mission Success -> Flak Check
  // - Flak: If Flak > Armor, ship destroyed; max Armor is 4, 5 Flak always destroys
  // - Completed missions provide ongoing income like routes

  describe('Combat Mission Deck', () => {
    let createCombatMissionDeck, COMBAT_MISSIONS;

    beforeAll(() => {
      try {
        const module = require('../../../server/data/combatMissions');
        COMBAT_MISSIONS = module.COMBAT_MISSIONS;
        createCombatMissionDeck = module.createCombatMissionDeck;
      } catch (e) {
        // Module not yet created
      }
    });

    it('should have COMBAT_MISSIONS data defined', () => {
      expect(COMBAT_MISSIONS).toBeDefined();
    });

    it('should have 20 combat mission cards per Appendix G', () => {
      expect(COMBAT_MISSIONS).toBeDefined();
      expect(COMBAT_MISSIONS.length).toBe(20);
    });

    it('should have 6 Bombing Runs', () => {
      const bombingRuns = COMBAT_MISSIONS.filter(m => m.type === 'bombing_run');
      expect(bombingRuns.length).toBe(6);
    });

    it('should have 5 Reconnaissance missions', () => {
      const recon = COMBAT_MISSIONS.filter(m => m.type === 'reconnaissance');
      expect(recon.length).toBe(5);
    });

    it('should have 5 Resupply missions', () => {
      const resupply = COMBAT_MISSIONS.filter(m => m.type === 'resupply');
      expect(resupply.length).toBe(5);
    });

    it('should have 2 Naval Patrols', () => {
      const naval = COMBAT_MISSIONS.filter(m => m.type === 'naval_patrol');
      expect(naval.length).toBe(2);
    });

    it('should have 2 Artillery Observation missions', () => {
      const artillery = COMBAT_MISSIONS.filter(m => m.type === 'artillery_observation');
      expect(artillery.length).toBe(2);
    });

    it('should have Capital Raid as highest VP mission (5 VP + 1 bonus)', () => {
      const capitalRaid = COMBAT_MISSIONS.find(m => m.name === 'Capital Raid');
      expect(capitalRaid).toBeDefined();
      expect(capitalRaid.vp).toBe(5);
      expect(capitalRaid.bonusVp).toBe(1);
      expect(capitalRaid.income).toBe(14);
    });

    it('should have all missions with required properties', () => {
      for (const mission of COMBAT_MISSIONS) {
        expect(mission).toHaveProperty('id');
        expect(mission).toHaveProperty('name');
        expect(mission).toHaveProperty('type');
        expect(mission).toHaveProperty('income');
        expect(mission).toHaveProperty('vp');
        // At least one stat requirement
        expect(
          mission.range !== undefined ||
          mission.speed !== undefined ||
          mission.ceiling !== undefined ||
          mission.reliability !== undefined
        ).toBe(true);
      }
    });
  });

  describe('Mission Row Setup', () => {
    let setupMissionRow;

    beforeAll(() => {
      try {
        const module = require('../../../server/data/combatMissions');
        setupMissionRow = module.setupMissionRow;
      } catch (e) {
        // Module not yet created
      }
    });

    it('should create a Mission Row with 6 face-up missions', () => {
      const state = createTestGameState();
      state.age = 2;

      const { missionRow, missionDeck } = setupMissionRow();

      expect(missionRow).toBeDefined();
      expect(missionRow.length).toBe(6);
      expect(missionDeck).toBeDefined();
      expect(missionDeck.length).toBe(14); // 20 - 6 = 14 remaining
    });
  });

  describe('Flak Check Mechanics', () => {
    let resolveFlakCheck;

    beforeAll(() => {
      try {
        const module = require('../../../server/actions/combatMission');
        resolveFlakCheck = module.resolveFlakCheck;
      } catch (e) {
        // Module not yet created
      }
    });

    it('should destroy ship when Flak > Armor', () => {
      const result = resolveFlakCheck({ armor: 1 }, { flak: 3 });
      expect(result.destroyed).toBe(true);
    });

    it('should survive when Flak <= Armor', () => {
      const result = resolveFlakCheck({ armor: 3 }, { flak: 2 });
      expect(result.destroyed).toBe(false);
    });

    it('should survive when Flak equals Armor', () => {
      const result = resolveFlakCheck({ armor: 2 }, { flak: 2 });
      expect(result.destroyed).toBe(false);
    });

    it('should always destroy on Flak 5 (max is 4 Armor)', () => {
      const result = resolveFlakCheck({ armor: 4 }, { flak: 5 });
      expect(result.destroyed).toBe(true);
    });

    it('should survive Flak 0 with any Armor', () => {
      const result = resolveFlakCheck({ armor: 0 }, { flak: 0 });
      expect(result.destroyed).toBe(false);
    });
  });

  describe('Mission Completion', () => {
    let processCompleteMission;

    beforeAll(() => {
      try {
        const module = require('../../../server/actions/combatMission');
        processCompleteMission = module.processCompleteMission;
      } catch (e) {
        // Module not yet created
      }
    });

    it('should award income when mission is completed', () => {
      const state = createTestGameState();
      state.age = 2;
      const playerState = state.players['1'];
      const initialIncome = playerState.income;

      const mission = { id: 'test_mission', income: 8, vp: 2 };

      processCompleteMission(state, '1', mission);

      expect(playerState.income).toBe(initialIncome + 8);
    });

    it('should store completed mission for VP scoring', () => {
      const state = createTestGameState();
      state.age = 2;
      state.players['1'].completedMissions = [];

      const mission = { id: 'test_mission', income: 8, vp: 2, name: 'Test Mission' };

      processCompleteMission(state, '1', mission);

      expect(state.players['1'].completedMissions).toContainEqual(
        expect.objectContaining({ id: 'test_mission' })
      );
    });

    it('should refill Mission Row after successful mission', () => {
      const state = createTestGameState();
      state.age = 2;
      state.missionRow = [
        { id: 'm1' }, { id: 'm2' }, { id: 'm3' },
        { id: 'm4' }, { id: 'm5' }, { id: 'm6' }
      ];
      state.missionDeck = [{ id: 'm7' }, { id: 'm8' }];

      const mission = state.missionRow[0];
      processCompleteMission(state, '1', mission);

      // Row should still have 6 missions after refill
      expect(state.missionRow.length).toBe(6);
    });
  });

  describe('GAP-044: USA Faction Late War Entry Restriction', () => {
    // Per Section 13.3: "Flaw: Late to enter war. Cannot be the first to
    // complete a combat mission (must wait until at least one other player has one)."

    let validateUsaMissionRestriction;

    beforeAll(() => {
      try {
        const module = require('../../../server/actions/combatMission');
        validateUsaMissionRestriction = module.validateUsaMissionRestriction;
      } catch (e) {
        // Module not yet created
      }
    });

    it('should block USA from being first to complete a mission', () => {
      const state = createTestGameState([1, 2, 3]); // 3 players only
      state.age = 2;
      state.players['1'].faction = 'usa';
      state.players['1'].completedMissions = [];
      state.players['2'].faction = 'germany';
      state.players['2'].completedMissions = [];
      state.players['3'].faction = 'britain';
      state.players['3'].completedMissions = [];

      const result = validateUsaMissionRestriction(state, '1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/late.*war|first/i);
    });

    it('should allow USA to claim mission once one opponent has completed one', () => {
      const state = createTestGameState([1, 2, 3]); // 3 players only
      state.age = 2;
      state.players['1'].faction = 'usa';
      state.players['1'].completedMissions = [];
      state.players['2'].faction = 'germany';
      state.players['2'].completedMissions = [{ id: 'm1' }]; // One opponent has a mission
      state.players['3'].faction = 'britain';
      state.players['3'].completedMissions = []; // Other opponent has none - still allowed

      const result = validateUsaMissionRestriction(state, '1');
      expect(result.allowed).toBe(true);
    });

    it('should not restrict non-USA factions', () => {
      const state = createTestGameState();
      state.age = 2;
      state.players['1'].faction = 'germany';
      state.players['1'].completedMissions = [];
      state.players['2'].faction = 'usa';
      state.players['2'].completedMissions = [];

      const result = validateUsaMissionRestriction(state, '1');
      expect(result.allowed).toBe(true);
    });

    it('should allow USA subsequent missions once first is acquired', () => {
      const state = createTestGameState();
      state.age = 2;
      state.players['1'].faction = 'usa';
      state.players['1'].completedMissions = [{ id: 'm1' }]; // USA already has one
      state.players['2'].faction = 'germany';
      state.players['2'].completedMissions = []; // Even if opponent has none

      const result = validateUsaMissionRestriction(state, '1');
      expect(result.allowed).toBe(true);
    });
  });
});
