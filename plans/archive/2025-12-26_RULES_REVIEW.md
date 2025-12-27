# UP SHIP! Rules Review

*Review date: 2025-12-26*

## Overview

This comprehensive review of the UP SHIP! rules document (upship_rules.md) examines the game design for clarity, completeness, balance, and playability. The rules demonstrate strong thematic integration and sophisticated mechanical design, but several areas require attention before playtesting.

**Key Findings:**
- 4 Critical issues that could prevent play or cause major confusion
- 8 Important issues that create inconsistency or ambiguity
- 12 Moderate polish items
- 8 Low-priority items for completeness
- Multiple balance observations requiring playtest validation

The rules excel at integrating historical theme with mechanics, creating meaningful player tension, and providing clear win conditions. The primary concerns involve missing upgrade tiles, conflicting hazard card/fire roll mechanics, and several numerical inconsistencies.

---

## Critical Issues

### Dual Fire Mechanics Create Confusion

**Location:** Section 7.3, Section 7.4, Appendix E

**Problem:** The rules contain TWO separate fire-related mechanics that overlap confusingly:

1. **Hazard Cards** (Appendix E): "Hydrogen Fire" is a Catastrophic Event card with Difficulty 6 against Reliability. You can spend Engineers to meet this check.

2. **Fire Roll** (Section 7.4): After passing ANY Hazard Check, Hydrogen ships roll a d6. Rolling 5 requires spending an Engineer; rolling 6 is an automatic crash.

This creates ambiguity:
- If you draw the "Hydrogen Fire" hazard card and pass the Difficulty 6 check, do you ALSO roll the d6 Fire Roll?
- Are these meant to stack, creating double fire risk?
- Section 12.7 says "Catastrophic Event Hazard Card destroys the ship" - but the card has a Difficulty rating implying it can be passed.

**Remedy Options:**
1. Remove "Hydrogen Fire" from Hazard deck - let the Fire Roll handle all hydrogen fire risk
2. Clarify that Catastrophic Events are auto-fail regardless of difficulty (and remove the difficulty number)
3. Make the Hazard Card fire and the Fire Roll mutually exclusive (draw Hydrogen Fire = skip Fire Roll)

**Priority:** Critical - this could cause rule disputes during play

---

### Missing Upgrade Tiles in Appendix D

**Location:** Section 10.2, Section 10.4, Appendix D

**Problem:** Several faction-specific upgrades mentioned in Section 10 do not appear in the Upgrade Tiles appendix:

1. **Imperial Mast** (Britain) - Section 10.2 says "Imperial Mooring System" technology "Unlocks the Imperial Mast upgrade: Treat any British Territory as a Home Base." This upgrade is not listed in Appendix D.

2. **Flexible Frame** (Italy) - Section 10.4 says "Articulated Keel Design" unlocks "Flexible Frame upgrade: Ignore Weather penalties on Hazard cards." This upgrade is not listed in Appendix D.

Players cannot install these upgrades if they don't exist in the Upgrade Supply.

**Remedy:** Add the missing upgrade tiles to Appendix D:
- Imperial Mast: Required Tech = Imperial Mooring System, Weight = ?, Stats = ?, Special = "Treat British Territories as Home Base"
- Flexible Frame: Required Tech = Articulated Keel Design, Weight = ?, Stats = ?, Special = "Ignore Weather penalties"

**Priority:** Critical - faction abilities are non-functional without these tiles

---

### Catastrophic Event Outcome Ambiguity

**Location:** Section 7.3, Section 12.7, Appendix E

**Problem:** Section 12.7 states: "A Catastrophic Event Hazard Card destroys the ship." However, Appendix E shows Catastrophic Events (Hydrogen Fire, Structural Failure) with Difficulty 6 ratings and stat requirements.

This is contradictory:
- If Catastrophic Events auto-destroy ships, why do they have Difficulty ratings?
- If they can be passed with sufficient stats/Engineers, why does Section 12.7 say they "destroy the ship"?

