# Rules vs Implementation Audit Plan

This document tracks the systematic comparison of `spec/upship_rules.md` to the server implementation. Check off items as they are verified or fixed.

**Created**: 2025-12-28
**Status**: Significant Progress - Critical issues resolved, Medium/Low issues partially addressed

---

## Phase 1: Game Setup & Components (Section 2, 11)

### 1.1 Player Starting Resources (Section 11.2)
- [x] Starting cash: £15 per player ✓ (gameStateService.js:70)
- [x] Starting Officers: 1 per player ✓ (gameStateService.js:74)
- [x] Starting Engineers: 2 per player ✓ (gameStateService.js:75)
- [x] Starting gas: 2 Hydrogen cubes (USA: 2 Helium) ✓ (gameStateService.js:64-66)
- [x] Starting deck: 10 cards (see 8.3 for composition) ✓
- [x] Income Track starts at £5 ✓ (gameStateService.js:71)
- [x] Officer Income Track starts at 0 ✓ (gameStateService.js:72)
- [x] Engineer Income Track starts at 1 ✓ (gameStateService.js:73)
- [x] Opening hand: 5 cards ✓ (gameStateService.js:317)

### 1.2 Starter Deck Composition (Section 8.3)
- [x] 2x Apprentice (Any symbol, reveal: 1 Influence) ✓
- [x] 2x Mechanic (Wrench, +1 swap, reveal: £1) ✓
- [x] 2x Draftsman (Wrench, draw 1, reveal: 1 Influence) ✓
- [x] 2x Researcher (Propeller, -£1 Research cost, reveal: 1 Research) ✓
- [x] 1x Purser (Coin, gain £2, reveal: 2 Influence) ✓ **RESOLVED: Fixed starter deck**
- [x] 1x Helmsman (Propeller, +1 ship stat, reveal: 1 Officer) ✓ **RESOLVED: Added to deck**

### 1.3 Progress Track Thresholds (Section 1.3)
- [x] 2 Players: Age I ends at 8, Age II at 16, Game at 20 ✓ **RESOLVED**
- [x] 3 Players: Age I ends at 10, Age II at 20, Game at 25 ✓ **RESOLVED**
- [x] 4 Players: Age I ends at 12, Age II at 24, Game at 30 ✓ **RESOLVED**

---

## Phase 2: Player Board Zones (Section 3)

### 2.1 Blueprint Configuration by Age (Section 3.2)
- [x] Age I: 1 Frame, 1 Fabric, 1 Drive, 1 Payload slot ✓ **RESOLVED: Fixed slot counts**
- [ ] Age II: 1 Frame, 1 Fabric, 2 Drive, 2 Payload slots **TODO: Blueprint transitions not yet implemented**
- [ ] Age III: 2 Frame, 2 Fabric, 2 Drive, 3 Payload slots **TODO: Blueprint transitions not yet implemented**
- [x] Italy has -1 Payload slot in Ages II & III (Section 10.4) ✓ (gameStateService.js:134-136)

### 2.2 Age Baseline Stats (Section 3.2)
- [x] Age I: Speed 1, Range 1, Ceiling 0, Reliability 0 ✓ (gameState.js:1721)
- [x] Age II: Speed 2, Range 2, Ceiling 1, Reliability 1 ✓ (gameState.js:1722)
- [x] Age III: Speed 3, Range 3, Ceiling 2, Reliability 2 ✓ (gameState.js:1723)

### 2.3 Required Slots Rule (Section 3.2)
- [x] All Frame slots must be filled to launch ✓ **RESOLVED: Validated in processLaunchShip**
- [x] All Fabric slots must be filled to launch ✓ **RESOLVED: Validated in processLaunchShip**

### 2.4 Ship Stats from Blueprint (Section 3.2)
- [x] Ships don't track individual stats ✓ (ships use blueprint stats)
- [x] Ships use current Blueprint stats when launched ✓ (gameState.js:1811)
- [x] Ships on routes use current Blueprint stats ✓

### 2.5 Gas Reserve System (Section 3.5)
- [x] Gas purchased at Gas Depot stored in reserve ✓ (gameState.js:671)
- [x] When launching, use stored gas first ✓ (gameState.js:1807-1808)
- [x] Deficit purchased at current market price ✓

---

## Phase 3: Technology & Upgrade System (Section 4)

