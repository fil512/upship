# Resolved Implementation Gaps (Detailed)

This file contains detailed documentation of all resolved implementation gaps.
For the summary view and unresolved gaps, see [gaps.md](./gaps.md).

Last updated: 2025-12-29

---

## GAP-001: Research Level Track not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 4.6, 5.1
- **Code:** server/services/gameStateService.js:78-79, server/actions/helpers/phaseTransition.js:79-82
- **Issue:** Rules state players have a Research Level Track (starting at 0) that provides base Research when revealing. The code used `playerState.research` as a token pool instead.
- **Fix:** Added `researchLevel` property to player state, updated `collectRevealResources` to use Research Level + Engineers + card bonuses formula.
- [x] Resolved (2025-12-29)

---

## GAP-002: Research Institute location action incorrect
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 6.1
- **Code:** server/data/groundBoard.js:17-23
- **Issue:** Rules say Research Institute costs £4 per level to increase Research Level Track by 1. Code showed "£3 per Research point" with wrong action type.
- **Fix:** Changed cost from 3 to 4, changed action type to 'UPGRADE_RESEARCH_LEVEL'.
- [x] Resolved (2025-12-29)

---

## GAP-003: Starter deck composition wrong
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 11.3
- **Code:** server/services/gameStateService.js:142-161
- **Issue:** Rules specify 10 cards: 3 Wrench, 3 Coin, 3 Propeller, 1 Any with specific cards. Code created wrong distribution with missing cards (Rigger, Clerk, Investor, Navigator).
- **Fix:** Updated createStarterDeck() to include all 10 correct cards per Section 11.3.
- [x] Resolved (2025-12-29)

---

## GAP-004: Income calculation subtracts Engineers from Income (wrong formula)
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.2
- **Code:** server/actions/helpers/phaseTransition.js:121-172
- **Issue:** Rules say: "Gain £ equal to your Income Track minus Engineers in Barracks (each Engineer costs £1 upkeep)". The code paid Engineer upkeep BEFORE collecting income as separate transactions.
- **Fix:** Changed to calculate net income (income - upkeep) as single value, matching rules semantics.
- [x] Resolved (2025-12-29)

---

## GAP-005: Reveal phase does not process card reveal icons
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** The `collectRevealResources` function checked for `card.revealBonus` but starter deck uses `card.reveal` property.
- **Fix:** Updated to check for both `card.reveal` and `card.revealBonus` properties.
- [x] Resolved (2025-12-29)

---

## GAP-006: Officers and cash reveal icons not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 11.3
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** Reveal phase resource collection didn't check for or apply `cash`, `officers`, or `engineers` reveal bonuses.
- **Fix:** Added handling for `cash`, `officers`, and `engineers` reveal bonuses.
- [x] Resolved (2025-12-29)

---

## GAP-007: Third Agent not granted at Officer Income +3
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 6.6
- **Code:** server/actions/crew.js:67-97
- **Issue:** Rules state "When your Officer Income Track reaches +3, immediately gain your 3rd Agent." The code never checked for this milestone.
- **Fix:** Added milestone check in processUpgradeOfficerIncome() to grant 3rd agent when officerIncome >= 3 and agents < 3.
- [x] Resolved (2025-12-29)

---

## GAP-008: Players start with 3 agents instead of 2
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 2.1, 3.2
- **Code:** server/services/gameStateService.js:77, server/config/constants.js:18
- **Issue:** Rules say "2 Agent Tokens (3rd can be earned)". Code set `agents: 3` and `INITIAL_AGENTS = 3`.
- **Fix:** Changed agents from 3 to 2, updated INITIAL_AGENTS constant to 2.
- [x] Resolved (2025-12-29)

---

## GAP-009: Turn order calculation missing First Player Token priority
- **Area:** ROUND_STRUCTURE
- **Severity:** LOW
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/turnOrder.js:14-42
- **Issue:** Rules state "The player with the First Player pawn goes first" for turn order. While Ministry grants turn priority, the code didn't track or apply a First Player token across rounds.
- **Fix:** Updated calculateTurnOrder() to check for `state.firstPlayer` token holder and give them priority. Ministry visitors claim the token which persists across rounds.
- [x] Resolved (2025-12-29)

