import type { IconDefinition, ResourceIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import cashSvg from './svg/cash.svg?raw';
import incomeSvg from './svg/income.svg?raw';
import officersSvg from './svg/officers.svg?raw';
import engineersSvg from './svg/engineers.svg?raw';
import hydrogenSvg from './svg/hydrogen.svg?raw';
import heliumSvg from './svg/helium.svg?raw';
import vpSvg from './svg/vp.svg?raw';
import researchSvg from './svg/research.svg?raw';
import influenceSvg from './svg/influence.svg?raw';

export const resourceIcons: Record<ResourceIconName, IconDefinition> = {
  cash: {
    svg: cashSvg,
    category: 'resource',
    tooltip: 'Cash - spend on upgrades, gas, and crew'
  },

  income: {
    svg: incomeSvg,
    category: 'resource',
    tooltip: 'Income - cash earned each turn'
  },

  officers: {
    svg: officersSvg,
    category: 'resource',
    tooltip: 'Officers - required for launches'
  },

  engineers: {
    svg: engineersSvg,
    category: 'resource',
    tooltip: 'Engineers - aid research and handle hazards'
  },

  hydrogen: {
    svg: hydrogenSvg,
    category: 'resource',
    tooltip: 'Hydrogen - cheap but flammable'
  },

  helium: {
    svg: heliumSvg,
    category: 'resource',
    tooltip: 'Helium - safe but expensive'
  },

  vp: {
    svg: vpSvg,
    category: 'resource',
    tooltip: 'Victory Points - win condition'
  },

  research: {
    svg: researchSvg,
    category: 'resource',
    tooltip: 'Research - unlock technologies'
  },

  influence: {
    svg: influenceSvg,
    category: 'resource',
    tooltip: 'Influence - buy market cards'
  }
};
