// Socket.io event types for UP SHIP!

import type { GameState, GamePhase, Faction, TurnInfo } from './game';
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

	// Lobby events (waiting room)
	'lobby-sync': (data: LobbySyncData) => void;
	'lobby-update': (data: LobbyUpdateData) => void;
	'lobby-error': (data: LobbyErrorData) => void;
}

// Client to server events
export interface ClientToServerEvents {
	// Room management
	'join-game': (data: JoinGameData) => void;
	'leave-game': (data: LeaveGameData) => void;
	'join-lobby': (data: JoinLobbyData) => void;

	// Game actions
	'game-action': (data: GameAction, callback: (response: ActionResponse) => void) => void;

	// State requests
	'request-sync': () => void;
}

// Event payload types

export interface StateSyncData {
	state: GameState;
	version: number;
	turnInfo?: TurnInfo;
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

// Re-export LobbyPlayer from game.ts to avoid duplication
export type { LobbyPlayer } from './game';
import type { LobbyPlayer } from './game';

export interface LobbyGame {
	id: string;
	name: string;
	status: string;
	host_id: string;
	current_player_count: number;
	max_players: number;
	players: LobbyPlayer[];
}

export interface LobbySyncData {
	game: LobbyGame;
}

export interface LobbyUpdateData {
	game: LobbyGame;
}

export interface LobbyErrorData {
	error: string;
}

export interface JoinLobbyData {
	gameId: string;
}
