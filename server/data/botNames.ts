/**
 * Bot Names
 * Thematic display names for AI opponents, organized by faction
 */

import type { Faction } from '@upship/api';

export const BOT_NAMES: Record<Faction, string[]> = {
  germany: [
    'Graf von Zeppelin',
    'Captain Von Berg',
    'Herr Eckener',
    'Baron Luftschloss'
  ],
  britain: [
    'Lord Ashby',
    'Sir Reginald Cloudsworth',
    'Admiral Neville',
    'The Duke of Aeronshire'
  ],
  usa: [
    'Captain Skyward',
    'Colonel Morrison',
    'Admiral Goodyear',
    'Senator Helium'
  ],
  italy: [
    'Conte Nobile',
    'Il Capitano Roma',
    'Signore Dirigibile',
    'Don Aeronautico'
  ]
};

/**
 * Get a random bot name for a faction, avoiding already-used names
 */
export function getRandomBotName(faction: Faction, usedNames: string[] = []): string {
  const available = BOT_NAMES[faction].filter(name => !usedNames.includes(name));

  if (available.length === 0) {
    // Fallback if all names used (shouldn't happen with max 4 players)
    return `Bot ${faction.charAt(0).toUpperCase()}${faction.slice(1)} ${Math.floor(Math.random() * 100)}`;
  }

  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get the first available bot name for a faction (deterministic)
 */
export function getFirstAvailableBotName(faction: Faction, usedNames: string[] = []): string {
  const available = BOT_NAMES[faction].filter(name => !usedNames.includes(name));

  if (available.length === 0) {
    return `Bot ${faction.charAt(0).toUpperCase()}${faction.slice(1)}`;
  }

  return available[0];
}
