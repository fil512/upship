import os
import re
import math
from PIL import Image, ImageDraw, ImageFont, ImageOps

# SVG Rendering
try:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPM
    HAS_SVG = True
except ImportError:
    HAS_SVG = False
    print("Warning: svglib not found. Icons will be placeholders.")

# --- CONSTANTS & CONFIG ---
DATA_DIR = 'server/data'
PRINT_DIR = 'print'
CARD_WIDTH_PX = 750   # 2.5 inches at 300 DPI
CARD_HEIGHT_PX = 1050 # 3.5 inches at 300 DPI
DPI = 300

# Directory for generated card images
CARDS_OUT_DIR = os.path.join(PRINT_DIR, 'generated_cards')
if not os.path.exists(CARDS_OUT_DIR):
    os.makedirs(CARDS_OUT_DIR)

# Paths to artwork
AGENT_ART_DIR = 'print/cards/agent'
TECH_ART_DIR = 'print/cards/tech'
STARTER_ART_DIR = 'print/cards/starter_deck'
ICON_DIR = 'web/src/lib/icons/svg'

# Colors
COLOR_CREAM = (253, 251, 247)
COLOR_BLUEPRINT = (0, 51, 102)     # #003366
COLOR_DARK_TEXT = (26, 26, 26)     # #1a1a1a
COLOR_RED = (139, 0, 0)            # #8b0000
COLOR_GOLD = (218, 165, 32)        # Goldenrod

# Fonts
try:
    FONT_TITLE = ImageFont.truetype("Arial.ttf", 50)
    FONT_BODY = ImageFont.truetype("Times New Roman.ttf", 36)
    FONT_SMALL = ImageFont.truetype("Arial.ttf", 28)
    FONT_BOLD = ImageFont.truetype("Arial Bold.ttf", 36)
except IOError:
    FONT_TITLE = ImageFont.load_default()
    FONT_BODY = ImageFont.load_default()
    FONT_SMALL = ImageFont.load_default()
    FONT_BOLD = ImageFont.load_default()

# --- MAPPINGS ---

