<script lang="ts">
	import { user, isAuthenticated, logout } from '$lib/stores/auth';
	import AuthContainer from '$lib/components/auth/AuthContainer.svelte';
	import GameList from '$lib/components/lobby/GameList.svelte';
	import GameDetail from '$lib/components/lobby/GameDetail.svelte';
	import CreateGameModal from '$lib/components/lobby/CreateGameModal.svelte';

	let currentGameId: string | null = null;
	let currentTab: 'open' | 'mine' = 'open';
	let showCreateModal = false;
	let lastUserId: string | null = null;

	// Check if user has any games and default to "My Games" tab if so
	async function initializeDefaultTab() {
		currentTab = 'open'; // Reset to default first
		try {
			const res = await fetch('/api/games/mine', { credentials: 'include' });
			if (res.ok) {
				const data = await res.json();
				if (data.games && data.games.length > 0) {
					currentTab = 'mine';
				}
			}
		} catch (err) {
			// Ignore errors, default to 'open' tab
		}
	}

	// Initialize/reinitialize tab when user changes
	$: {
		const userId = $user?.id || null;
		if (userId !== lastUserId) {
			lastUserId = userId;
			if ($isAuthenticated) {
				initializeDefaultTab();
			}
		}
	}

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
		padding: var(--spacing-xl) var(--spacing-lg);
		min-height: 100vh;
	}

	.hero {
		text-align: center;
		margin-bottom: 4rem;
		padding: 2rem;
		border-bottom: 2px solid var(--color-accent-gold-dark);
		position: relative;
	}

	.hero::after {
		content: '';
		position: absolute;
		bottom: -5px;
		left: 50%;
		transform: translateX(-50%);
		width: 100px;
		height: 8px;
		background: var(--color-accent-gold);
		clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
	}

	.hero h1 {
		font-size: 4.5rem;
		margin-bottom: var(--spacing-xs);
		text-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(196, 163, 90, 0.4);
		letter-spacing: 0.2em;
		font-weight: 900;
	}

	.subtitle {
		color: var(--color-accent-gold-light);
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		letter-spacing: 0.1em;
		opacity: 0.9;
	}

	.landing {
		text-align: center;
		background: rgba(42, 42, 78, 0.4);
		backdrop-filter: blur(8px);
		padding: 3rem;
		border-radius: var(--radius-lg);
		border: 1px solid rgba(196, 163, 90, 0.2);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
		animation: fadeIn var(--transition-slow) ease-out;
	}

	.description {
		max-width: 650px;
		margin: 0 auto 3rem;
		color: var(--color-text-primary);
		font-size: 1.25rem;
		line-height: 1.8;
		font-style: italic;
	}

	.lobby {
		animation: slideIn var(--transition-normal) ease-out;
	}

	.user-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		background: rgba(42, 42, 78, 0.6);
		backdrop-filter: blur(4px);
		border-radius: var(--radius-lg);
		border: 1px solid rgba(196, 163, 90, 0.2);
	}

	.username {
		color: var(--color-accent-gold);
		font-weight: 700;
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
	}

	.lobby-tabs {
		display: flex;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.lobby-tab {
		padding: var(--spacing-md) var(--spacing-xl);
		border: 1px solid rgba(196, 163, 90, 0.3);
		border-radius: var(--radius-md);
		background: rgba(42, 42, 78, 0.4);
		color: var(--color-text-secondary);
		font-family: 'Cinzel', serif;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-normal);
		letter-spacing: 0.05em;
	}

	.lobby-tab:hover {
		background: rgba(58, 58, 94, 0.6);
		color: var(--color-text-primary);
		border-color: var(--color-accent-gold);
	}

	.lobby-tab.active {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		border-color: var(--color-accent-gold);
		box-shadow: 0 0 15px rgba(196, 163, 90, 0.4);
	}

	.lobby-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--spacing-lg);
		padding: 0 var(--spacing-sm);
	}

	.lobby-header h2 {
		font-size: 2rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
</style>
