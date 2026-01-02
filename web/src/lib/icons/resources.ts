import type { IconDefinition, ResourceIconName } from './types';

export const resourceIcons: Record<ResourceIconName, IconDefinition> = {
  cash: {
    // Grey circle with dark £ symbol (Dune Imperium style)
    svg: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#888888"/>
      <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1a2e">£</text>
    </svg>`,
    category: 'resource',
    tooltip: 'Cash - spend on upgrades, gas, and crew'
  },

  income: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Income - cash earned each turn'
  },

  officers: {
    // Captain silhouette with peaked cap, uniform, epaulettes, tie
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <!-- Peaked cap top -->
      <ellipse cx="12" cy="3.5" rx="5" ry="1.5"/>
      <!-- Cap brim -->
      <rect x="5" y="4.5" width="14" height="1.5" rx="0.5"/>
      <!-- Cap band with gold stripe -->
      <rect x="6" y="5.5" width="12" height="0.8" fill="none" stroke="#f1c40f" stroke-width="0.5"/>
      <!-- Head -->
      <ellipse cx="12" cy="9" rx="4" ry="3.5"/>
      <!-- Ears -->
      <ellipse cx="7.5" cy="9" rx="0.8" ry="1"/>
      <ellipse cx="16.5" cy="9" rx="0.8" ry="1"/>
      <!-- Neck -->
      <rect x="10" y="12" width="4" height="2"/>
      <!-- Shoulders and torso -->
      <path d="M3 24 L3 19 Q3 16 6 15 L8 14 L10 14 L10 16 L14 16 L14 14 L16 14 L18 15 Q21 16 21 19 L21 24 Z"/>
      <!-- Epaulettes -->
      <rect x="3" y="16" width="4" height="1.5" rx="0.3"/>
      <rect x="17" y="16" width="4" height="1.5" rx="0.3"/>
      <!-- Epaulette stripes -->
      <path d="M4 17.8h2M5 18.3h2" stroke="#f1c40f" stroke-width="0.4"/>
      <path d="M18 17.8h2M19 18.3h2" stroke="#f1c40f" stroke-width="0.4"/>
      <!-- Collar/Lapels -->
      <path d="M10 14 L9 17 L12 20 L15 17 L14 14" fill="none" stroke="#333" stroke-width="0.5"/>
      <!-- Tie -->
      <path d="M12 16 L11 18 L12 23 L13 18 Z" fill="#1a1a2e"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Officers - required for launches'
  },

  engineers: {
    // Hard hat / construction helmet
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <!-- Main dome -->
      <path d="M4 14 Q4 6 12 6 Q20 6 20 14 L4 14 Z"/>
      <!-- Brim -->
      <rect x="2" y="14" width="20" height="3" rx="1"/>
      <!-- Top ridge -->
      <rect x="10" y="4" width="4" height="3" rx="1"/>
      <!-- Helmet band/stripe -->
      <rect x="4" y="11" width="16" height="1.5" fill="none" stroke="#f1c40f" stroke-width="1"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Engineers - aid research and repairs'
  },

  hydrogen: {
    // H in yellow square
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="2" fill="#f1c40f"/>
      <text x="12" y="17" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1a2e">H</text>
    </svg>`,
    category: 'resource',
    tooltip: 'Hydrogen - cheap but flammable'
  },

  helium: {
    // He in white square
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="2" fill="white" stroke="#666" stroke-width="1"/>
      <text x="12" y="17" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a1a2e">He</text>
    </svg>`,
    category: 'resource',
    tooltip: 'Helium - safe but expensive'
  },

  vp: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Victory Points - win condition'
  },

  research: {
    // Magnifying glass
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Research - unlock technologies'
  },

  influence: {
    // Grey diamond
    svg: `<svg viewBox="0 0 24 24">
      <polygon points="12 2 22 12 12 22 2 12" fill="#888888"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Influence - buy market cards'
  }
};
