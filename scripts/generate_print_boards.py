import os
import re
import graphviz

# Paths
DATA_DIR = 'server/data'
SPEC_PATH = 'spec/appendix.md'
PRINT_DIR = 'print'

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

def parse_city_bonuses(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"//.*", "", content)
    match = re.search(r"export const CITY_BONUSES\s*:\s*Record<string, CityBonus>\s*=\s*({.*?});", content, flags=re.DOTALL)
    if not match: return {}
    data_str = match.group(1)
    data_str = data_str.replace("true", "True").replace("false", "False").replace("null", "None")
    data_str = re.sub(r"(\w+):", r"'\1':", data_str)
    # Remove trailing commas
    data_str = re.sub(r",\s*([\}\]])", r"\1", data_str)
    try:
        return eval(data_str)
    except Exception as e:
        print(f"Error parsing city bonuses: {e}")
        return {}

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

def generate_map_svg_with_graphviz(routes, city_bonuses):
    dot = graphviz.Graph('map', engine='dot')
    dot.attr('graph', rankdir='LR', splines='true', overlap='false', size="10,7!")
    dot.attr('node', shape='circle', style='filled', fillcolor='black', fontcolor='white', fontsize='10')
    dot.attr('edge', fontsize='8')

    cities = set()
    for r in routes:
        cities.add(r["from"])
        cities.add(r["to"])

    for city in cities:
        bonus_str = ""
        if city in city_bonuses and city_bonuses[city]:
            bonus = city_bonuses[city]
            if "cash" in bonus: bonus_str += f"£{bonus['cash']}"
            if "influence" in bonus: bonus_str += f"★{bonus['influence']}"
            if "research" in bonus: bonus_str += f"💡{bonus['research']}"
            if "officers" in bonus: bonus_str += f"O{bonus['officers']}"
            if "engineers" in bonus: bonus_str += f"E{bonus['engineers']}"
            if "hydrogen" in bonus: bonus_str += f"H{bonus['hydrogen']}"
            if "gasAny" in bonus: bonus_str += f"G{bonus['gasAny']}"
            if "freeUpgradeSwap" in bonus: bonus_str += "S"
            if "drawCard" in bonus: bonus_str += "🃏"
        
        dot.node(city, label=f"{city}\n{bonus_str.strip()}")

    for r in routes:
        dot.edge(r["from"], r["to"], label=r["name"])

    return dot.pipe(format='svg').decode('utf-8')

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
    city_bonuses = parse_city_bonuses(os.path.join(DATA_DIR, "cities.ts"))
    routes_age1, routes_age3 = parse_routes_from_spec()
    css = "@page { size: 11in 17in; margin: 0.5in; } body { font-family: sans-serif; } .page-break { page-break-after: always; } .board { border: 4px solid #333; padding: 20px; box-sizing: border-box; background: #fdfbf7; } .ground-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; height: 10in; } .gb-location { border: 2px solid #666; padding: 15px; display: flex; flex-direction: column; align-items: center; text-align: center; background: white; border-radius: 8px; } .gb-header { font-weight: bold; margin-bottom: 10px; font-size: 14pt; font-family: serif; border-bottom: 1px solid #ccc; width: 100%; } .gb-icon { margin: 10px 0; transform: scale(2); } .gb-body { font-size: 10pt; } .player-board { height: 8in; width: 11in; display: flex; flex-direction: column; } .pb-header { font-size: 24pt; text-align: center; border-bottom: 2px solid #333; margin-bottom: 15px; } .pb-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 15px; flex-grow: 1; } .pb-drawing-office, .pb-blueprint, .pb-right { border: 2px solid #ccc; padding: 10px; background: white; border-radius: 5px; } .pb-barracks { border: 2px solid #ccc; margin-top: 15px; padding: 10px; height: 1.5in; background: white; border-radius: 5px; } h3 { margin-top: 0; border-bottom: 1px solid #eee; font-size: 12pt; text-align: center; color: #555; } .track { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; padding: 5px 0; } .stat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }"
    html = '<!DOCTYPE html><html><head><title>Up Ship! Boards</title><style>{}</style></head><body><h1>Ground Board</h1>{}<div class="page-break"></div><h1>Player Board</h1><p><i>Print 4 copies.</i></p>{}<div class="page-break"></div><h1>Map: Age I</h1>{}<div class="page-break"></div><h1>Map: Age III</h1>{}</body></html>'.format(css, generate_ground_board_html(ground_locs), generate_player_board_html(), generate_map_svg_with_graphviz(routes_age1, city_bonuses), generate_map_svg_with_graphviz(routes_age3, city_bonuses))
    with open(os.path.join(PRINT_DIR, "print_boards.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Generated print/print_boards.html")

if __name__ == "__main__":
    main()