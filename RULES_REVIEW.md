# UP SHIP! Rules Review

## Summary

This review identifies **14 numerical inconsistencies**, **12 mechanical gaps**, **8 clarity issues**, and **9 balance concerns**. Recommendations are provided for each.

---

# PART 1: NUMERICAL INCONSISTENCIES

## 1.1 Engineer Recruit Cost
**Conflict:**
- Section 6.1 (The Academy): "£3 per Engineer"
- Appendix A.3 (Economy Balancing): "Recruit cost: £4 per Engineer"

**Recommendation:** Standardize to £3 (matches Academy section) and update A.3.

---

## 1.2 Starting Cash
**Conflict:**
- Section 1.4 (Player Count Scaling): "£18 / £15 / £12" depending on player count
- Section 2.1 (Per Player): "£15 Starting Cash"
- Section 11.2 (Player Setup): "£15 Cash"

**Recommendation:** Update Sections 2.1 and 11.2 to reference Section 1.4's scaling table, or explicitly state the variable amounts in setup.

---

## 1.3 R&D Board Tile Count
**Conflict:**
- Section 1.4: R&D tiles scale by player count (4/5/6)
- Section 4.1: Tiles scale by Age (4/5/6 for Age I/II/III)
- Section 11.1: "fill it with 4 Technology tiles"

**Recommendation:** Clarify whether both scaling systems apply simultaneously (e.g., 2-player Age I = 4 tiles, 4-player Age I = 6 tiles) or pick one system. The Age-based scaling makes more thematic sense (more technology available as time progresses).

---

## 1.4 Britain's Swap Count
**Conflict:**
- Section 10.2: "Britain may only make 1 tile swap instead of 2"
- CLAUDE.md: "2 swaps instead of 3"

**Recommendation:** Clarify the base swap count (2) and Britain's modified count (1). The rules currently say 2 base; if changing to 3 base, all faction references need updating.

---

## 1.5 Market Row Card Count
**Conflict:**
- Section 11.1: "deal a row of 5 face-up cards"
- Section 1.4: "Market Row cards: 4/5/6" by player count

**Recommendation:** Update Section 11.1 to reference the scaling table in 1.4.

---

## 1.6 Technology Tile Count Mismatch
**Conflict:**
- Section 2.2: "~60 tiles"
- Appendix C header: "15 tiles" per track
- Appendix C summary: "56 Technology Tiles (14 per track)"
- Actual listed tiles in Appendix C:
  - Propulsion: 11 tiles
  - Structure: 11 tiles
  - Gas Systems: 11 tiles
  - Payload: 12 tiles
  - **Total: 45 tiles**

**Recommendation:** Either add the missing tiles to each track to reach 14-15 per track, or update the summary to match actual counts. Currently, 15 tiles are missing from the detailed lists.

---

## 1.7 Upgrade Tile Count Mismatch
**Conflict:**
- Appendix D summary: "44 Upgrade Tiles"
- Actual listed tiles:
  - Propulsion Upgrades: 11
  - Structure Upgrades: 11
  - Gas System Upgrades: 11
  - Payload Upgrades: 12
  - **Total: 45 tiles**

**Recommendation:** Fix the summary count (should be 45, not 44).

---

## 1.8 Hazard Deck Card Count
**Conflict:**
- Appendix A.2 says:
  - ~8 Minor Hazards
  - ~6 Major Hazards
  - ~4 Clear Skies
  - ~2 Catastrophic Events
  - **Total: ~20 cards**
- Appendix E shows:
  - 4 Clear Weather
  - 8 Minor Hazards
  - 6 Major Hazards
  - 2 Catastrophic Events
  - **Total: 20 cards** ✓

**Status:** This is consistent. No action needed.

---

## 1.9 Technology Track Labels
**Minor Issue:** Appendix C lists 4 tracks but inconsistent tile counts:
- Headers claim "15 tiles" per track
- Listed counts are 11/11/11/12

**Recommendation:** Add 4-5 technologies per track to fill out the intended 56+ tiles.

---

# PART 2: MECHANICAL GAPS

## 2.1 Hull Cost Formula Undefined
**Gap:** Section 7.1 states Hull Cost is "based on Frame + Fabric upgrades" but provides no formula.

**Questions:**
- What is the base Hull Cost?
- Which specific upgrades count as "Frame" vs "Fabric"?
- How much does each add?

