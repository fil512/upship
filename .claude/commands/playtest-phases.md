# UP SHIP! Multi-Phase UI Playtest

Orchestrates comprehensive UI playtesting across 4 phases with progress tracking in `plans/playtest-tracking.md`.

## Prerequisites

1. **Chrome DevTools MCP server connected** (chrome-devtools)
2. **Both servers running:**
   - Express API: http://localhost:3000
   - SvelteKit Frontend: http://localhost:5173
3. **Game setup:** Run `python -m playtest setup` before testing (uses local server via .upship-config)

## Allowed Tools and Commands

This skill is allowed to run the following commands without additional permission:
- `python -m playtest *` - All playtest commands (setup, status, action, autoplay, etc.)
- Chrome DevTools MCP tools (`mcp__chrome-devtools__*`)

## IMPORTANT: Use Playtest Tool, NOT CLI

**ALWAYS use the `python -m playtest` commands for game operations. NEVER use `npm run cli`.**

The playtest tool provides:
- Automatic session management for all players
- Proper game state caching
- Strategic AI autoplay
- Integrated logging

If a function is missing from the playtest tool, it should be added to `playtest/__main__.py` and documented here before use.

### Playtest Commands Reference

```bash
# Game setup
python -m playtest setup                  # Create new 4-player game
python -m playtest setup-interactive      # Create game for human + 3 AI

# Game status
python -m playtest status [player]        # Show game status
python -m playtest summary                # Show all players' summary
python -m playtest whose-turn             # Show whose turn it is
python -m playtest routes                 # Show available routes
python -m playtest debug                  # Show raw game state

# Game actions
python -m playtest action <player> <cmd>  # Run single action
python -m playtest autoplay [turns]       # Run AI until game ends
python -m playtest autoturn <faction>     # Play one turn for faction
python -m playtest endphase               # All players end turn/pass
python -m playtest launch <player> <ship> <route> [gas]  # Launch ship

# Utilities
python -m playtest gameid                 # Print current game ID
python -m playtest sessions               # List active sessions
python -m playtest tail [lines]           # Show playtest log
```

### Adding Missing Playtest Functions

If you need a game action that's not available in the playtest tool:
1. Check if it exists in `client/client.py` (the Python client library)
2. If it exists in the client, add a wrapper in `playtest/__main__.py`
3. If it doesn't exist in the client, first add it to `client/client.py`
4. Document the new command in this file
5. Use the new command for testing

## Workflow

1. **Read tracking file**: Check `plans/playtest-tracking.md` for current progress
2. **Create if missing**: If file doesn't exist, create it with the full template
3. **Find next phase**: Locate first phase with `- [ ]` status
4. **Execute phase**: Run the appropriate testing workflow
5. **Update tracking**: Mark items complete, document issues, set completion date
6. **Report status**: Summarize what was tested and any issues found

---

## Phase Definitions

### Phase 1: UI Functionality

**Goal**: Verify all UI elements work correctly (buttons, tabs, dropdowns, forms, modals).

**Tools**: Chrome DevTools MCP (`mcp__chrome-devtools__*`)

**Workflow**:
1. Setup game: `UPSHIP_LOCAL=1 python -m playtest setup`
2. Open browser: `mcp__chrome-devtools__new_page url="http://localhost:5173/"`
3. Login as `playtest_germany` / `test123456`
4. Navigate to active game
5. Systematically test each UI element in the Phase 1 checklist
6. For each element:
   - Take snapshot to find element UID
   - Interact with element (click, fill, hover)
   - Verify expected behavior
   - Mark `[x]` in tracking file if working, document issue if not
7. Mark Phase 1 complete when all items verified

**Checklist Categories**:
- Header (indicators, dropdowns, status)
- Left Sidebar (resources, blueprint, tech)
- Center Area (ground board, hand, fleet, routes)
- Right Sidebar (players, actions, log)
- Toast notifications
- Modal dialogs

---

### Phase 2: UI Game Operation

**Goal**: Verify all game rules can be followed through the UI.

**Tools**: Chrome DevTools MCP + spec reading

**Workflow**:
1. Read `spec/upship_rules.md` sections 5-14
2. Read `spec/appendix.md` appendices B-G
3. For each rules section:
   - Identify the game actions it describes
   - Attempt to perform those actions via UI
   - Verify the UI reflects correct game state changes
   - Mark `[x]` if rule can be followed via UI
   - Document in "Rules Not Implementable via UI" if blocked
