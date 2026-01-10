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

    // 57 tiles in bag + 1 Reserve Tech Card (Helium Handling) = 58 unique tiles
    // But the bag itself only contains 58 tiles
    // Balance fix added 4 new tiles: altitude_compensator, safety_valves (Age I gas),
    //   pressurized_cabin_tech, redundant_systems (Age II component)
    // Armor balance fix added gondola_shielding (Age I component)
    it('should have 58 technology tiles in the bag per Appendix C', () => {
      const all = getAllTechnologies();
      expect(all.length).toBe(58);
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

    // 12 Gas Systems tiles in bag (Helium Handling is the Reserve Tech Card, not in bag)
    // Balance fix added 2 new gas tiles: altitude_compensator, safety_valves
    it('should have 12 Gas Systems track tiles in bag', () => {
      const all = getAllTechnologies();
      const gas = all.filter(t => t.type === 'gas');
      expect(gas.length).toBe(12);
    });

    // Balance fix added 2 new component tiles: pressurized_cabin_tech, redundant_systems
    // Armor balance fix added gondola_shielding (Age I component)
    it('should have 17 Payload/Component track tiles', () => {
      const all = getAllTechnologies();
      const payload = all.filter(t => t.type === 'component' || t.type === 'payload');
      expect(payload.length).toBe(17);
    });

    // Verify Age I distribution
    // Note: Appendix C table shows Dual Engine Mount as Age I, making it 12 tiles
    // (3 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
    // Balance fix added 2 gas tiles: altitude_compensator, safety_valves (+2 = 14)
    // Armor balance fix added gondola_shielding (Age I component) (+1 = 15)
    it('should have 15 Age I tiles', () => {
      expect(TECHNOLOGY_BAG[1].length).toBe(15);
    });

    // Verify Age II distribution (24 tiles)
    // Per Appendix C table: (4 Propulsion, 5 Frame, 4 Fabric, 3 Gas, 6 Payload)
    // Note: Helium Handling is the Reserve Tech Card, not in the Age II bag
    // Balance fix added 2 component tiles: pressurized_cabin_tech, redundant_systems (+2 = 24)
    it('should have 24 Age II tiles', () => {
      expect(TECHNOLOGY_BAG[2].length).toBe(24);
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

    // Verify all required Gas Systems tiles exist in the bag
    // Note: Helium Handling is the Reserve Tech Card, always available separately
    it('should have all Gas Systems track tiles per Appendix C', () => {
      const all = getAllTechnologies();
      const expectedGas = [
        'Improved Valving',
        'Manual Ballonets',
        'Multiple Gas Cells',
        // 'Helium Handling' is NOT in the bag - it's the Reserve Tech Card
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

    // Verify costs are correct per Appendix C
    it('should have costs matching Appendix C', () => {
      const all = getAllTechnologies();

      // Cost checks - balanced for 1.1 techs/player/round purchasing power
      // Age I: 3-5 Research, Age II: 6-8 Research, Age III: 9-11 Research
      // Costs match TECH_CARD_BAG in constants.ts
      // Age I: 3-5, Age II: 4-6, Age III: 5-7
      const costChecks = [
        // Age I (3-5 Research)
        { name: 'Daimler Petrol Engine', cost: 3 },
        { name: 'Improved Propeller', cost: 3 },
        { name: 'Dual Engine Mount', cost: 5 },
        { name: 'Wooden Framework', cost: 3 },
        { name: 'Wire Bracing', cost: 5 },
        { name: 'Rubberized Cotton', cost: 3 },
        { name: 'Doped Canvas', cost: 5 },
        { name: 'Improved Valving', cost: 3 },
        { name: 'Manual Ballonets', cost: 3 },
        { name: 'Observation Platform', cost: 3 },
        { name: 'Mail Compartment', cost: 3 },
        { name: 'Cargo Nets', cost: 5 },
        // Age II (4-6 Research)
        { name: 'Maybach Engine Design', cost: 5 },
        { name: 'Diesel Powerplant', cost: 5 },
        { name: 'Swiveling Propeller', cost: 6 },
        { name: 'Duralumin Framework', cost: 5 },
        { name: 'Steel Framework', cost: 4 },
        { name: "Goldbeater's Skin", cost: 6 },
        { name: 'Fireproof Coating', cost: 5 },
        { name: 'Multiple Gas Cells', cost: 5 },
        { name: 'Automatic Valves', cost: 6 },
        { name: 'Bomb Bay Design', cost: 6 },
        // Age III (5-7 Research)
        { name: 'Streamlined Nacelle', cost: 5 },
        { name: 'Supercharged Engine', cost: 6 },
        { name: 'Geodetic Structure', cost: 5 },
        { name: 'Modular Construction', cost: 6 },
        { name: 'Pressure Altitude System', cost: 6 },
        { name: 'Luxury Accommodation', cost: 5 },
        { name: 'Promenade Deck', cost: 7 }
      ];

      for (const { name, cost } of costChecks) {
        const tech = all.find(t => t.name === name);
        expect(tech).toBeDefined();
        expect(tech.cost).toBe(cost);
      }
    });
  });
});
