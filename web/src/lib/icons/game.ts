import type { IconDefinition, GameIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import shipSvg from './svg/ship.svg?raw';
import shipDamagedSvg from './svg/ship-damaged.svg?raw';
import launchSvg from './svg/launch.svg?raw';
import routeSvg from './svg/route.svg?raw';
import technologySvg from './svg/technology.svg?raw';
import upgradeSvg from './svg/upgrade.svg?raw';
import hazardSvg from './svg/hazard.svg?raw';
import insuranceSvg from './svg/insurance.svg?raw';
import blueprintSvg from './svg/blueprint.svg?raw';
import eyeSvg from './svg/eye.svg?raw';
import politicsSvg from './svg/politics.svg?raw';
import gasSvg from './svg/gas.svg?raw';
import arrowUpSvg from './svg/arrow_up.svg?raw';

export const gameIcons: Record<GameIconName, IconDefinition> = {
  ship: {
    svg: shipSvg,
    category: 'game',
    tooltip: 'Airship'
  },

  'ship-damaged': {
    svg: shipDamagedSvg,
    category: 'game',
    tooltip: 'Damaged Airship - needs repair'
  },

  launch: {
    svg: launchSvg,
    category: 'game',
    tooltip: 'Launch - send ships on routes'
  },

  route: {
    svg: routeSvg,
    category: 'game',
    tooltip: 'Flight Route'
  },

  technology: {
    svg: technologySvg,
    category: 'game',
    tooltip: 'Technology - unlocks upgrades'
  },

  upgrade: {
    svg: upgradeSvg,
    category: 'game',
    tooltip: 'Upgrade - improve your blueprint'
  },

  hazard: {
    svg: hazardSvg,
    category: 'game',
    tooltip: 'Hazard - danger during flight'
  },

  insurance: {
    svg: insuranceSvg,
    category: 'game',
    tooltip: 'Insurance - protect ships from crashes'
  },

  blueprint: {
    svg: blueprintSvg,
    category: 'game',
    tooltip: 'Blueprint - modify your design'
  },

  eye: {
    svg: eyeSvg,
    category: 'game',
    tooltip: 'Peek - view hidden information'
  },

  politics: {
    svg: politicsSvg,
    category: 'game',
    tooltip: 'Politics - government influence'
  },

  gas: {
    svg: gasSvg,
    category: 'game',
    tooltip: 'Gas - lifting gas for airships'
  },

  arrow_up: {
    svg: arrowUpSvg,
    category: 'game',
    tooltip: 'Increase - raise income or level'
  }
};
