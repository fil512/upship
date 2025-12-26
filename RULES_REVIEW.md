# UP SHIP! Rules Review (Updated)

## Summary

After incorporating your merged changes, many issues have been resolved. This updated review contains only **remaining issues** that still need attention.

**Remaining:** 1 numerical issue, 4 mechanical gaps, 2 clarity issues, 6 balance concerns

---

# PART 1: REMAINING NUMERICAL ISSUES

## 1.1 Helium Gas Cell Lift Value Inconsistency
**Issue:**
- Appendix D note says: "The Helium Gas Cell upgrade provides Lift +5, which is 1 less than the equivalent Hydrogen cell"
- But the base Hydrogen cells provide different Lift by Age (+4/+6/+8)
- So Helium at +5 is only "-1" compared to Age II, but is +1 compared to Age I and -3 compared to Age III

**Recommendation:** Either:
- Make Helium Gas Cell scale by Age (Lift +3/+5/+7)
- Or clarify that Helium is a fixed +5 regardless of Age (making it better early, worse late)

---

# PART 2: REMAINING MECHANICAL GAPS

## 2.1 Engineer Hazard Spending: Dual System Conflict
**Gap:** Two different systems for Engineer spending during Hazard Checks:
1. **Section 7.3 (Generic):** "Each Engineer spent adds +1 to your total"
2. **Appendix E (Card-Specific):** Different effects per card (e.g., "Spend 1: Auto-pass", "Spend 2: +3 to check")

**Question:** Which system applies? Can players choose?

**Recommendation:** Clarify in Section 7.3:
> **Standard Option:** You may spend any number of Engineers to add +1 per Engineer to your check.
> **Card-Specific Option:** Some Hazard cards offer special Engineer abilities (listed on the card). You may use either the standard +1 per Engineer OR the card's specific ability, not both.

---

## 2.2 Pressurized Lounge "Helium Ships Only" Restriction
**Gap:** Appendix D says Pressurized Lounge is "Helium ships only" but doesn't explain:
- Can you install it on any Blueprint?
- Does it only function on Helium ships?
- What happens if you install it then switch away from Helium?

**Recommendation:** Clarify in Appendix D:
> **Helium ships only:** You may only install Pressurized Lounge if your Blueprint has a Helium Gas Cell upgrade installed. If you later remove the Helium Gas Cell, you must also remove the Pressurized Lounge.

---

## 2.3 Structural Keel Grants Positive Lift
**Gap:** Appendix D shows Structural Keel provides "Weight -2" AND "Reliability +1, Lift +1". Most upgrades only have negative Weight; this one also grants positive Lift.

**Question:** Is this intentional? It's the only upgrade that grants Lift.

**Recommendation:** If intentional, add a design note:
> *Design Note: The Internal Keel's streamlined shape provides slight additional buoyancy.*

If unintentional, remove the "+1 Lift" bonus.

---

# PART 3: REMAINING CLARITY ISSUES

## 3.1 Age I Pioneer Scramble Conflict Resolution
**Unclear:** Age I has "no home bases" and players can claim "any unclaimed route." But how are simultaneous claims resolved?

Section 5.5 says "resolve by turn order" but this appears in the general Route Capacity section, not specifically for Age I.

**Recommendation:** Add to Section 5.1:
> **Pioneer Scramble Conflicts:** If multiple players attempt to claim the same single-track route in the same round during Age I, resolve by turn order (lowest Income goes first, as per Section 6.1).

---

## 3.2 Route Claiming Priority Source
**Minor:** Section 5.5 and Section 6.1 both discuss turn order for route claiming, but the connection between "lowest Income goes first" and "earlier players claim first" could be more explicit.

**Recommendation:** Add cross-reference in Section 5.5:
> **Simultaneous Claims:** If multiple players attempt to claim the same single-track route in the same round, resolve by turn order (see Section 6.1—lowest Income goes first).

---

# PART 4: REMAINING BALANCE CONCERNS

## 4.1 Germany's Hindenburg Risk Relative to Other Flaws
**Concern:** While the Hindenburg trigger was improved (now only on roll of 6, not failed Hazard Check), Germany still has a significantly more punishing flaw than other factions:

| Faction | Flaw | Impact |
|---------|------|--------|
| Germany | Cannot use Helium | 16.7% crash risk per launch + can end game in Age III |
| Britain | 1 swap instead of 2 | Slower Blueprint changes |
| USA | -1 Lift per Helium cell | Minor efficiency loss |
| Italy | 1 fewer Payload slot | Reduced income potential |

**Consideration:** Germany's +3 VP for causing Hindenburg provides some compensation, and their Blaugas advantage is significant. The new fire roll trigger (only roll of 6 = catastrophe) is much better balanced than the original.

**Recommendation:** Monitor in playtesting. If Germany still feels too risky, consider:
- Blaugas also reduces fire risk by 1 (only roll 6 = fire, no "controllable fire" on 5)
- Germany starts with Fire Retardant technology

---

## 4.2 Hydrogen Fire Risk (33%) May Still Be High
**Concern:** For all Hydrogen users:
- Roll 5 (16.7%): Spend Engineer or crash
- Roll 6 (16.7%): Automatic crash

This 33% attrition affects every Hydrogen launch.

**Consideration:** This creates real tension and makes Helium valuable. The ability to spend Engineers on roll of 5 provides player agency.

**Recommendation:** Monitor in playtesting. If too punishing:
- Reduce to only 6 = fire event (16.7% total risk)
- Or Fire Retardant technology prevents BOTH 5 and 6 results

---

## 4.3 Research Institute vs Engineer Economy Revisited
**Previous concern:** Engineers might never break even compared to Research Institute.

