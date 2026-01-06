/**
 * Resource Flow Logger - Tracks all fountains (sources) and sinks (drains)
 *
 * Based on game economy design principles from:
 * - Lost Garden "Value Chains" methodology
 * - Faucet/Drain economic modeling
 *
 * This logger captures every resource change to analyze:
 * - Flow velocity (resources moving through the economy)
 * - Pool accumulation (excess resources hoarded)
 * - Sink coverage (whether sinks match source power)
 * - Balance status per resource type
 */

import * as fs from 'fs';
import * as path from 'path';

// Resource types tracked
export type ResourceType =
  | 'cash'
  | 'income'
  | 'officers'
  | 'engineers'
  | 'research'
  | 'influence'
  | 'hydrogen'
  | 'helium'
  | 'officer_income'
  | 'engineer_income'
  | 'ships'
  | 'technologies'
  | 'routes'
  | 'loans'
  | 'vp';

// Flow classification (from Lost Garden methodology)
export type FlowType = 'fountain' | 'sink';

// Source/sink subtypes for analysis
export type SourceType =
  | 'trickle'      // Small steady income (e.g., income phase)
  | 'fixed'        // One-time gain (e.g., starting resources)
  | 'action'       // Gained via player action (e.g., location bonus)
  | 'card'         // From card effects
  | 'route'        // From completed routes
  | 'conversion'   // Converted from another resource
  | 'loan';        // From taking loans

export type SinkType =
  | 'upkeep'       // Recurring cost (e.g., engineer maintenance)
  | 'purchase'     // One-time purchase (e.g., buy gas, recruit crew)
  | 'build'        // Construction cost (e.g., build ship)
  | 'launch'       // Launch cost (e.g., gas consumption)
  | 'hazard'       // Lost to hazards
  | 'action'       // Spent via player action
  | 'conversion'   // Converted to another resource
  | 'loan_penalty';// Income reduction from loans

export interface ResourceFlowEntry {
  timestamp: string;
  gameId: string;
  turn: number;
  round: number;
  age: number;
  phase: string;
  playerId: string;
  faction: string;

  // Flow data
  resourceType: ResourceType;
  flowType: FlowType;
  subType: SourceType | SinkType;
  amount: number;

  // Context
  action: string;           // What caused this flow
  location?: string;        // Where it happened (e.g., worker placement location)
  cardName?: string;        // Related card if any

  // Running totals (for analysis)
  playerTotal: number;      // Player's total of this resource after change
}

interface GameContext {
  gameId: string;
  turn: number;
  round: number;
  age: number;
  phase: string;
}

