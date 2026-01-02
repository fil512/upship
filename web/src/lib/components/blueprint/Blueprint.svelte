<script lang="ts">
	import { myState, gameState } from '$lib/stores/gameState';
	import { openModal } from '$lib/stores/ui';
	import SlotRow from './SlotRow.svelte';
	import type { Blueprint as BlueprintType } from '$lib/types/game';

	$: blueprint = $myState?.blueprint;
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
