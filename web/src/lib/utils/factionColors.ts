// Faction colors for pawns and player identification
// Based on historical/traditional colors for these nations

export const FACTION_COLORS: Record<string, string> = {
	germany: '#dc2626', // Red
	britain: '#1e40af', // Royal Blue
	usa: '#ffffff', // White
	italy: '#16a34a' // Green
};

export const FACTION_BORDER_COLORS: Record<string, string> = {
	germany: '#f87171', // Lighter red for contrast
	britain: '#3b82f6',
	usa: '#e5e5e5', // Light gray for contrast
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
