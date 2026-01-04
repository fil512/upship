import { writable, get } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import type {
	ServerToClientEvents,
	ClientToServerEvents,
	SocketConnectionState
} from '$lib/types/socket';
import type { GameAction, ActionResponse } from '$lib/types/actions';
import { updateGameState, updateTurnInfo, gameVersion, effectiveUserId, isDevMode, hasUnfilteredState, fetchUnfilteredState } from './gameState';
import { showToast } from './ui';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Connection state
export const connectionState = writable<SocketConnectionState>({
	connected: false,
	connecting: false,
	error: null,
	reconnectAttempts: 0
});

// Game join error (distinct from connection error)
export const gameError = writable<string | null>(null);

// Online players in current game
export const onlinePlayers = writable<string[]>([]);

// Lobby state for waiting games
import type { LobbyGame } from '$lib/types/socket';

export const lobbyGame = writable<LobbyGame | null>(null);
export const lobbyError = writable<string | null>(null);
export const inLobby = writable<boolean>(false);

// Convenience derived stores
export const connected = {
	subscribe: (fn: (value: boolean) => void) => {
		return connectionState.subscribe(($state) => fn($state.connected));
	}
};

let socket: TypedSocket | null = null;
let currentGameId: string | null = null;

/**
 * Connect to a game via Socket.io
 */
export function connect(gameId: string, playerId: string): void {
	// Already connected to this game
	if (socket?.connected && currentGameId === gameId) {
		return;
	}

	// Disconnect from any existing connection
	disconnect();

	currentGameId = gameId;

	connectionState.update((s) => ({
		...s,
		connecting: true,
		error: null
	}));

	socket = io({
		path: '/socket.io',
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		withCredentials: true,
		transports: ['websocket', 'polling']
	});

	// Connection events
	socket.on('connect', () => {
		connectionState.set({
			connected: true,
			connecting: false,
			error: null,
			reconnectAttempts: 0
		});

		// Join the game room
		socket?.emit('join-game', { gameId, playerId });
	});

	socket.on('disconnect', (reason) => {
		connectionState.update((s) => ({
			...s,
			connected: false,
			error: reason === 'io server disconnect' ? 'Server disconnected' : null
		}));
	});

	socket.on('connect_error', (error) => {
		connectionState.update((s) => ({
			...s,
			connecting: false,
			error: error.message,
			reconnectAttempts: s.reconnectAttempts + 1
		}));
	});

	// Game state events
	socket.on('state-sync', ({ state, version, turnInfo }) => {
		// In dev mode with unfiltered state, re-fetch to preserve full visibility
		if (get(isDevMode) && get(hasUnfilteredState)) {
			fetchUnfilteredState();
		} else {
			updateGameState(state, version);
		}
		// Update turn info if provided
		if (turnInfo) {
			updateTurnInfo(turnInfo);
		}
	});

	socket.on('state-update', ({ state, version, action }) => {
		const currentVersion = get(gameVersion);
		if (version > currentVersion) {
			// In dev mode with unfiltered state, re-fetch to preserve full visibility
			if (get(isDevMode) && get(hasUnfilteredState)) {
				fetchUnfilteredState();
			} else {
				updateGameState(state, version);
			}
		}
	});

	socket.on('action-error', ({ error }) => {
		// Check if this is a join error (game not found, not a player, etc.)
		if (error === 'Game not found' || error === 'Not a player in this game' || error === 'Failed to join game') {
			gameError.set(error);
		} else {
			showToast(error, 'error');
		}
	});

	// Turn notifications
	socket.on('your-turn', () => {
		showToast("It's Your Turn!", 'turn');
	});

	socket.on('phase-changed', ({ phase }) => {
		const phaseNames: Record<string, string> = {
			worker_placement: 'Worker Placement Phase',
			reveal: 'Reveal Phase',
			income_cleanup: 'Income & Cleanup Phase',
			age_transition_design_bureau: 'Age Transition'
		};
		showToast(phaseNames[phase] || phase, 'phase');
	});

	socket.on('turn-changed', ({ currentPlayerId, phase }) => {
		// Could add additional UI updates here
	});

	// Presence events
	socket.on('presence-update', ({ onlinePlayers: players }) => {
		onlinePlayers.set(players);
	});

	socket.on('player-joined', ({ playerId, username }) => {
		showToast(`${username} joined the game`, 'info');
	});

	socket.on('player-left', ({ playerId }) => {
		showToast('A player left the game', 'info');
	});

	// Game lifecycle
	socket.on('game-started', ({ state }) => {
		updateGameState(state, 1);
		showToast('Game Started!', 'success');
	});
}

