import os
import re

DATA_DIR = 'server/data'
TECH_ART_DIR = 'print/cards/tech'

# 1. Load Tech Card Data
with open(os.path.join(DATA_DIR, 'upgrades.ts'), 'r') as f:
    full_text = f.read()

match = re.search(r'export const TECH_CARDS:.*?= ({.*?});', full_text, flags=re.DOTALL)
tech_cards_data = {}
if match:
    s = match.group(1).replace('true', 'True').replace('false', 'False').replace('null', 'None')
    s = re.sub(r'(\w+):', r'"\1":', s)
    s = re.sub(r'//.*', '', s)
    try: tech_cards_data = eval(s)
    except: print("Error parsing TECH_CARDS")

# 2. Load Mapping (Copied from script)
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
    'Wooden Framework': 'wooden_frame',
    'Wire Bracing': 'tensioned_frame',
    'Duralumin Framework': 'duralumin_frame',
    'Steel Framework': 'steel_frame',
    'Internal Keel': 'semi_rigid_keel',
    'Geodetic Structure': 'geodetic_frame',
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
    'Imperial Mooring System': 'imperial_mast'
}

# 3. List Actual Files
files = os.listdir(TECH_ART_DIR)
files_set = set(files)

# 4. Check Matches
print(f"{'CARD NAME':<30} | {'EXPECTED FILE':<25} | {'STATUS'}")
print("-" * 70)

missing_count = 0
for card_id, card in tech_cards_data.items():
    name = card['name']
    
    # Logic from script
    if name in TECH_CARD_TO_IMAGE:
        filename = TECH_CARD_TO_IMAGE[name] + ".png"
    else:
        filename = name.lower().replace("'", "").replace(" ", "_") + ".png"
    
    status = "OK" if filename in files_set else "MISSING"
    if status == "MISSING":
        missing_count += 1
        print(f"{name:<30} | {filename:<25} | {status}")

print("-" * 70)
print(f"Total Missing: {missing_count} / {len(tech_cards_data)}")
