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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v14"/>
      <path d="M5 9l7-7 7 7"/>
      <path d="M5 19h14"/>
      <path d="M5 22h14"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Income - cash earned each turn'
  },

  officers: {
    // Naval captain's peaked cap
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17h18v2H3z"/>
      <path d="M4 15h16c0 0 0 2-8 2s-8-2-8-2z"/>
      <ellipse cx="12" cy="13" rx="8" ry="3"/>
      <path d="M6 13c0-2 2.5-4 6-4s6 2 6 4" fill="none" stroke="currentColor" stroke-width="0"/>
      <path d="M5 13c0-3 3-5 7-5s7 2 7 5H5z"/>
      <path d="M2 17l4-1v1H2z"/>
      <path d="M22 17l-4-1v1h4z"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M10 12h4" stroke="currentColor" stroke-width="0.5" fill="none"/>
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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="6" rx="2" width="16" height="14"/>
      <path d="M8 10v6"/>
      <path d="M8 13h4"/>
      <path d="M12 10v6"/>
      <path d="M15 16v-3.5a1.5 1.5 0 0 1 3 0V16"/>
    </svg>`,
    category: 'resource',
    tooltip: 'Hydrogen - cheap but flammable'
  },

  helium: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="6" rx="2" width="16" height="14"/>
      <path d="M8 10v6"/>
      <path d="M8 13h3"/>
      <path d="M8 10h3"/>
      <path d="M8 16h3"/>
      <path d="M14 16v-3.5a1.5 1.5 0 0 1 3 0V16"/>
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
