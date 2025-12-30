# Plan: Atomic Ground Board Location Actions

## Problem Statement

Per Section 5.1 of the rules, location actions should execute **immediately** when placing an agent, not as separate API calls. Currently:
1. Most locations just return "May do X" instead of executing
2. Actions like `BUY_GAS`, `RECRUIT_CREW`, etc. can be called directly via REST API
3. The playtest bot incorrectly takes actions during reveal phase
4. CLI has shorthand commands that bypass worker placement entirely

## Progress

- [x] `construction_hall` - BUILD_SHIP executes immediately (commit 9a71777)
- [x] `gas_depot` - BUY_GAS executes immediately (commit 735e797)
- [x] `academy` - RECRUIT_CREW executes immediately
- [x] `flight_school` - UPGRADE_OFFICER_INCOME executes immediately
- [x] `technical_institute` - UPGRADE_ENGINEER_INCOME executes immediately
- [ ] `insurance_bureau` - BUY_INSURANCE
- [ ] `government_liaison` - New processor needed
- [ ] `research_institute` - New processor needed
- [ ] `design_bureau` - Array of swaps
- [ ] `launchpad` - Multi-step with NO_MORE_LAUNCHES
- [ ] Atomic REVEAL action
- [ ] CLI cleanup
- [ ] Playtest bot cleanup

## Key Design Decisions

1. **Design Bureau**: Accept arrays of swap operations (up to 2 swaps, 4 for Italy)

2. **Launchpad**: Multi-step with explicit completion signal:
   - PLACE_AGENT at launchpad (enables launching)
   - LAUNCH_SHIP (can be called multiple times while at launchpad)
   - NO_MORE_LAUNCHES (signals completion, advances turn)
   - Server waits for NO_MORE_LAUNCHES before advancing

3. **Reveal Phase**: Atomic operation with bundled acquisitions:
   - Player submits reveal with all tech/card acquisitions in one operation
   - Tech/card rows replenish AFTER player completes reveal
   - Reveal action includes: `techAcquisitions[]`, `marketPurchases[]`

## Files to Modify

### Server
- `server/actions/worker.js` - Add parameters to PLACE_AGENT, execute all location actions immediately
- `server/actions/building.js` - ✅ Already fixed (BUILD_SHIP)
- `server/actions/gas.js` - ✅ Already fixed (BUY_GAS)
- `server/actions/crew.js` - Add `_internal` flag validation (RECRUIT_CREW, UPGRADE_*_INCOME)
- `server/actions/economy.js` - Add `_internal` flag validation (BUY_INSURANCE)
- `server/actions/technology.js` - Add `_internal` flag validation (GAIN_RESEARCH for research_institute)
- `server/actions/launch.js` - Add `_internal` flag validation (LAUNCH_SHIP)
- `server/actions/blueprint.js` - Add `_internal` flag validation (INSTALL_UPGRADE, REMOVE_UPGRADE)

### CLI
- `cli/upship.js` - Update `place` command to accept location-specific params, remove/deprecate shorthand commands

### Playtest Bot
- `scripts/playtest.py` - Pass all parameters during placement, remove reveal-phase actions

### Tests
- `__tests__/unit/rules/building.test.js` - ✅ Already has tests for construction_hall
- `__tests__/unit/rules/gasDepot.test.js` - ✅ Already has tests for gas_depot
- Add similar tests for each remaining location

---

## Todo List

### Phase 1: Core Infrastructure Changes

#### 1.1 Extend PLACE_AGENT to Accept Location-Specific Parameters
**File:** `server/actions/worker.js`
**Changes:**
- Add destructuring for all location params: `gasType`, `gasAmount`, `crewType`, `crewCount`, `levels`, `officerCount`, `policyCount`, `shipId`, `routeId`, `installUpgrades`, `removeUpgrades`
- Pass options object to `executeLocationAction` with all params

#### 1.2 Update executeLocationAction for Each Location
**File:** `server/actions/worker.js` (lines 263-372)

Each case needs to call the appropriate action processor with `_internal: true`:

| Location | Action to Call | Parameters | Behavior | Status |
|----------|---------------|------------|----------|--------|
| `construction_hall` | `processBuildShip` | `buildCount` | Immediate | ✅ Done |
| `gas_depot` | `processBuyGas` | `gasType`, `gasAmount` | Immediate | ✅ Done |
| `academy` | `processRecruitCrew` | `crewType`, `crewCount` | Immediate | |
| `flight_school` | `processUpgradeOfficerIncome` | `levels` (default 1) | Immediate | |
| `technical_institute` | `processUpgradeEngineerIncome` | `levels` (default 1) | Immediate | |
| `government_liaison` | `processGovernmentLiaison` | `officerCount` | Immediate | |
| `insurance_bureau` | `processBuyInsurance` | `policyCount` (default 1) | Immediate | |
| `research_institute` | `processUpgradeResearchLevel` | `levels` (default 1) | Immediate | |
| `design_bureau` | `processModifyBlueprint` | `swaps: [{action, slot, index, upgradeId}]` | Immediate | |
| `launchpad` | Enable launches | None | **Multi-step** | |

