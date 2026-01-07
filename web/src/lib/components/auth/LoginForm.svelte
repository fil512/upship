<script lang="ts">
	import { login } from '$lib/stores/auth';

	let username = '';
	let password = '';
	let error = '';
	let isSubmitting = false;

	async function handleSubmit() {
		error = '';
		isSubmitting = true;

		const result = await login(username, password);

		isSubmitting = false;

		if (!result.success) {
			error = result.error || 'Login failed';
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<div class="form-group">
		<label for="login-username">Username</label>
		<input
			id="login-username"
			type="text"
			bind:value={username}
			placeholder="Enter username"
			required
			disabled={isSubmitting}
		/>
	</div>

	<div class="form-group">
		<label for="login-password">Password</label>
		<input
			id="login-password"
			type="password"
			bind:value={password}
			placeholder="Enter password"
			required
			disabled={isSubmitting}
		/>
	</div>

	<button type="submit" class="btn w-full" disabled={isSubmitting}>
		{#if isSubmitting}
			<span class="spinner-small"></span>
			Logging in...
		{:else}
			Login
		{/if}
	</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	label {
		font-family: 'Cinzel', serif;
		letter-spacing: 0.05em;
		font-weight: 700;
		font-size: 0.8rem;
		margin-bottom: var(--spacing-xs);
		color: var(--color-accent-gold);
	}

	input {
		width: 100%;
		background: rgba(26, 26, 46, 0.4);
		border: 1px solid rgba(196, 163, 90, 0.2);
		font-family: 'Montserrat', sans-serif;
	}

	input:focus {
		background: rgba(26, 26, 46, 0.6);
		border-color: var(--color-accent-gold);
		box-shadow: 0 0 10px rgba(196, 163, 90, 0.2);
	}

	.btn {
		font-family: 'Cinzel', serif;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-top: var(--spacing-sm);
	}

	.error-message {
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(248, 113, 113, 0.15);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-sm);
		color: var(--color-error);
		font-size: 0.85rem;
		font-weight: 600;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
