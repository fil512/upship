import type { IconDefinition, SymbolIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import wrenchSvg from './svg/wrench.svg?raw';
import coinSvg from './svg/coin.svg?raw';
import propellerSvg from './svg/propeller.svg?raw';
import anySvg from './svg/any.svg?raw';

export const symbolIcons: Record<SymbolIconName, IconDefinition> = {
  wrench: {
    svg: wrenchSvg,
    category: 'symbol',
    tooltip: 'Technical - engineering actions'
  },

  coin: {
    svg: coinSvg,
    category: 'symbol',
    tooltip: 'Business - financial actions'
  },

  propeller: {
    svg: propellerSvg,
    category: 'symbol',
    tooltip: 'Operations - flight and research'
  },

  any: {
    svg: anySvg,
    category: 'symbol',
    tooltip: 'Any - works at any location'
  }
};
