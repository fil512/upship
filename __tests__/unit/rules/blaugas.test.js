/**
 * Rules Compliance Tests - Blaugas Fuel System
 * Tests for correct implementation of Germany's Blaugas technology (Section 13.1)
 */

const { processLaunchShip, calculateShipStats } = require('../../../server/actions/launch');
const { TECHNOLOGY_BAG } = require('../../../server/config/constants');

describe('Rules Compliance - Blaugas Fuel System', () => {

  describe('GAP-065: Blaugas Gas Recovery functionality', () => {
    describe('£2 option to retain gas cubes', () => {
      it('should allow retaining gas cubes by paying £2 with Blaugas technology', () => {
        const state = {
          age: 1,
          turn: 1,
          players: {
            player1: {
              cash: 10,
              officers: 1,
              engineers: 2,
              gasCubes: { hydrogen: 2, helium: 0 },
              techCards: ['blaugas_storage'],
              hangarShips: 1,  // Ships are tokens, use counter
              repairShips: 0,
              blueprint: {
                frameSlots: ['basic_frame'],
                fabricSlots: ['basic_fabric'],
                driveSlots: ['maybach_hl'],  // Germany's starting drive (speed 2, range 1)
                componentSlots: []
              },
              hazardDeck: [{
                id: 'clear_1',
                type: 'clear_weather',
                autoPass: true,
                category: 'clear',
                name: 'Clear Weather',
                difficulty: 0
              }],
              hazardDiscardPile: []
            }
          },
          map: {
            routes: [{
              id: 'route1',
              from: 'A',
              to: 'B',
              distance: 1,
              income: 2,
              claimed: null
            }]
          },
          launchpadActive: { player1: true },
          log: []
        };

        // Launch with retainGas = true
        const result = processLaunchShip(state, 'player1', {
          routeId: 'route1',
          gasType: 'hydrogen',
          retainGas: true,
          _internal: true
        });

        // Should pay £2 for Blaugas
        expect(result.newState.players.player1.cash).toBe(8);
        // Gas cubes should NOT be consumed
        expect(result.newState.players.player1.gasCubes.hydrogen).toBe(2);
      });

      it('should consume gas cubes normally without retainGas option', () => {
        const state = {
          age: 1,
          turn: 1,
          players: {
            player1: {
              cash: 10,
              officers: 1,
              engineers: 2,
              gasCubes: { hydrogen: 2, helium: 0 },
              techCards: ['blaugas_storage'],
              hangarShips: 1,  // Ships are tokens, use counter
              repairShips: 0,
              blueprint: {
                frameSlots: ['basic_frame'],
                fabricSlots: ['basic_fabric'],
                driveSlots: ['maybach_hl'],  // Germany's starting drive (speed 2, range 1)
                componentSlots: []
              },
              hazardDeck: [{
                id: 'clear_1',
                type: 'clear_weather',
                autoPass: true,
                category: 'clear',
                name: 'Clear Weather',
                difficulty: 0
              }],
              hazardDiscardPile: []
            }
          },
          map: {
            routes: [{
              id: 'route1',
              from: 'A',
              to: 'B',
              distance: 1,
              income: 2,
              claimed: null
            }]
          },
          launchpadActive: { player1: true },
          log: []
        };

        // Launch WITHOUT retainGas
        const result = processLaunchShip(state, 'player1', {
          routeId: 'route1',
          gasType: 'hydrogen',
          retainGas: false,
          _internal: true
        });

        // Cash unchanged (no Blaugas fee)
        expect(result.newState.players.player1.cash).toBe(10);
        // Gas cubes SHOULD be consumed (1 cube for minimum weight)
        expect(result.newState.players.player1.gasCubes.hydrogen).toBe(1);
      });

      it('should reject retainGas without Blaugas technology', () => {
        const state = {
          age: 1,
          turn: 1,
          players: {
            player1: {
              cash: 10,
              officers: 1,
              engineers: 2,
              gasCubes: { hydrogen: 2, helium: 0 },
              techCards: [], // No Blaugas
              hangarShips: 1,  // Ships are tokens, use counter
              repairShips: 0,
              blueprint: {
                frameSlots: ['basic_frame'],
                fabricSlots: ['basic_fabric'],
                driveSlots: ['maybach_hl'],  // Germany's starting drive (speed 2, range 1)
                componentSlots: []
              },
              hazardDeck: [{ type: 'clear_weather', autoPass: true }],
              hazardDiscardPile: []
            }
          },
          map: {
            routes: [{ id: 'route1', from: 'A', to: 'B', distance: 1, income: 2, claimed: null }]
          },
          launchpadActive: { player1: true },
          log: []
        };

        // Should reject retainGas without Blaugas
        expect(() => processLaunchShip(state, 'player1', {
          routeId: 'route1',
          gasType: 'hydrogen',
          retainGas: true,
          _internal: true
        })).toThrow(/Blaugas/);
      });

      it('should reject retainGas without sufficient cash (£2)', () => {
        const state = {
          age: 1,
          turn: 1,
          players: {
            player1: {
              cash: 1, // Only £1, need £2
              officers: 1,
              engineers: 2,
              gasCubes: { hydrogen: 2, helium: 0 },
              techCards: ['blaugas_storage'],
              hangarShips: 1,  // Ships are tokens, use counter
              repairShips: 0,
              blueprint: {
                frameSlots: ['basic_frame'],
                fabricSlots: ['basic_fabric'],
                driveSlots: ['maybach_hl'],  // Germany's starting drive (speed 2, range 1)
                componentSlots: []
              },
              hazardDeck: [{ type: 'clear_weather', autoPass: true }],
              hazardDiscardPile: []
            }
          },
          map: {
            routes: [{ id: 'route1', from: 'A', to: 'B', distance: 1, income: 2, claimed: null }]
          },
          launchpadActive: { player1: true },
          log: []
        };

        // Should reject due to insufficient funds
        expect(() => processLaunchShip(state, 'player1', {
          routeId: 'route1',
          gasType: 'hydrogen',
          retainGas: true,
          _internal: true
        })).toThrow();
      });
    });

    describe('+1 Range from Blaugas technology', () => {
      it('should provide +1 Range per spec Section 13.1', () => {
        // Per Section 13.1: "Blaugas Fuel System - Neutral buoyancy fuel: +1 Range"
        // Stats come from the blaugas_tank TILE, not the tech card
        const { TECH_TILES } = require('../../../server/data/upgrades');
        const tile = TECH_TILES.blaugas_tank;
        expect(tile).toBeDefined();
        expect(tile.stats).toBeDefined();
        expect(tile.stats.range).toBe(1);
        expect(tile.requiredCard).toBe('blaugas_storage');
      });

      it('should apply +1 Range to ship stats when Blaugas Tank is installed', () => {
        // Range comes from installed tiles, not tech cards
        // To get +1 Range from Blaugas, you need to install blaugas_tank tile
        const playerState = {
          techCards: ['blaugas_storage'],  // Owns the tech card
          blueprint: {
            frameSlots: ['basic_frame'],
            fabricSlots: ['basic_fabric'],
            driveSlots: ['maybach_hl'],  // Germany's starting drive (speed 2, range 1)
            componentSlots: ['blaugas_tank']  // +1 Range from Blaugas tile
          }
        };

        // Calculate stats with Blaugas tile installed
        const stats = calculateShipStats(playerState, 1);
        // maybach_hl provides range 1, blaugas_tank provides +1 = 2
        expect(stats.range).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
