# Rules Inconsistencies Analysis: UP SHIP!

## Quick Reference

| # | Issue | Priority | Action |
|---|-------|----------|--------|
| 1 | Double Fire Jeopardy | HIGH | Remove "Hydrogen Fire" hazard card |
| 2 | Research Token Confusion | HIGH | Clarify Base + Saved tokens |
| 3 | Undefined "Fabric" in Hull Cost | HIGH | Define Hull Cost formula |
| 4 | Tech £ Value Ambiguity | HIGH | Clarify sets Income Track |
| 5 | Hindenburg VP Bonus | — | KEEP AS IS (intentional) |
| 6 | Market Row Refresh | MEDIUM | Standardize "discard all, deal 5" |
| 7 | Insurance Policy Unclear | MEDIUM | Clarify what's saved vs lost |
| 8 | CLAUDE.md Swap Count | MEDIUM | Fix to match rules |
| 9 | CLAUDE.md Engineer Cost | MEDIUM | Fix £4 not £3 |
| 10 | Gas Cell Lift Note | LOW | Rewrite confusing text |
| 11 | Hazard Types Unused | LOW | Add rule connecting to abilities |
| 12 | Ministry Turn Order | LOW | Add cross-reference |
| 13 | Simplify Hazard System | SIMPLIFY | 12-card deck |
| 14 | Remove Engineer Upkeep | SIMPLIFY | Delete upkeep rules |

---

## RECOMMENDATION 1: Double Fire Jeopardy (Sections 7.4 + Appendix E)

**Priority:** HIGH

**The Problem:**
- Section 7.4 requires a d6 fire roll for ALL hydrogen launches (5 = controllable fire, 6 = catastrophic)
- Appendix E includes a "Hydrogen Fire" Catastrophic Hazard Card (Difficulty 6)
- This means hydrogen ships face BOTH a random hazard card draw AND a mandatory fire roll
- A ship could pass the Hydrogen Fire hazard card, then immediately crash from a bad d6 roll

**Impact:** Hydrogen feels doubly punished; math suggests ~38% failure rate on any hydrogen launch

**Proposed Resolution:**
Remove the "Hydrogen Fire" card from the Hazard Deck entirely. The d6 fire roll already provides sufficient hydrogen risk. This:
- Simplifies the launch sequence
- Makes hydrogen risk more predictable (always exactly 1-in-6 for catastrophic, 1-in-6 for controllable)
- Removes confusing overlap between hazard system and fire system

---

## RECOMMENDATION 2: Research Token Persistence (Sections 4.1, 6.2, 3.3)

**Priority:** HIGH

**The Problem:**
- Section 4.1: "Unspent Research tokens carry over to the next round"
- Section 3.3: "your available Research equals your number of Engineers in your Barracks plus any Research bonuses from cards remaining in your hand"
- Section 6.2: Research is calculated fresh during Reveal Phase

**Confusion:** The rules mention both "tokens that carry over" AND "calculated from Engineers." These seem contradictory.

**Proposed Resolution:**
Clarify that Research works in TWO ways that combine:
1. **Base Research** (calculated fresh each round): Engineers in Barracks + card bonuses
2. **Saved Research Tokens** (persistent): Tokens from previous rounds carry forward

Your total Research budget = Base Research + Saved Tokens.

Update Section 3.3 to add: "Additionally, any unspent Research tokens from previous rounds add to this budget."

Update Section 6.2 Step 3 to: "Calculate Research Budget: Your total available Research equals (1) Engineers in your Barracks, plus (2) Research bonuses from revealed cards, plus (3) any saved Research tokens from previous rounds."

---

## RECOMMENDATION 3: Hull Cost Undefined "Fabric" (Section 7.1)

**Priority:** HIGH

**The Problem:**
- Section 7.1: "Hull Cost: Determined by the Frame and Fabric upgrades currently installed"
- No "Fabric" technology or upgrade exists in Appendix C or D
- Only Structure upgrades exist (frames, coatings, keels)

**Impact:** Players cannot calculate Hull Cost as written

**Proposed Resolution:**
Replace "Frame + Fabric" with defined Hull Cost formula:
- Base Hull Cost: £2
- Each Structure upgrade installed: +£1 to Hull Cost

