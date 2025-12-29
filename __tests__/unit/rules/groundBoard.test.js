/**
 * Rules Compliance Tests - Ground Board
 * Tests for correct implementation of Section 6 (Ground Board Locations)
 */

const { GROUND_BOARD_LOCATIONS } = require('../../../server/data/groundBoard');

describe('Rules Compliance - Ground Board', () => {

  describe('GAP-023: Government Liaison location exists', () => {
    it('should have Government Liaison location per Section 6.8', () => {
      // Per Section 6.8: "Government Liaison (Coin) - spend 1-3 Officers to increase Income Track by 1 per Officer"
      expect(GROUND_BOARD_LOCATIONS.government_liaison).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.government_liaison.symbol).toBe('coin');
      expect(GROUND_BOARD_LOCATIONS.government_liaison.action.type).toBe('GOVERNMENT_LIAISON');
    });
  });

  describe('GAP-024: The Bank should not be a Ground Board location', () => {
    it('should NOT have The Bank as a Ground Board location per Section 5.3', () => {
      // Per Section 5.3: "You may take a loan at any time during your turn—this does not require an Agent or card."
      // The Bank should not be in GROUND_BOARD_LOCATIONS
      expect(GROUND_BOARD_LOCATIONS.the_bank).toBeUndefined();
    });
  });

  describe('Ground Board location symbols per Section 5.1', () => {
    it('should have Research Institute as propeller location per Section 6.1', () => {
      expect(GROUND_BOARD_LOCATIONS.research_institute).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.research_institute.symbol).toBe('propeller');
    });

    it('should have Design Bureau as wrench location per Section 6.2', () => {
      expect(GROUND_BOARD_LOCATIONS.design_bureau).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.design_bureau.symbol).toBe('wrench');
    });

    it('should have Academy as coin location per Section 6.5', () => {
      expect(GROUND_BOARD_LOCATIONS.academy).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.academy.symbol).toBe('coin');
    });

    it('should have Flight School as coin location per Section 6.6', () => {
      expect(GROUND_BOARD_LOCATIONS.flight_school).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.flight_school.symbol).toBe('coin');
    });

    it('should have Gas Depot as wrench location per Section 6.10', () => {
      expect(GROUND_BOARD_LOCATIONS.gas_depot).toBeDefined();
      expect(GROUND_BOARD_LOCATIONS.gas_depot.symbol).toBe('wrench');
    });
  });
});
