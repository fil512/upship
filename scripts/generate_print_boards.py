import os
import re

# Paths
DATA_DIR = 'server/data'
SPEC_PATH = 'spec/appendix.md'
PRINT_DIR = 'print'

CITY_COORDS_AGE1 = {
    'London': (25, 30), 'Dover': (30, 32), 'Calais': (32, 34),
    'Paris': (30, 50), 'Brussels': (38, 38), 'Amsterdam': (42, 28),
    'Cologne': (45, 40), 'Frankfurt': (50, 45), 'Hamburg': (50, 20),
    'Copenhagen': (55, 15), 'Berlin': (65, 30), 'Vienna': (70, 55),
    'Zurich': (50, 60), 'Milan': (52, 70), 'Marseille': (40, 75),
    'Barcelona': (30, 85), 'Rome': (60, 80), 'Friedrichshafen': (55, 62)
}

CITY_COORDS_AGE3 = {
    'New York': (15, 35), 'Lakehurst': (14, 37), 'Chicago': (10, 35),
    'Miami': (12, 55), 'Havana': (12, 60), 'Los Angeles': (5, 45),
    'San Francisco': (2, 40), 'Honolulu': (0, 55), 
    'London': (80, 25), 'Paris': (82, 30), 'Berlin': (90, 25),
    'Frankfurt': (88, 28), 'Friedrichshafen': (89, 32),
    'Oslo': (85, 15), 'Svalbard': (88, 5),
    'Rome': (90, 40), 'Cairo': (95, 50),
    'Rio de Janeiro': (35, 80), 'Recife': (40, 70), 'Manaus': (30, 70),
    'Buenos Aires': (30, 90), 'Valparaíso': (25, 90),
    'Bombay': (100, 60)
}

def parse_ts_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"//.*", "", content)
    match = re.search(r"export const \w+\s*(?::\s*[^=]+)?=\s*([\[{].*?[\]}]);", content, flags=re.DOTALL)
    if not match: return []
    data_str = match.group(1)
    data_str = data_str.replace("true", "True").replace("false", "False").replace("null", "None")
    data_str = re.sub(r"(\w+):", r"'\1':", data_str)
    try: return eval(data_str)
    except: return []

