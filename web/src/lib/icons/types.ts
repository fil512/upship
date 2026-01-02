/**
 * Icon System Types
 *
 * All icons use 24x24 viewBox with currentColor for flexibility.
 */

export interface IconDefinition {
  /** SVG markup (viewBox should be 0 0 24 24) */
  svg: string;
  /** Icon category for organization */
  category: 'resource' | 'symbol' | 'faction' | 'stat' | 'game';
  /** Tooltip text shown on hover */
  tooltip: string;
}

export type ResourceIconName =
  | 'cash'
  | 'income'
  | 'officers'
  | 'engineers'
  | 'hydrogen'
  | 'helium'
  | 'vp'
  | 'research'
  | 'influence';

export type SymbolIconName =
  | 'wrench'
  | 'coin'
  | 'propeller'
  | 'any';

export type FactionIconName =
  | 'germany'
  | 'britain'
  | 'usa'
  | 'italy';

export type StatIconName =
  | 'speed'
  | 'range'
  | 'ceiling'
  | 'reliability'
  | 'luxury'
  | 'lift'
  | 'weight';

export type GameIconName =
  | 'ship'
  | 'route'
  | 'technology'
  | 'upgrade'
  | 'hazard'
  | 'insurance';

export type IconName =
  | ResourceIconName
  | SymbolIconName
  | FactionIconName
  | StatIconName
  | GameIconName;