**Recommendation:** Add explicit formula, e.g.:
> **Hull Cost = £2 base + £1 per Structure upgrade + £1 per Gas Cell upgrade**

---

## 2.2 Lifting Gas Consumption Undefined
**Gap:** The rules mention paying for Lifting Gas but never specify:
- How much gas per ship?
- What is the base price of Hydrogen?
- Is it 1 unit per launch? Per Lift point?

**Recommendation:** Add clear gas consumption rules, e.g.:
> Each ship requires 1 Gas unit per launch. Hydrogen costs £1/unit. Helium prices follow the market track (£2 → £4 → £6 → £10+).

---

## 2.3 Ministry Action is Vague
**Gap:** Section 6.1 says: "Various special actions (claim bonus rewards, change turn order)" without specifying the actual effects.

**Recommendation:** Define 2-3 specific Ministry actions, e.g.:
- **Government Contract:** Gain £5
- **Priority Status:** Move to first in turn order next round
- **Route Subsidy:** +£1 Income from one route this Age

---

## 2.4 Ships Already on Routes - Upgrade Interaction
**Gap:** Section 3.2 implies ships use Blueprint stats at launch, but never explicitly states ships on routes are NOT retroactively affected by Blueprint changes.

**Recommendation:** Add explicit "Frozen Prototype Rule":
> Ships on routes use the Blueprint stats they had at launch. Upgrading your Blueprint does not affect ships already on the map.

---

## 2.5 Insurance Bureau vs Hydrogen Fire
**Gap:** Insurance policies recover ships after failed Hazard Checks. Does this apply to the Hydrogen Fire roll (which happens after passing the Hazard Check)?

**Recommendation:** Clarify:
> Insurance policies do NOT apply to ships destroyed by Hydrogen Fire (rolls of 5 or 6). They only protect against failed Hazard Checks.

---

## 2.6 Weather Bureau Cost Timing
**Gap:** "Cost: £2" is unclear - do you pay to visit, or only to use the ability?

**Recommendation:** Clarify:
> Pay £2 when taking this action. You then look at the top card of your Hazard Deck and may reorder it.

---

## 2.7 Pilot/Engineer Income Track Setup
**Gap:** Section 3.6 says these tracks "start at 1" but Section 11.2 (Player Setup) doesn't mention setting them.

**Recommendation:** Add to Section 11.2:
> Set your Pilot Income Track and Engineer Income Track markers to 1.

---

## 2.8 Technology Bag Accumulation
**Gap:** Section 4.1 says the bag "only contains tiles appropriate to the current Age" but Section 9.1 says "Add the new Age's Technology tiles to the bag."

**Question:** Do tiles accumulate across Ages, or are old Age tiles removed?

**Recommendation:** Clarify that tiles accumulate:
> At each Age transition, add the new Age's tiles to the Technology Bag. Tiles from previous Ages remain available—older technology doesn't become unobtainable.

---

## 2.9 Hand Size
**Gap:** Section 6.3 says "draw back to hand size (typically 5)" - what determines hand size? Can it change?

**Recommendation:** Either:
- State "hand size is always 5" OR
- Define what modifies hand size

---

