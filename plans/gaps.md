# Rules Implementation Gaps

Last updated: 2025-12-29

## Summary
- Total gaps found: 37
- Resolved: 35
- Unresolved: 2

## Analysis Progress

### Level 1 - Core Structure
- [ANALYZED 2025-12-29] ROUND_STRUCTURE
- [ANALYZED 2025-12-29] AGE_TRANSITIONS
- [ANALYZED 2025-12-29] SCORING

### Level 2 - Game Systems
- [ANALYZED 2025-12-29] LAUNCHING
- [ANALYZED 2025-12-29] GROUND_BOARD
- [ANALYZED 2025-12-29] FACTIONS
- [ANALYZED 2025-12-29] ROUTES_AND_MAPS

### Level 3 - Detailed Systems
- [ANALYZED 2025-12-29] TECHNOLOGY_UPGRADES (Section 9)
- [ANALYZED 2025-12-29] DECK_BUILDING (Section 11)
- [ANALYZED 2025-12-29] PLAYER_BOARD (Section 4)
- [ANALYZED 2025-12-29] BUILDING_SHIPS (Section 7)
- [ANALYZED 2025-12-29] SETUP (Section 3)
- [ANALYZED 2025-12-29] COMPONENTS (Section 2)
- [ANALYZED 2025-12-29] RULES_CLARIFICATIONS (Section 14)

---

## Unresolved Gaps

### GAP-028: Age II Combat Missions system not implemented
- **Area:** ROUTES_AND_MAPS
- **Severity:** HIGH
- **Rules:** Section 10.5
- **Code:** N/A
- **Issue:** Rules state Age II uses Combat Missions instead of map routes: "Mission Row of 6 face-up Combat Missions... Resolve Hazard Check first. If successful, take the mission card... Then check Flak—ship may be destroyed." No Mission Row, Combat Mission cards, or Flak mechanics exist.
- **Fix:** Implement Combat Mission system including: mission deck, mission row, flak checks after success, Armor stat handling.
- [ ] Unresolved

---

### GAP-029: Age III Network Connectivity rules not implemented
- **Area:** ROUTES_AND_MAPS
- **Severity:** MEDIUM
- **Rules:** Section 14.3
- **Code:** server/actions/launch.js
- **Issue:** Rules state "Age III: First ship may claim any route from a Major Hub. Subsequent ships must either connect to an existing network OR pay £X to start a new network." No network tracking or connectivity validation exists.
- **Fix:** Track player networks, validate new routes connect to existing network or charge network start fee.
- [ ] Unresolved

---

## Resolved Gaps

### GAP-030: Hazard Deck has wrong card composition
- **Area:** COMPONENTS
- **Severity:** HIGH
- **Rules:** Appendix D (Section 14)
- **Code:** server/services/gameStateService.js:163-293
- **Issue:** Rules specify 27 cards per player with specific composition. Code created only 20 cards with generic types.
- **Fix:** Rewrote createHazardDeck() to create exactly 27 cards matching Appendix D: 4 Clear Weather (auto-pass), 8 Minor Hazards (difficulty 2-3, challenge types), 8 Major Hazards (difficulty 4-5, challenge types), 6 Fire Hazards (Engine Fire x2, Gas Cell Rupture x2, Static Discharge x1, Catastrophic Explosion x1), 1 Mechanical Hazard.
- [x] Resolved (2025-12-29)

---

### GAP-031: Hazard check uses wrong stat (reliability vs specific challenge type)
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.2
- **Code:** server/actions/hazard.js:39-53
- **Issue:** Rules state "Compare your Blueprint's relevant stat to the Difficulty" - the challenge type (Speed, Reliability, Ceiling, or Range) determines which ship stat to compare. Code always used reliability.
- **Fix:** Added getRelevantStat() function that maps challenge type to ship stat. Updated processHazardCheck() to use the hazard's challengeType to determine which stat to check.
- [x] Resolved (2025-12-29)

---

