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
		background: var(--color-bg-card);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-lg);
	}

	.auth-tabs {
		display: flex;
		border-bottom: 1px solid var(--color-bg-hover);
	}

	.auth-tab {
		flex: 1;
		padding: var(--spacing-md);
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.auth-tab:hover {
		color: var(--color-text-primary);
		background: var(--color-bg-hover);
	}

	.auth-tab.active {
		color: var(--color-accent-gold);
		background: var(--color-bg-hover);
	}

	.auth-form {
		padding: var(--spacing-lg);
	}
</style>
