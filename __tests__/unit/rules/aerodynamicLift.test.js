/**
 * Rules Compliance Tests - Aerodynamic Lift Technologies
 * Tests for correct implementation of Section 9.3 Aerodynamic Lift
 *
 * Note: Stats come from installed TILES, not from tech cards.
 * Tech cards only unlock the tiles.
 */

const { calculateShipStats } = require('../../../server/actions/launch');
const { TECH_TILES } = require('../../../server/data/upgrades');

describe('Rules Compliance - Aerodynamic Lift', () => {

  describe('GAP-066: Aerodynamic Lift Technologies', () => {
    describe('Streamlined Hull (from Aerodynamic Hull Design)', () => {
      it('should provide +2 Lift per spec Section 9.3', () => {
        // Per Section 9.3: "Aerodynamic Hull Design... provide Lift without requiring gas cubes"
        // The tile is streamlined_hull, unlocked by aerodynamic_hull_design tech card
        const tile = TECH_TILES.streamlined_hull;
        expect(tile).toBeDefined();
        expect(tile.stats).toBeDefined();
        expect(tile.stats.lift).toBe(2);
        expect(tile.requiredCard).toBe('aerodynamic_hull_design');
      });

      it('should apply +2 Lift to ship stats when tile is installed', () => {
        const playerState = {
          techCards: ['aerodynamic_hull_design'],
          blueprint: {
            frameSlots: ['streamlined_hull'],  // Tile installed
            fabricSlots: ['basic_fabric'],
            driveSlots: ['standard_engine'],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +2 Lift from Streamlined Hull tile
        expect(stats.lift).toBe(2);
      });
    });

    describe('Aerodynamic Lift System (from Dynamic Lift Surfaces)', () => {
      it('should provide +4 Lift per spec Section 9.3', () => {
        // Per Section 9.3: "Dynamic Lift Surfaces... provide Lift without requiring gas cubes"
        // The tile is aerodynamic_lift_system, unlocked by dynamic_lift_surfaces tech card
        const tile = TECH_TILES.aerodynamic_lift_system;
        expect(tile).toBeDefined();
        expect(tile.stats).toBeDefined();
        expect(tile.stats.lift).toBe(4);
        expect(tile.requiredCard).toBe('dynamic_lift_surfaces');
      });

      it('should apply +4 Lift to ship stats when tile is installed', () => {
        const playerState = {
          techCards: ['dynamic_lift_surfaces'],
          blueprint: {
            frameSlots: ['aerodynamic_lift_system'],  // Tile installed
            fabricSlots: ['basic_fabric'],
            driveSlots: ['standard_engine'],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +4 Lift from Aerodynamic Lift System tile
        expect(stats.lift).toBe(4);
      });
    });

    describe('Combined lift from multiple sources', () => {
      it('should stack aerodynamic lift from multiple tiles', () => {
        const playerState = {
          techCards: ['aerodynamic_hull_design', 'dynamic_lift_surfaces'],
          blueprint: {
            frameSlots: ['streamlined_hull', 'aerodynamic_lift_system'],  // Both tiles installed
            fabricSlots: ['basic_fabric'],
            driveSlots: ['standard_engine'],
            componentSlots: []
          }
        };

        const stats = calculateShipStats(playerState, 1);
        // Should have +2 + +4 = +6 Lift from both tiles
        expect(stats.lift).toBe(6);
      });
    });
  });
});
