
# APPENDIX A: TODO LIST — Design Work Remaining

The following items require finalization before the game is complete:

## A.1 Component Design

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

5. **Upgrade Tiles (~80):** Create tiles corresponding to each Technology:
   - Clear visual link between Technology and its Upgrades
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

## A.2 Card Design

1. **Personal Hazard Decks (24 cards each):** Each player gets identical deck. **RESOLVED** - See Appendix E for final distribution:
   - 4 Clear Weather (Auto-pass)
   - 8 Minor Hazards (Difficulty 2-3)
   - 6 Major Hazards (Difficulty 4-5)
   - 5 Fire Hazards (Hydrogen ships only)
   - 1 Mechanical Hazard (Critical Structural Stress)

2. **Market Deck:** Design 30 purchasable crew cards with:
   - Varied costs (2-6 Influence)
   - Mix of resource reveal icons (£, Research, Officer, Engineer, Gas, Influence)
   - Cards that provide resources you can't easily get elsewhere
   - **RESOLVED:** Cards provide resources when revealed (see Section 8)

3. **Starter Deck Review:** Verify the 10-card starter deck provides:
   - Access to all Ground Board locations (mix of symbols)
   - Variety of reveal resources
   - Enough Influence to occasionally buy Market cards

## A.3 Economy Balancing

1. **Research Costs:** Balance Technology prices:
   - Age I: 1-2 Research
   - Age II: 2-4 Research
   - Age III: 4-6 Research
   - Specialization discounts: -1 at 3+ tiles, -2 at 5+ tiles
   - **Note:** Unspent Research is lost each round; invest in Research Level Track for consistent output

2. **Engineer Economy:**
   - Starting Engineers: 2
   - Recruit cost: £4 per Engineer (see Section 6.1)
   - Upkeep cost: £1 per Engineer per round
   - Research generation: 1 per Engineer at Reveal
   - **Note:** Officers cost £2 to recruit (cheaper because consumed on launch)

3. **Route Income Values:** Determine £ values for routes based on:
   - Distance/difficulty
   - Age
   - Strategic importance
   - Target: Ships should pay for themselves in ~3-5 turns

4. **Progress Track Thresholds:** **RESOLVED** - See Section 1.3 for complete table including Age transitions:
   - Age transitions at 8/16/20 (2P), 10/20/25 (3P), 12/24/30 (4P)
   - Test: Does game pacing feel appropriate across all Ages?

5. **Lifting Gas Market:** Set price scaling and:
   - Starting supply per Age
   - Replenishment rules
   - Faction-specific access (USA Helium monopoly)

## A.4 Gameplay Polish

1. **Age End Triggers:** **RESOLVED** - Progress Track milestones trigger Age transitions (see Section 1.3 and 9.1)

2. **Action Selection Mechanism:** Partially resolved:
   - Current system requires spending matching cards for worker placement
   - **RESOLVED:** Research Institute now increases Research Level Track (see Section 6.1)
   - **RESOLVED:** Cards provide resources when revealed instead of being played reactively
   - Still needs testing: Is card-icon matching too restrictive? Consider Apprentice "Any" cards as wild

3. **Agent Count:** 2 agents per player at start, 3rd earned at Officer Income +3
   - **Rationale:** Starting with 2 agents creates tighter early game. Earning the 3rd via Flight School investment creates meaningful progression. Card symbol requirements (Wrench/Coin/Propeller) further constrain choices, making each agent placement feel significant.
   - May need adjustment if playtesting reveals too much or too little competition for key actions

4. **Turn Order:** Define how first player rotates or changes

5. **Tie-Breakers:** Establish rules for ties in route claiming

6. **Player Count Scaling:** Adjust for 2, 3, and 4 players:
   - Available routes
   - Technology tile supply
   - R&D Board size
   - Progress Track threshold

7. **Hindenburg Disaster Tuning:**
   - **Design Intent:** The +3 VP for "historical infamy" is deliberately modest. The player who triggers the disaster loses their ship, Officers, and gas investment, and causes the game to end—potentially denying themselves additional route claims. The +3 VP is consolation, not compensation. The real question is whether triggering the disaster feels like a memorable story moment rather than pure punishment.
   - Requires playtesting to determine if Germany feels too penalized in Age III Luxury competition, or if the risk/reward creates exciting tension.
   - Does the fire trigger (Catastrophic Explosion on Luxury Launch) feel thematically correct?