TECH_CARD_TO_IMAGE = {
    'Daimler Engine': 'basic_engine',
    'Daimler Petrol Engine': 'basic_engine',
    'Improved Propeller': 'improved_propeller',
    'Dual Engine Mount': 'twin_engine',
    'Maybach Engine': 'maybach_cx_engine',
    'Maybach Engine Design': 'maybach_cx_engine',
    'Diesel Powerplant': 'diesel_engine',
    'Swiveling Propeller': 'vectored_thrust',
    'Contra-Rotating Props': 'balanced_propulsion',
    'Streamlined Nacelle': 'aerodynamic_engine',
    'Supercharged Engine': 'high_altitude_engine',
    'Diesel-Electric Drive': 'hybrid_powerplant',
    'Variable-Pitch Propeller': 'adaptive_propeller',
    'Zeppelin Girders': 'zeppelin_girders',
    'Standard Propeller': 'standard_propeller',
    'Basic Powerplant': 'basic_powerplant',
    'Trapeze Fighter System': 'trapeze_fighter_system',
    'Expedition Propeller': 'expedition_propeller',
    'Wooden Framework': 'wooden_frame',
    'Wire Bracing': 'tensioned_frame',
    'Duralumin Framework': 'duralumin_frame',
    'Steel Framework': 'steel_frame',
    'Internal Keel': 'semi_rigid_keel',
    'Geodetic Structure': 'geodetic_structure', 
    'Modular Construction': 'modular_frame',
    'Articulated Keel Design': 'flexible_frame',
    'Aerodynamic Hull Design': 'streamlined_hull',
    'Dynamic Lift Surfaces': 'aerodynamic_lift_system',
    'Rubberized Cotton': 'cotton_envelope',
    'Doped Canvas': 'doped_covering',
    "Goldbeater's Skin": 'goldbeaters_skin',
    'Fireproof Coating': 'fire_resistant_fabric',
    'Aluminum Doping': 'reflective_covering',
    'Grounding Systems': 'conductive_covering',
    'Gelatinized Latex': 'synthetic_envelope',
    'Composite Covering': 'advanced_fabric',
    'Improved Valving': 'pressure_control',
    'Manual Ballonets': 'altitude_ballonets',
    'Multiple Gas Cells': 'compartmented_gas',
    'Helium Handling': 'helium_gas_cell',
    'Blaugas Fuel System': 'blaugas_tank',
    'Automatic Valves': 'automatic_valves',
    'Pressure Altitude System': 'high_ceiling_gas',
    'Triple Gas Cell': 'redundant_cells',
    'Emergency Venting': 'rapid_descent_system',
    'Gas Recovery': 'reclamation_system',
    'Water Recovery System': 'exhaust_condensers',
    'Observation Platform': 'spotter_gondola',
    'Mail Compartment': 'postal_service',
    'Cargo Nets': 'external_cargo',
    'Passenger Gondola': 'basic_cabin',
    'Passenger Accommodation': 'passenger_cabin',
    'Bomb Bay Design': 'bombing_equipment',
    'Trapeze System': 'sparrowhawk_hangar',
    'Radio Equipment': 'communications_suite',
    'Armored Gondola': 'light_armor_plating',
    'Reinforced Hull': 'heavy_armor_plating',
    'Luxury Accommodation': 'luxury_cabin',
    'Dining Saloon': 'dining_saloon',
    'Promenade Deck': 'observation_lounge',
    'Sleeping Quarters': 'private_berths',
    'Smoking Room': 'pressurized_lounge',
    'Imperial Mooring System': 'imperial_mast',
    'Advanced Navigation': 'advanced_navigation',
    'Rigid Frame': 'rigid_frame',
    'Rapid Refit': 'rapid_refit',
    'Observation Deck (Legacy)': 'spotter_gondola',
    'Cargo Systems (Legacy)': 'external_cargo',
    'Luxury Fittings (Legacy)': 'luxury_cabin',
    'Mail Systems (Legacy)': 'postal_service',
    'Pressurization (Legacy)': 'pressurized_lounge'
}

# --- UTILS ---

def parse_ts_variable(content, var_name):
    # Matches export const VAR_NAME = ...; or export const VAR_NAME: Type = ...;
    # It handles both [ ... ] and { ... }
    pattern = fr'export const {var_name}\s*(?::\s*[^=]+)?=\s*([\[{{].*?[\]}}]);'
    match = re.search(pattern, content, flags=re.DOTALL)
    if not match: return None
    data_str = match.group(1).replace('true', 'True').replace('false', 'False').replace('null', 'None')
    # Quote keys: key: -> "key": but try to avoid matching inside strings by ensuring it's at start of line or after { or ,
    data_str = re.sub(r'(?<={|,|\n)\s*(\w+):', r' "\1":', data_str)
    try: return eval(data_str)
    except Exception as e:
        print(f"Error evaluating {var_name}: {e}")
        return None

