// Core game types for UP SHIP!

// Faction types
export type Faction = 'germany' | 'britain' | 'usa' | 'italy';

// Game phases
export type GamePhase =
	| 'worker_placement'
	| 'reveal'
	| 'income_cleanup'
	| 'age_transition_blueprint_design'
	| 'game_complete';

// Ship status (deprecated - ships are now counters)
export type ShipStatus =
	| 'hangar'
	| 'launched'
	| 'on_route'
	| 'awaiting_hazard'
	| 'destroyed'
	| 'damaged'
	| 'crashed';

// Hazard info attached to pending launch (flat structure matching server)
export interface PendingHazardInfo {
	// Core hazard info
	type: string;
	name: string;
	category?: string;  // 'clear' | 'minor' | 'major' | 'fire' | 'mechanical'
	challengeType?: string;
	difficulty: number;
	flak?: number;
	// Fire hazard specific
	engineerCost?: number;
	noSave?: boolean;
	hydrogenOnly?: boolean;
	// Special effects
	special?: string;
	gasLossOnFailure?: boolean;
	// Ship stats for comparison
	relevantStat?: number;
	statName?: string;
	engineersNeeded?: number;
	// Auto-pass flags
	autoPass?: boolean;
	autoPassReason?: string | null;
	heliumFireImmunity?: boolean;
	conductiveCoveringImmunity?: boolean;
	fireResistantFabricAvailable?: boolean;
	// From HazardCard
	id?: string;
	hazardType?: string;
}

// Pending launch state (when a ship is mid-launch awaiting hazard check)
export interface PendingLaunch {
	routeId: string;
	missionId?: string;
	cityChoice?: string;
	gasType?: GasType;
	stats?: ShipStats;  // Ship stats at launch time
	hazard?: HazardCard;  // The actual hazard card (for API compatibility)
	hazardInfo?: PendingHazardInfo;  // Processed hazard info for UI
	launchedAge?: number;  // Age when ship was launched
}

// Gas types
export type GasType = 'hydrogen' | 'helium';

// Card symbols for worker placement
export type CardSymbol = 'wrench' | 'coin' | 'propeller' | 'any';

// Slot types for blueprint (short form for UI/display)
export type SlotType = 'frame' | 'fabric' | 'drive' | 'component';

// Slot property names (used in Blueprint interface and upgrade data)
export type SlotPropertyName = 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots';

// Blueprint structure - represents factory capability
export interface Blueprint {
	age: number;
	frameSlots: (string | null)[];
	fabricSlots: (string | null)[];
	driveSlots: (string | null)[];
	componentSlots: (string | null)[];
}

// Card structure (market cards, player hand)
export interface Card {
	id: string;
	name: string;
	symbol: CardSymbol;
	cost?: number; // Influence cost (market cards only, starter cards have no cost)
	reveal?: {
		cash?: number;
		influence?: number;
		research?: number;
		officers?: number;
		engineers?: number;
	};
	effect?: string | null;
	ability?: string;
}

// Hazard card
export interface HazardCard {
	id: string;
	type: string;
	category: 'clear' | 'minor' | 'major' | 'fire' | 'mechanical';
	name: string;
	difficulty: number;
	challengeType?: string;
	flak: number;
	autoPass?: boolean;
	hydrogenOnly?: boolean;
	engineerCost?: number;
	noSave?: boolean;
	// Extended fields added during hazard resolution
	autoPassReason?: string | null;
	engineersNeeded?: number;
	relevantStat?: number;
	statName?: string;
	heliumFireImmunity?: boolean;
	conductiveCoveringImmunity?: boolean;
	fireResistantFabricAvailable?: boolean;
}

// Ship stats (all optional for flexibility, calculated from blueprint at launch time)
export interface ShipStats {
	speed?: number;
	range?: number;
	ceiling?: number;
	reliability?: number;
	luxury?: number;
	income?: number;
	structure?: number;
	weight?: number;
	lift?: number;
	hullCost?: number;
}

