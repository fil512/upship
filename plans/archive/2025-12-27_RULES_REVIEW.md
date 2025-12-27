# UP SHIP! Rules Review

*Review date: 2025-12-27*

## Overview

This comprehensive review examines the UP SHIP! rules document (upship_rules.md) for clarity, completeness, balance, and playability. The rules are well-developed with strong thematic integration and interesting mechanical depth. However, several areas require clarification, particularly around gas cube mechanics, hazard resolution, and terminology consistency.

**Summary Statistics:**
- Critical Issues: 2
- Important Issues: 7
- Moderate Issues: 12
- Low Priority Issues: 6
- Balance Observations: 5

---

## Critical Issues

### Gas Cube Mechanics Contradictory Description

**Location:** Sections 3.2, 4.4, and 7.2

**Problem:** The rules describe gas cubes in contradictory ways:
- Section 3.2 states Frame tiles have "gas cube sockets" where you "place" Hydrogen or Helium cubes
- Section 4.4 states "Spent cubes return to the general supply" after launching
- Section 7.2 says "Pay for Lifting Gas (use Gas Reserve first; any deficit at market price)"

This creates confusion about whether gas cubes are:
1. Permanently installed on the Blueprint (placed in sockets), OR
2. Consumed per launch (spent from Gas Reserve)

The "socket" language implies permanent installation, but the "spent/consumed" language implies per-launch consumption. These cannot both be true.

**Remedy:** Choose one model and revise all sections consistently:
- **Option A (Per-Launch Consumption):** Remove "socket" language from Frame tiles. Gas cubes are spent from Gas Reserve each launch, not placed on the Blueprint. Frame slot count determines maximum gas capacity per launch.
- **Option B (Permanent Installation):** Gas cubes are placed on Frame tiles and remain there. Ships on routes retain their gas. Cubes only return to supply when ships crash or Ages end. This would require revising how gas pricing works.

Option A appears to be the intended design based on the economic model (buying gas, storing in reserve, spending on launch).

---

### Hazard Deck Card Count Mismatch

**Location:** Section 2.1, Appendix E

**Problem:** Section 2.1 states each player has a "Personal Hazard Deck (20 cards)." However, Appendix E lists:
- Clear Weather: 4 cards
- Minor Hazards: 8 cards
- Major Hazards: 6 cards
- Fire Hazards: 5 cards (2+2+1)
- Mechanical Hazards: 1 card

**Total: 24 cards** (not 20)

This is a 20% discrepancy that affects hazard probability calculations and game balance.

**Remedy:** Either:
1. Adjust card counts in Appendix E to total exactly 20 (recommended: reduce Minor Hazards to 6, Major Hazards to 4)
2. Update Section 2.1 to state "24 cards" and verify this count is intentional

---

## Important Issues

### Pilot Location and Recovery Ambiguity

**Location:** Sections 3.3, 7.2, 9.1

**Problem:** The rules state:
- Section 3.3: Pilots "return to your Barracks when... An Age ends (all ships are removed from the map)"
- Section 7.2: When launching, "Spend 1 Pilot from your Barracks (returned to shared supply)"
- Section 9.1: "All Pilots spent on ships return to player Barracks"

This is confusing because Pilots are spent to the *shared supply* when launching (not assigned to ships). So what Pilots "spent on ships" are returning at Age end? The implication is that Pilots are somehow associated with ships on routes, but this isn't established anywhere.

**Remedy:** Clarify the Pilot lifecycle:
1. When launching, 1 Pilot goes from Barracks to shared supply (consumed)
2. At Age end, each player recovers X Pilots to their Barracks (where X = number of their ships on the map, or a fixed number, or some other formula)

Alternatively, simplify: "At Age end, players gain Pilots equal to their Pilot Income track" and remove the confusing "Pilots return" language.

---

### Voluntary Grounding Mechanic Missing

**Location:** Section 3.3

**Problem:** The rules mention "You voluntarily ground one of your ships" as a way to return Pilots to your Barracks. However, there is no action or procedure for voluntarily grounding a ship:
- Which action space allows grounding?
- What happens to the ship (return to Hangar? to supply?)
- Does this cost anything?
- Do you lose the route's Income immediately?

**Remedy:** Either:
1. Add a "Grounding" action (perhaps at the Launchpad or Design Bureau) with clear costs and effects
2. Remove the voluntary grounding reference if it's not intended as a mechanic

---

### Engineer Upkeep Payment Timing Issue

**Location:** Section 6.3

**Problem:** Phase C states: "Pay Engineer Upkeep: Deduct £1 per Engineer in your Barracks from your income." Then: "Collect Income: Each player gains £ equal to their Income Track position (minus Engineer upkeep)."

