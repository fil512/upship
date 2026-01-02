// Faction colors for pawns and player identification
// Based on historical/traditional colors for these nations

export const FACTION_COLORS: Record<string, string> = {
	germany: '#1a1a1a', // Black (German Empire)
	britain: '#1e40af', // Royal Blue
	usa: '#dc2626', // Red
	italy: '#16a34a' // Green
};

export const FACTION_BORDER_COLORS: Record<string, string> = {
	germany: '#525252', // Lighter for contrast
	britain: '#3b82f6',
	usa: '#f87171',
	italy: '#4ade80'
};

export function getFactionColor(faction: string | undefined): string {
	if (!faction) return '#6b7280'; // Gray default
	return FACTION_COLORS[faction.toLowerCase()] || '#6b7280';
}

export function getFactionBorderColor(faction: string | undefined): string {
	if (!faction) return '#9ca3af';
	return FACTION_BORDER_COLORS[faction.toLowerCase()] || '#9ca3af';
}