### GAP-032: Hull Upgrade Rule not implemented
- **Area:** BUILDING_SHIPS
- **Severity:** MEDIUM
- **Rules:** Section 6.2, 6.3
- **Code:** server/actions/blueprint.js:99-126
- **Issue:** Rules state "If you upgrade Frame or Fabric while ships are in your Launch Hangar, pay the Hull Cost difference for each ship."
- **Fix:** Added hull cost difference calculation in processInstallUpgrade(). When upgrading Frame/Fabric slots, counts ships in hangar and charges (newHullCost - oldHullCost) * hangarShipCount. Throws InsufficientFundsError if player can't afford.
- [x] Resolved (2025-12-29)

---

### GAP-033: Design Bureau swap limit not enforced
- **Area:** TECHNOLOGY_UPGRADES
- **Severity:** MEDIUM
- **Rules:** Section 6.2
- **Code:** server/actions/blueprint.js:55-61, 157-163
- **Issue:** Rules state "Limit: 2 swaps per visit. Each swap is one installation or removal." Code allowed unlimited install/remove actions.
- **Fix:** Added swap limit enforcement using upgradeSwaps property (default 2, Italy 4, Britain 1). Tracks swapsUsedThisVisit on each install/remove. Throws GameRuleError when limit reached.
- [x] Resolved (2025-12-29)

---

### GAP-034: Hangar capacity limit not enforced during build
- **Area:** BUILDING_SHIPS
- **Severity:** MEDIUM
- **Rules:** Section 6.3, 4.4
- **Code:** server/actions/building.js:23-33
- **Issue:** Rules state "Limit: You may never have more than 3 ships in your Hangar at any time". Code only checked per-action count, not total.
- **Fix:** Added check before building to count existing ships with status='hangar'. Throws GameRuleError if (existing + count) > 3.
- [x] Resolved (2025-12-29)

---

### GAP-035: Clerk card Agent Effect not implemented
- **Area:** DECK_BUILDING
- **Severity:** LOW
- **Rules:** Section 11.3
- **Code:** server/actions/worker.js:51-54
- **Issue:** Rules show Clerk card Agent Effect as "Gain £1". processCardEffect() didn't handle 'Gain £1' effect.
- **Fix:** Added case 'Gain £1' to processCardEffect() that adds £1 to player cash.
- [x] Resolved (2025-12-29)

---

### GAP-036: Specialization discount track mapping incomplete
- **Area:** TECHNOLOGY_UPGRADES
- **Severity:** LOW
- **Rules:** Section 4.1, 9.1
- **Code:** server/actions/technology.js:147-189
- **Issue:** calculateSpecializationDiscount() used hardcoded techTypeMap that was redundant with TECHNOLOGY_BAG types.
- **Fix:** Rewrote to use buildTechTypeMap() that reads types directly from TECHNOLOGY_BAG, plus explicit mappings for faction starting technologies. Cleaner, more maintainable code.
- [x] Resolved (2025-12-29)

---

### GAP-037: Fire Hazard resolution lacks Engineer spend mechanic
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.3
- **Code:** server/actions/hazard.js:190-270
- **Issue:** Rules specify fire hazards require spending Engineers: "Engine Fire: Spend 1 Engineer -> Damaged" and "Gas Cell Rupture: Spend 2 Engineers -> Damaged". Code treated all fire hazards the same.
- **Fix:** Added resolveFireHazard() function that handles each fire hazard type differently: Engine Fire (1 Engineer), Gas Cell Rupture (2 Engineers), Static Discharge (difficulty 4 Reliability check), Catastrophic Explosion (no save). Properly handles insufficient engineers = crash, successful spend = damaged (not destroyed).
- [x] Resolved (2025-12-29)

---

