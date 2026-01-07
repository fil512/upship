#!/usr/bin/env python3
"""
Resource Flow Analysis Script

Analyzes resource flow JSON logs against design goals:
- Techs per player per round: 1.1 (max 2 rarely)
- Cards per player per round: 1.1 (max 2 rarely)
- Total purchases: 2.2 baseline, 3 on exceptional rounds

Usage:
    python scripts/analyze_flow.py [json_file]

If no file specified, uses most recent in logs/resource-flows/
"""

import json
import sys
import glob
from collections import defaultdict
from pathlib import Path


# Design goals
TECH_GOAL = 1.1  # techs per player per round
CARD_GOAL = 1.1  # cards per player per round
TOTAL_GOAL = 2.2  # total purchases per player per round
LAUNCH_SUCCESS_GOAL = 0.80  # 80% launch success rate


def load_flow_data(filepath: str = None) -> tuple:
    """Load flow data from JSON file. Returns (resource_flows, launch_outcomes)."""
    if filepath is None:
        # Find most recent JSON file
        pattern = "logs/resource-flows/*.json"
        files = sorted(glob.glob(pattern), key=lambda x: Path(x).stat().st_mtime, reverse=True)
        if not files:
            print(f"ERROR: No flow files found matching {pattern}")
            sys.exit(1)
        filepath = files[0]

    print(f"Analyzing: {filepath}\n")

    with open(filepath) as f:
        data = json.load(f)

    # Handle both old format (array) and new format (object with resourceFlows/launchOutcomes)
    if isinstance(data, list):
        return data, []
    else:
        return data.get('resourceFlows', []), data.get('launchOutcomes', [])


def analyze_purchases(data: list) -> dict:
    """Count tech and card purchases per player per round."""
    tech_buys = defaultdict(lambda: defaultdict(int))
    card_buys = defaultdict(lambda: defaultdict(int))

    for e in data:
        action = e.get('action', '')
        faction = e['faction']
        round_key = f"R{e['round']}"

        if 'Acquire tech' in action:
            tech_buys[round_key][faction] += 1
        elif 'Buy market card' in action:
            card_buys[round_key][faction] += 1

    return {'techs': dict(tech_buys), 'cards': dict(card_buys)}


def analyze_costs(data: list) -> dict:
    """Calculate average costs for techs and cards."""
    tech_costs = []
    card_costs = []

    for e in data:
        action = e.get('action', '')
        res = e['resourceType']
        flow = e['flowType']
        amt = abs(e['amount'])

        if 'Acquire tech' in action and res == 'research' and flow == 'sink':
            tech_costs.append(amt)
        elif 'Buy market card' in action and res == 'influence' and flow == 'sink':
            card_costs.append(amt)

    return {
        'tech_costs': tech_costs,
        'card_costs': card_costs,
        'avg_tech_cost': sum(tech_costs) / len(tech_costs) if tech_costs else 0,
        'avg_card_cost': sum(card_costs) / len(card_costs) if card_costs else 0,
    }


def analyze_generation(data: list) -> dict:
    """Calculate resource generation per player per round."""
    research_gen = defaultdict(lambda: defaultdict(int))
    influence_gen = defaultdict(lambda: defaultdict(int))

    for e in data:
        faction = e['faction']
        r = f"R{e['round']}"
        res = e['resourceType']
        flow = e['flowType']
        amt = abs(e['amount'])

        if flow == 'fountain':
            if res == 'research':
                research_gen[r][faction] += amt
            elif res == 'influence':
                influence_gen[r][faction] += amt

    return {'research': dict(research_gen), 'influence': dict(influence_gen)}


def analyze_resource_flows(data: list) -> dict:
    """Analyze all resource fountains and sinks."""
    flows = defaultdict(lambda: {'fountain': 0, 'sink': 0})

    for e in data:
        res = e['resourceType']
        flow = e['flowType']
        amt = abs(e['amount'])

        if flow == 'fountain':
            flows[res]['fountain'] += amt
        else:
            flows[res]['sink'] += amt

    return dict(flows)


def get_rounds_and_factions(data: list) -> tuple:
    """Extract unique rounds and factions from data."""
    rounds = sorted(set(f"R{e['round']}" for e in data))
    factions = sorted(set(e['faction'] for e in data))
    return rounds, factions


