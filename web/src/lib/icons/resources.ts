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
    // Captain's hat - white crown, navy band with gold stripe, black visor
    svg: `<svg viewBox="0 0 24 24">
      <path d="M5 14c0-4 3-7 7-7s7 3 7 7H5z" fill="white"/>
      <rect x="4" y="14" width="16" height="4" fill="#2c3e50"/>
      <path d="M4 15.5h16" stroke="#f1c40f" stroke-width="1.5" fill="none"/>
      <path d="M4 18q8 3 16 0" fill="#1a1a2e"/>
      <path d="M12 10l-1.5-2h3l-1.5 2" fill="#2c3e50"/>
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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 3h6v7a3 3 0 0 1-3 3v0a3 3 0 0 1-3-3V3z"/>
      <path d="M7 3h10"/>
      <path d="M12 13v4"/>
      <path d="M8 21h8"/>
      <path d="M10 17h4"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Research - unlock technologies'
  },

  influence: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 6.1H3"/>
      <path d="M21 12H3"/>
      <path d="M15.1 18H3"/>
      <circle cx="19" cy="6" r="2" fill="currentColor"/>
      <circle cx="19" cy="18" r="2" fill="currentColor"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Influence - buy market cards'
  }
};
