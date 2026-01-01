<script lang="ts">
	import { user, isAuthenticated, logout } from '$lib/stores/auth';
	import AuthContainer from '$lib/components/auth/AuthContainer.svelte';
	import GameList from '$lib/components/lobby/GameList.svelte';
	import GameDetail from '$lib/components/lobby/GameDetail.svelte';
	import CreateGameModal from '$lib/components/lobby/CreateGameModal.svelte';

	let currentGameId: string | null = null;
	let currentTab: 'open' | 'mine' = 'open';
	let showCreateModal = false;

	function handleViewGame(event: CustomEvent<{ gameId: string }>) {
		currentGameId = event.detail.gameId;
	}

	function handleBackToList() {
		currentGameId = null;
	}

	function handleGameCreated(event: CustomEvent<{ gameId: string }>) {
		showCreateModal = false;
		currentGameId = event.detail.gameId;
	}
</script>

<svelte:head>
	<title>UP SHIP! - The Golden Age of Airships</title>
</svelte:head>

<div class="container">
	<header class="hero">
		<h1>UP SHIP!</h1>
		<p class="subtitle">The Golden Age of Airships (1900-1937)</p>
	</header>

	{#if !$isAuthenticated}
		<div class="landing">
			<p class="description">
				Command your airship conglomerate through three dramatic Ages of aviation history.
				Build fleets, claim routes, and compete to dominate the skies.
			</p>
			<AuthContainer />
		</div>
	{:else}
		<div class="lobby">
			<div class="user-header">
				<span>Welcome, <span class="username">{$user?.displayName || $user?.username}</span></span>
				<button class="btn btn-outline btn-small" on:click={logout}>Logout</button>
			</div>

			{#if currentGameId}
				<GameDetail gameId={currentGameId} on:back={handleBackToList} />
			{:else}
				<div class="lobby-tabs">
					<button
						class="lobby-tab"
						class:active={currentTab === 'open'}
						on:click={() => (currentTab = 'open')}
					>
						Open Games
					</button>
					<button
						class="lobby-tab"
						class:active={currentTab === 'mine'}
						on:click={() => (currentTab = 'mine')}
					>
						My Games
					</button>
				</div>

				<div class="lobby-header">
					<h2>{currentTab === 'open' ? 'Open Games' : 'My Games'}</h2>
					<button class="btn" on:click={() => (showCreateModal = true)}>Create Game</button>
				</div>

				<GameList filter={currentTab} on:viewGame={handleViewGame} />
			{/if}
		</div>

		{#if showCreateModal}
			<CreateGameModal on:created={handleGameCreated} on:close={() => (showCreateModal = false)} />
		{/if}
	{/if}
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--spacing-lg);
		min-height: 100vh;
	}

	.hero {
		text-align: center;
		margin-bottom: var(--spacing-xl);
	}

	.hero h1 {
		font-size: 3rem;
		margin-bottom: var(--spacing-sm);
		text-shadow: 0 2px 10px rgba(196, 163, 90, 0.3);
	}

	.subtitle {
		color: var(--color-text-secondary);
		font-size: 1.25rem;
	}

	.landing {
		text-align: center;
	}

	.description {
		max-width: 600px;
		margin: 0 auto var(--spacing-xl);
		color: var(--color-text-secondary);
		font-size: 1.125rem;
		line-height: 1.6;
	}

	.lobby {
		animation: fadeIn var(--transition-normal) ease-out;
	}

	.user-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md);
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
	}

	.username {
		color: var(--color-accent-gold);
		font-weight: 600;
	}

	.lobby-tabs {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.lobby-tab {
		padding: var(--spacing-sm) var(--spacing-md);
		border: none;
		border-radius: var(--radius-md);
		background: var(--color-bg-card);
		color: var(--color-text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.lobby-tab:hover {
		background: var(--color-bg-hover);
		color: var(--color-text-primary);
	}

	.lobby-tab.active {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	.lobby-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-md);
	}

	.lobby-header h2 {
		font-size: 1.25rem;
	}
</style>