---

## GAP-010: Age transition uses TURNS_PER_AGE instead of Progress Track
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 1.3, 12.1
- **Code:** server/actions/helpers/phaseTransition.js:237-239
- **Issue:** Rules say ages transition when Progress Track reaches threshold (12/24/30 for 4 players). But `startNewRound` checked `state.turn > TURNS_PER_AGE`.
- **Fix:** Replaced turn-based age transition with `checkAgeTransitionByProgressTrack()` that uses progressTrack and progressThresholds.
- [x] Resolved (2025-12-29)

---

## GAP-011: VP scoring doesn't happen at Age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1, 12.2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules state "Score VP: All players score VP for routes and Technologies" when transitioning between ages. The `checkAgeTransition()` function only changed the age number.
- **Fix:** Created `server/actions/helpers/ageTransition.js` with `performAgeTransition()` that scores VP for all players.
- [x] Resolved (2025-12-29)

---

## GAP-012: Ship and Officer recovery at age transitions not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say ships return to hangar (max 3), officers recovered based on ship age. No code implements this.
- **Fix:** Added `recoverShipsAndOfficers()` function in ageTransition.js.
- [x] Resolved (2025-12-29)

---

## GAP-013: Transition income calculation missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 3
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say "New Income = (£ from Technology tiles) − (£1 × routes lost)." No code calculates this.
- **Fix:** Added `calculateTransitionIncome()` function that applies route loss penalty to income.
- [x] Resolved (2025-12-29)

---

## GAP-014: Blueprint slot expansion at age transitions missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 4, 13.5
- **Code:** server/actions/technology.js:44-70, server/services/gameStateService.js:99-140
- **Issue:** Blueprint slots never expanded when age changes.
- **Fix:** Added `expandBlueprintSlots()` function with `BLUEPRINT_SLOTS` configuration defining slot counts per age.
- [x] Resolved (2025-12-29)

---

## GAP-015: Britain's Red Tape flaw not implemented at age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules state Britain's income reduces by 1 at each Age Transition.
- **Fix:** Added `applyBritainRedTape()` function called during age transitions.
- [x] Resolved (2025-12-29)

---

## GAP-016: Hindenburg Disaster game end condition not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 1.2
- **Code:** server/actions/hazard.js:16-125
- **Issue:** Catastrophic Explosion during Luxury Launch in Age III with Hydrogen should end game.
- **Fix:** Added `checkHindenburgDisaster()` function that checks all four conditions and triggers game end.
- [x] Resolved (2025-12-29)

---

## GAP-017: Technology VP calculation incorrect
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 12.2
- **Code:** server/actions/scoring.js:49-52
- **Issue:** Code used `Math.floor(technologies.length / 2)` instead of actual VP values from tiles.
- **Fix:** Added `calculateTechnologyVPForScoring()` that looks up actual VP values from TECHNOLOGY_BAG.
- [x] Resolved (2025-12-29)

---

## GAP-018: Tiebreakers not implemented in final scoring
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1
- **Code:** server/actions/scoring.js:76-79
- **Issue:** Code sorted by VP only without tiebreaker logic.
- **Fix:** Added `applyTiebreakers()` function (Income > Cash > Ships on routes).
- [x] Resolved (2025-12-29)

---

## GAP-019: Final scoring includes incorrect VP sources
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1, 12.2
- **Code:** server/actions/scoring.js:54-63
- **Issue:** Code awarded VP for cash and ships on routes, but these are tiebreakers not VP sources.
- **Fix:** Removed cash and ships from VP calculation; now only used for tiebreaker logic.
- [x] Resolved (2025-12-29)

---

## GAP-020: Launch procedure skips Hazard Check step
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.1 Step 4
- **Code:** server/actions/launch.js:70-188
- **Issue:** Launch directly placed ships on routes without hazard checks.
- **Fix:** Modified launch to set ship status to 'awaiting_hazard' with pendingRouteId.
- [x] Resolved (2025-12-29)

---

