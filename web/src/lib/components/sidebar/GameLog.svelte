<script lang="ts">
	import type { LogEntry } from '$lib/types/game';

	export let log: LogEntry[] = [];
	export let maxEntries: number = 20;

	// Filter out debug messages - only show action, phase, and general log entries
	const DEBUG_TYPES = ['debug', 'internal', 'system'];
	$: filteredLog = log.filter((entry) => !entry.type || !DEBUG_TYPES.includes(entry.type));
	$: displayLog = filteredLog.slice(-maxEntries).reverse();

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="game-log">
	<h4>Game Log</h4>

	<div class="log-entries">
		{#if displayLog.length === 0}
			<div class="empty">No actions yet</div>
		{:else}
			{#each displayLog as entry}
				<div class="log-entry">
					<span class="timestamp">{formatTimestamp(entry.timestamp)}</span>
					<span class="message">{entry.message}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.game-log {
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		max-height: 200px;
		display: flex;
		flex-direction: column;
	}

	.game-log h4 {
		font-size: 0.875rem;
		color: var(--color-accent-gold);
		margin-bottom: var(--spacing-sm);
	}

	.log-entries {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.empty {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-sm);
		font-size: 0.75rem;
	}

	.log-entry {
		display: flex;
		gap: var(--spacing-xs);
		padding: 2px 0;
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.log-entry:last-child {
		border-bottom: none;
	}

	.timestamp {
		font-size: 0.625rem;
		color: var(--color-text-muted);
		min-width: 50px;
	}

	.message {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}
</style>
