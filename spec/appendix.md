
# APPENDIX A: DESIGN STATUS

This appendix tracks design decisions and their resolution status. Items marked **RESOLVED** have complete rules coverage. Items marked **PLAYTESTING NOTE** or **DESIGN NOTE** require validation through play.

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
   - Age I: 1-2 Research
   - Age II: 2-4 Research
   - Age III: 4-6 Research
   - Specialization discounts: -1 at 3+ tiles, -2 at 5+ tiles (Section 9.1)

2. **Engineer Economy:** **RESOLVED** - See Sections 5.2, 6.5, 6.7:
   - Starting Engineers: 2 (Section 3.2)
   - Recruit cost: £4 per Engineer at Academy (Section 6.5)
   - Upkeep cost: £1 per Engineer per round (Section 5.2)
   - Research generation: 1 per Engineer at Reveal (Section 5.1)
   - Officers cost £2 to recruit (Section 6.5)

3. **Route Income Values:** **RESOLVED** - See Appendix F (Routes) and Appendix G (Combat Missions):
   - Age I routes: £2-£6 based on difficulty
   - Age III routes: £5-£12 based on difficulty and Luxury status
   - Combat Missions: £5-£14 based on mission type

4. **Progress Track Thresholds:** **RESOLVED** - See Section 1.3 for complete table including Age transitions:
   - Age transitions at 8/16/20 (2P), 10/20/25 (3P), 12/24/30 (4P)

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

2. **Progress Track Pacing:** Does the fixed-wing threshold create appropriate tension? Assess whether players avoid acquiring Technologies to extend the game, causing Analysis Paralysis. Verify tech acquisition pace feels balanced.

3. **Technology/Tech Tile Flow:** Is the two-step system (acquire tech → install tech tile) intuitive?

4. **Hindenburg Drama:** Does the Age III hydrogen risk create exciting decisions?

5. **Faction Balance:** Ensure no faction dominates across all Ages

6. **Age Transition Impact:** Losing Tech Tiles but keeping Technologies—does this feel fair?

---

# APPENDIX B: QUICK REFERENCE

## Phase Order (Each Round)

**Phase A: Agent Turns** (take turns until all players Reveal)

On your turn, either:
- **Place an Agent:** Play matching card, execute location action
- **Reveal:** Show hand → gain resources → acquire Technologies → purchase cards → replenish R&D Board and Market Row → discard hand

**Phase B: Income & Cleanup**

1. Collect Income (Income Track − Engineers; if negative, take loans)
2. Collect Officers/Engineers from Income Tracks
3. Check Age transition
4. Refresh Agents
5. Draw to 5 cards

## Build Checklist (Construction Hall Action)

1. ✓ Calculate Hull Cost: £2 base + Frame tile cost + Fabric tile cost
2. ✓ For each ship: Pay Hull Cost in £
3. ✓ Place built ships in your Hangar Bay (up to 3 per action)
4. ✓ Note: Physics Check NOT required to build—only to launch

## Launch Checklist (Launchpad Action)

1. ✓ Verify Physics Check (Lift ≥ Weight) AND all Frame/Fabric slots filled
2. ✓ Select a ship from Launch Hangar
3. ✓ Spend Officers equal to Age (1/2/3) (Barracks → shared supply)
4. ✓ Choose gas type (Hydrogen or Helium—no mixing)
5. ✓ Pay for Lifting Gas (Gas Reserve first, then market price for deficit)
6. ✓ Assign to valid route (must meet stat requirements)
7. ✓ Draw Hazard Card from your personal Hazard Deck
8. ✓ Compare Ship Stat to Hazard Difficulty (optional: spend Engineers for +1 each)
9. ✓ If Fire hazard and using Hydrogen: Spend required Engineers or crash
10. ✓ If Catastrophic Explosion on Luxury Launch in Age III: Hindenburg Disaster triggered
11. ✓ **Success:** Place ship on route, increase Income, gain city bonus
12. ✓ **Aborted:** Ship returns to Launch Hangar (Officers kept, gas spent)
13. ✓ **Damaged:** Ship goes to Repair Hangar (Officers and gas spent)
14. ✓ **Crash:** Ship destroyed (token to supply, Officers and gas spent)
15. ✓ Continue launching more ships or stop

## Key Formulas

- **Hull Cost:** £2 base + Frame tile cost + Fabric tile cost
- **Physics Check:** Total Lift ≥ Total Weight
- **Lift Calculation:** Number of gas cubes × 5 (all gas types provide +5 Lift)
- **Gas Rule:** Choose Hydrogen or Helium per launch—no mixing within a single launch
- **Hazard Check:** Ship Stat + Engineers spent ≥ Hazard Difficulty
- **Research per Round:** Research Level + Engineers in Barracks + Research icons from revealed cards (unspent lost)
- **Net Income:** Income Track − Engineers in Barracks (if negative, take loans)
- **Tech Cost:** Listed cost − Specialization Discount
- **Transition Income:** (£ from Tech tiles) − (£1 × routes lost), minimum £0
- **Repair Cost:** £3 per ship to move from Repair Hangar to Launch Hangar
- **Victory:** Most Victory Points wins (tiebreakers: Income, Cash, Ships on map)

## Gas Pricing (Gas Depot Action)

