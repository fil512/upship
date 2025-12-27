# UP SHIP! Rules Review

*Review date: 2025-12-27*

## Overview

This comprehensive review of the UP SHIP! rules document (upship_rules.md) identifies issues across clarity, consistency, balance, and playability. The rules demonstrate strong thematic integration and elegant core mechanics, but contain several numerical inconsistencies and unclear edge cases that require resolution before playtesting.

**Summary of Findings:**
- **Critical Issues:** 3 (numerical inconsistencies that break the game)
- **Important Issues:** 11 (confusion or inconsistency that affects play)
- **Moderate Issues:** 6 (polish items for clarity)
- **Low Priority Issues:** 5 (minor items for completeness)

---

## Critical Issues

### Hazard Deck Card Count Mismatch

**Location:** Section 2.1, Appendix A.2, Appendix E
**Problem:** The Personal Hazard Deck is defined as containing 20 cards (§2.1), but Appendix E lists 24 cards total:
- Clear Weather: 4 cards
- Minor Hazards: 8 cards
- Major Hazards: 6 cards
- Fire Hazards: 5 cards
- Mechanical Hazards: 1 card
- **Total: 24 cards**

This 4-card discrepancy affects the probability of drawing each hazard type and breaks the deck composition.

**Remedy:** Either:
1. Reduce card counts to sum to 20 (remove 4 cards, likely from Minor Hazards)
2. Update the stated deck size to 24 cards
3. Specify that some cards listed are variants/alternatives

**Note:** Appendix A.2 also specifies "~8 Minor Hazards (~6 Major, ~4 Clear Skies, ~2 Catastrophic)" which contradicts both the stated 20-card total and Appendix E's distribution.

---

### Technology Tile Count Conflicts

**Location:** Section 2.2, Appendix C
**Problem:** Multiple conflicting tile counts:
- Section 2.2 states "45 tiles currently, target 60"
- Appendix C totals "47 Technology Tiles"
- Appendix C lists counts as: Propulsion 11, Frame 7, Fabric 7, Gas Systems 10, Payload 12 = 47

**Remedy:** Reconcile all three values. If current count is 47, update Section 2.2 accordingly.

---

### Frame Technology/Upgrade Count Mismatch

**Location:** Appendix C (Frame Track), Appendix D (Frame Upgrades), Section 10.4
**Problem:**
- Appendix C's Frame Track lists **7** technologies
- Appendix D's Frame Upgrades lists **8** upgrades (including Flexible Frame)
- The 8th upgrade (Flexible Frame) requires "Articulated Keel Design" which is listed as Italy's starting technology in §10.4 but is NOT included in Appendix C's Frame Track

This creates an orphan technology—players other than Italy cannot acquire "Articulated Keel Design" to install "Flexible Frame."

**Remedy:** Either:
1. Add "Articulated Keel Design" to Appendix C's Frame Track (making it acquirable by all factions)
2. Mark "Flexible Frame" as Italy-exclusive in Appendix D
3. Clarify that faction starting technologies cannot be acquired by other factions

---

## Important Issues

### Lift Bonuses from Upgrades vs. Gas Cube System

**Location:** Appendix D (Gas System Upgrades), Section 4.4
**Problem:** The rules establish that Lift comes from gas cubes at +5 Lift per cube (§4.4). However, several Gas System upgrades grant direct Lift bonuses:
- Compartmented Gas: +Lift +2
- High-Ceiling Gas: +Lift +3
- Redundant Cells: +Lift +4

It's unclear how these interact with the gas cube system:
- Are these bonuses in addition to cubes?
- Do they replace a cube's worth of Lift?
- Do they require cubes to function?

**Remedy:** Add a clarification stating whether Lift from upgrades is additive with gas cube Lift, and update the Lift/Weight Calculator section (§3.7) to explain this.

---

### Fire-Resistant Fabric Duration Unclear

**Location:** Appendix D (Fabric Upgrades)
**Problem:** Fire-Resistant Fabric says "Ignore first Fire hazard" but doesn't specify:
- Is this once per launch, per round, or per game?
- What constitutes the "first" Fire hazard if multiple occur?
- Does "ignore" mean auto-pass, or does it negate fire damage after failing the check?