**Launchpad Special Handling:**
- PLACE_AGENT at launchpad sets `state.launchpadActive[playerId] = true`
- While active, player can call LAUNCH_SHIP multiple times
- Player calls NO_MORE_LAUNCHES to signal completion
- Turn does NOT advance until NO_MORE_LAUNCHES received
- LAUNCH_SHIP validates `state.launchpadActive[playerId]` is true

---

### Phase 2: Add `_internal` Validation to Action Processors

For each action that corresponds to a Ground Board location, add validation like BUILD_SHIP has:

#### 2.1 BUY_GAS (gas_depot) ✅ DONE
**File:** `server/actions/gas.js`

#### 2.2 RECRUIT_CREW (academy)
**File:** `server/actions/crew.js`

#### 2.3 UPGRADE_OFFICER_INCOME (flight_school)
**File:** `server/actions/crew.js`

#### 2.4 UPGRADE_ENGINEER_INCOME (technical_institute)
**File:** `server/actions/crew.js`

#### 2.5 BUY_INSURANCE (insurance_bureau)
**File:** `server/actions/economy.js`

#### 2.6 GAIN_RESEARCH (research_institute)
**File:** `server/actions/technology.js`
- Note: Research Institute increases Research Level Track for £4/level, not GAIN_RESEARCH
- May need a new `processUpgradeResearchLevel` function

#### 2.7 INSTALL_UPGRADE / REMOVE_UPGRADE (design_bureau)
**File:** `server/actions/blueprint.js`

#### 2.8 LAUNCH_SHIP (launchpad)
**File:** `server/actions/launch.js`
- Validate `state.launchpadActive[playerId] === true`
- If not active, reject with error

#### 2.9 Add NO_MORE_LAUNCHES Action
**File:** `server/actions/launch.js`
- Validate player has `launchpadActive === true`
- Set `state.launchpadActive[playerId] = false`
- Advance to next player's turn

---

### Phase 3: Special Cases and New Actions

#### 3.1 Government Liaison - New Action Processor
**File:** `server/actions/crew.js` or new file
- Spend 1-3 Officers from Barracks
- Increase Income Track by 1 per Officer spent
- Add `processGovernmentLiaison(state, playerId, { officerCount, _internal })`

#### 3.2 Research Institute - Clarify Action
**Current confusion:** `GAIN_RESEARCH` vs upgrading Research Level Track
- Per rules 6.1: "Increase your Research Level Track by 1 step" for £4
- Need `processUpgradeResearchLevel(state, playerId, { levels, _internal })`

#### 3.3 Design Bureau - Multiple Swaps
- Need to handle up to 2 swaps (more for Italy, with Modular Frame, Mechanic cards)
- Accept arrays: `installUpgrades: [{slot, index, upgradeId}]`, `removeUpgrades: [{slot, index}]`

