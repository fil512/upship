<script lang="ts">
	import { onMount } from 'svelte';
	import { checkAuth, isLoading } from '$lib/stores/auth';
	import '../app.css';

	onMount(() => {
		checkAuth();
	});
</script>

{#if $isLoading}
	<div class="loading-screen">
		<div class="spinner"></div>
		<p>Loading UP SHIP!...</p>
	</div>
{:else}
	<slot />
{/if}

<style>
	.loading-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-md);
		height: 100vh;
	}

	.loading-screen p {
		color: var(--color-text-secondary);
		font-size: 1.125rem;
	}
</style>