def analyze_launch_outcomes(outcomes: list) -> dict:
    """Analyze launch outcomes."""
    if not outcomes:
        return None

    counts = {'success': 0, 'damaged': 0, 'aborted': 0, 'destroyed': 0}
    by_gas = {'hydrogen': {'total': 0, 'success': 0}, 'helium': {'total': 0, 'success': 0}}
    by_hazard = defaultdict(lambda: {'total': 0, 'success': 0, 'aborted': 0, 'destroyed': 0})

    for entry in outcomes:
        outcome = entry.get('outcome', 'unknown')
        gas = entry.get('gasType', 'hydrogen')
        hazard = entry.get('hazardName', 'Unknown')

        if outcome in counts:
            counts[outcome] += 1

        by_gas[gas]['total'] += 1
        if outcome == 'success':
            by_gas[gas]['success'] += 1

        by_hazard[hazard]['total'] += 1
        if outcome in by_hazard[hazard]:
            by_hazard[hazard][outcome] += 1

    total = sum(counts.values())
    success_rate = counts['success'] / total if total > 0 else 0
    survival_rate = (counts['success'] + counts['damaged'] + counts['aborted']) / total if total > 0 else 0

    return {
        'total': total,
        'counts': counts,
        'success_rate': success_rate,
        'survival_rate': survival_rate,
        'by_gas': dict(by_gas),
        'by_hazard': dict(by_hazard),
        'outcomes': outcomes
    }


def print_purchasing_power_report(purchases: dict, rounds: list, factions: list):
    """Print the purchasing power analysis."""
    print("=" * 60)
    print("PURCHASING POWER ANALYSIS (PRIMARY METRIC)")
    print("=" * 60)
    print()
    print("DESIGN GOALS:")
    print(f"  - Techs per player per round: {TECH_GOAL} (max 2 on rare rounds)")
    print(f"  - Cards per player per round: {CARD_GOAL} (max 2 on rare rounds)")
    print(f"  - Total purchases per round:  {TOTAL_GOAL} baseline")
    print()

    print("ACTUAL RESULTS:")
    print(f"{'Round':<6} | {'Techs/Player':>12} | {'Cards/Player':>12} | {'Total':>6} | Status")
    print("-" * 60)

    total_techs = 0
    total_cards = 0
    num_rounds = len(rounds)
    num_players = len(factions)

    for r in rounds:
        techs = sum(purchases['techs'].get(r, {}).values())
        cards = sum(purchases['cards'].get(r, {}).values())
        total_techs += techs
        total_cards += cards

        techs_per = techs / num_players
        cards_per = cards / num_players
        total_per = techs_per + cards_per

        # Determine status
        if techs_per > TECH_GOAL * 2:
            status = "❌ WAY TOO MANY TECHS"
        elif techs_per > TECH_GOAL * 1.5:
            status = "❌ TOO MANY TECHS"
        elif cards_per < CARD_GOAL * 0.5:
            status = "⚠️  FEW CARDS"
        elif abs(techs_per - TECH_GOAL) <= 0.3 and abs(cards_per - CARD_GOAL) <= 0.3:
            status = "✓ ON TARGET"
        else:
            status = "⚠️  REVIEW"

        print(f"{r:<6} | {techs_per:>12.1f} | {cards_per:>12.1f} | {total_per:>6.1f} | {status}")

    print()
    avg_techs = total_techs / (num_rounds * num_players)
    avg_cards = total_cards / (num_rounds * num_players)

    print("SUMMARY:")
    tech_pct = ((avg_techs - TECH_GOAL) / TECH_GOAL) * 100
    card_pct = ((avg_cards - CARD_GOAL) / CARD_GOAL) * 100

    tech_status = "✓" if abs(tech_pct) <= 30 else "❌"
    card_status = "✓" if abs(card_pct) <= 30 else "❌"

    print(f"  - Techs: {avg_techs:.1f} avg (goal: {TECH_GOAL}) → {tech_pct:+.0f}% {tech_status}")
    print(f"  - Cards: {avg_cards:.1f} avg (goal: {CARD_GOAL}) → {card_pct:+.0f}% {card_status}")
    print()


