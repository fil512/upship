# APPENDIX A: QUICK REFERENCE

## Phase Order (Each Round)

**Phase A: Agent Turns** (take turns until all players Reveal)

On your turn, either:
- **Place an Agent:** Play matching card, execute location action
- **Reveal:** Show hand → gain resources → acquire Technologies → purchase cards → replenish R&D Board and Market Row → discard hand

**Phase B: Income & Cleanup**

1. Collect Income (Income Track − Engineers)
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

1. ✓ Verify Physics Check (Lift ≥ Weight) AND at least one Frame/Fabric/Drive tile AND Range ≥ 1 AND Speed ≥ 1
2. ✓ Select a ship from Launch Hangar
3. ✓ Spend Officers equal to Age (1/2/3) (Barracks → shared supply)
4. ✓ Choose gas type (Hydrogen or Helium—no mixing)
5. ✓ Pay for Lifting Gas (Gas Reserve first, then market price for deficit)
6. ✓ Assign to valid route (must meet stat requirements)
7. ✓ Draw Hazard Card from your personal Hazard Deck
8. ✓ Calculate Total Difficulty = Hazard Difficulty + Mission Difficulty − Ship Reliability (min 0)
9. ✓ If Total Difficulty = 0: Auto-pass. If > 0: Spend that many Engineers to pass.
10. ✓ If Fire hazard and using Hydrogen: Spend required Engineers or crash
11. ✓ If Catastrophic Explosion on Luxury Launch in Age III: Hindenburg Disaster triggered
12. ✓ **Success:** Place ship on route, increase Income, gain city bonus
13. ✓ **Aborted:** Ship returns to Launch Hangar (Officers kept, gas spent)
14. ✓ **Damaged:** Ship goes to Repair Hangar (Officers and gas spent)
15. ✓ **Crash:** Ship destroyed (token to supply, Officers and gas spent)
16. ✓ Continue launching more ships or stop

## Key Formulas

- **Hull Cost:** £2 base + Frame tile cost + Fabric tile cost
- **Physics Check:** Total Lift ≥ Total Weight
- **Lift Calculation:** Number of gas cubes × 5 (all gas types provide +5 Lift)
- **Gas Rule:** Choose Hydrogen or Helium per launch—no mixing within a single launch
- **Total Difficulty:** Hazard Difficulty + Mission Difficulty − Ship Reliability (minimum 0)
- **Hazard Check:** If Total Difficulty = 0, auto-pass. If > 0, spend that many Engineers to pass.
- **Research per Round:** Research Level + Engineers in Barracks + Research icons from revealed cards (unspent lost)
- **Net Income:** Income Track − Engineers in Barracks
- **Tech Cost:** Listed cost − Specialization Discount
- **Transition Income:** (£ from Tech tiles) − (£1 × routes lost), minimum £0
- **Repair Cost:** (Hull Cost ÷ 2, rounded down) + 1 Engineer per ship (Repair action space only)
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

# APPENDIX B: FACTION STARTING CONFIGURATIONS

## Design Goals

All factions start with identical baseline performance plus one unique faction bonus.

**Baseline Stats (All Factions):**
| Stat | Value | Source |
|------|-------|--------|
| Speed | 1 | Drive tile |
| Range | 1 | Drive tile |
| Ceiling | 0 | — |
| Reliability | 0 | — |
| Luxury | 0 | — |
| Lift | 0 | (from tiles; gas provides additional lift) |

