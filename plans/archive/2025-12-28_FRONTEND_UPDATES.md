# Plan: Frontend Updates for New Phase System

## Summary

Update the game UI (`public/game.html`) to support the new 3-phase game loop with worker placement mechanics.

## Current vs Target

| Aspect | Current | Target |
|--------|---------|--------|
| Phases | 5 phases (planning, actions, launch, income, cleanup) | 3 phases (worker_placement, reveal, income_cleanup) |
| Turn taking | Current player does everything | Interleaved placement: players take turns placing agents |
| Actions | Direct action buttons always visible | Actions require placing agent at location first |
| End turn | Single "End Turn" button | "Pass" during worker placement, "End Turn" in reveal/cleanup |

## Implementation Tasks

### Task 1: Update Phase Display

**Location:** Game header template (~line 998)

Current:
```html
<div class="game-info-value">${state.phase}</div>
```

Change to:
```javascript
function formatPhase(phase) {
  const names = {
    worker_placement: 'Worker Placement',
    reveal: 'Reveal & Acquisition',
    income_cleanup: 'Income & Cleanup',
    // Legacy
    planning: 'Planning',
    actions: 'Actions',
    launch: 'Launch',
    income: 'Income',
    cleanup: 'Cleanup'
  };
  return names[phase] || phase;
}
// Then use: ${formatPhase(state.phase)}
```

### Task 2: Add Pass Button for Worker Placement Phase

**Location:** Action buttons section (~line 1402)

Replace `End Turn` button logic:
```javascript
${state.phase === 'worker_placement'
  ? `<button class="action-btn primary" onclick="passAction()" ${!isMyTurn ? 'disabled' : ''}>
       ⏭️ Pass
     </button>`
  : `<button class="action-btn primary" onclick="endTurn()" ${!isMyTurn ? 'disabled' : ''}>
       ✅ End Turn
     </button>`
}
```

Add JavaScript function:
```javascript
async function passAction() {
  await performAction('PASS', {});
}
```

### Task 3: Show Current Placer During Worker Placement

**Location:** Turn indicator section (after header)

Add worker placement indicator:
```javascript
// Add new function to determine current placer
function getCurrentPlacerFaction(state) {
  if (state.phase !== 'worker_placement' || !state.workerPlacement) return null;
  const order = state.workerPlacement.placementOrder || [];
  const index = state.workerPlacement.currentPlacerIndex || 0;
  const playerId = order[index];
  return state.players[playerId]?.faction;
}

// In template, replace or augment turn indicator:
${state.phase === 'worker_placement' && state.workerPlacement ? `
  <div class="placement-indicator">
    <div class="game-info-label">Current Placer</div>
    <div class="game-info-value">${getCurrentPlacerFaction(state) || '—'}</div>
  </div>
  <div class="passed-count">
    <div class="game-info-label">Passed</div>
    <div class="game-info-value">${(state.workerPlacement.passedPlayers || []).length}/4</div>
  </div>
` : ''}
```

### Task 4: Display New Player Resources (Influence, Research, Agents)

**Location:** Left sidebar player resources (~line 1100)

Add to resource grid:
```html
<div class="resource-item">
  <div class="resource-label">Research</div>
  <div class="resource-value">${myState.research || 0}</div>
</div>
<div class="resource-item">
  <div class="resource-label">Influence</div>
  <div class="resource-value">${myState.influence || 0}</div>
</div>
<div class="resource-item">
  <div class="resource-label">Agents</div>
  <div class="resource-value">${myState.agentsRemaining || 0}/3</div>
</div>
```

### Task 5: Show Player Hand with Symbols

**Location:** Cards display section

Update hand display to show card symbols for placement:
```javascript
${(myState.hand || []).map((card, i) => `
  <div class="card ${isMyTurn && state.phase === 'worker_placement' ? 'playable' : ''}"
       onclick="selectCard(${i})"
       data-symbol="${card.symbol || 'any'}">
    <div class="card-name">${card.name}</div>
    <div class="card-symbol">${getSymbolIcon(card.symbol)}</div>
    ${card.revealBonus ? `
      <div class="card-reveal-bonus">
        ${card.revealBonus.research ? `+${card.revealBonus.research} Research` : ''}
        ${card.revealBonus.influence ? `+${card.revealBonus.influence} Influence` : ''}
      </div>
    ` : ''}
  </div>
