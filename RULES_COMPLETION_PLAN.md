# UP SHIP! Rules Completion Plan

This document outlines the work required to complete the game rules for playtesting and publication.

---

## Executive Summary

The core rules framework is solid. The main gaps are:
1. **Content gaps**: Missing specific card/tile definitions
2. **Mechanical gaps**: VP scoring system, turn order
3. **Balance gaps**: Economic values need specification
4. **Consistency issues**: A few contradictions to resolve

Estimated completion: 6 major work packages

---

## Work Package 1: Resolve Inconsistencies

**Priority: HIGH (must complete before other work)**

### 1.1 Engineer Recruitment Cost Discrepancy
- **Issue**: CLAUDE.md states £3, Section 6.1 states £4
- **Location**: `upship_rules.md` Section 6.1 (The Academy)
- **Decision needed**: Choose one value and update both documents
- **Recommendation**: £3 (matches thematic balance - Engineers are valuable but need to be accessible early)

### 1.2 Pilot vs Engineer Pricing Logic
- **Current state**: Section 6.1 says Pilots £2, Engineers £4
- **Issue**: Text says "Pilots are cheaper because consumed on launch" but Engineers also have upkeep (£1/round)
- **Verification needed**: Ensure pricing reflects actual economic role

### 1.3 Research Institute vs Research from Cards
- **Current state**: Section 6.1 says Research Institute costs £3/Research (or £2 with Researcher card)
- **Clarity needed**: Section 6.2 mentions "Research tokens purchased at Research Institute" - need to clarify these are temporary tokens usable only that round

---

## Work Package 2: Victory Point System

**Priority: CRITICAL (core rules gap)**

### 2.1 Define VP Sources
The rules mention Victory Points but never specify how they're earned. Add a new **Section 12.7: Scoring** with:

**Route VP:**
- Age I routes: 1-2 VP each
- Age II routes: 2-4 VP each
- Age III routes: 3-6 VP each
- Luxury routes: +1 VP bonus

**Technology VP:**
- Each Technology tile: 1 VP
- Complete track (5+ in one track): +3 VP bonus

**End-Game Bonuses:**
- Most routes in each Age: +2 VP
- Longest connected network: +3 VP
- Each £10 remaining: +1 VP

**Penalties:**
- Hindenburg Disaster (causer): -5 VP (already in rules)
- Outstanding loans: -2 VP each

### 2.2 VP Track Component
- Add VP Track to Player Board (Section 3) or use VP tokens
- Update Components list (Section 2)

---

## Work Package 3: Technology Tile Compendium

**Priority: HIGH (required for gameplay)**

### 3.1 Create Appendix C: Technology Tiles

Define ~60 tiles across 4 tracks and 3 ages:

**Propulsion Track (15 tiles)**
| Age | Name | Cost | Unlocks |
|-----|------|------|---------|
| I | Daimler Petrol Engine | 2 | Basic Engine Upgrade |
| I | Improved Propeller Design | 3 | Efficient Propeller Upgrade |
| I | Dual Engine Mount | 3 | Twin Engine Upgrade |
| II | Maybach Engine Design | 4 | Maybach CX Engine Upgrade |
| II | Diesel Powerplant | 5 | Diesel Engine Upgrade |
| II | Swiveling Propeller | 4 | Vectored Thrust Upgrade |
| III | Streamlined Nacelle | 6 | Aerodynamic Engine Upgrade |
| III | Supercharged Engine | 7 | High-Altitude Engine Upgrade |
| ... | ... | ... | ... |

**Structure Track (15 tiles)**
| Age | Name | Cost | Unlocks |
|-----|------|------|---------|
| I | Wooden Framework | 2 | Reinforced Frame Upgrade |
| I | External Walkway | 2 | Crew Access Upgrade |
| II | Duralumin Framework | 5 | Rigid Frame Upgrade |
| II | Fireproof Coating | 4 | Fire Retardant Upgrade |
| II | Armored Gondola | 5 | Military Armor Upgrade |
| III | Geodetic Structure | 6 | Lightweight Frame Upgrade |
| ... | ... | ... | ... |

**Gas Systems Track (15 tiles)**
| Age | Name | Cost | Unlocks |
|-----|------|------|---------|
| I | Improved Valving | 2 | Pressure Control Upgrade |
| I | Goldbeater's Skin | 3 | Leak-Proof Cell Upgrade |
| II | Multiple Gas Cells | 4 | Compartmented Gas Upgrade |
| II | Helium Handling | 5 | Helium Gas Cell Upgrade |
| II | Blaugas Storage | 4 | Blaugas Tank Upgrade (Germany pre-owns) |
| III | Pressure Altitude System | 7 | High-Ceiling Gas Upgrade |
| ... | ... | ... | ... |