**Remedy Options:**
1. Clarify that Catastrophic Events are auto-crashes (remove the Difficulty ratings from the cards)
2. Clarify that Catastrophic Events CAN be passed, but if failed, result in a crash (not just an aborted launch)
3. Create a third outcome category: Catastrophic failures that destroy ships even if you meet the Difficulty

**Priority:** Critical - determines whether ships can survive these cards

---

### Gas Cube Placement Timing Unclear

**Location:** Section 3.2, Section 4.4, Section 7.2

**Problem:** The rules explain that Frame tiles have "gas cube sockets" where Hydrogen or Helium cubes are placed for Lift. However, the timing of when gas cubes are placed is ambiguous.

Section 4.4 says: "When you launch a ship, you must place one gas cube (from your Gas Reserve) on each Frame slot."

But Section 7.2 (Launch Procedure) Step 3 says only: "Pay for Lifting Gas (use Gas Reserve first; any deficit at current market price)."

Questions arise:
- Are gas cubes placed on the Blueprint during launch, or are they "spent" from the Gas Reserve?
- If placed on the Blueprint, do they remain there? (This would mean the Blueprint changes after each launch)
- Does "pay for gas" mean physical cube placement, or monetary payment?

**Remedy:** Clarify in Section 7.2 Step 3:
- "Spend Lifting Gas: Place one gas cube from your Gas Reserve (or purchase at market price) on each Frame slot of your Blueprint. These cubes are consumed for this launch and returned to the supply."

OR if cubes track individual ships:
- Explain that launched ships carry their gas cubes to the map.

**Priority:** Critical - affects core Physics Check and launch procedure

---

## Important Issues

### Britain's Red Tape Flaw: Conflicting Values

**Location:** Section 10.2, CLAUDE.md

**Problem:** Section 10.2 states Britain's "Red Tape" flaw: "When taking the Upgrade Action at the Design Bureau, Britain may only make 1 tile swap instead of 2."

However, CLAUDE.md states: "Britain... 2 swaps instead of 3."

These give different mechanical effects:
- Rules version: Britain gets 1 swap (base 2 - 1 = 1)
- CLAUDE.md version: Britain gets 2 swaps (base 3 - 1 = 2)

Section 6.1 (Design Bureau) confirms base is "2 tile swaps per action."

**Remedy:** Update CLAUDE.md to match the rules (1 swap, not 2), or clarify if Italy's "Rapid Refit" (4 swaps) sets the implicit baseline for all factions.

**Priority:** Important - faction balance depends on correct values

---

### Research: Tokens vs. Calculated Budget

**Location:** Section 4.1, Section 6.2

**Problem:** The rules inconsistently describe Research as both physical tokens and a calculated value:

- Section 4.1: "Unspent Research **tokens** carry over to the next round"
- Section 6.2 Step 3: "**Calculate** Research Budget... Unspent Research tokens are saved"
- Section 6.2 Step 2: Gain "Research" from card reveal icons

If Research is calculated from Engineers + card bonuses each round, what does "saving tokens" mean? Are saved tokens physical components added to the calculated budget?

**Remedy:** Clarify the Research economy:
- Option A: Research is a calculated budget each round. Players who acquire Research tokens (from cards, purchases) add them to this budget. Unspent tokens persist.
- Option B: Research is entirely token-based. Engineers produce Research tokens during Reveal Phase.

Add explicit language about what form Research takes physically.

**Priority:** Important - affects core acquisition loop

---

### Market Row Refresh: Discard or Refill?

**Location:** Section 6.3, Appendix F

**Problem:** Two sections give conflicting instructions:

- Section 6.3 Step 8: "Refill Markets: Refill the Card Market Row"
- Appendix F: "At the end of each round, discard any remaining cards in the Market Row and deal 5 new cards"

