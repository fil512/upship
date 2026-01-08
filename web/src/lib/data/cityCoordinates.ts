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
 * Age I: Western Europe Map (1000x700 viewBox)
 * 18 cities, 17 routes forming a fully connected network
 * Positioned with minimal margins (~30px) to fill the map area
 */
export const AGE_I_CITIES: Record<string, CityPosition> = {
  // British Isles (left side)
  'London': { x: 80, y: 180, labelPosition: 'left' },
  'Dover': { x: 160, y: 300, labelPosition: 'left' },

  // France/Benelux (center-left)
  'Calais': { x: 280, y: 280, labelPosition: 'top' },
  'Paris': { x: 180, y: 440, labelPosition: 'left' },
  'Brussels': { x: 360, y: 320, labelPosition: 'top' },
  'Amsterdam': { x: 400, y: 180, labelPosition: 'top' },

  // Germany (center)
  'Cologne': { x: 480, y: 280, labelPosition: 'right' },
  'Hamburg': { x: 540, y: 100, labelPosition: 'top' },
  'Berlin': { x: 740, y: 140, labelPosition: 'right' },
  'Frankfurt': { x: 560, y: 380, labelPosition: 'right' },
  'Friedrichshafen': { x: 640, y: 500, labelPosition: 'right' },

  // Scandinavia
  'Copenhagen': { x: 680, y: 60, labelPosition: 'right' },

  // Central Europe
  'Zurich': { x: 500, y: 520, labelPosition: 'left' },
  'Vienna': { x: 900, y: 320, labelPosition: 'right' },

  // Italy/Mediterranean
  'Milan': { x: 540, y: 600, labelPosition: 'bottom' },
  'Rome': { x: 760, y: 620, labelPosition: 'right' },
  'Marseille': { x: 340, y: 560, labelPosition: 'left' },
  'Barcelona': { x: 140, y: 620, labelPosition: 'left' }
};

/**
 * Age III: Atlantic Map (1200x800 viewBox)
 * 21 cities, 21 routes forming a fully connected global network
 * Positioned with minimal margins (~30px) to fill the map area
 */
export const AGE_III_CITIES: Record<string, CityPosition> = {
  // North America - West Coast
  'San Francisco': { x: 60, y: 180, labelPosition: 'left' },
  'Los Angeles': { x: 100, y: 280, labelPosition: 'left' },
  'Honolulu': { x: 40, y: 480, labelPosition: 'left' },

  // North America - Central/East
  'Chicago': { x: 200, y: 160, labelPosition: 'top' },
  'New York': { x: 340, y: 180, labelPosition: 'top' },
  'Lakehurst': { x: 380, y: 260, labelPosition: 'right' },
  'Miami': { x: 320, y: 380, labelPosition: 'right' },

  // Caribbean
  'Havana': { x: 280, y: 460, labelPosition: 'left' },

  // South America
  'Manaus': { x: 420, y: 540, labelPosition: 'left' },
  'Recife': { x: 580, y: 520, labelPosition: 'right' },
  'Rio de Janeiro': { x: 520, y: 620, labelPosition: 'bottom' },
  'Buenos Aires': { x: 460, y: 740, labelPosition: 'left' },
  'Valparaiso': { x: 360, y: 740, labelPosition: 'left' },

  // Europe
  'London': { x: 780, y: 200, labelPosition: 'top' },
  'Berlin': { x: 920, y: 180, labelPosition: 'top' },
  'Frankfurt': { x: 880, y: 280, labelPosition: 'left' },
  'Friedrichshafen': { x: 920, y: 380, labelPosition: 'right' },
  'Rome': { x: 1000, y: 480, labelPosition: 'right' },
  'Oslo': { x: 860, y: 80, labelPosition: 'left' },
  'Svalbard': { x: 980, y: 60, labelPosition: 'right' },

  // Africa/Middle East
  'Cairo': { x: 1100, y: 580, labelPosition: 'right' }
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