**Starting Tiles (All Factions):**
- 1 Frame tile (provides 1 gas socket for lift)
- 1 Fabric tile (basic covering, no stats)
- 1 Drive tile (provides Speed 1, Range 1)
- 1 Bonus tile (provides faction's unique advantage)

**Faction Bonuses:**

| Faction | Bonus | Total Stats | Historical Rationale |
|---------|-------|-------------|---------------------|
| Germany | +1 Speed | Speed 2, Range 1 | Powerful Maybach engines made Zeppelins the fastest rigid airships |
| Britain | +1 Income | Speed 1, Range 1, Income 1 | Imperial Airship Scheme prioritized profitable passenger service |
| USA | Fire Immunity | Speed 1, Range 1 + safe | Domestic helium monopoly enabled non-flammable operations |
| Italy | +1 Range | Speed 1, Range 2 | Nobile's polar expeditions demanded maximum range |

**Weight Budget:**
All factions have total starting weight of **5**, requiring 1 gas cube (5 lift) to launch.

## Starting Configurations

### Germany — Speed 2, Range 1
| Slot | Tile | Stats | Weight |
|------|------|-------|--------|
| Frame | Zeppelin Frame | gas_socket: 1 | 2 |
| Fabric | Premium Envelope | Reliability +1, Range +1 | 1 |
| Drive | Basic Engine | Speed 1, Range 1 | 1 |
| **Bonus** | **Maybach CX** | **Speed +1** | 1 |
| **Total** | | **Speed 2, Range 2, Reliability 1** | **5** |

**Starting Tech Cards:** Zeppelin Girders, Goldbeater's Skin, Daimler Engine, Maybach Engine

### Britain — Speed 1, Range 1, Income 1
| Slot | Tile | Stats | Weight |
|------|------|-------|--------|
| Frame | Tensioned Frame | gas_socket: 1 | 2 |
| Fabric | Doped Covering | — | 1 |
| Drive | Standard Engine | Speed 1, Range 1 | 1 |
| **Bonus** | **Passenger Cabin** | **Income +1** | 1 |
| **Total** | | **Speed 1, Range 1, Income 1** | **5** |

**Starting Tech Cards:** Wire Bracing, Doped Canvas, Standard Propeller, Passenger Accommodation

### USA — Speed 1, Range 1, Fire Immunity
| Slot | Tile | Stats | Weight |
|------|------|-------|--------|
| Frame | Duralumin Frame | gas_socket: 1 | 2 |
| Fabric | Latex Envelope | — | 1 |
| Drive | Reliable Engine | Speed 1, Range 1 | 1 |
| **Bonus** | **Helium Gas Cell** | **Fire Immunity** | 1 |
| **Total** | | **Speed 1, Range 1, Fire Immune** | **5** |

**Starting Tech Cards:** Duralumin Girders, Latex Covering, Basic Powerplant, Helium Handling

### Italy — Speed 1, Range 2
| Slot | Tile | Stats | Weight |
|------|------|-------|--------|
| Frame | Semi-Rigid Keel | gas_socket: 1, Reliability +1 | 2 |
| Fabric | Cotton Envelope | — | 1 |
| Drive | Basic Engine | Speed 1, Range 1 | 1 |
| **Bonus** | **Expedition Engine** | **Range +1** | 1 |
| **Total** | | **Speed 1, Range 2, Reliability 1** | **5** |

**Starting Tech Cards:** Internal Keel, Rubberized Cotton, Daimler Engine, Expedition Propeller

*Note: All factions require exactly 1 gas cube to launch their starting ship (5 lift = 5 weight).*

---

# APPENDIX C: TECHNOLOGY TILES

Technology tiles are acquired from the R&D Board using Research. Each tile shows: Research Cost, Track (color), Age, £ Value, VP Value (if any), and which Tech Tile it unlocks.

## Reserve Tech Card (Always Available)

The Reserve Tech Card is always available for acquisition, separate from the R&D Board. Like the Aeronaut agent card, it provides a reliable option that never runs out.

| Name | Cost | Track | £ | VP | Unlocks |
|------|------|-------|---|----|---------|
| Helium Handling | 5 | Gas Systems | 2 | — | Helium Gas Cell |

**Design Note:** Helium Handling is essential for safe launches in Age III (immunity to Fire hazards). Making it always available ensures players aren't locked out of a critical technology by bad draw luck, while the high cost (5 Research) keeps it a meaningful investment.

## Propulsion Track (11 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Daimler Petrol Engine | 3 | 1 | — | Basic Engine |
| I | Improved Propeller | 3 | 1 | — | Efficient Propeller |
| I | Dual Engine Mount | 5 | 1 | 1 | Twin Engine |
| II | Maybach Engine Design | 7 | 2 | — | Maybach CX Engine |
| II | Diesel Powerplant | 7 | 1 | 1 | Diesel Engine |
| II | Swiveling Propeller | 8 | 2 | 1 | Vectored Thrust |
| II | Contra-Rotating Props | 8 | 2 | — | Balanced Propulsion |
| III | Streamlined Nacelle | 9 | 2 | — | Aerodynamic Engine |
| III | Supercharged Engine | 10 | 3 | 1 | High-Altitude Engine |
| III | Diesel-Electric Drive | 10 | 2 | 1 | Hybrid Powerplant |
| III | Variable-Pitch Propeller | 9 | 2 | — | Adaptive Propeller |

## Frame Track (10 tiles)

Frame technologies unlock structural skeleton upgrades. Each Frame slot on the Blueprint shows a gas cube icon indicating the launch cost.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Wooden Framework | 3 | 1 | — | Wooden Frame |
| I | Wire Bracing | 5 | 1 | 1 | Tensioned Frame |
| II | Duralumin Framework | 7 | 2 | — | Duralumin Frame |
| II | Steel Framework | 6 | 1 | 2 | Steel Frame |
| II | Internal Keel | 7 | 1 | 1 | Semi-Rigid Keel |
| II | Articulated Keel Design | 7 | 1 | 2 | Flexible Frame |
| II | Aerodynamic Hull Design | 7 | 1 | 1 | Streamlined Hull |
| III | Geodetic Structure | 9 | 2 | — | Geodetic Frame |
| III | Modular Construction | 10 | 2 | 3 | Modular Frame |
| III | Dynamic Lift Surfaces | 10 | 2 | 2 | Aerodynamic Lift System |

## Fabric Track (8 tiles)

Fabric technologies unlock outer covering and gas cell material upgrades.

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Rubberized Cotton | 3 | 1 | — | Cotton Envelope |
| I | Doped Canvas | 5 | 1 | — | Doped Covering |
| II | Goldbeater's Skin | 8 | 2 | 2 | Premium Envelope |
| II | Fireproof Coating | 7 | 1 | 2 | Fire-Resistant Fabric |
| II | Aluminum Doping | 7 | 1 | 1 | Reflective Covering |
| II | Grounding Systems | 7 | 1 | 1 | Conductive Covering |
| III | Gelatinized Latex | 9 | 2 | — | Synthetic Envelope |
| III | Composite Covering | 10 | 2 | 1 | Advanced Fabric |

## Gas Systems Track (10 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Improved Valving | 3 | 1 | — | Pressure Control |
| I | Manual Ballonets | 3 | 1 | — | Altitude Ballonets |
| II | Multiple Gas Cells | 7 | 1 | — | Compartmented Gas |
| II | Blaugas Fuel System | 7 | 2 | 2 | Blaugas Tank |
| II | Automatic Valves | 8 | 2 | 1 | Smart Valving |
| III | Pressure Altitude System | 10 | 3 | 1 | High-Ceiling Gas |
| III | Triple Gas Cell | 9 | 2 | — | Redundant Cells |
| III | Emergency Venting | 9 | 2 | 2 | Rapid Descent System |
| III | Gas Recovery | 10 | 2 | 2 | Reclamation System |
| III | Water Recovery System | 10 | 2 | 1 | Exhaust Condensers |

*Note: Helium Handling is not in the Technology Bag—it is always available as the Reserve Tech Card.*

## Payload Track (14 tiles)

| Age | Name | Cost | £ | VP | Unlocks |
|-----|------|------|---|----|---------|
| I | Observation Platform | 3 | 1 | — | Spotter Gondola |
| I | Mail Compartment | 3 | 1 | — | Postal Service |
| I | Cargo Nets | 5 | 1 | 1 | External Cargo |
| II | Passenger Gondola | 7 | 1 | — | Basic Cabin |
| II | Bomb Bay Design | 8 | 2 | 3 | Bombing Equipment |
| II | Trapeze System | 8 | 2 | 2 | Sparrowhawk Hangar |
| II | Radio Equipment | 7 | 1 | 1 | Communications Suite |
| II | Armored Gondola | 7 | 1 | 1 | Light Armor Plating |
| II | Reinforced Hull | 8 | 2 | 2 | Heavy Armor Plating |
| III | Luxury Accommodation | 9 | 2 | — | Luxury Cabin |
| III | Dining Saloon | 10 | 3 | — | Restaurant |
| III | Promenade Deck | 11 | 3 | 2 | Observation Lounge |
| III | Sleeping Quarters | 9 | 2 | 1 | Private Berths |
| III | Smoking Room | 10 | 2 | 3 | Pressurized Lounge |

## Faction Starting Technologies (5 cards)

These technologies are given to specific factions at game start and are NOT available in the R&D Board. Each faction receives their starting tech cards during setup.

| Faction | Name | Track | £ | Unlocks |
|---------|------|-------|---|---------|
| Germany | Zeppelin Girders | Frame | 1 | Zeppelin Frame |
| Britain | Standard Propeller | Propulsion | 1 | Standard Engine |
| Britain | Passenger Accommodation | Payload | 1 | Passenger Cabin |
| USA | Basic Powerplant | Propulsion | 1 | Reliable Engine |
| Italy | Expedition Propeller | Propulsion | 1 | Expedition Engine |

*Note: These 5 tech cards + their tiles are faction-exclusive starting equipment. The other starting techs (Goldbeater's Skin, Wire Bracing, Doped Canvas, etc.) are available in the R&D Board and one copy is removed per faction that starts with it.*

**53 Unique Technology Tiles** (Propulsion 11, Frame 10, Fabric 8, Gas Systems 10, Payload 14) + 1 Reserve Tech Card (Helium Handling)

**Tiles by Age:**
- Age I: 12 tiles (3 Propulsion, 2 Frame, 2 Fabric, 2 Gas, 3 Payload)
- Age II: 22 tiles (4 Propulsion, 5 Frame, 4 Fabric, 3 Gas, 6 Payload) — *Helium Handling is always available, not in bag*
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
| Maybach CX Engine | Maybach Engine Design | 2 | Speed +1, Range +1 | — |
| Diesel Engine | Diesel Powerplant | 2 | Range +2, Reliability +1 | — |
| Vectored Thrust | Swiveling Propeller | 2 | Speed +1, Ceiling +1 | — |
| Balanced Propulsion | Contra-Rotating Props | 2 | Speed +2, Reliability +1 | — |
| Aerodynamic Engine | Streamlined Nacelle | 2 | Speed +3 | — |
| High-Altitude Engine | Supercharged Engine | 3 | Speed +2, Ceiling +2 | — |
| Hybrid Powerplant | Diesel-Electric Drive | 3 | Range +3, Reliability +1 | — |
| Adaptive Propeller | Variable-Pitch Propeller | 2 | Speed +1, Range +2 | — |
| Standard Engine | Standard Propeller | 1 | Speed +1, Range +1 | Britain starting tech |
| Reliable Engine | Basic Powerplant | 1 | Speed +1, Range +1 | USA starting tech |
| Expedition Engine | Expedition Propeller | 1 | Range +2 | Italy starting tech |

## Frame Tech Tiles

Frame tiles go in Frame slots. Each Frame slot shows a gas cube icon—this indicates the gas cost required for launching. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Zeppelin Frame | Zeppelin Girders | 2 | +£1 | gas_socket: 1 | Germany starting tech |
| Wooden Frame | Wooden Framework | 2 | +£1 | gas_socket: 1, Reliability +1 | — |
| Tensioned Frame | Wire Bracing | 2 | +£1 | gas_socket: 1 | Britain starting tech |
| Duralumin Frame | Duralumin Framework | 2 | +£1 | gas_socket: 1 | USA starting tech |
| Steel Frame | Steel Framework | 3 | +£1 | gas_socket: 1, Reliability +2 | Heavier but cheap |
| Semi-Rigid Keel | Internal Keel | 2 | +£1 | gas_socket: 1, Reliability +1 | Italy starting tech |
| Geodetic Frame | Geodetic Structure | 1 | +£3 | gas_socket: 1, Reliability +2, Ceiling +1 | Lightest, most expensive |
| Modular Frame | Modular Construction | 1 | +£2 | gas_socket: 1 | — |
| Flexible Frame | Articulated Keel Design | 0 | +£1 | gas_socket: 1, Lift +1 | Lightest frame option |
| Streamlined Hull | Aerodynamic Hull Design | 1 | +£2 | gas_socket: 1, Lift +2 | Provides lift without gas |
| Aerodynamic Lift System | Dynamic Lift Surfaces | 2 | +£3 | gas_socket: 1, Lift +4 | Provides lift without gas |

## Fabric Tech Tiles

Fabric tiles go in Fabric slots. The **Hull Cost** column shows how much this tile adds to the cost of building ships.

| Name | Required Tech | Weight | Hull Cost | Stats | Special |
|------|---------------|--------|-----------|-------|---------|
| Latex Envelope | Latex Covering | 1 | +£1 | — | USA starting tech |
| Cotton Envelope | Rubberized Cotton | 1 | +£1 | — | Italy starting tech |
| Doped Covering | Doped Canvas | 1 | +£1 | — | Britain starting tech |
| Premium Envelope | Goldbeater's Skin | 1 | +£3 | Reliability +1, Range +1 | Germany starting tech |
| Fire-Resistant Fabric | Fireproof Coating | 1 | +£2 | Reliability +1 | Once per Age, treat one Fire hazard as auto-pass |
| Reflective Covering | Aluminum Doping | 0 | +£1 | Reliability +1 | Protects gas from heat |
| Conductive Covering | Grounding Systems | 0 | +£1 | Reliability +1 | Immune to Static Discharge hazard |
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
| Passenger Cabin | Passenger Accommodation | 1 | Income +1 | Britain starting tech (bonus tile) |
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

**Total: 62 Tech Tiles** (Propulsion 14, Frame 11, Fabric 9, Gas Systems 11, Payload 17)

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

| Name | Difficulty | Type | Flak |
|------|------------|------|------|
| Light Turbulence | 2 | Weather | 0 |
| Minor Engine Trouble | 1 | Mechanical | 1 |
| Crosswind | 3 | Weather | 0 |
| Gas Leak | 2 | Mechanical | 1 |
| Low Visibility | 2 | Weather | 1 |
| Fuel Concern | 2 | Supply | 0 |
| Headwind | 3 | Weather | 1 |
| Structural Stress | 2 | Mechanical | 2 |

## Major Hazards (8 cards)

| Name | Difficulty | Type | Flak | Special |
|------|------------|------|------|---------|
| Strong Headwind | 4 | Weather | 2 | — |
| Icing Conditions | 3 | Weather | 2 | On failure, also lose 1 gas cube. If no gas remains, ship Destroyed. |
| Engine Failure | 3 | Mechanical | 3 | — |
| Storm System | 4 | Weather | 3 | — |
| Structural Damage | 3 | Mechanical | 4 | — |
| Navigation Error | 3 | Supply | 3 | — |
| Squall Line | 4 | Weather | 3 | Ships with 3+ Payload slots suffer +1 Difficulty. Historical: USS Shenandoah was torn apart by shear forces. |
| Severe Icing | 2 | Weather | 2 | On failure, lose 2 gas cubes. If gas remains < ship's minimum, ship Destroyed. |

## Fire Hazards (6 cards) — Hydrogen Ships Only

Helium ships automatically pass all Fire-type hazards.

| Name | Qty | Difficulty | Flak | Effect |
|------|-----|------------|------|--------|
| **Engine Fire** | 2 | — | 2 | Spend 1 Engineer to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
| **Gas Cell Rupture** | 2 | — | 3 | Spend 2 Engineers to control → Ship Damaged (Repair Hangar). Fail → Ship crashes. |
| **Static Discharge** | 1 | 2 | 4 | Standard hazard check. Fail → Ship crashes. Historical: Models the Hindenburg's static discharge ignition. |
| **Catastrophic Explosion** | 1 | — | 5 | No save possible. Ship crashes. If Luxury Launch in Age III: Hindenburg Disaster triggered. |

## Mechanical Hazards (1 card)

| Name | Qty | Flak | Effect |
|------|-----|------|--------|
| **Critical Structural Stress** | 1 | 4 | Spend 2 Engineers to stabilize → Ship Damaged (Repair Hangar). Fail → Ship crashes. |

**Resolving Hazards:**
1. Draw card from your Personal Hazard Deck
2. Check if auto-pass (Clear Weather cards, or Helium ship vs Fire hazards)
3. **Calculate Total Difficulty:** Hazard Difficulty + Mission Difficulty − Ship Reliability (minimum 0)
4. **If Total Difficulty = 0:** Auto-pass (Reliability overcomes the hazard)
5. **If Total Difficulty > 0:** Spend that many Engineers to pass, or abort/crash
6. For Fire hazards (Engine Fire, Gas Cell Rupture): Spend fixed Engineers or crash
7. **Pass:** Ship reaches route/completes mission successfully
8. **Abort (standard hazards):** Ship returns to Launch Hangar (Officers kept, gas lost)
9. **Damaged:** Ship goes to Repair Hangar (Officers and gas lost)
10. **Crash:** Ship destroyed (token to supply, Officers and gas lost)
11. **Age II Flak Check:** After resolving the hazard (pass or fail), check Flak vs Armor. If mission succeeded and Flak > Armor, ship is destroyed but rewards are still earned.

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

| Route | From | To | Range | Speed | Ceiling | Income | VP | Tracks | Notes |
|-------|------|-----|-------|-------|---------|--------|-----|--------|-------|
| London Gateway | London | Dover | 1 | 1 | — | £2 | 1 | 1 | Channel feeder |
| Channel Crossing | Calais | Dover | 1 | 2 | — | £3 | 2 | 1 | First international |
| Rhine Valley | Frankfurt | Cologne | 1 | 1 | — | £2 | 1 | 1 | Starter route |
| Low Countries | Brussels | Amsterdam | 1 | 2 | — | £3 | 2 | 1 | Connects Benelux |
| Paris Express | Paris | Brussels | 1 | 2 | — | £3 | 2 | 1 | — |
| Rhineland | Brussels | Cologne | 1 | 2 | — | £3 | 2 | 1 | Rhine access |
| Lake Constance | Friedrichshafen | Zurich | 1 | 1 | — | £3 | 2 | 1 | Alpine approach |
| London–Paris | London | Paris | 2 | 3 | — | £5 | 3 | 2 | — |
| North Sea Run | Hamburg | Amsterdam | 2 | 2 | — | £4 | 2 | 1 | — |
| Baltic Passage | Hamburg | Copenhagen | 2 | 2 | — | £4 | 2 | 1 | — |
| Alpine Transit | Zurich | Milan | 2 | 1 | 1 | £4 | 2 | 1 | Mountain crossing |
| Mediterranean Link | Marseille | Barcelona | 2 | 2 | — | £4 | 2 | 1 | — |
| German Alps | Frankfurt | Friedrichshafen | 2 | 1 | 1 | £4 | 2 | 1 | Germany's backbone |
| Rome Approach | Milan | Rome | 2 | 2 | 1 | £5 | 3 | 1 | Italy's home |
| Riviera Express | Paris | Marseille | 3 | 2 | — | £4 | 2 | 1 | French corridor |
| Berlin–Vienna | Berlin | Vienna | 3 | 2 | — | £5 | 3 | 1 | — |
| Imperial Circuit | London | Berlin | 3 | 3 | — | £6 | 3 | 1 | Prestige route |

**Age I Route Summary:**
- Range 1: 7 routes (starter/regional)
- Range 2: 7 routes (medium distance)
- Range 3: 3 routes (long distance)

**Faction Starting Stats vs Routes:**
| Faction | Speed | Range | Ceiling | Flyable Routes at Start |
|---------|-------|-------|---------|-------------------------|
| Germany | 2 | 2 | 0 | 10 routes (blocked by Ceiling on 2) |
| Britain | 2 | 1 | 1 | 7 routes (blocked by Range on 6) |
| USA | 1 | 1 | 1 | 5 routes (blocked by Speed on 10) |
| Italy | 1 | 2 | 1 | 5 routes (blocked by Speed on 10) |

**Network Connectivity:** All 17 cities are connected through this route network. Key hubs are London (3 connections), Brussels (4 connections), and Frankfurt (3 connections).

## Age III Routes — The Golden Age (The Atlantic)

The Atlantic Era features 21 hemispheric routes including luxury ocean crossings forming a fully connected global network. Advanced technology enables intercontinental travel.

| Route | From | To | Range | Speed | Ceiling | Luxury | Income | VP | Tracks | Notes |
|-------|------|-----|-------|-------|---------|--------|--------|-----|--------|-------|
| Eastern Gateway | New York | Lakehurst | 1 | 1 | — | — | £4 | 2 | 1 | NJ connection |
| German Hub | Frankfurt | Friedrichshafen | 1 | 2 | — | — | £4 | 2 | 1 | Zeppelin corridor |
| South Atlantic | Rio de Janeiro | Recife | 2 | 2 | — | — | £5 | 2 | 1 | Brazil domestic |
| Caribbean Connection | Miami | Havana | 2 | 2 | — | — | £5 | 2 | 1 | — |
| Pacific Coast | Los Angeles | San Francisco | 2 | 2 | 1 | — | £5 | 2 | 1 | — |
| Rio–Buenos Aires | Rio de Janeiro | Buenos Aires | 3 | 2 | — | — | £5 | 2 | 1 | South America link |
| European Trunk | London | Berlin | 3 | 3 | 1 | — | £6 | 3 | 1 | — |
| Eastern Seaboard | New York | Miami | 3 | 3 | — | — | £6 | 3 | 1 | — |
| North Sea Express | London | Oslo | 3 | 2 | 1 | — | £6 | 3 | 1 | Nordic connection |
| **Around Cape Horn** | Buenos Aires | Valparaíso | 3 | 3 | 3 | — | £7 | 3 | 1 | High altitude |
| **Arctic Explorer** | Oslo | Svalbard | 3 | 2 | 3 | — | £7 | 3 | 1 | Extreme conditions |
| Transcontinental | Chicago | Los Angeles | 4 | 3 | 1 | — | £7 | 3 | 1 | Coast to coast |
| Mediterranean Express | Rome | Cairo | 4 | 3 | 1 | — | £7 | 3 | 1 | — |
| Trans-Amazon | Rio de Janeiro | Manaus | 4 | 2 | — | — | £7 | 3 | 1 | Jungle route |
| North Atlantic Express | New York | London | 4 | 3 | 2 | — | £8 | 4 | 2 | — |
| **Empire State Express** | New York | Chicago | 3 | 4 | 1 | 1 | £8 | 4 | 1 | Luxury; American prestige |
| **Imperial Airship Route** | London | Cairo | 4 | 3 | 2 | 1 | £9 | 4 | 1 | Luxury; British specialty |
| **California Clipper** | Los Angeles | Honolulu | 5 | 3 | 1 | 1 | £10 | 5 | 1 | Luxury; Pacific crossing |
| **Graf Zeppelin Route** | Rio de Janeiro | Friedrichshafen | 5 | 3 | 2 | 1 | £10 | 5 | 1 | Luxury |
| **Transatlantic Luxury** | London | New York | 4 | 4 | 2 | 2 | £11 | 5 | 2 | Luxury |
| **Hindenburg Route** | Frankfurt | Lakehurst | 5 | 4 | 2 | 2 | £12 | 6 | 1 | Luxury; Hydrogen risk |

**Age III Route Summary:**
- Standard routes: 13
- Luxury routes: 8 (require Luxury stat; marked in **bold**)
- Range 1–2: 5 routes (regional connectors)
- Range 3: 7 routes (medium distance)
- Range 4: 5 routes (continental)
- Range 5: 3 routes (intercontinental)

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

| Name | Range | Ceiling | Difficulty | Income | VP | Special |
|------|-------|---------|------------|--------|-----|---------|
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

| Name | Range | Speed | Difficulty | Income | VP | Special |
|------|-------|-------|------------|--------|-----|---------|
| Field Hospital Supply | 2 | 1 | 2 | £5 | 1 | — |
| Ammunition Delivery | 3 | 2 | 2 | £7 | 2 | — |
| Forward Base Resupply | 3 | 1 | 3 | £7 | 2 | — |
| Emergency Provisions | 4 | 3 | 2 | £9 | 3 | — |
| Siege Relief | 4 | 2 | 3 | £10 | 3 | +1 bonus VP |

### Naval Patrols (2 cards)

| Name | Range | Speed | Difficulty | Income | VP | Special |
|------|-------|-------|------------|--------|-----|---------|
| Coastal Patrol | 3 | 2 | 2 | £6 | 1 | Ignore 1 Weather hazard |
| Submarine Hunter | 4 | 2 | 3 | £9 | 3 | +£2 with Communications Suite |

### Artillery Observation (2 cards)

| Name | Range | Ceiling | Difficulty | Income | VP | Special |
|------|-------|---------|------------|--------|-----|---------|
| Battery Direction | 2 | 2 | 2 | £6 | 1 | — |
| Long-Range Observation | 3 | 3 | 2 | £8 | 2 | +1 Range with Spotter Gondola |

## Mission Mechanics

**Mission Row Setup:**
At the start of Age II, shuffle the 20-card Combat Mission deck and deal 6 missions face-up to form the **Mission Row**.

**Selecting Missions:**
1. When you take a Launch action in Age II, choose one visible mission from the Mission Row.
2. Verify your Blueprint meets the Range, Speed, and Ceiling requirements (if any).
3. **Note:** Mission Difficulty is NOT a prerequisite—it adds to hazard check difficulty during the mission.
4. If you cannot meet requirements, you may choose a different mission or pass.

**Completing Missions:**
1. **Hazard Check:** Draw a Hazard card. Net Difficulty = Hazard Difficulty + Mission Difficulty − Ship Reliability. Compare your relevant stat + engineers to Net Difficulty.
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
| The Aeronaut | 2 | Any | None | 1 Influence | *Veteran balloonist and lighter-than-air pioneer* |

**Design Note:** The Reserve Card prevents market stagnation by ensuring players always have an affordable purchase option. At cost 2, it's accessible early game. The modest reveal bonus (1 Influence) keeps it a fallback option rather than an optimal purchase.

## Technical Personnel (10 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| Chief Engineer | 4 | Wrench | — | 1 Engineer, 2 Research, 1 Influence | *Senior officer of the engineering department* |
| Kite Jockey | 5 | Propeller | +2 Reliability for this launch | 1 Officer, 1 Influence | *RFC slang for a daring aviator* |
| Navigator | 3 | Propeller | +1 Range for this launch | 1 £, 2 Influence | *Dead reckoning specialist using course, speed, and drift* |
| The Weatherman | 4 | Propeller | Ignore Weather hazards this launch | 1 Engineer, 1 Research, 1 Influence | *Reads the sky better than any bureau telegram* |
| Gasbag Man | 3 | Wrench | Install Gas Tech Tile: -1 Weight | 1 Gas, 1 Research, 1 Influence | *Specialist in gas cells and lifting calculations* |
| Engine Room Mechanic | 3 | Wrench | Install Propulsion Tech Tile: -1 Weight | 1 £, 1 Research, 1 Influence | *Machinist assigned to the engine gondolas* |
| The Scrutineer | 4 | Wrench | +2 Reliability for this launch | 1 Engineer, 1 Influence | *Official inspector ensuring airworthiness* |
| Rigger Chief | 2 | Wrench | -£2 Hull Cost | 2 £, 1 Influence | *Commands the ground handling crew* |
| Duralumin Man | 3 | Wrench | Install Frame Tech Tile: +1 Lift | 1 Research, 1 Influence | *Expert in the lightweight alloy that makes rigids possible* |
| Blaugas Handler | 3 | Wrench | -£2 Lifting Gas cost | 1 Gas, 1 £, 1 Influence | *Manages the special fuel gas carried in the hull* |

## Political/Financial Personnel (10 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| The Nob | 5 | Coin | Gain £5 | 2 Influence | *Old money with connections in high places* |
| Captain of Industry | 6 | Any | Gain £3 | 3 Influence | *A titan of commerce and manufacturing* |
| The Mandarin | 5 | Propeller | Take 2 Ministry actions | 2 Influence, 1 £ | *Senior civil servant with considerable influence* |
| Merchant Prince | 4 | Propeller | +£2 Income from this route | 2 Influence | *Controls lucrative trade routes across continents* |
| Fleet Street Baron | 4 | Any | No action effect | 2 Influence, 2 £ | *The newspapers dance to his tune* |
| The Moneybags | 3 | Coin | Treasury gives +£3 | 2 Influence | *Capital from abroad, no questions asked* |
| Lloyd's Man | 3 | Coin | Gain 1 Insurance policy | 2 Influence | *Underwriter from the famous London exchange* |
| The Pen-Pusher | 2 | Propeller | Go first in turn order next round | 2 Influence | *Knows which forms to file and when* |
| Shop Steward | 2 | Coin | -£1 per crew recruited this action | 2 Influence, 1 Officer | *Voice of the working men on the factory floor* |
| The Exciseman | 3 | Propeller | Claim route even if tied | 2 Influence | *His Majesty's collector of duties and tariffs* |

## Research Personnel (5 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| The Boffin | 4 | Propeller | -£2 per Technology this round | 3 Research | *Brilliant academic with theoretical insights* |
| Patent Clerk | 3 | Propeller | -1 to Technology Research cost | 2 Influence, 1 Research | *Knows which ideas are truly novel* |
| The Lab Coat | 2 | Propeller | +1 Research this round | 2 Influence, 1 Research | *Tireless experimenter in applied sciences* |
| The Archives | 3 | Propeller | Look at top 3 R&D tiles; reorder them | 2 Research, 1 Influence | *Repository of accumulated aeronautical knowledge* |
| Continental Expert | 4 | Propeller | Acquire Tech another player owns (pay double) | 1 Research, 1 £, 2 Influence | *Brings expertise from Europe's leading programs* |

## Organizations (5 Agent Cards)

| Name | Cost | Symbol | Agent Effect | Reveal | Flavor |
|------|------|--------|--------------|--------|--------|
| Royal Geographic Society | 6 | Wrench | Install 1 Tech Tile ignoring Tech requirement | 1 Engineer, 2 Influence, 1 Research | *Patrons of exploration and scientific discovery* |
| Old Contemptible | 5 | Propeller | Gain £8; Combat missions: +£2 Income | 1 Officer, 1 £, 1 Influence | *Survivor of the Kaiser's 'contemptible little army'* |
| Cook's Man | 5 | Propeller | +1 Luxury stat for this launch | 2 Influence | *Agent of Thomas Cook & Son, travel pioneers* |
| Aero Club | 4 | Coin | Recruit 1 Officer free | 2 Influence, 1 Officer | *Gentlemen aviators and aerial enthusiasts* |
| Engineering Guild | 4 | Coin | Recruit 1 Engineer at -£1 | 2 Influence, 1 Engineer | *Brotherhood of skilled craftsmen and artificers* |

**Market Row Mechanics:** Agent Cards are added to the right side of the row. When Agent Cards are purchased, remaining cards slide left (oldest on left, newest on right). The Academy action can purge the leftmost Agent Card. Refill to 5 Agent Cards at end of each round.

---

*"Up Ship!" — The command given by airship captains to release the mooring cables and begin the voyage.*