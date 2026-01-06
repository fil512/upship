import os
import re
import graphviz

# Paths
DATA_DIR = 'server/data'
SPEC_PATH = 'spec/appendix.md'
PRINT_DIR = 'print'

CITY_COORDS_AGE1 = {
    # Europe
    'London': "1,5!", 'Dover': "2,5!", 'Calais': "2.5,5!", 'Paris': "2,4!",
    'Brussels': "3,5.5!", 'Amsterdam': "3,6.5!", 'Cologne': "3.5,5!", 'Frankfurt': "4,4.8!",
    'Hamburg': "4,6.2!", 'Copenhagen': "4.5,6.8!", 'Berlin': "5,5.5!", 'Vienna': "6,4.5!",
    'Zurich': "4,4!", 'Milan': "4.5,3.5!", 'Marseille': "3,3!", 'Barcelona': "1.5,2.5!",
    'Rome': "5,2.5!", 'Friedrichshafen': "4.3,4.2!"
}

CITY_COORDS_AGE3 = {
    # Americas
    'New York': "2,6!", 'Lakehurst': "2.5,5.8!", 'Chicago': "1.5,6.2!", 'Miami': "2.8,4!",
    'Havana': "2.8,3.5!", 'Los Angeles': "0.5,5.5!", 'San Francisco': "0,6!", 'Honolulu': "-1,5!",
    # Europe & Africa
    'London': "6,6!", 'Paris': "6.2,5.5!", 'Berlin': "7.5,6!", 'Frankfurt': "7,5.8!",
    'Friedrichshafen': "7.2,5.2!", 'Oslo': "7,7!", 'Svalbard': "7.5,8!", 'Rome': "7.5,4!",
    'Cairo': "9,3!",
    # South America & Other
    'Rio de Janeiro': "4,1!", 'Recife': "4.5,0.5!", 'Manaus': "3.5,0.8!", 'Buenos Aires': "3,0!",
    'Valparaíso': "2.5,0!", 'Bombay': "11,4!"
}

def parse_ts_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.DOTALL)
    content = re.sub(r"//.*", "", content)
    match = re.search(r"export const \w+\s*(?:[:\s]*[^=]+)?=\s*([\\\[{].*?[\\]}]);", content, flags=re.DOTALL)
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
    data_str = re.sub(r"([\w\s'-]+):", r"'\1':", data_str)
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

def generate_map_svg_with_graphviz(routes, city_bonuses, coords):
    dot = graphviz.Graph('map', engine='neato')
    dot.attr('graph', rankdir='LR', splines='true', overlap='false', size="22,17!")
    dot.attr('node', shape='circle', style='filled', fillcolor='black', fontcolor='black', fontsize='10', fixedsize='true', width='1', height='1')
    dot.attr('edge', penwidth='2')

    cities = set()
    for r in routes:
        cities.add(r["from"])
        cities.add(r["to"])

    for city in cities:
        bonus_parts = []
        if city in city_bonuses and city_bonuses[city]:
            bonus = city_bonuses[city]
            if "cash" in bonus: bonus_parts.append(f'<FONT COLOR="#888888">£{bonus["cash"]}</FONT>')
            if "influence" in bonus: bonus_parts.append(f'<FONT COLOR="#888888">★{bonus["influence"]}</FONT>')
            if "research" in bonus: bonus_parts.append(f'<FONT COLOR="#888888">💡{bonus["research"]}</FONT>')
            if "officers" in bonus: bonus_parts.append(f'<FONT COLOR="#e0e0e0">O{bonus["officers"]}</FONT>')
            if "engineers" in bonus: bonus_parts.append(f'<FONT COLOR="#ffa726">E{bonus["engineers"]}</FONT>')
            if "hydrogen" in bonus: bonus_parts.append(f'<FONT COLOR="#f1c40f">H{bonus["hydrogen"]}</FONT>')
            if "gasAny" in bonus: bonus_parts.append(f'<FONT COLOR="#9ca3af">G{bonus["gasAny"]}</FONT>')
            if "freeUpgradeSwap" in bonus: bonus_parts.append(f'<FONT COLOR="#9ca3af">S</FONT>')
            if "drawCard" in bonus: bonus_parts.append(f'<FONT COLOR="#9ca3af">🃏</FONT>')
        bonus_str = " ".join(bonus_parts)
        
        if bonus_str.strip():
            label = f'<{city}<BR/><FONT POINT-SIZE="16">{bonus_str.strip()}</FONT>>'
        else:
            label = city
        pos = coords.get(city)
        dot.node(city, label=label, pos=pos)

    for r in routes:
        details = []
        if "income" in r:
            details.append(f"£{r['income']}")
        if "vp" in r:
            details.append(f"{r['vp']} VP")
        if "luxury" in r and r["luxury"]:
            details.append("Luxury")
        
        route_details = " | ".join(details)
        route_node_name = f"route_{r['name']}"
        
        # Calculate midpoint for the route node
        from_pos_str = coords.get(r["from"])
        to_pos_str = coords.get(r["to"])
        
        if from_pos_str and to_pos_str:
            from_x, from_y = [float(c.replace('!', '')) for c in from_pos_str.split(',')]
            to_x, to_y = [float(c.replace('!', '')) for c in to_pos_str.split(',')]
            mid_x = (from_x + to_x) / 2
            mid_y = (from_y + to_y) / 2
            
            dot.node(route_node_name, label=route_details, shape='oval', style='filled', fillcolor='white', fontcolor='black', pos=f"{mid_x},{mid_y}!")
        else:
            dot.node(route_node_name, label=route_details, shape='oval', style='filled', fillcolor='white', fontcolor='black')
            
        dot.edge(r["from"], r["to"], label=r["name"])

    return dot.pipe(format='svg').decode('utf-8')

def main():
    print("Loading data for boards...")
    city_bonuses = parse_city_bonuses(os.path.join(DATA_DIR, "cities.ts"))
    routes_age1, routes_age3 = parse_routes_from_spec()
    css = "@page { size: 22in 17in; margin: 0.5in; } body { font-family: sans-serif; } .page-break { page-break-after: always; }"

    # Generate Age I Map
    html_age1 = '<!DOCTYPE html><html><head><title>Up Ship! Map: Age I</title><style>{}</style></head><body><h1>Map: Age I</h1>{}</body></html>'.format(css, generate_map_svg_with_graphviz(routes_age1, city_bonuses, CITY_COORDS_AGE1))
    with open(os.path.join(PRINT_DIR, "print_map_age1.html"), "w", encoding="utf-8") as f:
        f.write(html_age1)
    print("Generated print/print_map_age1.html")

    # Generate Age III Map
    html_age3 = '<!DOCTYPE html><html><head><title>Up Ship! Map: Age III</title><style>{}</style></head><body><h1>Map: Age III</h1>{}</body></html>'.format(css, generate_map_svg_with_graphviz(routes_age3, city_bonuses, CITY_COORDS_AGE3))
    with open(os.path.join(PRINT_DIR, "print_map_age3.html"), "w", encoding="utf-8") as f:
        f.write(html_age3)
    print("Generated print/print_map_age3.html")

if __name__ == "__main__":
    main()