## GAP-021: Helium Handling technology ID case mismatch
- **Area:** FACTIONS
- **Severity:** HIGH
- **Rules:** Section 13.3
- **Code:** server/actions/launch.js:108, server/actions/gas.js:27
- **Issue:** Code checked `'HELIUM_HANDLING'` (uppercase) but ID is `'helium_handling'` (lowercase).
- **Fix:** Changed to lowercase to match TECHNOLOGY_BAG definitions.
- [x] Resolved (2025-12-29)

---

## GAP-022: City Bonuses not implemented
- **Area:** ROUTES_AND_MAPS
- **Severity:** MEDIUM
- **Rules:** Section 10.4
- **Code:** server/actions/launch.js:163-173
- **Issue:** Code only awarded route income, not city bonuses.
- **Fix:** Created server/data/cities.js with CITY_BONUSES and applyCityBonus() function.
- [x] Resolved (2025-12-29)

---

## GAP-023: Government Liaison location missing from Ground Board
- **Area:** GROUND_BOARD
- **Severity:** MEDIUM
- **Rules:** Section 6.8
- **Code:** server/data/groundBoard.js
- **Issue:** Government Liaison location didn't exist; The Bank was incorrectly present.
- **Fix:** Added Government Liaison, removed The Bank (loans are free actions).
- [x] Resolved (2025-12-29)

---

## GAP-024: Loans as Ground Board location instead of Free Action
- **Area:** GROUND_BOARD
- **Severity:** MEDIUM
- **Rules:** Section 5.3
- **Code:** server/data/groundBoard.js:105-117
- **Issue:** The Bank required agent placement but loans should be free actions.
- **Fix:** Removed The Bank from Ground Board locations.
- [x] Resolved (2025-12-29)

---

## GAP-025: Italy's Compact Design flaw not applied in Age transitions
- **Area:** FACTIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.4, 13.5
- **Code:** server/actions/helpers/ageTransition.js:179-183
- **Issue:** Italy should have one fewer Payload slot in Ages II and III.
- **Fix:** Added `getBlueprintSlotsForFaction()` with Italy-specific reduction.
- [x] Resolved (2025-12-29)

---

## GAP-026: Germany's Blaugas Fuel System effect not implemented
- **Area:** FACTIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.1
- **Code:** server/actions/launch.js
- **Issue:** Blaugas should allow paying £2 to keep gas cubes after launch.
- **Fix:** Added retainGas parameter to processLaunchShip().
- [x] Resolved (2025-12-29)

---

## GAP-027: Ship repair cost not implemented
- **Area:** LAUNCHING
- **Severity:** MEDIUM
- **Rules:** Section 4.4
- **Code:** server/actions/hazard.js:159-169
- **Issue:** No REPAIR_SHIP action to pay £3 and move damaged ships to hangar.
- **Fix:** Added processRepairShip() function in server/actions/building.js.
- [x] Resolved (2025-12-29)

---

## GAP-030: Hazard Deck has wrong card composition
- **Area:** COMPONENTS
- **Severity:** HIGH
- **Rules:** Appendix D
- **Code:** server/services/gameStateService.js:163-293
- **Issue:** Code created 20 cards instead of 27 with correct composition.
- **Fix:** Rewrote createHazardDeck() to match Appendix D exactly.
- [x] Resolved (2025-12-29)

---

## GAP-031: Hazard check uses wrong stat
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.2
- **Code:** server/actions/hazard.js:39-53
- **Issue:** Code always used reliability instead of challenge-specific stat.
- **Fix:** Added getRelevantStat() function mapping challenge type to ship stat.
- [x] Resolved (2025-12-29)

---

## GAP-032: Hull Upgrade Rule not implemented
- **Area:** BUILDING_SHIPS
- **Severity:** MEDIUM
- **Rules:** Section 6.2, 6.3
- **Code:** server/actions/blueprint.js:99-126
- **Issue:** Upgrading Frame/Fabric with ships in hangar should charge hull cost difference.
- **Fix:** Added hull cost difference calculation in processInstallUpgrade().
- [x] Resolved (2025-12-29)

---

## GAP-033: Design Bureau swap limit not enforced
- **Area:** TECHNOLOGY_UPGRADES
- **Severity:** MEDIUM
- **Rules:** Section 6.2
- **Code:** server/actions/blueprint.js:55-61
- **Issue:** Code allowed unlimited install/remove actions.
- **Fix:** Added swap limit enforcement (default 2, Italy 4, Britain 1).
- [x] Resolved (2025-12-29)

