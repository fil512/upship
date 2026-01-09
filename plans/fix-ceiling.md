# Fix Ship Stats Balance: Ceiling, Reliability, and Hazard Scaling

## Problem Statement

During playtesting, we observed that the majority of ship launches result in failure - either ships being destroyed or launches being aborted. Analysis of the game logs revealed systematic balance issues:

### Observed Failures

| Hazard | Ship Stat | Required | Outcome |
|--------|-----------|----------|---------|
| Severe Icing | Ceiling 0 | Ceiling 3 | ABORTED |
| Engine Failure | Reliability 0 | Reliability 4 | ABORTED |
| Static Discharge | Reliability 1 | Reliability 2 | DESTROYED |
| Catastrophic Explosion | Reliability 1 | Reliability 99 | DESTROYED |
| Navigation Error | Range 1 | Range 4 | ABORTED |

### Root Causes

1. **Starting blueprints have Ceiling = 0**: All factions start with zero ceiling. Any ceiling-based hazard forces an immediate abort since no amount of engineers can compensate for a 3-point deficit.

2. **Reliability is too low**: Starting reliability ranges from 0-2 depending on faction, but hazards can require reliability 4 or even 99 (impossible).

3. **Some hazards are impossible to survive**: The "Catastrophic Explosion" hazard requires reliability 99, which is literally impossible to achieve. This creates frustrating random deaths with no counterplay.

4. **Limited upgrade paths**: There are few tech tiles that provide ceiling or reliability bonuses, making it difficult for players to improve these stats over time.

5. **Hazard requirements exceed reasonable bounds**: Ceiling 3 and reliability 4+ requirements assume players have heavily upgraded ships, but these hazards appear in Age 1 when ships are still basic.

---

## Solution Overview

### 1. Starting Tile Adjustments

**Goal**: Ensure all factions can survive basic hazards from turn 1.

Add baseline defensive stats to starting tiles so ships begin with:
- Ceiling: 1 (up from 0)
- Reliability: 1-2 (standardized across factions)

**Implementation**: Modify one existing starting tile per faction to include ceiling +1.

| Faction | Tile to Modify | Current Stats | New Stats |
|---------|---------------|---------------|-----------|
| Germany | `zeppelin_frame` | gas_socket: 1 | gas_socket: 1, ceiling: 1 |
| Britain | `tensioned_frame` | ceiling: 1 | ceiling: 1 *(already has it)* |
| USA | `duralumin_frame` | reliability: 2, ceiling: 1 | *(already has it)* |
| Italy | `semi_rigid_keel` | *(check current)* | Add ceiling: 1 if missing |

**Files to modify**:
- `server/data/upgrades.ts` - Update tile stat definitions

### 2. Hazard Deck Rebalancing

**Goal**: Ensure all hazards are survivable with reasonable investment.

**Principles**:
- No hazard should require stats > 3 in Age 1
- No hazard should be literally impossible (reliability 99)
- Hazard difficulty should scale with Age
- Engineers should be able to bridge a 1-2 point gap, not 3+

**Specific Changes**:

| Hazard | Current Requirement | New Requirement | Rationale |
|--------|--------------------|-----------------| ----------|
| Catastrophic Explosion | Reliability 99 | Reliability 3, noSave: true | Still deadly, but theoretically survivable with good ship |
| Severe Icing | Ceiling 3 | Ceiling 2 | Achievable with 1 starting ceiling + 1 upgrade or engineer |
| Engine Failure | Reliability 4 | Reliability 3 | Can be survived with reliability 2 ship + 1 engineer |
| Navigation Error | Range 4 | Range 3 | Achievable with upgrades in Age 1 |

**Alternative for Catastrophic Explosion**: Change to "Ship is destroyed, but crew survives (officer refunded)" - maintains dramatic tension without feeling unfair.

**Files to modify**:
- `server/data/hazards.ts` - Update hazard definitions

### 3. Add More Upgrade Paths

**Goal**: Give players meaningful choices for improving ceiling and reliability.

Currently, ceiling and reliability upgrades are scarce. Add new tech tiles to provide clear upgrade paths.

**New Age 1 Tech Tiles** (add to `TECH_CARD_BAG`):

```typescript
// Ceiling upgrades
{ id: 'altitude_compensator', name: 'Altitude Compensator', type: 'gas', cost: 3, vp: 0, income: 1 }
// Upgrade tile: ceiling +1, weight +1

// Reliability upgrades
{ id: 'safety_valves', name: 'Safety Valves', type: 'gas', cost: 3, vp: 0, income: 1 }
// Upgrade tile: reliability +1, weight +1
```

**New Upgrade Tiles** (add to `UPGRADES`):

```typescript
altitude_compensator: {
  id: 'altitude_compensator',
  name: 'Altitude Compensator',
  type: 'component',
  slotType: 'componentSlots',
  requiredCard: 'altitude_compensator',
  weight: 1,
  hullCost: 1,
  stats: { ceiling: 1 },
  age: 1
},
safety_valves: {
  id: 'safety_valves',
  name: 'Safety Valves',
  type: 'component',
  slotType: 'componentSlots',
  requiredCard: 'safety_valves',
  weight: 1,
  hullCost: 1,
  stats: { reliability: 1 },
  age: 1
}
```

**Age 2 additions** (higher value):

```typescript
// Tech card
{ id: 'pressurized_cabin', name: 'Pressurized Cabin', type: 'component', cost: 5, vp: 1, income: 2 }
// Upgrade tile: ceiling +2, weight +2

{ id: 'redundant_systems', name: 'Redundant Systems', type: 'component', cost: 5, vp: 1, income: 1 }
// Upgrade tile: reliability +2, weight +1
```

**Files to modify**:
- `server/config/constants.ts` - Add new tech cards to `TECH_CARD_BAG`
- `server/data/upgrades.ts` - Add new upgrade tile definitions

---

## Expected Outcomes

After these changes:

1. **Starting ships can survive basic hazards**: With ceiling 1 and reliability 1-2, ships can pass minor hazards or bridge the gap with 1-2 engineers.

2. **No more "instant death" hazards**: All hazards become theoretically survivable with good ship design and engineer reserves.

3. **Clear upgrade paths exist**: Players can invest in ceiling and reliability through tech acquisition, creating meaningful choices.

4. **Hazard scaling matches ship progression**: Age 1 hazards are tuned for starting ships, Age 2-3 hazards assume upgraded ships.

5. **Engineers remain valuable**: Engineers still matter for bridging 1-2 point gaps, but aren't expected to bridge 3+ point deficits.

---

## Implementation Order

1. **Hazard rebalancing first** - Quickest impact, prevents frustrating failures
2. **Starting tile adjustments** - Ensures baseline survivability
3. **New tech tiles** - Provides long-term progression options

---

## Testing Plan

After implementation:
1. Run `/playtest-rest` to verify bots can successfully launch
2. Check that launch success rate improves from ~30% to ~60-70%
3. Verify hazards still create tension (not all auto-pass)
4. Confirm all factions have viable upgrade paths
