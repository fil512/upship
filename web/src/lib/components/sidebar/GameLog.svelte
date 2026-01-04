<script lang="ts">
	import { onMount } from 'svelte';
	import type { LogEntry } from '$lib/types/game';

	export let gameId: string;
	export let logCount: number = 0;

	let log: LogEntry[] = [];
	let loading = true;
	let error: string | null = null;

	// Filter out debug messages - only show action, phase, and general log entries
	const DEBUG_TYPES = ['debug', 'internal'];
	$: filteredLog = log.filter((entry) => !entry.type || !DEBUG_TYPES.includes(entry.type));
	// Show all entries, newest first
	$: displayLog = [...filteredLog].reverse();

	onMount(async () => {
		await fetchLog();
	});

	async function fetchLog() {
		loading = true;
		error = null;
		try {
			const response = await fetch(`/api/state/${gameId}/log`, {
				credentials: 'include'
			});
			if (!response.ok) {
				throw new Error('Failed to fetch game log');
			}
			const data = await response.json();
			log = data.log || [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatRound(entry: LogEntry): string {
		if (entry.round && entry.age) {
			return `A${entry.age}R${entry.round}`;
		}
		if (entry.round) {
			return `R${entry.round}`;
		}
		return '';
	}
</script>

<div class="game-log">
	<div class="log-header">
		<span class="header-text">Game Log ({loading ? logCount : filteredLog.length} entries)</span>
		{#if !loading}
			<button class="refresh-btn" on:click={fetchLog} title="Refresh log">↻</button>
		{/if}
	</div>
	<div class="log-entries">
		{#if loading}
			<div class="loading">Loading log...</div>
		{:else if error}
			<div class="error">{error}</div>
		{:else if displayLog.length === 0}
			<div class="empty">No actions yet</div>
		{:else}
			{#each displayLog as entry}
				<div class="log-entry">
					<span class="round">{formatRound(entry)}</span>
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
		max-height: 400px;
		display: flex;
		flex-direction: column;
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: var(--spacing-xs);
		border-bottom: 1px solid var(--color-bg-hover);
		margin-bottom: var(--spacing-xs);
	}

	.header-text {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.refresh-btn {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0 4px;
	}

	.refresh-btn:hover {
		color: var(--color-primary);
	}

	.log-entries {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.loading,
	.error,
	.empty {
		text-align: center;
		color: var(--color-text-muted);
		padding: var(--spacing-sm);
		font-size: 0.75rem;
	}

	.error {
		color: var(--color-danger);
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

	.round {
		font-size: 0.625rem;
		color: var(--color-primary);
		min-width: 35px;
		font-weight: 500;
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
