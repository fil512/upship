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

  launch: {
    // Airship facing right (tail on left) with motion lines bottom-left diagonal
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="14" cy="8" rx="8" ry="4"/>
      <path d="M8 5l-3-1v2.5l3 1z"/>
      <path d="M8 9l-3 1v-2.5l3-1z"/>
      <rect x="10" y="11" width="6" height="2.5" rx="0.5"/>
      <path d="M12 11v-1.5"/>
      <path d="M14 11v-1.5"/>
      <path d="M2 18l5-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M4 21l4-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M7 22l3-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,
    category: 'game',
    tooltip: 'Launch - send ships on routes'
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
    // Document/policy icon
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="14" y2="17"/>
    </svg>`,
    category: 'game',
    tooltip: 'Insurance - protect ships from crashes'
  },

  blueprint: {
    // Technical drawing/schematic
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 3v18"/>
      <circle cx="16" cy="16" r="3"/>
    </svg>`,
    category: 'game',
    tooltip: 'Blueprint - modify your design'
  },

  eye: {
    // Eye for peeking/viewing
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
    category: 'game',
    tooltip: 'Peek - view hidden information'
  },

  politics: {
    // Handshake or building columns
    svg: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21h4V10H3v11zM17 21h4V10h-4v11zM10 21h4V3h-4v18z"/>
    </svg>`,
    category: 'game',
    tooltip: 'Politics - government influence'
  },

  gas: {
    // Gas canister/tank
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="4" width="12" height="16" rx="2"/>
      <path d="M10 4V2h4v2"/>
      <path d="M6 10h12"/>
      <path d="M6 14h12"/>
    </svg>`,
    category: 'game',
    tooltip: 'Gas - lifting gas for airships'
  }
};
