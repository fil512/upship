/**
 * Utility to get tech tiles provided by a tech card
 */

import { TECH_TILES, TECH_CARDS, SLOT_TYPE_LABELS, type TechTile, type TechCard } from '$lib/data/techTiles';

/**
 * Get all tech tiles that require a specific tech card
 * @param techCardId The tech card ID to look up
 * @returns Array of tech tiles provided by this card
 */
export function getTilesForCard(techCardId: string): TechTile[] {
  const tiles: TechTile[] = [];

  for (const tile of Object.values(TECH_TILES)) {
    if (tile.requiredCard === techCardId) {
      tiles.push(tile);
    }
  }

  return tiles;
}

/**
 * Get tech card info by ID
 * @param techCardId The tech card ID
 * @returns The tech card or undefined if not found
 */
export function getTechCard(techCardId: string): TechCard | undefined {
  return TECH_CARDS[techCardId];
}

/**
 * Format stats for display
 * @param stats Object of stat bonuses
 * @returns Formatted string like "+2 Reliability, +1 Ceiling"
 */
export function formatStats(stats: Record<string, number>): string {
  const parts: string[] = [];

  const statLabels: Record<string, string> = {
    speed: 'Speed',
    range: 'Range',
    ceiling: 'Ceiling',
    reliability: 'Reliability',
    luxury: 'Luxury',
    income: 'Income',
    lift: 'Lift',
    armor: 'Armor'
  };

  for (const [stat, value] of Object.entries(stats)) {
    if (value !== 0) {
      const label = statLabels[stat] || stat;
      const sign = value > 0 ? '+' : '';
      parts.push(`${sign}${value} ${label}`);
    }
  }

  return parts.join(', ');
}

/**
 * Get slot type label for display
 * @param slotType The slot type key
 * @returns Human-readable label
 */
export function getSlotTypeLabel(slotType: string): string {
  return SLOT_TYPE_LABELS[slotType] || slotType;
}

export interface AvailableTilesBySlot {
  frameSlots: TechTile[];
  fabricSlots: TechTile[];
  driveSlots: TechTile[];
  componentSlots: TechTile[];
}

/**
 * Get all tech tiles available to a player based on their owned tech cards and current age.
 * Tiles are grouped by slot type for easy rendering.
 * @param techCards Array of tech card IDs the player owns
 * @param currentAge Current game age (1, 2, or 3)
 * @returns Object with tiles grouped by slot type
 */
export function getAvailableTilesForPlayer(techCards: string[], currentAge: number): AvailableTilesBySlot {
  const result: AvailableTilesBySlot = {
    frameSlots: [],
    fabricSlots: [],
    driveSlots: [],
    componentSlots: []
  };

  for (const tile of Object.values(TECH_TILES)) {
    // Check if player owns the required card and tile is available in current age
    if (techCards.includes(tile.requiredCard) && tile.age <= currentAge) {
      // Add to appropriate slot type array
      if (tile.slotType in result) {
        result[tile.slotType as keyof AvailableTilesBySlot].push(tile);
      }
    }
  }

  return result;
}
