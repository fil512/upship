<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { IconName } from '$lib/icons/types';
	import { getHazardImageFilename } from '$lib/utils/cardImages';

	export let name: string;
	export let category: 'clear' | 'minor' | 'major' | 'fire' | 'mechanical' = 'minor';
	export let difficulty: number = 0;
	export let challengeType: string = '';
	export let engineerCost: number | undefined = undefined;
	export let flak: number = 0;
	export let showFlak: boolean = false;
	export let compact: boolean = false;

	const CATEGORY_COLORS: Record<string, string> = {
		clear: '#4caf50',
		minor: '#ffc107',
		major: '#ff9800',
		fire: '#f44336',
		mechanical: '#9e9e9e'
	};

	const CATEGORY_LABELS: Record<string, string> = {
		clear: 'Clear',
		minor: 'Minor',
		major: 'Major',
		fire: 'Fire',
		mechanical: 'Mechanical'
	};

	const CHALLENGE_ICONS: Record<string, IconName> = {
		speed: 'speed',
		range: 'range',
		ceiling: 'ceiling',
		reliability: 'reliability'
	};

	$: categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.minor;
	$: categoryLabel = CATEGORY_LABELS[category] || category;
	$: challengeIcon = (CHALLENGE_ICONS[challengeType] || 'hazard') as IconName;
	$: imageFilename = getHazardImageFilename(name);
	$: isAutoPass = category === 'clear';
</script>

<div
	class="hazard-card"
	class:compact
	class:auto-pass={isAutoPass}
	style:--hazard-color={categoryColor}
>
	<!-- Header: Category badge + Name -->
	<div class="card-header">
		<span class="category-badge">{categoryLabel}</span>
		<span class="card-name">{name}</span>
	</div>

	<!-- Center: Image area -->
	<div class="card-image-area">
		<img
			src="/cards/hazard/{imageFilename}.png"
			alt={name}
			class="card-image"
			on:error={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
		/>
	</div>

	<!-- Bottom: Challenge info -->
	<div class="card-footer">
		{#if isAutoPass}
			<div class="auto-pass-text">
				<Icon name="launch" size={16} />
				<span>Safe Passage</span>
			</div>
		{:else}
			<div class="challenge-info">
				{#if challengeType}
					<div class="challenge-type" title="Challenge: {challengeType}">
						<Icon name={challengeIcon} size={16} />
						<span class="challenge-label">{challengeType}</span>
					</div>
				{/if}
				<div class="difficulty" title="Difficulty: {difficulty}">
					<span class="difficulty-label">Diff</span>
					<span class="difficulty-value">{difficulty}</span>
				</div>
			</div>
			{#if engineerCost}
				<div class="engineer-cost" title="Spend {engineerCost} Engineers to auto-pass">
					<Icon name="engineers" size={14} />
					<span>{engineerCost}</span>
				</div>
			{/if}
			{#if showFlak && flak > 0}
				<div class="flak-indicator" title="Flak: {flak} (Age II anti-aircraft fire)">
					<span class="flak-label">Flak</span>
					<span class="flak-value">{flak}</span>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.hazard-card {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 140px;
		max-width: 160px;
		min-height: 225px;
		padding: 0;
		margin: 0;
		background: linear-gradient(135deg, #2a2520, #1a1815);
		border: 2px solid var(--hazard-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.hazard-card.compact {
		min-width: 120px;
		max-width: 140px;
		min-height: 190px;
	}

	.hazard-card.auto-pass {
		background: linear-gradient(135deg, #1a2a1a, #152015);
	}

	/* Header section */
	.card-header {
		display: flex;
		align-items: center;
		padding: 6px 8px;
		gap: 6px;
		background: rgba(0, 0, 0, 0.4);
		border-bottom: 1px solid var(--hazard-color);
	}

	.category-badge {
		font-size: 0.55rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 2px 6px;
		background: var(--hazard-color);
		color: #1a1815;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.card-name {
		flex: 1;
		font-size: 0.65rem;
		font-weight: 600;
		color: #e8e4d9;
		text-transform: uppercase;
		line-height: 1.2;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Image area */
	.card-image-area {
		flex: 1;
		min-height: 100px;
		background: rgba(0, 0, 0, 0.2);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Footer section */
	.card-footer {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 6px 8px;
		background: rgba(0, 0, 0, 0.4);
		border-top: 1px solid var(--hazard-color);
	}

	.auto-pass-text {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		color: #4caf50;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.challenge-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.challenge-type {
		display: flex;
		align-items: center;
		gap: 4px;
		color: #c4b8a0;
	}

	.challenge-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		opacity: 0.8;
	}

	.difficulty {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.difficulty-label {
		font-size: 0.55rem;
		text-transform: uppercase;
		color: #888;
	}

	.difficulty-value {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--hazard-color);
		min-width: 18px;
		text-align: center;
	}

	.engineer-cost {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 3px 8px;
		background: rgba(139, 90, 43, 0.3);
		border: 1px solid #8b5a2b;
		border-radius: 3px;
		color: #d4a574;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.flak-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 3px 8px;
		background: rgba(139, 0, 0, 0.3);
		border: 1px solid #8b0000;
		border-radius: 3px;
		color: #ff6b6b;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.flak-label {
		text-transform: uppercase;
		font-size: 0.6rem;
		opacity: 0.9;
	}

	.flak-value {
		font-size: 0.85rem;
		font-weight: 700;
	}
</style>
