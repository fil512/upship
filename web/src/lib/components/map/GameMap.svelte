<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import City from './City.svelte';
  import Route from './Route.svelte';
  import { getCityCoordinates } from '$lib/data/cityCoordinates';
  import { MAP_DIMENSIONS } from '$lib/data/mapConfig';
  import type { Route as RouteType } from '$lib/types/game';

  export let age: number;
  export let routes: RouteType[] = [];
  export let cities: Record<string, { type: string; homeBase: string | null }> = {};
  // Ships are now tokens (counters) - routes track claims via route.claimed
  export let playerFactions: Record<string, string> = {};
  export let myFaction: string | undefined = undefined;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{
    selectRoute: { route: RouteType };
    selectCity: { name: string };
  }>();

  $: dimensions = MAP_DIMENSIONS[age] || MAP_DIMENSIONS[1];
  $: cityPositions = getCityCoordinates(age);

  // Compute which routes should hide labels to avoid duplicates on same corridor
  // A corridor is defined by the city pair (regardless of direction)
  $: routesWithLabelFlag = computeLabelVisibility(routes);

  function computeLabelVisibility(routeList: RouteType[]): Map<string, boolean> {
    const corridorFirstRoute = new Map<string, string>(); // corridor key -> first route id that should show labels
    const hideLabels = new Map<string, boolean>();

    for (const route of routeList) {
      // Create corridor key from sorted city names (so NY-London == London-NY)
      const cities = [route.from || '', route.to || ''].sort();
      const corridorKey = cities.join('-');

      // Only track 1 routes (or single track routes) would normally show labels
      const wouldShowLabels = !route.track || route.track === 1;

      if (wouldShowLabels && !corridorFirstRoute.has(corridorKey)) {
        // This is the first route on this corridor that would show labels - let it
        corridorFirstRoute.set(corridorKey, route.id);
        hideLabels.set(route.id, false);
      } else if (wouldShowLabels) {
        // Another route already claimed labels for this corridor - hide this one's labels
        hideLabels.set(route.id, true);
      } else {
        // Track 2 routes don't show labels anyway
        hideLabels.set(route.id, false);
      }
    }

    return hideLabels;
  }

  function handleRouteSelect(event: CustomEvent<{ route: RouteType }>) {
    dispatch('selectRoute', event.detail);
  }

  function handleCityClick(event: CustomEvent<{ name: string }>) {
    dispatch('selectCity', event.detail);
  }
</script>

<svg
  class="game-map"
  viewBox="0 0 {dimensions.width} {dimensions.height}"
  preserveAspectRatio="xMidYMid meet"
>
  <!-- Background - white for print -->
  <rect class="map-bg" width="100%" height="100%" fill="#ffffff" />

  <!-- Decorative grid pattern - light gray for print -->
  <defs>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="0.5" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Routes layer (bottom) -->
  <g class="routes-layer">
    {#each routes as route (route.id)}
      <Route {route} cities={cityPositions} {playerFactions} {selectable} hideLabels={routesWithLabelFlag.get(route.id) || false} on:select={handleRouteSelect} />
    {/each}
  </g>

  <!-- Cities layer (middle) -->
  <g class="cities-layer">
    {#each Object.entries(cities) as [name, data]}
      {#if cityPositions[name]}
        <City
          {name}
          position={cityPositions[name]}
          type={data.type === 'major' ? 'major' : 'minor'}
          on:click={handleCityClick}
        />
      {/if}
    {/each}
  </g>

  <!-- Map title -->
  <text class="map-title" x="20" y="30" font-size="16" font-weight="600" fill="#475569">
    {age === 1 ? 'WESTERN EUROPE' : 'THE ATLANTIC'}
  </text>
</svg>

<style>
  .game-map {
    width: 100%;
    height: 100%;
    min-height: 400px;
    flex: 1;
    border-radius: var(--radius-md);
    background: #ffffff;
  }

  .map-title {
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
