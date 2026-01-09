// Re-export action types from shared @upship/api package
// Note: game.ts already exports everything, but this file exists
// for backward compatibility with existing imports
export type {
	ActionType,
	BuyGasActionData,
	PlaceAgentActionData,
	LaunchShipActionData,
	RespondToHazardActionData,
	ClaimRouteActionData,
	InstallUpgradeActionData,
	RemoveUpgradeActionData,
	AcquireTechnologyActionData,
	BuildShipActionData,
	RevealActionData,
	PlayCardActionData,
	DrawCardsActionData,
	BuyMarketCardActionData,
	RecruitCrewActionData,
	BuyInsuranceActionData,
	DiscardHazardActionData,
	KeepHazardActionData,
	DiscardMinistryCardActionData,
	DiscardMarketCardActionData,
	BuyMarketCardTentativeActionData,
	AcquireTechCardTentativeActionData,
	UndoMarketPurchaseActionData,
	ActionData,
	GameAction,
	ActionResponse,
	UndoInfo
} from '@upship/api';
