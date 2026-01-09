const {
  TECH_TILES,
  TECH_CARDS,
  AGE_BASELINES,
  getAvailableTechTiles,
  calculateShipStats,
  calculateLift,
  canLaunch
} = require('../../server/data/upgrades');
const { testBlueprint, emptyBlueprint } = require('../fixtures/testData');

describe('Upgrades Module', () => {
  describe('TECH_TILES constant', () => {
    it('should contain all required upgrade types', () => {
      const types = new Set(Object.values(TECH_TILES).map(u => u.type));
      expect(types).toContain('drive');
      expect(types).toContain('frame');
      expect(types).toContain('fabric');
      expect(types).toContain('component');
    });

    it('should have valid slot types for all upgrades', () => {
      const validSlotTypes = ['driveSlots', 'frameSlots', 'fabricSlots', 'componentSlots'];
      Object.values(TECH_TILES).forEach(upgrade => {
        expect(validSlotTypes).toContain(upgrade.slotType);
      });
    });

    it('should have age values between 1 and 3', () => {
      Object.values(TECH_TILES).forEach(upgrade => {
        expect(upgrade.age).toBeGreaterThanOrEqual(1);
        expect(upgrade.age).toBeLessThanOrEqual(3);
      });
    });

    it('should have required technology for each upgrade', () => {
      Object.values(TECH_TILES).forEach(upgrade => {
        expect(upgrade.requiredCard).toBeDefined();
        expect(typeof upgrade.requiredCard).toBe('string');
      });
    });

    it('should have numeric weight values', () => {
      Object.values(TECH_TILES).forEach(upgrade => {
        expect(typeof upgrade.weight).toBe('number');
      });
    });
  });

  describe('TECHNOLOGIES constant', () => {
    it('should contain starting technologies for all factions', () => {
      const factions = ['germany', 'britain', 'usa', 'italy'];
      factions.forEach(faction => {
        const factionTechs = Object.values(TECH_CARDS).filter(t => t.faction === faction);
        expect(factionTechs.length).toBeGreaterThan(0);
      });
    });

    it('should have valid age values', () => {
      Object.values(TECH_CARDS).forEach(tech => {
        expect(tech.age).toBeGreaterThanOrEqual(1);
        expect(tech.age).toBeLessThanOrEqual(3);
      });
    });

    it('should have valid cost values (0 or positive)', () => {
      Object.values(TECH_CARDS).forEach(tech => {
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

  describe('getAvailableTechTiles', () => {
    it('should return empty arrays when player has no technologies', () => {
      const result = getAvailableTechTiles([], 1);
      expect(result.driveSlots).toEqual([]);
      expect(result.frameSlots).toEqual([]);
      expect(result.fabricSlots).toEqual([]);
      expect(result.componentSlots).toEqual([]);
    });

    it('should return upgrades when player has matching technology', () => {
      const result = getAvailableTechTiles(['duralumin_girders'], 1);
      expect(result.frameSlots.length).toBeGreaterThan(0);
      expect(result.frameSlots.some(u => u.id === 'duralumin_frame')).toBe(true);
    });

    it('should filter by age', () => {
      // Age 2 upgrade should not appear in Age 1
      const age1Result = getAvailableTechTiles(['steel_framework'], 1);
      const age2Result = getAvailableTechTiles(['steel_framework'], 2);

      expect(age1Result.frameSlots.some(u => u.id === 'steel_frame')).toBe(false);
      expect(age2Result.frameSlots.some(u => u.id === 'steel_frame')).toBe(true);
    });

    it('should include upgrades from earlier ages', () => {
      const result = getAvailableTechTiles(['duralumin_girders'], 3);
      expect(result.frameSlots.some(u => u.id === 'duralumin_frame')).toBe(true);
    });

    it('should return upgrades grouped by slot type', () => {
      const techs = ['daimler_engine', 'duralumin_girders', 'goldbeater_skin', 'passenger_gondola'];
      const result = getAvailableTechTiles(techs, 1);

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
      expect(stats.speed).toBe(AGE_BASELINES[1].speed + TECH_TILES.basic_engine.stats.speed);
    });

    it('should accumulate weight from upgrades', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope']
      };
      const stats = calculateShipStats(blueprint, {}, 1);
      const expectedWeight = Math.abs(TECH_TILES.duralumin_frame.weight) + Math.abs(TECH_TILES.premium_envelope.weight);
      expect(stats.weight).toBe(expectedWeight);
    });

    it('should accumulate hull cost from frame and fabric', () => {
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope']
      };
      const stats = calculateShipStats(blueprint, {}, 1);
      // Hull cost is sum of installed tile costs (no base cost)
      const expectedHullCost = TECH_TILES.duralumin_frame.hullCost + TECH_TILES.premium_envelope.hullCost;
      expect(stats.hullCost).toBe(expectedHullCost);
    });

    it('should apply faction bonuses', () => {
      const stats = calculateShipStats(emptyBlueprint, { speed: 2 }, 1);
      expect(stats.speed).toBe(AGE_BASELINES[1].speed + 2);
    });

    it('should have zero baselines for all ages (stats come from tiles)', () => {
      // All ship stats come from installed tech tiles, not from age baselines
      const age1Stats = calculateShipStats(emptyBlueprint, {}, 1);
      const age2Stats = calculateShipStats(emptyBlueprint, {}, 2);
      const age3Stats = calculateShipStats(emptyBlueprint, {}, 3);

      // With empty blueprint, all stats should be 0 regardless of age
      expect(age1Stats.speed).toBe(0);
      expect(age2Stats.speed).toBe(0);
      expect(age3Stats.speed).toBe(0);
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
    it('should return 0 for blueprint with no frame tiles', () => {
      const blueprint = { ...emptyBlueprint, frameSlots: [] };
      expect(calculateLift(blueprint, {}, 1)).toBe(0);
    });

    it('should calculate 5 lift per frame tile (via gas_socket)', () => {
      // Each frame tile has gas_socket: 1, which provides +5 lift
      const blueprint1 = { ...emptyBlueprint, frameSlots: ['wooden_frame'] };
      expect(calculateLift(blueprint1, {}, 1)).toBe(5);

      const blueprint2 = { ...emptyBlueprint, frameSlots: ['wooden_frame', 'duralumin_frame'] };
      expect(calculateLift(blueprint2, {}, 1)).toBe(10);
    });

    it('should include bonus lift from special frame tiles', () => {
      // streamlined_hull has gas_socket: 1 (+5 lift) and lift: 2 (+2 bonus)
      const blueprint = { ...emptyBlueprint, frameSlots: ['streamlined_hull'] };
      expect(calculateLift(blueprint, {}, 1)).toBe(7); // 5 from socket + 2 bonus
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
      // duralumin_frame: lift 5 (from gas_socket), weight 2
      // Add heavy components to exceed lift capacity
      // twin_engine: weight 3, basic_engine: weight 1, external_cargo: weight 2
      const blueprint = {
        ...emptyBlueprint,
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['twin_engine'],
        componentSlots: ['external_cargo', 'external_cargo']
      };
      // Total: lift=5, weight=2+3+2+2=9 => insufficient
      const result = canLaunch(blueprint, {}, 1);
      expect(result.canLaunch).toBe(false);
      expect(result.message).toContain('lift');
    });

    it('should return true when all requirements are met', () => {
      const blueprint = {
        age: 1,
        frameSlots: ['duralumin_frame'],  // 5 lift (gas_socket), 2 weight
        fabricSlots: ['premium_envelope'], // 0 weight
        driveSlots: [null],
        componentSlots: [null]
      };
      // Lift: 5, Weight: 2 => can launch
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