This makes the system clear and creates a meaningful tradeoff (stronger frames = more expensive ships).

---

## RECOMMENDATION 4: Technology £ Value Ambiguity (Section 9.1)

**Priority:** HIGH

**The Problem:**
- Section 4.1 describes Tech tiles as having "£ Value: Income generated during Age Transitions"
- Section 9.1 formula: "New Income = (£ from Technology tiles) − (£1 × routes lost)"
- Then says "Set your Income Track to this value"

**Confusion:** Is the Tech £ value a one-time cash payment, or a permanent Income Track contribution?

**Proposed Resolution:**
Clarify that Tech £ values SET your new Income Track baseline. Reword Section 4.1:
- "£ Value: Contributes to your Income Track position after Age Transitions"

This makes Technologies valuable long-term investments.

---

## RECOMMENDATION 5: Hindenburg "Infamy" VP — NO CHANGE

**Status:** INTENTIONAL DESIGN - Keep as is

The +3 VP "historical infamy" bonus for causing the Hindenburg Disaster is intentional. It creates exciting end-game tension where trailing players using hydrogen have both risk AND reward, making Age III luxury launches dramatically tense moments.

**Optional Enhancement:** Consider increasing to +5 VP to make the "Hindenburg gambit" a more viable comeback strategy.

---

## RECOMMENDATION 6: Market Row Refresh (Section 6.3 vs Appendix F)

**Priority:** MEDIUM

**The Problem:**
- Section 6.3: "Refill Markets: Refill the Card Market Row"
- Appendix F: "At the end of each round, discard any remaining cards in the Market Row and deal 5 new cards"

**Confusion:** Does "refill" mean fill empty slots, or discard everything and redraw?

**Proposed Resolution:**
Standardize on the Appendix F approach (discard all, deal fresh 5). This:
- Prevents stale markets where unpopular cards clog the row
- Creates urgency to buy cards you want before they disappear

Update Section 6.3 to match Appendix F wording.

---

## RECOMMENDATION 7: Insurance Policy Unclear (Section 6.1 vs 12.7)

**Priority:** MEDIUM

**The Problem:**
- Section 12.7: Crash means "ship token returns to shared supply and must be rebuilt"
- Section 6.1 (Insurance Bureau): "recover the airship token to your Hangar Bay instead of losing it"

**Confusion:** Does Insurance fully negate a crash, or just save the token? What about Pilot/gas costs?

**Proposed Resolution:**
Clarify in Section 6.1:
"When one of your ships crashes, you may discard one Insurance policy to recover the ship token to your Hangar Bay (instead of losing it to the supply). You still lose the Pilot and gas spent on the launch, and you still lose the route's Income if the ship was already on the map."

---

## RECOMMENDATION 8: CLAUDE.md Swap Count

**Priority:** MEDIUM

**The Problem:**
- Rules consistently say base swaps = 2
- CLAUDE.md says "Britain... (2 swaps instead of 3)" suggesting base was meant to be 3

**Proposed Resolution:**
The rules are authoritative. Update CLAUDE.md to match: base = 2 swaps, Britain's flaw reduces to 1, Italy's advantage increases to 4.

---

## RECOMMENDATION 9: CLAUDE.md Engineer Cost

**Priority:** MEDIUM

**The Problem:**
- Rules (Section 6.1): Engineers cost £4
- CLAUDE.md: "Engineers cost £3 to recruit"

**Proposed Resolution:**
Rules are authoritative. Engineers = £4. Update CLAUDE.md.

---

## RECOMMENDATION 10: Gas Cell Lift Note (Appendix D)

**Priority:** LOW

**The Problem:**
The note says "base Hydrogen Gas Cell... provides Lift +6 (Ages I/II/III vary: +4/+6/+8 respectively)"

The "+6" before the parenthetical contradicts the varying values inside.

**Proposed Resolution:**
Rewrite: "The base Hydrogen Gas Cell is printed on each Age's Blueprint and provides varying Lift: Age I (+4), Age II (+6), Age III (+8). All have the Flammable trait."

---

## RECOMMENDATION 11: Hazard Types Unused (Appendix E)

**Priority:** LOW

