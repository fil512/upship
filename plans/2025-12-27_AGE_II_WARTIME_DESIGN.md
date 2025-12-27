# Age II: The Great War - Design Document

*Created: 2025-12-27*

## Overview

Age II abandons the route map entirely. Instead, players compete for military contracts, launching ships on dangerous missions where survival is uncertain. The war ends when nations are economically exhausted or when enough key objectives trigger an armistice.

## Core Mechanics

### 1. Contract Decks (Replace Map)

Three contract decks representing military mission types:

| Deck | Theme | Typical Rewards |
|------|-------|-----------------|
| **Recon** | Intelligence gathering | £, Research, Information |
| **Bomb** | Strategic bombing | VP, Armistice advancement |
| **Supply** | Logistics runs | £, Resources, Pilots |

**Setup:** Display 3 face-up contracts from each deck (9 total available).

### 2. Dual-Use Hazard Cards

Each hazard card has TWO halves:

```
┌─────────────────────────┐
│     TOP HALF            │
│   (Mission Success)     │
│                         │
│  Used in ALL Ages       │
│  Standard hazard check  │
│  Stat vs Difficulty     │
├─────────────────────────┤
│     BOTTOM HALF         │
│   (Flak / Survival)     │
│                         │
│  Used in Age II ONLY    │
│  Flak symbols vs Armor  │
│  Determines if ship     │
│  survives the mission   │
└─────────────────────────┘
```

### 3. Mission Flow (Age II Launch Action)

1. **Select Contract:** Choose an available contract card
2. **Place Ship:** Put your ship token on the contract
3. **Pay Costs:** Standard launch costs (Pilot, Gas)
4. **Draw Hazard Card:** From your personal deck
5. **Resolve Mission (Top Half):**
   - Compare ship stat vs difficulty
   - Success → Take the contract card
   - Failure → Contract remains available (wasted mission)
6. **Resolve Survival (Bottom Half):**
   - Count flak symbols on card
   - Compare to ship's Armor stat
   - Survive → Ship returns to Hangar
   - Shot Down → Ship destroyed (to supply)

**Key Insight:** You can succeed the mission but still lose the ship, or fail the mission but survive to try again.

### 4. Armor Stat

New stat for Age II relevance:

- Added to Blueprint calculations
- Some upgrades provide Armor (military retrofits)
- Civilian ships from Age I have low/no Armor (vulnerable)
- Trade-off: Armor adds Weight, reducing other capabilities

### 5. Armistice Track

A shared track that advances toward war's end:

**Advancement Triggers:**
- Certain contracts (especially Bombing) advance the track
- Better rewards = more armistice advancement
- Creates tension: take the good contract and hasten the end?

**Armistice Triggers (Age II Ends):**
1. Armistice Track reaches threshold, OR
2. ALL players reach -£10 debt (economic exhaustion)

### 6. War Economy

**Debt Limit:** Players can go to -£10 maximum (like Brass).

**War Costs:**
- No ongoing route income (contracts are one-time payments)
- Ships frequently destroyed (constant rebuilding)
- Higher material costs during wartime
- Engineers drafted (upkeep increases?)

**Scoring:**
- VP scored at end of each round based on contracts collected
- Or scored at Age end like normal (TBD)

## Design Questions to Resolve

### Flak Mechanics
- How many flak symbols per card? (0-3? 0-5?)
- What Armor values are reasonable? (1-4?)
- Should some cards have "guaranteed survival" or "instant death"?

### Contract Card Design
- What specific rewards per contract type?
- How many cards per deck?
- Shuffle and refill, or limited supply?

### Armistice Track
- How many spaces?
- How much do different contracts advance it?
- Any player actions to slow/speed it?

### Civilian Ships in War
- Can Age I ships attempt missions? (High risk, low armor)
- Incentive to build new military ships vs. sacrifice old ones?

### Faction Asymmetry in War
- Germany: Best bombers, most aggressive
- Britain: Naval superiority, supply runs
- USA: Late entry (join Age II later? Fresh resources?)
- Italy: Recon specialists, flexible

## Thematic Notes

The war should feel:
- **Brutal:** Ships die. Lots of them.
- **Expensive:** Players drain their economies
- **Desperate:** The armistice is a relief, not a failure
- **Decisive:** What you build/save for Age III matters

Players should emerge from Age II battered, in debt, but with valuable military tech and battle-hardened crews ready for the Golden Age of civilian aviation.

## Integration with Other Ages

### Age I → Age II Transition
- Civilian ships carry over but have 0 Armor (death traps)
- Technologies carry over (can unlock military upgrades)
- Pilots from routes return to Barracks

### Age II → Age III Transition
- Surviving military ships can be converted to civilian use
- War debt carries into Age III
- Military tech unlocks advanced Age III options
- Veteran pilots provide bonuses?

## TODO

- [ ] Design contract card templates
- [ ] Define flak symbol distribution on hazard cards
- [ ] Balance Armor stat across upgrades
- [ ] Determine armistice track length and advancement rates
- [ ] Playtest economic drain rate
- [ ] Design faction-specific war abilities