// Callback for when game starts from lobby
let onGameStartedCallback: ((state: unknown) => void) | null = null;

/**
 * Connect to a game lobby (for waiting games, before game starts)
 */
export function connectToLobby(gameId: string, onGameStarted?: (state: unknown) => void): void {
	// Already connected to this game
	if (socket?.connected && currentGameId === gameId) {
		return;
	}

	// Disconnect from any existing connection
	disconnect();

	currentGameId = gameId;
	onGameStartedCallback = onGameStarted || null;

	connectionState.update((s) => ({
		...s,
		connecting: true,
		error: null
	}));

	inLobby.set(true);

	socket = io({
		path: '/socket.io',
		reconnection: true,
		reconnectionAttempts: 10,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		withCredentials: true,
		transports: ['websocket', 'polling']
	});

	// Connection events
	socket.on('connect', () => {
		connectionState.set({
			connected: true,
			connecting: false,
			error: null,
			reconnectAttempts: 0
		});

		// Join the lobby room
		socket?.emit('join-lobby', { gameId });
	});

	socket.on('disconnect', (reason) => {
		connectionState.update((s) => ({
			...s,
			connected: false,
			error: reason === 'io server disconnect' ? 'Server disconnected' : null
		}));
	});

	socket.on('connect_error', (error) => {
		connectionState.update((s) => ({
			...s,
			connecting: false,
			error: error.message,
			reconnectAttempts: s.reconnectAttempts + 1
		}));
	});

	// Lobby events
	socket.on('lobby-sync', ({ game }) => {
		lobbyGame.set(game);
	});

	socket.on('lobby-update', ({ game }) => {
		lobbyGame.set(game);
	});

	socket.on('lobby-error', ({ error }) => {
		lobbyError.set(error);
	});

	// Presence events
	socket.on('presence-update', ({ onlinePlayers: players }) => {
		onlinePlayers.set(players);
	});

	// Game started - transition from lobby to game
	socket.on('game-started', ({ state }) => {
		inLobby.set(false);
		lobbyGame.set(null);
		updateGameState(state, 1);
		showToast('Game Started!', 'success');

		// Call the callback if provided
		if (onGameStartedCallback) {
			onGameStartedCallback(state);
		}
	});
}

/**
 * Disconnect from current game or lobby
 */
export function disconnect(): void {
	if (socket) {
		socket.disconnect();
		socket = null;
		currentGameId = null;
		onGameStartedCallback = null;
		connectionState.set({
			connected: false,
			connecting: false,
			error: null,
			reconnectAttempts: 0
		});
		onlinePlayers.set([]);
		gameError.set(null);
		lobbyGame.set(null);
		lobbyError.set(null);
		inLobby.set(false);
	}
}

/**
 * Send a game action via Socket.io
 */
export async function sendAction(action: GameAction): Promise<ActionResponse> {
	if (!socket?.connected) {
		return { success: false, error: 'Not connected to game' };
	}

	// Add dev mode user override if applicable
	const actionToSend = { ...action };
	if (get(isDevMode)) {
		const userId = get(effectiveUserId);
		if (userId) {
			actionToSend.asUserId = userId;
		}
	}

	return new Promise((resolve) => {
		console.log(`[CLIENT] Sending action: ${actionToSend.actionType}`);
		socket!.emit('game-action', actionToSend, (response) => {
			console.log(`[CLIENT] Action callback received:`, { success: response.success, version: response.version, error: response.error });
			if (response.success && response.state && response.version !== undefined) {
				updateGameState(response.state, response.version);
			}
			// Update turn info if provided
			if (response.turnInfo) {
				updateTurnInfo(response.turnInfo);
			}
			resolve(response);
		});
	});
}

/**
 * Request a full state sync from server
 */
export function requestSync(): void {
	if (socket?.connected) {
		socket.emit('request-sync');
	}
}

/**
 * Check if socket is currently connected
 */
export function isConnected(): boolean {
	return socket?.connected ?? false;
}
