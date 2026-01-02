/**
 * Rules Compliance Tests - Aerodynamic Lift Technologies
 * Tests for correct implementation of Section 9.3 Aerodynamic Lift
 */

const { calculateShipStats } = require('../../../server/actions/launch');
const { TECHNOLOGY_BAG } = require('../../../server/config/constants');

describe('Rules Compliance - Aerodynamic Lift', () => {

  describe('GAP-066: Aerodynamic Lift Technologies', () => {
    describe('Aerodynamic Hull Design', () => {
      it('should provide +2 Lift per spec Section 9.3', () => {
        // Per Section 9.3: "Aerodynamic Hull Design... provide Lift without requiring gas cubes"
        const age2Techs = TECHNOLOGY_BAG[2];
        const aerodynamicHull = age2Techs.find(t => t.id === 'aerodynamic_hull');
        expect(aerodynamicHull).toBeDefined();
        expect(aerodynamicHull.stats).toBeDefined();
        expect(aerodynamicHull.stats.lift).toBe(2);
      });

      it('should apply +2 Lift to ship stats when player has Aerodynamic Hull Design', () => {
        const playerState = {
          techCards: ['aerodynamic_hull'],
          blueprint: {
            frameSlots: ['basic_frame'],
            fabricSlots: ['basic_fabric'],
            driveSlots: [],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +2 Lift from Aerodynamic Hull Design
        expect(stats.lift).toBe(2);
      });
    });

    describe('Dynamic Lift Surfaces', () => {
      it('should provide +4 Lift per spec Section 9.3', () => {
        // Per Section 9.3: "Dynamic Lift Surfaces... provide Lift without requiring gas cubes"
        const age3Techs = TECHNOLOGY_BAG[3];
        const dynamicLift = age3Techs.find(t => t.id === 'dynamic_lift');
        expect(dynamicLift).toBeDefined();
        expect(dynamicLift.stats).toBeDefined();
        expect(dynamicLift.stats.lift).toBe(4);
      });

      it('should apply +4 Lift to ship stats when player has Dynamic Lift Surfaces', () => {
        const playerState = {
          techCards: ['dynamic_lift'],
          blueprint: {
            frameSlots: ['basic_frame'],
            fabricSlots: ['basic_fabric'],
            driveSlots: [],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +4 Lift from Dynamic Lift Surfaces
        expect(stats.lift).toBe(4);
      });
    });

    describe('Combined lift from multiple sources', () => {
      it('should stack aerodynamic lift from multiple technologies', () => {
        const playerState = {
          techCards: ['aerodynamic_hull', 'dynamic_lift'],
          blueprint: {
            frameSlots: ['basic_frame'],
            fabricSlots: ['basic_fabric'],
            driveSlots: [],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +2 + +4 = +6 Lift from both technologies
        expect(stats.lift).toBe(6);
      });
    });
  });
});
