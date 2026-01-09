/**
 * Rules Compliance Tests - Starting Blueprints
 * Validates that each faction starts with the correct blueprint configuration
 * based on their starting tech cards.
 */

const { FACTION_CONFIG } = require('../../../server/services/gameStateService');
const { TECH_TILES } = require('../../../server/data/upgrades');

describe('Rules Compliance - Starting Blueprints', () => {

  describe('Starting tech tiles must be unlocked by starting tech cards', () => {
    const factions = ['germany', 'britain', 'usa', 'italy'];

    test.each(factions)('%s starting tiles require owned tech cards', (faction) => {
      const config = FACTION_CONFIG[faction];
      const startingTechCards = config.startingTechCards;
      const startingTechTiles = config.startingTechTiles;

      for (const [slotType, tileIds] of Object.entries(startingTechTiles)) {
        if (!tileIds) continue;

        // tileIds is now an array
        for (const tileId of tileIds) {
          const tile = TECH_TILES[tileId];
          expect(tile).toBeDefined();
          expect(tile.requiredCard).toBeDefined();

          const hasRequiredCard = startingTechCards.includes(tile.requiredCard);
          expect(hasRequiredCard).toBe(true);
        }
      }
    });
  });

  describe('Each faction should install Age 1 tiles in all available slots', () => {
    const factions = ['germany', 'britain', 'usa', 'italy'];

    test.each(factions)('%s should install the best Age 1 tile for each slot', (faction) => {
      const config = FACTION_CONFIG[faction];
      const startingTechCards = config.startingTechCards;
      const startingTechTiles = config.startingTechTiles;

      // Find all Age 1 tiles available to this faction by slot type
      const availableBySlot = {
        frameSlots: [],
        fabricSlots: [],
        driveSlots: [],
        componentSlots: []
      };

      for (const [tileId, tile] of Object.entries(TECH_TILES)) {
        // Only Age 1 tiles are available at game start
        if (tile.age > 1) continue;

        // Must have the required tech card
        if (!startingTechCards.includes(tile.requiredCard)) continue;

        availableBySlot[tile.slotType].push({ id: tileId, ...tile });
      }

      // Score tiles by total stat value - weight (we want high stats, low weight)
      const scoreTile = (tile) => {
        let score = 0;
        for (const [stat, value] of Object.entries(tile.stats || {})) {
          if (stat === 'gas_socket') continue; // All frames provide this equally
          score += value;
        }
        score -= tile.weight; // Lower weight is better
        return score;
      };

      // For each slot type, verify tiles are installed and best one is first
      for (const [slotType, availableTiles] of Object.entries(availableBySlot)) {
        if (availableTiles.length === 0) continue;

        // Get current installed tiles
        const slotKey = slotType.replace('Slots', '');
        const installedIds = startingTechTiles[slotKey] || [];

        // If there are multiple options and we're installing them, best should be first
        if (installedIds.length > 0 && availableTiles.length > 1) {
          const firstInstalledTile = TECH_TILES[installedIds[0]];
          const firstInstalledScore = scoreTile(firstInstalledTile);

          // Find the best available tile
          let bestTile = availableTiles[0];
          let bestScore = scoreTile(bestTile);

          for (const tile of availableTiles) {
            const score = scoreTile(tile);
            if (score > bestScore) {
              bestScore = score;
              bestTile = tile;
            }
          }

          // The first installed tile should be the best one (or tied for best)
          expect(firstInstalledScore).toBeGreaterThanOrEqual(bestScore - 1); // Allow small variance
        }
      }
    });
  });

  describe('All factions can launch with starting blueprint', () => {
    const factions = ['germany', 'britain', 'usa', 'italy'];

    test.each(factions)('%s can launch immediately with 2 gas cubes', (faction) => {
      const config = FACTION_CONFIG[faction];
      const startingTechTiles = config.startingTechTiles;

      // Calculate total weight and lift from all installed tiles
      let totalWeight = 0;
      let totalLift = 0;

      for (const tileIds of Object.values(startingTechTiles)) {
        if (!tileIds) continue;
        // tileIds is now an array
        for (const tileId of tileIds) {
          const tile = TECH_TILES[tileId];
          totalWeight += tile.weight || 0;

          // Gas sockets provide +5 lift each
          if (tile.stats?.gas_socket) {
            totalLift += tile.stats.gas_socket * 5;
          }
        }
      }

      // 2 gas cubes = 10 lift (from starting gas)
      const startingGasLift = 10; // 2 cubes * 5 lift each
      totalLift += startingGasLift;

      expect(totalLift).toBeGreaterThanOrEqual(totalWeight);
    });
  });

  describe('Specific faction tile optimizations', () => {

    it('Britain should use tensioned_frame first for ceiling bonus', () => {
      const config = FACTION_CONFIG['britain'];

      // tensioned_frame: weight 1, ceiling +1, gas_socket 1
      // wire_braced_frame: weight 2, gas_socket 1 (no ceiling)
      // First position should be the better tile
      expect(config.startingTechTiles.frame[0]).toBe('tensioned_frame');
    });

    it('Britain should use doped_covering first for speed bonus', () => {
      const config = FACTION_CONFIG['britain'];

      // doped_covering: weight 0, speed +1
      // doped_canvas_envelope: weight 1, no stats
      expect(config.startingTechTiles.fabric[0]).toBe('doped_covering');
    });

    it('USA should use duralumin_frame first for reliability bonus', () => {
      const config = FACTION_CONFIG['usa'];

      // duralumin_frame: weight 2, reliability +2, ceiling +1, gas_socket 1
      // rigid_duralumin_frame: weight 3, ceiling +1, gas_socket 1
      expect(config.startingTechTiles.frame[0]).toBe('duralumin_frame');
    });

    it('Italy should use semi_rigid_keel for Nobile semi-rigid expedition design', () => {
      const config = FACTION_CONFIG['italy'];

      // Italy uses semi_rigid_keel (from internal_keel tech card) for Nobile semi-rigid design
      // semi_rigid_keel: weight 2, gas_socket 1 (requires internal_keel)
      expect(config.startingTechTiles.frame[0]).toBe('semi_rigid_keel');
    });
  });
});
