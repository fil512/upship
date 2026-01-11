/**
 * City coordinates for stylized map rendering (Ticket to Ride style)
 * Positions are optimized for visual clarity, not geographic accuracy
 */

export interface CityPosition {
  x: number;
  y: number;
  labelPosition: 'left' | 'right' | 'top' | 'bottom';
}

export type BonusType = 'money' | 'officer' | 'engineer' | 'research' | 'influence' | 'gas' | 'card' | 'swap';

export interface CityBonus {
  type: BonusType;
  value: number;
  /** Optional second bonus for cities with multiple bonuses */
  type2?: BonusType;
  value2?: number;
}

/**
 * Age I: Western Europe Map (1200x680 viewBox - 16:9 optimized)
 * 18 cities, 17 routes forming a fully connected network
 * Positioned with minimal margins (~30px) to fill the map area
 */
export const AGE_I_CITIES: Record<string, CityPosition> = {
  // British Isles (left side)
  'London': { x: 140, y: 120, labelPosition: 'left' },
  'Dover': { x: 360, y: 280, labelPosition: 'right' },

  // France/Benelux (center-left)
  'Calais': { x: 300, y: 370, labelPosition: 'right' },
  'Paris': { x: 280, y: 480, labelPosition: 'left' },
  'Brussels': { x: 500, y: 360, labelPosition: 'bottom' },
  'Amsterdam': { x: 560, y: 100, labelPosition: 'top' },

  // Germany (center)
  'Cologne': { x: 600, y: 300, labelPosition: 'right' },
  'Hamburg': { x: 660, y: 80, labelPosition: 'top' },
  'Berlin': { x: 880, y: 160, labelPosition: 'right' },
  'Frankfurt': { x: 680, y: 400, labelPosition: 'right' },
  'Friedrichshafen': { x: 720, y: 520, labelPosition: 'right' },

  // Scandinavia
  'Copenhagen': { x: 780, y: 40, labelPosition: 'right' },

  // Central Europe
  'Zurich': { x: 580, y: 540, labelPosition: 'left' },
  'Vienna': { x: 1040, y: 360, labelPosition: 'right' },

  // Italy/Mediterranean
  'Milan': { x: 680, y: 620, labelPosition: 'bottom' },
  'Rome': { x: 920, y: 640, labelPosition: 'right' },
  'Marseille': { x: 400, y: 600, labelPosition: 'right' },
  'Barcelona': { x: 180, y: 640, labelPosition: 'left' }
};

/**
 * Age III: Atlantic Map (1420x800 viewBox - 16:9 optimized)
 * 21 cities, 21 routes forming a fully connected global network
 * Positioned with minimal margins (~30px) to fill the map area
 */
export const AGE_III_CITIES: Record<string, CityPosition> = {
  // North America - West Coast
  'San Francisco': { x: 150, y: 140, labelPosition: 'left' },  // moved northwest
  'Los Angeles': { x: 230, y: 280, labelPosition: 'left' },
  'Honolulu': { x: 170, y: 480, labelPosition: 'left' },

  // North America - Central/East
  'Chicago': { x: 330, y: 120, labelPosition: 'top' },  // moved north
  'New York': { x: 520, y: 180, labelPosition: 'top' },  // moved east
  'Lakehurst': { x: 560, y: 260, labelPosition: 'right' },  // moved east
  'Miami': { x: 450, y: 380, labelPosition: 'right' },

  // Caribbean
  'Havana': { x: 370, y: 500, labelPosition: 'left' },  // moved southwest

  // South America
  'Manaus': { x: 500, y: 500, labelPosition: 'left' },  // moved northwest
  'Recife': { x: 700, y: 480, labelPosition: 'right' },  // moved west
  'Rio de Janeiro': { x: 650, y: 620, labelPosition: 'right' },  // label moved east
  'Buenos Aires': { x: 590, y: 740, labelPosition: 'right' },  // label moved east
  'Valparaiso': { x: 360, y: 740, labelPosition: 'left' },  // moved quite a bit west

  // Europe
  'London': { x: 910, y: 200, labelPosition: 'top' },
  'Berlin': { x: 1050, y: 180, labelPosition: 'top' },
  'Frankfurt': { x: 920, y: 320, labelPosition: 'left' },  // moved southwest
  'Friedrichshafen': { x: 990, y: 380, labelPosition: 'bottom' },  // label below
  'Rome': { x: 1030, y: 530, labelPosition: 'left' },  // moved further west
  'Oslo': { x: 990, y: 80, labelPosition: 'left' },
  'Svalbard': { x: 1200, y: 60, labelPosition: 'right' },  // moved further east

  // Africa/Middle East
  'Cairo': { x: 1230, y: 580, labelPosition: 'right' }
};

/**
 * City bonuses for display on the map
 * Structured data for rendering bonus icons directly on cities
 * Every city has a bonus to show on the map
 */
export const CITY_BONUSES: Record<string, CityBonus> = {
  // Age I - Western Europe
  'London': { type: 'money', value: 3 },
  'Dover': { type: 'officer', value: 1 },
  'Calais': { type: 'card', value: 1 },
  'Paris': { type: 'influence', value: 1 },
  'Brussels': { type: 'officer', value: 1 },
  'Amsterdam': { type: 'money', value: 1 },
  'Cologne': { type: 'engineer', value: 1 },
  'Hamburg': { type: 'gas', value: 1 },
  'Berlin': { type: 'research', value: 1 },
  'Frankfurt': { type: 'money', value: 2 },
  'Friedrichshafen': { type: 'research', value: 1 },
  'Copenhagen': { type: 'card', value: 1 },
  'Zurich': { type: 'money', value: 1 },
  'Vienna': { type: 'influence', value: 1 },
  'Milan': { type: 'engineer', value: 1 },
  'Rome': { type: 'influence', value: 1 },
  'Marseille': { type: 'gas', value: 1 },
  'Barcelona': { type: 'card', value: 1 },

  // Age III - Atlantic
  'San Francisco': { type: 'money', value: 2 },
  'Los Angeles': { type: 'influence', value: 1 },
  'Honolulu': { type: 'card', value: 1 },
  'Chicago': { type: 'engineer', value: 1 },
  'New York': { type: 'money', value: 5 },
  'Lakehurst': { type: 'engineer', value: 1 },
  'Miami': { type: 'officer', value: 1 },
  'Havana': { type: 'influence', value: 1 },
  'Manaus': { type: 'gas', value: 1 },
  'Recife': { type: 'gas', value: 1 },
  'Rio de Janeiro': { type: 'influence', value: 2 },
  'Buenos Aires': { type: 'money', value: 2 },
  'Valparaiso': { type: 'card', value: 1 },
  'Oslo': { type: 'officer', value: 1 },
  'Svalbard': { type: 'research', value: 1 },
  'Cairo': { type: 'swap', value: 1 }
};

/**
 * Get city coordinates for a given age
 */
export function getCityCoordinates(age: number): Record<string, CityPosition> {
  if (age === 1) return AGE_I_CITIES;
  if (age === 3) return AGE_III_CITIES;
  // Age 2 doesn't use a map
  return {};
}
