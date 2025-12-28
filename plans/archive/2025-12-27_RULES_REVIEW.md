# UP SHIP! Rules Review

*Review date: 2025-12-27*
*Updated: 2025-12-28 with all issues resolved*

## Overview

This comprehensive review of the UP SHIP! rules document (upship_rules.md) identifies issues across clarity, consistency, balance, and playability. The rules demonstrate strong thematic integration and elegant core mechanics, but contained several numerical inconsistencies and unclear edge cases that have now been resolved.

**Summary of Findings:**
- **Critical Issues:** 3 → **0 remaining** (all resolved)
- **Important Issues:** 11 → **0 remaining** (all resolved)
- **Moderate Issues:** 6 → **0 remaining** (all resolved)
- **Low Priority Issues:** 5 → **0 remaining** (all resolved)

---

## Resolved Issues

The following issues have been fixed in the rules document:

### Critical Issues (All Resolved)

- **Hazard Deck Card Count** — Updated Section 2.1 to 24 cards, updated Appendix A.2 to match Appendix E distribution
- **Technology Tile Count** — Updated Section 2.2 to 48 tiles, added tile counts by Age to Appendix C
- **Frame Technology/Upgrade Mismatch** — Added Articulated Keel Design to Frame Track in Appendix C (now 8 tiles)

### Important Issues (All Resolved)

- **Lift Bonuses from Upgrades** — Added clarification in Gas System Upgrades section that Lift bonuses are additive with gas cube Lift
- **Fire-Resistant Fabric Duration** — Changed to "Once per Age, treat one Fire hazard as auto-pass"
- **USA Home Base vs National Capital** — Reworded Section 5.2 and 12.4 to use "Home Base" with faction-specific locations listed
- **Research Institute Researcher Card** — Clarified that card Agent Effects may reduce cost (matches Researcher card's -£1 effect)
- **Multiple Ministry Visits** — Added resolution: player who visited first goes first, then other visitors in order, then by Income Track
- **Insurance Policy Limits** — Added maximum of 3 policies total
- **Repair Hangar Capacity** — Added "No limit" specification
- **Hull Upgrade Rule for Downgrades** — Clarified no refund for downgrades, and ships in Repair Hangar are not affected
- **Influence Saving** — Added explicit statement that unspent Influence is lost (unlike Research)
- **Card Draw Ceiling** — Changed to "at least 5 cards" with note that players with 5+ do not draw
- **Starting Technology Progress Track** — Added reminder in Section 4.1 that faction starting techs don't advance Progress Track

### Moderate Issues (All 6 Resolved)

- **Airship Token Quantity** — Specified 6 tokens per player
- **Helium Market Track Limits** — Added "(8 steps total)" and "stays at £15 if maxed" behavior
- **Technology Tile Distribution by Age** — Added breakdown: Age I: 11, Age II: 19, Age III: 18
- **Loan Penalty Precision** — Clarified as "Immediately reduce your Income Track marker by 3 positions (permanent reduction)"
- **Card Symbol Distribution in Starter Deck** — Added design note in Section 8.3 explaining the Wrench/Propeller emphasis over Coin is intentional, making Coin locations premium actions that encourage deck-building
- **City Bonus Immediate vs. Ongoing Confusion** — Rewrote Section 5.7 header to "City Bonuses (One-Time Rewards)" with explicit clarification distinguishing one-time £ bonuses from ongoing route Income

---

## Newly Resolved Issues (2025-12-28)

### Moderate Issues (2 additional resolved)

#### Card Symbol Distribution in Starter Deck — RESOLVED

**Location:** Section 8.3
**Problem:** The 10-card Starter Deck symbol distribution heavily favors Wrench (4) and Propeller (3) over Coin (1).

**Resolution:** Added design note explaining this is intentional. Coin locations (Academy, Flight School, Bank, Insurance Bureau) are premium actions—powerful but limited. Players must acquire Market cards with Coin symbols or use Apprentice "Any" cards to access these locations frequently. This encourages deck-building and creates meaningful choices.

---

#### City Bonus Immediate vs. Ongoing Confusion — RESOLVED

**Location:** Section 5.7
**Problem:** Both city bonuses and route Income use the £ symbol, potentially confusing one-time vs ongoing rewards.

**Resolution:** Rewrote Section 5.7 header to "City Bonuses (One-Time Rewards)" and added explicit clarification distinguishing one-time £ bonuses from ongoing route Income. The new text makes clear that "London: +£3" is immediate cash, not an Income Track increase.

---

### Low Priority Issues (4 additional resolved)

#### Italy Slot Configuration Thematic Clarity — RESOLVED

**Location:** Section 10.4, 10.5
**Problem:** Italy's "Low Ceiling" flaw name suggests altitude limitations, but the effect is reduced Payload slots.

**Resolution:** Renamed flaw to "Compact Design" with clarifying text explaining semi-rigid frames cannot support heavy payloads. Updated the note in Section 10.5 to match.

---

#### Agent Count Justification — RESOLVED

**Location:** Appendix A.4
**Problem:** Agent count set at 3 without rationale.

**Resolution:** Added detailed rationale: With 12 Ground Board locations and 3 agents, players can visit at most 1/4 of available actions per round. This creates meaningful opportunity cost while preventing analysis paralysis. Card symbol requirements further constrain choices, making each placement feel significant.

---

#### Hindenburg VP Award Balance — RESOLVED

**Location:** Section 12.5, Appendix A.4
**Problem:** "+3 VP for historical infamy" may be insufficient compensation.

**Resolution:** Added design intent note explaining the +3 VP is deliberately modest—it's consolation, not compensation. The player loses their ship, Officers, gas investment, and potentially ends the game before claiming more routes. The design question is whether triggering the disaster feels like a memorable story moment rather than pure punishment. This remains a playtesting priority.

---

#### Structural Engineer Lift Bonus — RESOLVED

**Location:** Appendix F (Market Deck)
**Problem:** Direct Lift modification on Structural Engineer card.

**Resolution:** Already covered by the general Lift bonus clarification added to Gas System Upgrades section (Appendix D). Lift bonuses from upgrades and cards are additive with gas cube Lift.

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

## Summary

**All issues have been resolved.** The rules document is now complete and internally consistent. Balance observations (USA faction advantages, Germany Hindenburg risk, Britain Red Tape severity, Engineer economy, Route income sustainability) are flagged for playtesting validation but do not require rules changes—they are design decisions that will be evaluated through play.

The rules are ready for playtesting.