**Remedy:** Reword to specify duration and effect. Suggested: "Once per Age, treat a Fire hazard as an auto-pass."

---

### USA Home Base Contradicts National Capital Rule

**Location:** Section 5.2, Section 10.3
**Problem:** Section 5.2 states that in Age II, "Players **must** launch their first ship from their **National Capital**." Section 10.3 then specifies:
- USA Home Base (Age II): Paimboeuf, France

Paimboeuf is not the United States' national capital. This contradicts the general rule.

**Remedy:** Either:
1. Clarify that "Home Base" is distinct from "National Capital" for Age II launch requirements
2. Change USA's Age II Home Base to Washington D.C. or create special text explaining the historical anomaly (USA operations were based in France during this era)
3. Reword Section 5.2 to say "Home Base" instead of "National Capital"

---

### Research Institute "Researcher Card" Reference

**Location:** Section 6.1 (The Research Institute)
**Problem:** States cost is "£3 per Research point (or £2 if you played a Researcher card for this action)." The Starter Deck (§8.3) includes "Researcher" cards with Propeller symbol, but the conditional isn't clear:
- Does playing a Researcher to visit the Research Institute automatically grant the discount?
- Or is the Researcher's Agent Effect the discount (not stated in the card)?

**Remedy:** Clarify in the Starter Deck whether Researcher cards provide the Research Institute discount as their Agent Effect, or if this is a card type check.

---

### Multiple Ministry Visits Turn Order Conflict

**Location:** Section 6.1 (The Ministry)
**Problem:** The Ministry grants "you go first in turn order next round." If multiple players visit the Ministry in the same round, who goes first?

**Remedy:** Add resolution rule, such as: "If multiple players visited the Ministry, the player who visited earliest goes first."

---

### Insurance Policy Limits Unspecified

**Location:** Section 6.1 (The Insurance Bureau)
**Problem:** "You may purchase any number of policies" but there's no maximum specified. Could a player stack unlimited policies to be completely crash-proof?

**Remedy:** Either specify no limit (intentional) or add a cap (e.g., "maximum 3 policies").

---

### Repair Hangar Capacity Unspecified

**Location:** Section 3.4
**Problem:** Launch Hangar explicitly has "Capacity: Up to 3 ships." Repair Hangar has no stated capacity. Can damaged ships pile up infinitely?

**Remedy:** Specify Repair Hangar capacity (suggest matching Launch Hangar at 3, or "no limit").

---

### Hull Upgrade Rule for Downgrades

**Location:** Section 7.1
**Problem:** "If you upgrade your Frame or Fabric while ships are in your Hangar, pay the Hull Cost difference for each ship already built." This addresses upgrades but not downgrades:
- If you remove a Frame/Fabric, do you get a refund?
- Does this apply to ships in Repair Hangar too?

**Remedy:** Add clarification for downgrades and specify which Hangar sections are affected.

---

### Influence Saving Between Rounds

**Location:** Section 6.2
**Problem:** Research explicitly "can be saved between rounds" (§4.1). Influence has no such statement. Can Influence be saved, or is it use-it-or-lose-it?

**Remedy:** Add explicit statement: "Influence that is not spent is lost at the end of the round" or "may be saved."

---

### Card Draw Ceiling Unclear

**Location:** Section 6.3
**Problem:** "Draw cards until you have 5 cards in hand." What if effects have given a player more than 5 cards? Do they keep excess cards, or discard down?

**Remedy:** Clarify: "Draw cards until you have at least 5 cards in hand" or "If you have 5 or more cards, do not draw."

---

### Starting Technology Progress Track Clarity

**Location:** Section 11.2
**Problem:** "Faction starting technologies (pre-printed on Player Boards) do NOT advance the Progress Track." This is stated in setup, but not repeated in Section 4.1 where Technology acquisition advances the track. Players might miss this during gameplay.

**Remedy:** Add a reminder in Section 4.1: "Only Technologies acquired from the R&D Board advance the Progress Track—faction starting Technologies do not count."

---

## Moderate Issues

### Card Symbol Distribution in Starter Deck