## A.5 Playtesting Priorities

1. **Engineer Economy Test:** Verify the tension between Research generation and emergency spending feels meaningful

2. **Progress Track Pacing:** Does the fixed-wing threshold create appropriate tension? Assess whether players avoid acquiring Technologies to extend the game, causing Analysis Paralysis. Verify tech acquisition pace feels balanced.

3. **Technology/Upgrade Flow:** Is the two-step system (acquire tech → install upgrade) intuitive?

4. **Hindenburg Drama:** Does the Age III hydrogen risk create exciting decisions?

5. **Faction Balance:** Ensure no faction dominates across all Ages

6. **Age Transition Impact:** Losing Upgrades but keeping Technologies—does this feel fair?

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
12. ✓ **Aborted:** Ship returns to Launch Hangar (Officers and gas lost)
13. ✓ **Damaged:** Ship goes to Repair Hangar (Officers and gas lost)
14. ✓ **Crash:** Ship destroyed (token to supply, Officers and gas lost)
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

Technology tiles are acquired from the R&D Board using Research. Each tile shows: Research Cost, Track (color), Age, £ Value, VP Value (if any), and which Upgrade it unlocks.

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

## Frame Track (8 tiles)

Frame technologies unlock structural skeleton upgrades. Each Frame slot on the Blueprint shows a gas cube icon indicating the launch cost.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Wooden Framework | 1 | 1 | — | Wooden Frame |
| I | Wire Bracing | 2 | 1 | 1 | Tensioned Frame |
| II | Duralumin Framework | 3 | 2 | — | Duralumin Frame |
| II | Steel Framework | 2 | 1 | 2 | Steel Frame |
| II | Internal Keel | 3 | 1 | 1 | Semi-Rigid Keel |
| II | Articulated Keel Design | 3 | 1 | 2 | Flexible Frame |
| III | Geodetic Structure | 4 | 2 | — | Geodetic Frame |
| III | Modular Construction | 5 | 2 | 3 | Modular Frame |

## Fabric Track (7 tiles)

Fabric technologies unlock outer covering and gas cell material upgrades.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Rubberized Cotton | 1 | 1 | — | Cotton Envelope |
| I | Doped Canvas | 2 | 1 | — | Doped Covering |
| II | Goldbeater's Skin | 4 | 2 | 2 | Premium Envelope |
| II | Fireproof Coating | 3 | 1 | 2 | Fire-Resistant Fabric |
| II | Aluminum Doping | 3 | 1 | 1 | Reflective Covering |
| III | Gelatinized Latex | 4 | 2 | — | Synthetic Envelope |
| III | Composite Covering | 5 | 2 | 1 | Advanced Fabric |

## Gas Systems Track (10 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Improved Valving | 1 | 1 | — | Pressure Control |
| I | Manual Ballonets | 1 | 1 | — | Altitude Ballonets |
| II | Multiple Gas Cells | 3 | 1 | — | Compartmented Gas |
| II | Helium Handling | 4 | 2 | — | Helium Gas Cell |
| II | Blaugas Storage | 3 | 2 | 2 | Blaugas Tank |
| II | Automatic Valves | 4 | 2 | 1 | Smart Valving |
| III | Pressure Altitude System | 5 | 3 | 1 | High-Ceiling Gas |
| III | Triple Gas Cell | 4 | 2 | — | Redundant Cells |
| III | Emergency Venting | 4 | 2 | 2 | Rapid Descent System |
| III | Gas Recovery | 5 | 2 | 2 | Reclamation System |

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

**Total: 50 Technology Tiles** (Propulsion 11, Frame 8, Fabric 7, Gas Systems 10, Payload 14)