Does the Market Row:
1. Get topped up (unfilled slots only)?
2. Get completely wiped and replaced?

**Remedy:** Align these sections. Choose one approach and update both locations.

**Priority:** Important - affects card availability strategy

---

### Required Slots Not in Launch Procedure

**Location:** Section 3.2, Section 7.2

**Problem:** Section 3.2 states: "You must fill all Frame and Fabric slots before launching. Empty structural slots mean the ship isn't airworthy."

However, Section 7.2 (Launch Procedure) doesn't include this check. Step 1 only mentions "Verify Physics Check (Total Lift >= Total Weight)."

**Remedy:** Either:
1. Add to Section 7.2 Step 1: "Verify Physics Check (Lift >= Weight) AND all Frame/Fabric slots are filled"
2. Clarify in Section 3.2 that filling structural slots is enforced BY the Physics Check (empty slots = insufficient Lift)

**Priority:** Important - affects launch validity

---

### Insurance Bureau vs. Aborted Launches

**Location:** Section 6.1 (Insurance Bureau), Section 12.7

**Problem:** The Insurance Bureau states policies recover ships when they "crash (from a failed Fire Roll or Catastrophic Hazard)."

Section 12.7 distinguishes:
- **Crash**: Ship destroyed (Fire Roll failure, Catastrophic Events)
- **Aborted Launch**: Ship returns to Hangar (failed Hazard Check)

This implies insurance does NOT help with failed Hazard Checks (aborted launches). Is this intentional?

**Remedy:** Add explicit clarification: "Insurance policies only apply to crashes (ship destruction), not aborted launches from failed Hazard Checks."

**Priority:** Important - affects insurance value proposition

---

### Germany's Age II Starting Technologies

**Location:** Section 10.1, Appendix C

**Problem:** Germany starts with "Goldbeater's Skin" technology, which Appendix C lists as an Age II technology (Cost 4).

Questions:
- Does Germany begin the game with an Age II tech?
- Do faction starting technologies count toward Progress Track advancement?
- Is this intentional asymmetry (Germany starts further along)?

Similar question applies to other factions with technologies that may be Age II.

**Remedy:** Add a clarifying note: "Faction starting technologies are pre-printed on Player Boards and do NOT advance the Progress Track. These represent historical knowledge predating the game."

**Priority:** Important - affects game pacing and faction balance

---

### Hangar Bay Capacity vs. Build Limit Interaction

**Location:** Section 3.4, Section 6.1

**Problem:** Section 3.4 says Hangar Bay holds "Up to 3 ships." Section 6.1 (Construction Hall) says "Build up to 3 ships per action."

What happens if:
- You have 2 ships in Hangar and try to build 3?
- Can you only build to capacity, or can you exceed capacity?

**Remedy:** Add to Construction Hall: "You may only build ships up to your Hangar Bay capacity. (Example: If you have 2 ships, you may build at most 1 more.)"

**Priority:** Important - affects construction strategy

---

### First Round Turn Order Tiebreaker Illogical

**Location:** Section 6.1

**Problem:** Turn order tiebreakers state: "If still tied, maintain previous turn order."

For Round 1, there IS no previous turn order. This creates an edge case with no resolution.

**Remedy:** Add: "For Round 1, if Income and Cash are tied, the player who received the first player token goes first among tied players, with others in clockwise order."

**Priority:** Important - affects game start

---

## Moderate Issues

### UTF-8 Encoding Corruption

**Location:** Line 235 (Section 3.7)

**Problem:** The text shows "Lift â‰¥ Weight" instead of "Lift >= Weight" - UTF-8 encoding has been corrupted.

**Remedy:** Run the encoding fix script (`./scripts/fix-encoding.sh upship_rules.md`) and verify all >= and other special characters render correctly.

**Priority:** Moderate - affects readability

---

### "Any" Symbol Not Defined

**Location:** Section 8.3

