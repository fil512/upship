# UP SHIP! Icon Assets

This folder contains all SVG icons used in the UP SHIP! board game. Icons can be replaced by editing the SVG files directly—no code changes required.

## Icon Requirements

Each SVG file must:
- Use `viewBox="0 0 24 24"` (24×24 design grid)
- Include `xmlns="http://www.w3.org/2000/svg"`
- Have colors baked into the SVG (except player-colored icons which use `currentColor`)
- Be a complete, standalone SVG file

## Color Context

Icons appear in different UI contexts:

### Default Colors
- **Ship stat icons** (lift, weight, speed, range, ceiling, reliability, luxury, armor) use `#4b5563` (dark grey) for good contrast on light backgrounds
- **Colored icons** (income, hazard, hydrogen, helium, etc.) retain their semantic colors

### Tech Tile Background
Tech tiles use gradient backgrounds based on their slot type for a professional boardgame look:

| Slot Type | Border Color | Gradient |
|-----------|--------------|----------|
| Frame | #1d4ed8 (Deep Blue) | Light blue gradient (#dbeafe → #bfdbfe → #93c5fd) |
| Fabric | #7c3aed (Deep Purple) | Light purple gradient (#ede9fe → #ddd6fe → #c4b5fd) |
| Drive | #d97706 (Deep Amber) | Light amber gradient (#fef3c7 → #fde68a → #fcd34d) |
| Component | #059669 (Deep Emerald) | Light green gradient (#d1fae5 → #a7f3d0 → #6ee7b7) |

The dark grey stat icons (`#4b5563`) provide good contrast on these gradient backgrounds without needing CSS overrides.

### Player Colors

Icons marked "Player color" use `currentColor` and are colored based on the owning player's faction:

| Faction | Fill Color | Border Color |
|---------|------------|--------------|
| Germany | #dc2626 (Red) | #f87171 |
| Britain | #1e40af (Royal Blue) | #3b82f6 |
| USA | #ffffff (White) | #e5e5e5 |
| Italy | #16a34a (Green) | #4ade80 |

## Icon Reference

### Resources

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `cash.svg` | Currency spent on upgrades, gas, and crew | Circle with "£" symbol | #888888 (Grey) |
| `income.svg` | Increase to an income track | Upward arrow (↑) | #4caf50 (Green) |
| `officers.svg` | Personnel required to launch ships | Captain silhouette with peaked cap, epaulettes, and uniform | #e0e0e0 (Light grey) with #f1c40f (Gold) accents |
| `engineers.svg` | Personnel who aid research and handle hazards | Hard hat | #ffa726 (Orange) |
| `hydrogen.svg` | Cheap but flammable lifting gas | Square with "H" | #f1c40f (Yellow) background |
| `helium.svg` | Safe but expensive lifting gas (USA monopoly) | Square with "He" | White background, #666 border |
| `vp.svg` | Victory Points—the win condition | Gold seal with 12 jagged edges | #fbbf24 (Gold) fill, #b45309 (Orange-brown) stroke |
| `research.svg` | Resource used to unlock technologies | Square | #888888 (Grey) |
| `influence.svg` | Resource used to purchase market cards | Diamond (rotated square) | #888888 (Grey) |

**Note on VP Display:** Victory Points use a unified gold seal design throughout the game:
- **Tech cards**: Gold seal icon (`vp.svg`) shown in card headers
- **Map routes**: Gold seal (inline SVG in Route.svelte) displayed alongside the green income circle
- Both use #fbbf24 (gold) fill with #b45309 (orange-brown) stroke for a consistent "official seal" appearance

### Card Symbols

These appear on player cards and determine which Ground Board locations can be activated.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `wrench.svg` | Technical symbol—engineering actions (Research Institute, Blueprint Design, Construction Hall) | Adjustable wrench tool | #4a9eff (Blue) |
| `coin.svg` | Business symbol—financial actions (Academy, Flight School, The Bank, etc.) | Solid circle | #ffc107 (Gold) |
| `propeller.svg` | Operations symbol—flight actions (Launchpad, Gas Depot, Weather Bureau, etc.) | Three-blade aircraft propeller | #ffffff (White) |
| `any.svg` | Wild symbol—works at any location | Asterisk | #c4a35a (Tan/Gold) |

### Factions

National flags representing the four playable airship companies.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `germany.svg` | Germany—rigid airship pioneers (Zeppelin) | German Flag | #000000, #DD0000, #FFCC00 |
| `britain.svg` | Britain—imperial route masters | Union Jack (simplified) | #012169, #ffffff, #C8102E |
| `usa.svg` | USA—helium monopoly holders | US Flag (simplified) | #BF0A30, #ffffff, #002868 |
| `italy.svg` | Italy—semi-rigid specialists | Italian Flag | #009246, #ffffff, #CE2B37 |