def parse_routes_from_spec():
    with open(SPEC_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    routes_age1, routes_age3 = [], []
    def parse_table(regex, text):
        res = []
        m = re.search(regex, text, flags=re.DOTALL)
        if m:
            lines = m.group(1).strip().split("\n")
            for l in lines:
                if l.strip().startswith("|") and not l.strip().startswith("|---") and "Route" not in l:
                    p = [i.strip() for i in l.strip().split("|")[1:-1]]
                    if len(p) >= 3: res.append(p)
        return res
    age1_raw = parse_table(r"## Age I Routes(.*?)(##|$)", content)
    for r in age1_raw: routes_age1.append({"name": r[0], "from": r[1], "to": r[2], "range": r[3], "speed": r[4], "income": r[6], "vp": r[7]})
    age3_raw = parse_table(r"## Age III Routes(.*?)(##|$)", content)
    for r in age3_raw: routes_age3.append({"name": r[0].replace("**", ""), "from": r[1], "to": r[2], "range": r[3], "speed": r[4], "ceiling": r[5], "luxury": r[6], "income": r[7], "vp": r[8]})
    return routes_age1, routes_age3

def get_icon_svg(name, color=None):
    try:
        path = "web/src/lib/icons/svg/{}.svg".format(name)
        if not os.path.exists(path): return "<span>[{}]</span>".format(name)
        with open(path, "r") as f:
            svg = f.read()
            svg = re.sub(r"<\?xml.*?\?>", "", svg)
            if color: svg = svg.replace("currentColor", color)
            svg = svg.replace("<svg", '<svg class="icon-svg" style="width:24px;height:24px;"')
            return svg
    except: return "<span>[{}]</span>".format(name)

def generate_map_svg(routes, coords, width_in=10, height_in=7):
    lines, texts, circles = [], [], []
    for r in routes:
        c1, c2 = coords.get(r["from"], (0,0)), coords.get(r["to"], (0,0))
        if c1 == (0,0) or c2 == (0,0): continue
        lines.append('<line x1="{}" y1="{}" x2="{}" y2="{}" stroke="#999" stroke-width="0.5" stroke-dasharray="1 0.5" />'.format(c1[0], c1[1], c2[0], c2[1]))
        mx, my = (c1[0]+c2[0])/2, (c1[1]+c2[1])/2
        texts.append('<text x="{}" y="{}" font-size="2" text-anchor="middle" fill="#333" style="font-family:sans-serif;">{}</text>'.format(mx, my, r["name"]))
    drawn = set()
    for r in routes:
        for city in [r["from"], r["to"]]:
            if city in drawn or city not in coords: continue
            drawn.add(city)
            x, y = coords[city]
            circles.append('<circle cx="{}" cy="{}" r="1" fill="#000" />'.format(x, y))
            circles.append('<text x="{}" y="{}" font-size="2.5" text-anchor="middle" font-weight="bold" fill="#000">{}</text>'.format(x, y-2, city))
    return '<svg width="{}in" height="{}in" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #333; background:#eef;">{}</svg>'.format(width_in, height_in, "".join(lines + texts + circles))

def generate_player_board_html():
    return """
    <div class="board player-board">
        <div class="pb-header">FACTION NAME</div>
        <div class="pb-grid">
            <div class="pb-drawing-office">
                <h3>Drawing Office</h3>
                <div class="track"><div class="track-label">Propulsion</div>{}</div>
                <div class="track"><div class="track-label">Structure</div>{}</div>
                <div class="track"><div class="track-label">Fabric</div>{}</div>
                <div class="track"><div class="track-label">Gas/Payload</div>{}</div>
            </div>
            <div class="pb-blueprint">
                <h3>Blueprint Overlay Socket</h3>
                <div style="border:2px dashed #ccc; height:3in; display:flex; align-items:center; justify-content:center; background: #f9f9f9;">{}</div>
            </div>
            <div class="pb-right">
                <div class="pb-stats">
                    <h3>Stats</h3>
                    <div class="stat-row">{} Lift / {} Weight</div>
                    <div class="stat-row">{} Speed</div>
                    <div class="stat-row">{} Range</div>
                    <div class="stat-row">{} Ceiling</div>
                    <div class="stat-row">{} Reliability</div>
                    <div class="stat-row">{} Luxury</div>
                </div>
                <div class="pb-economy">
                    <h3>Economy</h3>
                    <div class="stat-row">{} Income</div>
                </div>
            </div>
        </div>
        <div class="pb-barracks">
            <h3>Barracks</h3>
            <div style="display:flex; justify-content:space-around;">
                <div>{} Officers</div>
                <div>{} Engineers</div>
            </div>
        </div>
    </div>
    """.format(
        get_icon_svg("propeller"), get_icon_svg("blueprint"), get_icon_svg("luxury"), get_icon_svg("gas"),
        get_icon_svg("blueprint"), get_icon_svg("lift"), get_icon_svg("weight"), get_icon_svg("speed"),
        get_icon_svg("range"), get_icon_svg("ceiling"), get_icon_svg("reliability"), get_icon_svg("luxury"),
        get_icon_svg("income"), get_icon_svg("officers"), get_icon_svg("engineers")
    )

def generate_ground_board_html(locs_dict):
    locs = sorted(list(locs_dict.values()), key=lambda x: x["position"])
    items = []
    for l in locs:
        items.append('<div class="gb-location"><div class="gb-header">{}</div><div class="gb-icon">{}</div><div class="gb-body">{}</div></div>'.format(l["name"], get_icon_svg(l["symbol"]), l["description"]))
    return '<div class="board ground-board">' + "".join(items) + '</div>'

def main():
    print("Loading data for boards...")
    ground_locs = parse_ts_file(os.path.join(DATA_DIR, "groundBoard.ts"))
    routes_age1, routes_age3 = parse_routes_from_spec()
    css = "@page { size: 11in 17in; margin: 0.5in; } body { font-family: sans-serif; } .page-break { page-break-after: always; } .board { border: 4px solid #333; padding: 20px; box-sizing: border-box; background: #fdfbf7; } .ground-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; height: 10in; } .gb-location { border: 2px solid #666; padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center; background: white; border-radius: 8px; } .gb-header { font-weight: bold; margin-bottom: 10px; font-size: 14pt; font-family: serif; border-bottom: 1px solid #ccc; width: 100%; } .gb-icon { margin: 10px 0; transform: scale(2); } .gb-body { font-size: 10pt; } .player-board { height: 8in; width: 11in; display: flex; flex-direction: column; } .pb-header { font-size: 24pt; text-align: center; border-bottom: 2px solid #333; margin-bottom: 15px; } .pb-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 15px; flex-grow: 1; } .pb-drawing-office, .pb-blueprint, .pb-right { border: 2px solid #ccc; padding: 10px; background: white; border-radius: 5px; } .pb-barracks { border: 2px solid #ccc; margin-top: 15px; padding: 10px; height: 1.5in; background: white; border-radius: 5px; } h3 { margin-top: 0; border-bottom: 1px solid #eee; font-size: 12pt; text-align: center; color: #555; } .track { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 5px 0; } .stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }"
    html = '<!DOCTYPE html><html><head><title>Up Ship! Boards</title><style>{}</style></head><body><h1>Ground Board</h1>{}<div class="page-break"></div><h1>Player Board</h1><p><i>Print 4 copies.</i></p>{}<div class="page-break"></div><h1>Map: Age I</h1>{}<div class="page-break"></div><h1>Map: Age III</h1>{}</body></html>'.format(css, generate_ground_board_html(ground_locs), generate_player_board_html(), generate_map_svg(routes_age1, CITY_COORDS_AGE1, 10, 7), generate_map_svg(routes_age3, CITY_COORDS_AGE3, 10, 7))
    with open(os.path.join(PRINT_DIR, "print_boards.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Generated print/print_boards.html")

if __name__ == "__main__":
    main()