**Payload Track (15 tiles)**
| Age | Name | Cost | Unlocks |
|-----|------|------|---------|
| I | Observation Platform | 2 | Spotter Gondola Upgrade |
| I | Mail Compartment | 2 | Postal Service Upgrade |
| II | Passenger Gondola | 4 | Basic Cabin Upgrade |
| II | Bomb Bay Design | 5 | Bombing Equipment Upgrade |
| II | Trapeze System | 5 | Sparrowhawk Hangar Upgrade (USA pre-owns) |
| III | Luxury Accommodation | 6 | Luxury Cabin Upgrade |
| III | Dining Saloon | 7 | Restaurant Upgrade |
| III | Promenade Deck | 8 | Observation Lounge Upgrade |
| ... | ... | ... | ... |

### 3.2 Technology Tile Design Specifications
- Tile size: Standard square (suggest 30x30mm)
- Front: Name, Track icon, Age indicator, Cost, Unlocks text
- Back: Track color-coded

---

## Work Package 4: Upgrade Tile Compendium

**Priority: HIGH (required for gameplay)**

### 4.1 Create Appendix D: Upgrade Tiles

Define ~80 tiles corresponding to Technologies:

**Propulsion Upgrades**
| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Basic Engine | Daimler Petrol | -1 | Speed +1 | - |
| Efficient Propeller | Improved Propeller | -1 | Speed +1, Range +1 | - |
| Twin Engine | Dual Engine Mount | -3 | Speed +2, Reliability +1 | - |
| Maybach CX Engine | Maybach Engine | -2 | Speed +2, Range +1 | - |
| Diesel Engine | Diesel Powerplant | -2 | Range +2, Reliability +1 | - |
| High-Altitude Engine | Supercharged Engine | -3 | Speed +2, Ceiling +2 | - |

**Structure Upgrades**
| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Reinforced Frame | Wooden Framework | -2 | Reliability +1 | - |
| Rigid Frame | Duralumin Framework | -2 | Reliability +2, Ceiling +1 | - |
| Fire Retardant | Fireproof Coating | -1 | Reliability +1 | Ignore first Fire hazard |
| Military Armor | Armored Gondola | -4 | Reliability +2 | Ignore War Zone penalties |
| Lightweight Frame | Geodetic Structure | -1 | Reliability +2, Ceiling +1 | - |

**Gas System Upgrades**
| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Pressure Control | Improved Valving | -1 | Ceiling +1 | - |
| Leak-Proof Cell | Goldbeater's Skin | 0 | Reliability +1 | - |
| Compartmented Gas | Multiple Gas Cells | -1 | Lift +2, Reliability +1 | - |
| Helium Gas Cell | Helium Handling | -1 | Lift +5 | Safe (no fire) |
| Blaugas Tank | Blaugas Storage | 0 | Range +3 | Neutral buoyancy fuel |
| High-Ceiling Gas | Pressure Altitude | -2 | Lift +3, Ceiling +2 | - |

**Payload Upgrades**
| Name | Required Tech | Weight | Stats | Special |
|------|---------------|--------|-------|---------|
| Spotter Gondola | Observation Platform | -1 | Income +1 | - |
| Postal Service | Mail Compartment | -1 | Income +2 | - |
| Basic Cabin | Passenger Gondola | -2 | Income +2, Luxury +1 | - |
| Bombing Equipment | Bomb Bay Design | -3 | - | Military route bonus +2 |
| Sparrowhawk Hangar | Trapeze System | -3 | - | Ignore one route requirement |
| Luxury Cabin | Luxury Accommodation | -3 | Income +3, Luxury +2 | - |
| Restaurant | Dining Saloon | -2 | Income +2, Luxury +2 | - |
| Observation Lounge | Promenade Deck | -2 | Income +1, Luxury +3 | - |

### 4.2 Upgrade Tile Design Specifications
- Tile size: Fits Blueprint slots (suggest 25x25mm)
- Must show: Weight cost, stat bonuses, special abilities
- Color-coded by track type

---

## Work Package 5: Card Compendium

**Priority: HIGH (required for gameplay)**

### 5.1 Personal Hazard Deck (20 cards each)

**Clear Weather (4 cards)**
| Name | Difficulty | Type | Engineer Use |
|------|------------|------|--------------|
| Clear Skies | Auto-pass | - | - |
| Favorable Winds | Auto-pass | - | - |
| Calm Conditions | Auto-pass | - | - |
| Perfect Visibility | Auto-pass | - | - |

