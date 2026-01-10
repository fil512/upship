# Design Status

This document tracks design decisions and their resolution status. Items marked **RESOLVED** have complete rules coverage. Items marked **PLAYTESTING NOTE** or **DESIGN NOTE** require validation through play.

## A.1 Component Design (Production Phase)

These items are physical component specifications for manufacturing. Rules are complete; artwork and production remain.

1. **The 3 Maps:** Create vector artwork for Age I (Western Europe), Age II (Europe at War), Age III (The Atlantic). Include:
   - Route lines with stat requirements printed
   - Luxury Route indicators for Age III
   - City names and icons
   - Route capacity indicators (single/double track)
   - Foundry icons for cities with industrial bonuses

2. **Player Boards:** Design the 4 faction layouts with:
   - Drawing Office with 4 technology tracks and pre-printed faction-specific starting technology
   - Blueprint overlay socket
   - Barracks for crew tokens (earned from shared supply)
   - Economy tracks (Income track only - no Research track)
   - Blueprint stat tracking area with cube tracks for: Lift, Weight, Speed, Range, Ceiling, Reliability, Luxury (each with min/max values)

3. **Blueprint Overlays (12 total):** Design 3 per faction with:
   - Frame slots and Fabric slots for structural components
   - Drive slots and Payload slots for systems
   - Different slot configurations per faction (see Section 10.5)
   - Clear slot type indicators (Frame/Fabric/Drive/Payload)
   - Historically accurate silhouettes:
     * Age I: Small, cigar-shaped non-rigid/semi-rigid designs
     * Age II: Longer, refined transitional rigid designs
     * Age III: Massive streamlined rigid giants with passenger gondolas
   - Faction-specific design elements:
     * Germany: Rigid Zeppelin configurations with max gas cell capacity
     * Britain: R-series designs with passenger comfort emphasis
     * USA: Military-influenced designs with robust structural elements
     * Italy: Semi-rigid designs with unique keel structures (Nobile pattern)