| Gas Type | Price | Lift | Fire Risk |
|----------|-------|------|-----------|
| Hydrogen | £1/cube | +5 | Vulnerable |
| Helium | £2-15/cube | +5 | Immune |

**Helium Market Track:** £2 → £3 → £4 → £5 → £6 → £8 → £10 → £15 (8 steps; stays at £15 if maxed)
**Price Increases:** Non-USA purchases advance the track by 1 per cube
**Price Decreases:** Ministry action reduces the track by 1 (minimum £2)
**USA Exception:** USA purchases do not advance the track (domestic supply)
**Age Reset:** Track resets to £2 at each Age Transition

## Game End Conditions

1. **Hindenburg Disaster:** Catastrophic Explosion during Luxury Launch in Age III (Hydrogen only)
2. **Fixed-Wing Rise:** Progress Track reaches threshold

## Scoring Summary (at end of each Age)

**Route VP (2/3 of total):**
| Route | Age I | Age II | Age III |
|-------|-------|--------|---------|
| Short (Range 1-2) | 2 | 3 | 4 |
| Medium (Range 3-4) | 4 | 5 | 7 |
| Long (Range 5-6) | — | 7 | 10 |
| Luxury Bonus | — | — | +3 |

**Technology VP (1/3 of total):** Score VP printed on each Technology tile you own (scored every Age). Essential techs = 0 VP, Useful techs = 1 VP, Niche techs = 2-3 VP

## Age Transition Income

> **New Income = (£ from Tech tiles) − (£1 × routes lost)**

Minimum £0. Technologies cushion the transition; routes cost £1 each when wiped.

---

# APPENDIX C: TECHNOLOGY TILES

Technology tiles are acquired from the R&D Board using Research. Each tile shows: Research Cost, Track (color), Age, £ Value, VP Value (if any), and which Tech Tile it unlocks.

## Propulsion Track (11 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Daimler Petrol Engine | 1 | 1 | — | Basic Engine |
| I | Improved Propeller | 1 | 1 | — | Efficient Propeller |
| I | Dual Engine Mount | 2 | 1 | 1 | Twin Engine |
| II | Maybach Engine Design | 3 | 2 | — | Maybach CX Engine |
| II | Diesel Powerplant | 3 | 1 | 1 | Diesel Engine |
| II | Swiveling Propeller | 4 | 2 | 1 | Vectored Thrust |
| II | Contra-Rotating Props | 4 | 2 | — | Balanced Propulsion |
| III | Streamlined Nacelle | 4 | 2 | — | Aerodynamic Engine |
| III | Supercharged Engine | 5 | 3 | 1 | High-Altitude Engine |
| III | Diesel-Electric Drive | 5 | 2 | 1 | Hybrid Powerplant |
| III | Variable-Pitch Propeller | 4 | 2 | — | Adaptive Propeller |

## Frame Track (10 tiles)

Frame technologies unlock structural skeleton upgrades. Each Frame slot on the Blueprint shows a gas cube icon indicating the launch cost.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Wooden Framework | 1 | 1 | — | Wooden Frame |
| I | Wire Bracing | 2 | 1 | 1 | Tensioned Frame |
| II | Duralumin Framework | 3 | 2 | — | Duralumin Frame |
| II | Steel Framework | 2 | 1 | 2 | Steel Frame |
| II | Internal Keel | 3 | 1 | 1 | Semi-Rigid Keel |
| II | Articulated Keel Design | 3 | 1 | 2 | Flexible Frame |
| II | Aerodynamic Hull Design | 3 | 1 | 1 | Streamlined Hull |
| III | Geodetic Structure | 4 | 2 | — | Geodetic Frame |
| III | Modular Construction | 5 | 2 | 3 | Modular Frame |
| III | Dynamic Lift Surfaces | 5 | 2 | 2 | Aerodynamic Lift System |

## Fabric Track (8 tiles)

Fabric technologies unlock outer covering and gas cell material upgrades.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Rubberized Cotton | 1 | 1 | — | Cotton Envelope |
| I | Doped Canvas | 2 | 1 | — | Doped Covering |
| II | Goldbeater's Skin | 4 | 2 | 2 | Premium Envelope |
| II | Fireproof Coating | 3 | 1 | 2 | Fire-Resistant Fabric |
| II | Aluminum Doping | 3 | 1 | 1 | Reflective Covering |
| II | Grounding Systems | 3 | 1 | 1 | Conductive Covering |
| III | Gelatinized Latex | 4 | 2 | — | Synthetic Envelope |
| III | Composite Covering | 5 | 2 | 1 | Advanced Fabric |

## Gas Systems Track (11 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Improved Valving | 1 | 1 | — | Pressure Control |
| I | Manual Ballonets | 1 | 1 | — | Altitude Ballonets |
| II | Multiple Gas Cells | 3 | 1 | — | Compartmented Gas |
| II | Helium Handling | 4 | 2 | — | Helium Gas Cell |
| II | Blaugas Fuel System | 3 | 2 | 2 | Blaugas Tank |
| II | Automatic Valves | 4 | 2 | 1 | Smart Valving |
| III | Pressure Altitude System | 5 | 3 | 1 | High-Ceiling Gas |
| III | Triple Gas Cell | 4 | 2 | — | Redundant Cells |
| III | Emergency Venting | 4 | 2 | 2 | Rapid Descent System |
| III | Gas Recovery | 5 | 2 | 2 | Reclamation System |
| III | Water Recovery System | 5 | 2 | 1 | Exhaust Condensers |