**Problem:** The Starter Deck includes "Apprentice" cards with "Any" as their Action Symbol. Section 6.1 defines only Wrench, Coin, and Propeller symbols, but never defines "Any."

**Remedy:** Add to Section 6.1: "Some cards show 'Any' as their Action Symbol. These cards may be used to visit ANY action space, regardless of the space's required symbol."

**Priority:** Moderate - affects card play clarity

---

### Weather Bureau Strategic Intent Unclear

**Location:** Section 6.1 (Weather Bureau)

**Problem:** The Weather Bureau lets you "Look at the top card of your personal Hazard Deck" and optionally discard it. The purpose is implied (plan launches around hazards) but could be clearer.

**Remedy:** Add: "This allows you to preview the hazard you'll face on your NEXT launch from the Launchpad. Plan accordingly, or discard a dangerous hazard to improve your odds."

**Priority:** Moderate - improves strategic clarity

---

### Starting Gas Reserve Unspecified

**Location:** Section 11.2

**Problem:** Player Setup lists starting components but doesn't mention starting Gas Reserve contents. Do players begin with any gas cubes, or is the reserve empty?

**Remedy:** Add to Section 11.2: "Gas Reserve starts empty. Players must purchase gas at the Gas Depot before launching."

OR: "Each player begins with 2 Hydrogen cubes in their Gas Reserve."

**Priority:** Moderate - affects early game

---

### Foundry Icons Mentioned But Unexplained

**Location:** Appendix A.1

**Problem:** Map design notes mention "Foundry icons for cities with industrial bonuses" but the rules never explain what industrial bonuses do or how Foundry icons work.

**Remedy:** Either remove the reference or add a section explaining industrial city bonuses (perhaps reduced Hull Cost or free tile swaps at certain cities).

**Priority:** Moderate - unexplained feature

---

### "Rapid Descent System" vs. "Flexible Frame" Overlap

**Location:** Appendix D, Section 10.4

**Problem:** Two upgrades have similar weather-ignoring effects:
- Rapid Descent System: "Ignore Weather hazards"
- Flexible Frame (Italy): "Ignore Weather penalties on Hazard cards"

Are these identical? Different? Does Italy's version only reduce difficulty while the other auto-passes?

**Remedy:** Clarify the distinction:
- "Ignore Weather hazards" = auto-pass any hazard with Weather type
- "Ignore Weather penalties" = reduces Weather hazard difficulty by X

**Priority:** Moderate - affects upgrade value assessment

---

### Route Forfeit Consequences Unclear

**Location:** Section 5.5

**Problem:** For simultaneous route claims, "Later players may redirect to a different valid route before paying costs, or forfeit their action."

What does "forfeit their action" mean specifically?
- Lose the Launchpad action entirely (wasted)?
- Ship returns to Hangar (like aborted launch)?
- Lose the Pilot/gas already committed?

**Remedy:** Clarify: "If a player forfeits, they do not launch that ship. No Pilot or gas is spent. The ship remains in their Hangar Bay. Their Launchpad action is complete (no further launches this action)."

**Priority:** Moderate - affects competitive situations

---

### Helium Gas Cell Upgrade: Lift Penalty Not Listed

**Location:** Appendix D (Gas Systems)

**Problem:** Section 10.3 states USA's "Heavy Frame" flaw means "All Helium Gas Cell upgrades provide -1 Lift compared to their Hydrogen equivalents."

However, the "Helium Gas Cell" upgrade in Appendix D shows no Lift penalty:
- "Helium Gas Cell: Weight -1, Safe (immune to Fire); use Helium cubes"

The -1 Lift penalty is applied to the gas CUBES (Section 4.4: Helium +3/+5/+7 vs. Hydrogen +4/+6/+8), not the upgrade tile.

**Remedy:** Clarify in Section 10.3 that the -1 Lift is baked into Helium cube values, not applied to the upgrade tile. This is correctly implemented but confusingly worded.

