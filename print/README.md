# UP SHIP! Print Card Generator

Generate print-ready playing cards for the UP SHIP! board game. Cards are rendered at 300 DPI (2.5" × 3.5" standard poker size) to match the online game appearance.

## Quick Start

```bash
cd print
npm install
npm run generate          # Generate everything
npm run generate cards    # Generate all cards
npm run generate boards   # Generate all boards
```

Output files will be in `output/`:
- `output/cards/` - Individual card PNGs (750×1050px)
- `output/tiles/` - Tech tile PNGs (450×285px)
- `output/boards/` - Action board and player boards (12 boards: 4 factions × 3 ages)
- `output/sheets/` - Print sheets (9 cards per letter page)

## Prerequisites

- Node.js 18+
- The web server must have card artwork in `../web/static/cards/`

## Installation

```bash
cd print
npm install
```

This installs Playwright which is used to render the HTML card templates.

## Generating Print Assets

### Generate Everything

```bash
npm run generate
```

This generates all card types, tiles, boards, and assembles them into print sheets.

### Generate by Category

```bash
npm run generate cards    # All card types + card sheets
npm run generate boards   # Action board + player boards
npm run generate tiles    # Tech tiles + tile sheets
npm run generate sheets   # Rebuild sheets from existing PNGs
```

### Generate Specific Types

```bash
npm run generate agent       # Agent cards only
npm run generate hazard      # Hazard cards only
npm run generate tech        # Tech cards only
npm run generate mission     # Mission cards only
npm run generate playerboard # Player boards only
```

You can also run the generator directly:

```bash
node generate.js cards       # Same as npm run generate cards
node generate.js boards
node generate.js agent
```

## Output Files

### Individual Cards (`output/cards/`)

Each card is saved as a PNG at 750×1050 pixels (2.5" × 3.5" at 300 DPI):

```
output/cards/
├── agent/          # 31 agent cards
├── hazard/         # 27 hazard cards
├── tech/           # 41 tech cards
└── mission/        # 20 mission cards
```

### Print Sheets (`output/sheets/`)

Cards are arranged in a 3×3 grid on US Letter size pages:

```
output/sheets/
├── agent-sheet-1.png through agent-sheet-4.png
├── hazard-sheet-1.png through hazard-sheet-3.png
├── tech-sheet-1.png through tech-sheet-5.png
└── mission-sheet-1.png through mission-sheet-3.png
```

## Printing Instructions

### Home/Office Printing

1. Generate the cards: `npm run generate`
2. Open the sheet PNGs from `output/sheets/`
3. Print at **100% scale** (do not fit to page)
4. Use **cardstock** (110lb/300gsm recommended) for durability
5. Cut along card edges using a paper cutter or scissors
6. Sleeve the cards with standard poker-size sleeves (2.5" × 3.5")

### Print Settings

- **Paper size**: US Letter (8.5" × 11")
- **Scale**: 100% (actual size)
- **Quality**: High/Best
- **Color**: Full color

### Tips

- Print a test page first to verify alignment
- Use a paper cutter for clean, straight edges
- Card sleeves hide imperfect cuts and add durability
- For double-sided cards, ensure proper alignment before printing backs

## Running the Game Server

### Local Development

From the project root directory:

```bash
# Quick start (starts DB + runs migrations + starts server)
npm run dev:setup

# Or step by step:
npm run db:up            # Start PostgreSQL in Docker
npm run migrate:local    # Run database migrations
npm run dev:local        # Start server with hot reload
```

The game will be available at http://localhost:3000

### Railway Deployment

The game is deployed to Railway and auto-deploys from GitHub on push to main.

**Production URL**: https://upship-production.up.railway.app

#### Railway CLI Commands

```bash
# Check deployment status
python scripts/railway.py status

# View logs
python scripts/railway.py logs -n 100

# Trigger manual redeploy
python scripts/railway.py redeploy

# Set environment variable
python scripts/railway.py setvar KEY VALUE
```

#### Manual Deployment

1. Push changes to the `main` branch
2. Railway automatically builds and deploys
3. Check status at https://railway.com/ dashboard

## Customizing Cards

### Card Templates

HTML templates are in `templates/`:

- `agent-card.html` - Agent/market cards
- `hazard-card.html` - Hazard deck cards
- `tech-card.html` - Technology cards
- `mission-card.html` - Combat mission cards
- `styles.css` - Shared CSS styles

### Card Data

Card definitions are embedded in `generate.js`. To update card data, edit the arrays in the `loadCardData()` function. The data mirrors the server definitions in:

- `server/data/marketCards.ts` - Agent cards
- `server/data/upgrades.ts` - Tech cards
- `server/data/combatMissions.ts` - Mission cards
- `server/services/gameStateService.ts` - Hazard cards

### Card Artwork

Card images are loaded from `../web/static/cards/`:

```
web/static/cards/
├── agent/      # Agent card artwork
├── hazard/     # Hazard card artwork
├── tech/       # Tech card artwork
└── mission/    # Mission card artwork
```

## Physical Component Standards

When designing print boards, use these industry-standard sizes for wooden board game components:

### Wooden Cubes (resource markers)

| Size | Use Case | At 300 DPI | With 2mm Clearance |
|------|----------|------------|-------------------|
| 8mm | Small cubes (common for resources) | 94px | 118px slot |
| 10mm | Standard cubes (most Euro games) | 118px | 142px slot |
| 12mm | Large cubes | 142px | 165px slot |

### Wooden Meeples

| Size | Use Case | At 300 DPI |
|------|----------|------------|
| 16mm | Small meeples | 189px |
| 19mm | Standard meeples (worker placement) | 224px |
| 25mm | Large meeples | 295px |

### UP SHIP! Component Sizes

This game uses:
- **10mm cubes** for all resource tracking (stats, gas, income)
- **Standard meeples (19mm)** for ship tokens
- **Cube slots**: 12mm with clearance = 142px at 300 DPI
- **Ship storage slots**: 3cm × 2cm = 354px × 236px at 300 DPI

### Conversion Reference

At 300 DPI:
- 1 inch = 300px
- 1 cm = 118px
- 1 mm = 11.8px

## Troubleshooting

### "Cannot find module 'playwright'"

Run `npm install` in the print directory.

### Cards show broken images

Ensure the web static assets exist at `../web/static/cards/`. The generator loads images from there.

### Print sheets are blank

The sheet generator embeds card images as base64. Make sure individual cards were generated first (`output/cards/` should have PNG files).

### Cards cut off when printing

Ensure you're printing at 100% scale, not "fit to page". The sheets are designed for US Letter paper with minimal margins.
