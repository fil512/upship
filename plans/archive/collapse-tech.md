# Plan: Merge Technologies and Upgrades into Single "Technology Tiles" Concept

## Summary

Collapse the two-tier system (Technologies unlock Upgrades) into a single **Technology Tile** concept. Tiles are acquired from the R&D Board, stored in the Drawing Office by track, and placed directly onto blueprint slots.

**Key Behaviors:**
- Same tile can be placed in **multiple slots** of matching type (Blueprint = Factory pattern)
- At Age Transition, tiles **return to Drawing Office** (uninstall from blueprint, stay in collection)
- Each tile has a **fixed slot type** (frame/fabric/drive/component)

---

## Phase 1: Data Model Merge

### 1.1 Create Unified Technology Tiles

**File:** `server/data/technologyTiles.js` (new file)

Merge `TECHNOLOGY_BAG` (constants.js) + `UPGRADES` (upgrades.js) into unified definitions:

```javascript
const TECHNOLOGY_TILES = {
  // PROPULSION TRACK → drive slots
  daimler_engine: {
    id: 'daimler_engine',
    name: 'Daimler Petrol Engine',
    track: 'propulsion',      // was 'type: drive' in tech
    slotType: 'driveSlots',   // from upgrade
    age: 1,
    // Acquisition (from technology)
    cost: 1,                  // research cost
    vp: 0,
    income: 1,
    // Installation (from upgrade - was basic_engine)
    weight: -1,
    stats: { speed: 1 },
    special: null,
    hullCost: 0
  },
  // ... merge all ~55 tiles
};
```

### 1.2 Track-to-SlotType Mapping

| Track | SlotType |
|-------|----------|
| propulsion | driveSlots |
| structure | frameSlots |
| fabric | fabricSlots |
| gas | componentSlots |
| payload | componentSlots |

### 1.3 ID Strategy

Use the **technology ID** as the unified ID (e.g., `daimler_engine`). The current upgrade IDs (e.g., `basic_engine`) become aliases for backward compatibility.

---

## Phase 2: Player State Changes

### 2.1 New State Structure

```javascript
player: {
  // REPLACE technologies: string[]
  drawingOffice: {
    propulsion: ['daimler_engine', ...],  // tile IDs in this track
    structure: ['wooden_framework', ...],
    fabric: ['rubberized_cotton', ...],
    gas: ['improved_valving', ...],
    payload: ['observation_platform', ...]
  },

  // Blueprint now stores tile IDs directly (same structure)
  blueprint: {
    age: 1,
    frameSlots: ['wooden_framework', null],  // tile IDs or null
    fabricSlots: ['rubberized_cotton', null],
    driveSlots: [null],
    componentSlots: [null, null]
  }
}
```

### 2.2 Files to Modify

- `server/services/gameStateService.js` - Update `createPlayerState()`, `createInitialBlueprint()`
- `server/services/gameStateHelpers.js` - Update state filtering

---

## Phase 3: Action Changes

### 3.1 Rename/Update Actions

| Old Action | New Action | Changes |
|------------|------------|---------|
| ACQUIRE_TECHNOLOGY | ACQUIRE_TILE | Add to `drawingOffice[track]` |
| INSTALL_UPGRADE | PLACE_TILE | Validate tile in drawingOffice, allow same tile in multiple slots |
| REMOVE_UPGRADE | REMOVE_TILE | Clear slot (tile stays in drawingOffice) |
| UPDATE_BLUEPRINT | UPDATE_BLUEPRINT | Work with tile IDs, validate against drawingOffice |

### 3.2 Multi-Slot Placement Logic

```javascript
// Allow same tile in multiple matching slots
function validatePlacement(state, playerId, tileId, slotType) {
  const tile = TECHNOLOGY_TILES[tileId];
  const player = state.players[playerId];

  // 1. Tile must be in drawing office
  const hasTile = player.drawingOffice[tile.track].includes(tileId);

  // 2. Slot type must match
  const slotMatches = tile.slotType === slotType;

  // 3. Age must be valid
  const ageValid = tile.age <= state.age;

  return hasTile && slotMatches && ageValid;
}
```

### 3.3 Age Transition Update

In `server/actions/ageTransition.js`:
```javascript
// Clear all blueprint slots (tiles return to drawing office)
player.blueprint.frameSlots = player.blueprint.frameSlots.map(() => null);
player.blueprint.fabricSlots = player.blueprint.fabricSlots.map(() => null);
// ... etc
// Tiles remain in drawingOffice - no changes needed there
```

### 3.4 Files to Modify

- `server/actions/technology.js` - Update acquisition to use drawingOffice
- `server/actions/blueprint.js` - Update for PLACE_TILE, multi-slot validation
- `server/actions/ageTransition.js` - Clear blueprint at age transition
- `server/actions/index.js` - Update action registry

---

## Phase 4: Helper Function Updates

### 4.1 server/data/upgrades.js

Update/deprecate:
- `getAvailableUpgrades()` → `getAvailableTiles(drawingOffice, slotType, age)`
- `calculateShipStats()` → Use TECHNOLOGY_TILES instead of UPGRADES
- `calculateHullCost()` → Same logic, different data source

### 4.2 Specialization Discount

Count tiles in drawingOffice track instead of technologies array:
```javascript
function getSpecializationDiscount(drawingOffice, track) {
  const count = drawingOffice[track].length;
  if (count >= 5) return 2;
  if (count >= 3) return 1;
  return 0;
}
```

---

## Phase 5: Frontend Updates