---

## GAP-034: Hangar capacity limit not enforced during build
- **Area:** BUILDING_SHIPS
- **Severity:** MEDIUM
- **Rules:** Section 6.3, 4.4
- **Code:** server/actions/building.js:23-33
- **Issue:** Max 3 ships in hangar not enforced.
- **Fix:** Added check before building to count existing ships.
- [x] Resolved (2025-12-29)

---

## GAP-035: Clerk card Agent Effect not implemented
- **Area:** DECK_BUILDING
- **Severity:** LOW
- **Rules:** Section 11.3
- **Code:** server/actions/worker.js:51-54
- **Issue:** "Gain £1" effect not handled.
- **Fix:** Added case 'Gain £1' to processCardEffect().
- [x] Resolved (2025-12-29)

---

## GAP-036: Specialization discount track mapping incomplete
- **Area:** TECHNOLOGY_UPGRADES
- **Severity:** LOW
- **Rules:** Section 4.1, 9.1
- **Code:** server/actions/technology.js:147-189
- **Issue:** Hardcoded techTypeMap was redundant.
- **Fix:** Rewrote to use buildTechTypeMap() reading from TECHNOLOGY_BAG.
- [x] Resolved (2025-12-29)

---

## GAP-037: Fire Hazard resolution lacks Engineer spend mechanic
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.3
- **Code:** server/actions/hazard.js:190-270
- **Issue:** Fire hazards require spending Engineers (1 for Engine Fire, 2 for Gas Cell Rupture).
- **Fix:** Added resolveFireHazard() function with correct Engineer costs.
- [x] Resolved (2025-12-29)

---

## GAP-038: Hazard cards Flak values for Age II
- **Area:** HAZARD_DECK_APPENDIX
- **Severity:** HIGH
- **Rules:** Appendix E
- **Code:** server/services/gameStateService.js:182-325
- **Issue:** Hazard cards missing flak values for Age II combat.
- **Fix:** Added `flak` property to each hazard card matching Appendix E distribution.
- [x] Resolved (2025-12-29)

---

## GAP-039: Special hazard effects (Icing, Squall Line)
- **Area:** HAZARD_DECK_APPENDIX
- **Severity:** MEDIUM
- **Rules:** Appendix E
- **Code:** server/services/gameStateService.js:224-240
- **Issue:** Special effects not defined on hazard cards.
- **Fix:** Added `gasLossOnFailure` and `payloadSlotModifier` properties.
- [x] Resolved (2025-12-29)

---

## GAP-040: Route VP values per Appendix F
- **Area:** ROUTES_APPENDIX
- **Severity:** MEDIUM
- **Rules:** Appendix F
- **Code:** server/services/gameStateService.js:427-480
- **Issue:** Routes missing explicit VP values.
- **Fix:** Rewrote createAgeIMap() with VP values per Appendix F.
- [x] Resolved (2025-12-29)

---

## GAP-041: Market Deck not implemented with correct cards
- **Area:** MARKET_DECK_APPENDIX
- **Severity:** MEDIUM
- **Rules:** Appendix H
- **Code:** server/data/marketCards.js, server/services/gameStateService.js
- **Issue:** Only 8 placeholder cards instead of 30 defined cards.
- **Fix:** Created server/data/marketCards.js with all 30 market cards.
- [x] Resolved (2025-12-29)

---

## GAP-042: Age III routes per Appendix F
- **Area:** ROUTES_APPENDIX
- **Severity:** HIGH
- **Rules:** Appendix F
- **Code:** server/services/gameStateService.js:487-551
- **Issue:** Only Age I map existed; Age III Atlantic routes missing.
- **Fix:** Created createAgeIIIMap() with all 16 routes.
- [x] Resolved (2025-12-29)

---

## GAP-043: Technology tiles missing many from Appendix C
- **Area:** TECHNOLOGY_APPENDIX
- **Severity:** MEDIUM
- **Rules:** Appendix C
- **Code:** server/services/gameStateService.js
- **Issue:** TECHNOLOGY_BAG had only ~29 of 54 tiles.
- **Fix:** Rewrote TECHNOLOGY_BAG with all 54 tiles per Appendix C.
- [x] Resolved (2025-12-29)

