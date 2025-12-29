/**
 * Rules Compliance Tests - Technology Tiles
 * Tests for correct implementation of Appendix C (Technology Tiles)
 */

describe('Rules Compliance - Technology Tiles', () => {

  describe('GAP-043: Technology Tile Composition per Appendix C', () => {
    const { TECHNOLOGY_BAG } = require('../../../server/services/gameStateService');

    // Helper to get all technologies from all ages
    const getAllTechnologies = () => {
      const all = [];
      for (const age of [1, 2, 3]) {
        if (TECHNOLOGY_BAG[age]) {
          all.push(...TECHNOLOGY_BAG[age]);
        }
      }
      return all;
    };

    it('should have 54 total technology tiles per Appendix C', () => {
      const all = getAllTechnologies();
      expect(all.length).toBe(54);
    });

    it('should have 11 Propulsion/Drive track tiles', () => {
      const all = getAllTechnologies();
      const propulsion = all.filter(t => t.type === 'drive' || t.type === 'propulsion');
      expect(propulsion.length).toBe(11);
    });

    it('should have 10 Frame/Structure track tiles', () => {
      const all = getAllTechnologies();
      const frame = all.filter(t => t.type === 'structure' || t.type === 'frame');
      expect(frame.length).toBe(10);
    });

    it('should have 8 Fabric track tiles', () => {
      const all = getAllTechnologies();
      const fabric = all.filter(t => t.type === 'fabric');
      expect(fabric.length).toBe(8);
    });

    it('should have 11 Gas Systems track tiles', () => {
      const all = getAllTechnologies();
      const gas = all.filter(t => t.type === 'gas');
      expect(gas.length).toBe(11);
    });

    it('should have 14 Payload/Component track tiles', () => {
      const all = getAllTechnologies();
      const payload = all.filter(t => t.type === 'component' || t.type === 'payload');
      expect(payload.length).toBe(14);
    });

    // Verify Age I distribution
    // Note: Appendix C table shows Dual Engine Mount as Age I, making it 12 tiles
    // (3 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
    it('should have 12 Age I tiles', () => {
      expect(TECHNOLOGY_BAG[1].length).toBe(12);
    });

    // Verify Age II distribution (23 tiles)
    // Per Appendix C table: (4 Propulsion, 5 Frame, 4 Fabric, 4 Gas, 6 Payload)
    // Note: Summary says 23 tiles, which matches the actual table content
    it('should have 23 Age II tiles', () => {
      expect(TECHNOLOGY_BAG[2].length).toBe(23);
    });

    // Verify Age III distribution (19 tiles)
    // Per Appendix C table: (4 Propulsion, 3 Frame, 2 Fabric, 5 Gas, 5 Payload)
    // Note: Summary says 20 tiles but table content adds up to 19
    it('should have 19 Age III tiles', () => {
      expect(TECHNOLOGY_BAG[3].length).toBe(19);
    });

    // Verify all required Propulsion tiles exist
    it('should have all Propulsion track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedPropulsion = [
        'Daimler Petrol Engine',
        'Improved Propeller',
        'Dual Engine Mount',
        'Maybach Engine Design',
        'Diesel Powerplant',
        'Swiveling Propeller',
        'Contra-Rotating Props',
        'Streamlined Nacelle',
        'Supercharged Engine',
        'Diesel-Electric Drive',
        'Variable-Pitch Propeller'
      ];

      for (const name of expectedPropulsion) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
      }
    });

    // Verify all required Frame tiles exist
    it('should have all Frame track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedFrame = [
        'Wooden Framework',
        'Wire Bracing',
        'Duralumin Framework',
        'Steel Framework',
        'Internal Keel',
        'Articulated Keel Design',
        'Aerodynamic Hull Design',
        'Geodetic Structure',
        'Modular Construction',
        'Dynamic Lift Surfaces'
      ];

      for (const name of expectedFrame) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
      }
    });

    // Verify all required Fabric tiles exist
    it('should have all Fabric track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedFabric = [
        'Rubberized Cotton',
        'Doped Canvas',
        "Goldbeater's Skin",
        'Fireproof Coating',
        'Aluminum Doping',
        'Grounding Systems',
        'Gelatinized Latex',
        'Composite Covering'
      ];

      for (const name of expectedFabric) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
      }
    });

    // Verify all required Gas Systems tiles exist
    it('should have all Gas Systems track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedGas = [
        'Improved Valving',
        'Manual Ballonets',
        'Multiple Gas Cells',
        'Helium Handling',
        'Blaugas Fuel System',
        'Automatic Valves',
        'Pressure Altitude System',
        'Triple Gas Cell',
        'Emergency Venting',
        'Gas Recovery',
        'Water Recovery System'
      ];

      for (const name of expectedGas) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
      }
    });

    // Verify all required Payload tiles exist
    it('should have all Payload track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedPayload = [
        'Observation Platform',
        'Mail Compartment',
        'Cargo Nets',
        'Passenger Gondola',
        'Bomb Bay Design',
        'Trapeze System',
        'Radio Equipment',
        'Armored Gondola',
        'Reinforced Hull',
        'Luxury Accommodation',
        'Dining Saloon',
        'Promenade Deck',
        'Sleeping Quarters',
        'Smoking Room'
      ];

      for (const name of expectedPayload) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
      }
    });

    // Verify VP values are assigned correctly
    it('should have VP values matching Appendix C', () => {
      const all = getAllTechnologies();

      // Sample VP checks from Appendix C
      const vpChecks = [
        // Age I - most are 0 VP
        { name: 'Daimler Petrol Engine', vp: 0 },
        { name: 'Dual Engine Mount', vp: 1 },
        { name: 'Wire Bracing', vp: 1 },
        { name: 'Cargo Nets', vp: 1 },
        // Age II
        { name: 'Diesel Powerplant', vp: 1 },
        { name: 'Swiveling Propeller', vp: 1 },
        { name: 'Steel Framework', vp: 2 },
        { name: "Goldbeater's Skin", vp: 2 },
        { name: 'Fireproof Coating', vp: 2 },
        { name: 'Blaugas Fuel System', vp: 2 },
        { name: 'Bomb Bay Design', vp: 3 },
        { name: 'Trapeze System', vp: 2 },
        // Age III
        { name: 'Supercharged Engine', vp: 1 },
        { name: 'Diesel-Electric Drive', vp: 1 },
        { name: 'Modular Construction', vp: 3 },
        { name: 'Dynamic Lift Surfaces', vp: 2 },
        { name: 'Emergency Venting', vp: 2 },
        { name: 'Promenade Deck', vp: 2 },
        { name: 'Smoking Room', vp: 3 }
      ];

      for (const { name, vp } of vpChecks) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
        expect(tech.vp).toBe(vp);
      }
    });

    // Verify costs are correct
    it('should have costs matching Appendix C', () => {
      const all = getAllTechnologies();

      // Sample cost checks from Appendix C
      const costChecks = [
        // Age I (1-2 Research)
        { name: 'Daimler Petrol Engine', cost: 1 },
        { name: 'Improved Propeller', cost: 1 },
        { name: 'Dual Engine Mount', cost: 2 },
        { name: 'Wooden Framework', cost: 1 },
        { name: 'Wire Bracing', cost: 2 },
        { name: 'Rubberized Cotton', cost: 1 },
        { name: 'Doped Canvas', cost: 2 },
        // Age II (2-4 Research)
        { name: 'Maybach Engine Design', cost: 3 },
        { name: 'Diesel Powerplant', cost: 3 },
        { name: 'Duralumin Framework', cost: 3 },
        { name: 'Steel Framework', cost: 2 },
        { name: "Goldbeater's Skin", cost: 4 },
        { name: 'Multiple Gas Cells', cost: 3 },
        { name: 'Helium Handling', cost: 4 },
        // Age III (4-6 Research)
        { name: 'Streamlined Nacelle', cost: 4 },
        { name: 'Supercharged Engine', cost: 5 },
        { name: 'Geodetic Structure', cost: 4 },
        { name: 'Modular Construction', cost: 5 },
        { name: 'Pressure Altitude System', cost: 5 },
        { name: 'Luxury Accommodation', cost: 4 },
        { name: 'Promenade Deck', cost: 6 }
      ];

      for (const { name, cost } of costChecks) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
        expect(tech.cost).toBe(cost);
      }
    });
  });
});
