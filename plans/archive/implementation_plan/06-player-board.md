# Phase 06: Player Board UI

## Overview
Create the in-game UI for displaying player boards, resources, and game state.

## Goals
- [x] Create game.html with player board layout
- [x] Display player resources (cash, income, crew, gas)
- [x] Show blueprint with upgrade slots
- [x] Display hand of cards
- [x] Show R&D board technologies
- [x] Implement basic action buttons
- [x] Add game log display
- [x] Auto-redirect from lobby when game starts/is in progress

## Implementation

### Game View (`public/game.html`)

#### Layout (CSS Grid)
- **Header**: Game title, turn/phase info, turn indicator
- **Left Sidebar**: Resources, crew, gas, technologies, player list
- **Main Area**: Blueprint with upgrade slots
- **Right Sidebar**: Hand cards, R&D board, action buttons
- **Footer**: Game log

#### Resources Display
- Cash and income with icons
- Crew (Pilots, Engineers, Agents) with income rates
- Gas cubes (visual H/He indicators)
- Technologies list

#### Blueprint Display
- Age indicator with faction name
- Frame slots (4)
- Fabric slots (2)
- Drive slots (2)
- Component slots (3)
- Ship stats (Lift, Speed, Safety, Luxury)

#### Cards & Actions
- Hand display with card names/types
- R&D board with available technologies
- Action buttons: Buy Gas, Draw Cards, End Turn
- Disabled when not player's turn

### Lobby Updates (`public/index.html`)
- Auto-redirect to game.html when game starts
- Auto-redirect when viewing in-progress game

### API Integration
- Fetches game state from `/api/state/:gameId`
- Performs actions via POST `/api/state/:gameId/action`
- Auto-refreshes state every 5 seconds

## Visual Design
- Dark theme consistent with lobby
- Gold accents (#c4a35a) for highlights
- Turn indicator with pulse animation
- Responsive grid layout

## Next Steps
- Phase 07: Blueprint system with actual upgrade mechanics