// Ship structure (flat stats for easier component access)
export interface Ship {
	id: string;
	name?: string;
	status: ShipStatus;
	// Flat stats (matches server response)
	lift: number;
	weight: number;
	speed: number;
	range: number;
	ceiling: number;
	reliability: number;
	luxury: number;
	income: number;
	gasType?: GasType;
	gasCubes?: number;
	routeId?: string;
	pendingHazard?: HazardCard;
	pendingRouteId?: string;
	pendingMissionId?: string;
	officers?: number;
	engineers?: number;
	upgrades?: string[];
}

// Route structure
export interface Route {
	id: string;
	name: string;
	from?: string;
	to?: string;
	distance?: number;
	range?: number;
	speed?: number;
	speedRequirement?: number;
	ceiling?: number;
	ceilingRequirement?: number;
	income: number;
	vp?: number;
	luxury?: number;
	bonus?: string;
	claimed?: string | null; // playerId or null
	track?: number; // 1 or 2 for double tracks (undefined = single track)
}

// Combat Mission (Age II)
export type MissionType =
	| 'bombing_run'
	| 'reconnaissance'
	| 'resupply'
	| 'naval_patrol'
	| 'artillery_observation'
	| 'transport'
	| 'patrol';

export interface MissionSpecialBonus {
	income?: number;
	vp?: number;
	range?: number;
	description: string;
}

export interface Mission {
	id: string;
	name: string;
	type: MissionType;
	range?: number;
	speed?: number;
	ceiling?: number;
	reliability?: number;
	income: number;
	vp: number;
	bonusVp?: number;
	special?: string | null;
	specialBonus?: MissionSpecialBonus;
	claimed?: string | null; // playerId or null
	completedBy?: string | null;
}

// Log entry type
export interface LogEntry {
	timestamp: string;
	message: string;
	type?: string;
	round?: number;
	age?: number;
	playerId?: string;
}

// Ground board placements type
export type GroundBoardPlacements = Record<string, GroundBoardPlacement>;

// Technology tile
export interface Technology {
	id: string;
	name: string;
	category: string;
	age: number;
	description?: string;
	effect?: string;
}

// Upgrade tile
export interface Upgrade {
	id: string;
	name: string;
	slotType: SlotType;
	category: string;
	effect?: string;
	stats?: Partial<ShipStats>;
}

// Pending purchase during reveal phase
export interface PendingPurchase {
	cardId: string;
	cost: number;
}

// Turn state machine states (for multi-step flows)
export type TurnState =
	| 'idle' // Not this player's turn
	| 'awaiting_action' // Player's turn, can place agent or reveal
	| 'at_weather_bureau' // Must KEEP_HAZARD or DISCARD_HAZARD
	| 'at_ministry' // Must DISCARD_MINISTRY_CARD
	| 'at_launchpad' // Can LAUNCH_SHIP or NO_MORE_LAUNCHES
	| 'awaiting_hazard'; // Must RESPOND_TO_HAZARD

// Player state
export interface PlayerState {
	faction: Faction;
	isBot?: boolean;
	botName?: string;
	cash: number;
	income: number;
	officerIncome: number;
	engineerIncome: number;
	officers: number;
	engineers: number;
	gasCubes: { hydrogen: number; helium: number };
	agents: number;
	agentsRemaining: number;
	research: number;
	researchLevel: number;
	influence: number;
	hasPassed: boolean;
	techCards: string[]; // Server sends tech card IDs, not Technology objects
	// Ship counters (ships are tokens, not individual entities)
	hangarShips: number;  // 0-3, ships ready to launch
	repairShips: number;  // 0-3, ships being repaired
	pendingLaunch?: PendingLaunch;  // Set when a ship is mid-launch awaiting hazard
	// Deprecated - kept for backwards compatibility during migration
	ships?: Ship[];
	routes: Route[];
	blueprint: Blueprint;
	hand: Card[];
	deck: Card[];
	discardPile: Card[];
	hazardDeck: HazardCard[];
	peekedHazard?: HazardCard;
	drawnMinistryCards?: Card[]; // Cards drawn at Ministry (must discard one)
	bonuses: Record<string, number>;
	loans?: number;
	insurance?: number;
	heliumMonopoly?: boolean;
	bannedTechnologies?: string[];
	lowCeiling?: boolean;
	vp?: number;
	// Tentative purchases during reveal phase (before End Turn finalizes)
	pendingMarketPurchases?: PendingPurchase[];
	pendingTechAcquisitions?: PendingPurchase[];
}

