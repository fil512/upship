#!/bin/bash
# Synchronize card images from print/cards to web/static/cards
#
# Usage: ./scripts/sync_card_images.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

SOURCE_DIR="$PROJECT_ROOT/print/artwork/cards"
DEST_DIR="$PROJECT_ROOT/web/static/cards"

# Check source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Create destination directories if they don't exist
mkdir -p "$DEST_DIR/agent"
mkdir -p "$DEST_DIR/tech"
mkdir -p "$DEST_DIR/mission"
mkdir -p "$DEST_DIR/hazard"

# Sync agent cards (from agent/ folder)
if [ -d "$SOURCE_DIR/agent" ]; then
    echo "Syncing agent cards..."
    rsync -av "$SOURCE_DIR/agent/" "$DEST_DIR/agent/"
fi

# Sync starter deck cards (from starter_deck/ folder into agent/)
if [ -d "$SOURCE_DIR/starter_deck" ]; then
    echo "Syncing starter deck cards..."
    rsync -av "$SOURCE_DIR/starter_deck/" "$DEST_DIR/agent/"
fi

# Sync tech cards
if [ -d "$SOURCE_DIR/tech" ]; then
    echo "Syncing tech cards..."
    rsync -av --delete "$SOURCE_DIR/tech/" "$DEST_DIR/tech/"
fi

# Sync mission cards
if [ -d "$SOURCE_DIR/mission" ]; then
    echo "Syncing mission cards..."
    rsync -av --delete "$SOURCE_DIR/mission/" "$DEST_DIR/mission/"
fi

# Sync hazard cards
if [ -d "$SOURCE_DIR/hazard" ]; then
    echo "Syncing hazard cards..."
    rsync -av --delete "$SOURCE_DIR/hazard/" "$DEST_DIR/hazard/"
fi

echo ""
echo "Sync complete!"
echo "  Agent cards: $(ls "$DEST_DIR/agent" 2>/dev/null | grep -c '\.png$' || echo 0)"
echo "  Tech cards:  $(ls "$DEST_DIR/tech" 2>/dev/null | grep -c '\.png$' || echo 0)"
echo "  Mission cards: $(ls "$DEST_DIR/mission" 2>/dev/null | grep -c '\.png$' || echo 0)"
echo "  Hazard cards: $(ls "$DEST_DIR/hazard" 2>/dev/null | grep -c '\.png$' || echo 0)"

# === Check for missing card images ===
echo ""
echo "=== Checking for missing card images ==="

# Expected agent card filenames (derived from MARKET_CARDS + STARTER_CARDS)
# Use: node scripts/list-expected-images.js agents
EXPECTED_AGENTS=(
    # === STARTER CARDS (10 cards from createStarterDeck) ===
    "apprentice"
    "mechanic"
    "draftsman"
    "rigger"
    "purser"
    "clerk"
    "investor"
    "researcher"
    "helmsman"
    # "navigator" - included in market cards below
    # === MARKET CARDS (30 cards from MARKET_CARDS) ===
    "chief_engineer"
    "kite_jockey"
    "navigator"
    "the_weatherman"
    "gasbag_man"
    "engine_room_mechanic"
    "the_scrutineer"
    "rigger_chief"
    "duralumin_man"
    "blaugas_handler"
    "the_nob"
    "captain_of_industry"
    "the_mandarin"
    "merchant_prince"
    "fleet_street_baron"
    "the_moneybags"
    "lloyds_man"
    "the_pen_pusher"
    "shop_steward"
    "the_exciseman"
    "the_boffin"
    "patent_clerk"
    "the_lab_coat"
    "the_archives"
    "continental_expert"
    "royal_geographic_society"
    "old_contemptible"
    "cooks_man"
    "aero_club"
    "engineering_guild"
    "the_aeronaut"
)

# Expected combat mission filenames (from Age II Combat Missions)
EXPECTED_MISSIONS=(
    # Bombing Runs
    "mission_bombing_railway"
    "mission_bombing_factory"
    "mission_bombing_port"
    "mission_bombing_deep_strike"
    "mission_bombing_strategic"
    "mission_bombing_capital"
    # Reconnaissance
    "mission_recon_frontline"
    "mission_recon_artillery"
    "mission_recon_enemy_pos"
    "mission_recon_strategic_photo"
    "mission_recon_deep"
    # Naval Patrols
    "mission_naval_coastal"
    "mission_naval_sub_hunter"
    # Resupply
    "mission_resupply_hospital"
    "mission_resupply_ammo"
    "mission_resupply_base"
    "mission_resupply_emergency"
    "mission_resupply_siege"
    # Artillery Observation
    "mission_artillery_battery"
    "mission_artillery_longrange"
)

