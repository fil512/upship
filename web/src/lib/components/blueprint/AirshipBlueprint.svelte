<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Blueprint } from '$lib/types/game';
	import { icons, type IconName } from '$lib/icons';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { TECH_TILES } from '$lib/data/techTiles';
	import { calculateHullCost } from '$lib/utils/shipStats';

	export let blueprint: Blueprint;
	export let age: number = 1;
	export let editMode: boolean = false;
	export let selectedTileId: string | null = null;

	const dispatch = createEventDispatcher<{
		slotClick: { slotType: string; index: number; upgrade: string | null };
		placeTile: { slotType: string; index: number; tileId: string };
		removeTile: { slotType: string; index: number; tileId: string };
	}>();

	// Determine which slot type the selected tile can go into
	$: selectedTileSlotType = selectedTileId ? TECH_TILES[selectedTileId]?.slotType : null;

	// Calculate hull cost for display
	$: hullCost = calculateHullCost(blueprint);

	function handleSlotClick(slotType: string, index: number, upgrade: string | null) {
		if (editMode) {
			// In edit mode - check if we're placing or removing
			if (upgrade) {
				// Slot has a tile - remove it
				dispatch('removeTile', { slotType, index, tileId: upgrade });
				return;
			}
			if (selectedTileId && selectedTileSlotType) {
				// Empty slot with a tile selected - try to place it
				const slotKey = `${slotType}Slots`;
				if (slotKey === selectedTileSlotType) {
					dispatch('placeTile', { slotType, index, tileId: selectedTileId });
				}
				return;
			}
		}
		dispatch('slotClick', { slotType, index, upgrade });
	}

	// Check if a slot is a valid target for the selected tile
	function isValidTarget(slotType: string): boolean {
		if (!editMode || !selectedTileId || !selectedTileSlotType) return false;
		return `${slotType}Slots` === selectedTileSlotType;
	}

	/**
	 * Extract inner content from SVG string for embedding in parent SVG.
	 * Strips the outer <svg> tag but preserves all inner elements.
	 */
	function getIconSvgContent(iconType: string): string {
		const iconDef = icons[iconType as IconName];
		if (!iconDef) return '';
		// Extract content between <svg...> and </svg>
		const match = iconDef.svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
		return match ? match[1] : '';
	}

	// Get upgrade info from the canonical TECH_TILES data
	function getUpgradeInfo(upgradeId: string | null): { name: string; weight: number; stats: Record<string, number>; hullCost: number } | null {
		if (!upgradeId) return null;

		// Look up in TECH_TILES
		const tile = TECH_TILES[upgradeId];
		if (tile) {
			return {
				name: tile.name,
				weight: tile.weight,
				stats: tile.stats as Record<string, number>,
				hullCost: tile.hullCost || 1
			};
		}

		// Fallback for unknown tiles
		return { name: upgradeId.replace(/_/g, ' '), weight: 0, stats: {}, hullCost: 1 };
	}

	// Split long names into lines for SVG text wrapping
	// Max ~12 chars per line at font-size 9px in a 100px wide slot
	function splitName(name: string): string[] {
		if (name.length <= 14) return [name];

		// Try to split at a space near the middle
		const words = name.split(' ');
		if (words.length === 1) {
			// No spaces - just truncate
			return [name.slice(0, 12) + '...'];
		}

		// Find best split point
		let line1 = '';
		let line2 = '';
		for (const word of words) {
			if (line1.length === 0 || line1.length + word.length + 1 <= 12) {
				line1 = line1 ? line1 + ' ' + word : word;
			} else {
				line2 = line2 ? line2 + ' ' + word : word;
			}
		}

		// Truncate line2 if still too long
		if (line2.length > 14) {
			line2 = line2.slice(0, 11) + '...';
		}

		return line2 ? [line1, line2] : [line1];
	}

	// Slot positions on the airship (viewBox is 800x300)
	const slotWidth = 100;
	const slotHeight = 62; // Increased from 54 to accommodate 2-line names
	const slotPositions = {
		// Frame: along the central keel/spine (3 slots)
		frame: [
			{ x: 120, y: 123 },
			{ x: 240, y: 123 },
			{ x: 360, y: 123 }
		],
		// Fabric: along the top of the envelope (3 slots)
		fabric: [
			{ x: 160, y: 45 },
			{ x: 280, y: 30 },
			{ x: 400, y: 45 }
		],
		// Drive: at the rear near propellers (2 slots)
		drive: [
			{ x: 600, y: 85 },
			{ x: 600, y: 160 }
		],
		// Component: in the gondola area (3 slots)
		component: [
			{ x: 160, y: 205 },
			{ x: 280, y: 205 },
			{ x: 400, y: 205 }
		]
	};

	const slotColors: Record<string, { border: string; bg: string; text: string }> = {
		frame: { border: '#1d4ed8', bg: '#bfdbfe', text: '#1d4ed8' },
		fabric: { border: '#7c3aed', bg: '#ddd6fe', text: '#7c3aed' },
		drive: { border: '#d97706', bg: '#fde68a', text: '#d97706' },
		component: { border: '#059669', bg: '#a7f3d0', text: '#059669' }
	};

	// Get list of stats to display as icons with positioning info
	interface IconInfo {
		type: string;
		x: number;
		y: number;
	}

	// Max icons per tile is ~8 (e.g., redundant_cells: 4 lift + 2 reliability + 2 weight)
	// Slot is 100x54, with name taking ~12px at bottom, we have ~35px height for icons
	// Use a grid layout: up to 4 icons per row, 2 rows max
	const MAX_ICONS_PER_ROW = 5;
	const ICON_SIZE = 14; // Smaller icons to fit
	const ICON_SPACING = 16; // Tighter spacing

	function getIconsWithPositions(stats: Record<string, number>, weight: number): IconInfo[] {
		const icons: IconInfo[] = [];
		const order = ['gas_socket', 'lift', 'reliability', 'ceiling', 'range', 'speed', 'income', 'luxury'];

		// Collect all stat icons
		for (const stat of order) {
			const count = stats[stat] || 0;
			for (let i = 0; i < count; i++) {
				icons.push({ type: stat, x: 0, y: 0 });
			}
		}

		// Add weight icons
		for (let i = 0; i < weight; i++) {
			icons.push({ type: 'weight', x: 0, y: 0 });
		}

		const totalIcons = icons.length;

		if (totalIcons <= MAX_ICONS_PER_ROW) {
			// Single row - center horizontally
			const totalWidth = (totalIcons - 1) * ICON_SPACING;
			const startX = -totalWidth / 2;
			for (let i = 0; i < icons.length; i++) {
				icons[i].x = startX + i * ICON_SPACING;
				icons[i].y = 0;
			}
		} else {
			// Two rows
			const topRowCount = Math.ceil(totalIcons / 2);
			const bottomRowCount = totalIcons - topRowCount;

			// Top row
			const topWidth = (topRowCount - 1) * ICON_SPACING;
			const topStartX = -topWidth / 2;
			for (let i = 0; i < topRowCount; i++) {
				icons[i].x = topStartX + i * ICON_SPACING;
				icons[i].y = -8;
			}

			// Bottom row
			const bottomWidth = (bottomRowCount - 1) * ICON_SPACING;
			const bottomStartX = -bottomWidth / 2;
			for (let i = topRowCount; i < totalIcons; i++) {
				icons[i].x = bottomStartX + (i - topRowCount) * ICON_SPACING;
				icons[i].y = 8;
			}
		}

		return icons;
	}
