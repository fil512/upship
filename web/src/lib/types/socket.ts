// Re-export socket types from shared @upship/api package
// Note: game.ts already exports everything, but this file exists
// for backward compatibility with existing imports
export type {
	ServerToClientEvents,
	ClientToServerEvents,
	StateSyncData,
	StateUpdateData,
	ActionErrorData,
	PlayerJoinedData,
	PlayerLeftData,
	PresenceUpdateData,
	GameStartedData,
	TurnChangedData,
	PhaseChangedData,
	JoinGameData,
	LeaveGameData,
	SocketConnectionState,
	LobbyGame,
	LobbySyncData,
	LobbyUpdateData,
	LobbyErrorData,
	JoinLobbyData
} from '@upship/api';
