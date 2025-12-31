/**
 * Rules Compliance Tests - Upgrades
 * Tests for correct implementation of Appendix C and D (Technology/Upgrade Tiles)
 */

const { UPGRADES, TECHNOLOGIES } = require('../../../server/data/upgrades');

describe('Rules Compliance - Upgrades', () => {

  describe('GAP-054: Grounding Systems / Conductive Covering upgrade', () => {
    it('should have conductive_covering upgrade in UPGRADES data per Appendix D', () => {
      // Appendix D defines Conductive Covering as a fabric upgrade
      // that grants immunity to Static Discharge hazards
      expect(UPGRADES.conductive_covering).toBeDefined();
    });

    it('should have correct properties for conductive_covering upgrade', () => {
      const upgrade = UPGRADES.conductive_covering;

      // Must be a fabric upgrade
      expect(upgrade.type).toBe('fabric');
      expect(upgrade.slotType).toBe('fabricSlots');

      // Must require grounding_systems technology per Appendix C
      expect(upgrade.requiredTech).toBe('grounding_systems');

      // Must have static_immunity special ability per Appendix D
      expect(upgrade.special).toBe('static_immunity');
    });

    it('should have grounding_systems technology in TECHNOLOGIES data per Appendix C', () => {
      // Appendix C defines Grounding Systems technology that unlocks Conductive Covering
      expect(TECHNOLOGIES.grounding_systems).toBeDefined();
    });
  });

  describe('GAP-068: Flexible Frame Weight', () => {
    it('should have weight 0 per Appendix D spec', () => {
      // Appendix D: Flexible Frame | Articulated Keel Design | 0 | +£1 | Ceiling +1
      const upgrade = UPGRADES.flexible_frame;
      expect(upgrade).toBeDefined();
      expect(upgrade.weight).toBe(0);
    });
  });

  describe('GAP-069: Gas System Upgrades', () => {
    // Appendix D defines 11 Gas System upgrades
    const gasSystemUpgrades = [
      { id: 'pressure_control', requiredTech: 'improved_valving', weight: -1, stats: { ceiling: 1 } },
      { id: 'altitude_ballonets', requiredTech: 'manual_ballonets', weight: -1, stats: { ceiling: 1 } },
      { id: 'compartmented_gas', requiredTech: 'multiple_gas_cells', weight: -1, stats: { lift: 2, reliability: 1 } },
      { id: 'helium_gas_cell', requiredTech: 'helium_handling', weight: -1, special: 'fire_immunity' },
      { id: 'blaugas_tank', requiredTech: 'blaugas_storage', weight: 0, stats: { range: 1 }, special: 'gas_retention' },
      { id: 'smart_valving', requiredTech: 'automatic_valves', weight: -1, stats: { reliability: 1, ceiling: 1 } },
      { id: 'high_ceiling_gas', requiredTech: 'pressure_altitude_system', weight: -2, stats: { lift: 3, ceiling: 2 } },
      { id: 'redundant_cells', requiredTech: 'triple_gas_cell', weight: -2, stats: { lift: 4, reliability: 2 } },
      { id: 'rapid_descent_system', requiredTech: 'emergency_venting', weight: -1, stats: { reliability: 2 }, special: 'weather_auto_pass' },
      { id: 'reclamation_system', requiredTech: 'gas_recovery', weight: -1, stats: { range: 2 }, special: 'gas_cost_reduction' },
      { id: 'exhaust_condensers', requiredTech: 'water_recovery_system', weight: -2, special: 'helium_cost_reduction' }
    ];

    gasSystemUpgrades.forEach(({ id, requiredTech, weight, stats, special }) => {
      it(`should have ${id} upgrade defined`, () => {
        expect(UPGRADES[id]).toBeDefined();
      });

      it(`should have correct weight for ${id}`, () => {
        expect(UPGRADES[id].weight).toBe(weight);
      });

      it(`should have correct required tech for ${id}`, () => {
        expect(UPGRADES[id].requiredTech).toBe(requiredTech);
      });

      if (stats) {
        Object.entries(stats).forEach(([stat, value]) => {
          it(`should have ${stat}: ${value} for ${id}`, () => {
            expect(UPGRADES[id].stats[stat]).toBe(value);
          });
        });
      }

      if (special) {
        it(`should have special ability '${special}' for ${id}`, () => {
          expect(UPGRADES[id].special).toBe(special);
        });
      }
    });
  });

  describe('GAP-070: Missing Frame Upgrades', () => {
    it('should have streamlined_hull upgrade defined', () => {
      // Appendix D: Streamlined Hull | Aerodynamic Hull Design | -1 | +£2 | Lift +2
      const upgrade = UPGRADES.streamlined_hull;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('frame');
      expect(upgrade.weight).toBe(-1);
      expect(upgrade.hullCost).toBe(2);
      expect(upgrade.stats.lift).toBe(2);
      expect(upgrade.requiredTech).toBe('aerodynamic_hull_design');
    });

    it('should have aerodynamic_lift_system upgrade defined', () => {
      // Appendix D: Aerodynamic Lift System | Dynamic Lift Surfaces | -2 | +£3 | Lift +4
      const upgrade = UPGRADES.aerodynamic_lift_system;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('frame');
      expect(upgrade.weight).toBe(-2);
      expect(upgrade.hullCost).toBe(3);
      expect(upgrade.stats.lift).toBe(4);
      expect(upgrade.requiredTech).toBe('dynamic_lift_surfaces');
    });
  });

  describe('GAP-071: Missing Payload Upgrades', () => {
    it('should have bombing_equipment upgrade defined', () => {
      // Appendix D: Bombing Equipment | Bomb Bay Design | -3 | Combat Missions: +£3 Income
      const upgrade = UPGRADES.bombing_equipment;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-3);
      expect(upgrade.special).toBe('combat_income_bonus');
    });

    it('should have sparrowhawk_hangar upgrade defined', () => {
      // Appendix D: Sparrowhawk Hangar | Trapeze System | -3 | Ignore one route requirement
      const upgrade = UPGRADES.sparrowhawk_hangar;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-3);
      expect(upgrade.special).toBe('ignore_route_requirement');
    });

    it('should have light_armor_plating upgrade defined', () => {
      // Appendix D: Light Armor Plating | Armored Gondola | -2 | Armor +1
      const upgrade = UPGRADES.light_armor_plating;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-2);
      expect(upgrade.stats.armor).toBe(1);
    });

    it('should have heavy_armor_plating upgrade defined', () => {
      // Appendix D: Heavy Armor Plating | Reinforced Hull | -3 | Armor +2
      const upgrade = UPGRADES.heavy_armor_plating;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-3);
      expect(upgrade.stats.armor).toBe(2);
    });

    it('should have observation_lounge upgrade defined', () => {
      // Appendix D: Observation Lounge | Promenade Deck | -2 | Income +1, Luxury +3
      const upgrade = UPGRADES.observation_lounge;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-2);
      expect(upgrade.stats.income).toBe(1);
      expect(upgrade.stats.luxury).toBe(3);
    });

    it('should have imperial_mast upgrade defined', () => {
      // Appendix D: Imperial Mast | Imperial Mooring System | -1 | Britain specialty
      const upgrade = UPGRADES.imperial_mast;
      expect(upgrade).toBeDefined();
      expect(upgrade.type).toBe('component');
      expect(upgrade.weight).toBe(-1);
      expect(upgrade.special).toBe('british_territories_home');
    });
  });

  describe('GAP-072: Payload Upgrade Stat Mismatches', () => {
    it('should have correct stats for passenger_gondola per Appendix D', () => {
      // Appendix D: Basic Cabin | Passenger Gondola | -2 | Income +2, Luxury +1
      const upgrade = UPGRADES.passenger_gondola;
      expect(upgrade.stats.income).toBe(2); // was 1
      expect(upgrade.stats.luxury).toBe(1);
    });

    it('should have correct stats for dining_saloon per Appendix D', () => {
      // Appendix D: Restaurant | Dining Saloon | -2 | Income +2, Luxury +2
      const upgrade = UPGRADES.dining_saloon;
      expect(upgrade.weight).toBe(-2); // was -3
      expect(upgrade.stats.income).toBe(2);
      expect(upgrade.stats.luxury).toBe(2); // was 3
    });

    it('should have correct stats for sleeping_quarters per Appendix D', () => {
      // Appendix D: Private Berths | Sleeping Quarters | -2 | Income +2, Luxury +1
      const upgrade = UPGRADES.sleeping_quarters;
      expect(upgrade.stats.income).toBe(2);
      expect(upgrade.stats.luxury).toBe(1); // was 2
      expect(upgrade.stats.range).toBeUndefined(); // was 1
    });

    it('should have correct stats for observation_deck (spotter_gondola) per Appendix D', () => {
      // Appendix D: Spotter Gondola | Observation Platform | -1 | Income +1
      // This should be renamed to spotter_gondola and have income, not luxury
      const upgrade = UPGRADES.spotter_gondola;
      expect(upgrade).toBeDefined();
      expect(upgrade.stats.income).toBe(1);
      expect(upgrade.stats.luxury).toBeUndefined();
    });
  });

  describe('GAP-073: Payload Upgrade Name/Tech Mappings', () => {
    it('should have spotter_gondola requiring observation_platform tech', () => {
      const upgrade = UPGRADES.spotter_gondola;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('observation_platform');
    });

    it('should have postal_service requiring mail_compartment tech', () => {
      const upgrade = UPGRADES.postal_service;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('mail_compartment');
    });

    it('should have external_cargo requiring cargo_nets tech', () => {
      const upgrade = UPGRADES.external_cargo;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('cargo_nets');
    });

    it('should have luxury_cabin requiring luxury_accommodation tech', () => {
      const upgrade = UPGRADES.luxury_cabin;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('luxury_accommodation');
    });

    it('should have restaurant requiring dining_saloon tech', () => {
      const upgrade = UPGRADES.restaurant;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('dining_saloon');
    });

    it('should have pressurized_lounge requiring smoking_room tech', () => {
      const upgrade = UPGRADES.pressurized_lounge;
      expect(upgrade).toBeDefined();
      expect(upgrade.requiredTech).toBe('smoking_room');
    });
  });

  describe('GAP-080: Pressurized Lounge requires Helium Gas Cell installed', () => {
    const { createTestGameState } = require('../../fixtures/testData');
    const { processInstallUpgrade } = require('../../../server/actions/blueprint');

    it('should have requires_helium special on pressurized_lounge', () => {
      expect(UPGRADES.pressurized_lounge.special).toBe('requires_helium');
    });

    it('should reject pressurized_lounge installation when no helium_gas_cell is installed', () => {
      const state = createTestGameState();
      state.age = 3; // Pressurized Lounge is Age 3

      // Player has smoking_room tech but NO helium_gas_cell installed
      state.players['1'].technologies = ['smoking_room'];
      state.players['1'].blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['diesel_engine'],
        componentSlots: [null, null], // Empty slots, no helium_gas_cell
        gasSockets: ['hydrogen', 'hydrogen']
      };

      expect(() => {
        processInstallUpgrade(state, '1', {
          slotType: 'component',
          slotIndex: 0,
          upgradeId: 'pressurized_lounge',
          _internal: true
        });
      }).toThrow(/helium|gas cell|requires/i);
    });

    it('should allow pressurized_lounge installation when helium_gas_cell IS installed', () => {
      const state = createTestGameState();
      state.age = 3; // Pressurized Lounge is Age 3

      // Player has smoking_room tech AND helium_gas_cell installed
      state.players['1'].technologies = ['smoking_room'];
      state.players['1'].blueprint = {
        frameSlots: ['duralumin_frame'],
        fabricSlots: ['premium_envelope'],
        driveSlots: ['diesel_engine'],
        componentSlots: ['helium_gas_cell', null], // Has helium_gas_cell in first slot
        gasSockets: ['helium', 'helium']
      };

      // Should succeed
      const result = processInstallUpgrade(state, '1', {
        slotType: 'component',
        slotIndex: 1, // Install in second slot
        upgradeId: 'pressurized_lounge',
        _internal: true
      });

      expect(result.newState.players['1'].blueprint.componentSlots[1]).toBe('pressurized_lounge');
    });
  });
});
