import type { IconDefinition, FactionIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import germanySvg from './svg/germany.svg?raw';
import britainSvg from './svg/britain.svg?raw';
import usaSvg from './svg/usa.svg?raw';
import italySvg from './svg/italy.svg?raw';

export const factionIcons: Record<FactionIconName, IconDefinition> = {
  germany: {
    svg: germanySvg,
    category: 'faction',
    tooltip: 'Germany - rigid airship pioneers'
  },

  britain: {
    svg: britainSvg,
    category: 'faction',
    tooltip: 'Britain - imperial route masters'
  },

  usa: {
    svg: usaSvg,
    category: 'faction',
    tooltip: 'USA - helium monopoly holders'
  },

  italy: {
    svg: italySvg,
    category: 'faction',
    tooltip: 'Italy - semi-rigid specialists'
  }
};
