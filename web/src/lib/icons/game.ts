import type { IconDefinition, GameIconName } from './types';

export const gameIcons: Record<GameIconName, IconDefinition> = {
  ship: {
    // Classic zeppelin airship with gondola and fins
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="11" cy="10" rx="10" ry="5"/>
      <path d="M19 7l3-2v4l-3 2z"/>
      <path d="M19 11l3 2v-4l-3-2z"/>
      <rect x="7" y="14" width="8" height="3" rx="1"/>
      <path d="M9 14v-2"/>
      <path d="M13 14v-2"/>
      <circle cx="6" cy="10" r="1" fill="none" stroke="currentColor" stroke-width="0.5"/>
    </svg>`,
    category: 'game',
    tooltip: 'Airship'
  },

  route: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="5" cy="12" r="2" fill="currentColor"/>
      <circle cx="19" cy="12" r="2" fill="currentColor"/>
      <path d="M7 12h2" stroke-dasharray="2 2"/>
      <path d="M11 12h2" stroke-dasharray="2 2"/>
      <path d="M15 12h2" stroke-dasharray="2 2"/>
    </svg>`,
    category: 'game',
    tooltip: 'Flight Route'
  },

  technology: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M4.93 4.93l2.83 2.83"/>
      <path d="M16.24 16.24l2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
      <path d="M4.93 19.07l2.83-2.83"/>
      <path d="M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>`,
    category: 'game',
    tooltip: 'Technology - unlocks upgrades'
  },

  upgrade: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M12 8v8"/>
      <path d="M8 12h8"/>
    </svg>`,
    category: 'game',
    tooltip: 'Upgrade - improve your blueprint'
  },

  hazard: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    category: 'game',
    tooltip: 'Hazard - danger during flight'
  },

  insurance: {
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M12 8v4"/>
      <path d="M12 16h.01"/>
    </svg>`,
    category: 'game',
    tooltip: 'Insurance - protect ships from crashes'
  }
};
