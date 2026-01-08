/**
 * Rules Compliance Tests - Starting Blueprints
 * Validates that each faction starts with the best possible blueprint
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

      for (const [slotType, tileId] of Object.entries(startingTechTiles)) {
        if (!tileId) continue;

        const tile = TECH_TILES[tileId];
        expect(tile).toBeDefined();
        expect(tile.requiredCard).toBeDefined();

        const hasRequiredCard = startingTechCards.includes(tile.requiredCard);
        expect(hasRequiredCard).toBe(true);
      }
    });
  });

  describe('Each faction should have at most one Age 1 tile per slot type', () => {
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

      // For each slot type with multiple options, verify best is installed
      for (const [slotType, tiles] of Object.entries(availableBySlot)) {
        if (tiles.length <= 1) continue;

        // Get current installed tile
        const slotKey = slotType.replace('Slots', '');
        const installedId = startingTechTiles[slotKey];

        if (!installedId) continue;

        const installedTile = TECH_TILES[installedId];

        // Score tiles by total stat value - lower weight - hull cost
        // (We want high stats, low weight, reasonable cost)
        const scoreTile = (tile) => {
          let score = 0;
          for (const [stat, value] of Object.entries(tile.stats || {})) {
            if (stat === 'gas_socket') continue; // All frames provide this equally
            score += value;
          }
          score -= tile.weight; // Lower weight is better
          return score;
        };

        const installedScore = scoreTile(installedTile);

        // Find the best available tile
        let bestTile = tiles[0];
        let bestScore = scoreTile(bestTile);

        for (const tile of tiles) {
          const score = scoreTile(tile);
          if (score > bestScore) {
            bestScore = score;
            bestTile = tile;
          }
        }

        // The installed tile should be the best one
        if (installedScore < bestScore) {
          // This will fail with helpful message
          expect({
            faction,
            slotType,
            installed: { id: installedId, score: installedScore, weight: installedTile.weight, stats: installedTile.stats },
            better: { id: bestTile.id, score: bestScore, weight: bestTile.weight, stats: bestTile.stats }
          }).toEqual({
            faction,
            slotType,
            installed: { id: bestTile.id, score: bestScore, weight: bestTile.weight, stats: bestTile.stats },
            better: null
          });
        }
      }
    });
  });

  describe('All factions can launch with starting blueprint', () => {
    const factions = ['germany', 'britain', 'usa', 'italy'];

    test.each(factions)('%s can launch immediately with 2 gas cubes', (faction) => {
      const config = FACTION_CONFIG[faction];
      const startingTechTiles = config.startingTechTiles;

      // Calculate total weight and lift
      let totalWeight = 0;
      let totalLift = 0;

      for (const tileId of Object.values(startingTechTiles)) {
        if (!tileId) continue;
        const tile = TECH_TILES[tileId];
        totalWeight += tile.weight || 0;

        // Gas sockets provide +5 lift each
        if (tile.stats?.gas_socket) {
          totalLift += tile.stats.gas_socket * 5;
        }
      }

      // 2 gas cubes = 10 lift (from starting gas)
      // Frame provides gas_socket which adds more lift
      const startingGasLift = 10; // 2 cubes * 5 lift each
      totalLift += startingGasLift;

      expect(totalLift).toBeGreaterThanOrEqual(totalWeight);
    });
  });

  describe('Specific faction tile optimizations', () => {

    it('Britain should use tensioned_frame for ceiling bonus', () => {
      const config = FACTION_CONFIG['britain'];

      // tensioned_frame: weight 1, ceiling +1, gas_socket 1
      // wire_braced_frame: weight 2, gas_socket 1 (no ceiling)
      expect(config.startingTechTiles.frame).toBe('tensioned_frame');
    });

    it('Britain should use doped_covering for speed bonus', () => {
      const config = FACTION_CONFIG['britain'];

      // doped_covering: weight 0, speed +1
      // doped_canvas_envelope: weight 1, no stats
      expect(config.startingTechTiles.fabric).toBe('doped_covering');
    });

    it('USA should use duralumin_frame for reliability bonus', () => {
      const config = FACTION_CONFIG['usa'];

      // duralumin_frame: weight 2, reliability +2, ceiling +1, gas_socket 1
      // rigid_duralumin_frame: weight 3, ceiling +1, gas_socket 1
      expect(config.startingTechTiles.frame).toBe('duralumin_frame');
    });

    it('Italy should use flexible_frame for ceiling bonus and low weight', () => {
      const config = FACTION_CONFIG['italy'];

      // flexible_frame: weight 0, ceiling +1, gas_socket 1 (requires articulated_keel)
      // semi_rigid_frame: weight 2, gas_socket 1 (requires internal_keel)
      expect(config.startingTechTiles.frame).toBe('flexible_frame');
    });
  });
});
