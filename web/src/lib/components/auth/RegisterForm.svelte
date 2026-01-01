<script lang="ts">
	import { register } from '$lib/stores/auth';

	let username = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let isSubmitting = false;

	async function handleSubmit() {
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		isSubmitting = true;

		const result = await register(username, password);

		isSubmitting = false;

		if (!result.success) {
			error = result.error || 'Registration failed';
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<div class="form-group">
		<label for="register-username">Username</label>
		<input
			id="register-username"
			type="text"
			bind:value={username}
			placeholder="Choose a username"
			minlength="3"
			maxlength="50"
			required
			disabled={isSubmitting}
		/>
	</div>

	<div class="form-group">
		<label for="register-password">Password</label>
		<input
			id="register-password"
			type="password"
			bind:value={password}
			placeholder="Choose a password"
			minlength="6"
			required
			disabled={isSubmitting}
		/>
	</div>

	<div class="form-group">
		<label for="register-confirm">Confirm Password</label>
		<input
			id="register-confirm"
			type="password"
			bind:value={confirmPassword}
			placeholder="Confirm password"
			required
			disabled={isSubmitting}
		/>
	</div>

	<button type="submit" class="btn w-full" disabled={isSubmitting}>
		{#if isSubmitting}
			<span class="spinner-small"></span>
			Creating account...
		{:else}
			Create Account
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