**Priority:** Moderate - improves clarity

---

### Hazard Card Example Format Mismatch

**Location:** Section 7.3, Appendix E

**Problem:** Section 7.3 gives example hazard format:
- "Clear Skies - Auto Pass"

But Appendix E shows:
- "Clear Skies | Auto-pass. No hazard."

Minor format inconsistency in example text vs. actual cards.

**Remedy:** Align the example format with the appendix format.

**Priority:** Moderate - minor inconsistency

---

### Test Pilot Card: Reroll Timing

**Location:** Appendix F

**Problem:** The "Test Pilot" card has Agent Effect: "Reroll Hydrogen Fire die."

When is this card played? The Agent Effect triggers when using the card for worker placement, but the Fire Roll happens at the Launchpad. Does this mean:
1. Play Test Pilot at Launchpad, gain reroll ability for that action's launches?
2. Something else?

**Remedy:** Clarify that playing Test Pilot at the Launchpad grants the reroll ability for all launches during that Launchpad action.

**Priority:** Moderate - card clarity

---

### Hull Upgrade Retrofit Timing

**Location:** Section 7.1

**Problem:** "If you upgrade your Frame or Fabric while ships are in your Hangar Bay, you must pay the difference in Hull Cost for each ship already built."

When is this paid? Immediately during the Upgrade action? Or when launching those ships?

**Remedy:** Clarify: "This additional cost must be paid immediately when the upgrade is installed. If you cannot pay, you cannot install the upgrade."

**Priority:** Moderate - timing clarity

---

## Low Priority Issues

### Technology Tile Count Mismatch

**Location:** Section 2.2, Appendix C

**Problem:** Section 2.2 says "(45 tiles currently, target 60, Age-sorted)" but Appendix C lists 47 tiles (11+7+7+10+12=47).

**Remedy:** Update Section 2.2 to say "(47 tiles currently, target 60, Age-sorted)".

**Priority:** Low - minor inconsistency

---

### Upgrade Tile Count Mismatch

**Location:** Appendix A.1, Appendix D

**Problem:** Appendix A.1 says "~80" Upgrade tiles, but Appendix D lists only 47 (matching Technologies 1:1).

**Remedy:** Update Appendix A.1 to reflect actual current count, or expand Appendix D to target 80.

**Priority:** Low - design note vs. current state

---

### Age I Long Routes in Scoring Table

**Location:** Section 12.9

**Problem:** The Route Scoring table shows "--" for Age I Long routes (Range 5-6). This implies Age I has no long routes, which makes thematic sense (Pioneer Era = short ranges).

However, this should be explicit.

**Remedy:** Add a note: "Age I maps contain no Long routes (Range 5-6); these become available in Age II."

**Priority:** Low - implicit understanding

---

### Smoking Room Helium Requirement

**Location:** Appendix D

**Problem:** The "Pressurized Lounge" (Smoking Room) upgrade has Special: "Requires Helium Gas Cell installed."

This means only USA (with free Helium Handling) or players who acquire Helium Handling can use this upgrade. Germany can NEVER use it (Helium Embargo).

Is this intentional balance? It limits late-game Luxury options for Germany.

**Remedy:** If intentional, no change needed. If not, consider removing the Helium requirement or adding an alternative for Germany (Blaugas-based pressurization?).

**Priority:** Low - faction-specific edge case

---

### Loan Income Reduction vs. Route Loss Cost

**Location:** Section 6.1 (Bank), Section 9.1

**Problem:** Taking a loan reduces Income by 3. Losing routes at Age Transition costs 1 Income per route.

With the Transition Income formula (Tech £ - Route losses), loans create a permanent drag while route losses are offset by Technology holdings.

Are loans appropriately punishing compared to other economic pressures?

**Remedy:** Review during playtesting. Consider if loan penalty should be temporary or create catch-up mechanics for loan-heavy players.

**Priority:** Low - balance consideration

---

