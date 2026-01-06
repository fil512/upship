const {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS,
  SYMBOL_COLORS,
  getLocationsBySymbol,
  canPlaceAtLocation
} = require('../../server/data/groundBoard');

describe('GroundBoard Module', () => {
  describe('GROUND_BOARD_LOCATIONS constant', () => {
    it('should contain 12 locations', () => {
      expect(Object.keys(GROUND_BOARD_LOCATIONS).length).toBe(12);
    });

    it('should have unique position values 1-12', () => {
      const positions = Object.values(GROUND_BOARD_LOCATIONS).map(l => l.position);
      expect(new Set(positions).size).toBe(12);
      expect(Math.min(...positions)).toBe(1);
      expect(Math.max(...positions)).toBe(12);
    });

    it('should have valid symbols for all locations', () => {
      const validSymbols = ['wrench', 'coin', 'propeller'];
      Object.values(GROUND_BOARD_LOCATIONS).forEach(location => {
        expect(validSymbols).toContain(location.symbol);
      });
    });

    it('should have required properties for all locations', () => {
      const requiredProps = ['id', 'name', 'symbol', 'position', 'description', 'action'];
      Object.values(GROUND_BOARD_LOCATIONS).forEach(location => {
        requiredProps.forEach(prop => {
          expect(location).toHaveProperty(prop);
        });
      });
    });

    it('should have action objects with type property', () => {
      Object.values(GROUND_BOARD_LOCATIONS).forEach(location => {
        expect(location.action).toHaveProperty('type');
        expect(typeof location.action.type).toBe('string');
      });
    });

    describe('specific locations', () => {
      it('research_institute should have coin symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.research_institute.symbol).toBe('coin');
      });

      it('blueprint_design should have wrench symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.blueprint_design.symbol).toBe('wrench');
      });

      it('government_liaison should have coin symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.government_liaison.symbol).toBe('coin');
      });

      it('launchpad should have propeller symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.launchpad.symbol).toBe('propeller');
      });

      it('launchpad_2 should have propeller symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.launchpad_2.symbol).toBe('propeller');
      });

      it('construction_hall should have wrench symbol', () => {
        expect(GROUND_BOARD_LOCATIONS.construction_hall.symbol).toBe('wrench');
      });
    });
  });

  describe('SYMBOL_ICONS constant', () => {
    it('should have icons for all symbol types', () => {
      expect(SYMBOL_ICONS.wrench).toBeDefined();
      expect(SYMBOL_ICONS.coin).toBeDefined();
      expect(SYMBOL_ICONS.propeller).toBeDefined();
      expect(SYMBOL_ICONS.any).toBeDefined();
    });

    it('should have emoji strings', () => {
      Object.values(SYMBOL_ICONS).forEach(icon => {
        expect(typeof icon).toBe('string');
        expect(icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SYMBOL_COLORS constant', () => {
    it('should have colors for all symbol types', () => {
      expect(SYMBOL_COLORS.wrench).toBeDefined();
      expect(SYMBOL_COLORS.coin).toBeDefined();
      expect(SYMBOL_COLORS.propeller).toBeDefined();
      expect(SYMBOL_COLORS.any).toBeDefined();
    });

    it('should have valid hex color strings', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      Object.values(SYMBOL_COLORS).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('getLocationsBySymbol', () => {
    it('should return all locations for "any" symbol', () => {
      const result = getLocationsBySymbol('any');
      expect(result.length).toBe(12);
    });

    it('should return only wrench locations', () => {
      const result = getLocationsBySymbol('wrench');
      expect(result.every(l => l.symbol === 'wrench')).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return only coin locations', () => {
      const result = getLocationsBySymbol('coin');
      expect(result.every(l => l.symbol === 'coin')).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return only propeller locations', () => {
      const result = getLocationsBySymbol('propeller');
      expect(result.every(l => l.symbol === 'propeller')).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid symbol', () => {
      const result = getLocationsBySymbol('invalid');
      expect(result).toEqual([]);
    });

    it('should have correct count of each symbol type', () => {
      const wrenchCount = getLocationsBySymbol('wrench').length;
      const coinCount = getLocationsBySymbol('coin').length;
      const propellerCount = getLocationsBySymbol('propeller').length;

      // Should total 12
      expect(wrenchCount + coinCount + propellerCount).toBe(12);

      // Each type should have at least one
      expect(wrenchCount).toBeGreaterThan(0);
      expect(coinCount).toBeGreaterThan(0);
      expect(propellerCount).toBeGreaterThan(0);
    });
  });

  describe('canPlaceAtLocation', () => {
    describe('any symbol card', () => {
      it('should be placeable at any location', () => {
        Object.keys(GROUND_BOARD_LOCATIONS).forEach(locationId => {
          expect(canPlaceAtLocation('any', locationId)).toBe(true);
        });
      });
    });

    describe('wrench symbol card', () => {
      it('should be placeable at wrench locations', () => {
        expect(canPlaceAtLocation('wrench', 'blueprint_design')).toBe(true);
        expect(canPlaceAtLocation('wrench', 'construction_hall')).toBe(true);
        expect(canPlaceAtLocation('wrench', 'technical_institute')).toBe(true);
        expect(canPlaceAtLocation('wrench', 'gas_depot')).toBe(true);
      });

      it('should not be placeable at coin locations', () => {
        expect(canPlaceAtLocation('wrench', 'research_institute')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'government_liaison')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'flight_school')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'insurance_bureau')).toBe(false);
      });

      it('should not be placeable at propeller locations', () => {
        expect(canPlaceAtLocation('wrench', 'launchpad')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'launchpad_2')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'ministry')).toBe(false);
        expect(canPlaceAtLocation('wrench', 'weather_bureau')).toBe(false);
      });
    });

    describe('coin symbol card', () => {
      it('should be placeable at coin locations', () => {
        expect(canPlaceAtLocation('coin', 'research_institute')).toBe(true);
        expect(canPlaceAtLocation('coin', 'government_liaison')).toBe(true);
        expect(canPlaceAtLocation('coin', 'flight_school')).toBe(true);
        expect(canPlaceAtLocation('coin', 'insurance_bureau')).toBe(true);
      });

      it('should not be placeable at wrench locations', () => {
        expect(canPlaceAtLocation('coin', 'blueprint_design')).toBe(false);
        expect(canPlaceAtLocation('coin', 'construction_hall')).toBe(false);
      });

      it('should not be placeable at propeller locations', () => {
        expect(canPlaceAtLocation('coin', 'launchpad')).toBe(false);
        expect(canPlaceAtLocation('coin', 'launchpad_2')).toBe(false);
      });
    });

    describe('propeller symbol card', () => {
      it('should be placeable at propeller locations', () => {
        expect(canPlaceAtLocation('propeller', 'launchpad')).toBe(true);
        expect(canPlaceAtLocation('propeller', 'launchpad_2')).toBe(true);
        expect(canPlaceAtLocation('propeller', 'ministry')).toBe(true);
        expect(canPlaceAtLocation('propeller', 'weather_bureau')).toBe(true);
      });

      it('should not be placeable at other locations', () => {
        expect(canPlaceAtLocation('propeller', 'blueprint_design')).toBe(false);
        expect(canPlaceAtLocation('propeller', 'research_institute')).toBe(false);
      });
    });

    describe('invalid inputs', () => {
      it('should return true for any symbol even at invalid location', () => {
        // 'any' symbol returns true unconditionally before checking location
        expect(canPlaceAtLocation('any', 'invalid_location')).toBe(true);
      });

      it('should return false for non-any symbol at invalid location', () => {
        expect(canPlaceAtLocation('wrench', 'nonexistent')).toBe(false);
        expect(canPlaceAtLocation('wrench', null)).toBe(false);
        expect(canPlaceAtLocation('wrench', undefined)).toBe(false);
      });
    });
  });
});
