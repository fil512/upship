# Generate Printable Map

Capture a game map from the browser and create a print-ready PDF that spans two 8.5x11" sheets with overlap for easy alignment.

Arguments: $ARGUMENTS

## Prerequisites

1. **Chrome DevTools MCP server must be connected** (chrome-devtools)
2. **ImageMagick and Ghostscript installed** (`brew install imagemagick ghostscript`)
3. **Local server running** with a game in the desired age

## Workflow

### Step 1: Parse Arguments

The argument should specify the age: `age1` or `age3` (Age 2 uses missions, not a map).

Default to `age1` if not specified.

### Step 2: Start Server and Create Game

```bash
# Ensure server is running
scripts/restart_server.sh

# Wait for health
for i in {1..15}; do
  if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "Server is healthy!"
    break
  fi
  sleep 1
done
```

### Step 3: Browser Setup

```
# Open browser to frontend
mcp__chrome-devtools__new_page url="http://localhost:5173/"

# Resize to capture map at high resolution (3840px wide)
mcp__chrome-devtools__resize_page width=3840 height=2160

# Login
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__fill uid="<username_uid>" value="playtest_bot"
mcp__chrome-devtools__fill uid="<password_uid>" value="test123456"
mcp__chrome-devtools__click uid="<login_button_uid>"
mcp__chrome-devtools__wait_for text="Create Game"
```

### Step 4: Create Game and Navigate to Map

```
# Create a new game
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__click uid="<create_game_button_uid>"
mcp__chrome-devtools__fill uid="<game_name_input_uid>" value="Map Capture"
mcp__chrome-devtools__click uid="<create_button_uid>"
mcp__chrome-devtools__wait_for text="Add Bot"

# Add bots to enable game start
mcp__chrome-devtools__take_snapshot
# Click Add Bot for 3 factions (skip one)
mcp__chrome-devtools__click uid="<add_bot_uid_1>"
mcp__chrome-devtools__click uid="<add_bot_uid_2>"
mcp__chrome-devtools__click uid="<add_bot_uid_3>"

# Start the game
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__click uid="<start_game_button_uid>"
mcp__chrome-devtools__wait_for text="Age"
```

### Step 5: Navigate to Correct Age (if needed)

For Age 3 maps, you may need to advance the game or use a test endpoint.

Alternatively, use JavaScript to render just the map:

```
# Evaluate script to get map SVG dimensions and expand it
mcp__chrome-devtools__evaluate_script function="() => {
  const mapSvg = document.querySelector('.game-map');
  if (mapSvg) {
    // Make map fill the viewport
    mapSvg.style.width = '100vw';
    mapSvg.style.height = '100vh';
    mapSvg.style.position = 'fixed';
    mapSvg.style.top = '0';
    mapSvg.style.left = '0';
    mapSvg.style.zIndex = '9999';
    return 'Map expanded';
  }
  return 'Map not found';
}"
```

### Step 6: Capture the Map

```
# Take a full-page screenshot of just the map
mcp__chrome-devtools__take_screenshot uid="<map_svg_uid>" filePath="print/output/maps/age{N}-map.png"

# Or use full page if map is expanded:
mcp__chrome-devtools__take_screenshot fullPage=true filePath="print/output/maps/age{N}-map.png"
```

### Step 7: Process the Image

After capturing, run these commands to split and create the PDF:

```bash
cd print/output/maps

# Get image dimensions
identify age{N}-map.png

# For a ~3840px wide image, split at midpoint with 150px (0.5") overlap
# Left piece: 0 to midpoint+150
# Right piece: midpoint-150 to end

WIDTH=$(identify -format "%w" age{N}-map.png)
HEIGHT=$(identify -format "%h" age{N}-map.png)
MIDPOINT=$((WIDTH / 2))
OVERLAP=150

# Create left half with overlap
magick age{N}-map.png -crop $((MIDPOINT + OVERLAP))x${HEIGHT}+0+0 +repage age{N}-map-left.png

# Create right half with overlap
magick age{N}-map.png -crop $((MIDPOINT + OVERLAP))x${HEIGHT}+$((MIDPOINT - OVERLAP))+0 +repage age{N}-map-right.png

# Create print-ready PDF (letter landscape: 11x8.5" = 3300x2550px at 300dpi)
magick age{N}-map-left.png -resize 3000x2400 -gravity center -extent 3300x2550 \
  -units PixelsPerInch -density 300 page1.pdf
magick age{N}-map-right.png -resize 3000x2400 -gravity center -extent 3300x2550 \
  -units PixelsPerInch -density 300 page2.pdf
magick page1.pdf page2.pdf age{N}-map-print.pdf
rm page1.pdf page2.pdf

echo "Created: age{N}-map-print.pdf"
```

## Output Files

After completion, you'll have:

```
print/output/maps/
  age{N}-map.png        # Original full capture
  age{N}-map-left.png   # Left half with overlap
  age{N}-map-right.png  # Right half with overlap
  age{N}-map-print.pdf  # 2-page print-ready PDF
```

## Printing Instructions

1. Open the PDF in Preview
2. Print both pages on 8.5x11" paper (landscape orientation is built-in)
3. The two halves overlap by 0.5" in the middle
4. Cut along one edge of the overlap on the right sheet
5. Align the matching imagery and tape from behind

## Map Dimensions Reference

| Age | SVG ViewBox | Typical Capture |
|-----|-------------|-----------------|
| 1   | 1200x680    | 3840x~1700      |
| 3   | 1420x800    | 3840x~1700      |

## Troubleshooting

**Map not visible:**
- Ensure the game has started and is in the correct age
- Check that the map tab/section is selected in the UI

**Wrong age displayed:**
- Age 2 shows missions instead of routes - no map to capture
- Use test/debug endpoints to force a specific age if available

**Image too small:**
- Increase browser window size before capture
- Use `resize_page` with larger dimensions (e.g., 4096x2160)

**PDF pages blank:**
- Ensure Ghostscript is installed: `brew install ghostscript`
- Check that ImageMagick can access the PNG files