// Worker placement state
export interface WorkerPlacementState {
	passedPlayers: string[];
	ministryVisitors: string[];
	placementOrder: string[];
	currentPlacerIndex: number;
}

// Ground board placement
export interface GroundBoardPlacement {
	playerId: string;
	cardUsed: Card;
}

// Ground board location
export interface GroundBoardLocation {
	id: string;
	name: string;
	symbol: CardSymbol;
	effects: string[];
}

// Map structure
export interface GameMap {
	name: string;
	age: number;
	routes: Route[];
	cities: Record<string, { type: string; homeBase: string | null }>;
}

// Reveal phase state
export interface RevealPhaseState {
	revealedHands: Record<string, Card[]>;
	resourcesCollected: Record<string, boolean>;
	techAcquisitionsComplete: Record<string, boolean>;
	marketPurchasesComplete: Record<string, boolean>;
}

// Full game state
export interface GameState {
	age: number;
	round: number;        // Increments each time all players complete a cycle
	turnInRound: number;  // Resets to 1 at start of each round (internal use)
	phase: GamePhase;
	currentPlayerIndex: number;
	playerOrder: string[];
	playerCount: number;
	firstPlayer: string;
	players: Record<string, PlayerState>;
	workerPlacement: WorkerPlacementState;
	revealPhase: RevealPhaseState;
	groundBoard: {
		placements: Record<string, GroundBoardPlacement>;
	};
	rdBoard: Technology[];
	techBag: Technology[];
	marketCards: Card[];
	marketDeck: Card[];
	reserveCard: Card;  // Always-available card (like Dune's Arrakis Liaison)
	// Cards tentatively claimed during reveal (cardId -> playerId)
	marketCardsClaimed?: Record<string, string>;
	techCardsClaimed?: Record<string, string>;
	progressTrack: number;
	progressThresholds: { age2: number; age3: number; end: number };
	gasMarket: { hydrogen: number; helium: number };
	map: GameMap;
	log: LogEntry[];      // Last 5 entries only (full log fetched on demand)
	logCount?: number;    // Total log entry count
	vp?: number;
	launchpadActive?: Record<string, boolean>;  // Which players are at launchpad
	missionRow?: Mission[];  // Age II combat missions
	// Age transition state (present during age_transition_blueprint_design phase)
	ageTransitionBlueprintDesign?: {
		newAge: number;
		completedPlayers: string[];
		currentPlayerIndex: number;
	};
	// Game complete state (present when phase === 'game_complete')
	winner?: string;
	scores?: Record<string, {
		total: number;
		breakdown: {
			previouslyAccumulated: number;
			routes: number;
			techCards: number;
		};
		faction: string;
	}>;
	gameEndReason?: string;
}

// Game wrapper from API response
export interface GameStateResponse {
	id: number;
	gameId: string;
	version: number;
	currentPlayerId: string;
	phase: GamePhase;
	turnNumber: number;
	age: number;
	state: GameState;
	updatedAt: string;
}

// Game lobby types
export interface GameLobby {
	id: string;
	name: string;
	status: 'waiting' | 'in_progress' | 'completed';
	host_id: string;
	current_player_count: number;
	max_players: number;
	created_at: string;
	players?: LobbyPlayer[];
}

export interface LobbyPlayer {
	id: string;
	username: string;
	faction: Faction | null;
	isBot?: boolean;
	botName?: string;
}

// Turn info for Undo/End Turn buttons
export interface TurnInfo {
	canUndo: boolean;
	lastActionType: string | null;
	canEndTurn: boolean;
}