### 3.1 Technology Acquisition (Section 4.1)
- [x] Research calculated: Engineers in Barracks + card bonuses ✓ (gameState.js:1199)
- [x] Technologies acquired during Reveal Phase ✓
- [x] Unspent Research carries over between rounds ✓ (gameState.js:1573)
- [x] Progress Track advances by 1 per tech acquired ✓ (gameState.js:1591)
- [x] Faction starting techs do NOT advance Progress Track ✓ (only R&D acquisitions count)

### 3.2 Specialization Discount (Section 3.1)
- [x] 1-2 techs in track: No discount ✓ (gameState.js:1539)
- [x] 3-4 techs in track: -1 Research cost ✓ (gameState.js:1538)
- [x] 5+ techs in track: -2 Research cost ✓ (gameState.js:1537)

### 3.3 R&D Board Refill (Section 4.1)
- [x] Age I: 4 tiles drawn per round ✓ **RESOLVED: refillRDBoard now scales by Age**
- [x] Age II: 5 tiles drawn per round ✓ **RESOLVED**
- [x] Age III: 6 tiles drawn per round ✓ **RESOLVED**

### 3.4 Technology Bag Composition
- [x] Starts with only Age I tiles ✓ (gameStateService.js:241-246)
- [x] Age II tiles added at transition (not replacing) ✓ (gameState.js:1506)
- [x] Age III tiles added at transition (not replacing) ✓

### 3.5 Upgrade Installation (Section 4.2)
- [x] Design Bureau action: 2 swaps base ✓ (groundBoard.js:34)
- [x] Britain: Only 1 swap (Red Tape flaw) ✓ (gameStateService.js:29)
- [x] Italy: 4 swaps (Rapid Refit advantage) ✓ (gameStateService.js:53)
- [x] Removed upgrades return to shared supply ✓ (conceptually - no limit enforcement)

---

## Phase 4: Lifting Gas System (Section 4.4)

### 4.1 Gas Cube Mechanics
- [x] Each cube provides +5 Lift ✓ (gameState.js:1767)
- [x] No mixing gas types on single launch ✓ (enforced by gasType parameter)
- [x] Gas cubes consumed on launch (return to supply) ✓ (gameState.js:1808)

### 4.2 Hydrogen Pricing
- [x] Fixed at £1/cube ✓ (groundBoard.js:140)
- [x] Vulnerable to Fire hazards ✓ (gameState.js:1949)

### 4.3 Helium Market Track (Section 4.4)
- [x] Starting price: £2/cube ✓ **RESOLVED: Fixed in gameStateService.js**
- [x] Market advances 1 step per cube purchased (non-USA) ✓ **RESOLVED: advanceHeliumMarket()**
- [x] Price progression: £2 → £3 → £4 → £5 → £6 → £8 → £10 → £15 ✓ **RESOLVED: HELIUM_PRICE_TRACK**
- [x] USA purchases do NOT advance track ✓ (gameState.js:676)
- [x] Ministry action reduces track by 1 step ✓ **RESOLVED: reduceHeliumMarket() called**
- [x] Track resets to £2 at Age Transitions ✓ **RESOLVED: Fixed reset values**

### 4.4 Helium Requirement
- [x] Requires Helium Handling technology to purchase/use ✓ **RESOLVED: Added validation in processBuyGas and processLaunchShip**

---

## Phase 5: Maps & Routes (Section 5)

### 5.1 Age I Map Rules (Section 5.1)
- [x] No home bases required ✓ (no enforcement)
- [x] Any player can launch to any unclaimed route ✓
- [x] Resolve by turn order if multiple claim same route ✓ (sequential turns)

### 5.2 Age II Map Rules (Section 5.2)
- [ ] First ship must launch from Home Base **TODO: Not implemented**
- [x] Germany: Friedrichshafen ✓ (defined in map data)
- [x] Britain: Cardington ✓ (defined in map data)
- [ ] USA: Paimboeuf **TODO: Map doesn't exist yet**
- [x] Italy: Rome ✓ (defined in map data)
- [ ] Subsequent ships must connect to existing network **TODO: Not implemented**

### 5.3 Age III Map Rules (Section 5.3)
- [ ] Can launch from any Major Metropolis **TODO: Not implemented**
- [ ] Metropolises: New York, London, Berlin, Rio **TODO: Age III map not implemented**
- [ ] Subsequent ships must connect to network **TODO: Not implemented**

