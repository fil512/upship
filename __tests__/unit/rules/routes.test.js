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

    it('should have 21 Age III routes forming a fully connected network', () => {
      const gameStateService = require('../../../server/services/gameStateService');
      const map = gameStateService.createAgeIIIMap();
      // 21 routes: 13 standard + 8 luxury routes (fully connected network per Appendix F)
      expect(map.routes.length).toBe(21);
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

  describe('GAP-029: Age III Network Connectivity per Section 14.3', () => {
    // Per rules: "A network is a group of your routes that share at least one city."
    // Age III: First ship may claim any route from a Major Hub.
    // Subsequent ships must connect to existing network OR pay £X for new network
    // where X = number of networks you already have.

    const { countPlayerNetworksById, validateNetworkConnectivity } = require('../../../server/actions/launch');

    describe('countPlayerNetworksById', () => {
      it('should count 0 networks when player has no routes', () => {
        const state = createTestGameState();
        state.age = 3;
        state.map = { routes: [] };

        const networkCount = countPlayerNetworksById(state.map, '1');
        expect(networkCount).toBe(0);
      });

      it('should count 1 network when player has connected routes', () => {
        const state = createTestGameState();
        state.age = 3;
        state.map = { routes: [
          { id: 'r1', from: 'London', to: 'Paris', claimed: '1' },
          { id: 'r2', from: 'Paris', to: 'Berlin', claimed: '1' }
        ]};

        const networkCount = countPlayerNetworksById(state.map, '1');
        expect(networkCount).toBe(1);
      });

      it('should count 2 networks when player has disconnected route groups', () => {
        const state = createTestGameState();
        state.age = 3;
        state.map = { routes: [
          { id: 'r1', from: 'London', to: 'Paris', claimed: '1' },
          { id: 'r2', from: 'New York', to: 'Rio de Janeiro', claimed: '1' }
        ]};

        const networkCount = countPlayerNetworksById(state.map, '1');
        expect(networkCount).toBe(2);
      });
    });

    describe('validateNetworkConnectivity', () => {
      it('should allow first ship to claim any route from Major Hub in Age III', () => {
        const state = createTestGameState();
        state.age = 3;
        const gameStateService = require('../../../server/services/gameStateService');
        state.map = gameStateService.createAgeIIIMap();

        // Player has no routes yet
        state.map.routes.forEach(r => r.claimed = null);

        const route = state.map.routes.find(r => r.from === 'London' || r.to === 'London');
        const result = validateNetworkConnectivity(state, '1', route);

        expect(result.valid).toBe(true);
        expect(result.networkFee).toBe(0);
      });

      it('should allow connecting to existing network without fee', () => {
        const state = createTestGameState();
        state.age = 3;
        const gameStateService = require('../../../server/services/gameStateService');
        state.map = gameStateService.createAgeIIIMap();

        // Player has a route from London to Paris
        const existingRoute = state.map.routes.find(r =>
          (r.from === 'London' && r.to === 'Paris') || (r.from === 'Paris' && r.to === 'London')
        );
        if (existingRoute) existingRoute.claimed = '1';

        // Try to claim a route connected to Paris
        const connectedRoute = state.map.routes.find(r =>
          r.claimed !== '1' && (r.from === 'Paris' || r.to === 'Paris')
        );

        if (connectedRoute) {
          const result = validateNetworkConnectivity(state, '1', connectedRoute);
          expect(result.valid).toBe(true);
          expect(result.networkFee).toBe(0);
        }
      });

      it('should require £1 fee to start second network', () => {
        const state = createTestGameState();
        state.age = 3;
        const gameStateService = require('../../../server/services/gameStateService');
        state.map = gameStateService.createAgeIIIMap();

        // Player has connected routes in Europe
        const londonParis = state.map.routes.find(r => r.from === 'London');
        if (londonParis) londonParis.claimed = '1';

        // Try to claim disconnected route in Americas
        const americasRoute = state.map.routes.find(r =>
          r.claimed !== '1' &&
          (r.from === 'New York' || r.to === 'New York') &&
          r.from !== 'London' && r.to !== 'London'
        );

        if (americasRoute) {
          const result = validateNetworkConnectivity(state, '1', americasRoute);
          expect(result.valid).toBe(true);
          expect(result.networkFee).toBe(1); // £1 for second network
        }
      });

      it('should require £2 fee to start third network', () => {
        const state = createTestGameState();
        state.age = 3;
        // Create a custom map with clearly disconnected routes
        state.map = { routes: [
          // Network 1: Europe
          { id: 'r1', from: 'London', to: 'Paris', claimed: '1' },
          { id: 'r2', from: 'Paris', to: 'Berlin', claimed: null },
          // Network 2: Americas
          { id: 'r3', from: 'New York', to: 'Miami', claimed: '1' },
          { id: 'r4', from: 'Miami', to: 'Havana', claimed: null },
          // Network 3: Pacific (disconnected from Europe and Americas)
          { id: 'r5', from: 'Tokyo', to: 'Sydney', claimed: null },
          { id: 'r6', from: 'Sydney', to: 'Auckland', claimed: null }
        ]};

        // Player has 2 networks (London-Paris and New York-Miami)
        // Try to claim Tokyo-Sydney (3rd network)
        const thirdRoute = state.map.routes.find(r => r.id === 'r5');
        const result = validateNetworkConnectivity(state, '1', thirdRoute);
        expect(result.valid).toBe(true);
        expect(result.networkFee).toBe(2); // £2 for third network
      });

      it('should not apply network rules in Age I', () => {
        const state = createTestGameState();
        state.age = 1;
        state.map = { routes: [
          { id: 'r1', from: 'London', to: 'Paris', claimed: '1' },
          { id: 'r2', from: 'Frankfurt', to: 'Berlin' }
        ]};

        const route = state.map.routes[1];
        const result = validateNetworkConnectivity(state, '1', route);

        expect(result.valid).toBe(true);
        expect(result.networkFee).toBe(0); // No fee in Age I
      });
    });
  });
});
