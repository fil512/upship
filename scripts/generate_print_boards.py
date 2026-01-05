import os
import re
import json
import math

# Paths
DATA_DIR = 'server/data'
SPEC_PATH = 'spec/appendix.md'
PRINT_DIR = 'print'

# City Coordinates (approximate for schematic map)
# Normalized 0-100 scale (X, Y)
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
    'San Francisco': (2, 40), 'Honolulu': (0, 55), # Off map really
    'London': (80, 25), 'Paris': (82, 30), 'Berlin': (90, 25),
    'Frankfurt': (88, 28), 'Friedrichshafen': (89, 32),
    'Oslo': (85, 15), 'Svalbard': (88, 5),
    'Rome': (90, 40), 'Cairo': (95, 50),
    'Rio de Janeiro': (35, 80), 'Recife': (40, 70), 'Manaus': (30, 70),
    'Buenos Aires': (30, 90), 'Valparaíso': (25, 90),
    'Bombay': (100, 60) # Off map
}

def parse_ts_file(file_path):
    # Reuse the robust parser
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    match = re.search(r'export const \w+\s*(?::\s*[^=]+)?=\s*([\\\[{].*?[\\\]}]);', content, flags=re.DOTALL)
    if not match: return []
    data_str = match.group(1)
    data_str = data_str.replace('true', 'True').replace('false', 'False').replace('null', 'None')
    data_str = re.sub(r'(\w+):', r'