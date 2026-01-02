import type { IconDefinition, SymbolIconName } from './types';

export const symbolIcons: Record<SymbolIconName, IconDefinition> = {
  wrench: {
    // Solid blue wrench
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </svg>`,
    category: 'symbol',
    tooltip: 'Technical - engineering actions'
  },

  coin: {
    // Solid gold circle
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
    </svg>`,
    category: 'symbol',
    tooltip: 'Business - financial actions'
  },

  propeller: {
    // Solid white propeller (3-blade)
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M12 2c-1.5 0-2.5 1-2.5 2.5 0 2 1 4.5 2.5 5.5 1.5-1 2.5-3.5 2.5-5.5C14.5 3 13.5 2 12 2z"/>
      <path d="M5.5 16.5c-.75 1.3-.5 2.6.5 3.5 1.3 1.3 3.5 1 5-.5 1-1.5 1-4 0-5.5-1.5 1-4 1.5-5.5 2.5z"/>
      <path d="M18.5 16.5c.75 1.3.5 2.6-.5 3.5-1.3 1.3-3.5 1-5-.5-1-1.5-1-4 0-5.5 1.5 1 4 1.5 5.5 2.5z"/>
    </svg>`,
    category: 'symbol',
    tooltip: 'Operations - flight and research'
  },

  any: {
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,
    category: 'symbol',
    tooltip: 'Any - works at any location'
  }
};
