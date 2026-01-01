<script lang="ts">
	import type { Technology } from '$lib/types/game';

	export let technologies: Technology[] = [];
</script>

<div class="tech-list">
	<h4>Technologies</h4>

	{#if technologies.length === 0}
		<div class="empty">No technologies acquired</div>
	{:else}
		<div class="techs">
			{#each technologies as tech}
				<div class="tech-item">
					<span class="tech-icon">🔬</span>
					<div class="tech-info">
						<span class="tech-name">{tech.name}</span>
						{#if tech.effect}
							<span class="tech-effect">{tech.effect}</span>
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
		font-size: 1rem;
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