4. Mark Phase 2 complete when all sections validated

**Sections to Validate**:
- Section 5: Game Round (worker placement, reveal, income/cleanup phases)
- Section 6: Ground Board Locations (all 12 locations)
- Section 7: Building Ships
- Section 8: Launching Ships (including hazard checks)
- Section 9: Technology & Upgrades
- Section 10: Routes & Maps
- Section 11: Deck-Building System
- Section 12: Age Transitions
- Section 13: Faction Abilities
- Appendix B: Quick Reference (phase order)
- Appendix C: Technology Tiles
- Appendix D: Upgrade Tiles
- Appendix E: Hazard Deck
- Appendix F: Routes
- Appendix G: Combat Missions

---

### Phase 3: UI User Experience

**Goal**: Evaluate UX quality - could a player understand how to play without reading the rules?

**Tools**: `board-game-ui` skill + Chrome DevTools MCP

**Workflow**:
1. Invoke the `board-game-ui` skill
2. Take screenshots of key game states:
   - Login/lobby page
   - Game board (worker placement phase)
   - Game board (reveal phase)
   - Blueprint panel
   - Ship launching flow
   - Route claiming flow
3. Evaluate each UX criterion:
   - Is the current phase obvious?
   - Are available actions discoverable?
   - Is feedback clear and timely?
   - Could a new player figure out what to do?
4. Document specific UX recommendations
5. Mark Phase 3 complete when fully evaluated

**Evaluation Criteria**:
- Information hierarchy and visibility
- Action discoverability
- Feedback timing and clarity
- Learning curve / onboarding experience
- Cognitive load assessment
- Turn flow intuitiveness
- Error message helpfulness
- Progress indicators

---

### Phase 4: UI Design

**Goal**: Evaluate visual polish and make the game look professional.

**Tools**: `ui-design-expert` skill + Chrome DevTools MCP screenshots

**Workflow**:
1. Invoke the `ui-design-expert` skill
2. Take full-page screenshots of every page/view:
   - Login page
   - Lobby (game list)
   - Game board (full view)
   - Each sidebar expanded
   - Each modal dialog
3. For each screenshot, apply the skill's review workflow:
   - First impressions (2 seconds)
   - Visual hierarchy check
   - Color & contrast audit
   - Spacing & alignment
   - Polish & detail
4. Provide specific CSS recommendations with code snippets
5. Mark Phase 4 complete when all views reviewed

**Visual Polish Checklist**:
- Colors from steampunk/brass palette
- Consistent spacing using scale
- Cards/panels have appropriate shadows
- Interactive elements have hover states
- Selected states clearly visible
- Typography hierarchy clear
- Focus states visible
- Motion respects user preferences

---

## Tracking File Template

If `plans/playtest-tracking.md` doesn't exist, create it with this structure:

