import type { IconDefinition, StatIconName } from './types';

export const statIcons: Record<StatIconName, IconDefinition> = {
  speed: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 12m-9 0a9 9 0 1 0 18 0 9 9 0 1 0-18 0"/>
      <path d="M12 12l4-4"/>
      <path d="M12 7v1"/>
      <path d="M17 12h-1"/>
      <path d="M7 12h1"/>
      <path d="M12 17v-1"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Speed - how fast the ship travels'
  },

  range: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/>
      <path d="M15 6l6 6-6 6"/>
      <circle cx="5" cy="12" r="2" fill="currentColor"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Range - how far the ship can fly'
  },

  ceiling: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
      <path d="M4 4h16"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Ceiling - maximum altitude'
  },

  reliability: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Reliability - resist hazards'
  },

  luxury: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Luxury - passenger comfort'
  },

  lift: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
      <ellipse cx="12" cy="18" rx="6" ry="3"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Lift - carrying capacity from gas'
  },

  weight: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 5v14"/>
      <path d="M19 12l-7 7-7-7"/>
      <circle cx="12" cy="5" r="2"/>
    </svg>`,
    category: 'stat',
    tooltip: 'Weight - reduces lift capacity'
  }
};