**Minor Hazards (8 cards)**
| Name | Difficulty | Type | Engineer Use |
|------|------------|------|--------------|
| Light Turbulence | 2 Speed | Weather | Spend 1 Engineer: +2 to check |
| Minor Engine Trouble | 2 Reliability | Mechanical | Spend 1 Engineer: Auto-pass |
| Crosswind | 3 Speed | Weather | Spend 1 Engineer: +2 to check |
| Gas Leak | 3 Reliability | Mechanical | Spend 1 Engineer: Auto-pass |
| Low Visibility | 2 Ceiling | Weather | Spend 1 Engineer: +2 to check |
| Fuel Concern | 3 Range | Supply | Spend 1 Engineer: +2 to check |
| Headwind | 3 Speed | Weather | Spend 1 Engineer: +2 to check |
| Minor Structural Stress | 2 Reliability | Mechanical | Spend 1 Engineer: Auto-pass |

**Major Hazards (6 cards)**
| Name | Difficulty | Type | Engineer Use |
|------|------------|------|--------------|
| Strong Headwind | 4 Speed | Weather | Spend 2 Engineers: +3 to check |
| Icing Conditions | 4 Ceiling | Weather | Spend 2 Engineers: +3 to check |
| Engine Failure | 5 Reliability | Mechanical | Spend 2 Engineers: Reduce to Difficulty 3 |
| Storm System | 5 Speed | Weather | Spend 2 Engineers: +3 to check |
| Structural Damage | 4 Reliability | Mechanical | Spend 2 Engineers: Reduce to Difficulty 2 |
| Navigation Error | 4 Range | Supply | Spend 1 Engineer: +2 to check |

**Catastrophic Events (2 cards)**
| Name | Difficulty | Type | Engineer Use |
|------|------------|------|--------------|
| Hydrogen Fire | 6 Reliability | Fire | Spend 3 Engineers: Prevent (Helium ships immune) |
| Catastrophic Structural Failure | 6 Reliability | Mechanical | Spend 3 Engineers: Reduce to Difficulty 4 |

### 5.2 Market Deck (30 cards)

**Technical Personnel (10 cards)**
| Name | Cost | Agent Icon | Agent Effect | Reveal |
|------|------|------------|--------------|--------|
| Chief Engineer | 4 | Design | +2 tile swaps | 3 Ops |
| Test Pilot | 5 | Hangar | Ignore Hazard card | 1 Ops |
| Navigator | 3 | Hangar | +1 Range for this launch | 2 Ops |
| Weather Expert | 4 | Hangar | +2 to Weather hazards | 2 Ops, 1 Influence |
| Gas Engineer | 3 | Design | Install Gas upgrade for free | 2 Ops |
| Engine Specialist | 3 | Design | Install Propulsion upgrade for free | 2 Ops |
| Safety Inspector | 4 | Hangar | +2 Reliability for this launch | 3 Ops |
| Ground Crew Chief | 2 | Hangar | -£2 Production Cost | 1 Ops, 1 Influence |
| Structural Engineer | 3 | Design | +1 Lift from Structure upgrades | 2 Ops |
| Fuel Specialist | 3 | Hangar | -£2 Lifting Gas cost | 2 Ops |

**Political/Financial Personnel (10 cards)**
| Name | Cost | Agent Icon | Agent Effect | Reveal |
|------|------|------------|--------------|--------|
| The Aristocrat | 5 | Bank | Gain £5 | 3 Influence |
| Industrial Magnate | 6 | Any | Gain £3 | 4 Influence |
| Government Minister | 5 | Ministry | Take 2 Ministry actions | 2 Influence, 1 Ops |
| Shipping Tycoon | 4 | Hangar | +2 Income from this route | 3 Influence |
| Press Baron | 4 | Any | None | 2 Influence, 2 Ops |
| Foreign Investor | 3 | Bank | Loan gives £35 instead of £30 | 2 Influence |
| Insurance Agent | 3 | Bank | Recover £5 on failed launch | 2 Influence |
| Bureaucrat | 2 | Ministry | +1 to turn order bid | 2 Influence |
| Union Representative | 2 | Academy | -£1 per crew recruited | 1 Influence, 1 Ops |
| Customs Official | 3 | Ministry | Claim tied routes | 2 Influence |