def print_currency_analysis(costs: dict, generation: dict, rounds: list, factions: list):
    """Print currency generation vs costs analysis."""
    print("=" * 60)
    print("CURRENCY ANALYSIS")
    print("=" * 60)
    print()

    num_rounds = len(rounds)
    num_players = len(factions)

    # Research
    total_research = sum(
        sum(generation['research'].get(r, {}).values())
        for r in rounds
    )
    avg_research_per_player_round = total_research / (num_rounds * num_players)
    avg_tech_cost = costs['avg_tech_cost']

    if avg_tech_cost > 0:
        tech_purchasing_power = avg_research_per_player_round / avg_tech_cost
    else:
        tech_purchasing_power = float('inf')

    print("RESEARCH (for tech purchases):")
    print(f"  Generated per player per round: {avg_research_per_player_round:.1f}")
    print(f"  Average tech cost: {avg_tech_cost:.1f} research")
    print(f"  Purchasing power: {avg_research_per_player_round:.1f} ÷ {avg_tech_cost:.1f} = {tech_purchasing_power:.1f} techs")
    print(f"  Goal: {TECH_GOAL} tech")

    if tech_purchasing_power > TECH_GOAL * 1.5:
        ratio = tech_purchasing_power / TECH_GOAL
        print(f"  DIAGNOSIS: ❌ {ratio:.1f}x over target")
        print(f"    → Option A: Increase avg tech cost to ~{avg_research_per_player_round / TECH_GOAL:.0f} research")
        print(f"    → Option B: Reduce research generation by ~{(1 - TECH_GOAL/tech_purchasing_power)*100:.0f}%")
    else:
        print(f"  DIAGNOSIS: ✓ On target")
    print()

    # Influence
    total_influence = sum(
        sum(generation['influence'].get(r, {}).values())
        for r in rounds
    )
    avg_influence_per_player_round = total_influence / (num_rounds * num_players)
    avg_card_cost = costs['avg_card_cost']

    if avg_card_cost > 0:
        card_purchasing_power = avg_influence_per_player_round / avg_card_cost
    else:
        card_purchasing_power = 0

    print("INFLUENCE (for card purchases):")
    print(f"  Generated per player per round: {avg_influence_per_player_round:.1f}")
    print(f"  Average card cost: {avg_card_cost:.1f} influence")
    if avg_card_cost > 0:
        print(f"  Purchasing power: {avg_influence_per_player_round:.1f} ÷ {avg_card_cost:.1f} = {card_purchasing_power:.1f} cards")
    else:
        print(f"  Purchasing power: N/A (no cards purchased)")
    print(f"  Goal: {CARD_GOAL} card")

    if card_purchasing_power < CARD_GOAL * 0.7:
        print(f"  DIAGNOSIS: ⚠️  Below target - players can't afford cards")
    elif card_purchasing_power > CARD_GOAL * 1.5:
        print(f"  DIAGNOSIS: ⚠️  Above target - too much influence")
    else:
        print(f"  DIAGNOSIS: ✓ On target")
    print()


def print_resource_flow_report(flows: dict):
    """Print resource overflow/deficit analysis."""
    print("=" * 60)
    print("RESOURCE FLOW ANALYSIS (SECONDARY METRICS)")
    print("=" * 60)
    print()

    print(f"{'Resource':<18} | {'Fountains':>9} | {'Sinks':>9} | {'Net':>6} | {'Overflow%':>9} | Status")
    print("-" * 75)

    # Sort by overflow percentage
    sorted_resources = []
    for res, vals in flows.items():
        f, s = vals['fountain'], vals['sink']
        net = f - s
        overflow_pct = (net / f * 100) if f > 0 else 0
        sorted_resources.append((res, f, s, net, overflow_pct))

    sorted_resources.sort(key=lambda x: -x[4])  # Sort by overflow descending

    warnings = []
    healthy = []

    for res, f, s, net, overflow_pct in sorted_resources:
        if overflow_pct > 50:
            status = "🔴 OVERFLOW"
            warnings.append((res, f, s, net, overflow_pct))
        elif overflow_pct < -20:
            status = "🔴 DEFICIT"
            warnings.append((res, f, s, net, overflow_pct))
        elif s == 0 and f > 0 and '_income' not in res:
            status = "⚠️  NO SINKS"
            warnings.append((res, f, s, net, overflow_pct))
        else:
            status = "✓ OK"
            healthy.append((res, f, s, net, overflow_pct))

        print(f"{res:<18} | {f:>9} | {s:>9} | {net:>+6} | {overflow_pct:>8.0f}% | {status}")

    print()

    if warnings:
        print("PROBLEM RESOURCES:")
        for res, f, s, net, overflow_pct in warnings:
            print(f"  - {res}: {f} in, {s} out ({overflow_pct:.0f}% overflow)")

    print()


def print_per_round_detail(purchases: dict, generation: dict, rounds: list, factions: list):
    """Print detailed per-round breakdown."""
    print("=" * 60)
    print("PER-ROUND DETAIL")
    print("=" * 60)
    print()

    for r in rounds:
        print(f"{r}:")
        for faction in factions:
            techs = purchases['techs'].get(r, {}).get(faction, 0)
            cards = purchases['cards'].get(r, {}).get(faction, 0)
            research = generation['research'].get(r, {}).get(faction, 0)
            influence = generation['influence'].get(r, {}).get(faction, 0)

            status = "✓" if techs <= 2 and cards >= 1 else "✗"
            print(f"  {faction:<10}: {techs} tech + {cards} card | research={research}, influence={influence} {status}")
        print()


