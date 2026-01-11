/**
 * Map configuration constants for SVG rendering
 */

export interface MapDimensions {
  width: number;
  height: number;
}

export const MAP_DIMENSIONS: Record<number, MapDimensions> = {
  1: { width: 1200, height: 680 },  // Age I: Western Europe (16:9 optimized)
  3: { width: 1420, height: 800 }   // Age III: Atlantic (16:9 optimized)
};

// City marker sizes
export const CITY_SIZES = {
  major: 14,
  minor: 10
} as const;

// Route styling
export const ROUTE_STYLE = {
  unclaimedWidth: 6,
  claimedWidth: 8,
  hitboxWidth: 28,  // Larger area for easy click detection
  curveOffset: 0.15  // How much routes curve (0 = straight, 0.3 = very curved)
} as const;

// Ship icon size
export const SHIP_SIZE = {
  width: 28,
  height: 12
} as const;

// Faction colors (matches CSS variables)
export const FACTION_COLORS: Record<string, string> = {
  germany: '#dc2626', // Red
  britain: '#003399', // Blue
  usa: '#ffffff', // White
  italy: '#009246' // Green
};

// Faction home bases
export const FACTION_HOME_BASES: Record<string, Record<number, string>> = {
  germany: { 1: 'Frankfurt', 3: 'Frankfurt' },
  britain: { 1: 'London', 3: 'London' },
  usa: { 1: 'Dover', 3: 'New York' },  // USA uses Dover in Age I (closest approximation)
  italy: { 1: 'Rome', 3: 'Rome' }
};

// Requirement icons (unicode symbols)
export const REQUIREMENT_ICONS = {
  range: '📏',
  speed: '⚡',
  ceiling: '☁️',
  luxury: '✨'
} as const;

// Map background colors
export const MAP_COLORS = {
  background: '#1a1a2e',
  water: '#0d1b2a',
  land: '#2d2d44',
  gridLine: 'rgba(255, 255, 255, 0.05)'
} as const;
