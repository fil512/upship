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
    // Captain face with peaked cap (like 🧑‍✈️ emoji)
    svg: `<svg viewBox="0 0 24 24">
      <circle cx="12" cy="15" r="7" fill="#f5deb3"/>
      <circle cx="9.5" cy="14" r="1" fill="#1a1a2e"/>
      <circle cx="14.5" cy="14" r="1" fill="#1a1a2e"/>
      <path d="M10 17.5q2 1.5 4 0" fill="none" stroke="#1a1a2e" stroke-width="0.8"/>
      <path d="M5 12h14v-2c0-1-2-3-7-3s-7 2-7 3v2z" fill="#1a1a2e"/>
      <path d="M5 10.5h14" stroke="#f1c40f" stroke-width="1.5"/>
      <ellipse cx="12" cy="8" rx="2" ry="1.5" fill="#f1c40f"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Officers - required for launches'
  },

  engineers: {
    // Man holding a wrench
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="10" cy="5" r="3"/>
      <path d="M6 22v-6c0-2 1-3 3-3h2c2 0 3 1 3 3v6H6z"/>
      <path d="M14 12l4-4c.5-.5 1.3-.5 1.8 0l.7.7c.5.5.5 1.3 0 1.8l-4 4"/>
      <path d="M16 14l2.5 2.5"/>
      <path d="M13 11l-1 1"/>
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
