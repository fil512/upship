# UP SHIP! Rules Review: Inconsistencies and Gaps

This document identifies inconsistencies, conflicts, and gaps in `upship_rules.md` and provides recommended remedies.

---

## 1. NUMERICAL INCONSISTENCIES

### 1.1 Starting Cash Conflict
**Location:** Section 1.4 vs Section 11.2

| Source | Value |
|--------|-------|
| Section 1.4 (Player Count Scaling) | £18 / £15 / £12 for 2/3/4 players |
| Section 2.1 (Per Player Components) | £15 Starting Cash |
| Section 11.2 (Player Setup) | £15 Cash |

**Impact:** Players won't know correct starting cash for 2P or 4P games.

**Remedy:** Update Section 2.1 and 11.2 to reference Section 1.4's scaling table, or decide on a single value. Recommend keeping the scaling for balance.

---

### 1.2 Engineer Recruit Cost Conflict
**Location:** Section 6.1 vs Appendix A.3

| Source | Cost |
|--------|------|
| Section 6.1 (The Academy) | £3 per Engineer |
| Appendix A.3 (Economy Balancing) | £4 per Engineer |

**Impact:** Players may pay incorrect amount; economy balance affected.

**Remedy:** Decide on canonical cost. £3 is used in the main rules (Section 6.1), so update Appendix A.3 to match.

---

### 1.3 R&D Board Tile Count Conflict
**Location:** Section 1.4 vs Section 4.1

| Source | Tiles Drawn |
|--------|-------------|
| Section 1.4 (Player Count Scaling) | 4/5/6 tiles by **player count** (2P/3P/4P) |
| Section 4.1 (The R&D Board) | 4/5/6 tiles by **Age** (I/II/III) |
| Section 11.1 (Board Setup) | 4 tiles (Age I) |

**Impact:** Two different scaling systems - by player count OR by Age. These conflict.

**Remedy:** Choose one system:
- **Option A (by Age):** More tiles become available as technology advances. Delete player count scaling from Section 1.4.
- **Option B (by Player Count):** More players need more options. Update Section 4.1 to match.
- **Option C (both):** Use the higher of the two values. Add clarifying language.

**Recommendation:** Option A (by Age) is more thematic and easier to remember.

---

### 1.4 Market Row Size Conflict
**Location:** Section 1.4 vs Section 11.1 and Appendix F

| Source | Cards |
|--------|-------|
| Section 1.4 (Player Count Scaling) | 4/5/6 cards by player count |
| Section 11.1 (Board Setup) | 5 face-up cards |
| Section 6.3 (Refresh Markets) | "Refill the Card Market Row" (no number) |
| Appendix F | "Five are displayed in the Market Row" |

**Impact:** 2P and 4P games may have wrong market size.

**Remedy:** Either commit to the scaling table (update 11.1 and Appendix F) or use flat 5 cards (delete scaling from 1.4).

---

### 1.5 Technology Tile Count Discrepancy
**Location:** Section 2.2 vs Appendix C

| Source | Count |
|--------|-------|
| Section 2.2 (Shared Components) | ~60 tiles |
| Appendix C headers | 15 per track (60 implied) |
| Appendix C actual listings | 45 tiles listed |
| Appendix C summary | 56 tiles |

**Impact:** Component list doesn't match actual tile listings.

**Remedy:**
- Count tiles in Appendix C: Propulsion (11), Structure (11), Gas Systems (11), Payload (12) = **45 total**
- Either add 11-15 more tiles to reach 56-60, OR correct the headers and summary
- Headers claim "15 tiles" per track but lists show 11-12 each

---

## 2. MECHANICAL/RULE CONFLICTS

### 2.1 Britain's Design Bureau Swap Limit
**Location:** Section 10.2

The same section contains conflicting information:
- Headline flavor: "2 swaps instead of 3"
- - Rule text: "Britain may only make **1 tile swap** instead of 2"

**Impact:** Unclear what Britain's actual swap limit is.

**Remedy:** Clarify:
- Base swap limit = 2 (per Section 4.2)
- Britain's limit = 1 (if using rule text) or 2 (if using headline)
- **Recommendation:** Keep "1 swap instead of 2" as the meaningful penalty. Fix headline.

---

### 2.2 Gas Payment Timing Conflict
**Location:** Section 3.5 vs Section 7.2

| Source | When Gas is Paid |
|--------|------------------|
| Section 3.5 (Gas Reserve) | "When **building** ships at the Construction Hall" |
| Section 6.1 (Construction Hall) | No mention of gas cost |
| Section 7.2 (Launch Procedure) | "Pay for Lifting Gas" at **launch** |

**Impact:** Players don't know when to pay for gas.

**Remedy:** Gas is clearly paid at launch (Section 7.2 is authoritative). Update Section 3.5:
> "When **launching** ships from the Launchpad, use stored gas first."

---

### 2.3 Hindenburg Disaster Trigger Logic
**Location:** Sections 7.4, 7.5, and 12.5

Current rules create a logical inconsistency:

1. **Failed Hazard Check (normal):** Ship returns to Hangar Bay - no crash, just "failed attempt"
2. **Fire Roll failure:** Ship crashes (actual destruction)
3. **Failed Hazard Check on Luxury Launch with Hydrogen:** Triggers Hindenburg Disaster (catastrophic fire)

**The Problem:** Why does failing a hazard check (e.g., headwind) cause a *fire* specifically for hydrogen luxury launches? The Hindenburg was a fire disaster, not a weather disaster. A failed hazard check for "Strong Headwind" shouldn't cause a hydrogen fire.

**Remedy Options:**

**Option A (Recommended):** Hindenburg triggers on the **fire roll**, not hazard check:
> "If you roll a 6 (Catastrophic Fire) during a Luxury Launch in Age III while using Hydrogen, trigger the Hindenburg Disaster."

**Option B:** Redefine "failed hazard check" for Luxury Launches as a "crash" rather than "failed attempt":
> "When a Luxury Launch fails its Hazard Check, the ship crashes spectacularly (crowds are watching). If using Hydrogen, the crash triggers fire."

**Option C:** Keep current rules but add thematic justification:
> "Luxury Launches have passengers and press coverage. Any failure becomes a public disaster. Hydrogen ships failing publicly catch fire on impact."

---

### 2.4 Launch Outcome After Fire Roll
**Location:** Section 7.2

The outcomes listed in step 7 only address Hazard Check results:
> - **Success:** Place ship on route
> - **Failure:** Ship returns to Hangar Bay

This doesn't address fire roll outcomes. If you pass the Hazard Check but fail the fire roll, what's the outcome?

**Remedy:** Expand step 7:
> **Outcome:**
> - **Full Success** (passed Hazard + passed/no fire roll): Place ship on route; increase Income Track
> - **Fire Crash** (passed Hazard but failed fire roll): Ship is destroyed. Pilot and gas are lost. Ship token returns to supply (not Hangar).
> - **Hazard Failure** (failed Hazard Check): Launch aborted. Ship returns to Hangar Bay. Pilot and gas are lost.

---

### 2.5 Research Institute - Researcher Card Interaction
**Location:** Section 6.1

> "Cost: £3 per Research point (or £2 if you played a Researcher card for this action)"

But the Researcher card (Section 8.3) has Agent Effect: "+1 Research this round" - not "reduce Research Institute cost."

**Impact:** The discount mentioned doesn't match the card's actual ability.

**Remedy Options:**
- **Option A:** Update Researcher card: "Agent Effect: -£1 per Research at Research Institute"
- **Option B:** Remove the parenthetical from Section 6.1 (no discount exists)
- **Option C:** Add a new card (e.g., "Lab Assistant") with this ability

---

## 3. TERMINOLOGY INCONSISTENCIES

### 3.1 "Crash" vs "Fail" vs "Return to Hangar"
Throughout the rules, failed launches have inconsistent outcomes:
- Sometimes ships "crash" (destroyed)
- Sometimes ships "return to Hangar Bay" (recoverable)
- Fire roll says "crash" but Hazard failure says "return"

**Remedy:** Define clearly:
> **Crash:** Ship is destroyed. Token returns to supply. Must be rebuilt.
> **Aborted Launch:** Ship returns to Hangar Bay intact. Can attempt again.

Then apply consistently:
- Failed Hazard Check = Aborted Launch (return to Hangar)
- Failed Fire Roll = Crash (destroyed)
- Catastrophic Hazard Cards = Crash (destroyed)

---

### 3.2 Hand Size Ambiguity
**Location:** Section 6.3

> "draw back to hand size (typically 5)"

"Typically" is vague. What's the base hand size? Can it change?

**Remedy:** State explicitly:
> "Draw cards until you have 5 cards in hand (base hand size). Some cards and abilities may modify hand size."

Or simply: "draw 5 cards"

---

### 3.3 "Slots" vs "Swaps" vs "Tiles"
The rules use these terms somewhat interchangeably:
- Blueprint has "slots" for upgrades
- Design Bureau action allows "swaps"
- Upgrades are "tiles"

**Remedy:** Add glossary entry:
> - **Slot:** An empty space on the Blueprint where an Upgrade can be installed
> - **Swap:** One installation or removal of an Upgrade tile (one swap = one action)
> - **Tile:** The physical component (Technology tile or Upgrade tile)

---

## 4. MISSING OR INCOMPLETE MECHANICS

### 4.1 USA Home Base Error
**Location:** Section 10.3

> "Home Base (Age II): Paimboeuf, France"

This is incorrect - Paimboeuf was a French/British airship location (R-series). The USA should have an American home base (Lakehurst, NJ was historical) or explain why they operate from France.

**Remedy:** Change to "Lakehurst, New Jersey" or add note explaining the historical context of US airship operations in Europe.

---

### 4.2 Faction Slot Counts Not Specified
Italy's flaw mentions "one fewer Payload slot" but exact slot counts per faction per age are never detailed.

**Remedy:** Add a table to Section 10 or Appendix:

| Faction | Age I Slots (D/S/P) | Age II Slots | Age III Slots |
|---------|---------------------|--------------|---------------|
| Germany | 1/1/1 | 2/2/2 | 2/2/3 |
| Britain | 1/1/1 | 2/2/2 | 2/2/3 |
| USA | 1/1/1 | 2/2/2 | 2/2/3 |
| Italy | 1/1/0 | 2/2/1 | 2/2/2 |

(D=Drive, S=Structure, P=Payload)

---

### 4.3 Insurance Policy Limits
**Location:** Section 6.1 (Insurance Bureau)

No limit specified on how many insurance policies a player can hold.

**Remedy:** Add limit or explicitly state unlimited:
> "You may hold any number of insurance policy cards" OR "Maximum 3 policies per player"

---

### 4.4 Ministry Action Undefined
**Location:** Section 6.1

> "**9. The Ministry (Propeller)**
> - **Action:** Political maneuvering
> - **Effect:** Various special actions (claim bonus rewards, change turn order)"

This is too vague. What are the actual options?

**Remedy:** Define specific Ministry actions:
> - Spend £5: Go first in turn order next round
> - Spend £3: Draw 2 cards, discard 1
> - Spend £8: Gain a Government Contract (one-time £10 bonus)
> - Spend £4: Look at opponent's top 3 Hazard cards

---

### 4.5 Hydrogen vs Helium Lift Values Not Specified
The rules mention Helium provides less lift than Hydrogen (USA flaw: "-1 Lift compared to Hydrogen equivalents") but don't specify the actual values.

**Remedy:** In Appendix D, the Helium Gas Cell shows "Lift +5" but there's no "Hydrogen Gas Cell" upgrade for comparison. Add:
> **Hydrogen Gas Cell** (base/printed): Lift +6, Flammable
> **Helium Gas Cell** (upgrade): Lift +5, Safe

This makes the -1 Lift penalty clear.

---

### 4.6 Hazard Deck Shuffle Timing
**Location:** Appendix E

> "Shuffle your discard pile back into your Hazard Deck when the deck is empty."

But when are Hazard cards discarded? After each launch? This isn't specified.

**Remedy:** Add to Section 7.3:
> "After resolving a Hazard Check, place the drawn card face-up in your Hazard discard pile. When your Hazard deck is empty and you need to draw, shuffle your discard pile to form a new deck."

---

### 4.7 VP Track Maximum
**Location:** Section 2.2

> "VP Track (0-100 range)"

But expected winning scores (Section 12.7) are 40-55 VP. Why 100?

**Remedy:** Either reduce track to 0-60 or explain the headroom (for house rules, expansions, etc.).

---

## 5. BALANCE CONCERNS (Not Errors, But Worth Noting)

### 5.1 Germany's Permanent Helium Lock
Germany cannot ever acquire Helium Handling. In Age III, this means:
- Every Luxury Launch risks Hindenburg Disaster
- No way to mitigate fire risk

This may be intentional (high risk/reward) but could feel punishing. Consider:
- Adding a costly "Blaugas Fire Suppression" tech that reduces (but doesn't eliminate) fire risk
- Making the Hindenburg Disaster worth VP to the triggering player (historical infamy)

---

### 5.2 Engineer Economy Tightness
With £3 recruit cost + £1/round upkeep, Engineers are expensive. Starting with 2 and generating 1 Research each means:
- Round 1: 2 Research available (plus cards)
- Age I techs cost 2-4 Research

This seems intentionally tight, but playtesting should verify players can acquire 2-3 techs in Age I without feeling starved.

---

### 5.3 Progress Track Pacing
Each tech advances the Progress Track. With 56+ techs and thresholds of 20/25/30, the game could end before all techs are acquired if players tech aggressively. This creates interesting tension but may cause Analysis Paralysis as players avoid techs to extend the game.

---

## 6. APPENDIX A TODO ITEMS - STATUS UPDATE

Several items in Appendix A are marked as "RESOLVED" in the rules but the resolutions have inconsistencies:

| Item | Status | Issue |
|------|--------|-------|
| A.4.1 Age End Triggers | RESOLVED | Correctly resolved in Section 1.3 |
| A.4.2 Research Institute | RESOLVED | But card/cost interaction is broken (see 2.5) |
| A.3.4 Progress Thresholds | RESOLVED | Correctly resolved in Section 1.3 |
| A.3.2 Engineer Economy | Lists £4 cost | Conflicts with Section 6.1 (£3) |

---

## 7. RECOMMENDED PRIORITY ORDER FOR FIXES

### Critical (game-breaking):
1. Engineer recruit cost conflict (§1.2)
2. Starting cash conflict (§1.1)
3. Gas payment timing (§2.2)
4. Britain swap limit (§2.1)

### Important (confusing):
5. R&D Board tile scaling (§1.3)
6. Hindenburg trigger logic (§2.3)
7. Launch outcomes after fire (§2.4)
8. Technology tile counts (§1.5)

### Moderate (polish):
9. Hand size clarification (§3.2)
10. Ministry action definition (§4.4)
11. USA home base (§4.1)
12. Faction slot counts (§4.2)

### Low (completeness):
13. Market Row scaling (§1.4)
14. Hazard discard timing (§4.6)
15. Insurance limits (§4.3)

---

*Review completed: 2025-12-14*