### Ship Statistics

These represent airship capabilities shown on the Blueprint and tech tiles.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `lift.svg` | Buoyancy from gas cells—determines cargo capacity | Balloon | #4b5563 (Dark grey) |
| `weight.svg` | Mass from installed upgrades—subtracts from lift | Anchor/figure with arms | #4b5563 (Dark grey) |
| `speed.svg` | How fast the ship travels routes | Speedometer gauge | #4b5563 (Dark grey) |
| `range.svg` | Maximum flight distance in segments | Horizontal arrow with origin dot | #4b5563 (Dark grey) |
| `ceiling.svg` | Maximum altitude—required for mountain routes | Cloud | #4b5563 (Dark grey) |
| `reliability.svg` | Resistance to hazards during flight | Mechanical gear | #4b5563 (Dark grey) |
| `luxury.svg` | Passenger comfort—bonus income on passenger routes | Crown | #4b5563 (Dark grey) |
| `armor.svg` | Protection against combat damage (Age III) | Shield | #4b5563 (Dark grey) |
| `gas_socket.svg` | Slot for gas cube—provides +5 lift when loaded | Dashed square with "5" | #1d4ed8 (Dark blue) |

### Game Mechanics

Icons representing various game actions and concepts.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `ship.svg` | An airship in your fleet | Zeppelin with gondola and tail fins | Player color |
| `launch.svg` | Action to send a ship on a route | Airship with diagonal motion lines | #4b5563 (Dark grey) |
| `route.svg` | Flight path between cities | Two dots connected by dashed line | #4b5563 (Dark grey) |
| `technology.svg` | Tech tiles that unlock upgrade types | Gear | #4b5563 (Dark grey) |
| `upgrade.svg` | Components installed on the Blueprint | Plus sign | #4b5563 (Dark grey) |
| `hazard.svg` | Danger events during flight (storms, mechanical failure) | Warning triangle with exclamation mark | #ef4444 (Red) |
| `insurance.svg` | Protection against ship loss from crashes | Document/policy paper | #4b5563 (Dark grey) |
| `blueprint.svg` | Your company's ship design template | Grid pattern | #4b5563 (Dark grey) |
| `eye.svg` | Peek action—view hidden information | Eye | #4b5563 (Dark grey) |
| `politics.svg` | Government influence and regulations | Building with columns | #4b5563 (Dark grey) |
| `gas.svg` | Generic lifting gas (hydrogen or helium) | Gas canister | #4b5563 (Dark grey) |
| `arrow_up.svg` | Generic upward indicator | Upward arrow | #4caf50 (Green) |

### Combat Missions (Age III)

Icons for WWI-era military operations during the Great War.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `bomb.svg` | Bombing Run—aerial bombardment | WWI cylindrical bomb with tail fins | #4a4a4a (Dark grey) |
| `binoculars.svg` | Reconnaissance—observation mission | Military field binoculars | #5c5040 (Olive brown) |
| `supply_crate.svg` | Resupply/Transport—deliver supplies | Wooden crate with metal bands | #8b7355 (Wood brown) |
| `patrol.svg` | Patrol—area surveillance | WWI searchlight | #6a6a6a (Grey) with #f0e68c (Light beam) |
| `parachute.svg` | Emergency bailout/cargo drop | Parachute canopy with cargo | #ffffff (White) with #e0e0e0 accents |
| `telescope.svg` | Long-range observation/spyglass | Brass spyglass | #d4af37 (Gold) with #5ba3d0 (Blue lens) |

## Design Notes

### Era & Theme
UP SHIP! is set during the Golden Age of Airships (1900-1937). Consider Art Deco, industrial, or vintage aviation aesthetics when redesigning icons.

### Size Context
Icons appear at various sizes throughout the UI:
- **Small (10-14px)**: Inline with text, stat displays, tech tiles
- **Medium (16-24px)**: Buttons, badges, card symbols
- **Large (32px+)**: Feature highlights, empty states

Design with the smallest size in mind—details should remain legible at 10px.

### Icon Color Guidelines
- **Stat icons** should use `#4b5563` (dark grey) for visibility on light backgrounds
- **Semantic icons** (income=green, hazard=red) should retain their meaningful colors
- Avoid light greys (`#9ca3af` or lighter) as they lack contrast on cream backgrounds
