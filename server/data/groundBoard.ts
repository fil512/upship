/**
 * Ground Board Data - 16 Worker Placement Action Spaces
 *
 * Symbols:
 * - wrench: Technical (engineering/construction)
 * - coin: Business (financial/personnel)
 * - propeller: Operations (research/flight)
 * - any: Special cards that work anywhere
 */

import type { CardSymbol } from '@upship/api';

export interface LocationAction {
  type: string;
  cost?: number | string;
  effect: string;
  maxShips?: number;
  officerCost?: number;
  engineerCost?: number;
  minOfficers?: number;
  maxOfficers?: number;
  hydrogenPrice?: number;
  heliumPrice?: string;
  maxPolicies?: number;
}

export interface GroundBoardLocation {
  id: string;
  name: string;
  symbol: CardSymbol;
  position: number;
  description: string;
  action: LocationAction;
}

export const GROUND_BOARD_LOCATIONS: Record<string, GroundBoardLocation> = {
  research_institute: {
    id: 'research_institute',
    name: 'Research Institute',
    symbol: 'coin',
    position: 1,
    description: 'Expand your research program',
    action: {
      type: 'UPGRADE_RESEARCH_LEVEL',
      cost: 4, // Per Section 6.1: £4 per level
      effect: 'Increase Research Level by 1. Also clears prior-age tech cards from R&D Board.'
    }
  },

  blueprint_design: {
    id: 'blueprint_design',
    name: 'Blueprint Design',
    symbol: 'wrench',
    position: 2,
    description: 'Modify your Blueprint (install/remove Upgrades)',
    action: {
      type: 'MODIFY_BLUEPRINT',
      cost: 0,
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
      cost: 'Officers (by Age) + Gas',
      effect: 'Launch ships to claim routes'
    }
  },

  launchpad_2: {
    id: 'launchpad_2',
    name: 'Launchpad',
    symbol: 'propeller',
    position: 5,
    description: 'Launch ships from your Launch Hangar',
    action: {
      type: 'LAUNCH_SHIPS',
      cost: 'Officers (by Age) + Gas',
      effect: 'Launch ships to claim routes'
    }
  },

  flight_school: {
    id: 'flight_school',
    name: 'Flight School',
    symbol: 'coin',
    position: 6,
    description: 'Expand your officer training program',
    action: {
      type: 'UPGRADE_OFFICER_INCOME',
      cost: 5, // £5 per level
      effect: 'Increase Officer Income track by 1'
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

  government_liaison: {
    id: 'government_liaison',
    name: 'Government Liaison',
    symbol: 'coin',
    position: 8,
    description: 'Send officers to secure government backing',
    action: {
      type: 'GOVERNMENT_LIAISON',
      minOfficers: 1,
      maxOfficers: 3,
      effect: 'Spend 1-3 Officers to increase Income Track by 1 per Officer'
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
  },

  personnel_office: {
    id: 'personnel_office',
    name: 'Personnel Office',
    symbol: 'propeller',
    position: 13,
    description: 'Recruit trained officers',
    action: {
      type: 'COLLECT_OFFICERS',
      cost: 0,
      effect: 'Gain officers equal to Officer Income Track'
    }
  },

  engineering_depot: {
    id: 'engineering_depot',
    name: 'Engineering Depot',
    symbol: 'wrench',
    position: 14,
    description: 'Hire skilled engineers',
    action: {
      type: 'COLLECT_ENGINEERS',
      cost: 0,
      effect: 'Gain engineers equal to Engineer Income Track'
    }
  },

  treasury: {
    id: 'treasury',
    name: 'The Treasury',
    symbol: 'coin',
    position: 15,
    description: 'Collect company earnings',
    action: {
      type: 'COLLECT_MONEY',
      cost: 0,
      effect: 'Gain cash equal to Income Track'
    }
  },

  repair: {
    id: 'repair',
    name: 'Repair',
    symbol: 'wrench',
    position: 16,
    description: 'Repair damaged ships',
    action: {
      type: 'REPAIR_SHIPS',
      cost: 'Hull Cost ÷ 2 + 1 Engineer per ship',
      effect: 'Move ships from Repair Hangar to Launch Hangar'
    }
  }
};

// Symbol icons for display
export const SYMBOL_ICONS: Record<CardSymbol, string> = {
  wrench: '🔧',
  coin: '🪙',
  propeller: '⚙️',
  any: '⭐'
};

// Symbol colors for styling
export const SYMBOL_COLORS: Record<CardSymbol, string> = {
  wrench: '#4a9eff', // Blue
  coin: '#ffc107', // Gold
  propeller: '#4caf50', // Green
  any: '#c4a35a' // Bronze
};

/**
 * Get locations by symbol type
 */
export function getLocationsBySymbol(symbol: CardSymbol): GroundBoardLocation[] {
  if (symbol === 'any') {
    return Object.values(GROUND_BOARD_LOCATIONS);
  }
  return Object.values(GROUND_BOARD_LOCATIONS).filter(loc => loc.symbol === symbol);
}

/**
 * Check if a card can be used at a location
 */
export function canPlaceAtLocation(cardSymbol: CardSymbol, locationId: string): boolean {
  if (cardSymbol === 'any') return true;

  const location = GROUND_BOARD_LOCATIONS[locationId];
  if (!location) return false;

  return location.symbol === cardSymbol;
}

// CommonJS compatibility
module.exports = {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS,
  SYMBOL_COLORS,
  getLocationsBySymbol,
  canPlaceAtLocation
};