</script>

<div class="airship-blueprint">
	<div class="header">
		<div class="header-left">
			<span class="title">BLUEPRINT</span>
			<span class="age-badge">Age {age}</span>
		</div>
		<div class="hull-cost">
			<span class="cost-label">Build Cost:</span>
			<span class="cost-value">£{hullCost}</span>
		</div>
	</div>

	<svg viewBox="0 0 800 300" class="airship-svg">
		<!-- Background gradient -->
		<defs>
			<linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
				<stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
			</linearGradient>
		</defs>
		<rect width="100%" height="100%" fill="url(#skyGradient)" rx="8" />

		<!-- Age-specific background image -->
		<image
			href="/age{age}_blueprint.png"
			width="100%"
			height="100%"
			preserveAspectRatio="xMidYMid slice"
			opacity="0.5"
			style="pointer-events: none; filter: brightness(1.3) saturate(0.8);"
		/>

		<!-- Airship envelope (main body) - larger ellipse -->
		<ellipse
			cx="340"
			cy="120"
			rx="300"
			ry="95"
			fill="none"
			stroke="#cbd5e1"
			stroke-width="3"
			class="envelope"
		/>

		<!-- Internal frame lines (structural) -->
		<line x1="60" y1="120" x2="620" y2="120" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="8 4" />
		<line x1="180" y1="35" x2="180" y2="205" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 3" />
		<line x1="340" y1="28" x2="340" y2="212" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 3" />
		<line x1="500" y1="35" x2="500" y2="205" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6 3" />

		<!-- Gondola (passenger/cargo cabin) - larger -->
		<path
			d="M 140 200 Q 140 265 200 265 L 420 265 Q 480 265 480 200"
			fill="none"
			stroke="#cbd5e1"
			stroke-width="3"
			class="gondola"
		/>

		<!-- Gondola windows -->
		<ellipse cx="220" cy="240" rx="15" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.5" />
		<ellipse cx="280" cy="240" rx="15" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.5" />
		<ellipse cx="340" cy="240" rx="15" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.5" />
		<ellipse cx="400" cy="240" rx="15" ry="10" fill="none" stroke="#94a3b8" stroke-width="1.5" />

		<!-- Tail fins - larger -->
		<path
			d="M 580 120 L 720 50 L 720 90 L 620 120"
			fill="none"
			stroke="#cbd5e1"
			stroke-width="3"
			class="tail-fin-top"
		/>
		<path
			d="M 580 120 L 720 190 L 720 150 L 620 120"
			fill="none"
			stroke="#cbd5e1"
			stroke-width="3"
			class="tail-fin-bottom"
		/>

		<!-- Vertical stabilizer -->
		<path
			d="M 600 120 L 700 120"
			stroke="#cbd5e1"
			stroke-width="2"
		/>

		<!-- Propellers at rear - larger -->
		<g class="propeller-group" transform="translate(735, 70)">
			<circle r="25" fill="none" stroke="#cbd5e1" stroke-width="2" />
			<line x1="-20" y1="0" x2="20" y2="0" stroke="#cbd5e1" stroke-width="3" class="prop-blade" />
			<line x1="0" y1="-20" x2="0" y2="20" stroke="#cbd5e1" stroke-width="3" class="prop-blade" />
		</g>
		<g class="propeller-group" transform="translate(735, 170)">
			<circle r="25" fill="none" stroke="#cbd5e1" stroke-width="2" />
			<line x1="-20" y1="0" x2="20" y2="0" stroke="#cbd5e1" stroke-width="3" class="prop-blade" />
			<line x1="0" y1="-20" x2="0" y2="20" stroke="#cbd5e1" stroke-width="3" class="prop-blade" />
		</g>

		<!-- Nose cone -->
		<ellipse cx="50" cy="120" rx="15" ry="40" fill="none" stroke="#cbd5e1" stroke-width="2" />

		<!-- Section Labels -->
		<text x="340" y="18" text-anchor="middle" font-size="10" fill="#64748b" font-weight="500">ENVELOPE</text>
		<text x="340" y="290" text-anchor="middle" font-size="10" fill="#64748b" font-weight="500">GONDOLA</text>
		<text x="700" y="120" text-anchor="middle" font-size="10" fill="#64748b" font-weight="500">DRIVE</text>

		<!-- FABRIC SLOTS (top of envelope) -->
		{#each blueprint.fabricSlots as upgrade, index}
			{#if slotPositions.fabric[index]}
				{@const info = getUpgradeInfo(upgrade)}
				{@const pos = slotPositions.fabric[index]}
				{@const iconPositions = info ? getIconsWithPositions(info.stats, info.weight) : []}
				<g
					class="slot-group"
					transform="translate({pos.x}, {pos.y})"
					role="button"
					tabindex="0"
					on:click={() => handleSlotClick('fabric', index, upgrade)}
					on:keydown={(e) => e.key === 'Enter' && handleSlotClick('fabric', index, upgrade)}
				>
					<rect
						width={slotWidth}
						height={slotHeight}
						rx="6"
						class="slot"
						class:filled={upgrade !== null}
						class:valid-target={isValidTarget('fabric')}
						style="--slot-border: {slotColors.fabric.border}; --slot-bg: {slotColors.fabric.bg}; --slot-text: {slotColors.fabric.text}"
					/>
					{#if info}
						<!-- Cost badge (top right) -->
						<g transform="translate({slotWidth - 12}, 11)">
							<circle r="8" class="cost-badge" />
							<text x="0" y="3" text-anchor="middle" class="cost-text">{info.hullCost}</text>
						</g>
						<!-- Icons row - compact to fit within tile -->
						<g transform="translate({slotWidth/2}, 22)">
							{#each iconPositions as icon}
								<g transform="translate({icon.x}, {icon.y})">
									<svg x={-ICON_SIZE/2} y={-ICON_SIZE/2} width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
										{@html getIconSvgContent(icon.type)}
									</svg>
								</g>
							{/each}
						</g>
						<!-- Name below icons (with text wrapping) -->
						{@const nameLines = splitName(info.name)}
						<text x={slotWidth/2} y={nameLines.length > 1 ? 42 : 48} text-anchor="middle" class="slot-name" style="--slot-text: {slotColors.fabric.text}">
							{#each nameLines as line, i}
								<tspan x={slotWidth/2} dy={i === 0 ? 0 : 10}>{line}</tspan>
							{/each}
						</text>
					{:else}
						<text x={slotWidth/2} y="32" text-anchor="middle" class="slot-empty">+ FABRIC</text>
					{/if}
				</g>
			{/if}
		{/each}

		<!-- FRAME SLOTS (along the keel) -->
		{#each blueprint.frameSlots as upgrade, index}
			{#if slotPositions.frame[index]}
				{@const info = getUpgradeInfo(upgrade)}
				{@const pos = slotPositions.frame[index]}
				{@const iconPositions = info ? getIconsWithPositions(info.stats, info.weight) : []}
				<g
					class="slot-group"
					transform="translate({pos.x}, {pos.y})"
					role="button"
					tabindex="0"
					on:click={() => handleSlotClick('frame', index, upgrade)}
					on:keydown={(e) => e.key === 'Enter' && handleSlotClick('frame', index, upgrade)}
				>
					<rect
						width={slotWidth}
						height={slotHeight}
						rx="6"
						class="slot"
						class:filled={upgrade !== null}
						class:valid-target={isValidTarget('frame')}
						style="--slot-border: {slotColors.frame.border}; --slot-bg: {slotColors.frame.bg}; --slot-text: {slotColors.frame.text}"
					/>
					{#if info}
						<!-- Cost badge (top right) -->
						<g transform="translate({slotWidth - 12}, 11)">
							<circle r="8" class="cost-badge" />
							<text x="0" y="3" text-anchor="middle" class="cost-text">{info.hullCost}</text>
						</g>
						<!-- Icons row - compact to fit within tile -->
						<g transform="translate({slotWidth/2}, 22)">
							{#each iconPositions as icon}
								<g transform="translate({icon.x}, {icon.y})">
									<svg x={-ICON_SIZE/2} y={-ICON_SIZE/2} width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
										{@html getIconSvgContent(icon.type)}
									</svg>
								</g>
							{/each}
						</g>
						<!-- Name below icons (with text wrapping) -->
						{@const nameLines = splitName(info.name)}
						<text x={slotWidth/2} y={nameLines.length > 1 ? 42 : 48} text-anchor="middle" class="slot-name" style="--slot-text: {slotColors.frame.text}">
							{#each nameLines as line, i}
								<tspan x={slotWidth/2} dy={i === 0 ? 0 : 10}>{line}</tspan>
							{/each}
						</text>
					{:else}
						<text x={slotWidth/2} y="32" text-anchor="middle" class="slot-empty">+ FRAME</text>
					{/if}
				</g>
			{/if}
		{/each}

		<!-- DRIVE SLOTS (at the rear) -->
		{#each blueprint.driveSlots as upgrade, index}
			{#if slotPositions.drive[index]}
				{@const info = getUpgradeInfo(upgrade)}
				{@const pos = slotPositions.drive[index]}
				{@const iconPositions = info ? getIconsWithPositions(info.stats, info.weight) : []}
				<g
					class="slot-group"
					transform="translate({pos.x}, {pos.y})"
					role="button"
					tabindex="0"
					on:click={() => handleSlotClick('drive', index, upgrade)}
					on:keydown={(e) => e.key === 'Enter' && handleSlotClick('drive', index, upgrade)}
				>
					<rect
						width={slotWidth}
						height={slotHeight}
						rx="6"
						class="slot"
						class:filled={upgrade !== null}
						class:valid-target={isValidTarget('drive')}
						style="--slot-border: {slotColors.drive.border}; --slot-bg: {slotColors.drive.bg}; --slot-text: {slotColors.drive.text}"
					/>
					{#if info}
						<!-- Cost badge (top right) -->
						<g transform="translate({slotWidth - 12}, 11)">
							<circle r="8" class="cost-badge" />
							<text x="0" y="3" text-anchor="middle" class="cost-text">{info.hullCost}</text>
						</g>
						<!-- Icons row - compact to fit within tile -->
						<g transform="translate({slotWidth/2}, 22)">
							{#each iconPositions as icon}
								<g transform="translate({icon.x}, {icon.y})">
									<svg x={-ICON_SIZE/2} y={-ICON_SIZE/2} width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
										{@html getIconSvgContent(icon.type)}
									</svg>
								</g>
							{/each}
						</g>
						<!-- Name below icons (with text wrapping) -->
						{@const nameLines = splitName(info.name)}
						<text x={slotWidth/2} y={nameLines.length > 1 ? 42 : 48} text-anchor="middle" class="slot-name" style="--slot-text: {slotColors.drive.text}">
							{#each nameLines as line, i}
								<tspan x={slotWidth/2} dy={i === 0 ? 0 : 10}>{line}</tspan>
							{/each}
						</text>
					{:else}
						<text x={slotWidth/2} y="32" text-anchor="middle" class="slot-empty">+ DRIVE</text>
					{/if}
				</g>
			{/if}
		{/each}

		<!-- COMPONENT SLOTS (in the gondola) -->
		{#each blueprint.componentSlots as upgrade, index}
			{#if slotPositions.component[index]}
				{@const info = getUpgradeInfo(upgrade)}
				{@const pos = slotPositions.component[index]}
				{@const iconPositions = info ? getIconsWithPositions(info.stats, info.weight) : []}
				<g
					class="slot-group"
					transform="translate({pos.x}, {pos.y})"
					role="button"
					tabindex="0"
					on:click={() => handleSlotClick('component', index, upgrade)}
					on:keydown={(e) => e.key === 'Enter' && handleSlotClick('component', index, upgrade)}
				>
					<rect
						width={slotWidth}
						height={slotHeight}
						rx="6"
						class="slot"
						class:filled={upgrade !== null}
						class:valid-target={isValidTarget('component')}
						style="--slot-border: {slotColors.component.border}; --slot-bg: {slotColors.component.bg}; --slot-text: {slotColors.component.text}"
					/>
					{#if info}
						<!-- Cost badge (top right) -->
						<g transform="translate({slotWidth - 12}, 11)">
							<circle r="8" class="cost-badge" />
							<text x="0" y="3" text-anchor="middle" class="cost-text">{info.hullCost}</text>
						</g>
						<!-- Icons row - compact to fit within tile -->
						<g transform="translate({slotWidth/2}, 22)">
							{#each iconPositions as icon}
								<g transform="translate({icon.x}, {icon.y})">
									<svg x={-ICON_SIZE/2} y={-ICON_SIZE/2} width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24">
										{@html getIconSvgContent(icon.type)}
									</svg>
								</g>
							{/each}
						</g>
						<!-- Name below icons (with text wrapping) -->
						{@const nameLines = splitName(info.name)}
						<text x={slotWidth/2} y={nameLines.length > 1 ? 42 : 48} text-anchor="middle" class="slot-name" style="--slot-text: {slotColors.component.text}">
							{#each nameLines as line, i}
								<tspan x={slotWidth/2} dy={i === 0 ? 0 : 10}>{line}</tspan>
							{/each}
						</text>
					{:else}
						<text x={slotWidth/2} y="32" text-anchor="middle" class="slot-empty">+ COMPONENT</text>
					{/if}
				</g>
			{/if}
		{/each}
	</svg>

	<!-- Legend -->
	<div class="legend">
		<div class="legend-section">
			<span class="legend-title">SLOTS:</span>
			<span class="legend-item" style="--color: {slotColors.fabric.border}">Fabric</span>
			<span class="legend-item" style="--color: {slotColors.frame.border}">Frame</span>
			<span class="legend-item" style="--color: {slotColors.drive.border}">Drive</span>
			<span class="legend-item" style="--color: {slotColors.component.border}">Component</span>
		</div>
		<div class="legend-section">
			<span class="legend-title">STATS:</span>
			<span class="icon-legend">
				<Icon name="gas_socket" size={20} />
				Gas (5 Lift)
			</span>
			<span class="icon-legend">
				<Icon name="lift" size={20} />
				Lift
			</span>
			<span class="icon-legend">
				<Icon name="reliability" size={20} />
				Reliability
			</span>
			<span class="icon-legend">
				<Icon name="ceiling" size={20} />
				Ceiling
			</span>
			<span class="icon-legend">
				<Icon name="range" size={20} />
				Range
			</span>
			<span class="icon-legend">
				<Icon name="speed" size={20} />
				Speed
			</span>
			<span class="icon-legend">
				<Icon name="weight" size={20} />
				Weight
			</span>
		</div>
	</div>

	<!-- Contextual hint -->
	<div class="context-hint">
		<span class="hint-icon">&#128161;</span>
		<span class="hint-text">
			Visit <strong>Hangar</strong> during Worker Placement to build ships from this design.
			Click any slot to modify your blueprint at <strong>Blueprint Design</strong>.
		</span>
	</div>
</div>

<style>
	.airship-blueprint {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		width: 100%;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-accent-gold);
		letter-spacing: 0.1em;
	}

	.age-badge {
		padding: 2px 10px;
		background: var(--color-bg-hover);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.hull-cost {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: 4px 10px;
		background: var(--color-bg-hover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.cost-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.cost-value {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.airship-svg {
		width: 100%;
		height: auto;
		min-height: 200px;
		border-radius: var(--radius-md);
	}

	.envelope,
	.gondola,
	.tail-fin-top,
	.tail-fin-bottom {
		transition: stroke 0.2s ease;
	}

	.propeller-group {
		transform-origin: center;
	}

	.slot-group {
		cursor: pointer;
	}

	.slot {
		fill: rgba(30, 41, 59, 0.8);
		stroke: var(--slot-border);
		stroke-width: 2;
		stroke-dasharray: 6 3;
		transition: all 0.15s ease;
	}

	.slot-group:hover .slot {
		fill: color-mix(in srgb, var(--slot-bg) 70%, transparent);
		stroke-dasharray: none;
		stroke-width: 2.5;
	}

	.slot.filled {
		fill: var(--slot-bg);
		stroke-dasharray: none;
	}

	.slot.valid-target {
		stroke-width: 3;
		stroke-dasharray: none;
		animation: pulse-target 1s ease-in-out infinite;
	}

	@keyframes pulse-target {
		0%, 100% {
			fill: color-mix(in srgb, var(--slot-bg) 50%, transparent);
		}
		50% {
			fill: color-mix(in srgb, var(--slot-bg) 80%, transparent);
		}
	}

	.slot-name {
		font-size: 9px;
		font-weight: 700;
		fill: var(--slot-text);
		pointer-events: none;
		font-family: var(--font-sans);
	}

	.slot-empty {
		font-size: 11px;
		font-weight: 500;
		fill: #64748b;
		pointer-events: none;
		font-family: var(--font-sans);
	}

	.cost-badge {
		fill: #9ca3af;
		stroke: #6b7280;
		stroke-width: 1;
	}

	.cost-text {
		font-size: 9px;
		font-weight: 700;
		fill: #1f2937;
		font-family: var(--font-sans);
		pointer-events: none;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: var(--spacing-md);
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-sm);
		border-top: 1px solid var(--color-border);
	}

	.legend-section {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.legend-title {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.legend-item {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--color);
	}

	.legend-item::before {
		content: '';
		display: inline-block;
		width: 10px;
		height: 10px;
		background: var(--color);
		border-radius: 2px;
		margin-right: 4px;
		vertical-align: middle;
	}

	.icon-legend {
		font-size: 0.7rem;
		color: var(--color-text-secondary);
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}

	.icon-legend :global(.icon-wrapper) {
		flex-shrink: 0;
	}

	.context-hint {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: var(--radius-md);
	}

	.hint-icon {
		font-size: 1rem;
		line-height: 1.4;
	}

	.hint-text {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		line-height: 1.4;
	}

	.hint-text strong {
		color: var(--color-accent-gold);
	}
</style>