4. **Technology Tiles (~60):** Create tiles organized by track:
   - Propulsion: Engine technologies across Ages
   - Frame: Structural skeleton technologies (wood, duralumin, geodetic)
   - Fabric: Outer covering technologies (cotton, goldbeater's skin, gelatinized latex)
   - Gas Systems: Hydrogen improvements, Helium handling
   - Payload: Cargo, passenger, and mission technologies

5. **Tech Tiles (~80):** Create tiles corresponding to each Technology:
   - Clear visual link between Technology and its Tech Tiles
   - Stat bonuses, weights, special abilities

6. **Progress Track:** Design the shared track with:
   - Numbered spaces to threshold
   - Player count indicators for different thresholds
   - Thematic "fixed-wing aircraft" imagery

7. **Iconography:** Create distinct icons for:
   - Research (Lightbulb or Beaker)
   - Influence (Diamond)
   - Money (£ or Coin)
   - Officer (Aviator cap)
   - Engineer (Wrench or Gear)
   - Gas (Balloon or Tank)
   - Lift (Up arrow)
   - Speed (Propeller)
   - Range (Fuel Gauge)
   - Reliability (Shield)
   - Ceiling (Altimeter)
   - Luxury (Champagne Glass)
   - Flammable (Flame warning)
   - Safe (Helium symbol)

## A.2 Card Design (All Resolved)

1. **Personal Hazard Decks (27 cards each):** **RESOLVED** - See Appendix E for final distribution:
   - 4 Clear Weather (Auto-pass)
   - 8 Minor Hazards (Difficulty 2-3)
   - 8 Major Hazards (Difficulty 4-5)
   - 6 Fire Hazards (Hydrogen ships only)
   - 1 Mechanical Hazard (Critical Structural Stress)

2. **Market Deck:** Design 30 purchasable Agent Cards with:
   - Varied costs (2-6 Influence)
   - Mix of resource reveal icons (£, Research, Officer, Engineer, Gas, Influence)
   - Cards that provide resources you can't easily get elsewhere
   - **RESOLVED:** Cards provide resources when revealed (see Section 8)

3. **Starter Deck Review:** **RESOLVED** - See Section 11.3 for final deck:
   - 3 Wrench, 3 Coin, 3 Propeller, 1 Any — balanced access to all locations
   - Variety of reveal resources (£, Influence, Research, Officer)
   - Total 9 Influence (avg 0.9/card): 30% zeros, 50% ones, 20% twos (matches Dune Imperium)

## A.3 Economy Balancing (All Resolved)

1. **Research Costs:** **RESOLVED** - See Appendix C for all Technology costs:
   - Age I: 3-5 Research
   - Age II: 6-8 Research
   - Age III: 9-11 Research
   - Specialization discounts: -1 at 3+ tiles, -2 at 5+ tiles (Section 9.1)

2. **Engineer Economy:** **RESOLVED** - See Sections 5.2, 6.5, 6.7:
   - Starting Engineers: 2 (Section 3.2)
   - Recruit cost: £4 per Engineer at Academy (Section 6.5)
   - Upkeep cost: £1 per Engineer per round (Section 5.2)
   - Research generation: 1 per Engineer at Reveal (Section 5.1)
   - Officers cost £2 to recruit (Section 6.5)

3. **Route Income Values:** **RESOLVED** - See Appendix F (Routes) and Appendix G (Combat Missions):
   - Age I routes: £2-£6 based on difficulty
   - Age III routes: £4-£12 based on difficulty and Luxury status
   - Combat Missions: £5-£14 based on mission type

4. **Progress Track Thresholds:** **RESOLVED** - See Section 1.3 for complete table including Age transitions:
   - Age transitions at 6/12/15 cumulative launches (fixed for all player counts)

5. **Lifting Gas Market:** **RESOLVED** - See Sections 6.8 and 9.3:
   - Hydrogen: £1/cube (unlimited supply)
   - Helium: £2-£15/cube (market track, Section 9.3)
   - USA doesn't advance Helium track (domestic monopoly)
   - Market resets to £2 at Age Transitions

## A.4 Gameplay Polish (All Resolved)

1. **Age End Triggers:** **RESOLVED** - Progress Track milestones trigger Age transitions (see Section 1.3 and 9.1)

2. **Action Selection Mechanism:** **RESOLVED** - See Sections 5.1 and 11:
   - Cards have symbols (Wrench/Coin/Propeller/Any) determining valid locations
   - Cards provide resources when revealed
   - Starter deck includes 1 "Any" card for flexibility
   - Playtesting note: Monitor if card-icon matching feels too restrictive

3. **Agent Count:** **RESOLVED** - See Sections 3.2 and 5.1:
   - 2 agents per player at start
   - 3rd earned when Officer Income Track reaches +3
   - Playtesting note: Adjust if competition for actions feels too tight/loose

4. **Turn Order:** **RESOLVED** - See Sections 3.3 and 6.9:
   - First player determined randomly at game start
   - Ministry action grants First Player Token for next round

5. **Tie-Breakers:** **RESOLVED** - Turn order handles route claiming (first to claim gets the route). Victory tie-breakers in Section 1.1.

6. **Player Count Scaling:** **RESOLVED** - See Section 1.3:
   - Progress Track thresholds scale by player count
   - R&D Board size scales by Age (4/5/6 tiles)
   - Routes: All available (competition varies by player count)

7. **Hindenburg Disaster Tuning:** **DESIGN NOTE** - See Section 1.2:
   - +3 VP for triggering player is consolation, not compensation
   - Germany cannot use Helium, creating meaningful Age III risk
   - Playtesting will determine if risk/reward balance feels right

## A.5 Playtesting Priorities (Validation Phase)

These items require playtesting validation. Rules are complete but balance may need adjustment.

1. **Engineer Economy Test:** Verify the tension between Research generation and emergency spending feels meaningful

2. **Progress Track Pacing:** Does the fixed-wing threshold create appropriate tension? Assess whether players avoid launching ships to extend the game. Verify launch frequency feels balanced (successful launches advance the Progress Track).

3. **Technology/Tech Tile Flow:** Is the two-step system (acquire tech → install tech tile) intuitive?

4. **Hindenburg Drama:** Does the Age III hydrogen risk create exciting decisions?

5. **Faction Balance:** Ensure no faction dominates across all Ages

6. **Age Transition Impact:** Losing Tech Tiles but keeping Technologies—does this feel fair?
