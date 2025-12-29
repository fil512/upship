/**
 * Rules Compliance Tests - Upgrades
 * Tests for correct implementation of Appendix C and D (Technology/Upgrade Tiles)
 */

const { UPGRADES, TECHNOLOGIES } = require('../../../server/data/upgrades');

describe('Rules Compliance - Upgrades', () => {

  describe('GAP-054: Grounding Systems / Conductive Covering upgrade', () => {
    it('should have conductive_covering upgrade in UPGRADES data per Appendix D', () => {
      // Appendix D defines Conductive Covering as a fabric upgrade
      // that grants immunity to Static Discharge hazards
      expect(UPGRADES.conductive_covering).toBeDefined();
    });

    it('should have correct properties for conductive_covering upgrade', () => {
      const upgrade = UPGRADES.conductive_covering;

      // Must be a fabric upgrade
      expect(upgrade.type).toBe('fabric');
      expect(upgrade.slotType).toBe('fabricSlots');

      // Must require grounding_systems technology per Appendix C
      expect(upgrade.requiredTech).toBe('grounding_systems');

      // Must have static_immunity special ability per Appendix D
      expect(upgrade.special).toBe('static_immunity');
    });

    it('should have grounding_systems technology in TECHNOLOGIES data per Appendix C', () => {
      // Appendix C defines Grounding Systems technology that unlocks Conductive Covering
      expect(TECHNOLOGIES.grounding_systems).toBeDefined();
    });
  });
});