### "Frozen Prototype Rule" Location

**Location:** Section 3.2

**Problem:** The "Frozen Prototype Rule" (launched ships retain Blueprint stats from launch moment) appears in Section 3.2 (Blueprint description). This is a critical rule that affects gameplay significantly.

Consider also including it in:
- Section 7.2 (Launch Procedure)
- Appendix B (Quick Reference)

**Remedy:** Add to Section 7.2 Step 7: "Reminder: This ship now uses the Blueprint stats it had at this moment. Future Blueprint changes do not affect ships already on routes (Frozen Prototype Rule)."

**Priority:** Low - rule visibility

---

### Progress Track Advancement from Starting Technologies

**Location:** Section 10 (all factions), Section 1.3

**Problem:** All factions start with 3-4 pre-printed Technologies. If these count toward Progress Track, the game would start with Progress at 12-16 for 4 players, potentially ending Age I immediately.

Clearly they should NOT count, but this isn't explicitly stated.

**Remedy:** Add note: "Faction starting technologies (pre-printed on Player Boards) do not advance the Progress Track. Only Technologies acquired from the R&D Board during play advance Progress."

**Priority:** Low - edge case clarification

---

### Appendix B Quick Reference Incomplete

**Location:** Appendix B

**Problem:** The Quick Reference is comprehensive but missing:
- Faction summary table (starting techs, flaws)
- Slot type definitions
- Market Row mechanics

**Remedy:** Consider adding faction summary and slot definitions to Quick Reference.

**Priority:** Low - optional enhancement

---

## Balance Observations

*These require playtesting to confirm. They are potential concerns, not definitive problems.*

### Progress Track Pacing May Be Too Fast

With Age I ending at 8/10/12 Progress (for 2/3/4 players) and 4 tiles drawn per round, if each player acquires 2 Technologies per round:
- 4 players x 2 techs = 8 Progress per round
- Age I could end in Round 1-2 for 4 players

**Observation:** The specialization discount and Research accumulation might accelerate tech acquisition. Verify Age I lasts enough rounds to feel meaningful.

**Test Focus:** Track how many rounds each Age lasts across various player counts.

---

### Engineer Economy Tension

Engineers cost 4 to recruit, 1/round upkeep, generate 1 Research each.

Alternative: Research Institute lets you buy Research at 3/point (2 with Researcher).

Rough math:
- Engineer over 3 rounds: 4 + 3 (upkeep) = 7 for 3 Research = 2.33/Research
- Research Institute: 3/Research (or 2/Research)

Engineers are cheaper for Research over time BUT have opportunity cost (can be spent on Hazards).

**Observation:** Seems balanced. The emergency spending option creates genuine tension.

**Test Focus:** Watch if players ever use Engineers for emergencies or always hoard for Research.

---

### Germany's Hindenburg Risk vs. USA Safety

Germany:
- Maximum lift capacity
- Every Luxury Launch in Age III: 1/6 Catastrophic Fire (auto-crash + game end), 1/6 Controllable Fire (spend Engineer or crash)
- Total fire rate: 33% per Luxury Launch
- +3 VP for triggering Hindenburg

USA:
- -1 Lift per gas cube (significant in Age III with 2 Frame slots)
- No fire risk ever
- Helium doesn't increase market when they buy

**Observation:** Germany can avoid Luxury Routes in Age III, but these are the most lucrative. USA has stable safety and stable prices. Germany's engineering advantage may not offset Age III limitations.

**Test Focus:** Track Germany vs. USA win rates, especially in Age III heavy games.

---

### Britain's Red Tape Severity

Britain gets 1 swap per Design Bureau visit (vs. 2 standard, 4 Italy).

At 1 swap, Britain needs 2 Design Bureau visits to install 2 tiles. Italy needs only 1 visit for 4 tiles.

**Observation:** This significantly slows Britain's Blueprint development. Their pre-installed Luxury is meant to compensate. Verify Britain doesn't fall behind in Ages II/III when more upgrades are needed.

