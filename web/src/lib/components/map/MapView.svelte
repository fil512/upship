<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GameMap from './GameMap.svelte';
  import MissionView from './MissionView.svelte';
  import type { Route, Ship, Mission } from '$lib/types/game';

  export let age: number;
  export let routes: Route[] = [];
  export let cities: Record<string, { type: string; homeBase: string | null }> = {};
  export let ships: Ship[] = [];
  export let allPlayerShips: { ship: Ship; faction: string }[] = [];
  export let playerFactions: Record<string, string> = {};
  export let missionRow: Mission[] = [];
  export let myFaction: string | undefined = undefined;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{
    claimRoute: { route: Route };
    claimMission: { mission: Mission };
    selectRoute: { route: Route };
  }>();

  function handleRouteSelect(event: CustomEvent<{ route: Route }>) {
    // Forward both events - claimRoute for route claiming, selectRoute for launchpad
    dispatch('claimRoute', event.detail);
    dispatch('selectRoute', event.detail);
  }

  function handleMissionSelect(event: CustomEvent<{ mission: Mission }>) {
    dispatch('claimMission', event.detail);
    // Also dispatch selectRoute for launchpad compatibility (mission acts as a route)
    const mission = event.detail.mission;
    dispatch('selectRoute', { route: { id: mission.id, ...mission } as unknown as Route });
  }

  // Check if player has any ships in hangar
  $: hasShipsInHangar = ships.some(s => s.status === 'hangar');
</script>

<div class="map-view">
  {#if age === 2}
    <!-- Age II: Combat Missions -->
    <MissionView
      missions={missionRow}
      {selectable}
      on:select={handleMissionSelect}
    />
  {:else}
    <!-- Age I or Age III: Route Map -->
    <GameMap
      {age}
      {routes}
      {cities}
      {ships}
      {allPlayerShips}
      {playerFactions}
      {myFaction}
      {selectable}
      on:selectRoute={handleRouteSelect}
    />
  {/if}

  <!-- Contextual hint about launching -->
  {#if hasShipsInHangar}
    <div class="context-hint">
      <span class="hint-icon">&#128161;</span>
      <span class="hint-text">
        You have ships ready to launch! Visit the <strong>Launchpad</strong> during Worker Placement to send them on routes.
      </span>
    </div>
  {/if}

  <!-- Legend for faction colors -->
  <div class="faction-legend">
    <span class="legend-title">FACTIONS:</span>
    <span class="legend-item germany">Germany</span>
    <span class="legend-item britain">Britain</span>
    <span class="legend-item usa">USA</span>
    <span class="legend-item italy">Italy</span>
  </div>
</div>

<style>
  .map-view {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .context-hint {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--radius-md);
  }

  .hint-icon {
    font-size: 1rem;
    line-height: 1.4;
  }

  .hint-text {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .hint-text strong {
    color: var(--color-accent-gold);
  }

  .faction-legend {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-top: var(--spacing-sm);
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    font-size: 0.7rem;
  }

  .legend-title {
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-secondary);
  }

  .legend-item::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 6px;
    border-radius: 3px;
  }

  .legend-item.germany::before {
    background: #cc0000;
  }

  .legend-item.britain::before {
    background: #003399;
  }

  .legend-item.usa::before {
    background: #336699;
  }

  .legend-item.italy::before {
    background: #009246;
  }
</style>