```markdown
# UI Playtest Progress

*Last updated: YYYY-MM-DD*
*Current phase: 1*

## Phase Status
- [ ] Phase 1: UI Functionality
- [ ] Phase 2: UI Game Operation
- [ ] Phase 3: UI User Experience
- [ ] Phase 4: UI Design

---

## Phase 1: UI Functionality

### Header
- [ ] Age/Turn/Phase indicators update correctly
- [ ] "Your Turn" / "Waiting for [player]" indicator
- [ ] Player switching dropdown works (dev mode)
- [ ] Online player count shows connected players

### Left Sidebar
- [ ] ResourcePanel: Cash, income, VP display
- [ ] ResourcePanel: Officers/Engineers counts
- [ ] ResourcePanel: Hydrogen/Helium gas cubes
- [ ] Blueprint: 4 slot rows (Frame, Fabric, Drive, Component)
- [ ] Blueprint: Filled vs empty slots visually distinct
- [ ] Blueprint: ShipStats calculate correctly
- [ ] TechList: Acquired technologies display

### Center Area
- [ ] GroundBoard: 12 locations displayed
- [ ] GroundBoard: Locations grouped by symbol type
- [ ] GroundBoard: Available locations highlight when card selected
- [ ] GroundBoard: Occupied locations show agent marker
- [ ] HandSection: Cards display with symbols
- [ ] HandSection: Cards selectable during worker placement
- [ ] HandSection: Deck/discard counts show
- [ ] FleetPanel: Ships grouped by status
- [ ] RoutesPanel: Available routes display with stats

### Right Sidebar
- [ ] PlayersList: All players with factions
- [ ] PlayersList: Online indicators
- [ ] PlayersList: Current player highlighted
- [ ] Actions panel: End Turn/Pass button works
- [ ] GameLog: Recent entries display

### Toast Notifications
- [ ] "It's Your Turn!" toast appears
- [ ] Phase change toasts appear
- [ ] Error toasts appear for invalid actions

### Modal Dialogs
- [ ] Create game modal works
- [ ] Upgrade selection modal works
- [ ] Route selection modal works
- [ ] Confirmation dialogs work

### Issues Found
(Document any broken or missing UI elements here)

### Completion Date:

---

## Phase 2: UI Game Operation

### Rules Validation
- [ ] Section 5: Game Round (worker placement, reveal, income/cleanup)
- [ ] Section 6.1: Research Institute
- [ ] Section 6.2: Design Bureau
- [ ] Section 6.3: Construction Hall
- [ ] Section 6.4: Launchpad
- [ ] Section 6.5: Ministry
- [ ] Section 6.6: Gas Depot
- [ ] Section 6.7: Weather Bureau
- [ ] Section 6.8: Academy
- [ ] Section 6.9: Flight School
- [ ] Section 6.10: Technical Institute
- [ ] Section 6.11: The Bank
- [ ] Section 6.12: Insurance Bureau
- [ ] Section 7: Building Ships
- [ ] Section 8: Launching Ships (hazard checks)
- [ ] Section 9: Technology & Upgrades
- [ ] Section 10: Routes & Maps
- [ ] Section 11: Deck-Building
- [ ] Section 12: Age Transitions
- [ ] Section 13: Faction Abilities
- [ ] Appendix B: Phase Order
- [ ] Appendix C: Technology Tiles display correctly
- [ ] Appendix D: Upgrade Tiles display correctly
- [ ] Appendix E: Hazard effects shown
- [ ] Appendix F: Routes match specification
- [ ] Appendix G: Combat Missions (Age II)

### Rules Not Implementable via UI
(Document any rules that cannot be done through the UI)

### Completion Date:

---

## Phase 3: UI User Experience

### Evaluation Criteria
- [ ] Current phase/turn is immediately obvious
- [ ] Available actions are visually discoverable
- [ ] Unavailable actions are clearly disabled/grayed
- [ ] Feedback appears within 200ms of action
- [ ] Error messages explain what went wrong
- [ ] Success feedback confirms action completed
- [ ] New player could figure out worker placement
- [ ] New player could figure out ship building
- [ ] New player could figure out launching
- [ ] Resource costs are visible before committing
- [ ] Undo/cancel options are available
- [ ] Turn progression is smooth and clear

### UX Recommendations
(Document specific improvements for intuitive play)

### Completion Date:

---

## Phase 4: UI Design

### Visual Polish Checklist
- [ ] Colors from steampunk/brass palette (--brass-gold, --slate-dark, etc.)
- [ ] Consistent spacing using defined scale
- [ ] Cards/panels have appropriate shadows
- [ ] Interactive elements have hover states
- [ ] Selected states are clearly visible
- [ ] Typography hierarchy is clear (display vs body fonts)
- [ ] Focus states visible for keyboard navigation
- [ ] Animations are smooth and purposeful

### Page Reviews
- [ ] Login page reviewed
- [ ] Lobby page reviewed
- [ ] Game board reviewed
- [ ] Blueprint panel reviewed
- [ ] All modal dialogs reviewed

### Design Recommendations
(Specific CSS improvements with code snippets)

### Completion Date:
```

---

## Quick Reference

**Start testing:**
```bash
scripts/restart_server.sh
UPSHIP_LOCAL=1 python -m playtest setup
```

**Check progress:**
Read `plans/playtest-tracking.md` for current phase status.

**Resume testing:**
Run `/playtest-phases` to continue from last incomplete phase.

**Complete a phase:**
Mark all items `[x]`, add completion date, update phase status to `[x]`.
