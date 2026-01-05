// Store exports for UP SHIP!
// Note: Named exports to avoid conflicts

export {
	user,
	isAuthenticated,
	isLoading as authIsLoading,
	login,
	register,
	logout,
	checkAuth
} from './auth';

export {
	gameState,
	gameId,
	gameVersion,
	isMyTurn,
	myState,
	currentPhaseName,
	currentPlayerId,
	allPlayers,
	effectiveUserId,
	setGameId,
	updateGameState,
	resetGameState
} from './gameState';

export {
	connectionState,
	connected,
	onlinePlayers,
	connect,
	disconnect,
	sendAction,
	requestSync,
	isConnected
} from './socket';

export {
	toasts,
	showToast,
	dismissToast,
	activeModal,
	openModal,
	closeModal,
	modalData
} from './ui';
