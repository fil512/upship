<script lang="ts">
	import LoginForm from './LoginForm.svelte';
	import RegisterForm from './RegisterForm.svelte';

	let activeTab: 'login' | 'register' = 'login';
</script>

<div class="auth-container">
	<div class="auth-tabs">
		<button
			class="auth-tab"
			class:active={activeTab === 'login'}
			on:click={() => (activeTab = 'login')}
		>
			Login
		</button>
		<button
			class="auth-tab"
			class:active={activeTab === 'register'}
			on:click={() => (activeTab = 'register')}
		>
			Register
		</button>
	</div>

	<div class="auth-form">
		{#if activeTab === 'login'}
			<LoginForm />
		{:else}
			<RegisterForm />
		{/if}
	</div>
</div>

<style>
	.auth-container {
		max-width: 400px;
		margin: 0 auto;
		background: rgba(42, 42, 78, 0.4);
		backdrop-filter: blur(8px);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(196, 163, 90, 0.2);
	}

	.auth-tabs {
		display: flex;
		border-bottom: 1px solid rgba(196, 163, 90, 0.2);
	}

	.auth-tab {
		flex: 1;
		padding: var(--spacing-md);
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		font-family: 'Cinzel', serif;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-normal);
		letter-spacing: 0.05em;
	}

	.auth-tab:hover {
		color: var(--color-text-primary);
		background: rgba(58, 58, 94, 0.4);
	}

	.auth-tab.active {
		color: var(--color-accent-gold);
		background: rgba(58, 58, 94, 0.6);
	}

	.auth-form {
		padding: var(--spacing-xl);
	}
</style>
