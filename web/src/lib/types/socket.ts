// Socket.io event types for UP SHIP!

import type { GameState, GamePhase, Faction } from './game';
import type { GameAction, ActionResponse } from './actions';

// Server to client events
export interface ServerToClientEvents {
	// State synchronization
	'state-sync': (data: StateSyncData) => void;
	'state-update': (data: StateUpdateData) => void;

	// Error handling
	'action-error': (data: ActionErrorData) => void;

	// Player presence
	'player-joined': (data: PlayerJoinedData) => void;
	'player-left': (data: PlayerLeftData) => void;
	'presence-update': (data: PresenceUpdateData) => void;

	// Game lifecycle
	'game-started': (data: GameStartedData) => void;

	// Turn notifications
	'turn-changed': (data: TurnChangedData) => void;
	'your-turn': () => void;
	'phase-changed': (data: PhaseChangedData) => void;
}

// Client to server events
export interface ClientToServerEvents {
	// Room management
	'join-game': (data: JoinGameData) => void;
	'leave-game': (data: LeaveGameData) => void;

	// Game actions
	'game-action': (data: GameAction, callback: (response: ActionResponse) => void) => void;

	// State requests
	'request-sync': () => void;
}

// Event payload types

export interface StateSyncData {
	state: GameState;
	version: number;
}

export interface StateUpdateData {
	state: GameState;
	version: number;
	action: string;
	actingPlayer?: string;
}

export interface ActionErrorData {
	error: string;
	actionType?: string;
}

export interface PlayerJoinedData {
	playerId: string;
	username: string;
	faction?: Faction;
}

export interface PlayerLeftData {
	playerId: string;
}

export interface PresenceUpdateData {
	playerId?: string;
	isOnline?: boolean;
	onlinePlayers: string[];
}

export interface GameStartedData {
	state: GameState;
}

export interface TurnChangedData {
	currentPlayerId: string;
	phase: GamePhase;
}

export interface PhaseChangedData {
	phase: GamePhase;
	previousPhase?: GamePhase;
}

export interface JoinGameData {
	gameId: string;
	playerId: string;
}

export interface LeaveGameData {
	gameId: string;
}

// Connection state
export interface SocketConnectionState {
	connected: boolean;
	connecting: boolean;
	error: string | null;
	reconnectAttempts: number;
}
