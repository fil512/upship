/**
 * Rules Compliance Tests - Routes and City Bonuses
 * Tests for correct implementation of Section 10.4 (City Bonuses) and Appendix F (Routes)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { CITY_BONUSES } = require('../../../server/data/cities');

// We need to access the route creation functions from gameStateService
let createAgeIMap, createAgeIIIMap;
try {
  const gameStateService = require('../../../server/services/gameStateService');
  createAgeIMap = gameStateService.createAgeIMap;
  createAgeIIIMap = gameStateService.createAgeIIIMap;
} catch (e) {
  // Functions may not be exported yet
}

describe('Rules Compliance - Routes and City Bonuses', () => {

  describe('GAP-040: Route VP values per Appendix F', () => {
    it('should have Age I routes with correct VP values', () => {
      if (!createAgeIMap) {
        // Test using the function directly if not exported
        const gameStateService = require('../../../server/services/gameStateService');
        createAgeIMap = gameStateService.createAgeIMap;
      }
      const map = createAgeIMap();

      // Find specific routes and verify VP
      const rhineValley = map.routes.find(r => r.name === 'Rhine Valley' || (r.from === 'Frankfurt' && r.to === 'Cologne'));
      const imperialCircuit = map.routes.find(r => r.name === 'Imperial Circuit' || (r.from === 'London' && r.to === 'Berlin'));

      // Per Appendix F: Rhine Valley = 1 VP, Imperial Circuit = 3 VP
      expect(rhineValley).toBeDefined();
      expect(rhineValley.vp).toBe(1);

      if (imperialCircuit) {
        expect(imperialCircuit.vp).toBe(3);
      }
    });

    it('should have all Age I routes with vp property', () => {
      if (!createAgeIMap) {
        const gameStateService = require('../../../server/services/gameStateService');
        createAgeIMap = gameStateService.createAgeIMap;
      }
      const map = createAgeIMap();

      map.routes.forEach(route => {
        expect(route).toHaveProperty('vp');
        expect(typeof route.vp).toBe('number');
        expect(route.vp).toBeGreaterThanOrEqual(1);
        expect(route.vp).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('GAP-042: Age III routes per Appendix F', () => {
    it('should have createAgeIIIMap function', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      expect(gameStateService.createAgeIIIMap).toBeDefined();
    });

    it('should have 16 Age III routes', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      const map = gameStateService.createAgeIIIMap();
      expect(map.routes.length).toBe(16);
    });

    it('should have correct Hindenburg Route as highest VP route', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      const map = gameStateService.createAgeIIIMap();

      const hindenburgRoute = map.routes.find(r => r.name === 'Hindenburg Route');
      expect(hindenburgRoute).toBeDefined();
      expect(hindenburgRoute.from).toBe('Frankfurt');
      expect(hindenburgRoute.to).toBe('Lakehurst');
      expect(hindenburgRoute.vp).toBe(6);
      expect(hindenburgRoute.luxury).toBe(2);
      expect(hindenburgRoute.income).toBe(12);
    });

    it('should have luxury routes marked with luxury property', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      const map = gameStateService.createAgeIIIMap();

      // Per Appendix F, 6 routes have luxury requirements:
      // Empire State Express (1), Imperial Airship Route (1), California Clipper (1),
      // Graf Zeppelin Route (1), Transatlantic Luxury (2), Hindenburg Route (2)
      const luxuryRoutes = map.routes.filter(r => r.luxury && r.luxury > 0);
      expect(luxuryRoutes.length).toBe(6);
    });

    it('should have all Age III routes with vp property', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      const map = gameStateService.createAgeIIIMap();

      map.routes.forEach(route => {
        expect(route).toHaveProperty('vp');
        expect(typeof route.vp).toBe('number');
        expect(route.vp).toBeGreaterThanOrEqual(2);
        expect(route.vp).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('GAP-022: City Bonuses data per Section 10.4', () => {
    it('should have London bonus of +£3', () => {
      expect(CITY_BONUSES.London).toBeDefined();
      expect(CITY_BONUSES.London.cash).toBe(3);
    });

    it('should have Paris bonus of +1 Influence', () => {
      expect(CITY_BONUSES.Paris).toBeDefined();
      expect(CITY_BONUSES.Paris.influence).toBe(1);
    });

    it('should have Berlin bonus of +1 Research', () => {
      expect(CITY_BONUSES.Berlin).toBeDefined();
      expect(CITY_BONUSES.Berlin.research).toBe(1);
    });

    it('should have Frankfurt bonus of +£2', () => {
      expect(CITY_BONUSES.Frankfurt).toBeDefined();
      expect(CITY_BONUSES.Frankfurt.cash).toBe(2);
    });

    it('should have Hamburg bonus of +1 Hydrogen cube', () => {
      expect(CITY_BONUSES.Hamburg).toBeDefined();
      expect(CITY_BONUSES.Hamburg.hydrogen).toBe(1);
    });

    it('should have Brussels bonus of +1 Officer', () => {
      expect(CITY_BONUSES.Brussels).toBeDefined();
      expect(CITY_BONUSES.Brussels.officers).toBe(1);
    });

    it('should have Age II cities defined', () => {
      expect(CITY_BONUSES.Friedrichshafen).toBeDefined();
      expect(CITY_BONUSES.Cardington).toBeDefined();
      expect(CITY_BONUSES.Rome).toBeDefined();
      expect(CITY_BONUSES.Moscow).toBeDefined();
      expect(CITY_BONUSES.Cairo).toBeDefined();
      expect(CITY_BONUSES['Scapa Flow']).toBeDefined();
    });

    it('should have Age III cities defined', () => {
      expect(CITY_BONUSES['New York']).toBeDefined();
      expect(CITY_BONUSES.Lakehurst).toBeDefined();
      expect(CITY_BONUSES['Rio de Janeiro']).toBeDefined();
      expect(CITY_BONUSES.Recife).toBeDefined();
      expect(CITY_BONUSES.Seville).toBeDefined();
      expect(CITY_BONUSES.Bombay).toBeDefined();
    });

    it('should have Bombay with both cash and influence per Section 10.4', () => {
      expect(CITY_BONUSES.Bombay.cash).toBe(3);
      expect(CITY_BONUSES.Bombay.influence).toBe(1);
    });
  });
});