**Research Personnel (5 cards)**
| Name | Cost | Agent Icon | Agent Effect | Reveal |
|------|------|------------|--------------|--------|
| University Partnership | 4 | Research | Research costs £1 each | 2 Influence, 1 Ops |
| Patent Attorney | 3 | Research | -1 to Technology cost | 2 Influence |
| Research Assistant | 2 | Research | Gain 1 Research token | 1 Influence, 1 Ops |
| Technical Library | 3 | Research | View top 3 R&D tiles | 2 Influence |
| Foreign Consultant | 4 | Research | May acquire from opponent's Drawing Office (pay double) | 2 Ops |

**Organizations (5 cards)**
| Name | Cost | Agent Icon | Agent Effect | Reveal |
|------|------|------------|--------------|--------|
| Royal Geographic Society | 6 | Design | Install Upgrade ignoring Tech requirement | 2 Influence, 2 Ops |
| Military Contract | 5 | Ministry | Gain £8 + War Zone route bonus | 1 Influence, 2 Ops |
| Luxury Travel Agency | 5 | Hangar | +1 Luxury, +2 Income on Luxury routes | 3 Influence |
| Aviation Club | 4 | Academy | Recruit 1 Pilot free | 2 Influence, 2 Ops |
| Engineering Guild | 4 | Academy | Recruit 1 Engineer at -£2 | 1 Influence, 3 Ops |

---

## Work Package 6: Gameplay Polish

**Priority: MEDIUM (refinements)**

### 6.1 Turn Order Mechanism
Add to Section 6.1 (Phase A) or create new subsection:

**Option A: Ministry Bidding**
- Players may bid Influence at the Ministry to determine next round's turn order
- Highest bidder goes first, etc.
- Ties broken by current turn order

**Option B: Income Track**
- Player with lowest Income goes first (catch-up mechanism)
- Ties broken by least Cash

**Recommendation**: Option B (simpler, creates interesting decisions)

### 6.2 Route Claiming Ties
Add to Section 5.5:
- If players attempt to claim the same single-track route in the same round, resolve by turn order
- The later player may attempt a different route instead (before paying costs)

### 6.3 Player Count Scaling
Expand Section 1.3 table and add new section:

| Component | 2 Players | 3 Players | 4 Players |
|-----------|-----------|-----------|-----------|
| R&D Board Size | 4 tiles | 5 tiles | 6 tiles |
| Market Row Size | 4 cards | 5 cards | 6 cards |
| Routes Available | Use 2P map markers | Standard | Standard |
| Starting £ | £18 | £15 | £12 |

### 6.4 Route Income Values
Create route income formula:
- Base Income = Distance rating (1-6)
- Age Multiplier: Age I = x1, Age II = x1.5, Age III = x2
- Luxury Bonus: +2 Income
- Example: Age III Transatlantic (Distance 5, Luxury) = 5 x 2 + 2 = £12 Income

### 6.5 Hindenburg Tuning Options
Current: -5 VP
Consider alternatives:
- **Dramatic**: -10 VP (serious deterrent)
- **Historical**: -5 VP but gain "Infamy" card worth 2 Influence/round
- **Balanced**: -5 VP (keep as-is, seems appropriate)

**Recommendation**: Keep -5 VP, it's memorable without being game-ending

---

## Implementation Order

### Phase 1: Foundation (Must complete first)
1. Work Package 1: Resolve Inconsistencies
2. Work Package 2: Victory Point System

### Phase 2: Content (Bulk of work)
3. Work Package 3: Technology Tiles
4. Work Package 4: Upgrade Tiles
5. Work Package 5: Card Compendium

### Phase 3: Polish
6. Work Package 6: Gameplay Polish

---

## Appendix: Document Integration Plan

When implementing, update these sections:

| Work Package | Sections to Update |
|--------------|-------------------|
| WP1 | 6.1, CLAUDE.md |
| WP2 | New 12.7, 2.1/2.2 (components), Appendix B |
| WP3 | New Appendix C, 4.1 |
| WP4 | New Appendix D, 4.2 |
| WP5 | New Appendix E (Hazard), New Appendix F (Market), 7.2, 8.4 |
| WP6 | 1.3, 5.5, 6.1, new subsections |

---

## Open Questions for Design Decision

These items need designer input before finalizing:

1. **Engineer cost**: £3 or £4? (Recommend £3)
2. **Turn order mechanism**: Bidding or Income-based? (Recommend Income-based)
3. **VP per route**: Fixed values or formula-based? (Recommend formula)
4. **Technology tile count**: 60 enough or need more variety?
5. **Hazard deck shuffle timing**: Reshuffle when empty, or once per Age?
6. **Network connectivity in Age III**: Required or optional?

---

*Plan created: December 2024*
*Status: Ready for implementation*