def load_data():
    market_path = os.path.join(DATA_DIR, 'marketCards.ts')
    with open(market_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    market = parse_ts_variable(content, 'MARKET_CARDS') or []
    reserve = parse_ts_variable(content, 'RESERVE_CARD')
    if reserve: market.append(reserve)

    upgrades_path = os.path.join(DATA_DIR, 'upgrades.ts')
    with open(upgrades_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    tiles = parse_ts_variable(content, 'TECH_TILES') or {}
    cards = parse_ts_variable(content, 'TECH_CARDS') or {}

    return market, tiles, cards

def load_svg_icon(icon_name, size, color=None):
    if not HAS_SVG: return None
    svg_path = os.path.join(ICON_DIR, f"{icon_name}.svg")
    if not os.path.exists(svg_path): return None
    try:
        drawing = svg2rlg(svg_path)
        scale = min(size / drawing.width, size / drawing.height)
        drawing.scale(scale, scale)
        drawing.width = size
        drawing.height = size
        img = renderPM.drawToPIL(drawing, bg=0xffffffff)
        img = img.convert("L")
        mask = ImageOps.invert(img)
        mask = mask.point(lambda p: 255 if p > 50 else 0)
        if color:
            color_img = Image.new('RGBA', (size, size), color)
            final_img = Image.new('RGBA', (size, size), (0,0,0,0))
            final_img.paste(color_img, (0,0), mask)
            return final_img
        else:
            black_img = Image.new('RGBA', (size, size), (0,0,0,255))
            final_img = Image.new('RGBA', (size, size), (0,0,0,0))
            final_img.paste(black_img, (0,0), mask)
            return final_img
    except: return None

def draw_icon_circle(draw, img, x, y, size, color, text=None, icon_name=None):
    draw.ellipse([x, y, x+size, y+size], fill=color, outline=COLOR_DARK_TEXT, width=2)
    icon_drawn = False
    if icon_name:
        icon_size = int(size * 0.7)
        icon_offset = (size - icon_size) // 2
        icon_color = (255, 255, 255, 255) if color != COLOR_GOLD else (0, 0, 0, 255)
        icon_img = load_svg_icon(icon_name, icon_size, color=icon_color)
        if icon_img:
            img.paste(icon_img, (int(x + icon_offset), int(y + icon_offset)), icon_img)
            icon_drawn = True
    if not icon_drawn and (text or icon_name):
        display = text if text else icon_name[:1].upper()
        bbox = draw.textbbox((0, 0), display, font=FONT_SMALL)
        draw.text((x + (size - (bbox[2]-bbox[0]))/2, y + (size - (bbox[3]-bbox[1]))/2 - 4), display, font=FONT_SMALL, fill='white' if color != COLOR_GOLD else 'black')

def get_art_image(card_id, category):
    filename = f"{card_id}.png"
    starter_filename = f"starter_{card_id}.png"
    paths = [
        os.path.join(AGENT_ART_DIR, filename),
        os.path.join(STARTER_ART_DIR, filename),
        os.path.join(STARTER_ART_DIR, starter_filename)
    ] if category == 'agent' else [os.path.join(TECH_ART_DIR, filename)]
    for p in paths:
        if os.path.exists(p): return Image.open(p)
    return None

def get_tech_image_name(card_name):
    if card_name in TECH_CARD_TO_IMAGE: return TECH_CARD_TO_IMAGE[card_name]
    return card_name.lower().replace("'", "").replace(" ", "_")

# --- CARD RENDERERS ---

def create_agent_card(data):
    img = Image.new('RGB', (CARD_WIDTH_PX, CARD_HEIGHT_PX), COLOR_CREAM)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, CARD_WIDTH_PX-20, CARD_HEIGHT_PX-20], outline=COLOR_BLUEPRINT, width=5)
    header_h = 120
    draw.line([20, header_h, CARD_WIDTH_PX-20, header_h], fill=COLOR_BLUEPRINT, width=3)
    name = data.get('name', 'Agent')
    font_size = 50; font = FONT_TITLE
    while True:
        if draw.textbbox((0, 0), name, font=font)[2] < (CARD_WIDTH_PX - 180) or font_size < 20: break
        font_size -= 2; font = ImageFont.truetype("Arial.ttf", font_size)
    bbox = draw.textbbox((0, 0), name, font=font)
    draw.text(((CARD_WIDTH_PX - (bbox[2]-bbox[0])) / 2, (header_h - font_size)/2 + 10), name, font=font, fill=COLOR_BLUEPRINT)
    draw_icon_circle(draw, img, CARD_WIDTH_PX-90, 30, 60, COLOR_BLUEPRINT, text=str(data.get('cost', 0)))
    symbol = data.get('symbol', 'any')
    draw_icon_circle(draw, img, 30, 30, 60, COLOR_GOLD if symbol == 'coin' else COLOR_BLUEPRINT, icon_name=symbol)
    art_y, art_h, art_w, art_x = header_h+10, 550, CARD_WIDTH_PX-60, 30
    card_id = name.lower().replace(' ', '_').replace("'", "")
    art_img = get_art_image(card_id, 'agent')
    if art_img:
        art_img = art_img.convert('RGB'); img_ratio = art_img.width / art_img.height
        if img_ratio > (art_w/art_h):
            nh = art_h; nw = int(nh * img_ratio); art_img = art_img.resize((nw, nh), Image.LANCZOS)
            art_img = art_img.crop(((nw-art_w)//2, 0, (nw-art_w)//2+art_w, nh))
        else:
            nw = art_w; nh = int(nw / img_ratio); art_img = art_img.resize((nw, nh), Image.LANCZOS)
            art_img = art_img.crop((0, (nh-art_h)//2, nw, (nh-art_h)//2+art_h))
        img.paste(art_img, (art_x, art_y))
        draw.rectangle([art_x, art_y, art_x+art_w, art_y+art_h], outline=COLOR_BLUEPRINT, width=2)
    else: draw.rectangle([art_x, art_y, art_x+art_w, art_y+art_h], fill='#ddd', outline=COLOR_BLUEPRINT, width=1)
    body_y = art_y + art_h + 20; effect = data.get('effect', '')
    if effect:
        words = effect.split(); lines = []; line = ""
        for word in words:
            if draw.textbbox((0, 0), line+word+" ", font=FONT_BODY)[2] < (art_w-20): line += word+" "
            else: lines.append(line); line = word+" "
        lines.append(line); y_off = body_y
        for l in lines:
            w = draw.textbbox((0, 0), l, font=FONT_BODY)[2]
            draw.text(((CARD_WIDTH_PX-w)/2, y_off), l, font=FONT_BODY, fill=COLOR_DARK_TEXT); y_off += 40
    footer_y = CARD_HEIGHT_PX - 100
    draw.line([20, footer_y, CARD_WIDTH_PX-20, footer_y], fill=COLOR_BLUEPRINT, width=2)
    draw.text((40, footer_y+30), "REVEAL:", font=FONT_SMALL, fill=COLOR_DARK_TEXT)
    icon_x = 170
    for k, v in data.get('reveal', {}).items():
        if isinstance(v, (int, float)) and v > 0:
            svg = 'cash' if k == 'cash' else k
            col = COLOR_GOLD if k in ['cash', 'influence'] else COLOR_BLUEPRINT
            for _ in range(int(v)): draw_icon_circle(draw, img, icon_x, footer_y+15, 50, col, icon_name=svg); icon_x += 60
    return img

def create_tech_card(card_data, tile_data):
    img = Image.new('RGB', (CARD_WIDTH_PX, CARD_HEIGHT_PX), (240, 235, 225))
    draw = ImageDraw.Draw(img)
    header_h, header_bg = 140, (44, 62, 80)
    draw.rectangle([0, 0, CARD_WIDTH_PX, header_h], fill=header_bg)
    name = card_data.get('name', 'Tech')
    font_sz = 55; font = FONT_BOLD
    while True:
        if draw.textbbox((0, 0), name, font=font)[2] < (CARD_WIDTH_PX - 180) or font_sz < 20: break
        font_sz -= 2; font = ImageFont.truetype("Arial Bold.ttf", font_sz)
    bbox = draw.textbbox((0, 0), name, font=font)
    draw.text(((CARD_WIDTH_PX-bbox[2])/2, (header_h-bbox[3])/2-10), name, font=font, fill='white')
    badge_x, badge_y, b_sz = CARD_WIDTH_PX-100, 30, 80
    draw.rounded_rectangle([badge_x, badge_y, badge_x+b_sz, badge_y+b_sz], radius=10, fill=(149, 165, 166), outline='white', width=2)
    c_val = str(card_data.get('researchCost', card_data.get('cost', 0)))
    c_bbox = draw.textbbox((0, 0), c_val, font=FONT_BOLD)
    draw.text((badge_x+(b_sz-c_bbox[2])/2, badge_y+(b_sz-c_bbox[3])/2-5), c_val, font=FONT_BOLD, fill='white')
    art_y, tile_h, art_x, art_w = header_h, 280, 20, CARD_WIDTH_PX-40
    art_h = CARD_HEIGHT_PX - header_h - tile_h - 20
    draw.rectangle([art_x-2, art_y+10-2, art_x+art_w+2, art_y+art_h+2], outline=(100,100,100), width=1)
    img_name = get_tech_image_name(name); art_img = get_art_image(img_name, 'tech')
    if art_img:
        art_img = art_img.convert('RGB'); img_ratio = art_img.width/art_img.height
        if img_ratio > (art_w/art_h):
            nh = art_h; nw = int(nh*img_ratio); art_img = art_img.resize((nw, nh), Image.LANCZOS); art_img = art_img.crop(((nw-art_w)//2, 0, (nw-art_w)//2+art_w, nh))
        else:
            nw = art_w; nh = int(nw/img_ratio); art_img = art_img.resize((nw, nh), Image.LANCZOS); art_img = art_img.crop((0, (nh-art_h)//2, nw, (nh-art_h)//2+art_h))
        img.paste(art_img, (art_x, art_y+10))
        age = str(card_data.get('age', 1)); aw, ah = 120, 40; ax, ay = art_x+art_w-aw, art_y+art_h-ah
        img.paste(Image.new('RGBA', (aw, ah), (255, 255, 255, 180)), (ax, ay), Image.new('RGBA', (aw, ah), (255, 255, 255, 180)))
        draw.text((ax+10, ay+5), f"AGE {age}", font=FONT_SMALL, fill=(100,100,100))
    else: draw.text((art_x+50, art_y+100), f"Missing Art:\n{img_name}", font=FONT_BODY, fill='red')
    tile_y_start = CARD_HEIGHT_PX - tile_h - 20; t_type = tile_data.get('type', 'component') if tile_data else 'component'
    type_cols = {'drive':(160,82,45), 'component':(39,174,96), 'gas':(22,160,133), 'frame':(127,140,141), 'structure':(127,140,141), 'fabric':(142,68,173), 'special':(41,128,185)}
    tile_rect = [art_x+20, tile_y_start, art_x+art_w-20, CARD_HEIGHT_PX-20]
    draw.rounded_rectangle(tile_rect, radius=15, fill=type_cols.get(t_type,(100,100,100)), outline=COLOR_GOLD, width=4)
    tile_name = tile_data.get('name', 'Upgrade') if tile_data else "Upgrade"
    t_bbox = draw.textbbox((0, 0), tile_name, font=FONT_BOLD)
    draw.text((tile_rect[0]+(tile_rect[2]-tile_rect[0]-(t_bbox[2]-t_bbox[0]))/2, tile_rect[3]-60), tile_name, font=FONT_BOLD, fill='white')
    if tile_data:
        stats = {k:v for k,v in tile_data.get('stats', {}).items() if v > 0}
        if stats:
            isz = 100; total_w = (len(stats)*isz) + ((len(stats)-1)*40); curr_x = tile_rect[0]+(tile_rect[2]-tile_rect[0]-total_w)/2
            for k, v in stats.items():
                icon = load_svg_icon('lift' if k=='lift' else k, isz, color=(255,255,255,255))
                if icon:
                    img.paste(icon, (int(curr_x), int(tile_y_start+50)), icon)
                    if v > 1: draw.text((curr_x+isz+5, tile_y_start+70), f"+{v}", font=FONT_BOLD, fill='white'); curr_x += 40
                    curr_x += isz+40
                else: draw.text((curr_x, tile_y_start+70), k[:2].upper(), font=FONT_BOLD, fill='white'); curr_x += isz+40
    return img

def create_printable_sheets(images, prefix):
    SW, SH = 2480, 3508; R, C = 3, 3; CPP = R*C
    for i in range(math.ceil(len(images)/CPP)):
        sheet = Image.new('RGB', (SW, SH), 'white'); start = i*CPP; mx = (SW-(C*CARD_WIDTH_PX))//2; my = (SH-(R*CARD_HEIGHT_PX))//2
        for j in range(start, min(start+CPP, len(images))):
            img = images[j].resize((CARD_WIDTH_PX, CARD_HEIGHT_PX), Image.LANCZOS)
            sheet.paste(img, (mx+((j-start)%C)*CARD_WIDTH_PX, my+((j-start)//C)*CARD_HEIGHT_PX))
        sheet.save(os.path.join(PRINT_DIR, f"{prefix}_sheet_{i+1}.png")); print(f"Saved {prefix}_sheet_{i+1}.png")

def main():
    print("Loading Data...")
    market, tiles, cards = load_data()
    
    imgs_a = []
    imgs_t = []
    
    print(f"Generating Agent Cards ({len(market)} found)...")
    for c in market:
        try:
            img = create_agent_card(c)
            name = c.get('name','agent').lower().replace(' ','_')
            img.save(os.path.join(CARDS_OUT_DIR, f"agent_{name}.png"))
            imgs_a.append(img)
        except Exception as e:
            print(f"Failed agent {c.get('name')}: {e}")

    print("Generating Starter Deck Cards...")
    starter_cards = [
        {'name': 'Apprentice', 'symbol': 'any', 'reveal': {'influence': 1}, 'effect': ''},
        {'name': 'Mechanic', 'symbol': 'wrench', 'reveal': {'cash': 1, 'influence': 1}, 'effect': ''},
        {'name': 'Draftsman', 'symbol': 'wrench', 'reveal': {'influence': 1}, 'effect': 'Draw 1 card'},
        {'name': 'Rigger', 'symbol': 'wrench', 'reveal': {'research': 1}, 'effect': '-£2 ship build cost'},
        {'name': 'Purser', 'symbol': 'coin', 'reveal': {'influence': 2}, 'effect': 'Gain £2'},
        {'name': 'Clerk', 'symbol': 'coin', 'reveal': {'cash': 1, 'influence': 1}, 'effect': 'Gain £1'},
        {'name': 'Investor', 'symbol': 'coin', 'reveal': {'influence': 2}, 'effect': ''},
        {'name': 'Researcher', 'symbol': 'propeller', 'reveal': {'research': 1}, 'effect': '-£1 per Research'},
        {'name': 'Helmsman', 'symbol': 'propeller', 'reveal': {'officers': 1}, 'effect': '+1 ship stat'},
        {'name': 'Navigator', 'symbol': 'propeller', 'reveal': {'influence': 1}, 'effect': 'Look at top Hazard'}
    ]

    for mock in starter_cards:
        try:
            # Note: art files might have different names, e.g. starter_navigator.png
            imgs_a.append(create_agent_card(mock))
        except Exception as e:
            print(f"Failed starter card {mock['name']}: {e}")

    print(f"Generating Tech Cards ({len(cards)} found)...")
    for cid, cd in cards.items():
        try:
            # Find matching tile
            lt = None
            for tid, td in tiles.items():
                if td.get('requiredCard') == cid:
                    lt = td
                    break
            img = create_tech_card(cd, lt)
            img.save(os.path.join(CARDS_OUT_DIR, f"tech_{cid}.png"))
            imgs_t.append(img)
        except Exception as e:
            print(f"Failed tech {cid}: {e}")

    print("Creating Printable Sheets...")
    create_printable_sheets(imgs_a, "agents")
    create_printable_sheets(imgs_t, "tech")
    print("Done!")

if __name__ == '__main__': main()