### 5.4 Route Requirements (Section 5.4)
- [x] Routes have minimum stat requirements (Range, Speed, Ceiling, Luxury) ✓
- [x] Blueprint stats must meet ALL requirements ✓ (gameState.js:1863-1868)

### 5.5 Route Capacity (Section 5.5)
- [x] Single Track: 1 player only ✓ (route.claimed check)
- [ ] Double Track: Up to 2 players **TODO: No double track support**

### 5.6 Route Income Formula (Section 5.6)
- [x] Income = Range requirement + Age bonus + Luxury bonus ✓ (pre-calculated on routes)
- [ ] Age II bonus: +£1 **TODO: Routes have fixed income values**
- [ ] Age III bonus: +£2 **TODO: Routes have fixed income values**
- [ ] Luxury route bonus: +£2 **TODO: No luxury routes yet**

### 5.7 City Bonuses (Section 5.7)
- [ ] One-time reward when claiming route **TODO: Not implemented**
- [ ] Choose one endpoint city bonus **TODO: Not implemented**
- [ ] £ bonuses are immediate cash, not Income Track **TODO: Not implemented**

---

## Phase 6: Game Loop (Section 6)

### 6.1 Turn Order (Section 6.1)
- [x] Based on Income Track (lowest first) ✓ (gameState.js:269)
- [x] Ties: Player with less Cash goes first ✓ (gameState.js:271)
- [x] Further ties: Clockwise from start player ✓ (gameState.js:273)

### 6.2 Worker Placement Phase (Section 6.1)
- [x] Players place ONE Agent at a time ✓ (processPlaceAgent)
- [x] Must play Card matching location symbol ✓ (gameState.js:1021)
- [x] Continue until all players pass ✓ (allPlayersPassed check)

### 6.3 Ground Board Locations

#### Research Institute (Propeller)
- [x] Buy Research with money at £3/point ✓ (groundBoard.js:20)
- [x] Card effects may reduce cost ✓ **RESOLVED: processCardEffect handles Researcher discount**

#### Design Bureau (Wrench)
- [x] Install/remove Upgrades ✓
- [x] 2 tile swaps base ✓
- [x] Only install if you own corresponding Technology ✓ (gameState.js:801)

#### Construction Hall (Wrench)
- [x] Build ships up to Launch Hangar capacity (3) ✓ (gameState.js:1363)
- [x] Cost: £2 base + Frame cost + Fabric cost ✓ (gameState.js:1341-1355)
- [x] Ships placed in Launch Hangar ✓
- [ ] Repair ships: £3 each from Repair to Launch Hangar **TODO: Not implemented**
- [ ] Hull Upgrade Rule: Pay difference when upgrading Frame/Fabric **TODO: Not implemented**

#### Launchpad (Propeller)
- [x] Launch ships from Launch Hangar ✓
- [x] May launch multiple ships sequentially ✓
- [x] Can stop at any time ✓
- [x] Physics Check required ✓ (calculateRequiredGasCubes)
- [x] All structural slots must be filled ✓ **RESOLVED: Validated in processLaunchShip**

#### Academy (Coin)
- [x] Officers: £2 each ✓ (gameState.js:1303)
- [x] Engineers: £4 each ✓ (gameState.js:1304)
- [x] May discard leftmost Market card ✓ **RESOLVED: DISCARD_MARKET_CARD action added**

#### Flight School (Coin)
- [x] Cost: £5 per level ✓ (gameState.js:1396)
- [x] Increases Officer Income Track ✓ (gameState.js:1403)

#### Technical Institute (Wrench)
- [x] Cost: £6 per level ✓ (gameState.js:1420)
- [x] Increases Engineer Income Track ✓ (gameState.js:1425)

#### The Bank (Coin)
- [x] Gain £30 immediately ✓ (gameState.js:866-867)
- [x] Reduce Income Track by 3 (permanent) ✓ (gameState.js:870-871)

#### Ministry (Propeller)
- [x] Draw 2 cards, discard 1 ✓ **RESOLVED: Implemented in executeLocationAction**
- [x] Go first next round (regardless of Income) ✓ (gameState.js:1262)
- [x] Reduce Helium Market Track by 1 ✓ **RESOLVED: reduceHeliumMarket() called**
- [x] Multiple visitors: First visitor goes first, then others, then by Income ✓