# Expected hazard card filenames (from Appendix E Hazard Deck)
EXPECTED_HAZARDS=(
    # Clear Weather
    "hazard_clear_skies"
    "hazard_favorable_winds"
    "hazard_calm_conditions"
    "hazard_perfect_visibility"
    # Minor Hazards
    "hazard_light_turbulence"
    "hazard_minor_engine_trouble"
    "hazard_crosswind"
    "hazard_gas_leak"
    "hazard_low_visibility"
    "hazard_fuel_concern"
    "hazard_headwind"
    "hazard_structural_stress"
    # Major Hazards
    "hazard_strong_headwind"
    "hazard_icing_conditions"
    "hazard_engine_failure"
    "hazard_storm_system"
    "hazard_structural_damage"
    "hazard_navigation_error"
    "hazard_squall_line"
    "hazard_severe_icing"
    # Fire Hazards
    "hazard_engine_fire"
    "hazard_gas_cell_rupture"
    "hazard_static_discharge"
    "hazard_catastrophic_explosion"
    # Mechanical Hazards
    "hazard_critical_structural_stress"
)

# Expected tech tile image filenames (from Appendix D Tech Tile names)
# These are the actual image filenames; TechRow.svelte maps Tech Card names to these
# See: web/src/lib/utils/cardImages.ts TECH_CARD_TO_IMAGE mapping
EXPECTED_TECHS=(
    # Drive tiles
    "basic_engine"
    "improved_propeller"
    "twin_engine"
    "maybach_cx_engine"
    "diesel_engine"
    "vectored_thrust"
    "balanced_propulsion"
    "aerodynamic_engine"
    "high_altitude_engine"
    "hybrid_powerplant"
    "adaptive_propeller"
    # Frame tiles
    "wooden_frame"
    "tensioned_frame"
    "duralumin_frame"
    "steel_frame"
    "semi_rigid_keel"
    "geodetic_frame"
    "modular_frame"
    "flexible_frame"
    "streamlined_hull"
    "aerodynamic_lift_system"
    # Fabric tiles
    "cotton_envelope"
    "doped_covering"
    "goldbeaters_skin"
    "fire_resistant_fabric"
    "reflective_covering"
    "conductive_covering"
    "synthetic_envelope"
    "advanced_fabric"
    # Gas System tiles
    "pressure_control"
    "altitude_ballonets"
    "compartmented_gas"
    "helium_gas_cell"
    "blaugas_tank"
    "automatic_valves"
    "high_ceiling_gas"
    "redundant_cells"
    "rapid_descent_system"
    "reclamation_system"
    "exhaust_condensers"
    # Payload tiles
    "spotter_gondola"
    "postal_service"
    "external_cargo"
    "basic_cabin"
    "passenger_cabin"
    "bombing_equipment"
    "sparrowhawk_hangar"
    "communications_suite"
    "light_armor_plating"
    "heavy_armor_plating"
    "luxury_cabin"
    "dining_saloon"
    "observation_lounge"
    "private_berths"
    "pressurized_lounge"
    "imperial_mast"
    # Balance fix additions
    "altitude_compensator"
    "safety_valves"
    "pressurized_cabin_tech"
    "redundant_systems"
    "gondola_shielding"
)

# Expected starting tech card image filenames (faction starter equipment)
EXPECTED_STARTING_TECHS=(
    # Germany starters
    "zeppelin_frame"
    "maybach_cx_engine"
    "premium_envelope"
    "blaugas_tank"
    # Britain starters
    "tensioned_frame"
    "standard_engine"
    "doped_covering"
    "passenger_cabin"
    "imperial_mast"
    # USA starters
    "duralumin_frame"
    "reliable_engine"
    "latex_envelope"
    "helium_gas_cell"
    # Italy starters
    "semi_rigid_keel"
    "flexible_frame"
    "expedition_engine"
    "cotton_envelope"
)

# Check missing agent cards
echo ""
echo "Missing AGENT card images:"
missing_agents=0
for agent in "${EXPECTED_AGENTS[@]}"; do
    if [ ! -f "$DEST_DIR/agent/${agent}.png" ]; then
        echo "  - ${agent}.png"
        ((missing_agents++)) || true
    fi
done
if [ $missing_agents -eq 0 ]; then
    echo "  (none - all ${#EXPECTED_AGENTS[@]} agent cards have images)"
else
    echo "  Total missing: $missing_agents / ${#EXPECTED_AGENTS[@]}"
fi

# Check missing tech cards
echo ""
echo "Missing TECH card images:"
missing_techs=0
for tech in "${EXPECTED_TECHS[@]}"; do
    if [ ! -f "$DEST_DIR/tech/${tech}.png" ]; then
        echo "  - ${tech}.png"
        ((missing_techs++)) || true
    fi
done
if [ $missing_techs -eq 0 ]; then
    echo "  (none - all ${#EXPECTED_TECHS[@]} tech tiles have images)"
else
    echo "  Total missing: $missing_techs / ${#EXPECTED_TECHS[@]}"
fi

# Check missing starting tech cards (faction starters - use same tech artwork folder)
echo ""
echo "Missing STARTING TECH card images:"
missing_starting_techs=0
for tech in "${EXPECTED_STARTING_TECHS[@]}"; do
    if [ ! -f "$DEST_DIR/tech/${tech}.png" ]; then
        echo "  - ${tech}.png"
        ((missing_starting_techs++)) || true
    fi