## Payload Track (14 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Observation Platform | 1 | 1 | — | Spotter Gondola |
| I | Mail Compartment | 1 | 1 | — | Postal Service |
| I | Cargo Nets | 2 | 1 | 1 | External Cargo |
| II | Passenger Gondola | 3 | 1 | — | Basic Cabin |
| II | Bomb Bay Design | 4 | 2 | 3 | Bombing Equipment |
| II | Trapeze System | 4 | 2 | 2 | Sparrowhawk Hangar |
| II | Radio Equipment | 3 | 1 | 1 | Communications Suite |
| II | Armored Gondola | 3 | 1 | 1 | Light Armor Plating |
| II | Reinforced Hull | 4 | 2 | 2 | Heavy Armor Plating |
| III | Luxury Accommodation | 4 | 2 | — | Luxury Cabin |
| III | Dining Saloon | 5 | 3 | — | Restaurant |
| III | Promenade Deck | 6 | 3 | 2 | Observation Lounge |
| III | Sleeping Quarters | 4 | 2 | 1 | Private Berths |
| III | Smoking Room | 5 | 2 | 3 | Pressurized Lounge |

**54 Unique Technology Tiles** (Propulsion 11, Frame 10, Fabric 8, Gas Systems 11, Payload 14)

**Tiles by Age:**
- Age I: 12 tiles (3 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
- Age II: 23 tiles (4 Propulsion, 5 Frame, 4 Fabric, 4 Gas, 6 Payload)
- Age III: 19 tiles (4 Propulsion, 3 Frame, 2 Fabric, 5 Gas, 5 Payload)

**Player Scaling (§3.1):** The game includes (N−1) copies of each tile where N = number of players. Faction starting technologies are removed from the bag (one copy per player who starts with that tech).

| Players | Copies per Tile | Age I Bag (after starters) |
|---------|-----------------|----------------------------|
| 2       | 1               | ~9 tiles                   |
| 3       | 2               | ~21 tiles                  |
| 4       | 3               | ~33 tiles                  |

**PLAYTESTING NOTE:** Current tile counts may be adjusted based on playtesting. Monitor if certain tracks feel over/under-represented.

---

# APPENDIX D: TECH TILES

Tech Tiles are installed on your Blueprint. You must own the corresponding Technology to install a Tech Tile. Each shows: Weight cost, stat bonuses, and special abilities.

## Propulsion Tech Tiles

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Basic Engine | Daimler Petrol Engine | 1 | Speed +1 | — |
| Efficient Propeller | Improved Propeller | 1 | Speed +1, Range +1 | — |
| Twin Engine | Dual Engine Mount | 3 | Speed +2, Reliability +1 | — |
| Maybach CX Engine | Maybach Engine Design | 2 | Speed +2, Range +1 | — |
| Diesel Engine | Diesel Powerplant | 2 | Range +2, Reliability +1 | — |
| Vectored Thrust | Swiveling Propeller | 2 | Speed +1, Ceiling +1 | — |
| Balanced Propulsion | Contra-Rotating Props | 2 | Speed +2, Reliability +1 | — |
| Aerodynamic Engine | Streamlined Nacelle | 2 | Speed +3 | — |
| High-Altitude Engine | Supercharged Engine | 3 | Speed +2, Ceiling +2 | — |
| Hybrid Powerplant | Diesel-Electric Drive | 3 | Range +3, Reliability +1 | — |
| Adaptive Propeller | Variable-Pitch Propeller | 2 | Speed +1, Range +2 | — |

## Frame Tech Tiles

Frame tiles go in Frame slots. Each Frame slot shows a gas cube icon—this indicates the gas cost required for launching. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Wooden Frame | Wooden Framework | 2 | +£1 | Reliability +1 | — |
| Tensioned Frame | Wire Bracing | 1 | +£1 | Ceiling +1 | — |
| Duralumin Frame | Duralumin Framework | 2 | +£2 | Reliability +2, Ceiling +1 | — |
| Steel Frame | Steel Framework | 3 | +£1 | Reliability +2 | Heavier but cheap |
| Semi-Rigid Keel | Internal Keel | 2 | +£1 | Reliability +1 | Italy's specialty |
| Geodetic Frame | Geodetic Structure | 1 | +£3 | Reliability +2, Ceiling +1 | Lightest, most expensive |
| Modular Frame | Modular Construction | 1 | +£2 | — | — |
| Flexible Frame | Articulated Keel Design | 0 | +£1 | Ceiling +1 | Semi-rigid: -1 to Reliability checks during Weather hazards (Italy starting tech) |
| Streamlined Hull | Aerodynamic Hull Design | 1 | +£2 | Lift +2 | Provides lift without gas |
| Aerodynamic Lift System | Dynamic Lift Surfaces | 2 | +£3 | Lift +4 | Provides lift without gas |

## Fabric Tech Tiles

Fabric tiles go in Fabric slots. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Cotton Envelope | Rubberized Cotton | 0 | +£0 | — | Basic default |
| Doped Covering | Doped Canvas | 0 | +£1 | Speed +1 | Improved aerodynamics |
| Premium Envelope | Goldbeater's Skin | 0 | +£3 | Reliability +1, Range +1 | Best gas-tightness |
| Fire-Resistant Fabric | Fireproof Coating | 1 | +£2 | Reliability +1 | Once per Age, treat one Fire hazard as auto-pass |
| Reflective Covering | Aluminum Doping | 0 | +£1 | Reliability +1 | Protects gas from heat |
| Conductive Covering | Grounding Systems | 0 | +£1 | Reliability +1 | Immune to Static Discharge hazard (grounds electrical charge) |
| Synthetic Envelope | Gelatinized Latex | 0 | +£2 | Reliability +1, Range +1 | Modern replacement for goldbeater's |
| Advanced Fabric | Composite Covering | 0 | +£2 | Reliability +2 | Multi-layer protection |

## Gas System Tech Tiles

**Note:** Each gas cube provides **+5 Lift** regardless of type. Gas System Tech Tiles enhance or modify gas cell performance. **Lift bonuses from Tech Tiles** (such as Compartmented Gas +2, High-Ceiling Gas +3, or Redundant Cells +4) are **additive** with gas cube Lift—they represent improved gas efficiency that gives you extra buoyancy beyond the cubes themselves.

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Pressure Control | Improved Valving | 1 | Ceiling +1 | — |
| Altitude Ballonets | Manual Ballonets | 1 | Ceiling +1 | — |
| Compartmented Gas | Multiple Gas Cells | 1 | Lift +2, Reliability +1 | — |
| Helium Gas Cell | Helium Handling | 1 | — | Safe (immune to Fire hazards); use Helium cubes |
| Blaugas Tank | Blaugas Fuel System | 0 | Range +1 | Neutral buoyancy fuel: Pay £2 when launching to keep gas cubes after mission (Germany starting tech) |
| Smart Valving | Automatic Valves | 1 | Reliability +1, Ceiling +1 | — |
| High-Ceiling Gas | Pressure Altitude System | 2 | Lift +3, Ceiling +2 | — |
| Redundant Cells | Triple Gas Cell | 2 | Lift +4, Reliability +2 | — |
| Rapid Descent System | Emergency Venting | 1 | Reliability +2 | Auto-pass Weather-type hazards |
| Reclamation System | Gas Recovery | 1 | Range +2 | -£2 Lifting Gas cost |
| Exhaust Condensers | Water Recovery System | 2 | — | When using Helium: -£3 Lifting Gas cost. Recovers water from engine exhaust (USA specialty) |

## Payload Tech Tiles

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Spotter Gondola | Observation Platform | 1 | Income +1 | — |
| Postal Service | Mail Compartment | 1 | Income +2 | — |
| External Cargo | Cargo Nets | 2 | Income +2 | — |
| Basic Cabin | Passenger Gondola | 2 | Income +2, Luxury +1 | — |
| Bombing Equipment | Bomb Bay Design | 3 | — | Combat Missions: +£3 Income |
| Sparrowhawk Hangar | Trapeze System | 3 | — | Ignore one route requirement |
| Communications Suite | Radio Equipment | 1 | Reliability +1 | +1 to Navigation hazards |
| Light Armor Plating | Armored Gondola | 2 | Armor +1 | Age II: Survive flak ≤ Armor |
| Heavy Armor Plating | Reinforced Hull | 3 | Armor +2 | Age II: Survive flak ≤ Armor |
| Luxury Cabin | Luxury Accommodation | 3 | Income +3, Luxury +2 | — |
| Restaurant | Dining Saloon | 2 | Income +2, Luxury +2 | — |
| Observation Lounge | Promenade Deck | 2 | Income +1, Luxury +3 | — |
| Private Berths | Sleeping Quarters | 2 | Income +2, Luxury +1 | — |
| Pressurized Lounge | Smoking Room | 2 | Income +1, Luxury +2 | Requires Helium Gas Cell installed |
| Imperial Mast | Imperial Mooring System | 1 | — | British Territories count as Home Base (Britain specialty) |

**Total: 56 Tech Tiles** (Propulsion 11, Frame 10, Fabric 8, Gas Systems 11, Payload 16)

---

# APPENDIX E: HAZARD DECK

Each player has an identical Personal Hazard Deck of 27 cards. When launching a ship, draw one card and resolve it.

**Age II Flak:** Each card shows 0–5 flak guns. In Age II only, if Flak > your ship's Armor, the ship is destroyed (5 Flak always destroys; max Armor is 4).

## Clear Weather (4 cards)

| Name | Flak | Effect |
|------|------|--------|
| Clear Skies | 0 | Auto-pass. No hazard. |
| Favorable Winds | 0 | Auto-pass. No hazard. |
| Calm Conditions | 0 | Auto-pass. No hazard. |
| Perfect Visibility | 0 | Auto-pass. No hazard. |

## Minor Hazards (8 cards)

| Name | Difficulty | Stat | Type | Flak |
|------|------------|------|------|------|
| Light Turbulence | 2 | Speed | Weather | 0 |
| Minor Engine Trouble | 2 | Reliability | Mechanical | 1 |
| Crosswind | 3 | Speed | Weather | 0 |
| Gas Leak | 3 | Reliability | Mechanical | 1 |
| Low Visibility | 2 | Ceiling | Weather | 1 |
| Fuel Concern | 3 | Range | Supply | 0 |
| Headwind | 3 | Speed | Weather | 1 |
| Structural Stress | 2 | Reliability | Mechanical | 2 |

## Major Hazards (8 cards)

| Name | Difficulty | Stat | Type | Flak | Special |
|------|------------|------|------|------|---------|
| Strong Headwind | 4 | Speed | Weather | 2 | — |
| Icing Conditions | 4 | Ceiling | Weather | 2 | On failure, also lose 1 gas cube. If no gas remains, ship Destroyed. |
| Engine Failure | 5 | Reliability | Mechanical | 3 | — |
| Storm System | 5 | Speed | Weather | 3 | — |
| Structural Damage | 4 | Reliability | Mechanical | 4 | — |
| Navigation Error | 4 | Range | Supply | 3 | — |
| Squall Line | 5 | Reliability | Weather | 3 | Ships with 3+ Payload slots suffer +1 Difficulty. Historical: USS Shenandoah was torn apart by shear forces. |
| Severe Icing | 5 | Ceiling | Weather | 2 | On failure, lose 2 gas cubes. If gas remains < ship's minimum, ship Destroyed. |

## Fire Hazards (6 cards) — Hydrogen Ships Only

Helium ships automatically pass all Fire-type hazards.

| Name | Qty | Flak | Effect |
|------|-----|------|--------|
| **Engine Fire** | 2 | 2 | Spend 1 Engineer to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
| **Gas Cell Rupture** | 2 | 3 | Spend 2 Engineers to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
| **Static Discharge** | 1 | 4 | Difficulty 4 Reliability check. Fail → Ship crashes. Historical: Models the Hindenburg's static discharge ignition. |
| **Catastrophic Explosion** | 1 | 5 | No save possible. Ship crashes. If Luxury Launch in Age III: Hindenburg Disaster triggered. |

## Mechanical Hazards (1 card)

| Name | Qty | Flak | Effect |
|------|-----|------|--------|
| **Critical Structural Stress** | 1 | 4 | Spend 2 Engineers to stabilize → Ship Damaged (Repair Hangar). Fail → Ship crashes. |

**Resolving Hazards:**
1. Draw card from your Personal Hazard Deck
2. Check if auto-pass (Clear Weather cards, or Helium ship vs Fire hazards)
3. For standard hazards: Compare Ship's relevant stat vs Difficulty. Spend Engineers (+1 each) to boost if needed.
4. For Fire/Structural hazards: Spend required Engineers or face consequences.
5. **Pass:** Ship reaches route/completes mission successfully
6. **Fail (standard):** Ship returns to Launch Hangar (Officers kept, gas lost)
7. **Damaged:** Ship goes to Repair Hangar (Officers and gas lost)
8. **Crash:** Ship destroyed (token to supply, Officers and gas lost)
9. **Age II Flak Check:** After resolving the hazard (pass or fail), check Flak vs Armor. If mission succeeded and Flak > Armor, ship is destroyed but rewards are still earned.

**Flak Distribution (27 cards):**
- 0 Flak: 7 cards (safe passage) - Clear Weather (4) + Light Turbulence + Crosswind + Fuel Concern
- 1 Flak: 4 cards (Armor 1+ survives) - Minor Engine Trouble + Gas Leak + Low Visibility + Headwind
- 2 Flak: 6 cards (Armor 2+ survives) - Structural Stress + Strong Headwind + Icing Conditions + Severe Icing + Engine Fire (2)
- 3 Flak: 6 cards (Armor 3+ survives) - Engine Failure + Storm System + Navigation Error + Squall Line + Gas Cell Rupture (2)
- 4 Flak: 3 cards (Armor 4 survives) - Structural Damage + Static Discharge + Critical Structural Stress
- 5 Flak: 1 card (always destroys) - Catastrophic Explosion

**Deck Management:** Shuffle your discard pile back into your Hazard Deck when the deck is empty.

---

# APPENDIX F: ROUTES

Routes connect cities on the map boards. Each route has stat requirements that your Blueprint must meet to claim it.

## Age I Routes — The Cradle (Western Europe)

The Pioneer Era features 17 regional routes across Western Europe forming a fully connected network. Early airship technology limits range and reliability.

| Route | From | To | Range | Speed | Other | Income | VP | Tracks | Notes |
|-------|------|-----|-------|-------|-------|--------|-----|--------|-------|
| London Gateway | London | Dover | 1 | — | — | £2 | 1 | 1 | Channel feeder |
| Channel Crossing | Calais | Dover | 1 | 1 | — | £3 | 2 | 1 | First international |
| Rhine Valley | Frankfurt | Cologne | 1 | — | — | £2 | 1 | 1 | Starter route |
| Low Countries | Brussels | Amsterdam | 1 | 1 | — | £3 | 2 | 1 | Connects Benelux |
| Paris Express | Paris | Brussels | 1 | 1 | — | £3 | 2 | 1 | — |
| Rhineland | Brussels | Cologne | 1 | 1 | — | £3 | 2 | 1 | Rhine access |
| Lake Constance | Friedrichshafen | Zurich | 1 | — | — | £3 | 2 | 1 | Alpine approach |
| London–Paris | London | Paris | 2 | 2 | — | £5 | 3 | 2 | — |
| North Sea Run | Hamburg | Amsterdam | 2 | 1 | — | £4 | 2 | 1 | — |
| Baltic Passage | Hamburg | Copenhagen | 2 | 1 | — | £4 | 2 | 1 | — |
| Alpine Transit | Zurich | Milan | 2 | — | Ceiling 1 | £4 | 2 | 1 | Mountain crossing |
| Mediterranean Link | Marseille | Barcelona | 2 | 1 | — | £4 | 2 | 1 | — |
| German Alps | Frankfurt | Friedrichshafen | 2 | — | Ceiling 1 | £4 | 2 | 1 | Germany's backbone |
| Rome Approach | Milan | Rome | 2 | 1 | Ceiling 1 | £5 | 3 | 1 | Italy's home |
| Riviera Express | Paris | Marseille | 3 | 1 | — | £4 | 2 | 1 | French corridor |
| Berlin–Vienna | Berlin | Vienna | 3 | 1 | — | £5 | 3 | 1 | — |
| Imperial Circuit | London | Berlin | 3 | 2 | — | £6 | 3 | 1 | Prestige route |

**Age I Route Summary:**
- Range 1: 7 routes (starter/regional)
- Range 2: 7 routes (medium distance)
- Range 3: 3 routes (long distance)

**Network Connectivity:** All 17 cities are connected through this route network. Key hubs are London (3 connections), Brussels (4 connections), and Frankfurt (3 connections).

## Age III Routes — The Golden Age (The Atlantic)

The Atlantic Era features 21 hemispheric routes including luxury ocean crossings forming a fully connected global network. Advanced technology enables intercontinental travel.

| Route | From | To | Range | Speed | Ceiling | Luxury | Income | VP | Tracks | Notes |
|-------|------|-----|-------|-------|---------|--------|--------|-----|--------|-------|
| Eastern Gateway | New York | Lakehurst | 1 | — | — | — | £4 | 2 | 1 | NJ connection |
| German Hub | Frankfurt | Friedrichshafen | 1 | 1 | — | — | £4 | 2 | 1 | Zeppelin corridor |
| South Atlantic | Rio de Janeiro | Recife | 2 | 1 | — | — | £5 | 2 | 1 | Brazil domestic |
| Caribbean Connection | Miami | Havana | 2 | 1 | — | — | £5 | 2 | 1 | — |
| Pacific Coast | Los Angeles | San Francisco | 2 | 1 | 1 | — | £5 | 2 | 1 | — |
| Rio–Buenos Aires | Rio de Janeiro | Buenos Aires | 3 | 1 | — | — | £5 | 2 | 1 | South America link |
| European Trunk | London | Berlin | 3 | 2 | 1 | — | £6 | 3 | 1 | — |
| Eastern Seaboard | New York | Miami | 3 | 2 | — | — | £6 | 3 | 1 | — |
| North Sea Express | London | Oslo | 3 | 1 | 1 | — | £6 | 3 | 1 | Nordic connection |
| **Around Cape Horn** | Buenos Aires | Valparaíso | 3 | 2 | 3 | — | £7 | 3 | 1 | High altitude |
| **Arctic Explorer** | Oslo | Svalbard | 3 | 1 | 3 | — | £7 | 3 | 1 | Extreme conditions |
| Transcontinental | Chicago | Los Angeles | 4 | 2 | 1 | — | £7 | 3 | 1 | Coast to coast |
| Mediterranean Express | Rome | Cairo | 4 | 2 | 1 | — | £7 | 3 | 1 | — |
| Trans-Amazon | Rio de Janeiro | Manaus | 4 | 1 | — | — | £7 | 3 | 1 | Jungle route |
| North Atlantic Express | New York | London | 4 | 2 | 2 | — | £8 | 4 | 2 | — |
| **Empire State Express** | New York | Chicago | 3 | 3 | 1 | 1 | £8 | 4 | 1 | Luxury; American prestige |
| **Imperial Airship Route** | London | Cairo | 4 | 2 | 2 | 1 | £9 | 4 | 1 | Luxury; British specialty |
| **California Clipper** | Los Angeles | Honolulu | 5 | 2 | 1 | 1 | £10 | 5 | 1 | Luxury; Pacific crossing |
| **Graf Zeppelin Route** | Rio de Janeiro | Friedrichshafen | 5 | 2 | 2 | 1 | £10 | 5 | 1 | Luxury |
| **Transatlantic Luxury** | London | New York | 4 | 3 | 2 | 2 | £11 | 5 | 2 | Luxury |
| **Hindenburg Route** | Frankfurt | Lakehurst | 5 | 3 | 2 | 2 | £12 | 6 | 1 | Luxury; Hydrogen risk |

**Age III Route Summary:**
- Standard routes: 13
- Luxury routes: 8 (require Luxury stat; marked in **bold**)
- Range 1–2: 5 routes (regional connectors)
- Range 3: 7 routes (medium distance)
- Range 4: 5 routes (continental)
- Range 5: 4 routes (intercontinental)

**Network Connectivity:** All 21 cities across 4 continents are connected. Key hubs are New York (5 connections), London (5 connections), and Rio de Janeiro (4 connections). The network enables travel from any city to any other city via connected routes.

**Luxury Route Warning:** Launching a Hydrogen ship on a Luxury route in Age III risks triggering the **Hindenburg Disaster** if a Catastrophic Explosion hazard is drawn.

---

# APPENDIX G: COMBAT MISSIONS

During Age II (The Great War), routes are replaced by Combat Missions. Draw missions from this deck when launching ships.

## Mission Types

| Type | Icon | Description |
|------|------|-------------|
| **Bombing Run** | Bomb | Strike enemy positions for maximum payout |
| **Reconnaissance** | Spyglass | Gather intelligence behind enemy lines |
| **Resupply** | Crate | Deliver crucial supplies to forward positions |
| **Naval Patrol** | Anchor | Scout for enemy ships and submarines |
| **Artillery Observation** | Target | Direct artillery fire from above |

## Combat Mission Cards (20 total)

### Bombing Runs (6 cards)

| Name | Range | Ceiling | Reliability | Income | VP | Special |
|------|-------|---------|-------------|--------|-----|---------|
| Railway Bombardment | 2 | 1 | 2 | £6 | 1 | — |
| Factory Strike | 3 | 2 | 2 | £8 | 2 | — |
| Port Assault | 3 | 1 | 3 | £8 | 2 | — |
| Deep Strike Mission | 4 | 2 | 2 | £10 | 3 | +£2 with Bombing Equipment |
| Strategic Bombardment | 4 | 2 | 3 | £11 | 4 | +£3 with Bombing Equipment |
| Capital Raid | 5 | 3 | 3 | £14 | 5 | Prestige: +1 bonus VP |

### Reconnaissance (5 cards)

| Name | Range | Speed | Ceiling | Income | VP | Special |
|------|-------|-------|---------|--------|-----|---------|
| Front Line Survey | 2 | 2 | 1 | £5 | 1 | — |
| Artillery Spotting | 2 | 1 | 2 | £5 | 1 | — |
| Enemy Position Mapping | 3 | 2 | 2 | £7 | 2 | — |
| Strategic Photography | 4 | 2 | 3 | £9 | 3 | +1 bonus VP |
| Deep Reconnaissance | 4 | 3 | 2 | £10 | 3 | Draw 2 Hazard cards, choose 1 |

### Resupply Missions (5 cards)

| Name | Range | Speed | Reliability | Income | VP | Special |
|------|-------|-------|-------------|--------|-----|---------|
| Field Hospital Supply | 2 | 1 | 2 | £5 | 1 | — |
| Ammunition Delivery | 3 | 2 | 2 | £7 | 2 | — |
| Forward Base Resupply | 3 | 1 | 3 | £7 | 2 | — |
| Emergency Provisions | 4 | 3 | 2 | £9 | 3 | — |
| Siege Relief | 4 | 2 | 3 | £10 | 3 | +1 bonus VP |

### Naval Patrols (2 cards)

| Name | Range | Speed | Reliability | Income | VP | Special |
|------|-------|-------|-------------|--------|-----|---------|
| Coastal Patrol | 3 | 2 | 2 | £6 | 1 | Ignore 1 Weather hazard |
| Submarine Hunter | 4 | 2 | 3 | £9 | 3 | +£2 with Communications Suite |

### Artillery Observation (2 cards)

| Name | Range | Ceiling | Reliability | Income | VP | Special |
|------|-------|---------|-------------|--------|-----|---------|
| Battery Direction | 2 | 2 | 2 | £6 | 1 | — |
| Long-Range Observation | 3 | 3 | 2 | £8 | 2 | +1 Range with Spotter Gondola |

## Mission Mechanics

**Mission Row Setup:**
At the start of Age II, shuffle the 20-card Combat Mission deck and deal 6 missions face-up to form the **Mission Row**.

**Selecting Missions:**
1. When you take a Launch action in Age II, choose one visible mission from the Mission Row.
2. Verify your Blueprint meets all listed stat requirements.
3. If you cannot meet requirements, you may choose a different mission or pass.

**Completing Missions:**
1. **Hazard Check:** Draw a Hazard card and resolve it normally (same as Age I and III).
2. **If Aborted:** Mission remains in the row (like an unclaimed route). Ship returns to Hangar. Officers kept, gas spent.
3. **If Successful:** Take the mission card and place it in front of you. Gain the listed Income (increase Income Track) and any special bonuses. Spend Officers and gas to supply.
4. **Flak Check:** Compare the Hazard card's Flak value to your ship's Armor. If Flak > Armor, ship is destroyed (return to supply). Otherwise, place ship on your mission card.

**Key Differences from Routes:**
- Missions are one-time—ships do not remain on the map generating ongoing income.
- You earn rewards as long as the mission succeeds, even if flak destroys your ship afterward.
- Completed missions score VP at game end (printed on card).

**Mission Row Refill:**
After each successful mission (removed from row), refill the Mission Row to 6 cards. If the deck is empty, shuffle completed missions to form a new deck.

**Home Base Requirement:** Your first ship in Age II must launch from your faction's Home Base. Subsequent ships may launch from any city where you have a ship.

---

# APPENDIX H: MARKET DECK (AGENT CARDS)

The Market Deck contains 30 purchasable Agent Cards. Five are displayed in the Market Row at all times. Purchase Agent Cards using Influence during the Reveal Phase.

## Reserve Card (Always Available)

The Reserve Card is always available for purchase, separate from the Market Row. Like Dune Imperium's Arrakis Liaison, it provides a reliable deck-building foundation.

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| The Aeronaut | 2 | Any | None | 2 Influence | *Veteran balloonist and lighter-than-air pioneer* |

**Design Note:** The Reserve Card prevents market stagnation by ensuring players always have an affordable purchase option. At cost 2, it's accessible early game; at reveal 2, it builds purchasing power for later rounds.

## Technical Personnel (10 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| Chief Engineer | 4 | Wrench | — | 1 Engineer | *Senior officer of the engineering department* |
| Kite Jockey | 5 | Propeller | +2 Reliability for this launch | 1 Officer | *RFC slang for a daring aviator* |
| Navigator | 3 | Propeller | +1 Range for this launch | 1 £, 1 Influence | *Dead reckoning specialist using course, speed, and drift* |
| The Weatherman | 4 | Propeller | Ignore Weather hazards this launch | 1 Engineer | *Reads the sky better than any bureau telegram* |
| Gasbag Man | 3 | Wrench | Install Gas Tech Tile: -1 Weight | 1 Gas | *Specialist in gas cells and lifting calculations* |
| Engine Room Mechanic | 3 | Wrench | Install Propulsion Tech Tile: -1 Weight | 1 £, 1 Research, 1 Influence | *Machinist assigned to the engine gondolas* |
| The Scrutineer | 4 | Wrench | +2 Reliability for this launch | 1 Engineer | *Official inspector ensuring airworthiness* |
| Rigger Chief | 2 | Wrench | -£2 Hull Cost | 2 £, 1 Influence | *Commands the ground handling crew* |
| Duralumin Man | 3 | Wrench | Install Frame Tech Tile: +1 Lift | 1 Research | *Expert in the lightweight alloy that makes rigids possible* |
| Blaugas Handler | 3 | Wrench | -£2 Lifting Gas cost | 1 Gas, 1 £, 1 Influence | *Manages the special fuel gas carried in the hull* |

## Political/Financial Personnel (10 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| The Nob | 5 | Coin | Gain £5 | 3 Influence | *Old money with connections in high places* |
| Captain of Industry | 6 | Any | Gain £3 | 4 Influence | *A titan of commerce and manufacturing* |
| The Mandarin | 5 | Propeller | Take 2 Ministry actions | 2 Influence, 1 £ | *Senior civil servant with considerable influence* |
| Merchant Prince | 4 | Propeller | +£2 Income from this route | 3 Influence | *Controls lucrative trade routes across continents* |
| Fleet Street Baron | 4 | Any | No action effect | 2 Influence, 2 £ | *The newspapers dance to his tune* |
| The Moneybags | 3 | Coin | Loan gives £35 instead of £30 | 2 Influence | *Capital from abroad, no questions asked* |
| Lloyd's Man | 3 | Coin | Gain 1 Insurance policy | 2 Influence | *Underwriter from the famous London exchange* |
| The Pen-Pusher | 2 | Propeller | Go first in turn order next round | 2 Influence | *Knows which forms to file and when* |
| Shop Steward | 2 | Coin | -£1 per crew recruited this action | 1 Influence, 1 Officer | *Voice of the working men on the factory floor* |
| The Exciseman | 3 | Propeller | Claim route even if tied | 2 Influence | *His Majesty's collector of duties and tariffs* |

## Research Personnel (5 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| The Boffin | 4 | Propeller | -£2 per Technology this round | 2 Research | *Brilliant academic with theoretical insights* |
| Patent Clerk | 3 | Propeller | -1 to Technology Research cost | 2 Influence | *Knows which ideas are truly novel* |
| The Lab Coat | 2 | Propeller | +1 Research this round | 1 Influence, 1 Research | *Tireless experimenter in applied sciences* |
| The Archives | 3 | Propeller | Look at top 3 R&D tiles; reorder them | 2 Research | *Repository of accumulated aeronautical knowledge* |
| Continental Expert | 4 | Propeller | Acquire Tech another player owns (pay double) | 1 Research, 1 £, 1 Influence | *Brings expertise from Europe's leading programs* |

## Organizations (5 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| Royal Geographic Society | 6 | Wrench | Install 1 Tech Tile ignoring Tech requirement | 1 Engineer, 2 Influence | *Patrons of exploration and scientific discovery* |
| Old Contemptible | 5 | Propeller | Gain £8; Combat missions: +£2 Income | 1 Officer, 1 £ | *Survivor of the Kaiser's 'contemptible little army'* |
| Cook's Man | 5 | Propeller | +1 Luxury stat for this launch | 3 Influence | *Agent of Thomas Cook & Son, travel pioneers* |
| Aero Club | 4 | Coin | Recruit 1 Officer free | 2 Influence, 1 Officer | *Gentlemen aviators and aerial enthusiasts* |
| Engineering Guild | 4 | Coin | Recruit 1 Engineer at -£1 | 1 Influence, 1 Engineer | *Brotherhood of skilled craftsmen and artificers* |

**Market Row Mechanics:** Agent Cards are added to the right side of the row. When Agent Cards are purchased, remaining cards slide left (oldest on left, newest on right). The Academy action can purge the leftmost Agent Card. Refill to 5 Agent Cards at end of each round.

---

*"Up Ship!" — The command given by airship captains to release the mooring cables and begin the voyage.*