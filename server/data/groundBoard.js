/**
 * Ground Board Data - 12 Worker Placement Action Spaces
 *
 * Symbols:
 * - wrench: Technical (engineering/construction)
 * - coin: Business (financial/personnel)
 * - propeller: Operations (research/flight)
 * - any: Special cards that work anywhere
 */

const GROUND_BOARD_LOCATIONS = {
  research_institute: {
    id: 'research_institute',
    name: 'Research Institute',
    symbol: 'propeller',
    position: 1,
    description: 'Purchase Research with money',
    action: {
      type: 'BUY_RESEARCH',
      cost: 3, // £3 per Research point
      effect: 'Gain Research tokens for Technology acquisition'
    }
  },

  design_bureau: {
    id: 'design_bureau',
    name: 'Design Bureau',
    symbol: 'wrench',
    position: 2,
    description: 'Modify your Blueprint (install/remove Upgrades)',
    action: {
      type: 'MODIFY_BLUEPRINT',
      cost: 0,
      swaps: 2, // Base swaps allowed
      effect: 'Install or remove upgrade tiles'
    }
  },

  construction_hall: {
    id: 'construction_hall',
    name: 'Construction Hall',
    symbol: 'wrench',
    position: 3,
    description: 'Build ships',
    action: {
      type: 'BUILD_SHIPS',
      maxShips: 3,
      effect: 'Pay Hull Cost per ship, place in Hangar Bay'
    }
  },

  launchpad: {
    id: 'launchpad',
    name: 'Launchpad',
    symbol: 'propeller',
    position: 4,
    description: 'Launch ships from your Launch Hangar',
    action: {
      type: 'LAUNCH_SHIPS',
      cost: '1 Pilot + Gas',
      effect: 'Launch ships to claim routes'
    }
  },

  academy: {
    id: 'academy',
    name: 'Academy',
    symbol: 'coin',
    position: 5,
    description: 'Recruit crew from the shared supply',
    action: {
      type: 'RECRUIT_CREW',
      pilotCost: 2,
      engineerCost: 4,
      effect: 'Gain Pilot or Engineer tokens'
    }
  },

  flight_school: {
    id: 'flight_school',
    name: 'Flight School',
    symbol: 'coin',
    position: 6,
    description: 'Expand your pilot training program',
    action: {
      type: 'UPGRADE_PILOT_INCOME',
      cost: 5, // £5 per level
      effect: 'Increase Pilot Income track by 1'
    }
  },

  technical_institute: {
    id: 'technical_institute',
    name: 'Technical Institute',
    symbol: 'wrench',
    position: 7,
    description: 'Expand your engineering program',
    action: {
      type: 'UPGRADE_ENGINEER_INCOME',
      cost: 6, // £6 per level
      effect: 'Increase Engineer Income track by 1'
    }
  },

  the_bank: {
    id: 'the_bank',
    name: 'The Bank',
    symbol: 'coin',
    position: 8,
    description: 'Take a loan',
    action: {
      type: 'TAKE_LOAN',
      amount: 30,
      penalty: 3, // -3 Income
      effect: 'Gain £30, reduce Income by 3'
    }
  },

  ministry: {
    id: 'ministry',
    name: 'Ministry',
    symbol: 'propeller',
    position: 9,
    description: 'Political maneuvering',
    action: {
      type: 'MINISTRY_ACTION',
      cost: 0,
      effect: 'Draw 2 discard 1, go first next round, -1 Helium price'
    }
  },

  gas_depot: {
    id: 'gas_depot',
    name: 'Gas Depot',
    symbol: 'wrench',
    position: 10,
    description: 'Purchase lifting gas for storage',
    action: {
      type: 'BUY_GAS_DEPOT',
      hydrogenPrice: 1, // Fixed £1
      heliumPrice: 'market', // Uses market track
      effect: 'Add gas cubes to Gas Reserve'
    }
  },

  insurance_bureau: {
    id: 'insurance_bureau',
    name: 'Insurance Bureau',
    symbol: 'coin',
    position: 11,
    description: 'Purchase insurance policies',
    action: {
      type: 'BUY_INSURANCE',
      cost: -1, // -1 Income per policy
      maxPolicies: 3,
      effect: 'Protect ships from crashes'
    }
  },

  weather_bureau: {
    id: 'weather_bureau',
    name: 'Weather Bureau',
    symbol: 'propeller',
    position: 12,
    description: 'Consult weather forecasts',
    action: {
      type: 'CHECK_WEATHER',
      cost: 2, // £2
      effect: 'Peek at next hazard, optionally discard it'
    }
  }
};

// Symbol icons for display
const SYMBOL_ICONS = {
  wrench: '🔧',
  coin: '🪙',
  propeller: '⚙️',
  any: '⭐'
};

// Symbol colors for styling
const SYMBOL_COLORS = {
  wrench: '#4a9eff', // Blue
  coin: '#ffc107', // Gold
  propeller: '#4caf50', // Green
  any: '#c4a35a' // Bronze
};

/**
 * Get locations by symbol type
 */
function getLocationsBySymbol(symbol) {
  if (symbol === 'any') {
    return Object.values(GROUND_BOARD_LOCATIONS);
  }
  return Object.values(GROUND_BOARD_LOCATIONS).filter(loc => loc.symbol === symbol);
}

/**
 * Check if a card can be used at a location
 */
function canPlaceAtLocation(cardSymbol, locationId) {
  if (cardSymbol === 'any') return true;

  const location = GROUND_BOARD_LOCATIONS[locationId];
  if (!location) return false;

  return location.symbol === cardSymbol;
}

module.exports = {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS,
  SYMBOL_COLORS,
  getLocationsBySymbol,
  canPlaceAtLocation
};