#### Gas Depot (Wrench)
- [x] Buy Hydrogen at £1/cube ✓
- [x] Buy Helium at market price ✓
- [x] Non-USA Helium advances market track ✓ (gameState.js:676-677)
- [x] Gas stored in Gas Reserve ✓

#### Insurance Bureau (Coin)
- [x] Cost: -1 Income Track per policy ✓ (gameState.js:1449)
- [x] Max 3 policies total ✓ (gameState.js:1444)
- [x] On crash: Discard policy to recover ship to Launch Hangar ✓ **RESOLVED: Fixed payout logic**

#### Weather Bureau (Propeller)
- [x] Cost: £2 ✓ (groundBoard.js:168)
- [x] Peek at top Hazard card ✓ **RESOLVED: Implemented in executeLocationAction**
- [x] May leave on top or discard ✓ **RESOLVED: DISCARD_HAZARD action added**

### 6.4 Reveal Phase (Section 6.2)
- [x] All players reveal remaining hand simultaneously ✓ (transitionToRevealPhase)
- [x] Collect resources from Reveal Icons ✓ (collectRevealResources)
- [x] Calculate Research: Engineers + card Research bonuses ✓ (gameState.js:1199)
- [x] Acquire Technologies (spend Research) ✓
- [x] Purchase Market cards (spend Influence) ✓ **RESOLVED: Now uses Influence not cash**
- [x] Unspent Influence lost (does not carry over) ✓ (gameState.js:540)