**Test Focus:** Track Britain Blueprint development pace vs. other factions.

---

### Helium Market Dynamics

Non-USA players advance the Helium Market Track when purchasing.
- Track: 2 > 3 > 4 > 5 > 6 > 8 > 10 > 15
- Resets at Age Transition

If 3 non-USA players each buy 2 Helium cubes in Age II, the track advances 6 steps to 8 (price per cube).

Meanwhile, USA buys at whatever the current price is without advancing it.

**Observation:** USA's advantage compounds as others purchase. In a 4-player game, USA could buy Helium at 2-3 while others pay 6-8.

**Test Focus:** Track Helium prices throughout game. Watch if non-USA players avoid Helium entirely.

---

### Route Income Payback Period

Design target: Ships pay for themselves in 3-5 rounds.

Example Age III Luxury Route (London > New York): 9 Income
Costs: Pilot (2) + Gas (~4 for 2 Helium cubes?) + Hull Cost (~5-8) = ~11-14 total

Payback: 11-14 / 9 Income = 1.2-1.5 rounds

**Observation:** High-value routes may pay back faster than target. Low-value Age I routes may take longer.

**Test Focus:** Track actual ship costs vs. income across all Ages.

---

## Positive Notes

The following elements are well-designed and should be preserved:

### Strong Thematic Integration
The Lift >= Weight Physics Check creates an engineering puzzle that feels like actual airship design. The hydrogen fire risk, Helium scarcity, and faction-specific technologies all reinforce historical accuracy while serving gameplay purposes.

### Elegant Dual-Use Card System
Every card forcing a choice between worker placement (use it now for action) and reveal phase resources (save it for income/Research) creates constant meaningful tension without excessive complexity.

### Meaningful Age Transitions
Losing routes but keeping Technologies forces long-term planning. The Transition Income formula (Tech - Losses) rewards balanced investment. This prevents early-game decisions from being irrelevant.

### No Direct Attacks
Competition through route claiming, technology racing, and efficiency rather than destruction follows Eurogame principles and keeps all players engaged.

### Engineer Dilemma
The choice between using Engineers for Research generation vs. spending them reactively on Hazard emergencies is a genuine meaningful tension that affects both short-term survival and long-term development.

### Multiple Victory Paths
Route control, technology acquisition, faction-specific strategies, and risk tolerance (hydrogen vs. helium) all appear viable without obvious dominance.

### Progressive Complexity Across Ages
Age I (no connectivity, simple routes) teaches basics. Age II (capitals, military) adds strategy. Age III (hubs, luxury, Hindenburg risk) provides climax. This natural progression supports learning.

### Comprehensive Reference Materials
Appendices C-F provide detailed tile/card specifications. Appendix B Quick Reference enables experienced play without rulebook diving. The TODO list (Appendix A) honestly assesses remaining work.

### Clear Game End Conditions
Two distinct triggers (Hindenburg Disaster, Progress Track) with defined procedures prevent ambiguity. The "complete current round" provision ensures fairness.

### Gas Market as Strategic Lever
The Helium Market Track with USA exception creates asymmetric economic gameplay. The Ministry action to reduce prices adds agency. Price resets at Age Transition prevent runaway inflation.

---

## Recommended Priority Order

1. **Critical Issues First:** Resolve dual fire mechanics, add missing upgrades, clarify catastrophic events, define gas cube placement
2. **Important Issues Second:** Fix Britain's flaw wording, clarify Research tokens, align market refresh, add required slots to launch procedure
3. **Moderate Issues:** Fix encoding, define "Any" symbol, clarify strategic intents, specify starting gas
4. **Playtest Focus:** Track Age pacing, engineer usage patterns, faction win rates, Helium market dynamics, route payback periods

---

*This review was conducted using the boardgame-design skill methodology and design-checklist.md validation criteria.*