---

## GAP-045: Conductive Covering static discharge immunity
- **Area:** UPGRADE_APPENDIX
- **Severity:** LOW
- **Rules:** Appendix D
- **Code:** server/actions/hazard.js:148-157
- **Issue:** Static discharge immunity not checked.
- **Fix:** Added check for conductive_covering in fabricSlots.
- [x] Resolved (2025-12-29)

---

## GAP-046: Fire-Resistant Fabric special effect
- **Area:** UPGRADE_APPENDIX
- **Severity:** MEDIUM
- **Rules:** Appendix D
- **Code:** server/actions/hazard.js:159-178
- **Issue:** "Once per Age, treat one Fire hazard as auto-pass" not implemented.
- **Fix:** Added fire protection tracking and resetFireProtection() at age transitions.
- [x] Resolved (2025-12-29)

---

## GAP-047: Modular Frame extra swaps
- **Area:** UPGRADE_APPENDIX
- **Severity:** LOW
- **Rules:** Appendix D
- **Code:** server/actions/blueprint.js:10-24
- **Issue:** "+2 tile swaps at Design Bureau" not applied.
- **Fix:** Added getEffectiveSwapLimit() function checking for modular_frame.
- [x] Resolved (2025-12-29)

---

## GAP-048: Trapeze System (USA) route requirement bypass
- **Area:** FACTIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.3, Appendix D
- **Code:** server/actions/launch.js:70-130
- **Issue:** USA ability to ignore one route requirement not implemented.
- **Fix:** Added bypassRequirement parameter to processLaunchShip().
- [x] Resolved (2025-12-29)

---

## GAP-049: Starter card effects (Navigator, Rigger, Researcher)
- **Area:** DECK_BUILDING
- **Severity:** MEDIUM
- **Rules:** Section 11.3
- **Code:** server/actions/worker.js:45-68
- **Issue:** Several starter card effects not implemented.
- **Fix:** Added Navigator peek, Rigger build discount, Researcher alias.
- [x] Resolved (2025-12-29)

---

## GAP-050: Market card Agent Effects not implemented
- **Area:** MARKET_DECK_APPENDIX
- **Severity:** HIGH
- **Rules:** Appendix H
- **Code:** server/actions/worker.js:processCardEffect()
- **Issue:** 30 market card effects not implemented.
- **Fix:** Added cases for all 30 market card Agent Effects.
- [x] Resolved (2025-12-29)

---

## GAP-051: Insurance policy usage on ship crash not implemented
- **Area:** ECONOMY
- **Severity:** MEDIUM
- **Rules:** Section 6.11
- **Code:** server/actions/hazard.js
- **Issue:** Insurance policies not consumed on crash to save ships.
- **Fix:** Added applyInsuranceRecovery() function.
- [x] Resolved (2025-12-29)

---

## GAP-052: Hindenburg Disaster grants 3 VP to triggering player
- **Area:** SCORING
- **Severity:** LOW
- **Rules:** Section 14.5
- **Code:** server/actions/hazard.js:119-133
- **Issue:** 3 VP consolation not awarded.
- **Fix:** Added VP award when Hindenburg Disaster is triggered.
- [x] Resolved (2025-12-29)

---

## GAP-053: Route VP scoring uses route.distance instead of route.vp
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 12.2, Appendix F
- **Code:** server/actions/scoring.js, server/actions/helpers/ageTransition.js
- **Issue:** Wrong property used for VP calculation.
- **Fix:** Changed to use `route.vp` instead of `route.distance`.
- [x] Resolved (2025-12-29)

---

## GAP-054: Grounding Systems fabric upgrade not in UPGRADES data
- **Area:** UPGRADE_APPENDIX
- **Severity:** LOW
- **Rules:** Appendix C, Appendix D
- **Code:** server/data/upgrades.js
- **Issue:** conductive_covering upgrade missing from UPGRADES.
- **Fix:** Added grounding_systems technology and conductive_covering upgrade.
- [x] Resolved (2025-12-29)