#### 3.4 The Bank - Remove from Ground Board
Per Section 5.3, loans are **free actions**, not location actions
- Remove from `GROUND_BOARD_LOCATIONS` or mark as free action
- Keep TAKE_LOAN as direct API call (it's a free action)

#### 3.5 Atomic Reveal Phase
**File:** `server/actions/turn.js` or new `server/actions/reveal.js`

Current PASS action transitions player to reveal. Change to:

**New REVEAL Action** (replaces implicit reveal after PASS):
```javascript
{
  type: 'REVEAL',
  techAcquisitions: ['tech_id_1', 'tech_id_2'],  // Technologies to acquire
  marketPurchases: ['card_id_1']                  // Market cards to buy
}
```

**Processing:**
1. Player passes (ends worker placement participation)
2. Reveal hand, collect reveal resources (cash, research, influence, crew, gas)
3. Calculate total Research (Research Level + Engineers + card bonuses)
4. Validate and process `techAcquisitions` using Research
5. Calculate total Influence from cards
6. Validate and process `marketPurchases` using Influence
7. Replenish R&D Board and Market Row
8. Discard hand to discard pile
9. Mark player as revealed

**Key Change:** ACQUIRE_TECHNOLOGY and BUY_MARKET_CARD become internal-only (called by REVEAL, not directly)

---

### Phase 4: Update CLI

#### 4.1 Extend `place` Command ✅ DONE
**File:** `cli/upship.js`
Now accepts all location-specific parameters as key=value pairs.

#### 4.2 Add New Commands
**File:** `cli/upship.js`

```bash
# Launchpad flow
upship <user> place <gameId> launchpad <cardIndex>
upship <user> launch <gameId> <shipId> <routeId> <gasType> [gasCount]  # Can repeat
upship <user> nolaunches <gameId>  # Signal done launching

# Reveal with acquisitions
upship <user> reveal <gameId> [techId1,techId2] [cardId1,cardId2]
```

#### 4.3 Deprecate/Remove Shorthand Commands
Remove or add deprecation warnings to:
- `buygas` → use `place ... gas-depot`
- `recruit` → use `place ... academy`
- `build` → use `place ... construction-hall`
- `install` → use `place ... design-bureau`
- `tech` → use `reveal` with tech acquisitions
- `pass` → use `reveal` (pass is now part of reveal)

Keep these:
- `loan` - free action per Section 5.3
- `launch` - valid during launchpad active state
- `endturn` - still needed for income/cleanup phase

---

### Phase 5: Update Playtest Bot

#### 5.1 Update Worker Placement to Pass All Parameters
**File:** `scripts/playtest.py`

In `handle_worker_placement_round()` / `find_strategic_placement()`:
- ✅ When placing at `construction_hall`: include `buildCount`
- ✅ When placing at `gas_depot`: include `gasType`, `gasAmount`
- When placing at `academy`: include `crewType`, `crewCount`
- When placing at `launchpad`: no params, but handle multi-launch flow after
- etc.

#### 5.2 Handle Launchpad Multi-Step Flow
**File:** `scripts/playtest.py`

After placing at launchpad:
```python
# Place agent at launchpad
run_cli(player, "place", game_id, "launchpad", card_index)

# Launch multiple ships while at launchpad
for ship in ships_to_launch:
    run_cli(player, "launch", game_id, ship.id, route.id, gas_type, gas_count)

# Signal done launching
run_cli(player, "nolaunches", game_id)
```

#### 5.3 Update Reveal to Be Atomic
**File:** `scripts/playtest.py`

Replace `take_reveal_actions()` with atomic reveal:
```python
def do_reveal(player, game_id):
    # Calculate what tech/cards to acquire based on resources
    tech_ids = select_tech_acquisitions(player, game_id)
    card_ids = select_market_purchases(player, game_id)

    # Single atomic reveal call
    run_cli(player, "reveal", game_id, ",".join(tech_ids), ",".join(card_ids))
```

Remove these from reveal phase (now happen during placement):
- ✅ Building (construction_hall)
- ✅ Gas buying (gas_depot)
- Crew recruitment (academy)
- Ship launching (launchpad)

---

### Phase 6: Tests

#### 6.1 Add Tests for Each Location
**Pattern:** Same as `building.test.js` for construction_hall

For each location, test:
1. Action executes immediately when placing agent
2. Direct API call is rejected during reveal phase
3. Direct API call is rejected without agent at location
4. Direct API call is rejected when another player has the agent

#### 6.2 Update Existing Tests
Add `_internal: true` to any tests that call action processors directly (like we did for BUILD_SHIP tests).

---

## Execution Order

### Step 1: Foundation (TDD per location)
For each location, use TDD:
1. Write failing test for atomic execution
2. Write failing test for direct call rejection
3. Implement fix
4. Verify tests pass

**Order of locations:**
1. ✅ `construction_hall` - BUILD_SHIP (Done)
2. ✅ `gas_depot` - BUY_GAS (Done)
3. `academy` - RECRUIT_CREW
4. `flight_school` - UPGRADE_OFFICER_INCOME
5. `technical_institute` - UPGRADE_ENGINEER_INCOME
6. `insurance_bureau` - BUY_INSURANCE
7. `government_liaison` - Needs new processor
8. `research_institute` - Needs new processor (upgrade research level)
9. `design_bureau` - Complex (array of swaps)
10. `launchpad` - Complex (multi-step with NO_MORE_LAUNCHES)

### Step 2: Atomic Reveal
1. Create REVEAL action with bundled tech/card acquisitions
2. Add _internal validation to ACQUIRE_TECHNOLOGY, BUY_MARKET_CARD
3. Update PASS to transition to reveal-pending state
4. Write tests for atomic reveal

### Step 3: CLI Updates
1. ✅ Extend `place` command with location params (Done)
2. Add `nolaunches` command
3. Add `reveal` command with acquisitions
4. Deprecate bypassing commands

### Step 4: Playtest Bot Updates
1. ✅ Update placement for construction_hall (Done)
2. ✅ Update placement for gas_depot (Done)
3. Update remaining placements
4. Implement launchpad multi-step flow
5. Implement atomic reveal
6. Remove reveal-phase action calls

### Step 5: Cleanup
1. Fix any broken existing tests (add `_internal: true`)
2. Remove deprecated action handlers if desired
3. Update documentation

## Notes

- Use TDD approach: write failing test, implement fix, verify pass
- Each location can be done incrementally and tested independently
- The `_internal` flag pattern from BUILD_SHIP is the model to follow
- Launchpad and Reveal are the most complex changes