### GAP-020: Launch procedure skips Hazard Check step
- **Area:** LAUNCHING
- **Severity:** HIGH
- **Rules:** Section 8.1 Step 4
- **Code:** server/actions/launch.js:70-188
- **Issue:** Rules state "Step 4: Resolve Hazard Check - Draw a Hazard Card from your Personal Hazard Deck and resolve it." The `processLaunchShip` function doesn't integrate hazard checks - it directly places ships on routes without drawing/resolving hazards. Hazard check exists as a separate action but isn't called during launch.
- **Fix:** Modified launch to set ship status to 'awaiting_hazard' with pendingRouteId instead of directly claiming route. Route is not claimed and income is not increased until hazard check is performed.
- [x] Resolved (2025-12-29)

---

### GAP-021: Helium Handling technology ID case mismatch
- **Area:** FACTIONS
- **Severity:** HIGH
- **Rules:** Section 13.3
- **Code:** server/actions/launch.js:108, server/actions/gas.js:27
- **Issue:** Code checks `t.id === 'HELIUM_HANDLING'` (uppercase) but the technology ID is `'helium_handling'` (lowercase). This prevents USA from using helium despite starting with the technology.
- **Fix:** Changed checks to use lowercase `'helium_handling'` to match TECHNOLOGY_BAG and FACTION_CONFIG definitions. Also handles both string IDs and object IDs in technologies array.
- [x] Resolved (2025-12-29)

---

### GAP-022: City Bonuses not implemented
- **Area:** ROUTES_AND_MAPS
- **Severity:** MEDIUM
- **Rules:** Section 10.4
- **Code:** server/actions/launch.js:163-173, server/services/gameStateService.js:282-305
- **Issue:** Rules state "When claiming a route, choose one endpoint city and gain its bonus immediately." Section 10.4 lists bonuses like London (+£3), Paris (+1 Influence), Berlin (+1 Research). The code only awarded route income, not city bonuses.
- **Fix:** Created new server/data/cities.js with CITY_BONUSES constant containing all Age I/II/III city bonuses. Added applyCityBonus() function to apply bonuses when claiming routes.
- [x] Resolved (2025-12-29)

---

### GAP-023: Government Liaison location missing from Ground Board
- **Area:** GROUND_BOARD
- **Severity:** MEDIUM
- **Rules:** Section 6.8
- **Code:** server/data/groundBoard.js
- **Issue:** Rules define "Government Liaison (Coin)" - spend 1-3 Officers to increase Income Track by 1 per Officer. This location doesn't exist in groundBoard.js. Instead there's "The Bank" which isn't a standard Ground Board location per rules.
- **Fix:** Added Government Liaison location with GOVERNMENT_LIAISON action type. Removed The Bank from Ground Board (loans are free actions per Section 5.3).
- [x] Resolved (2025-12-29)

---

### GAP-024: Loans as Ground Board location instead of Free Action
- **Area:** GROUND_BOARD
- **Severity:** MEDIUM
- **Rules:** Section 5.3
- **Code:** server/data/groundBoard.js:105-117
- **Issue:** Rules state "You may take a loan at any time during your turn—this does not require an Agent or card." But groundBoard.js has "the_bank" as a worker placement location requiring an agent. This incorrectly restricts loan access.
- **Fix:** Removed The Bank from Ground Board locations. TAKE_LOAN action is available as free action without agent placement.
- [x] Resolved (2025-12-29)

---

### GAP-025: Italy's Compact Design flaw not applied in Age transitions
- **Area:** FACTIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.4, 13.5
- **Code:** server/actions/helpers/ageTransition.js:179-183
- **Issue:** Rules state Italy has "One fewer Payload slot in Ages II and III" and Section 13.5 shows Italy: Age II 1/1/2/1, Age III 2/2/2/2. The BLUEPRINT_SLOTS constant uses generic values (2/2 and 3/3 for componentSlots) without faction-specific reduction for Italy.
- **Fix:** Added getBlueprintSlotsForFaction() function that returns faction-specific slot configurations. Italy gets -1 componentSlots in Ages II and III. expandBlueprintSlots() now uses this function.
- [x] Resolved (2025-12-29)

---

