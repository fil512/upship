// Core game types for UP SHIP!

// Faction types
export type Faction = 'germany' | 'britain' | 'usa' | 'italy';

// Game phases
export type GamePhase =
	| 'worker_placement'
	| 'reveal'
	| 'income_cleanup'
	| 'age_transition_design_bureau';

// Ship status
export type ShipStatus =
	| 'hangar'
	| 'launched'
	| 'on_route'
	| 'awaiting_hazard'
	| 'destroyed'
	| 'damaged'
	| 'crashed';

// Gas types
export type GasType = 'hydrogen' | 'helium';

// Card symbols for worker placement
export type CardSymbol = 'wrench' | 'coin' | 'propeller' | 'any';

// Slot types for blueprint
export type SlotType = 'frame' | 'fabric' | 'drive' | 'component';

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
	reveal?: {
		cash?: number;
		influence?: number;
		research?: number;
		officers?: number;
		engineers?: number;
	};
	effect?: string;
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
}

// Ship stats
export interface ShipStats {
	speed: number;
	range: number;
	ceiling: number;
	reliability: number;
	luxury: number;
	structure?: number;
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
	gasType?: GasType;
	gasCubes?: number;
	routeId?: string;
	pendingHazard?: HazardCard;
	pendingRouteId?: string;
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
}

// Log entry type
export interface LogEntry {
	timestamp: string;
	message: string;
	type?: string;
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

// Player state
export interface PlayerState {
	faction: Faction;
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
	technologies: Technology[];
	ships: Ship[];
	routes: Route[];
	blueprint: Blueprint;
	hand: Card[];
	deck: Card[];
	discardPile: Card[];
	hazardDeck: HazardCard[];
	bonuses: Record<string, number>;
	loans?: number;
	insurance?: number;
	heliumMonopoly?: boolean;
	bannedTechnologies?: string[];
	lowCeiling?: boolean;
	vp?: number;
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
	turn: number;
	round: number;
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
	progressTrack: number;
	progressThresholds: { age2: number; age3: number; end: number };
	gasMarket: { hydrogen: number; helium: number };
	map: GameMap;
	log: LogEntry[];
	vp?: number;
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
}