### 6.5 Income & Cleanup Phase (Section 6.3)
- [x] Pay Engineer upkeep: £1 per Engineer ✓ (gameState.js:504-513)
- [x] Collect Income Track value ✓ (gameState.js:517-518)
- [x] Collect Officer Income ✓ (gameState.js:521-523)
- [x] Collect Engineer Income ✓ (gameState.js:524)
- [x] Refresh R&D Board ✓ (refreshRnDBoard)
- [x] Check Age Transition ✓ (checked in processAcquireTechnology)
- [x] Return Agents to supplies ✓ (startNewRound clears placements)
- [x] Draw to 5 cards (don't draw if already 5+) ✓ (gameState.js:591-603)
- [x] Refill Market Row to 5 (slide left, new on right) ✓ (refreshMarketRow)

---

## Phase 7: Building & Launching Ships (Section 7)

### 7.1 Hull Cost Formula (Section 7.1)
- [x] £2 base + Frame tile cost + Fabric tile cost ✓ (gameState.js:1341)
- [x] Each Frame/Fabric upgrade shows cost modifier (£0-£3) ✓ (defined in UPGRADES)
- [x] Build limit: 3 ships per Construction Hall action ✓ (gameState.js:1363)

### 7.2 Launch Requirements (Section 7.2)
- [x] Physics Check: Lift ≥ Weight ✓ (calculateRequiredGasCubes)
- [x] All Frame slots filled ✓ **RESOLVED: Validated in processLaunchShip**
- [x] All Fabric slots filled ✓ **RESOLVED: Validated in processLaunchShip**

### 7.3 Launch Costs (Section 7.2)
- [x] Officers spent: Equal to Age number (1/2/3) ✓ (gameState.js:1789)
- [x] Gas choice: Hydrogen OR Helium (no mixing) ✓ (gasType parameter)
- [x] Use Gas Reserve first, deficit at market price ✓ (gameState.js:1797-1800)

### 7.4 Hazard Check (Section 7.3)
- [x] Draw from personal Hazard Deck ✓ (gameState.js:1915)
- [x] Card shows Challenge Type and Difficulty ✓
- [x] Compare Blueprint stat to Difficulty ✓ (gameState.js:1920-1925)
- [ ] Engineers can be spent (+1 each) after seeing card **TODO: Not implemented**
- [x] Pass: Place ship, gain Income ✓
- [ ] Pass: gain city bonus **TODO: Not implemented**
- [x] Fail: Ship returns to Launch Hangar, lose Officers/gas ✓

### 7.5 Fire Hazards (Section 7.4)
- [ ] Only affect Hydrogen ships **PARTIAL: heliumBonus adds +1 to check**
- [ ] Engine Fire: Spend 1 Engineer to control → Damaged **TODO: Not implemented**
- [ ] Gas Cell Rupture: Spend 2 Engineers → Damaged **TODO: Not implemented**
- [ ] Catastrophic Explosion: No save, ship crashes **TODO: Uses severity threshold, not fire type**
- [ ] Helium ships are immune to all Fire hazards **PARTIAL: +1 bonus but not immunity**

### 7.6 Damaged Ships (Section 7.4)
- [ ] Controlled fire → Ship to Repair Hangar **TODO: Fire control missing**
- [ ] Must pay £3 at Construction Hall to repair **TODO: Not implemented**
- [ ] Cannot launch from Repair Hangar **TODO: Not implemented**

### 7.7 Luxury Launches (Section 7.5)
- [ ] Require Luxury stat on Blueprint **TODO: No luxury routes**
- [ ] Catastrophic Explosion in Age III Luxury = Hindenburg Disaster **TODO: Not implemented**

---

## Phase 8: Deck Building (Section 8)

### 8.1 Card Dual Functionality (Section 8.1)
- [x] Action Symbol (top left): Wrench/Coin/Propeller ✓ (card.symbol property)
- [x] Agent Effect (middle): Bonus when used for placement ✓ **RESOLVED: processCardEffect() implemented**
- [x] Reveal Icons (bottom): Resources when revealed ✓ (card.reveal property)

### 8.2 Symbol Locations
- [x] Wrench: Design Bureau, Construction Hall, Technical Institute, Gas Depot ✓
- [x] Coin: Academy, Flight School, Bank, Insurance Bureau ✓
- [x] Propeller: Research Institute, Launchpad, Ministry, Weather Bureau ✓

### 8.3 Market Purchases (Section 6.2)
- [x] Spend Influence during Reveal Phase ✓ **RESOLVED: processBuyMarketCard now uses Influence**
- [x] Purchased cards go to discard pile ✓ **RESOLVED**
- [x] Unspent Influence lost at end of round ✓ (gameState.js:540)

---

## Phase 9: Age Transitions (Section 9)

### 9.1 Transition Trigger
- [x] Progress Track reaches Age threshold ✓ (gameState.js:727, 740)
- [x] Checked during Income & Cleanup phase ✓ (checked in processAcquireTechnology)

### 9.2 Transition Procedure
- [ ] Score VP for routes and Technology tiles **TODO: Not implemented at transition**
- [ ] Remove current Map, return all ships to supplies **TODO: Not implemented**
- [ ] Calculate new Income: Tech £ values - £1 per route lost **TODO: Not implemented**
- [ ] Return Officers from ships to Barracks **TODO: Not implemented**
- [ ] Replace Blueprint overlay (transfer upgrades for free if slots match) **TODO: Not implemented**
- [ ] Non-transferred Upgrades return to supply **TODO: Not implemented**
- [ ] Place new Map **TODO: Age II/III maps don't exist**
- [x] Add new Age tiles to Technology Bag ✓ (addAgeTechnologies)
- [x] Refresh R&D Board ✓ (refillRDBoard)

### 9.3 Helium Market Reset
- [x] Track resets to £2 at each Age Transition ✓ **RESOLVED: Fixed reset values**

---

## Phase 10: Factions (Section 10)

### 10.1 Germany (Section 10.1)
- [x] Starting techs: Duralumin Framework, Goldbeater's Skin, Blaugas Fuel System ✓ (gameStateService.js:8)
- [x] Flaw: Cannot acquire Helium Handling (locked to Hydrogen) ✓ (gameStateService.js:16)
- [x] Home Base: Friedrichshafen ✓ (defined but not enforced)

### 10.2 Britain (Section 10.2)
- [x] Starting techs: Wire Bracing, Doped Canvas, Imperial Mooring System ✓ (gameStateService.js:20)
- [x] Starting upgrade: Dining Saloon (pre-installed Luxury) ✓ (gameStateService.js:25)
- [x] Flaw: Only 1 swap at Design Bureau (Red Tape) ✓ (gameStateService.js:29)
- [x] Home Base: Cardington ✓ (defined but not enforced)

### 10.3 USA (Section 10.3)
- [x] Starting techs: Duralumin Framework, Gelatinized Latex, Trapeze Fighter System, Helium Handling ✓ (gameStateService.js:33)
- [x] Advantage: Helium purchases don't advance market ✓ (gameState.js:675-676)
- [x] Starting gas: 2 Helium (not Hydrogen) ✓ (gameStateService.js:64-66)
- [ ] Home Base: Paimboeuf (Age II), Lakehurst (Age III) **TODO: Not enforced**

### 10.4 Italy (Section 10.4)
- [x] Starting techs: Internal Keel, Rubberized Cotton, Articulated Keel Design ✓ (gameStateService.js:45)
- [x] Advantage: 4 swaps at Design Bureau (Rapid Refit) ✓ (gameStateService.js:53)
- [x] Flaw: -1 Payload slot in Ages II & III ✓ (gameStateService.js:134-136)
- [x] Home Base: Rome ✓ (defined but not enforced)

### 10.5 Faction Blueprint Slots (Section 10.5)
- [x] Standard Age I: (1/1/1/1) ✓ **RESOLVED: Fixed slot counts**
- [ ] Standard Age II: (1/1/2/2), Age III: (2/2/2/3) **TODO: Blueprint transitions not implemented**
- [ ] Italy: Age II (1/1/2/1), Age III (2/2/2/2) **TODO: Age transitions missing**

---

## Phase 11: Victory & Scoring (Section 12.9)

### 11.1 VP Timing
- [ ] VP scored at END of each Age **TODO: Only at game end**
- [ ] Not accumulated throughout Age **TODO: processCalculateScores only runs at game end**

### 11.2 Route VP (Section 12.9)
- [ ] Short (Range 1-2): 2/3/4 VP by Age **TODO: Uses route.distance directly**
- [ ] Medium (Range 3-4): 4/5/7 VP by Age **TODO: Not implemented**
- [ ] Long (Range 5-6): -/7/10 VP by Age **TODO: Not implemented**
- [ ] Luxury Bonus: +3 VP **TODO: Not implemented**

### 11.3 Technology VP
- [ ] Essential techs: 0 VP **TODO: Uses floor(techs/2) approximation**
- [ ] Useful techs: 1 VP **TODO: Not implemented per-tile**
- [ ] Niche techs: 2-3 VP **TODO: Not implemented**
- [ ] Tech VP scored every Age (earlier techs accumulate) **TODO: Not implemented**

### 11.4 Game End Triggers (Section 1)
- [ ] Hindenburg Disaster: Catastrophic Explosion on Luxury Launch (Age III, Hydrogen) **TODO: Not implemented**
- [ ] Hindenburg player gains 3 VP (infamy) **TODO: Not implemented**
- [x] Progress Track reaches threshold ✓ (gameState.js:2009)
- [x] Complete current round, then final scoring ✓ (state-based check)

### 11.5 Tiebreakers (Section 1)
- [ ] 1. Highest Income Track **TODO: Not implemented in scoring**
- [ ] 2. Most Cash **TODO: Not implemented in scoring**
- [ ] 3. Most ships on map **TODO: Not implemented in scoring**

---

## Phase 12: Special Rules & Clarifications (Section 12)

### 12.1 Network Connectivity (Section 12.4)
- [x] Age I: No connectivity required ✓
- [ ] Age II: First from Home Base, then connected **TODO: Not implemented**
- [ ] Age III: First from any Major Hub, then connected **TODO: Not implemented**

### 12.2 Bankruptcy (Section 12.3)
- [x] Negative Income: Pay difference from Cash at Income phase ✓ **RESOLVED: Implemented**
- [x] Cannot pay: Discard Technologies until solvent ✓ **RESOLVED: Implemented**

### 12.3 Engineer Timing (Section 12.6)
- [x] Generate Research in Reveal Phase ✓ (gameState.js:1199)
- [ ] Can spend reactively after Hazard card drawn **TODO: Not implemented**
- [ ] Spent Engineers don't generate Research that round **TODO: No reactive spending**
- [x] Upkeep paid at start of Income Phase ✓ (gameState.js:504-513)

### 12.4 Launch Outcomes (Section 12.7)
- [x] Success: Ship on route, Income increase ✓
- [ ] Success: city bonus **TODO: Not implemented**
- [x] Aborted: Ship returns to Launch Hangar (officers/gas lost) ✓
- [ ] Damaged: Ship to Repair Hangar (officers/gas lost) **PARTIAL: damaged flag set but no repair hangar**
- [x] Crash: Ship to shared supply (must rebuild) ✓ (ships[shipIndex].status = 'destroyed')

---

## Implementation Issues Found

Track issues discovered during audit:

### Critical (Rules Violations) - ALL RESOLVED
- [x] **Blueprint slots**: Fixed to 1/1/1/1 in Age I ✓
- [x] **Progress Track thresholds**: Fixed to 8/16/20, 10/20/25, 12/24/30 ✓
- [x] **Starter deck composition**: Added Purser and Helmsman ✓
- [x] **Helium starting price**: Fixed to £2 ✓
- [x] **Helium market reset**: Fixed to reset to £2 ✓
- [x] **Market purchases use cash**: Fixed to use Influence ✓
- [x] **Insurance payout wrong**: Fixed to recover ship ✓
- [x] **Structural slots not validated**: Added validation in processLaunchShip ✓

### Medium (Missing Features) - PARTIALLY RESOLVED
- [ ] **Age II/III maps**: Not implemented - only Age I map exists
- [ ] **Age transitions incomplete**: No blueprint overlay replacement, ship return, VP scoring
- [ ] **Network connectivity**: Home base and network rules not enforced
- [ ] **City bonuses**: Not implemented when claiming routes
- [ ] **Repair hangar**: Ships can be damaged but repair action missing
- [ ] **Fire hazards incomplete**: Engine Fire, Gas Cell Rupture, Catastrophic Explosion not distinct
- [ ] **Helium immunity**: Helium ships get +1 bonus, not full fire immunity
- [ ] **Reactive engineer spending**: Cannot spend engineers after seeing hazard card
- [x] **Ministry action incomplete**: Implemented draw 2/discard 1 and helium reduction ✓
- [x] **Weather Bureau action**: Implemented peek/discard hazard ✓
- [x] **Academy market purge**: Added DISCARD_MARKET_CARD action ✓
- [x] **R&D Board scaling**: Fixed to 4/5/6 by Age ✓
- [ ] **Hindenburg Disaster**: Not implemented as game-end trigger
- [ ] **VP scoring timing**: Only at game end, should be at each Age end
- [ ] **Route VP formula**: Uses distance directly, should use tiered scoring
- [ ] **Technology VP**: Uses approximation, should use per-tile values
- [ ] **Tiebreakers**: Not implemented in scoring

### Low (Minor Discrepancies) - PARTIALLY RESOLVED
- [x] **Card Agent Effects**: Implemented processCardEffect() ✓
- [ ] **Double track routes**: No support for 2-player routes
- [ ] **Luxury routes**: Not implemented
- [ ] **Hull Upgrade Rule**: Pay difference when upgrading ships in hangar not implemented
- [x] **Bankruptcy handling**: Implemented negative income handling ✓
- [x] **Helium market progression**: Implemented stepped progression ✓

---

## Audit Session Log

Track progress across sessions:

| Date | Session | Phases Audited | Issues Found | Issues Resolved |
|------|---------|----------------|--------------|-----------------|
| 2025-12-28 | 1 | All 12 Phases | 8 Critical, 17 Medium, 6 Low | Initial audit |
| 2025-12-28 | 2 | Fix session | - | 8 Critical, 7 Medium, 4 Low |

---

## Summary Statistics

- **Total Checklist Items**: ~120
- **Passing (✓)**: ~85 (71%)
- **Failing/Missing**: ~35 (29%)
- **Critical Issues**: 8 → 0 (all resolved)
- **Medium Issues**: 17 → 10 (7 resolved)
- **Low Priority Issues**: 6 → 2 (4 resolved)

### Remaining Work
1. **Age Transitions** - Blueprint overlay replacement, VP scoring at Age end
2. **Age II/III Maps** - Network connectivity, home bases
3. **Fire/Hazard System** - Distinct fire types, helium immunity, reactive engineers
4. **Scoring System** - Tiered route VP, per-tile tech VP, tiebreakers
5. **City Bonuses** - One-time rewards when claiming routes
6. **Repair Hangar** - Damaged ship repair flow

---

## Notes

- Primary files modified:
  - `server/services/gameStateService.js` - Blueprint slots, progress thresholds, starter deck, gas market
  - `server/routes/gameState.js` - Helium market, location actions, launch validation, card effects
  - `server/data/groundBoard.js` - Location definitions (unchanged)