### 5.1 Type Changes

**File:** `web/src/lib/types/game.ts`

```typescript
interface TechnologyTile {
  id: string;
  name: string;
  track: 'propulsion' | 'structure' | 'fabric' | 'gas' | 'payload';
  slotType: 'frameSlots' | 'fabricSlots' | 'driveSlots' | 'componentSlots';
  age: number;
  cost: number;
  vp: number;
  income: number;
  weight: number;
  hullCost?: number;
  stats: Partial<ShipStats>;
  special?: string;
}

interface DrawingOffice {
  propulsion: string[];
  structure: string[];
  fabric: string[];
  gas: string[];
  payload: string[];
}

interface PlayerState {
  drawingOffice: DrawingOffice;  // replaces technologies: string[]
  blueprint: Blueprint;
  // ... rest unchanged
}
```

### 5.2 Component Changes

**TechList.svelte → DrawingOffice.svelte**
- Organize tiles by track (5 sections)
- Show draggable tiles with stats on hover
- Indicate which tiles can go in which slot types
- Badge showing "In Use: N" when tile placed in multiple slots

**AirshipBlueprint.svelte**
- Add drop zones for tiles
- Validate slotType match on drop
- Show tile stats when installed
- Same tile ID can appear in multiple slots

### 5.3 Drag-and-Drop

Add drag-and-drop between DrawingOffice and Blueprint:
- Drag source: DrawingOffice tiles
- Drop target: Blueprint slots with matching slotType
- Visual feedback for valid/invalid drops

---

## Phase 6: Rules Documentation

### 6.1 spec/upship_rules.md

Update sections:
- **Section 3.2 (Blueprint)**: Remove "unlocked by technology" concept
- **Section 4 (Technology System)**: Describe unified tiles, Drawing Office organization
- **Section 6.2 (Design Bureau)**: "Place tiles from Drawing Office onto Blueprint"
- **Section 12.1 (Age Transitions)**: "Blueprint cleared; tiles return to Drawing Office"

### 6.2 spec/appendix.md

- **Merge Appendix C + D**: Single "Technology Tiles" table with all fields
- Add column for slotType
- Remove requiredTech column (no longer needed)

---

## Phase 7: CLI & Playtest Updates

### 7.1 CLI Tool (cli/upship.js)

- Update `tech` command to show drawingOffice contents
- Update `blueprint` command to show installed tiles
- Update action commands for new action names

### 7.2 Playtest Package

- Update `playtest/state.py` for new state structure
- Update `playtest/strategy.py` for tile placement logic
- Update `playtest/phases.py` for design bureau handling

---

## Phase 8: Database Migration

No schema changes needed (JSONB). Add state migration in `getGameState()`:

```javascript
if (!player.drawingOffice && player.technologies) {
  player.drawingOffice = convertTechArrayToDrawingOffice(player.technologies);
  delete player.technologies;
}
```

---

## Implementation Order

1. **Data Layer** (Phase 1)
   - Create `server/data/technologyTiles.js` with merged definitions
   - Add tile lookup helpers

2. **State Layer** (Phase 2)
   - Update `gameStateService.js` for drawingOffice structure
   - Update faction starting configs

3. **Action Layer** (Phase 3-4)
   - Update technology.js for acquisition
   - Update blueprint.js for placement
   - Update ageTransition.js for clearing
   - Update helper functions

4. **Tests** (parallel with above)
   - Update existing tests as code changes
   - Add new tests for multi-slot placement

5. **Frontend** (Phase 5)
   - Update types
   - Rename/update TechList component
   - Add drag-and-drop to Blueprint
   - Update state stores

6. **Documentation** (Phase 6)
   - Update rules
   - Merge appendixes

7. **CLI/Playtest** (Phase 7)
   - Update for new state structure

---

## Critical Files

| File | Purpose |
|------|---------|
| `server/data/technologyTiles.js` | **NEW**: Merged tile definitions |
| `server/data/upgrades.js` | Update helpers, deprecate UPGRADES |
| `server/config/constants.js` | Remove TECHNOLOGY_BAG |
| `server/services/gameStateService.js` | State initialization with drawingOffice |
| `server/actions/technology.js` | Acquisition logic |
| `server/actions/blueprint.js` | Placement logic |
| `server/actions/ageTransition.js` | Clear blueprint on age change |
| `web/src/lib/types/game.ts` | TypeScript types |
| `web/src/lib/components/sidebar/TechList.svelte` | Rename to DrawingOffice |
| `web/src/lib/components/blueprint/AirshipBlueprint.svelte` | Add drop targets |
| `spec/upship_rules.md` | Rules updates |
| `spec/appendix.md` | Merge Appendix C+D |

---

## Progress

### Completed
- [x] Phase 1: Created `server/data/technologyTiles.js` with 55 merged tile definitions
- [x] Phase 2 (partial): Updated `FACTION_CONFIG` in gameStateService.js
- [x] Phase 2 (partial): Updated `createPlayerState()` to use `drawingOffice`
- [x] Phase 2 (partial): Updated `createInitialBlueprint()` to use `startingBlueprint`

### In Progress
- [ ] Complete gameStateService.js updates (createTechBagAndRDBoard, initializeGameState)

### Pending
- [ ] Update technology.js action
- [ ] Update blueprint.js action
- [ ] Update ageTransition.js
- [ ] Update upgrades.js helper functions
- [ ] Update tests
- [ ] Update frontend types and components
- [ ] Update rules documentation
- [ ] Merge appendixes
- [ ] Update CLI and playtest tools