This implies upkeep is deducted from the Income you're about to receive. But what if your Income is 3 and you have 5 Engineers? You'd collect -2? Do you pay from existing Cash? What if you have no Cash?

Section 12.3 partially addresses this: "If your Income Track goes negative... you must pay the difference from your Cash... If you cannot pay, you must discard Technologies."

But Engineer upkeep doesn't make Income Track negative—it reduces the income received. The edge case of "more upkeep than income" isn't clearly handled.

**Remedy:** Add explicit language: "If your Engineer upkeep exceeds your Income, you receive £0 and must pay the difference from your Cash. If you cannot pay, discard Technologies until solvent."

---

### Fire-Resistant Fabric vs. Catastrophic Explosion Interaction

**Location:** Appendix D, Appendix E

**Problem:** The Fire-Resistant Fabric upgrade says "Ignore first Fire hazard." But Catastrophic Explosion explicitly states "No save possible."

Does Fire-Resistant Fabric prevent Catastrophic Explosion? The current wording is ambiguous:
- "Ignore first Fire hazard" suggests you ignore ALL Fire hazards the first time
- "No save possible" suggests Catastrophic Explosion cannot be prevented

**Remedy:** Add explicit clarification to Fire-Resistant Fabric: "Ignore the first Fire hazard you encounter (including Engine Fire and Gas Cell Rupture, but NOT Catastrophic Explosion)."

Or, if it should prevent Catastrophic Explosion, note: "Catastrophic Explosion can only be ignored by Fire-Resistant Fabric (first time) or Helium."

---

### Simultaneous Route Claiming Logic Error

**Location:** Section 5.1

**Problem:** Age I placement rules state: "If multiple players attempt to claim the same single-track route in the same round, resolve by turn order (lowest Income goes first)."

However, the game uses sequential worker placement—players take turns placing Agents one at a time. When a player takes the Launchpad action and claims a route, that route is claimed immediately. Subsequent players cannot "attempt to claim the same route in the same round" because it's already taken.

The only way simultaneous claims could occur is if multiple players plan to claim the same route and all wait until their Launchpad actions. But once the first player launches, the route is claimed.

