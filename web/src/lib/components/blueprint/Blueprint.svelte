<script lang="ts">
	import { myState, gameState } from '$lib/stores/gameState';
	import { openModal } from '$lib/stores/ui';
	import SlotRow from './SlotRow.svelte';
	import ShipStats from './ShipStats.svelte';
	import type { Blueprint as BlueprintType } from '$lib/types/game';

	// Calculate ship stats from blueprint upgrades
	function calculateStats(blueprint: BlueprintType | null | undefined) {
		if (!blueprint) return null;

		// Base stats
		let lift = 0;
		let weight = 0;
		let speed = 0;
		let range = 1;
		let ceiling = 0;
		let reliability = 0;
		let luxury = 0;

		// Count filled slots for basic stats
		const allSlots = [
			...blueprint.frameSlots,
			...blueprint.fabricSlots,
			...blueprint.driveSlots,
			...blueprint.componentSlots
		].filter(Boolean);

		// Frame provides structure (lift)
		blueprint.frameSlots.filter(Boolean).forEach(() => {
			lift += 2;
		});

		// Fabric provides envelope (lift)
		blueprint.fabricSlots.filter(Boolean).forEach(() => {
			lift += 1;
		});

		// Components add weight
		blueprint.componentSlots.filter(Boolean).forEach(() => {
			weight += 1;
		});

		// Drive provides range/speed
		blueprint.driveSlots.filter(Boolean).forEach(() => {
			range += 1;
			speed += 1;
		});

		return {
			lift,
			weight,
			netLift: lift - weight,
			speed,
			range,
			ceiling,
			reliability,
			luxury,
			canLaunch: lift > weight
		};
	}

	$: blueprint = $myState?.blueprint;
	$: stats = blueprint ? calculateStats(blueprint) : null;
	$: age = $gameState?.age || 1;

	function handleSlotClick(slotType: string, slotIndex: number, currentUpgrade: string | null) {
		openModal('upgrade', {
			slotType,
			slotIndex,
			currentUpgrade,
			age
		});
	}
</script>

<div class="blueprint">
	<div class="blueprint-header">
		<h3>Blueprint</h3>
		<span class="age-badge">Age {age}</span>
	</div>

	{#if blueprint}
		<div class="slot-rows">
			<SlotRow
				label="Frame"
				slotType="frame"
				slots={blueprint.frameSlots}
				color="var(--color-frame)"
				on:slotClick={(e) => handleSlotClick('frame', e.detail.index, e.detail.upgrade)}
			/>

			<SlotRow
				label="Fabric"
				slotType="fabric"
				slots={blueprint.fabricSlots}
				color="var(--color-fabric)"
				on:slotClick={(e) => handleSlotClick('fabric', e.detail.index, e.detail.upgrade)}
			/>

			<SlotRow
				label="Drive"
				slotType="drive"
				slots={blueprint.driveSlots}
				color="var(--color-drive)"
				on:slotClick={(e) => handleSlotClick('drive', e.detail.index, e.detail.upgrade)}
			/>

			<SlotRow
				label="Component"
				slotType="component"
				slots={blueprint.componentSlots}
				color="var(--color-component)"
				on:slotClick={(e) => handleSlotClick('component', e.detail.index, e.detail.upgrade)}
			/>
		</div>

		{#if stats}
			<ShipStats {stats} />
		{/if}
	{:else}
		<div class="no-blueprint">No blueprint data</div>
	{/if}
</div>

<style>
	.blueprint {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.blueprint-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-md);
	}

	.blueprint-header h3 {
		font-size: 1rem;
		color: var(--color-accent-gold);
	}

	.age-badge {
		padding: 2px 8px;
		background: var(--color-bg-hover);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.slot-rows {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.no-blueprint {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-lg);
	}

	:global(:root) {
		--color-frame: #3b82f6;
		--color-fabric: #8b5cf6;
		--color-drive: #f59e0b;
		--color-component: #10b981;
	}
</style>
