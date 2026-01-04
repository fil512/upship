# UP SHIP! Icon Assets

This folder contains all SVG icons used in the UP SHIP! board game. Icons can be replaced by editing the SVG files directly—no code changes required.

## Icon Requirements

Each SVG file must:
- Use `viewBox="0 0 24 24"` (24×24 design grid)
- Include `xmlns="http://www.w3.org/2000/svg"`
- Have colors baked into the SVG (except player-colored icons which use `currentColor`)
- Be a complete, standalone SVG file

## Player Colors

Icons marked "Player color" use `currentColor` and are colored based on the owning player's faction:

| Faction | Fill Color | Border Color |
|---------|------------|--------------|
| Germany | #1a1a1a (Black) | #525252 |
| Britain | #1e40af (Royal Blue) | #3b82f6 |
| USA | #dc2626 (Red) | #f87171 |
| Italy | #16a34a (Green) | #4ade80 |

## Icon Reference

### Resources

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `cash.svg` | Currency spent on upgrades, gas, and crew | Circle with "£" symbol | #888888 (Grey) |
| `income.svg` | Increase to an income track | Upward arrow (↑) | #4caf50 (Green) |
| `officers.svg` | Personnel required to launch ships | Captain silhouette with peaked cap, epaulettes, and uniform | #e0e0e0 (Light grey) with #f1c40f (Gold) accents |
| `engineers.svg` | Personnel who aid research and handle hazard repairs | Hard hat | #ffa726 (Orange) |
| `hydrogen.svg` | Cheap but flammable lifting gas | Square with "H" | #f1c40f (Yellow) background |
| `helium.svg` | Safe but expensive lifting gas (USA monopoly) | Square with "He" | White background, #666 border |
| `vp.svg` | Victory Points—the win condition | Star | #4caf50 (Green) |
| `research.svg` | Resource used to unlock technologies | Square | #888888 (Grey) |
| `influence.svg` | Resource used to purchase market cards | Diamond (rotated square) | #888888 (Grey) |

### Card Symbols

These appear on player cards and determine which Ground Board locations can be activated.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `wrench.svg` | Technical symbol—engineering actions (Research Institute, Design Bureau, Construction Hall) | Adjustable wrench tool | #4a9eff (Blue) |
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

These represent airship capabilities shown on the Blueprint.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `lift.svg` | Buoyancy from gas cells—determines cargo capacity | Baloon | #9ca3af (Grey) |
| `weight.svg` | Mass from installed upgrades—subtracts from lift | Anchor | #9ca3af (Grey) |
| `speed.svg` | How fast the ship travels routes | TBD | #9ca3af (Grey) |
| `range.svg` | Maximum flight distance in segments | Horizontal arrow with origin dot | #9ca3af (Grey) |
| `ceiling.svg` | Maximum altitude—required for mountain routes | Cloud | #9ca3af (Grey) |
| `reliability.svg` | Resistance to hazards during flight | Shield | #9ca3af (Grey) |
| `luxury.svg` | Passenger comfort—bonus income on passenger routes | TBD | #9ca3af (Grey) |

### Game Mechanics

Icons representing various game actions and concepts.

| File | Game Meaning | Current Shape | Color |
|------|--------------|---------------|-------|
| `ship.svg` | An airship in your fleet | Zeppelin with gondola and tail fins | Player color |
| `launch.svg` | Action to send a ship on a route | Airship with diagonal motion lines | #9ca3af (Grey) |
| `route.svg` | Flight path between cities | Two dots connected by dashed line | #9ca3af (Grey) |
| `technology.svg` | Tech tiles that unlock upgrade types | Gear | #9ca3af (Grey) |
| `upgrade.svg` | Components installed on the Blueprint | plus sign | #9ca3af (Grey) |
| `hazard.svg` | Danger events during flight (storms, mechanical failure) | Warning triangle with exclamation mark | #ef4444 (Red) |
| `insurance.svg` | Protection against ship loss from crashes | Document/policy paper | #9ca3af (Grey) |
| `blueprint.svg` | Your company's ship design template | Grid pattern | #9ca3af (Grey) |
| `eye.svg` | Peek action—view hidden information | Eye | #9ca3af (Grey) |
| `politics.svg` | Government influence and regulations | TBD | #9ca3af (Grey) |
| `gas.svg` | Generic lifting gas (hydrogen or helium) | Gas canister | #9ca3af (Grey) |

## Design Notes

### Era & Theme
UP SHIP! is set during the Golden Age of Airships (1900-1937). Consider Art Deco, industrial, or vintage aviation aesthetics when redesigning icons.

### Size Context
Icons appear at various sizes throughout the UI:
- **Small (10-14px)**: Inline with text, stat displays
- **Medium (16-24px)**: Buttons, badges, card symbols
- **Large (32px+)**: Feature highlights, empty states

Design with the smallest size in mind—details should remain legible at 10px.