`).join('')}

// Helper function
function getSymbolIcon(symbol) {
  const icons = {
    wrench: '🔧',
    propeller: '⚙️',
    coin: '🪙',
    any: '✨'
  };
  return icons[symbol] || '❓';
}
```

### Task 6: Ground Board Location Display

**Location:** New section in main area or sidebar

Add Ground Board visualization:
```html
<div class="ground-board-section">
  <div class="section-title">Ground Board</div>
  <div class="locations-grid">
    ${Object.entries(GROUND_BOARD_LOCATIONS).map(([locId, loc]) => {
      const placement = state.groundBoard?.placements?.[locId];
      const isOccupied = !!placement;
      const canPlace = !isOccupied && selectedCard && canPlaceAtLocation(selectedCard.symbol, locId);
      return `
        <div class="location ${isOccupied ? 'occupied' : ''} ${canPlace ? 'available' : ''}"
             onclick="${canPlace ? `placeAgent('${locId}')` : ''}"
             title="${loc.description}">
          <div class="location-symbol">${getSymbolIcon(loc.symbol)}</div>
          <div class="location-name">${loc.name}</div>
          ${isOccupied ? `
            <div class="location-occupant">${getFactionFlag(state.players[placement.playerId]?.faction)}</div>
          ` : ''}
        </div>
      `;
    }).join('')}
  </div>
</div>
```

Add CSS:
```css
.locations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.location {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(196, 163, 90, 0.3);
  border-radius: 4px;
  padding: 8px;
  text-align: center;
  cursor: default;
}

.location.available {
  border-color: #4a9;
  cursor: pointer;
}

.location.available:hover {
  background: rgba(68, 170, 153, 0.2);
}

.location.occupied {
  opacity: 0.6;
}

.location-symbol {
  font-size: 1.5rem;
}

.location-name {
  font-size: 0.7rem;
  color: #888;
  margin-top: 4px;
}

.location-occupant {
  font-size: 1rem;
  margin-top: 4px;
}
```

### Task 7: Card Selection and Agent Placement

Add JavaScript for card selection and placement:
```javascript
let selectedCardIndex = null;

function selectCard(index) {
  if (state.phase !== 'worker_placement' || !isMyTurn) return;

  if (selectedCardIndex === index) {
    selectedCardIndex = null;
  } else {
    selectedCardIndex = index;
  }
  renderGame(); // Re-render to show selection
}

async function placeAgent(locationId) {
  if (selectedCardIndex === null) {
    showMessage('Select a card first');
    return;
  }

  await performAction('PLACE_AGENT', {
    locationId: locationId,
    cardIndex: selectedCardIndex
  });

  selectedCardIndex = null;
}

function canPlaceAtLocation(cardSymbol, locationId) {
  const loc = GROUND_BOARD_LOCATIONS[locationId];
  if (!loc) return false;
  return cardSymbol === 'any' || cardSymbol === loc.symbol;
}
```

### Task 8: Reveal Phase Display

Add reveal phase specific UI:
```javascript
${state.phase === 'reveal' && state.revealPhase ? `
  <div class="reveal-section">
    <div class="section-title">Revealed Hands</div>
    ${Object.entries(state.revealPhase.revealedHands || {}).map(([pid, cards]) => `
      <div class="revealed-hand">
        <div class="player-label">${getFactionFlag(state.players[pid]?.faction)}</div>
        <div class="revealed-cards">
          ${cards.map(card => `
            <span class="revealed-card">${card.name} (${getSymbolIcon(card.symbol)})</span>
          `).join(', ')}
        </div>
      </div>
    `).join('')}
  </div>
` : ''}
```

### Task 9: Reorganize Action Buttons by Phase

