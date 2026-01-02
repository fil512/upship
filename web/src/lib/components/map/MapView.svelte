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
  export let missionRow: Mission[] = [];
  export let myFaction: string | undefined = undefined;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{
    claimRoute: { route: Route };
    claimMission: { mission: Mission };
  }>();

  function handleRouteSelect(event: CustomEvent<{ route: Route }>) {
    dispatch('claimRoute', event.detail);
  }

  function handleMissionSelect(event: CustomEvent<{ mission: Mission }>) {
    dispatch('claimMission', event.detail);
  }
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
      {myFaction}
      {selectable}
      on:selectRoute={handleRouteSelect}
    />
  {/if}
</div>

<style>
  .map-view {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }
</style>