### GAP-026: Germany's Blaugas Fuel System effect not implemented
- **Area:** FACTIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.1
- **Code:** server/actions/launch.js, server/data/upgrades.js:447
- **Issue:** Rules say Blaugas grants "+1 Range, and pay £2 when launching to keep gas cubes after mission." The technology exists in upgrades.js but provides no effect - launch.js always consumes gas cubes without option to retain them.
- **Fix:** Added retainGas parameter to processLaunchShip(). If player has blaugas_storage technology and sets retainGas=true, pays £2 and gas cubes are not consumed. Non-Germany factions without the technology cannot use this option.
- [x] Resolved (2025-12-29)

---

### GAP-027: Ship repair cost not implemented
- **Area:** LAUNCHING
- **Severity:** MEDIUM
- **Rules:** Section 4.4
- **Code:** server/actions/hazard.js:159-169
- **Issue:** Rules state "Repair Cost: £3 per ship to move to Launch Hangar" from Repair Hangar. Ships can become damaged but there's no REPAIR_SHIP action to pay £3 and move them from Repair Hangar to Launch Hangar.
- **Fix:** Added processRepairShip() function in server/actions/building.js that costs £3 and changes ship status from 'damaged' to 'hangar'. Validates ship exists, is damaged, and player has sufficient cash.
- [x] Resolved (2025-12-29)

---

### GAP-001: Research Level Track not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 4.6, 5.1
- **Code:** server/services/gameStateService.js:78-79, server/actions/helpers/phaseTransition.js:79-82
- **Issue:** Rules state players have a Research Level Track (starting at 0) that provides base Research when revealing. The code used `playerState.research` as a token pool instead.
- **Fix:** Added `researchLevel` property to player state, updated `collectRevealResources` to use Research Level + Engineers + card bonuses formula.
- [x] Resolved (2025-12-29)

---

### GAP-002: Research Institute location action incorrect
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 6.1
- **Code:** server/data/groundBoard.js:17-23
- **Issue:** Rules say Research Institute costs £4 per level to increase Research Level Track by 1. Code showed "£3 per Research point" with wrong action type.
- **Fix:** Changed cost from 3 to 4, changed action type to 'UPGRADE_RESEARCH_LEVEL'.
- [x] Resolved (2025-12-29)

---

### GAP-003: Starter deck composition wrong
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 11.3
- **Code:** server/services/gameStateService.js:142-161
- **Issue:** Rules specify 10 cards: 3 Wrench, 3 Coin, 3 Propeller, 1 Any with specific cards. Code created wrong distribution with missing cards (Rigger, Clerk, Investor, Navigator).
- **Fix:** Updated createStarterDeck() to include all 10 correct cards per Section 11.3.
- [x] Resolved (2025-12-29)

---

### GAP-004: Income calculation subtracts Engineers from Income (wrong formula)
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.2
- **Code:** server/actions/helpers/phaseTransition.js:121-172
- **Issue:** Rules say: "Gain £ equal to your Income Track minus Engineers in Barracks (each Engineer costs £1 upkeep)". The code paid Engineer upkeep BEFORE collecting income as separate transactions.
- **Fix:** Changed to calculate net income (income - upkeep) as single value, matching rules semantics.
- [x] Resolved (2025-12-29)

---

### GAP-005: Reveal phase does not process card reveal icons
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** The `collectRevealResources` function checked for `card.revealBonus` but starter deck uses `card.reveal` property.
- **Fix:** Updated to check for both `card.reveal` and `card.revealBonus` properties.
- [x] Resolved (2025-12-29)

---

### GAP-006: Officers and cash reveal icons not implemented
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 11.3
- **Code:** server/actions/helpers/phaseTransition.js:51-112
- **Issue:** Reveal phase resource collection didn't check for or apply `cash`, `officers`, or `engineers` reveal bonuses.
- **Fix:** Added handling for `cash`, `officers`, and `engineers` reveal bonuses.
- [x] Resolved (2025-12-29)

---

