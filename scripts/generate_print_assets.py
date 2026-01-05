import os
import re
import json

# Paths
DATA_DIR = 'server/data'
PRINT_DIR = 'print'

def parse_ts_file(file_path):
    """
    Parses a TypeScript file by converting JS object syntax to Python syntax and eval-ing.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove block comments /* ... */
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # 2. Remove line comments // ...
    content = re.sub(r'//.*', '', content)
    
    # 3. Extract the data structure
    # Array: export const NAME: Type[] = [...];
    # Object: export const NAME: Type = {...};
    match = re.search(r'export const \w+\s*(?::\s*[^=]+)?=\s*([\[{].*?[\]}]);', content, flags=re.DOTALL)
    
    if not match:
        print(f"No data found in {file_path}")
        return []
        
    data_str = match.group(1)
    
    # 4. Convert JS syntax to Python
    # Quote keys:  key: -> "key":
    # This regex looks for a word followed by a colon, but NOT inside quotes.
    # It's tricky. A simpler approach for these specific files:
    
    # Replace single quotes with double quotes (assuming no escaped single quotes inside strings for now)
    # But wait, Python accepts single quotes. Let's keep them.
    
    # Handle literals
    data_str = data_str.replace('true', 'True')
    data_str = data_str.replace('false', 'False')
    data_str = data_str.replace('null', 'None')
    
    # Quote keys. Keys are usually \w+ followed by :
    # We use a lambda to add quotes.
    data_str = re.sub(r'(\w+):', r'"\1":', data_str)
    
    # Remove type annotations if any slipped in (unlikely inside the value)
    
    try:
        # Use eval to parse as Python dict/list
        # We need to be careful about the "Any" key or similar that might have been quoted
        # "symbol": 'wrench' -> "symbol": 'wrench' (valid python)
        
        # Trailing commas are allowed in Python lists/dicts? Yes, usually.
        return eval(data_str)
    except Exception as e:
        print(f"Eval failed for {file_path}: {e}")
        # Debug: print snippet
        # print(data_str[:500])
        return []

def get_hazard_cards():
    """
    Returns hardcoded hazard card data based on Appendix D.
    """
    cards = []
    
    # Clear Weather (4)
    for _ in range(4):
        cards.append({'name': 'Clear Weather', 'type': 'weather', 'difficulty': 0, 'flak': 0, 'desc': 'Auto-pass.'})
        
    # Minor Hazards (8)
    minors = [
        {'name': 'Light Turbulence', 'type': 'weather', 'stat': 'Speed', 'difficulty': 2, 'flak': 0},
        {'name': 'Minor Engine Trouble', 'type': 'mechanical', 'stat': 'Reliability', 'difficulty': 2, 'flak': 1},
        {'name': 'Crosswind', 'type': 'weather', 'stat': 'Speed', 'difficulty': 3, 'flak': 0},
        {'name': 'Gas Leak', 'type': 'mechanical', 'stat': 'Reliability', 'difficulty': 3, 'flak': 1},
        {'name': 'Low Visibility', 'type': 'weather', 'stat': 'Ceiling', 'difficulty': 2, 'flak': 1},
        {'name': 'Fuel Concern', 'type': 'supply', 'stat': 'Range', 'difficulty': 3, 'flak': 0},
        {'name': 'Headwind', 'type': 'weather', 'stat': 'Speed', 'difficulty': 3, 'flak': 1},
        {'name': 'Structural Stress', 'type': 'mechanical', 'stat': 'Reliability', 'difficulty': 2, 'flak': 2},
    ]
    cards.extend(minors)
    
    # Major Hazards (8)
    majors = [
        {'name': 'Strong Headwind', 'type': 'weather', 'stat': 'Speed', 'difficulty': 4, 'flak': 2},
        {'name': 'Icing Conditions', 'type': 'weather', 'stat': 'Ceiling', 'difficulty': 4, 'flak': 2, 'special': 'Fail: Lose 1 Gas'},
        {'name': 'Engine Failure', 'type': 'mechanical', 'stat': 'Reliability', 'difficulty': 5, 'flak': 3},
        {'name': 'Storm System', 'type': 'weather', 'stat': 'Speed', 'difficulty': 5, 'flak': 3},
        {'name': 'Structural Damage', 'type': 'mechanical', 'stat': 'Reliability', 'difficulty': 4, 'flak': 4},
        {'name': 'Navigation Error', 'type': 'supply', 'stat': 'Range', 'difficulty': 4, 'flak': 3},
        {'name': 'Squall Line', 'type': 'weather', 'stat': 'Reliability', 'difficulty': 5, 'flak': 3, 'special': '+1 Diff if 3+ Payload'},
        {'name': 'Severe Icing', 'type': 'weather', 'stat': 'Ceiling', 'difficulty': 5, 'flak': 2, 'special': 'Fail: Lose 2 Gas'},
    ]
    cards.extend(majors)
    
    # Fire Hazards (6)
    fires = [
        {'name': 'Engine Fire', 'type': 'fire', 'flak': 2, 'desc': 'Spend 1 Engineer -> Damaged. Fail -> Crash.'},
        {'name': 'Engine Fire', 'type': 'fire', 'flak': 2, 'desc': 'Spend 1 Engineer -> Damaged. Fail -> Crash.'},
        {'name': 'Gas Cell Rupture', 'type': 'fire', 'flak': 3, 'desc': 'Spend 2 Engineers -> Damaged. Fail -> Crash.'},
        {'name': 'Gas Cell Rupture', 'type': 'fire', 'flak': 3, 'desc': 'Spend 2 Engineers -> Damaged. Fail -> Crash.'},
        {'name': 'Static Discharge', 'type': 'fire', 'flak': 4, 'desc': 'Diff 4 Reliability check. Fail -> Crash.'},
        {'name': 'Catastrophic Explosion', 'type': 'fire', 'flak': 5, 'desc': 'CRASH. Age III Luxury = Hindenburg.'},
    ]
    cards.extend(fires)
    
    # Mechanical (1)
    cards.append({'name': 'Critical Structural Stress', 'type': 'mechanical', 'flak': 4, 'desc': 'Spend 2 Engineers -> Damaged. Fail -> Crash.'})
    
    return cards

def generate_css():
    return """
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto+Slab:wght@300;400;700&display=swap');

    @page {
        size: letter;
        margin: 0.25in;
    }
    
    body {
        font-family: 'Roboto Slab', serif;
        background-color: white;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
    }

    .page-break {
        page-break-after: always;
    }
    
    h1 {
        font-family: 'Cinzel', serif;
        text-align: center;
        border-bottom: 2px solid #333;
        margin-bottom: 20px;
    }
    
    p { text-align: center; font-style: italic; }

    /* CARD STYLES (2.5 x 3.5 inches) */
    .card-sheet {
        display: flex;
        flex-wrap: wrap;
        gap: 2px; /* Minimal gap for cutting lines */
        justify-content: center;
        width: 100%;
    }

    .card {
        width: 2.5in;
        height: 3.5in;
        border: 1px dashed #ccc; /* Cutting guide */
        position: relative;
        overflow: hidden;
        background-color: #fdfbf7; /* Cream/Paper */
        box-sizing: border-box;
        padding: 0.15in;
        display: flex;
        flex-direction: column;
        margin: 2px;
    }

    .card-inner {
        border: 2px solid #003366; /* Blueprint Blue */
        border-radius: 0.1in;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding: 0.1in;
    }
    
    .card-header {
        font-family: 'Cinzel', serif;
        font-weight: 700;
        font-size: 10pt;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 0.05in;
        color: #003366;
        border-bottom: 1px solid #003366;
        padding-bottom: 0.05in;
        min-height: 0.3in;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .card-type {
        font-family: 'Playfair Display', serif;
        font-style: italic;
        font-size: 7pt;
        text-align: center;
        color: #666;
        margin-bottom: 0.1in;
    }

    .card-body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 9pt;
        line-height: 1.2;
    }

    .card-footer {
        margin-top: auto;
        border-top: 1px solid #003366;
        padding-top: 0.05in;
        display: flex;
        justify-content: space-around;
        font-size: 7pt;
    }

    /* SPECIFIC CARD TYPES */
    .market-card .cost-badge {
        position: absolute;
        top: 0.05in;
        right: 0.05in;
        background: #003366;
        color: white;
        width: 0.25in;
        height: 0.25in;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 10pt;
        z-index: 10;
        border: 2px solid #fff;
    }

    .mission-card { background-color: #f4f8fb; }
    .hazard-card { background-color: #fff5f5; }
    
    .hazard-card .card-inner { border-color: #8b0000; }
    .hazard-card .card-header { color: #8b0000; border-bottom-color: #8b0000; }

    /* ICONS */
    .icon-svg {
        width: 20px;
        height: 20px;
        display: inline-block;
        vertical-align: middle;
    }
    
    /* TECH TILES (Square ~1.5 inch) */
    .tile-sheet {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        justify-content: center;
    }
    
    .tile {
        width: 1.5in;
        height: 1.5in;
        border: 1px dashed #999;
        background: #e6e6e6;
        padding: 5px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        font-size: 7pt;
        text-align: center;
        position: relative;
    }
    
    .tile-inner {
        border: 2px solid #333;
        width: 100%;
        height: 100%;
        border-radius: 4px;
        box-sizing: border-box;
        padding: 2px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: white;
    }
    
    .tile.propulsion .tile-inner { border-color: #1976d2; background: #e3f2fd; }
    .tile.frame .tile-inner { border-color: #5d4037; background: #efebe9; }
    .tile.fabric .tile-inner { border-color: #7b1fa2; background: #f3e5f5; }
    .tile.gas .tile-inner { border-color: #fbc02d; background: #fffde7; }
    .tile.payload .tile-inner { border-color: #388e3c; background: #e8f5e9; }

    .tile-name {
        font-weight: bold;
        font-size: 8pt;
        line-height: 1;
        margin-top: 2px;
    }
    
    .tile-stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2px;
    }
    
    .stat-badge {
        background: rgba(255,255,255,0.7);
        border: 1px solid #666;
        border-radius: 2px;
        padding: 1px 2px;
        font-size: 6pt;
        font-weight: bold;
    }
    """

def get_icon_svg(name, color=None):
    try:
        path = f"web/src/lib/icons/svg/{name}.svg"
        if not os.path.exists(path):
            return f'<span style="font-size:8px;">[{name}]</span>'
            
        with open(path, 'r') as f:
            svg = f.read()
            # Basic cleanup to remove XML declaration if present
            svg = re.sub(r'<\?xml.*?\?>', '', svg)
            if color:
                svg = svg.replace('currentColor', color)
            # Add class
            svg = svg.replace('<svg', '<svg class="icon-svg"')
            return svg
    except:
        return f'<span>[{name}]</span>'

def generate_market_cards_html(cards):
    html = '<div class="card-sheet">'
    for card in cards:
        category_map = {
            'technical': 'Technical Personnel',
            'political': 'Political/Financial',
            'research': 'Research Personnel',
            'organizations': 'Organization'
        }
        
        symbol_icon = card.get('symbol', 'any')
        
        reveal_html = []
        if 'reveal' in card:
            for k, v in card['reveal'].items():
                icon = k
                if k == 'cash': icon = 'cash' 
                reveal_html.append(f'<div style="display:flex;align-items:center;">{get_icon_svg(icon)} <span style="font-weight:bold;margin-left:2px;">{v}</span></div>')

        html += f"""
        <div class="card market-card">
            <div class="cost-badge">{card.get('cost', 0)}</div>
            <div class="card-inner">
                <div class="card-header">{card.get('name', 'Unknown')}</div>
                <div class="card-type">{category_map.get(card.get('category'), 'Personnel')}</div>
                
                <div class="card-body">
                    <div style="margin-bottom: 0.1in; transform: scale(1.5);">{get_icon_svg(symbol_icon)}</div>
                    <div style="font-style: italic;">{card.get('effect') or 'No Effect'}</div>
                </div>
                
                <div class="card-footer">
                    <div style="font-weight:bold; margin-right:5px; font-size:6pt; align-self:center;">REVEAL:</div>
                    <div style="display:flex; gap:5px; align-items:center;">
                        {''.join(reveal_html)}
                    </div>
                </div>
            </div>
        </div>
        """
    html += '</div>'
    return html

def generate_hazard_cards_html(cards):
    html = '<div class="card-sheet">'
    for card in cards:
        html += f"""
        <div class="card hazard-card">
            <div class="card-inner">
                <div class="card-header">{card.get('name')}</div>
                <div class="card-type">{card.get('type').upper()}</div>
                
                <div class="card-body">
                    {f'<div style="font-size:14pt; font-weight:bold; margin-bottom:5px;">Difficulty {card.get("difficulty")}</div>' if "difficulty" in card else '<div style="font-size:14pt; font-weight:bold; margin-bottom:5px;">AUTO-PASS</div>'}
                    {f'<div>Test: <b>{card.get("stat")}</b></div>' if "stat" in card else ''}
                    <div style="margin-top:10px; font-size:8pt;">{card.get('special') or card.get('desc') or ''}</div>
                </div>
                
                <div class="card-footer">
                    <div style="font-weight:bold;">FLAK: {card.get('flak', 0)}</div>
                </div>
            </div>
        </div>
        """
    html += '</div>'
    return html

def generate_mission_cards_html(cards):
    html = '<div class="card-sheet">'
    for card in cards:
        # Requirements
        reqs = []
        if 'range' in card: reqs.append(f"Range {card['range']}")
        if 'speed' in card: reqs.append(f"Speed {card['speed']}")
        if 'ceiling' in card: reqs.append(f"Ceiling {card['ceiling']}")
        if 'reliability' in card: reqs.append(f"Reliability {card['reliability']}")
        
        req_html = ", ".join(reqs)
        
        html += f"""
        <div class="card mission-card">
            <div class="card-inner">
                <div class="card-header">{card.get('name')}</div>
                <div class="card-type">{card.get('type').replace('_', ' ').title()}</div>
                
                <div class="card-body">
                    <div style="font-size: 8pt; border-bottom: 1px solid #ccc; width: 100%; margin-bottom: 5px; padding-bottom: 5px;">
                        <b>REQUIREMENTS</b><br>
                        {req_html}
                    </div>
                    <div style="font-size: 9pt;">
                        <b>REWARDS</b><br>
                        Income: £{card.get('income', 0)}<br>
                        VP: {card.get('vp', 0)}
                        {f'<br><span style="color:#003366; font-size:8pt;">{card.get("specialBonus", {}).get("description", "")}</span>' if card.get('specialBonus') else ''}
                        {f'<br><span style="color:#003366; font-size:8pt;">{card.get("special") if isinstance(card.get("special"), str) else ""}</span>' if card.get("special") and isinstance(card.get("special"), str) else ''}
                    </div>
                </div>
            </div>
        </div>
        """
    html += '</div>'
    return html

def generate_tech_tiles_html(tiles_dict):
    html = '<div class="tile-sheet">'
    
    # Convert dict to list and sort by type
    tiles = list(tiles_dict.values())
    tiles.sort(key=lambda x: (x.get('type', 'component'), x.get('age', 1)))
    
    for tile in tiles:
        t_type = tile.get('type', 'component')
        stats = tile.get('stats', {})
        stats_html = []
        for k, v in stats.items():
            icon = k
            if k == 'lift': icon = 'lift' # we have lift.svg
            elif k == 'income': icon = 'income'
            elif k == 'luxury': icon = 'luxury'
            
            stats_html.append(f'<div class="stat-badge" title="{k}">{k[:1].upper()}{k[1:]}:{v}</div>')
        
        weight = tile.get('weight', 0)
        weight_html = f'<div style="font-weight:bold; color: #d32f2f; font-size:7pt;">Weight: {abs(weight)}</div>' if weight != 0 else ''
        
        html += f"""
        <div class="tile {t_type}">
            <div class="tile-inner">
                <div style="font-size:6pt; text-transform:uppercase; color:#666;">{t_type}</div>
                <div class="tile-name">{tile.get('name')}</div>
                <div class="tile-stats">
                    {''.join(stats_html)}
                </div>
                {weight_html}
                <div style="font-size:6pt; font-style:italic; line-height:1; overflow:hidden;">
                    {tile.get('special') or ''}
                </div>
                <div style="font-size:6pt; margin-top:2px;">Age {tile.get('age')}</div>
            </div>
        </div>
        """
    html += '</div>'
    return html

def main():
    # 1. Load Data
    print("Loading data...")
    market_cards = parse_ts_file(os.path.join(DATA_DIR, 'marketCards.ts'))
    mission_cards = parse_ts_file(os.path.join(DATA_DIR, 'combatMissions.ts'))
    
    # Tech tiles is an object, convert to list of values for consistent processing if needed
    # parse_ts_file returns the dict for tech tiles
    tech_tiles = parse_ts_file(os.path.join(DATA_DIR, 'upgrades.ts'))
    
    hazard_cards = get_hazard_cards()
    
    print(f"Loaded {len(market_cards)} Market Cards")
    print(f"Loaded {len(mission_cards)} Combat Missions")
    print(f"Loaded {len(tech_tiles)} Tech Tiles")
    print(f"Generated {len(hazard_cards)} Hazard Cards")

    # 2. Generate HTML
    css = generate_css()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Up Ship! Print Assets</title>
        <style>{css}</style>
    </head>
    <body>
        <h1>Market Cards (Agent Deck)</h1>
        <p>30 Cards</p>
        {generate_market_cards_html(market_cards)}
        
        <div class="page-break"></div>
        <h1>Combat Missions (Age II)</h1>
        <p>20 Cards</p>
        {generate_mission_cards_html(mission_cards)}
        
        <div class="page-break"></div>
        <h1>Hazard Deck (Player Personal Deck)</h1>
        <p><i>Print 4 copies of this set (one per player). 27 Cards per deck.</i></p>
        {generate_hazard_cards_html(hazard_cards)}
        
        <div class="page-break"></div>
        <h1>Tech Tiles</h1>
        <p><i>Print multiple copies as per rules (N-1 per player count).</i></p>
        {generate_tech_tiles_html(tech_tiles)}
    </body>
    </html>
    """
    
    # 3. Write Output
    output_path = os.path.join(PRINT_DIR, 'print_assets.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully generated {output_path}")

if __name__ == '__main__':
    main()