<script lang="ts">
	import type { Technology } from '$lib/types/game';
	import Icon from '$lib/components/ui/Icon.svelte';

	// Technologies can be either string IDs or full objects
	export let technologies: (string | Technology)[] = [];

	// Format a technology ID to a readable name
	function formatTechName(tech: string | Technology): string {
		if (typeof tech === 'object' && tech.name) {
			return tech.name;
		}
		// Convert snake_case ID to Title Case
		return String(tech)
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function getTechEffect(tech: string | Technology): string | null {
		if (typeof tech === 'object' && tech.effect) {
			return tech.effect;
		}
		return null;
	}
</script>

<div class="tech-list">
	<h4>Technologies</h4>

	{#if technologies.length === 0}
		<div class="empty">No technologies acquired</div>
	{:else}
		<div class="techs">
			{#each technologies as tech}
				<div class="tech-item" title={typeof tech === 'string' ? tech : tech.id}>
					<span class="tech-icon"><Icon name="research" size={18} /></span>
					<div class="tech-info">
						<span class="tech-name">{formatTechName(tech)}</span>
						{#if getTechEffect(tech)}
							<span class="tech-effect">{getTechEffect(tech)}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tech-list {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
	}

	.tech-list h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.empty {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-sm);
		font-size: 0.75rem;
	}

	.techs {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.tech-item {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs);
		background: var(--color-bg-hover);
		border-radius: var(--radius-sm);
	}

	.tech-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.tech-info {
		display: flex;
		flex-direction: column;
	}

	.tech-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.tech-effect {
		font-size: 0.625rem;
		color: var(--color-text-muted);
	}
</style>