### GAP-007: Third Agent not granted at Officer Income +3
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 5.1, 6.6
- **Code:** server/actions/crew.js:67-97
- **Issue:** Rules state "When your Officer Income Track reaches +3, immediately gain your 3rd Agent." The code never checked for this milestone.
- **Fix:** Added milestone check in processUpgradeOfficerIncome() to grant 3rd agent when officerIncome >= 3 and agents < 3.
- [x] Resolved (2025-12-29)

---

### GAP-008: Players start with 3 agents instead of 2
- **Area:** ROUND_STRUCTURE
- **Severity:** MEDIUM
- **Rules:** Section 2.1, 3.2
- **Code:** server/services/gameStateService.js:77, server/config/constants.js:18
- **Issue:** Rules say "2 Agent Tokens (3rd can be earned)". Code set `agents: 3` and `INITIAL_AGENTS = 3`.
- **Fix:** Changed agents from 3 to 2, updated INITIAL_AGENTS constant to 2.
- [x] Resolved (2025-12-29)

---

### GAP-009: Turn order calculation missing First Player Token priority
- **Area:** ROUND_STRUCTURE
- **Severity:** LOW
- **Rules:** Section 5.1
- **Code:** server/actions/helpers/turnOrder.js:14-42
- **Issue:** Rules state "The player with the First Player pawn goes first" for turn order. While Ministry grants turn priority, the code didn't track or apply a First Player token across rounds. First Player should be a persistent state that Ministry can claim, not just a visitor list.
- **Fix:** Updated calculateTurnOrder() to check for `state.firstPlayer` token holder and give them priority. Ministry visitors claim the token which persists across rounds.
- [x] Resolved (2025-12-29)

---

### GAP-010: Age transition uses TURNS_PER_AGE instead of Progress Track
- **Area:** ROUND_STRUCTURE
- **Severity:** HIGH
- **Rules:** Section 1.3, 12.1
- **Code:** server/actions/helpers/phaseTransition.js:237-239
- **Issue:** Rules say ages transition when Progress Track reaches threshold (12/24/30 for 4 players). But `startNewRound` checked `state.turn > TURNS_PER_AGE`.
- **Fix:** Replaced turn-based age transition with `checkAgeTransitionByProgressTrack()` that uses progressTrack and progressThresholds. Also fixed agentsRemaining reset to use player's actual agent count instead of INITIAL_AGENTS.
- [x] Resolved (2025-12-29)

---

### GAP-011: VP scoring doesn't happen at Age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1, 12.2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules state "Score VP: All players score VP for routes and Technologies" when transitioning between ages (step 1 of Section 12.1). However, the `checkAgeTransition()` function only changed the age number, added technologies, and reset gas market. VP scoring only happened at game end.
- **Fix:** Created new `server/actions/helpers/ageTransition.js` with `performAgeTransition()` that scores VP for all players. Integrated into `checkAgeTransition()`.
- [x] Resolved (2025-12-29)

---

### GAP-012: Ship and Officer recovery at age transitions not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 2
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say "Recover Ships and Officers: Remove current Map. All ships return to player supplies. As you return ships, add officers to supply (1 officer per Age 1 ship, 2 officers per Age 2 ship). Maximum 3 ships returned due to hangar capacity." No code implements this.
- **Fix:** Added `recoverShipsAndOfficers()` function in ageTransition.js that returns ships to hangar (max 3), recovers officers based on ship age, and handles lost ships exceeding capacity.
- [x] Resolved (2025-12-29)

---

### GAP-013: Transition income calculation missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 3
- **Code:** server/actions/technology.js:44-70
- **Issue:** Rules say "Calculate Transition Income: New Income = (£ from Technology tiles) − (£1 × routes lost). Minimum £0." No code calculates this income adjustment at age transitions.
- **Fix:** Added `calculateTransitionIncome()` function that applies route loss penalty to income.
- [x] Resolved (2025-12-29)

---

