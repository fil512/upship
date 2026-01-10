import type { IconDefinition, GameIconName } from './types';

// Import SVG files as raw strings (Vite ?raw)
import shipSvg from './svg/ship.svg?raw';
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
import bombSvg from './svg/bomb.svg?raw';
import binocularsSvg from './svg/binoculars.svg?raw';
import supplyCrateSvg from './svg/supply_crate.svg?raw';
import patrolSvg from './svg/patrol.svg?raw';
import telescopeSvg from './svg/telescope.svg?raw';
import parachuteSvg from './svg/parachute.svg?raw';

export const gameIcons: Record<GameIconName, IconDefinition> = {
  ship: {
    svg: shipSvg,
    category: 'game',
    tooltip: 'Airship'
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
  },

  bomb: {
    svg: bombSvg,
    category: 'game',
    tooltip: 'Bombing Run - aerial bombardment mission'
  },

  binoculars: {
    svg: binocularsSvg,
    category: 'game',
    tooltip: 'Reconnaissance - observation mission'
  },

  supply_crate: {
    svg: supplyCrateSvg,
    category: 'game',
    tooltip: 'Resupply - transport supplies mission'
  },

  patrol: {
    svg: patrolSvg,
    category: 'game',
    tooltip: 'Patrol - area surveillance mission'
  },

  telescope: {
    svg: telescopeSvg,
    category: 'game',
    tooltip: 'Reconnaissance - observation mission'
  },

  parachute: {
    svg: parachuteSvg,
    category: 'game',
    tooltip: 'Resupply - airdrop supplies mission'
  }
};
