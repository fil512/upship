import type { IconDefinition, FactionIconName } from './types';

export const factionIcons: Record<FactionIconName, IconDefinition> = {
  germany: {
    // Iron Cross simplified
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14 8H20L12 12L20 16H14L12 22L10 16H4L12 12L4 8H10L12 2Z"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Germany - rigid airship pioneers'
  },

  britain: {
    // Crown simplified
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 18h18v2H3z"/>
      <path d="M5 18V8l2 2V6l5 4 5-4v4l2-2v10"/>
      <circle cx="12" cy="5" r="1" fill="currentColor"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Britain - imperial route masters'
  },

  usa: {
    // Eagle simplified
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4c-2 0-4 1-5 3-1 2-1 4 0 6h10c1-2 1-4 0-6-1-2-3-3-5-3z"/>
      <path d="M8 13l-3 5h14l-3-5"/>
      <path d="M12 4v-2"/>
      <path d="M9 6l-2-2"/>
      <path d="M15 6l2-2"/>
      <path d="M12 18v2"/>
    </svg>`,
    category: 'faction',
    tooltip: 'USA - helium monopoly holders'
  },

  italy: {
    // Laurel wreath simplified
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 20c2-3 2-7 1-10 2 1 4 4 4 7"/>
      <path d="M19 20c-2-3-2-7-1-10-2 1-4 4-4 7"/>
      <path d="M5 20h14"/>
      <circle cx="12" cy="8" r="3"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Italy - semi-rigid specialists'
  }
};