### GAP-014: Blueprint slot expansion at age transitions missing
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 12.1 step 4, 13.5
- **Code:** server/actions/technology.js:44-70, server/services/gameStateService.js:99-140
- **Issue:** Rules say "Replace Blueprint: Install new Age's Blueprint overlay. Transfer Upgrades to new Blueprint." Section 13.5 specifies slots per age (e.g., Age II: 1/1/2/2, Age III: 2/2/2/3 for most factions). Blueprint slots are never expanded - no code adds slots when age changes.
- **Fix:** Added `expandBlueprintSlots()` function with `BLUEPRINT_SLOTS` configuration defining slot counts per age. Preserves existing upgrades while expanding slots.
- [x] Resolved (2025-12-29)

---

### GAP-015: Britain's Red Tape flaw not implemented at age transitions
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 13.2
- **Code:** server/actions/technology.js:44-70, server/services/gameStateService.js:24-30
- **Issue:** Rules state "The Flaw — Red Tape: At each Age Transition, reduce your Income Track by 1." The code only sets `upgradeSwaps: 1` but never reduces Britain's income at age transitions.
- **Fix:** Added `applyBritainRedTape()` function called during age transitions that reduces income by 1 for Britain faction (minimum 0).
- [x] Resolved (2025-12-29)

---

### GAP-016: Hindenburg Disaster game end condition not implemented
- **Area:** AGE_TRANSITIONS
- **Severity:** HIGH
- **Rules:** Section 1.2
- **Code:** server/actions/hazard.js:16-125
- **Issue:** Rules say "The game ends immediately when... The Hindenburg Disaster: A Catastrophic Explosion destroys a ship during a Luxury Launch in Age III while using Hydrogen." The hazard check didn't check for Age III, Hydrogen gas type, or Luxury launch, and didn't trigger game end under these conditions.
- **Fix:** Added `checkHindenburgDisaster()` function that checks all four conditions (Age III, Hydrogen, Luxury route, Catastrophic Explosion). When triggered, sets `state.hindenburgDisaster = true` and `state.gameEndReason = 'hindenburg_disaster'`.
- [x] Resolved (2025-12-29)

---

### GAP-017: Technology VP calculation incorrect
- **Area:** AGE_TRANSITIONS
- **Severity:** MEDIUM
- **Rules:** Section 12.2
- **Code:** server/actions/scoring.js:49-52
- **Issue:** Rules say score "VP printed on each Technology tile" (Essential=0 VP, Useful=1 VP, Niche=2-3 VP). Code used `Math.floor(playerState.technologies.length / 2)` which is completely different formula.
- **Fix:** Added `calculateTechnologyVPForScoring()` function that looks up actual VP values from TECHNOLOGY_BAG definitions. Updated `processCalculateScores()` to use this instead of the incorrect formula.
- [x] Resolved (2025-12-29)

---

### GAP-018: Tiebreakers not implemented in final scoring
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1
- **Code:** server/actions/scoring.js:76-79
- **Issue:** Rules specify tiebreakers in order: 1) Highest Income Track position, 2) Most Cash on hand, 3) Most ships currently on routes. Code just sorted by total VP with `.sort((a, b) => b[1].total - a[1].total)` without any tiebreaker logic.
- **Fix:** Added `applyTiebreakers()` function that properly sorts by VP first, then applies all three tiebreakers in order.
- [x] Resolved (2025-12-29)

---

### GAP-019: Final scoring includes incorrect VP sources
- **Area:** SCORING
- **Severity:** MEDIUM
- **Rules:** Section 1.1, 12.2
- **Code:** server/actions/scoring.js:54-63
- **Issue:** Code awarded VP for cash (`Math.floor(cash / 10)`) and ships on routes (`shipsOnRoutes * 2`). Rules only specify VP from routes and technologies. Cash and ships on routes are tiebreakers, not VP sources.
- **Fix:** Removed cash and ships from VP calculation in `processCalculateScores()`. They are now only used for tiebreaker logic.
- [x] Resolved (2025-12-29)
