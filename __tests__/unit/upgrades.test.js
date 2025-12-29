const {
  UPGRADES,
  TECHNOLOGIES,
  AGE_BASELINES,
  getAvailableUpgrades,
  calculateShipStats,
  calculateLift,
  canLaunch
} = require('../../server/data/upgrades');
const { testBlueprint, emptyBlueprint } = require('../fixtures/testData');

describe('Upgrades Module', () => {
  describe('UPGRADES constant', () => {
    it('should contain all required upgrade types', () => {
      const types = new Set(Object.values(UPGRADES).map(u => u.type));
      expect(types).toContain('drive');
      expect(types).toContain('frame');
      expect(types).toContain('fabric');
      expect(types).toContain('component');
    });

    it('should have valid slot types for all upgrades', () => {
      const validSlotTypes = ['driveSlots', 'frameSlots', 'fabricSlots', 'componentSlots'];
      Object.values(UPGRADES).forEach(upgrade => {
        expect(validSlotTypes).toContain(upgrade.slotType);
      });
    });

    it('should have age values between 1 and 3', () => {
      Object.values(UPGRADES).forEach(upgrade => {
        expect(upgrade.age).toBeGreaterThanOrEqual(1);
        expect(upgrade.age).toBeLessThanOrEqual(3);
      });
    });

    it('should have required technology for each upgrade', () => {
      Object.values(UPGRADES).forEach(upgrade => {
        expect(upgrade.requiredTech).toBeDefined();
        expect(typeof upgrade.requiredTech).toBe('string');
      });
    });

    it('should have numeric weight values', () => {
      Object.values(UPGRADES).forEach(upgrade => {
        expect(typeof upgrade.weight).toBe('number');
      });
    });
  });

  describe('TECHNOLOGIES constant', () => {
    it('should contain starting technologies for all factions', () => {
      const factions = ['germany', 'britain', 'usa', 'italy'];
      factions.forEach(faction => {
        const factionTechs = Object.values(TECHNOLOGIES).filter(t => t.faction === faction);
        expect(factionTechs.length).toBeGreaterThan(0);
      });
    });

    it('should have valid age values', () => {
      Object.values(TECHNOLOGIES).forEach(tech => {
        expect(tech.age).toBeGreaterThanOrEqual(1);
        expect(tech.age).toBeLessThanOrEqual(3);
      });
    });

    it('should have valid cost values (0 or positive)', () => {
      Object.values(TECHNOLOGIES).forEach(tech => {
        expect(tech.cost).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('AGE_BASELINES constant', () => {
    it('should have baselines for ages 1, 2, and 3', () => {
      expect(AGE_BASELINES[1]).toBeDefined();
      expect(AGE_BASELINES[2]).toBeDefined();
      expect(AGE_BASELINES[3]).toBeDefined();
    });

    it('should have increasing slot counts by age', () => {
      expect(AGE_BASELINES[3].componentSlots).toBeGreaterThanOrEqual(AGE_BASELINES[2].componentSlots);
      expect(AGE_BASELINES[2].componentSlots).toBeGreaterThanOrEqual(AGE_BASELINES[1].componentSlots);
    });

    it('should have all required properties', () => {
      const requiredProps = ['speed', 'range', 'ceiling', 'reliability', 'frameSlots', 'fabricSlots', 'driveSlots', 'componentSlots'];
      Object.values(AGE_BASELINES).forEach(baseline => {
        requiredProps.forEach(prop => {
          expect(baseline).toHaveProperty(prop);
        });
      });
    });
  });

  describe('getAvailableUpgrades', () => {
    it('should return empty arrays when player has no technologies', () => {
      const result = getAvailableUpgrades([], 1);
      expect(result.driveSlots).toEqual([]);
      expect(result.frameSlots).toEqual([]);
      expect(result.fabricSlots).toEqual([]);
      expect(result.componentSlots).toEqual([]);
    });

    it('should return upgrades when player has matching technology', () => {
      const result = getAvailableUpgrades(['duralumin_girders'], 1);
      expect(result.frameSlots.length).toBeGreaterThan(0);
      expect(result.frameSlots.some(u => u.id === 'duralumin_frame')).toBe(true);
    });

    it('should filter by age', () => {
      // Age 2 upgrade should not appear in Age 1
      const age1Result = getAvailableUpgrades(['steel_framework'], 1);
      const age2Result = getAvailableUpgrades(['steel_framework'], 2);

      expect(age1Result.frameSlots.some(u => u.id === 'steel_frame')).toBe(false);
      expect(age2Result.frameSlots.some(u => u.id === 'steel_frame')).toBe(true);
    });

    it('should include upgrades from earlier ages', () => {
      const result = getAvailableUpgrades(['duralumin_girders'], 3);
      expect(result.frameSlots.some(u => u.id === 'duralumin_frame')).toBe(true);
    });

    it('should return upgrades grouped by slot type', () => {
      const techs = ['daimler_engine', 'duralumin_girders', 'goldbeater_skin', 'passenger_gondola'];
      const result = getAvailableUpgrades(techs, 1);

      expect(result.driveSlots.every(u => u.slotType === 'driveSlots')).toBe(true);
      expect(result.frameSlots.every(u => u.slotType === 'frameSlots')).toBe(true);
      expect(result.fabricSlots.every(u => u.slotType === 'fabricSlots')).toBe(true);
      expect(result.componentSlots.every(u => u.slotType === 'componentSlots')).toBe(true);
    });
  });

  describe('calculateShipStats', () => {
    it('should return baseline stats for empty blueprint', () => {
      const stats = calculateShipStats(emptyBlueprint, {}, 1);
      expect(stats.speed).toBe(AGE_BASELINES[1].speed);
      expect(stats.range).toBe(AGE_BASELINES[1].range);
      expect(stats.weight).toBe(0);
    });

    it('should add upgrade stats to baseline', () => {
      const blueprint = {
        ...emptyBlueprint,
        driveSlots: ['basic_engine']
      };
      const stats = calculateShipStats(blueprint, {}, 1);
      expect(stats.speed).toBe(AGE_BASELINES[1].speed + UPGRADES.basic_engine.stats.speed);
    });

    it('should accumulate weight from upgrades', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope']
      };
      const stats = calculateShipStats(blueprint, {}, 1);
      const expectedWeight = Math.abs(UPGRADES.duralumin_frame.weight) + Math.abs(UPGRADES.premium_envelope.weight);
      expect(stats.weight).toBe(expectedWeight);
    });

    it('should accumulate hull cost from frame and fabric', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope']
      };
      const stats = calculateShipStats(blueprint, {}, 1);
      const expectedHullCost = 2 + UPGRADES.duralumin_frame.hullCost + UPGRADES.premium_envelope.hullCost;
      expect(stats.hullCost).toBe(expectedHullCost);
    });

    it('should apply faction bonuses', () => {
      const stats = calculateShipStats(emptyBlueprint, { speed: 2 }, 1);
      expect(stats.speed).toBe(AGE_BASELINES[1].speed + 2);
    });

    it('should use correct baseline for different ages', () => {
      const age1Stats = calculateShipStats(emptyBlueprint, {}, 1);
      const age2Stats = calculateShipStats(emptyBlueprint, {}, 2);
      const age3Stats = calculateShipStats(emptyBlueprint, {}, 3);

      expect(age2Stats.speed).toBeGreaterThan(age1Stats.speed);
      expect(age3Stats.speed).toBeGreaterThan(age2Stats.speed);
    });

    it('should handle null slots gracefully', () => {
      const blueprint = {
        frameSlots: [null, 'duralumin_frame', null],
        fabricSlots: [null],
        driveSlots: [null],
        componentSlots: [null]
      };
      expect(() => calculateShipStats(blueprint, {}, 1)).not.toThrow();
    });
  });

  describe('calculateLift', () => {
    it('should return 0 for empty gas sockets', () => {
      expect(calculateLift([])).toBe(0);
      expect(calculateLift(null)).toBe(0);
      expect(calculateLift(undefined)).toBe(0);
    });

    it('should calculate 5 lift per hydrogen cube', () => {
      expect(calculateLift(['hydrogen'])).toBe(5);
      expect(calculateLift(['hydrogen', 'hydrogen'])).toBe(10);
    });

    it('should calculate 5 lift per helium cube', () => {
      expect(calculateLift(['helium'])).toBe(5);
      expect(calculateLift(['helium', 'helium'])).toBe(10);
    });

    it('should handle mixed gas types', () => {
      expect(calculateLift(['hydrogen', 'helium'])).toBe(10);
    });

    it('should ignore invalid gas types', () => {
      expect(calculateLift(['hydrogen', 'invalid', 'helium'])).toBe(10);
    });
  });

  describe('canLaunch', () => {
    it('should return false when frame slots are not filled', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: [null],
        fabricSlots: ['premium_envelope'],
        gasSockets: ['hydrogen', 'hydrogen']
      };
      const result = canLaunch(blueprint, {}, 1);
      expect(result.canLaunch).toBe(false);
      expect(result.message).toContain('frame');
    });

    it('should return false when fabric slots are not filled', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: [null],
        gasSockets: ['hydrogen', 'hydrogen']
      };
      const result = canLaunch(blueprint, {}, 1);
      expect(result.canLaunch).toBe(false);
      expect(result.message).toContain('fabric');
    });

    it('should return false when lift is insufficient', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        gasSockets: [] // No gas = 0 lift
      };
      const result = canLaunch(blueprint, {}, 1);
      expect(result.canLaunch).toBe(false);
      expect(result.message).toContain('lift');
    });

    it('should return true when all requirements are met', () => {
      const blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: [null],
        componentSlots: [null],
        gasSockets: ['hydrogen', 'hydrogen'] // 10 lift, weight is ~2
      };
      const result = canLaunch(blueprint, {}, 1);
      expect(result.canLaunch).toBe(true);
      expect(result.message).toBe('Ready to launch');
    });

    it('should include lift and weight in result', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        gasSockets: ['hydrogen', 'hydrogen']
      };
      const result = canLaunch(blueprint, {}, 1);
      expect(typeof result.lift).toBe('number');
      expect(typeof result.weight).toBe('number');
    });

    it('should check requirements based on age', () => {
      // Age 3 requires 2 frame slots and 2 fabric slots
      const age1Blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: [null],
        componentSlots: [null],
        gasSockets: ['hydrogen', 'hydrogen']
      };

      // Same blueprint should fail Age 3 requirements
      const resultAge1 = canLaunch(age1Blueprint, {}, 1);
      expect(resultAge1.canLaunch).toBe(true);

      // Age 3 needs 2 frame, 2 fabric slots filled
      const resultAge3 = canLaunch(age1Blueprint, {}, 3);
      expect(resultAge3.canLaunch).toBe(false);
    });
  });
});
