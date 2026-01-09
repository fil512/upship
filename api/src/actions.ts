// Action types for UP SHIP! game

import type { GasType, SlotType } from './game';

// All action types supported by the server
export type ActionType =
	// Turn management
	| 'END_TURN'
	| 'PASS'
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
	| 'AGE_TRANSITION_BLUEPRINT_DESIGN'
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
	// Tentative purchases during reveal (can be undone before End Turn)
	| 'BUY_MARKET_CARD_TENTATIVE'
	| 'ACQUIRE_TECH_CARD_TENTATIVE'
	| 'UNDO_MARKET_PURCHASE'
	// Card management
	| 'DISCARD_HAZARD'
	| 'KEEP_HAZARD'
	| 'DISCARD_MINISTRY_CARD'
	| 'DISCARD_MARKET_CARD'
	// Economy
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

export interface BuyInsuranceActionData {
	policyCount: number;
}

export interface DiscardHazardActionData {
	cardIndex: number;
}

// No data needed - just confirms keeping the peeked hazard
export type KeepHazardActionData = Record<string, never>;

export interface DiscardMinistryCardActionData {
	cardIndex: 0 | 1; // Index of card to discard from drawnMinistryCards
}

export interface DiscardMarketCardActionData {
	cardIndex: number;
}

// Tentative purchase actions (during reveal phase)
export interface BuyMarketCardTentativeActionData {
	cardId: string;
}

export interface AcquireTechCardTentativeActionData {
	cardId: string;
}

export interface UndoMarketPurchaseActionData {
	cardId: string;
	type: 'market' | 'tech';
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
	| BuyMarketCardTentativeActionData
	| AcquireTechCardTentativeActionData
	| UndoMarketPurchaseActionData
	| RecruitCrewActionData
	| BuyInsuranceActionData
	| DiscardHazardActionData
	| KeepHazardActionData
	| DiscardMinistryCardActionData
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
	turnInfo?: import('./game').TurnInfo;
}

// Undo info
export interface UndoInfo {
	canUndo: boolean;
	undoCount: number;
	lastActionType: ActionType | null;
	attemptedUndos?: number;
}
