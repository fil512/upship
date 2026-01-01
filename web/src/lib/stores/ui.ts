import { writable } from 'svelte/store';
import type { ActionType, UndoInfo } from '$lib/types/actions';

// Toast notification types
export type ToastType = 'default' | 'turn' | 'phase' | 'error' | 'success' | 'info' | 'warning';

export interface Toast {
	id: number;
	message: string;
	type: ToastType;
	duration: number;
}

// Toast notifications store
export const toasts = writable<Toast[]>([]);

let toastIdCounter = 0;

/**
 * Show a toast notification
 */
export function showToast(
	message: string,
	type: ToastType = 'default',
	duration: number = 3000
): number {
	const id = toastIdCounter++;

	toasts.update((t) => [...t, { id, message, type, duration }]);

	// Auto-dismiss after duration
	if (duration > 0) {
		setTimeout(() => {
			dismissToast(id);
		}, duration);
	}

	return id;
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(id: number): void {
	toasts.update((t) => t.filter((toast) => toast.id !== id));
}

/**
 * Clear all toasts
 */
export function clearToasts(): void {
	toasts.set([]);
}

// Modal state
export const activeModal = writable<string | null>(null);
export const modalData = writable<Record<string, unknown>>({});

/**
 * Open a modal with optional data
 */
export function openModal(name: string, data: Record<string, unknown> = {}): void {
	modalData.set(data);
	activeModal.set(name);
}

/**
 * Close the current modal
 */
export function closeModal(): void {
	activeModal.set(null);
	modalData.set({});
}

// Card selection for worker placement
export const selectedCardIndex = writable<number | null>(null);

/**
 * Select a card by index (for worker placement)
 */
export function selectCard(index: number | null): void {
	selectedCardIndex.set(index);
}

/**
 * Toggle card selection
 */
export function toggleCardSelection(index: number): void {
	selectedCardIndex.update((current) => (current === index ? null : index));
}

// Undo state
export const undoInfo = writable<UndoInfo>({
	canUndo: false,
	undoCount: 0,
	lastActionType: null
});

/**
 * Update undo info from server response
 */
export function updateUndoInfo(info: Partial<UndoInfo>): void {
	undoInfo.update((current) => ({
		...current,
		...info
	}));
}

// Loading states for various operations
export const loadingStates = writable<Record<string, boolean>>({});

/**
 * Set loading state for an operation
 */
export function setLoading(key: string, isLoading: boolean): void {
	loadingStates.update((states) => ({
		...states,
		[key]: isLoading
	}));
}

/**
 * Check if an operation is loading
 */
export function isLoading(key: string): boolean {
	let loading = false;
	loadingStates.subscribe((states) => {
		loading = states[key] ?? false;
	})();
	return loading;
}

// Sidebar expansion states (for mobile)
export const sidebarExpanded = writable({
	left: true,
	right: true
});

/**
 * Toggle sidebar visibility
 */
export function toggleSidebar(side: 'left' | 'right'): void {
	sidebarExpanded.update((state) => ({
		...state,
		[side]: !state[side]
	}));
}

// Game log expansion
export const logExpanded = writable(false);

/**
 * Toggle game log expansion
 */
export function toggleLog(): void {
	logExpanded.update((expanded) => !expanded);
}

// Tooltip state
export interface TooltipState {
	visible: boolean;
	content: string;
	x: number;
	y: number;
}

export const tooltipState = writable<TooltipState>({
	visible: false,
	content: '',
	x: 0,
	y: 0
});

/**
 * Show tooltip at position
 */
export function showTooltip(content: string, x: number, y: number): void {
	tooltipState.set({
		visible: true,
		content,
		x,
		y
	});
}

/**
 * Hide tooltip
 */
export function hideTooltip(): void {
	tooltipState.update((state) => ({
		...state,
		visible: false
	}));
}