**Update:** With Research tokens now carrying over between rounds, the calculation changes significantly. Players can accumulate Research over time, making Engineers more valuable for sustained technology acquisition.

**Status:** Likely resolved. Monitor in playtesting.

---

## 4.4 Income Track Negative Spiral
**Concern:** Section 12.3 says if Income goes negative, you must discard Technologies permanently to become solvent. This creates a death spiral:
1. Take a loan or lose routes
2. Income goes negative
3. Forced to discard Technologies
4. Lose upgrade capabilities
5. Ships become uncompetitive
6. Cannot recover

**Recommendation:** Add safety valves:
- Allow selling Technologies for £ (to bank) instead of discarding
- Limit negative income effects: "Discard at most 1 Technology per round"
- Or add "Emergency Funding" Ministry action: trade 5 VP for £10

---

## 4.5 Technology VP Scoring Creates "Niche Tech Rush" Incentive
**Mechanic:** Technology VP is scored at every Age end. A 3 VP Age I niche tech = 9 VP total over the game.

**Consideration:** This is intentional design tension—players must choose between useful but 0 VP technologies vs niche but high VP technologies.

**Recommendation:** Monitor in playtesting. The reduced tech costs should make it easier to acquire both types.

---

## 4.6 Insurance Bureau Income Cost
**New mechanic:** Insurance now costs Income Track reduction instead of flat £.

**Consideration:** This makes insurance a long-term investment decision. Each policy permanently reduces income but provides crash protection.

**Question:** Is there a limit? A player could theoretically reduce Income to 0 and hold many policies.

**Recommendation:** Consider adding a minimum: "You cannot reduce your Income Track below 0 through insurance purchases."

---

# PART 5: RECOMMENDED PRIORITY FIXES

## Design Decisions Needed
1. **Helium Lift scaling** - Fixed +5 or scale by Age? (Issue 1.1)
2. **Engineer Hazard spending** - Standard +1/Engineer OR card-specific, not both? (Issue 2.1)
3. **Structural Keel +1 Lift** - Intentional or remove? (Issue 2.3)

## Clarifications (Low Priority)
4. **Pressurized Lounge restriction** - Add explicit Helium requirement (Issue 2.2)
5. **Pioneer Scramble conflicts** - Add cross-reference for turn order (Issue 3.1)
6. **Route claiming priority** - Add cross-reference to Section 5.5 (Issue 3.2)

---

# APPENDIX: RESOLVED ISSUES

The following issues from the original review were resolved in the merged changes:

## Numerical Issues Resolved
- **Engineer Recruit Cost:** Standardized to £4 (Section 6.1, Appendix A.3)
- **Starting Cash:** Fixed at £15 for all player counts (Section 2.1)
- **R&D Board Tiles:** Scale by Age (4/5/6), not player count (Section 4.1)
- **Market Row Cards:** Fixed at 5 cards (Section 11.1)
- **Technology Tile Count:** Updated to 47 after Frame/Fabric split (Appendix C, D)
- **Britain's Swap Count:** Confirmed as 1 instead of 2 (Section 10.2)
- **Italy's Strategy Tip:** Already correct at 4-swap (Section 13)
- **Research Cost Ranges:** Updated to match actual tiles: Age I 1-2, Age II 2-4, Age III 4-6 (Appendix A.3)

## Mechanical Gaps Resolved
- **Gas Reserve Usage:** Fixed to say "launching" not "building" (Section 3.5)
- **Ministry Action:** Defined as "Draw 2 cards, discard 1, go first next round" (Section 6.1)
- **Insurance Bureau:** Now costs Income Track reduction (Section 6.1)
- **Weather Bureau:** Now allows discard option (Section 6.1)
- **Hand Size:** Clarified "draw until you have 5 cards" (Section 6.3)
- **Hazard Deck Management:** Added discard pile rules (Section 7.3)
- **USA Home Base:** Added Age III base (Lakehurst, NJ) (Section 10.3)
- **Faction Blueprint Slots:** Added summary table (Section 10.5)
- **Research Tokens:** Now carry over between rounds (Section 4.1, 6.2)
- **Hull Cost Formula:** Defined as £2 base + Frame tile cost + Fabric tile cost (Section 7.1, Appendix B)
- **Gas Consumption & Pricing:** 1 gas cube per Frame slot; Hydrogen £1/cube; Helium market track £2-£15 (Section 4.4, 6.1)
- **USA Helium Advantage:** USA purchases don't advance the Helium Market Track (Section 6.1, 10.3)
- **Gas Depot Strategic Note:** Fixed "building" to "launching" (Section 6.1)
- **Frozen Prototype Rule:** Added explicit rule that ships on routes retain launch stats (Section 3.2)
- **Pilot/Engineer Income Track Setup:** Added to player setup (Section 11.2)
- **Technology Bag Accumulation:** Clarified that tiles from all Ages accumulate in bag (Section 4.1)

## Clarity Issues Resolved
- **Crash vs Aborted:** New Section 12.7 defines terminology
- **Slots/Swaps/Tiles:** New Section 12.8 defines terminology
- **Hindenburg Trigger:** Now only on roll of 6, explicitly Age III only (Section 7.5, 12.5)
- **Researcher Card:** Updated with conditional effects (Section 8.3)

## Balance Adjustments Made
- **Hindenburg Disaster:** Changed from -5 VP penalty to +3 VP reward (historical infamy)
- **Technology Costs:** Reduced across all Ages (Appendix C)
- **Hindenburg Trigger:** Narrowed to only Catastrophic Fire roll (6), not all failed Hazard Checks

---

*Review updated after merge. Focus on remaining high-priority gaps before playtesting.*
