// Action types for UP SHIP! game

import type { GasType, SlotType } from './game';

// All action types supported by the server
export type ActionType =
	// Turn management
	| 'END_TURN'
	| 'UNDO'
	// Gas market
	| 'BUY_GAS'
	// Technology acquisition
	| 'ACQUIRE_TECHNOLOGY'
	| 'ACQUIRE_TECHNOLOGY_RESEARCH'
	| 'GAIN_RESEARCH'
	// Blueprint management
	| 'INSTALL_UPGRADE'
	| 'REMOVE_UPGRADE'
	| 'AGE_TRANSITION_DESIGN_BUREAU'
	// Ship operations
	| 'BUILD_SHIP'
	| 'LAUNCH_SHIP'
	| 'LAUNCH_COMBAT_MISSION'
	| 'RESPOND_TO_HAZARD'
	| 'CLAIM_ROUTE'
	| 'NO_MORE_LAUNCHES'
	// Worker placement
	| 'PLACE_AGENT'
	| 'RECALL_AGENTS'
	// Reveal phase
	| 'REVEAL'
	| 'PLAY_CARD'
	| 'DRAW_CARDS'
	// Market
	| 'BUY_MARKET_CARD'
	// Card management
	| 'DISCARD_HAZARD'
	| 'DISCARD_MARKET_CARD'
	// Economy
	| 'TAKE_LOAN'
	| 'BUY_INSURANCE'
	| 'COLLECT_INCOME'
	// Crew
	| 'RECRUIT_CREW'
	| 'UPGRADE_OFFICER_INCOME'
	| 'UPGRADE_ENGINEER_INCOME'
	// Scoring
	| 'CALCULATE_SCORES';

// Action payload types

export interface BuyGasActionData {
	gasType: GasType;
	quantity: number;
}

export interface PlaceAgentActionData {
	locationId: string;
	cardIndex: number;
}

export interface LaunchShipActionData {
	shipId: string;
	routeId: string;
	gasType?: GasType;
}

export interface RespondToHazardActionData {
	shipId: string;
	spend: boolean;
}

export interface ClaimRouteActionData {
	shipId: string;
	routeId: string;
}

export interface InstallUpgradeActionData {
	slotType: SlotType;
	upgradeId: string;
}

export interface RemoveUpgradeActionData {
	slotType: SlotType;
	slotIndex: number;
}

export interface AcquireTechnologyActionData {
	techId: string;
}

export interface BuildShipActionData {
	name?: string;
}

export interface RevealActionData {
	cardIndices: number[];
}

export interface PlayCardActionData {
	cardIndex: number;
}

export interface DrawCardsActionData {
	count: number;
}

export interface BuyMarketCardActionData {
	cardIndex: number;
	cost: number;
}

export interface RecruitCrewActionData {
	type: 'officer' | 'engineer';
}

export interface TakeLoanActionData {
	amount: number;
}

export interface BuyInsuranceActionData {
	policyCount: number;
}

export interface DiscardHazardActionData {
	cardIndex: number;
}

export interface DiscardMarketCardActionData {
	cardIndex: number;
}

// Generic action data type
export type ActionData =
	| BuyGasActionData
	| PlaceAgentActionData
	| LaunchShipActionData
	| RespondToHazardActionData
	| ClaimRouteActionData
	| InstallUpgradeActionData
	| RemoveUpgradeActionData
	| AcquireTechnologyActionData
	| BuildShipActionData
	| RevealActionData
	| PlayCardActionData
	| DrawCardsActionData
	| BuyMarketCardActionData
	| RecruitCrewActionData
	| TakeLoanActionData
	| BuyInsuranceActionData
	| DiscardHazardActionData
	| DiscardMarketCardActionData
	| Record<string, unknown>;

// Generic action wrapper
export interface GameAction {
	actionType: ActionType;
	actionData?: ActionData;
	asUserId?: string; // For dev mode
}

// Action response from server
export interface ActionResponse {
	success: boolean;
	error?: string;
	state?: import('./game').GameState;
	version?: number;
	isCommitPoint?: boolean;
	undoneAction?: {
		type: ActionType;
		data?: ActionData;
	};
}

// Undo info
export interface UndoInfo {
	canUndo: boolean;
	undoCount: number;
	lastActionType: ActionType | null;
	attemptedUndos?: number;
}