**Tiles by Age:**
- Age I: 11 tiles (2 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
- Age II: 21 tiles (4 Propulsion, 4 Frame, 3 Fabric, 4 Gas, 6 Payload)
- Age III: 18 tiles (5 Propulsion, 2 Frame, 2 Fabric, 4 Gas, 5 Payload)

**TODO:** Expand each track to balance the game for final production.

---

# APPENDIX D: UPGRADE TILES

Upgrade tiles are installed on your Blueprint. You must own the corresponding Technology to install an Upgrade. Each shows: Weight cost, stat bonuses, and special abilities.

## Propulsion Upgrades

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Basic Engine | Daimler Petrol Engine | -1 | Speed +1 | — |
| Efficient Propeller | Improved Propeller | -1 | Speed +1, Range +1 | — |
| Twin Engine | Dual Engine Mount | -3 | Speed +2, Reliability +1 | — |
| Maybach CX Engine | Maybach Engine Design | -2 | Speed +2, Range +1 | — |
| Diesel Engine | Diesel Powerplant | -2 | Range +2, Reliability +1 | — |
| Vectored Thrust | Swiveling Propeller | -2 | Speed +1, Ceiling +1 | — |
| Balanced Propulsion | Contra-Rotating Props | -2 | Speed +2, Reliability +1 | — |
| Aerodynamic Engine | Streamlined Nacelle | -2 | Speed +3 | — |
| High-Altitude Engine | Supercharged Engine | -3 | Speed +2, Ceiling +2 | — |
| Hybrid Powerplant | Diesel-Electric Drive | -3 | Range +3, Reliability +1 | — |
| Adaptive Propeller | Variable-Pitch Propeller | -2 | Speed +1, Range +2 | — |

## Frame Upgrades

Frame tiles go in Frame slots. Each Frame slot shows a gas cube icon—this indicates the gas cost required for launching. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Wooden Frame | Wooden Framework | -2 | +£1 | Reliability +1 | — |
| Tensioned Frame | Wire Bracing | -1 | +£1 | Ceiling +1 | — |
| Duralumin Frame | Duralumin Framework | -2 | +£2 | Reliability +2, Ceiling +1 | — |
| Steel Frame | Steel Framework | -3 | +£1 | Reliability +2 | Heavier but cheap |
| Semi-Rigid Keel | Internal Keel | -2 | +£1 | Reliability +1 | Italy's specialty |
| Geodetic Frame | Geodetic Structure | -1 | +£3 | Reliability +2, Ceiling +1 | Lightest, most expensive |
| Modular Frame | Modular Construction | -1 | +£2 | — | +2 tile swaps at Design Bureau |
| Flexible Frame | Articulated Keel Design | -1 | +£1 | Reliability +1 | Auto-pass Weather-type hazards (Italy specialty) |

## Fabric Upgrades

Fabric tiles go in Fabric slots. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Cotton Envelope | Rubberized Cotton | 0 | +£0 | — | Basic default |
| Doped Covering | Doped Canvas | 0 | +£1 | Speed +1 | Improved aerodynamics |
| Premium Envelope | Goldbeater's Skin | 0 | +£3 | Reliability +1, Range +1 | Best gas-tightness |
| Fire-Resistant Fabric | Fireproof Coating | -1 | +£2 | Reliability +1 | Once per Age, treat one Fire hazard as auto-pass |
| Reflective Covering | Aluminum Doping | 0 | +£1 | Reliability +1 | Protects gas from heat |
| Synthetic Envelope | Gelatinized Latex | 0 | +£2 | Reliability +1, Range +1 | Modern replacement for goldbeater's |
| Advanced Fabric | Composite Covering | 0 | +£2 | Reliability +2 | Multi-layer protection |

## Gas System Upgrades

**Note:** Each gas cube provides **+5 Lift** regardless of type. Gas System upgrades enhance or modify gas cell performance. **Lift bonuses from upgrades** (such as Compartmented Gas +2, High-Ceiling Gas +3, or Redundant Cells +4) are **additive** with gas cube Lift—they represent improved gas efficiency that gives you extra buoyancy beyond the cubes themselves.

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Pressure Control | Improved Valving | -1 | Ceiling +1 | — |
| Altitude Ballonets | Manual Ballonets | -1 | Ceiling +1 | — |
| Compartmented Gas | Multiple Gas Cells | -1 | Lift +2, Reliability +1 | — |
| Helium Gas Cell | Helium Handling | -1 | — | Safe (immune to Fire hazards); use Helium cubes |
| Blaugas Tank | Blaugas Storage | 0 | Range +3 | Neutral buoyancy fuel |
| Smart Valving | Automatic Valves | -1 | Reliability +1, Ceiling +1 | — |
| High-Ceiling Gas | Pressure Altitude System | -2 | Lift +3, Ceiling +2 | — |
| Redundant Cells | Triple Gas Cell | -2 | Lift +4, Reliability +2 | — |
| Rapid Descent System | Emergency Venting | -1 | Reliability +2 | Auto-pass Weather-type hazards |
| Reclamation System | Gas Recovery | -1 | Range +2 | -£2 Lifting Gas cost |

## Payload Upgrades

| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Spotter Gondola | Observation Platform | -1 | Income +1 | — |
| Postal Service | Mail Compartment | -1 | Income +2 | — |
| External Cargo | Cargo Nets | -2 | Income +2 | — |
| Basic Cabin | Passenger Gondola | -2 | Income +2, Luxury +1 | — |
| Bombing Equipment | Bomb Bay Design | -3 | — | Military Contracts: +£3 Income |
| Sparrowhawk Hangar | Trapeze System | -3 | — | Ignore one route requirement |
| Communications Suite | Radio Equipment | -1 | Reliability +1 | +1 to Navigation hazards |
| Light Armor Plating | Armored Gondola | -2 | Armor +1 | Age II: Survive flak ≤ Armor |
| Heavy Armor Plating | Reinforced Hull | -3 | Armor +2 | Age II: Survive flak ≤ Armor |
| Luxury Cabin | Luxury Accommodation | -3 | Income +3, Luxury +2 | — |
| Restaurant | Dining Saloon | -2 | Income +2, Luxury +2 | — |
| Observation Lounge | Promenade Deck | -2 | Income +1, Luxury +3 | — |
| Private Berths | Sleeping Quarters | -2 | Income +2, Luxury +1 | — |
| Pressurized Lounge | Smoking Room | -2 | Income +1, Luxury +2 | Requires Helium Gas Cell installed |
| Imperial Mast | Imperial Mooring System | -1 | — | British Territories count as Home Base (Britain specialty) |

**Total: 52 Upgrade Tiles** (Propulsion 11, Frame 8, Fabric 7, Gas Systems 10, Payload 16)

---

# APPENDIX E: HAZARD DECK

Each player has an identical Personal Hazard Deck of 20 cards. When launching a ship, draw one card and resolve it.

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

## Major Hazards (6 cards)

| Name | Difficulty | Stat | Type | Flak |
|------|------------|------|------|------|
| Strong Headwind | 4 | Speed | Weather | 2 |
| Icing Conditions | 4 | Ceiling | Weather | 2 |
| Engine Failure | 5 | Reliability | Mechanical | 3 |
| Storm System | 5 | Speed | Weather | 3 |
| Structural Damage | 4 | Reliability | Mechanical | 4 |
| Navigation Error | 4 | Range | Supply | 3 |

## Fire Hazards (5 cards) — Hydrogen Ships Only

Helium ships automatically pass all Fire-type hazards.

| Name | Qty | Flak | Effect |
|------|-----|------|--------|
| **Engine Fire** | 2 | 2 | Spend 1 Engineer to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
| **Gas Cell Rupture** | 2 | 3 | Spend 2 Engineers to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
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
5. **Pass:** Ship reaches route/completes contract successfully
6. **Fail (standard):** Ship returns to Launch Hangar (Officers kept, gas lost)
7. **Damaged:** Ship goes to Repair Hangar (Officers and gas lost)
8. **Crash:** Ship destroyed (token to supply, Officers and gas lost)
9. **Age II Flak Check:** After resolving the hazard (pass or fail), check Flak vs Armor. If mission succeeded and Flak > Armor, ship is destroyed but rewards are still earned.

**Flak Distribution (20 cards):**
- 0 Flak: 7 cards (safe passage)
- 1 Flak: 4 cards (Armor 1+ survives)
- 2 Flak: 4 cards (Armor 2+ survives)
- 3 Flak: 3 cards (Armor 3+ survives)
- 4 Flak: 1 card (Armor 4 survives)
- 5 Flak: 1 card (always destroys)

**Deck Management:** Shuffle your discard pile back into your Hazard Deck when the deck is empty.

---

# APPENDIX F: ROUTES

Routes connect cities on the map boards. Each route has stat requirements that your Blueprint must meet to claim it.

## Age I Routes — The Cradle (Western Europe)

The Pioneer Era features 12 regional routes across Western Europe. Early airship technology limits range and reliability.

| Route | From | To | Range | Speed | Other | Income | Notes |
|-------|------|-----|-------|-------|-------|--------|-------|
| Rhine Valley | Frankfurt | Cologne | 1 | — | — | £2 | Starter route |
| Bodensee Circuit | Friedrichshafen | Konstanz | 1 | — | — | £2 | Germany's home |
| Channel Crossing | Calais | Dover | 1 | 1 | — | £3 | First international |
| Paris Express | Paris | Brussels | 1 | 1 | — | £3 | — |
| North Sea Run | Hamburg | Amsterdam | 2 | 1 | — | £4 | — |
| Baltic Passage | Hamburg | Copenhagen | 2 | 1 | — | £4 | — |
| Alpine Transit | Zurich | Milan | 2 | — | Ceiling 1 | £4 | Mountain crossing |
| Mediterranean Link | Marseille | Barcelona | 2 | 1 | — | £4 | — |
| London–Paris | London | Paris | 2 | 2 | — | £5 | Double track |
| Berlin–Vienna | Berlin | Vienna | 3 | 1 | — | £5 | — |
| Rome Approach | Milan | Rome | 2 | 1 | Ceiling 1 | £5 | Italy's home |
| Imperial Circuit | London | Berlin | 3 | 2 | — | £6 | Prestige route |

**Age I Route Summary:**
- Range 1: 2 routes
- Range 2: 7 routes
- Range 3: 3 routes

## Age III Routes — The Golden Age (The Atlantic)

The Atlantic Era features 16 hemispheric routes including luxury ocean crossings. Advanced technology enables intercontinental travel.

| Route | From | To | Range | Speed | Ceiling | Luxury | Income | Notes |
|-------|------|-----|-------|-------|---------|--------|--------|-------|
| North Atlantic Express | New York | London | 4 | 2 | 2 | — | £8 | Double track |
| South Atlantic | Rio de Janeiro | Recife | 2 | 1 | — | — | £5 | Brazil domestic |
| Caribbean Connection | Miami | Havana | 2 | 1 | — | — | £5 | — |
| European Trunk | London | Berlin | 3 | 2 | 1 | — | £6 | — |
| Mediterranean Express | Rome | Cairo | 4 | 2 | 1 | — | £7 | — |
| Pacific Coast | Los Angeles | San Francisco | 2 | 1 | 1 | — | £5 | — |
| Eastern Seaboard | New York | Miami | 3 | 2 | — | — | £6 | — |
| Trans-Amazon | Rio de Janeiro | Manaus | 4 | 1 | — | — | £7 | Jungle route |
| **Hindenburg Route** | Frankfurt | Lakehurst | 5 | 3 | 2 | 2 | £12 | Luxury; Hydrogen risk |
| **Graf Zeppelin Route** | Rio de Janeiro | Friedrichshafen | 5 | 2 | 2 | 1 | £10 | Luxury |
| **Imperial Airship Route** | London | Cairo | 4 | 2 | 2 | 1 | £9 | Luxury; British specialty |
| **Transatlantic Luxury** | London | New York | 4 | 3 | 2 | 2 | £11 | Luxury; Double track |
| **Around Cape Horn** | Buenos Aires | Valparaíso | 3 | 2 | 3 | — | £7 | High altitude |
| **Arctic Explorer** | Oslo | Svalbard | 3 | 1 | 3 | — | £7 | Extreme conditions |
| **California Clipper** | Los Angeles | Honolulu | 5 | 2 | 1 | 1 | £10 | Luxury; Pacific crossing |
| **Empire State Express** | New York | Chicago | 3 | 3 | 1 | 1 | £8 | Luxury; American prestige |

**Age III Route Summary:**
- Standard routes: 8
- Luxury routes: 8 (require Luxury stat; marked in **bold**)
- Range 2–3: 6 routes (regional)
- Range 4: 5 routes (continental)
- Range 5: 3 routes (intercontinental)

**Luxury Route Warning:** Launching a Hydrogen ship on a Luxury route in Age III risks triggering the **Hindenburg Disaster** if a Catastrophic Explosion hazard is drawn.

---

# APPENDIX G: MILITARY CONTRACTS

During Age II (The Great War), routes are replaced by Military Contracts. Draw contracts from this deck when launching ships.

## Contract Types

| Type | Icon | Description |
|------|------|-------------|
| **Bombing Run** | Bomb | Strike enemy positions for maximum payout |
| **Reconnaissance** | Spyglass | Gather intelligence behind enemy lines |
| **Resupply** | Crate | Deliver crucial supplies to forward positions |
| **Naval Patrol** | Anchor | Scout for enemy ships and submarines |
| **Artillery Observation** | Target | Direct artillery fire from above |

## Military Contract Cards (20 total)

### Bombing Runs (6 cards)

| Name | Range | Ceiling | Reliability | Income | Special |
|------|-------|---------|-------------|--------|---------|
| Railway Bombardment | 2 | 1 | 2 | £6 | — |
| Factory Strike | 3 | 2 | 2 | £8 | — |
| Port Assault | 3 | 1 | 3 | £8 | — |
| Deep Strike Mission | 4 | 2 | 2 | £10 | +£2 with Bombing Equipment |
| Strategic Bombardment | 4 | 2 | 3 | £11 | +£3 with Bombing Equipment |
| Capital Raid | 5 | 3 | 3 | £14 | Prestige: +2 VP |

### Reconnaissance (5 cards)

| Name | Range | Speed | Ceiling | Income | Special |
|------|-------|-------|---------|--------|---------|
| Front Line Survey | 2 | 2 | 1 | £5 | — |
| Enemy Position Mapping | 3 | 2 | 2 | £7 | — |
| Artillery Spotting | 2 | 1 | 2 | £5 | — |
| Strategic Photography | 4 | 2 | 3 | £9 | +1 VP |
| Deep Reconnaissance | 4 | 3 | 2 | £10 | Draw 2 Hazard cards, choose 1 |

### Resupply Missions (5 cards)

| Name | Range | Speed | Reliability | Income | Special |
|------|-------|-------|-------------|--------|---------|
| Field Hospital Supply | 2 | 1 | 2 | £5 | — |
| Ammunition Delivery | 3 | 2 | 2 | £7 | — |
| Forward Base Resupply | 3 | 1 | 3 | £7 | — |
| Emergency Provisions | 4 | 3 | 2 | £9 | — |
| Siege Relief | 4 | 2 | 3 | £10 | +1 VP |

### Naval Patrols (2 cards)

| Name | Range | Speed | Reliability | Income | Special |
|------|-------|-------|-------------|--------|---------|
| Coastal Patrol | 3 | 2 | 2 | £6 | Ignore 1 Weather hazard |
| Submarine Hunter | 4 | 2 | 3 | £9 | +£2 with Communications Suite |

### Artillery Observation (2 cards)

| Name | Range | Ceiling | Reliability | Income | Special |
|------|-------|---------|-------------|--------|---------|
| Battery Direction | 2 | 2 | 2 | £6 | — |
| Long-Range Observation | 3 | 3 | 2 | £8 | +1 Range with Spotter Gondola |

## Contract Mechanics

**Contract Row Setup:**
At the start of Age II, shuffle the 20-card Military Contract deck and deal 6 contracts face-up to form the **Contract Row**.

**Selecting Contracts:**
1. When you take a Launch action in Age II, choose one visible contract from the Contract Row.
2. Verify your Blueprint meets all listed stat requirements.
3. If you cannot meet requirements, you may choose a different contract or pass.

**Completing Contracts:**
1. **Hazard Check:** Draw a Hazard card and resolve it normally (same as Age I and III).
2. **If Aborted:** Contract remains in the row (like an unclaimed route). Ship returns to Hangar. Officers kept, gas spent.
3. **If Successful:** Take the contract card and place it in front of you. Gain the listed Income (increase Income Track) and any special bonuses. Spend Officers and gas to supply.
4. **Flak Check:** Compare the Hazard card's Flak value to your ship's Armor. If Flak > Armor, ship is destroyed (return to supply). Otherwise, place ship on your contract card.

**Key Differences from Routes:**
- Contracts are one-time missions—ships do not remain on the map generating ongoing income.
- You earn rewards as long as the mission succeeds, even if flak destroys your ship afterward.
- Completed contracts score VP at game end (printed on card).

**Contract Row Refill:**
After each successful contract (removed from row), refill the Contract Row to 6 cards. If the deck is empty, shuffle completed contracts to form a new deck.

**Home Base Requirement:** Your first ship in Age II must launch from your faction's Home Base. Subsequent ships may launch from any city where you have a ship.

---

# APPENDIX H: MARKET DECK

The Market Deck contains 30 purchasable crew cards. Five are displayed in the Market Row at all times. Purchase cards using Influence during the Reveal Phase.

## Technical Personnel (10 cards)

| Name | Cost | Symbol | Agent Effect | Reveal |
|------|------|--------|--------------|--------|
| Chief Engineer | 4 | Wrench | +2 tile swaps | 1 Engineer |
| Test Pilot | 5 | Propeller | +2 Reliability for this launch | 1 Officer |
| Navigator | 3 | Propeller | +1 Range for this launch | 1 £, 1 Influence |
| Weather Expert | 4 | Propeller | Ignore Weather hazards this launch | 1 Engineer |
| Gas Engineer | 3 | Wrench | Install Gas upgrade: -1 Weight | 1 Gas |
| Engine Specialist | 3 | Wrench | Install Propulsion upgrade: -1 Weight | 1 £, 1 Research |
| Safety Inspector | 4 | Wrench | +2 Reliability for this launch | 1 Engineer |
| Ground Crew Chief | 2 | Wrench | -£2 Hull Cost | 2 £ |
| Structural Engineer | 3 | Wrench | Install Structure upgrade: +1 Lift | 1 Research |
| Fuel Specialist | 3 | Wrench | -£2 Lifting Gas cost | 1 Gas, 1 £ |

## Political/Financial Personnel (10 cards)

| Name | Cost | Symbol | Agent Effect | Reveal |
|------|------|--------|--------------|--------|
| The Aristocrat | 5 | Coin | Gain £5 | 3 Influence |
| Industrial Magnate | 6 | Any | Gain £3 | 4 Influence |
| Government Minister | 5 | Propeller | Take 2 Ministry actions | 2 Influence, 1 £ |
| Shipping Tycoon | 4 | Propeller | +£2 Income from this route | 3 Influence |
| Press Baron | 4 | Any | No action effect | 2 Influence, 2 £ |
| Foreign Investor | 3 | Coin | Loan gives £35 instead of £30 | 2 Influence |
| Insurance Agent | 3 | Coin | Gain 1 Insurance policy | 2 Influence |
| Bureaucrat | 2 | Propeller | Go first in turn order next round | 2 Influence |
| Union Representative | 2 | Coin | -£1 per crew recruited this action | 1 Influence, 1 Officer |
| Customs Official | 3 | Propeller | Claim route even if tied | 2 Influence |

## Research Personnel (5 cards)

| Name | Cost | Symbol | Agent Effect | Reveal |
|------|------|--------|--------------|--------|
| University Partnership | 4 | Propeller | -£2 per Technology this round | 2 Research |
| Patent Attorney | 3 | Propeller | -1 to Technology Research cost | 2 Influence |
| Research Assistant | 2 | Propeller | +1 Research this round | 1 Influence, 1 Research |
| Technical Library | 3 | Propeller | Look at top 3 R&D tiles; reorder them | 2 Research |
| Foreign Consultant | 4 | Propeller | Acquire Tech another player owns (pay double) | 1 Research, 1 £ |

## Organizations (5 cards)

| Name | Cost | Symbol | Agent Effect | Reveal |
|------|------|--------|--------------|--------|
| Royal Geographic Society | 6 | Wrench | Install 1 Upgrade ignoring Tech requirement | 1 Engineer, 2 Influence |
| Military Contract | 5 | Propeller | Gain £8; Military routes: +£2 Income | 1 Officer, 1 £ |
| Luxury Travel Agency | 5 | Propeller | +1 Luxury stat for this launch | 3 Influence |
| Aviation Club | 4 | Coin | Recruit 1 Officer free | 2 Influence, 1 Officer |
| Engineering Guild | 4 | Coin | Recruit 1 Engineer at -£1 | 1 Influence, 1 Engineer |

**Market Row Mechanics:** Cards are added to the right side of the row. When cards are purchased, remaining cards slide left (oldest on left, newest on right). The Academy action can purge the leftmost card. Refill to 5 cards at end of each round.

---

*"Up Ship!" — The command given by airship captains to release the mooring cables and begin the voyage.*