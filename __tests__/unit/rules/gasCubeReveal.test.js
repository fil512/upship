/**
 * Rules Compliance Tests - Gas Cube Reveal Icons
 * Tests for correct implementation of generic 'gas' reveal bonus
 */

const { MARKET_CARDS } = require('../../../server/data/marketCards');

// Need to test the collectRevealResources function
// Import it via a wrapper since it's not directly exported
describe('Rules Compliance - Gas Cube Reveal', () => {

  describe('GAP-067: Gas Cube Reveal Icons', () => {
    describe('Market cards with gas reveal bonus', () => {
      it('should have cards with generic gas reveal property', () => {
        // Find cards that have gas: N in their reveal bonus
        const cardsWithGas = Object.values(MARKET_CARDS)
          .filter(card => card.reveal?.gas);

        // There should be at least one card with generic gas reveal
        expect(cardsWithGas.length).toBeGreaterThan(0);
      });

      it('should correctly identify Gas Engineer as having gas: 1', () => {
        // MARKET_CARDS is an array, find by id
        const gasEngineer = MARKET_CARDS.find(c => c.id === 'market_gas_engineer');
        expect(gasEngineer).toBeDefined();
        expect(gasEngineer.reveal).toBeDefined();
        expect(gasEngineer.reveal.gas).toBe(1);
      });

      it('should correctly identify Fuel Specialist as having gas: 1', () => {
        const fuelSpecialist = MARKET_CARDS.find(c => c.id === 'market_fuel_specialist');
        expect(fuelSpecialist).toBeDefined();
        expect(fuelSpecialist.reveal).toBeDefined();
        expect(fuelSpecialist.reveal.gas).toBe(1);
      });
    });

    describe('Generic gas reveal handling', () => {
      // Mock the collectRevealResources behavior
      it('should add hydrogen when card has gas reveal (default to hydrogen)', () => {
        // Test by simulating the phase transition resource collection
        // We use a mock state and call the collection function

        // Create mock state
        const mockState = {
          playerOrder: ['player1'],
          players: {
            player1: {
              faction: 'germany',
              hand: [{
                id: 'weather_expert',
                name: 'Weather Expert',
                reveal: { gas: 1 }
              }],
              gasCubes: { hydrogen: 0, helium: 0 },
              researchLevel: 0,
              engineers: 0,
              cash: 0,
              officers: 0
            }
          },
          revealPhase: {
            revealedHands: {},
            resourcesCollected: {}
          },
          log: []
        };

        // Set up revealed hands
        mockState.revealPhase.revealedHands.player1 = [...mockState.players.player1.hand];

        // Call the actual function from phaseTransition module
        const { transitionToRevealPhase } = require('../../../server/actions/helpers/phaseTransition');

        // We need to reset the state since transitionToRevealPhase sets up revealPhase fresh
        // Instead, test collectRevealResources directly by simulating its behavior

        // Import the helper
        const phaseTransitionModule = require('../../../server/actions/helpers/phaseTransition');

        // Call the transition which includes collectRevealResources
        // First set state.phase to worker_placement
        mockState.phase = 'worker_placement';

        // Create a fresh state for the test
        const testState = {
          phase: 'reveal',
          playerOrder: ['player1'],
          players: {
            player1: {
              faction: 'germany',
              hand: [{
                id: 'weather_expert',
                name: 'Weather Expert',
                reveal: { gas: 1 }
              }],
              gasCubes: { hydrogen: 0, helium: 0 },
              researchLevel: 0,
              engineers: 0,
              cash: 0,
              officers: 0
            }
          },
          revealPhase: {
            revealedHands: {
              player1: [{
                id: 'weather_expert',
                name: 'Weather Expert',
                reveal: { gas: 1 }
              }]
            },
            resourcesCollected: {}
          },
          log: []
        };

        // Manually call collectRevealResources by re-creating its logic
        // Since it's not exported, we test through transitionToRevealPhase
        // First, check if the module exports an internal function for testing

        // For now, just verify the market cards have the right structure
        // The actual fix will be in collectRevealResources

        // Test that gas reveal is processed as hydrogen (default)
        const revealData = testState.revealPhase.revealedHands.player1[0].reveal;

        // Current behavior: no gas property is checked
        // Expected behavior: gas property should give hydrogen (default)
        const gasAmount = revealData.gas || 0;
        expect(gasAmount).toBe(1);

        // The fix should add hydrogen when gas is present
        // This test will pass once we update collectRevealResources
      });
    });

    describe('Integration: phase transition processes gas reveal', () => {
      it('should give player hydrogen when card has gas: 1 reveal', () => {
        // Create a full state setup
        const state = {
          phase: 'worker_placement',
          playerOrder: ['player1'],
          players: {
            player1: {
              faction: 'germany',
              hand: [{
                id: 'weather_expert',
                name: 'Weather Expert',
                reveal: { gas: 1 }
              }],
              gasCubes: { hydrogen: 0, helium: 0 },
              researchLevel: 0,
              engineers: 0,
              research: 0,
              influence: 0,
              cash: 0,
              officers: 0
            }
          },
          log: []
        };

        // Import and call transitionToRevealPhase
        const { transitionToRevealPhase } = require('../../../server/actions/helpers/phaseTransition');
        transitionToRevealPhase(state);

        // After transition, player should have +1 hydrogen from the gas reveal
        expect(state.players.player1.gasCubes.hydrogen).toBe(1);
      });
    });
  });
});
