/**
 * Icon Registry
 *
 * Central export for all game icons.
 * Icons use 24x24 viewBox with currentColor for theming.
 */

import type { IconName, IconDefinition } from './types';
import { resourceIcons } from './resources';
import { symbolIcons } from './symbols';
import { factionIcons } from './factions';
import { statIcons } from './stats';
import { gameIcons } from './game';

export const icons: Record<IconName, IconDefinition> = {
  ...resourceIcons,
  ...symbolIcons,
  ...factionIcons,
  ...statIcons,
  ...gameIcons
};

/**
 * Get icon by name with fallback
 */
export function getIcon(name: string): IconDefinition | null {
  return icons[name as IconName] ?? null;
}

/**
 * Get tooltip text for an icon
 */
export function getIconTooltip(name: string): string {
  return icons[name as IconName]?.tooltip ?? name;
}

/**
 * Check if icon exists
 */
export function hasIcon(name: string): name is IconName {
  return name in icons;
}

// Re-export types
export * from './types';