done
if [ $missing_starting_techs -eq 0 ]; then
    echo "  (none - all ${#EXPECTED_STARTING_TECHS[@]} starting tech cards have images)"
else
    echo "  Total missing: $missing_starting_techs / ${#EXPECTED_STARTING_TECHS[@]}"
fi

# Check missing mission cards
echo ""
echo "Missing MISSION card images:"
missing_missions=0
for mission in "${EXPECTED_MISSIONS[@]}"; do
    if [ ! -f "$DEST_DIR/mission/${mission}.png" ]; then
        echo "  - ${mission}.png"
        ((missing_missions++)) || true
    fi
done
if [ $missing_missions -eq 0 ]; then
    echo "  (none - all ${#EXPECTED_MISSIONS[@]} mission cards have images)"
else
    echo "  Total missing: $missing_missions / ${#EXPECTED_MISSIONS[@]}"
fi

# Check missing hazard cards
echo ""
echo "Missing HAZARD card images:"
missing_hazards=0
for hazard in "${EXPECTED_HAZARDS[@]}"; do
    if [ ! -f "$DEST_DIR/hazard/${hazard}.png" ]; then
        echo "  - ${hazard}.png"
        ((missing_hazards++)) || true
    fi
done
if [ $missing_hazards -eq 0 ]; then
    echo "  (none - all ${#EXPECTED_HAZARDS[@]} hazard cards have images)"
else
    echo "  Total missing: $missing_hazards / ${#EXPECTED_HAZARDS[@]}"
fi

# Check for extra/unmatched images
echo ""
echo "Extra AGENT images (not matching expected names):"
extra_agents=0
for img in "$DEST_DIR/agent"/*.png; do
    [ -f "$img" ] || continue
    basename="${img##*/}"
    name="${basename%.png}"
    found=0
    for agent in "${EXPECTED_AGENTS[@]}"; do
        if [ "$name" = "$agent" ]; then
            found=1
            break
        fi
    done
    if [ $found -eq 0 ]; then
        echo "  - $basename"
        ((extra_agents++)) || true
    fi
done
if [ $extra_agents -eq 0 ]; then
    echo "  (none)"
fi

echo ""
echo "Extra TECH images (not matching expected names):"
extra_techs=0
for img in "$DEST_DIR/tech"/*.png; do
    [ -f "$img" ] || continue
    basename="${img##*/}"
    name="${basename%.png}"
    found=0
    for tech in "${EXPECTED_TECHS[@]}"; do
        if [ "$name" = "$tech" ]; then
            found=1
            break
        fi
    done
    if [ $found -eq 0 ]; then
        echo "  - $basename"
        ((extra_techs++)) || true
    fi
done
if [ $extra_techs -eq 0 ]; then
    echo "  (none)"
fi

echo ""
echo "Extra MISSION images (not matching expected names):"
extra_missions=0
for img in "$DEST_DIR/mission"/*.png; do
    [ -f "$img" ] || continue
    basename="${img##*/}"
    name="${basename%.png}"
    found=0
    for mission in "${EXPECTED_MISSIONS[@]}"; do
        if [ "$name" = "$mission" ]; then
            found=1
            break
        fi
    done
    if [ $found -eq 0 ]; then
        echo "  - $basename"
        ((extra_missions++)) || true
    fi
done
if [ $extra_missions -eq 0 ]; then
    echo "  (none)"
fi

echo ""
echo "Extra HAZARD images (not matching expected names):"
extra_hazards=0
for img in "$DEST_DIR/hazard"/*.png; do
    [ -f "$img" ] || continue
    basename="${img##*/}"
    name="${basename%.png}"
    found=0
    for hazard in "${EXPECTED_HAZARDS[@]}"; do
        if [ "$name" = "$hazard" ]; then
            found=1
            break
        fi
    done
    if [ $found -eq 0 ]; then
        echo "  - $basename"
        ((extra_hazards++)) || true
    fi
done
if [ $extra_hazards -eq 0 ]; then
    echo "  (none)"
fi

# Summary
echo ""
echo "=== Summary ==="
echo "Agent cards: $((${#EXPECTED_AGENTS[@]} - missing_agents))/${#EXPECTED_AGENTS[@]} have images"
echo "Tech tiles:  $((${#EXPECTED_TECHS[@]} - missing_techs))/${#EXPECTED_TECHS[@]} have images"
echo "Mission cards: $((${#EXPECTED_MISSIONS[@]} - missing_missions))/${#EXPECTED_MISSIONS[@]} have images"
echo "Hazard cards: $((${#EXPECTED_HAZARDS[@]} - missing_hazards))/${#EXPECTED_HAZARDS[@]} have images"
if [ $extra_agents -gt 0 ] || [ $extra_techs -gt 0 ] || [ $extra_missions -gt 0 ] || [ $extra_hazards -gt 0 ]; then
    echo ""
    echo "Note: Extra images may use display names instead of IDs."
    echo "Consider renaming to match tile IDs for consistency."
fi