def print_launch_outcomes_report(launch_data: dict):
    """Print launch outcomes analysis."""
    if launch_data is None:
        print("=" * 60)
        print("LAUNCH OUTCOMES")
        print("=" * 60)
        print()
        print("No launch outcome data available.")
        print()
        return

    print("=" * 60)
    print("LAUNCH OUTCOMES")
    print("=" * 60)
    print()

    total = launch_data['total']
    counts = launch_data['counts']
    success_rate = launch_data['success_rate']
    survival_rate = launch_data['survival_rate']

    print(f"DESIGN GOAL: {LAUNCH_SUCCESS_GOAL*100:.0f}% success rate")
    print()
    print(f"Total launches: {total}")
    print()

    print("Outcome Summary:")
    for outcome in ['success', 'damaged', 'aborted', 'destroyed']:
        count = counts[outcome]
        pct = (count / total * 100) if total > 0 else 0
        desc = {
            'success': 'Ship claimed route',
            'damaged': 'Ship to repair bay',
            'aborted': 'Ship returned to hangar',
            'destroyed': 'Ship lost'
        }[outcome]
        print(f"  {outcome.upper():<10}: {count:>3} ({pct:>5.1f}%) - {desc}")
    print()

    # Success rate vs goal
    success_pct = success_rate * 100
    goal_pct = LAUNCH_SUCCESS_GOAL * 100
    diff = success_pct - goal_pct

    if success_rate >= LAUNCH_SUCCESS_GOAL:
        status = "✓ ON TARGET"
    elif success_rate >= LAUNCH_SUCCESS_GOAL * 0.8:
        status = "⚠️  BELOW TARGET"
    else:
        status = "❌ FAR BELOW TARGET"

    print(f"Success Rate: {success_pct:.0f}% (goal: {goal_pct:.0f}%) → {diff:+.0f}% {status}")
    print(f"Survival Rate: {survival_rate*100:.0f}% (ships not destroyed)")
    print()

    # By gas type
    by_gas = launch_data['by_gas']
    print("By Gas Type:")
    for gas in ['hydrogen', 'helium']:
        stats = by_gas.get(gas, {'total': 0, 'success': 0})
        if stats['total'] > 0:
            rate = stats['success'] / stats['total'] * 100
            print(f"  {gas.upper():<10}: {stats['total']} launches, {rate:.0f}% success")
    print()

    # By hazard type (top 5)
    by_hazard = launch_data['by_hazard']
    if by_hazard:
        print("By Hazard Type (top causes of failure):")
        sorted_hazards = sorted(by_hazard.items(), key=lambda x: x[1]['total'] - x[1]['success'], reverse=True)
        for hazard, stats in sorted_hazards[:5]:
            if stats['total'] > 0:
                success_rate = stats['success'] / stats['total'] * 100
                failures = stats['total'] - stats['success']
                if failures > 0:
                    print(f"  {hazard:<25}: {stats['total']} total, {failures} failures ({100-success_rate:.0f}% fail rate)")
        print()

    # Diagnosis
    if success_rate < LAUNCH_SUCCESS_GOAL:
        print("DIAGNOSIS:")
        if success_rate < LAUNCH_SUCCESS_GOAL * 0.6:
            print("  ❌ Critical: Hazard difficulties are too high")
            print("     → Lower minor hazard difficulties (target: 1-3)")
            print("     → Lower major hazard difficulties (target: 3-4)")
        else:
            print("  ⚠️  Success rate below 80% target")
            print("     → Consider lowering hazard difficulties by 1")
            print("     → Or increase starting ship stats")
        print()


def main():
    # Load data
    filepath = sys.argv[1] if len(sys.argv) > 1 else None
    resource_flows, launch_outcomes = load_flow_data(filepath)

    if not resource_flows:
        print("ERROR: No resource flow data found")
        sys.exit(1)

    # Get metadata
    rounds, factions = get_rounds_and_factions(resource_flows)

    print(f"Game: {resource_flows[0].get('gameId', 'unknown')}")
    print(f"Rounds: {len(rounds)}, Players: {len(factions)}")
    print()

    # Analyze
    purchases = analyze_purchases(resource_flows)
    costs = analyze_costs(resource_flows)
    generation = analyze_generation(resource_flows)
    flows = analyze_resource_flows(resource_flows)
    launch_data = analyze_launch_outcomes(launch_outcomes)

    # Print reports
    print_purchasing_power_report(purchases, rounds, factions)
    print_currency_analysis(costs, generation, rounds, factions)
    print_launch_outcomes_report(launch_data)
    print_resource_flow_report(flows)
    print_per_round_detail(purchases, generation, rounds, factions)


if __name__ == '__main__':
    main()
