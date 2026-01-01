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
		gap: var(--spacing-md);
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group input {
		width: 100%;
	}

	.error-message {
		padding: var(--spacing-sm) var(--spacing-md);
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid var(--color-error);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: 0.875rem;
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
