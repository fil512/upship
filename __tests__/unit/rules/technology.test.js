/**
 * Rules Compliance Tests - Technology System
 * Tests for correct implementation of Section 4.1, 9.1 (Specialization Discount)
 */

const { calculateSpecializationDiscount } = require('../../../server/actions/technology');

describe('Rules Compliance - Technology System', () => {

  describe('GAP-036: Specialization discount track mapping', () => {
    it('should give no discount with 0-2 technologies in same track', () => {
      // Player has 2 structure technologies (using correct IDs from constants.js)
      const playerTechs = ['wooden_framework', 'wire_bracing'];

      // New structure tech should get no discount
      const discount = calculateSpecializationDiscount(playerTechs, 'structure');
      expect(discount).toBe(0);
    });

    it('should give -1 Research discount with 3-4 technologies in same track per Section 4.1', () => {
      // Player has 3 drive technologies (using correct IDs from constants.js)
      const playerTechs = ['daimler_engine', 'improved_propeller', 'dual_engine_mount'];

      // New drive tech should get -1 discount
      const discount = calculateSpecializationDiscount(playerTechs, 'drive');
      expect(discount).toBe(1);
    });

    it('should give -2 Research discount with 5+ technologies in same track per Section 4.1', () => {
      // Player has 5 component technologies (using correct IDs from constants.js)
      const playerTechs = [
        'observation_platform',  // Age I component
        'mail_compartment',      // Age I component
        'cargo_nets',            // Age I component
        'passenger_gondola',     // Age II component
        'radio_equipment'        // Age II component
      ];

      // New component tech should get -2 discount
      const discount = calculateSpecializationDiscount(playerTechs, 'component');
      expect(discount).toBe(2);
    });

    it('should count technologies by matching type, not by ID list', () => {
      // Player has 3 structure technologies (using correct IDs from constants.js)
      const playerTechs = ['wooden_framework', 'wire_bracing', 'duralumin_framework'];

      // Acquiring a new structure tech should use the count of 3
      const discount = calculateSpecializationDiscount(playerTechs, 'structure');
      expect(discount).toBe(1);
    });

    it('should not give discount for unrelated technology tracks', () => {
      // Player has 5 structure technologies (using correct IDs from constants.js)
      const playerTechs = [
        'wooden_framework',
        'wire_bracing',
        'duralumin_framework',
        'steel_framework',
        'geodetic_structure'
      ];

      // But acquiring a drive tech should get no discount
      const discount = calculateSpecializationDiscount(playerTechs, 'drive');
      expect(discount).toBe(0);
    });

    it('should map drive technologies to Propulsion track per Section 4.1', () => {
      // Using correct IDs from constants.js (maybach_engine is Age II)
      const playerTechs = ['daimler_engine', 'improved_propeller', 'dual_engine_mount', 'maybach_engine'];

      // 4 drive techs = -1 discount for new drive tech
      const discount = calculateSpecializationDiscount(playerTechs, 'drive');
      expect(discount).toBe(1);
    });

    it('should map component technologies to Payload track per Section 4.1', () => {
      // Using correct IDs from constants.js
      const playerTechs = ['observation_platform', 'mail_compartment', 'cargo_nets'];

      // 3 component techs = -1 discount for new component tech
      const discount = calculateSpecializationDiscount(playerTechs, 'component');
      expect(discount).toBe(1);
    });

    it('should map fabric technologies separately', () => {
      // Fabric techs are in their own track
      const playerTechs = ['rubberized_cotton', 'doped_canvas', 'goldbeater_skin'];

      // 3 fabric techs = -1 discount for new fabric tech
      const discount = calculateSpecializationDiscount(playerTechs, 'fabric');
      expect(discount).toBe(1);
    });
  });
});
