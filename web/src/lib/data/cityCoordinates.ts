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
  'London': { x: 100, y: 200, labelPosition: 'right' },
  'Dover': { x: 180, y: 280, labelPosition: 'right' },

  // France/Benelux (center-left)
  'Calais': { x: 260, y: 250, labelPosition: 'top' },
  'Paris': { x: 200, y: 400, labelPosition: 'right' },
  'Brussels': { x: 340, y: 280, labelPosition: 'right' },
  'Amsterdam': { x: 380, y: 160, labelPosition: 'top' },

  // Germany (center)
  'Cologne': { x: 440, y: 260, labelPosition: 'bottom' },
  'Hamburg': { x: 520, y: 100, labelPosition: 'bottom' },
  'Berlin': { x: 700, y: 140, labelPosition: 'right' },
  'Frankfurt': { x: 540, y: 340, labelPosition: 'right' },
  'Friedrichshafen': { x: 600, y: 480, labelPosition: 'right' },

  // Scandinavia
  'Copenhagen': { x: 660, y: 60, labelPosition: 'bottom' },

  // Central Europe
  'Zurich': { x: 520, y: 480, labelPosition: 'left' },
  'Vienna': { x: 900, y: 300, labelPosition: 'left' },

  // Italy/Mediterranean
  'Milan': { x: 540, y: 560, labelPosition: 'right' },
  'Rome': { x: 740, y: 600, labelPosition: 'left' },
  'Marseille': { x: 320, y: 540, labelPosition: 'right' },
  'Barcelona': { x: 120, y: 600, labelPosition: 'right' }
};

/**
 * Age III: Atlantic Map (1200x800 viewBox)
 * 21 cities, 21 routes forming a fully connected global network
 * Positioned with minimal margins (~30px) to fill the map area
 */
export const AGE_III_CITIES: Record<string, CityPosition> = {
  // North America - West Coast
  'San Francisco': { x: 60, y: 220, labelPosition: 'right' },
  'Los Angeles': { x: 80, y: 300, labelPosition: 'right' },
  'Honolulu': { x: 40, y: 440, labelPosition: 'right' },

  // North America - Central/East
  'Chicago': { x: 180, y: 200, labelPosition: 'bottom' },
  'New York': { x: 300, y: 220, labelPosition: 'bottom' },
  'Lakehurst': { x: 320, y: 280, labelPosition: 'right' },
  'Miami': { x: 280, y: 400, labelPosition: 'right' },

  // Caribbean
  'Havana': { x: 320, y: 440, labelPosition: 'right' },

  // South America
  'Manaus': { x: 440, y: 520, labelPosition: 'right' },
  'Recife': { x: 560, y: 500, labelPosition: 'right' },
  'Rio de Janeiro': { x: 500, y: 600, labelPosition: 'right' },
  'Buenos Aires': { x: 440, y: 720, labelPosition: 'right' },
  'Valparaiso': { x: 360, y: 720, labelPosition: 'left' },

  // Europe
  'London': { x: 820, y: 180, labelPosition: 'left' },
  'Berlin': { x: 940, y: 160, labelPosition: 'left' },
  'Frankfurt': { x: 920, y: 240, labelPosition: 'left' },
  'Friedrichshafen': { x: 940, y: 320, labelPosition: 'left' },
  'Rome': { x: 980, y: 420, labelPosition: 'left' },
  'Oslo': { x: 900, y: 80, labelPosition: 'bottom' },
  'Svalbard': { x: 980, y: 50, labelPosition: 'bottom' },

  // Africa/Middle East
  'Cairo': { x: 1080, y: 560, labelPosition: 'left' }
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