**Remedy:** Either:
1. Remove the simultaneous claiming rule (it shouldn't happen with sequential actions)
2. Add a "reservation" or "declaration" phase where players announce route intentions before resolving launches
3. Clarify that this rule only applies if players somehow launch truly simultaneously (e.g., via special card effects)

---

### Missing Technology Tile Counts Per Age

**Location:** Section 4.1, Appendix C

**Problem:** Section 4.1 states the bag starts with "only Age I tiles" and new Age tiles are added at transitions. Appendix C lists 47 total tiles across all Ages, but doesn't provide a breakdown of how many tiles are in each Age's pool.

This is essential for:
- Understanding game pacing (how quickly can the Progress Track advance in Age I?)
- Calculating when the R&D Board might run dry
- Balancing technology availability

Counting manually from Appendix C:
- Age I: 10 tiles (Daimler, Improved Propeller, Dual Engine Mount, Wooden Framework, Wire Bracing, Rubberized Cotton, Doped Canvas, Improved Valving, Manual Ballonets, Observation Platform, Mail Compartment, Cargo Nets = 12 actually)

The tiles aren't consistently marked with Age in the appendix tables.

**Remedy:** Add a summary table: "Age I contains X tiles, Age II contains Y tiles, Age III contains Z tiles." Also ensure every tile in Appendix C has its Age clearly marked in a dedicated column.

---

### Specialization Discount Baseline Ambiguity

**Location:** Section 3.1

**Problem:** The Specialization Discount table shows discounts based on "Technologies in Track" (1-2: None, 3-4: -1, 5+: -2).

Do faction starting technologies (pre-printed on Player Boards) count toward this total?

Example: Germany starts with Duralumin Framework (Frame), Goldbeater's Skin (Fabric), and Blaugas Fuel System (Gas). If these count, Germany immediately has 1 tile in each of 3 tracks. If they don't count, Germany starts at 0 tiles in each track.

This significantly affects how quickly factions can reach specialization discounts.

**Remedy:** Add clarification: "Faction starting technologies (pre-printed on Player Boards) [do / do not] count toward specialization discounts."

---

## Moderate Issues

### Terminology Inconsistency: Fail vs. Aborted

**Location:** Sections 7.3, 12.7

**Problem:** Section 7.3 uses "Fail" for when a Hazard Check isn't passed. Section 12.7 introduces "Aborted" for the same outcome. The Launch Checklist in Appendix B uses "Aborted."

Mixed terminology creates confusion about whether these are different outcomes.

**Remedy:** Standardize on "Aborted" throughout (it's more thematic and distinct from "Crash").

---

### Missing Weather-Type Hazard Definition

**Location:** Appendix D, Appendix E

**Problem:** Several cards and upgrades reference "Weather-type hazards":
- Flexible Frame: "Auto-pass Weather-type hazards"
- Rapid Descent System: "Auto-pass Weather-type hazards"
- Weather Expert: "Ignore Weather hazards this launch"

Appendix E labels some hazards with "Type: Weather" but this typing system isn't formally defined. What exactly makes a hazard "Weather-type"?

**Remedy:** Add a definition: "Hazard Types: Weather (atmospheric conditions), Mechanical (equipment failure), Fire (combustion), Supply (resource depletion). Cards that affect a hazard type apply to all hazards with that label."

---

### Launchpad Action with No Ships

**Location:** Section 6.1

**Problem:** Can a player visit the Launchpad if they have no ships in their Launch Hangar? The rules state "You may launch as many ships from your Launch Hangar as you wish" but don't specify a minimum. Launching zero ships might be strategically useful (to block others from the space, or for card effects).

**Remedy:** Add clarification: "You may visit the Launchpad even with no ships in your Launch Hangar. In this case, you complete the action without launching any ships."

Or: "You may not visit the Launchpad unless you have at least one ship in your Launch Hangar."

---

### Hull Downgrade Refund Unclear

**Location:** Section 7.1

**Problem:** The Hull Upgrade Rule states: "If you upgrade your Frame or Fabric while ships are in your Hangar Bay, you must pay the difference in Hull Cost for each ship already built."

What happens if you *downgrade* (replace expensive Frame/Fabric with cheaper ones)? Do you get a refund? This seems unlikely but should be stated.

**Remedy:** Add: "If you install cheaper Frame or Fabric tiles (downgrade), you do not receive a refund for ships already built."

---

### Upgrade Supply Exhaustion

**Location:** Section 4.2

**Problem:** Section 4.2 mentions "unless physically out of components" but doesn't specify what happens if the Upgrade Supply runs out of a particular tile type. Can players not install that upgrade? Is there a limit per player?

**Remedy:** Specify component counts for each Upgrade tile type, or add: "If an Upgrade tile type is exhausted, no additional copies may be installed until one is returned to the supply."

---

### Turn Order Tie Resolution Chain

**Location:** Section 6.1

**Problem:** Turn order ties are resolved by: "the player closest clockwise to the start player goes first."

But after Round 1, who is "the start player"? Is it:
- The original first player (randomly determined)
- The player who visited the Ministry last round
- The player who went first in the previous round

**Remedy:** Define "start player" clearly: "The start player marker passes clockwise at the beginning of each round, OR remains with the original holder unless claimed via the Ministry action."

---

### City Bonus List Incomplete

**Location:** Section 5.7

**Problem:** The city bonus tables list specific cities for each Age, but maps likely contain additional cities not listed. For example, Age II cities don't include Warsaw (mentioned in Section 5.2 as part of the geography).

What bonus do unlisted cities provide?

**Remedy:** Either:
1. Add all cities to the lists with their bonuses
2. Add a default: "Cities not listed above provide +£2"

---

### Customs Official Card Ambiguity

**Location:** Appendix F

**Problem:** The Customs Official card says "Claim route even if tied." But with sequential turn order and immediate route claiming, ties shouldn't occur (first player to launch claims the route).

This card implies there's a timing window where ties can happen, which contradicts the core launch procedure.

**Remedy:** Either remove this card or clarify the timing window where route ties can occur.

---

### Insurance Policy Permanent Income Reduction

**Location:** Section 6.1 (Insurance Bureau)

**Problem:** "Cost: Reduce your Income Track by 1 step per policy (representing ongoing premiums)." This is a permanent reduction—even after using the policy to save a crashed ship, your Income doesn't recover.

This seems very punishing for a one-time insurance payout. Depending on game length, one insurance policy could cost £10-20+ in lost income.

**Remedy:** Consider alternative pricing:
- "Pay £X upfront per policy" (flat cost)
- "Reduce Income Track by 1 while you hold this policy; restore Income when policy is used" (temporary reduction)

At minimum, clarify this is intentional: "Income reduction is permanent, even after the policy is used."

---

### Research Token Persistence Mechanic

**Location:** Section 4.1

**Problem:** "Unspent Research tokens carry over to the next round, allowing players to accumulate Research for expensive Technologies."

This implies physical Research tokens that persist on Player Boards between rounds. However, Section 6.2 suggests Research is calculated fresh each round from Engineers + revealed cards + purchased Research.

Are there persistent Research tokens? If so:
- Where are they stored?
- Is there a maximum?
- How do players track accumulated Research?

**Remedy:** Clarify the Research token system explicitly. Either:
1. "Research is calculated fresh each Reveal Phase (no carryover)"
2. "Unspent Research tokens are stored on your Player Board and added to your next round's Research budget"

---

### Multiple Redundant Weather Immunity Effects

**Location:** Appendix D, Appendix F

**Problem:** Several effects grant Weather hazard immunity:
- Flexible Frame: "Auto-pass Weather-type hazards"
- Rapid Descent System: "Auto-pass Weather-type hazards"
- Weather Expert card: "Ignore Weather hazards this launch"

If a player has multiple of these, do they stack in any meaningful way? There's no benefit to having redundant immunity.

**Remedy:** Either:
1. Accept redundancy as a design choice (players can invest in overkill immunity)
2. Differentiate effects (e.g., "Auto-pass Weather" vs. "+2 to Weather hazard checks")

---

### Smoking Room Requires Helium But Provides No Fire Safety

**Location:** Appendix D

**Problem:** "Pressurized Lounge | Smoking Room... Requires Helium Gas Cell installed"

This thematically represents a fire risk (smoking) requiring fire-safe gas. However, the mechanic doesn't actually provide fire immunity—it just requires Helium as a prerequisite.

A player could have Helium Gas Cell AND use Hydrogen for a particular launch (to save money). They'd have the Smoking Room but be using flammable gas... which seems thematically backwards.

**Remedy:** Add clarification: "The Smoking Room can only be used on launches that use Helium gas" or make the prerequisite more specific.

---

## Low Priority Issues

### Blaugas Historical Accuracy

**Location:** Appendix C, Appendix D

**Problem:** Blaugas is described as having "neutral buoyancy" (Weight 0) and providing Range +3. Historically, Blaugas (named after inventor Hermann Blau) was a propane-based fuel with a density close to air, used to avoid buoyancy changes as fuel was consumed.

The game represents this as Range +3, which is mechanically sensible but perhaps underestimates the impact. Consider noting the historical context in flavor text.

**Remedy:** Minor—add flavor text to the Technology tile explaining the historical significance.

---

### Italy's Flaw Name vs. Effect Mismatch

**Location:** Section 10.4

**Problem:** Italy's flaw is called "Low Ceiling" but mechanically it's "one fewer Payload slot." Ceiling is a ship stat (altitude), while Payload slots affect cargo capacity.

The name implies an altitude restriction, not a payload restriction.

**Remedy:** Rename the flaw to "Light Construction" or "Limited Capacity" to match the mechanical effect.

---

### Blueprint Overlay Description vs. Player Count

**Location:** Section 2.1, Appendix A

**Problem:** "3 Age-Specific Blueprint Boards (slotted overlays)" per player (Section 2.1) suggests each player gets 3 overlays. But with 4 factions and 3 Ages, that's 12 overlays total (listed correctly in Appendix A).

For physical production, clarify that the 12 overlays are faction-specific (each faction's 3 Blueprints look different per Section 3.2).

**Remedy:** Minor clarification in Section 2.1: "3 Age-Specific Blueprint Boards (slotted overlays, unique to each faction—12 total in game)"

---

### Helium Market Track Maximum Price

**Location:** Section 4.4, Appendix B

**Problem:** The Helium Market Track shows prices: £2 → £3 → £4 → £5 → £6 → £8 → £10 → £15.

What happens if players continue purchasing after £15? Does the price stay at £15? Become unavailable?

**Remedy:** Add: "If the Helium Market Track exceeds £15, Helium becomes unavailable until the track is reduced (via Ministry action or Age reset)."

---

### Map Board Count Discrepancy

**Location:** Sections 2.2, 5

**Problem:** Section 2.2 lists "3 Map Boards (Age I, Age II, Age III)" but the maps "replace" each other at Age transitions (Section 9.1). This implies only one map is ever on the table at a time.

Clarify for production that all 3 maps are included but only one is used per Age.

**Remedy:** Minor wording fix: "3 Map Boards (Age I, Age II, Age III)—one used per Age"

---

### Agent Count Justification

**Location:** Section 11.2, Appendix A

**Problem:** Players receive "3 Agent Tokens." Appendix A notes this "may need adjustment based on final action selection design."

With 12 action spaces and 3 Agents per round, players can only visit 25% of actions per round. This seems restrictive but may be intentional.

**Remedy:** Document the design intent: "3 Agents is intentional to force specialization" or mark for playtesting.

---

## Balance Observations

*Note: These concerns require playtesting to validate. They are observations, not confirmed issues.*

### USA Faction Appears Strongest

**Observation:** The United States has:
- Starting Helium Handling (fire immunity)
- No Helium Market Track advancement (stable prices while others pay more)
- No explicit flaw (unlike Germany, Britain, Italy)
- 4 starting Technologies (more than other factions?)

The "late entry" justification may not mechanically manifest as a disadvantage.

**Testing Needed:** Track USA win rates across multiple games. Consider adding a mechanical disadvantage (higher starting costs? fewer starting resources?).

---

### Germany's Hindenburg Risk vs. Reward

**Observation:** Germany cannot use Helium, meaning every Age III Luxury Launch risks triggering the Hindenburg Disaster and ending the game. However, the game-ending player gains +3 VP.

Is +3 VP sufficient compensation for:
1. Losing a ship
2. Potentially ending the game before achieving other objectives
3. The reputational "blame" for ending the game

**Testing Needed:** Does Germany avoid Luxury Routes entirely? Is the +3 VP ever worth deliberately triggering Hindenburg?

---

### Engineer Economy Tightness

**Observation:** Engineers cost £4 to recruit, require £1/round upkeep, generate 1 Research per round, and can be spent to save ships from hazards.

At £5 total cost per round (including upkeep amortization), one Engineer provides 1 Research. But Research can also be purchased at £3/Research at the Research Institute (£2 with Researcher card).

Engineers only become cost-efficient after 5+ rounds of generating Research without being spent on emergencies. This seems very tight.

**Testing Needed:** Do players avoid Engineers? Is the emergency-spend option valuable enough to justify the cost?

---

### Age Transition Income Penalty

**Observation:** Transition Income = (£ from Tech tiles) − (£1 × routes lost).

In Age I, with limited technology and potentially 2-3 routes, a player might have:
- £3-4 from Technologies
- Lose £2-3 from routes
- Net: £0-2 starting Income for Age II

This seems very punishing, especially since rebuilding ships in Age II costs more (higher Hull Costs, new Blueprints).

**Testing Needed:** Do Age transitions feel devastating? Is there a "death spiral" where poor Age I performance makes Age II unwinnable?

---

### Card Symbol Restriction

**Observation:** To visit action spaces, players must play cards with matching symbols (Wrench/Coin/Propeller). With a 10-card starter deck containing only 2-3 cards per symbol type, players may frequently be unable to visit desired actions.

The Apprentice (Any symbol) cards help, but may be too valuable to spend on actions.

**Testing Needed:** Do players feel frustrated by symbol mismatches? Is hand management too restrictive or appropriately challenging?

---

## Positive Notes

The UP SHIP! rules demonstrate several strong design choices that should be preserved:

### Thematic Integration
The rules excel at connecting mechanics to historical reality. The Lift ≥ Weight constraint, Helium scarcity, faction-specific designs, and Hindenburg risk all feel authentically rooted in airship history.

### Clear Core Loop
The Build → Upgrade → Launch progression is intuitive and creates natural decision points. The separation of Construction (building ships) from Launchpad (flying them) enables interesting timing strategies.

### Dual-Use Card System
The tension between using cards for worker placement versus saving them for reveal phase resources creates meaningful decisions every turn. This is elegant design.

### Multiple Victory Paths
Technology VP vs. Route VP creates genuine strategic diversity. The 2/3 route, 1/3 tech split is well-calibrated for emphasizing different playstyles.

### Faction Asymmetry
Each faction has a distinct identity and playstyle:
- Germany: High-risk engineering giants
- Britain: Imperial luxury networks
- USA: Safe, well-funded operations
- Italy: Agile, adaptable explorers

### Progress Track Elegance
Using Technology acquisition to advance the game clock is thematic (innovation hastens obsolescence) and creates interesting tension (do I skip tech to extend the game?).

### Age Transition Drama
The complete map replacement and Blueprint swapping creates dramatic turning points. The decision to carry forward Technologies but not Upgrades forces long-term planning.

---

## Appendix: Checklist Status

Based on the design-checklist.md validation framework:

| Category | Status |
|----------|--------|
| Core Mechanics | Mostly complete—gas cube clarification needed |
| Player Experience | Well-designed, needs playtesting |
| Resource Economy | Solid framework, Engineer balance unclear |
| Balance | Faction balance needs testing, especially USA |
| Rules & Clarity | Good structure, terminology inconsistencies |
| Components | Specified but incomplete counts |
| Replayability | High potential with faction variety |
| Playtesting | Not yet conducted |

---

*End of review*