**Location:** Section 8.3
**Problem:** The 10-card Starter Deck symbol distribution is:
- Any: 2 (Apprentice x2)
- Wrench: 4 (Mechanic x2, Draftsman x2)
- Propeller: 3 (Researcher x2, Helmsman x1)
- Coin: 1 (Purser x1)

This heavily favors Wrench and Propeller actions while limiting Coin actions (Academy, Flight School, Bank, Insurance). Players may struggle to access Coin locations without acquiring Market cards.

**Remedy:** Consider rebalancing, or add note explaining this is intentional (Coin locations are premium/occasional).

---

### Airship Token Quantity Unspecified

**Location:** Section 2.1
**Problem:** "1 Set of Airship Tokens (wooden meeples in player color)" without specifying quantity. Combined with Launch Hangar capacity (3), it's unclear:
- How many ships can a player have total?
- How many on the map simultaneously?

**Remedy:** Specify token count per player (suggest 6-8 to allow 3 in hangar + 3-5 on routes).

---

### Helium Market Track Supply Limits

**Location:** Section 4.4
**Problem:** The Helium Market Track pricing (£2 → £3 → £4 → £5 → £6 → £8 → £10 → £15) is defined, but:
- How many steps/spaces are on the track?
- What happens if the track maxes out at £15?
- Is there a Helium supply limit per Age?

**Remedy:** Specify track length and behavior at maximum. Consider adding: "If the track would advance beyond £15, Helium is unavailable until the Age ends."

---

### Technology Tile Distribution by Age

**Location:** Appendix C
**Problem:** Technologies are listed by Age, but the bag setup (§11.1) just says "Age-sorted" without specifying initial quantities. Players need to know how many of each Age's tiles to put in the bag.

**Remedy:** Add tile counts by Age: "Age I: X tiles, Age II: Y tiles, Age III: Z tiles."

---

### City Bonus Immediate vs. Ongoing Confusion

**Location:** Section 5.7
**Problem:** City bonuses give one-time rewards including "£" amounts. Routes provide ongoing "Income." Both use the £ symbol. Players might confuse the one-time city bonus £ with ongoing Income.

**Remedy:** Consider different terminology for immediate cash (e.g., "Gain £3" vs "Income +3") or add explicit reminder that city bonuses are one-time.

---

### Action Space Symbol Mapping Incomplete

**Location:** Section 6.1, Section 8.1
**Problem:** Section 8.1 lists which symbols correspond to which locations, but Section 6.1 (where actions are fully described) only mentions symbols in parentheses. A player reading Section 6.1 alone might miss the symbol requirements.

**Remedy:** Add a consolidated reference table near the Ground Board section showing all 12 action spaces with their symbols.

---

## Low Priority Issues

### Italy Slot Configuration Thematic Clarity

**Location:** Section 10.5
**Problem:** Italy's "Low Ceiling" flaw reduces Payload slots (1 less than other factions in Ages II and III). The name "Low Ceiling" suggests altitude limitations, but the mechanical effect is reduced cargo capacity. This slight thematic disconnect could confuse players.

**Remedy:** Consider renaming to "Compact Design" or adding clarifying text linking semi-rigid frames to payload limitations.

---

### Agent Count Justification

**Location:** Appendix A.4
**Problem:** The TODO notes "Currently set at 3, but may need adjustment." No rationale is given for why 3 was chosen or what trade-offs exist.

**Remedy:** Low priority for rules clarity, but consider adding designer notes explaining the choice.

---

### Hindenburg VP Award Balance

**Location:** Section 12.5, Appendix A.4
**Problem:** "+3 VP for historical infamy" when triggering the Hindenburg Disaster. The TODO questions if this is appropriate. Given the disaster ends the game early (potentially before the player claims more routes), +3 VP seems low compensation.

**Remedy:** Requires playtesting. Consider making the award scale with the player's position (e.g., +5 VP if losing, +3 VP otherwise).

---

### Structural Engineer Lift Bonus

**Location:** Appendix F (Market Deck)
**Problem:** "Structural Engineer: Install Structure upgrade: +1 Lift" — another instance of direct Lift modification outside the gas cube system, same issue as the Gas System upgrades.

**Remedy:** Resolve alongside the primary Lift bonus clarification in Important Issues.

---

### Loan Income Track Penalty Precision

