import type { IconDefinition, FactionIconName } from './types';

export const factionIcons: Record<FactionIconName, IconDefinition> = {
  germany: {
    // German flag - black, red, gold horizontal stripes
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#000"/>
      <rect x="2" y="9.33" width="20" height="5.33" fill="#DD0000"/>
      <rect x="2" y="14.66" width="20" height="5.34" rx="0 0 2 2" fill="#FFCC00"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Germany - rigid airship pioneers'
  },

  britain: {
    // Union Jack - simplified
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#012169"/>
      <path d="M2 4l20 16M22 4l-20 16" stroke="#fff" stroke-width="3"/>
      <path d="M2 4l20 16M22 4l-20 16" stroke="#C8102E" stroke-width="1.5"/>
      <path d="M12 4v16M2 12h20" stroke="#fff" stroke-width="5"/>
      <path d="M12 4v16M2 12h20" stroke="#C8102E" stroke-width="3"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Britain - imperial route masters'
  },

  usa: {
    // American flag - simplified stars and stripes
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#BF0A30"/>
      <rect x="2" y="5.23" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="7.69" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="10.15" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="12.61" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="15.07" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="17.53" width="20" height="1.23" fill="#fff"/>
      <rect x="2" y="4" width="10" height="8.6" fill="#002868"/>
    </svg>`,
    category: 'faction',
    tooltip: 'USA - helium monopoly holders'
  },

  italy: {
    // Italian flag - green, white, red vertical stripes
    svg: `<svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="6.67" height="16" rx="2 0 0 2" fill="#009246"/>
      <rect x="8.67" y="4" width="6.66" height="16" fill="#fff"/>
      <rect x="15.33" y="4" width="6.67" height="16" rx="0 2 2 0" fill="#CE2B37"/>
    </svg>`,
    category: 'faction',
    tooltip: 'Italy - semi-rigid specialists'
  }
};