class ResourceFlowLogger {
  private entries: ResourceFlowEntry[] = [];
  private logDir: string;
  private currentGameId: string | null = null;
  private enabled: boolean = true;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'resource-flows');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Start tracking a new game
   */
  startGame(gameId: string): void {
    this.currentGameId = gameId;
    this.entries = [];
    console.log(`[ResourceFlow] Started tracking game ${gameId}`);
  }

  /**
   * Log a resource fountain (source/gain)
   */
  logFountain(
    context: GameContext,
    playerId: string,
    faction: string,
    resourceType: ResourceType,
    amount: number,
    sourceType: SourceType,
    action: string,
    playerTotal: number,
    options?: { location?: string; cardName?: string }
  ): void {
    if (!this.enabled || amount <= 0) return;

    const entry: ResourceFlowEntry = {
      timestamp: new Date().toISOString(),
      gameId: context.gameId,
      turn: context.turn,
      round: context.round,
      age: context.age,
      phase: context.phase,
      playerId,
      faction,
      resourceType,
      flowType: 'fountain',
      subType: sourceType,
      amount,
      action,
      playerTotal,
      ...options
    };

    this.entries.push(entry);
  }

  /**
   * Log a resource sink (drain/loss)
   */
  logSink(
    context: GameContext,
    playerId: string,
    faction: string,
    resourceType: ResourceType,
    amount: number,
    sinkType: SinkType,
    action: string,
    playerTotal: number,
    options?: { location?: string; cardName?: string }
  ): void {
    if (!this.enabled || amount <= 0) return;

    const entry: ResourceFlowEntry = {
      timestamp: new Date().toISOString(),
      gameId: context.gameId,
      turn: context.turn,
      round: context.round,
      age: context.age,
      phase: context.phase,
      playerId,
      faction,
      resourceType,
      flowType: 'sink',
      subType: sinkType,
      amount,
      action,
      playerTotal,
      ...options
    };

    this.entries.push(entry);
  }

  /**
   * Save the current game's flow log to file
   */
  saveLog(): string | null {
    if (!this.currentGameId || this.entries.length === 0) {
      return null;
    }

    const filename = `flow_${this.currentGameId}_${Date.now()}.json`;
    const filepath = path.join(this.logDir, filename);

    // Write detailed JSON log
    fs.writeFileSync(filepath, JSON.stringify(this.entries, null, 2));

    // Also write summary CSV for spreadsheet analysis
    const csvPath = filepath.replace('.json', '.csv');
    this.writeCsv(csvPath);

    // Write analysis summary
    const analysisPath = filepath.replace('.json', '_analysis.txt');
    this.writeAnalysis(analysisPath);

    console.log(`[ResourceFlow] Saved ${this.entries.length} entries to ${filepath}`);
    return filepath;
  }

  private writeCsv(filepath: string): void {
    const headers = [
      'timestamp', 'round', 'age', 'phase', 'faction',
      'resource', 'flow_type', 'sub_type', 'amount', 'player_total',
      'action', 'location', 'card'
    ];

    const rows = this.entries.map(e => [
      e.timestamp,
      e.round,
      e.age,
      e.phase,
      e.faction,
      e.resourceType,
      e.flowType,
      e.subType,
      e.amount,
      e.playerTotal,
      `"${e.action}"`,
      e.location || '',
      e.cardName || ''
    ].join(','));

    fs.writeFileSync(filepath, [headers.join(','), ...rows].join('\n'));
  }

  private writeAnalysis(filepath: string): void {
    const analysis: string[] = [];
    analysis.push('=== RESOURCE FLOW ANALYSIS ===');
    analysis.push(`Game ID: ${this.currentGameId}`);
    analysis.push(`Total entries: ${this.entries.length}`);
    analysis.push(`Generated: ${new Date().toISOString()}`);
    analysis.push('');

    // Aggregate by resource type
    const byResource = new Map<ResourceType, { fountains: number; sinks: number; net: number }>();

    for (const entry of this.entries) {
      if (!byResource.has(entry.resourceType)) {
        byResource.set(entry.resourceType, { fountains: 0, sinks: 0, net: 0 });
      }
      const stats = byResource.get(entry.resourceType)!;
      if (entry.flowType === 'fountain') {
        stats.fountains += entry.amount;
        stats.net += entry.amount;
      } else {
        stats.sinks += entry.amount;
        stats.net -= entry.amount;
      }
    }

    analysis.push('=== RESOURCE TOTALS ===');
    analysis.push('Resource        | Fountains | Sinks    | Net      | Balance');
    analysis.push('----------------|-----------|----------|----------|--------');

    for (const [resource, stats] of byResource) {
      let status: string;
      if (stats.net > stats.fountains * 0.3) {
        status = 'OVERFLOW';
      } else if (stats.net < 0) {
        status = 'DEFICIT';
      } else {
        status = 'OK';
      }
      analysis.push(
        `${resource.padEnd(15)} | ${String(stats.fountains).padStart(9)} | ${String(stats.sinks).padStart(8)} | ${String(stats.net).padStart(8)} | ${status}`
      );
    }

    analysis.push('');
    analysis.push('=== FOUNTAIN BREAKDOWN BY SOURCE TYPE ===');

    const fountainsByType = new Map<string, Map<SourceType, number>>();
    for (const entry of this.entries) {
      if (entry.flowType !== 'fountain') continue;
      const key = entry.resourceType;
      if (!fountainsByType.has(key)) {
        fountainsByType.set(key, new Map());
      }
      const typeMap = fountainsByType.get(key)!;
      const current = typeMap.get(entry.subType as SourceType) || 0;
      typeMap.set(entry.subType as SourceType, current + entry.amount);
    }

    for (const [resource, typeMap] of fountainsByType) {
      analysis.push(`\n${resource.toUpperCase()}:`);
      for (const [sourceType, amount] of typeMap) {
        analysis.push(`  ${sourceType}: +${amount}`);
      }
    }

    analysis.push('');
    analysis.push('=== SINK BREAKDOWN BY SINK TYPE ===');

    const sinksByType = new Map<string, Map<SinkType, number>>();
    for (const entry of this.entries) {
      if (entry.flowType !== 'sink') continue;
      const key = entry.resourceType;
      if (!sinksByType.has(key)) {
        sinksByType.set(key, new Map());
      }
      const typeMap = sinksByType.get(key)!;
      const current = typeMap.get(entry.subType as SinkType) || 0;
      typeMap.set(entry.subType as SinkType, current + entry.amount);
    }

    for (const [resource, typeMap] of sinksByType) {
      analysis.push(`\n${resource.toUpperCase()}:`);
      for (const [sinkType, amount] of typeMap) {
        analysis.push(`  ${sinkType}: -${amount}`);
      }
    }

    analysis.push('');
    analysis.push('=== PER-FACTION SUMMARY ===');

    const byFaction = new Map<string, Map<ResourceType, { fountains: number; sinks: number }>>();
    for (const entry of this.entries) {
      if (!byFaction.has(entry.faction)) {
        byFaction.set(entry.faction, new Map());
      }
      const factionMap = byFaction.get(entry.faction)!;
      if (!factionMap.has(entry.resourceType)) {
        factionMap.set(entry.resourceType, { fountains: 0, sinks: 0 });
      }
      const stats = factionMap.get(entry.resourceType)!;
      if (entry.flowType === 'fountain') {
        stats.fountains += entry.amount;
      } else {
        stats.sinks += entry.amount;
      }
    }

    for (const [faction, resourceMap] of byFaction) {
      analysis.push(`\n${faction.toUpperCase()}:`);
      for (const [resource, stats] of resourceMap) {
        const net = stats.fountains - stats.sinks;
        analysis.push(`  ${resource}: +${stats.fountains} / -${stats.sinks} = ${net >= 0 ? '+' : ''}${net}`);
      }
    }

    // Special section for ephemeral resources (research, influence)
    // These reset each round so cumulative analysis doesn't apply
    analysis.push('');
    analysis.push('=== EPHEMERAL RESOURCES (Per-Round Analysis) ===');
    analysis.push('Note: Research and Influence reset each round. We measure whether players');
    analysis.push('have MORE than needed (excess/wasted) or LESS than needed (constrained).');
    analysis.push('');

    const ephemeralResources: ResourceType[] = ['research', 'influence'];

    for (const resource of ephemeralResources) {
      // Group by round and faction
      const byRoundFaction = new Map<string, { generated: number; spent: number }>();

      for (const entry of this.entries) {
        if (entry.resourceType !== resource) continue;
        const key = `Age${entry.age}_R${entry.round}_${entry.faction}`;
        if (!byRoundFaction.has(key)) {
          byRoundFaction.set(key, { generated: 0, spent: 0 });
        }
        const stats = byRoundFaction.get(key)!;
        if (entry.flowType === 'fountain') {
          stats.generated += entry.amount;
        } else {
          stats.spent += entry.amount;
        }
      }

      if (byRoundFaction.size === 0) {
        analysis.push(`${resource.toUpperCase()}: No data tracked`);
        analysis.push('');
        continue;
      }

      analysis.push(`${resource.toUpperCase()}:`);
      analysis.push('Round           | Faction    | Generated | Spent | Unused | Status');
      analysis.push('----------------|------------|-----------|-------|--------|-------');

      let totalGenerated = 0;
      let totalSpent = 0;
      let constrainedCount = 0;
      let excessCount = 0;

      for (const [key, stats] of Array.from(byRoundFaction.entries()).sort()) {
        const unused = stats.generated - stats.spent;
        totalGenerated += stats.generated;
        totalSpent += stats.spent;

        let status: string;
        if (stats.generated === 0) {
          status = 'NO GEN';  // No generation - can't buy anything
          constrainedCount++;
        } else if (unused <= 0) {
          status = 'TIGHT';   // Spent everything or more (using engineers for research)
        } else if (unused >= stats.generated * 0.5) {
          status = 'EXCESS';  // Wasted 50%+ of generated
          excessCount++;
        } else {
          status = 'OK';
        }

        const parts = key.split('_');
        const roundLabel = `${parts[0]} ${parts[1]}`.padEnd(15);
        const faction = parts[2].padEnd(10);

        analysis.push(
          `${roundLabel} | ${faction} | ${String(stats.generated).padStart(9)} | ${String(stats.spent).padStart(5)} | ${String(unused).padStart(6)} | ${status}`
        );
      }

      analysis.push('');
      const totalUnused = totalGenerated - totalSpent;
      const utilizationPct = totalGenerated > 0 ? Math.round((totalSpent / totalGenerated) * 100) : 0;
      analysis.push(`  Total: Generated=${totalGenerated}, Spent=${totalSpent}, Unused=${totalUnused} (${utilizationPct}% utilization)`);

      if (constrainedCount > byRoundFaction.size * 0.3) {
        analysis.push(`  WARNING: ${constrainedCount}/${byRoundFaction.size} rounds had no ${resource} generation`);
      }
      if (excessCount > byRoundFaction.size * 0.3) {
        analysis.push(`  WARNING: ${excessCount}/${byRoundFaction.size} rounds had >50% unused ${resource}`);
      }
      analysis.push('');
    }

    analysis.push('=== BALANCE WARNINGS ===');

    for (const [resource, stats] of byResource) {
      // Skip ephemeral resources - they're analyzed above
      if (resource === 'research' || resource === 'influence') continue;

      if (stats.net > stats.fountains * 0.5) {
        analysis.push(`WARNING: ${resource} has >50% overflow (net: ${stats.net}, fountains: ${stats.fountains})`);
        analysis.push(`  -> Consider: increase sink costs, reduce fountain rates, or add new sinks`);
      }
      if (stats.sinks === 0 && stats.fountains > 0) {
        analysis.push(`WARNING: ${resource} has NO SINKS (fountains: ${stats.fountains})`);
        analysis.push(`  -> Critical: this resource will accumulate indefinitely`);
      }
    }

    fs.writeFileSync(filepath, analysis.join('\n'));
  }

  /**
   * Get current entries for analysis
   */
  getEntries(): ResourceFlowEntry[] {
    return [...this.entries];
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear current game data
   */
  clear(): void {
    this.entries = [];
    this.currentGameId = null;
  }
}

// Singleton instance
export const resourceFlowLogger = new ResourceFlowLogger();

// Helper to create game context from state
export function createFlowContext(state: {
  turn?: number;
  round?: number;
  age?: number;
  phase?: string;
}, gameId: string): GameContext {
  return {
    gameId,
    turn: state.turn || 1,
    round: state.round || 1,
    age: state.age || 1,
    phase: state.phase || 'unknown'
  };
}