Make actions phase-aware:
```javascript
<div class="actions-section">
  ${state.phase === 'worker_placement' ? `
    <div class="phase-info">
      Place agents at Ground Board locations using cards with matching symbols.
      Click a card, then click an available location.
    </div>
  ` : state.phase === 'reveal' ? `
    <div class="phase-info">
      Spend Research to acquire technologies. Spend Influence to buy Market cards.
    </div>
    <div class="action-buttons">
      <button class="action-btn secondary" onclick="showTechModal()">
        🔬 Acquire Technology (Research)
      </button>
      <button class="action-btn secondary" onclick="showMarketModal()">
        🎴 Buy Market Card (Influence)
      </button>
    </div>
  ` : state.phase === 'income_cleanup' ? `
    <div class="phase-info">
      Income collected automatically. Click End Turn to proceed.
    </div>
  ` : `
    <!-- Legacy phase actions -->
    <div class="action-buttons">
      <!-- existing buttons -->
    </div>
  `}
</div>
```

### Task 10: Add Ground Board Location Data

Add location definitions to JavaScript:
```javascript
const GROUND_BOARD_LOCATIONS = {
  'research-institute': { name: 'Research Institute', symbol: 'wrench', description: 'Buy Research for £3 each' },
  'design-bureau': { name: 'Design Bureau', symbol: 'wrench', description: 'Install upgrade to blueprint' },
  'construction-hall': { name: 'Construction Hall', symbol: 'wrench', description: 'Build ships' },
  'launchpad': { name: 'Launchpad', symbol: 'propeller', description: 'Launch ships' },
  'academy': { name: 'Academy', symbol: 'coin', description: 'Recruit Officers/Engineers' },
  'flight-school': { name: 'Flight School', symbol: 'coin', description: 'Upgrade Officer income' },
  'technical-institute': { name: 'Technical Institute', symbol: 'coin', description: 'Upgrade Engineer income' },
  'the-bank': { name: 'The Bank', symbol: 'coin', description: 'Take loans' },
  'ministry': { name: 'Ministry', symbol: 'propeller', description: 'Draw 2/discard 1, turn priority' },
  'gas-depot': { name: 'Gas Depot', symbol: 'propeller', description: 'Buy gas cubes' },
  'insurance-bureau': { name: 'Insurance Bureau', symbol: 'coin', description: 'Buy insurance' },
  'weather-bureau': { name: 'Weather Bureau', symbol: 'propeller', description: 'Peek at hazard for £2' }
};
```

## CSS Additions Summary

```css
/* Card selection */
.card.selected {
  border: 2px solid #4a9;
  box-shadow: 0 0 10px rgba(68, 170, 153, 0.5);
}

.card.playable:hover {
  transform: translateY(-5px);
  cursor: pointer;
}

/* Phase info */
.phase-info {
  background: rgba(196, 163, 90, 0.1);
  border: 1px solid rgba(196, 163, 90, 0.3);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 0.85rem;
  color: #c4a35a;
}

/* Revealed hands */
.revealed-hand {
  display: flex;
  gap: 10px;
  padding: 5px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: 5px;
}

.revealed-cards {
  font-size: 0.8rem;
  color: #888;
}

/* Placement indicator */
.placement-indicator,
.passed-count {
  text-align: center;
}
```

## Testing

After implementation:

1. Start a new game and verify:
   - Phase shows "Worker Placement" initially
   - Pass button appears instead of End Turn
   - Agents Remaining shows 3/3

2. Test card selection:
   - Click card → it highlights
   - Click available location → agent placed
   - Verify card discarded and agent count decremented

3. Test phase transitions:
   - All players pass → moves to Reveal phase
   - All players end turn in Reveal → moves to Income & Cleanup
   - All players end turn → new round begins

4. Test revealed hands display:
   - In Reveal phase, all hands visible
   - Resource collection shown in log

## Priority

Medium-High - Frontend is needed for human playtesting, but CLI/Python tools can be used for basic testing in the meantime.

## Simplifications

For initial implementation:
1. Skip the full Ground Board visualization - just add Pass button
2. Skip card selection UI - require manual API calls for agent placement
3. Add location indicators to existing action buttons instead of full Ground Board UI

### Minimal Viable Update

At minimum, update:
1. Phase display formatting
2. Add Pass button during worker_placement
3. Show agents remaining
4. Show Research/Influence resources

This allows the game to be playable while we iterate on the full UI.