**The Problem:**
Appendix E lists hazard types (Weather, Mechanical, Supply, Fire) but these types have no mechanical effect. Italy's "Flexible Frame" ignores "Weather penalties" but this isn't clearly connected to the Type field.

**Proposed Resolution:**
Add a rule: "Hazard cards have a Type (Weather, Mechanical, Supply, Fire). Some abilities reference these types. For example, Italy's Flexible Frame upgrade allows ignoring Weather-type hazards."

---

## RECOMMENDATION 12: Ministry Turn Order (Section 6.1)

**Priority:** LOW

**The Problem:**
Section 6.1 defines turn order by Income Track, then the Ministry lets you go first regardless. This exception isn't mentioned in the Turn Order section itself.

**Proposed Resolution:**
Add to Turn Order section: "Exception: A player who visited the Ministry last round goes first, regardless of Income position."

---

## RECOMMENDATION 13: Simplify Hazard System

**Priority:** SIMPLIFICATION

**Current System:** 20-card deck with 4 difficulty tiers, multiple stats, complex engineer spending options per card

**New System:** 12-card deck with cleaner structure:
- **4 Clear Skies** (auto-pass, no effect)
- **6 Standard Hazards** (Difficulty 3, player chooses which stat to test)
- **2 Severe Hazards** (Difficulty 5, specific stat required)

**Changes to Appendix E:**
- Remove: All Minor Hazards (8 cards) and Major Hazards (6 cards)
- Replace with: 6 Standard + 2 Severe (new unified design)
- Keep: 4 Clear Weather cards unchanged
- Remove: Hydrogen Fire and Structural Failure catastrophic cards (fire is handled by d6 roll)

**Engineer Spending (Simplified):**
- Standard Hazards: Spend 1 Engineer for +2 to check
- Severe Hazards: Spend 2 Engineers for +3 to check
- No per-card variation; players learn one rule

**Benefits:**
- Faster launch resolution
- Less card text to read mid-game
- Clearer probability distribution
- Engineers still matter but in a predictable way

---

## RECOMMENDATION 14: Remove Engineer Upkeep

**Priority:** SIMPLIFICATION

**Current:** £1/Engineer/round upkeep paid during Income Phase

**Change:** Remove engineer upkeep entirely

**Sections to Update:**
- Section 3.3: Remove upkeep mention
- Section 6.3 Step 1: Remove "Pay Engineer Upkeep" step
- Section 12.6: Remove upkeep timing rules
- Appendix B Quick Reference: Remove from Key Formulas
- CLAUDE.md: Remove from "Key Balance Levers"

**Benefits:**
- Simpler income calculation (just read the track)
- Engineers feel like an investment, not a tax
- Reduces "death spiral" where losing players can't afford engineers → can't research → fall further behind
- Engineers already have opportunity cost (spending on emergencies)

---

## NOT CHANGING: Build + Launch System

The current two-action system (Construction Hall → Launchpad) provides strategic depth with the "build now, upgrade later" option. No changes needed.

---

## IMPLEMENTATION CHECKLIST

### File: `upship_rules.md`

| # | Change |
|---|--------|
| 1 | Remove "Hydrogen Fire" hazard card from Appendix E |
| 2 | Clarify Research = Base + Saved Tokens (Sections 3.3, 4.1, 6.2) |
| 3 | Define Hull Cost formula (Section 7.1) |
| 4 | Clarify Tech £ values set Income Track (Sections 4.1, 9.1) |
| 6 | Standardize Market refresh wording (Section 6.3) |
| 7 | Clarify Insurance policy details (Section 6.1) |
| 10 | Fix Gas Cell Lift note (Appendix D) |
| 11 | Add Hazard Type rule (Appendix E) |
| 12 | Add Ministry turn order exception (Section 6.1) |
| 13 | Replace hazard deck with 12-card version (Appendix E) |
| 14 | Remove Engineer upkeep (Sections 3.3, 6.3, 12.6, Appendix B) |

### File: `CLAUDE.md`

| # | Change |
|---|--------|
| 8 | Fix swap count: "Britain (1 swap instead of 2)" |
| 9 | Fix Engineer cost: "£4" not "£3" |
| 14 | Remove Engineer upkeep from "Key Balance Levers" |
