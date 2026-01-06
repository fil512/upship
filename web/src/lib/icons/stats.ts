import type { IconDefinition, StatIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import speedSvg from './svg/speed.svg?raw';
import rangeSvg from './svg/range.svg?raw';
import ceilingSvg from './svg/ceiling.svg?raw';
import reliabilitySvg from './svg/reliability.svg?raw';
import luxurySvg from './svg/luxury.svg?raw';
import liftSvg from './svg/lift.svg?raw';
import weightSvg from './svg/weight.svg?raw';
import gasSocketSvg from './svg/gas_socket.svg?raw';

export const statIcons: Record<StatIconName, IconDefinition> = {
  speed: {
    svg: speedSvg,
    category: 'stat',
    tooltip: 'Speed - how fast the ship travels'
  },

  range: {
    svg: rangeSvg,
    category: 'stat',
    tooltip: 'Range - how far the ship can fly'
  },

  ceiling: {
    svg: ceilingSvg,
    category: 'stat',
    tooltip: 'Ceiling - maximum altitude'
  },

  reliability: {
    svg: reliabilitySvg,
    category: 'stat',
    tooltip: 'Reliability - resist hazards'
  },

  luxury: {
    svg: luxurySvg,
    category: 'stat',
    tooltip: 'Luxury - passenger comfort'
  },

  lift: {
    svg: liftSvg,
    category: 'stat',
    tooltip: 'Lift - carrying capacity from gas'
  },

  weight: {
    svg: weightSvg,
    category: 'stat',
    tooltip: 'Weight - reduces lift capacity'
  },

  gas_socket: {
    svg: gasSocketSvg,
    category: 'stat',
    tooltip: 'Gas Socket - provides +5 lift when gas loaded'
  }
};