**Location:** Section 6.1 (The Bank)
**Problem:** "Reduce Income Track by 3 steps" doesn't specify if this is a one-time reduction or ongoing. The word "steps" implies the track position moves, but "penalty" could suggest ongoing cost.

**Remedy:** Clarify: "Immediately reduce your Income Track marker by 3 positions" to make clear this is a permanent reduction to the track position.

---

## Balance Observations

*These require playtesting to confirm. Flagged for designer attention.*

### USA Faction Advantage Accumulation

The United States accumulates multiple advantages:
1. Starts with Helium Handling (4-cost technology value)
2. Helium purchases don't increase global prices
3. Complete Fire hazard immunity
4. "No Flaw" explicitly stated

The rules note this is balanced by "Helium's higher cost and late entry," but late entry isn't mechanically represented. Consider adding a starting disadvantage (e.g., lower starting Income or fewer starting resources) to offset.

### Germany Hindenburg Risk vs. Reward

Germany must use Hydrogen, risking Hindenburg Disaster in Age III Luxury routes. The +3 VP for triggering the disaster may not compensate for:
- Losing a ship
- Potentially triggering early game end before claiming more routes
- Handing opponents time to score their routes

Consider whether Germany needs additional compensation or alternate paths to VP in Age III.

### Britain Red Tape Severity

Britain's 1-swap-per-action limit (instead of 2) significantly slows Blueprint development. Combined with needing to match other factions' technology acquisition pace, Britain may fall behind on upgrade installations. The Pre-Installed Luxury advantage may not fully compensate.

### Engineer Economy Break-Even Analysis

- Recruit cost: £4
- Upkeep: £1/round
- Over 4-5 rounds (typical Age length): Total cost £8-9
- Research generated: 4-5 per Age

At ~£2 per Research (if purchased at Research Institute), an Engineer provides £8-10 value in Research alone, plus emergency spending utility. This seems balanced but highly valuable—verify Engineers don't become a dominant strategy.

### Route Income Sustainability

Design target states ships should pay for themselves in 3-5 rounds. With Hull Cost ranging from £2-8 and route Income from £1-9:
- Cheapest route (£1 Income): Pays for £2 hull in 2 rounds (meets target)
- Expensive Age III luxury (£9 Income, ~£8 hull + gas ~£6-15): Pays back in 1-2 rounds

Late-game routes may be too profitable compared to early routes. Verify Age I routes don't feel punishing.

---

## Positive Notes

The UP SHIP! rules demonstrate excellent design in several areas that should be preserved:

**Elegant Core Mechanic:** The Lift ≥ Weight physics check creates immediate, intuitive decision-making tied to the airship theme. This "Golden Rule" is memorable and drives all engineering choices.

**Meaningful Dual-Use Cards:** The play-for-action vs. reveal-for-resources decision creates genuine tension every hand. No card is wasted, but players must constantly prioritize.

**Thoughtful Faction Asymmetry:** Each faction has clear identity with distinct trade-offs:
- Germany: Power at risk
- Britain: Slow but comfortable
- USA: Safe but expensive
- Italy: Flexible but limited

**Progressive Complexity:** The three-Age structure naturally introduces concepts, from simple pioneer routes to complex luxury launches.

**Thematic Hazard System:** Personal Hazard Decks create individual risk profiles that players can learn and predict, while Fire hazards tie directly to the hydrogen/helium strategic choice.

**Self-Regulating Game Length:** The Progress Track elegantly ensures the game ends—technology advancement hastens obsolescence. This prevents stalling and creates natural tension.

**Comprehensive Glossary:** Front-loading definitions helps new players and reduces rule-reading interruptions.

**Clear Quick Reference:** Appendix B provides exactly what experienced players need without re-reading full rules.

---

## Recommended Priority Order

1. **Resolve Hazard Deck count** (Critical—game cannot be playtested accurately)
2. **Clarify Lift bonus interactions** (Important—affects core gameplay calculations)
3. **Fix Technology/Upgrade tile count mismatches** (Critical—affects component production)
4. **Clarify USA Home Base rule** (Important—affects Age II setup)
5. **Specify all capacity limits and durations** (Important—prevents rules disputes)
6. Balance testing for faction asymmetry (after numerical issues resolved)
