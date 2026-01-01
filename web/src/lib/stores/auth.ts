import { writable, derived } from 'svelte/store';

export interface User {
	id: string;
	username: string;
	displayName?: string;
}

// Core stores
export const user = writable<User | null>(null);
export const isLoading = writable(true);

// Derived stores
export const isAuthenticated = derived(user, ($user) => $user !== null);

/**
 * Check if user is authenticated by calling /api/auth/me
 */
export async function checkAuth(): Promise<User | null> {
	try {
		const res = await fetch('/api/auth/me', { credentials: 'include' });
		const data = await res.json();

		if (data.user) {
			user.set(data.user);
			return data.user;
		}

		user.set(null);
		return null;
	} catch (error) {
		console.error('Auth check failed:', error);
		user.set(null);
		return null;
	} finally {
		isLoading.set(false);
	}
}

/**
 * Login with username and password
 */
export async function login(
	username: string,
	password: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ username, password })
		});

		const data = await res.json();

		if (res.ok && data.user) {
			user.set(data.user);
			return { success: true };
		}

		return { success: false, error: data.error || 'Login failed' };
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, error: 'Network error' };
	}
}

/**
 * Register a new account
 */
export async function register(
	username: string,
	password: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ username, password })
		});

		const data = await res.json();

		if (res.ok && data.user) {
			user.set(data.user);
			return { success: true };
		}

		return { success: false, error: data.error || 'Registration failed' };
	} catch (error) {
		console.error('Registration error:', error);
		return { success: false, error: 'Network error' };
	}
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
	try {
		await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
	} catch (error) {
		console.error('Logout error:', error);
	} finally {
		user.set(null);
	}
}