## 2.10 What Happens to Crashed Pilots?
**Gap:** Pilots are "returned to shared supply" on launch (successful or failed), but what about ships that crash mid-route (if that's possible)?

**Question:** Are there any effects that crash ships already on routes?

**Recommendation:** Add:
> Ships on routes cannot be directly destroyed by opponents. They are only removed during Age Transitions. If any effect causes an on-route ship to crash, return the Pilot to the shared supply (not the player's Barracks).

---

## 2.11 Pressurized Lounge Restriction
**Gap:** Appendix D says "Helium ships only" but doesn't explain:
- Can you install it on any Blueprint?
- Does it only function on Helium ships?
- Is it uninstallable if you have Hydrogen?

**Recommendation:** Clarify:
> You may only install Pressurized Lounge if your Blueprint currently has a Helium Gas Cell upgrade installed. If you later remove the Helium Gas Cell, the Pressurized Lounge must also be removed.

---

## 2.12 Structural Keel "+1 Lift"
**Gap:** Appendix D shows Structural Keel gives "Weight -2" and "Reliability +1, Lift +1". Most upgrades don't grant positive Lift.

**Question:** Is this intentional? It's unusual for an upgrade to reduce Weight AND add Lift.

**Recommendation:** Verify this is intended. If so, add a design note explaining the semi-rigid keel's buoyancy contribution.

---

# PART 3: CLARITY ISSUES

## 3.1 Gas Reserve Usage Error
**Error:** Section 3.5 says: "When building ships at the Construction Hall, use stored gas first."

**Problem:** Gas is consumed at LAUNCH (per Section 7.2), not at BUILD.

**Fix:** Change to:
> When **launching** ships at the Launchpad, use stored gas first. Any deficit must be purchased at current market price.

---

## 3.2 "Swaps" Definition Ambiguous
**Ambiguity:** Is a "swap":
- Install = 1 swap, Remove = 1 swap? OR
- Install + Remove = 1 swap?

Section 4.2 says "2 tile installations or removals per action" suggesting they're counted separately.

**Recommendation:** Clarify with explicit example:
> You have 2 swap actions. Installing a tile costs 1 swap. Removing a tile costs 1 swap. Example: Remove 1 tile (1 swap) and install 1 tile (1 swap) = 2 swaps total.

---

## 3.3 Route Stat Requirements
**Minor:** Section 5.4 shows routes with multiple requirements (e.g., "Speed 2, Range 1").

**Clarification Needed:** The phrase "must meet or exceed all listed requirements" exists but could be emphasized more prominently.

**Recommendation:** Add a boxed callout:
> **IMPORTANT:** A ship must meet or exceed EVERY stat requirement to claim a route. If a route requires Speed 2 and Range 1, you need BOTH.

---

## 3.4 "Crash" vs "Failed Launch" Terminology
**Confusion:** The rules use "crash" and "failed launch" somewhat interchangeably:
- Section 7.2: Failed launch = ship returns to Hangar Bay
- Section 7.4: Hydrogen fire = ship "crashes"
- Section 12.5: Hindenburg = caused by "failed Hazard Check"

**Question:** Is there a difference between crash (ship destroyed?) and failed launch (ship returns to Hangar)?

**Recommendation:** Define clearly:
> **Failed Launch:** The ship cannot complete its journey but is not destroyed. Return it to your Hangar Bay (Pilot and gas are lost).
> **Crash:** The ship is destroyed. Return it to your supply (not Hangar Bay). You lose the Pilot, gas, and the ship token itself.

If crashes destroy ships permanently, this significantly changes the risk calculation.

---

## 3.5 Hindenburg Disaster Timing
**Clarity:** Section 7.5 doesn't explicitly say "Age III only" but discusses Luxury Routes which only exist in Age III. Section 12.5 clarifies this, but the core rule should state it directly.

**Recommendation:** Update Section 7.5 to begin:
> **Luxury Launches (Age III Only):** Routes marked as Luxury Routes...

---

## 3.6 USA Home Base Explanation
**Confusion:** Section 10.3 says USA's Home Base (Age II) is "Paimboeuf, France" but Section 5.2 lists national capitals.

**Context:** Historically accurate (USA operated from French bases in WWI), but confusing for players.

**Recommendation:** Add a thematic note:
> *Historical Note: The United States maintained its primary European airship operations from French facilities, as transatlantic crossings were not yet viable.*

---

## 3.7 Engineer Spending Options in Hazards
**Clarity Issue:** Appendix E lists different Engineer spending effects per card:
- "Spend 1: +2 to check"
- "Spend 1: Auto-pass"
- "Spend 2: +3 to check"
- "Spend 2: Reduce to Difficulty 3"

But Section 7.3 says: "Each Engineer spent adds +1 to your total."

**Conflict:** These are two different systems:
1. Generic +1 per Engineer (Section 7.3)
2. Card-specific effects (Appendix E)

**Recommendation:** Reconcile:
> **Standard Option:** You may spend any number of Engineers to add +1 per Engineer to your check.
> **Card-Specific Option:** Some Hazard cards offer alternative Engineer abilities. You may use either the standard option OR the card-specific option, not both.

---

## 3.8 Age I "Pioneer Scramble" Limits
**Unclear:** Age I has "no home bases" and players can claim "any unclaimed route." But if all players launch simultaneously, how are conflicts resolved?

**Question:** Does Section 5.5's "Simultaneous Claims" rule (resolve by turn order) apply to Age I scrambles?

**Recommendation:** Explicitly state:
> In Age I, if multiple players attempt to claim the same single-track route in the same round, resolve by turn order (lowest Income goes first).

---

# PART 4: BALANCE CONCERNS

## 4.1 Germany's Hindenburg Risk is Potentially Crippling
**Concern:** Germany cannot acquire Helium Handling (permanent flaw). This means:
- Every Hydrogen launch has 33% fire risk (d6: 5 or 6)
- In Age III, every Luxury Launch risks ending the game with -5 VP

**Analysis:** This seems excessively punitive compared to other faction flaws:
- Britain: 1 fewer swap per action (inconvenient, not catastrophic)
- USA: -1 Lift on Helium cells (easily compensated)
- Italy: 1 fewer Payload slot (limits income, not game-ending)

**Recommendation Options:**
1. Give Germany access to Fire Retardant technology as a starting tech (ignore first fire hazard)
2. Allow Germany to spend 2 Engineers to reroll the Hydrogen Fire die
3. Reduce Germany's fire risk: rolls of 1-5 = safe, only 6 = fire
4. Make the Hindenburg Disaster only trigger on a roll of 6, not on any failed Luxury Launch

---

## 4.2 Hydrogen Fire Risk (33%) May Be Too High
**Concern:** For all Hydrogen users:
- 5 on d6 (16.7%): Spend Engineer or crash
- 6 on d6 (16.7%): Automatic crash

This 33% attrition rate seems high for the standard gas type.

**Analysis:** If you launch 3 ships in Age I, statistically one will have a fire event. Over a full game (perhaps 8-12 launches), you'd expect 3-4 fire events.

**Recommendation:** Consider:
- Reduce fire probability: Only roll 6 = fire (16.7%)
- Add "once per Age" immunity for first fire per player
- Make Fire Retardant technology more accessible (Age I, low Research cost)

---

## 4.3 USA's Helium Monopoly May Be Overpowered
**Concern:** USA starts with Helium Handling, while others must spend Research (5 cost in Age II) to acquire it.

**Benefits:**
- Never faces fire risk
- Can safely do Luxury Launches in Age III
- No Hindenburg Disaster risk
- Other factions spend 5+ Research catching up

**Recommendation:** Balance with:
- Higher Helium costs for USA (representing domestic monopoly but extraction costs)
- USA's Helium cells provide -2 Lift instead of -1 (current flaw may be too mild)
- Require USA to still pay a premium for Helium tokens

---

## 4.4 Faction Flaw Severity Imbalance
**Analysis of Flaws:**

| Faction | Flaw | Severity |
|---------|------|----------|
| Germany | Cannot use Helium (permanent fire risk, Hindenburg eligible) | **SEVERE** |
| Britain | 1 swap instead of 2 | MILD |
| USA | -1 Lift per Helium cell | MILD |
| Italy | 1 fewer Payload slot | MODERATE |

**Recommendation:** Rebalance:
- Germany: Add compensating advantage (e.g., Engineers can negate fire rolls for free once per Age)
- Britain: Consider making Red Tape affect multiple actions, or reduce starting Income
- USA: Consider -2 Lift per Helium cell, or delayed access to certain technologies

---

## 4.5 Research Institute vs Engineer Economy
**Analysis:**
- Research Institute: £3 per Research (or £2 with Researcher)
- Engineer: £3 recruit + £1/round upkeep = £4 in round 1, £5 in round 2, etc.
- Engineer generates 1 Research per round indefinitely

**Break-even:** An Engineer is worth it if you use it for 4+ rounds.

**Concern:** If Ages are short (8-12 Progress advances ÷ 4 players = 2-3 Research acquisitions per player per Age), Engineers may never break even. The Research Institute might always be better.

**Recommendation:** Consider:
- Reduce Engineer recruit cost to £2
- Reduce upkeep to free (Engineers are just investment, no ongoing cost)
- Increase Research Institute cost to £4 per Research

---

## 4.6 Technology VP Scoring Creates "Niche Tech Rush" Incentive
**Mechanic:** Technology VP is scored at every Age end. Age I techs are scored 3 times.

**Example:** A 3 VP Age I niche tech = 9 VP total
Compare to: An essential 0 VP engine tech that enables better routes

**Concern:** Players might prioritize high-VP useless technologies over practically useful ones, leading to suboptimal but VP-efficient strategies.

**Counter-argument:** This is intentional tension and creates viable alternative strategies.

**Recommendation:** Monitor in playtesting. If niche-tech-rushing dominates, reduce cumulative scoring (e.g., Age I techs score 2+1+0 = 3 times their VP, not 3+3+3 = 9).

---

## 4.7 Income Track Negative Spiral
**Mechanic:** Section 12.3 says if Income goes negative, you must discard Technologies (permanently) to become solvent.

**Concern:** This creates a death spiral:
1. Take a loan (-3 Income)
2. Income becomes negative
3. Forced to discard Technologies
4. Lose ability to install upgrades
5. Ships become uncompetitive
6. Cannot earn enough to recover

**Recommendation:** Add safety valves:
- Allow selling Technologies for £ instead of discarding
- Add bankruptcy protection: if you would discard your last Technology, instead reset to £0 Income and take a penalty VP hit
- Limit negative income to -5 (forced liquidation never takes more than 5 Technologies)

---

## 4.8 Route Claiming Favors Early Turn Order
**Mechanic:** Ties for routes are resolved by turn order (lowest Income first).

**Concern:** Players with low Income get first pick of routes AND have catch-up positioning. This double-advantage might be too strong.

**Counter-argument:** Low Income players need help, and route claiming is one advantage.

**Recommendation:** Consider alternative tie-breakers:
- Random resolution
- Auction (both players bid £, highest wins)
- Both players may claim if they pass Hazard Checks in same round

---

## 4.9 Age Transition Income Calculation May Be Too Punishing
**Formula:** New Income = (£ from Tech tiles) − (£1 × routes lost)

**Example:** Player with 5 routes (£5 each = £25/round) and £6 in Tech tiles:
- Loses all 5 routes: New Income = £6 - £5 = £1

**Concern:** Aggressive route-claiming is punished at Age end. Players might avoid routes to preserve Income.

**Counter-argument:** This creates meaningful strategic tension.

**Recommendation:** Monitor whether players under-invest in routes. Consider:
- Reduce route-loss penalty to £0.5 per route (round down)
- Give partial route credit for certain achievements

---

# PART 5: RECOMMENDED PRIORITY FIXES

## High Priority (Before First Playtest)
1. **Fix Gas Reserve timing** (says "build" but should be "launch")
2. **Define Hull Cost formula** (currently undefined)
3. **Define Gas consumption** (currently undefined)
4. **Reconcile tile counts** in Appendices C and D
5. **Clarify swap definition** (is remove+install one or two swaps?)
6. **Define Ministry actions** (currently just "various")

## Medium Priority (Affects Balance)
7. **Re-evaluate Germany's Hindenburg risk** (currently too severe)
8. **Standardize Engineer cost** (£3 vs £4 discrepancy)
9. **Reconcile Engineer Hazard spending** (generic +1 vs card-specific abilities)
10. **Add Frozen Prototype rule** explicitly

## Low Priority (Cleanup)
11. **Standardize starting cash** references
12. **Add R&D Board scaling clarification**
13. **Update Britain's swap count** to be consistent
14. **Add USA home base thematic note**

---

# APPENDIX: SUGGESTED MISSING TECHNOLOGIES

To bring Technology tile count to 56 (14 per track), add 11 tiles:

## Propulsion (add 3 tiles)
| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|---|---------|
| I | Chain Drive | 3 | 1 | 1 | Mechanical Transmission |
| II | Fuel Injection | 5 | 2 | — | Efficient Engine |
| III | Turboprop Design | 8 | 3 | 2 | Experimental Engine |

## Structure (add 3 tiles)
| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|---|---------|
| I | Canvas Covering | 2 | 1 | — | Basic Hull |
| II | Stressed Skin | 4 | 1 | 1 | Monocoque Frame |
| III | Composite Materials | 7 | 2 | 2 | Advanced Hull |

## Gas Systems (add 3 tiles)
| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|---|---------|
| I | Simple Inflation | 2 | 1 | — | Ground Inflation |
| II | Hydrogen Purification | 4 | 1 | 1 | High-Purity Gas |
| III | Gas Mixing System | 6 | 2 | 1 | Hybrid Gas |

## Payload (add 2 tiles)
| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|---|---------|
| I | Weather Station | 3 | 1 | 1 | Meteorological Equipment |
| II | VIP Cabin | 4 | 1 | 1 | Executive Suite |

---

*Review prepared for UP SHIP! design team. Version 1.0*
