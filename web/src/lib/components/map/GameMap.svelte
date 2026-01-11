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
  <!-- Background -->
  <rect class="map-bg" width="100%" height="100%" fill="var(--color-bg-primary)" />

  <!-- Decorative grid pattern -->
  <defs>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Routes layer (bottom) -->
  <g class="routes-layer">
    {#each routes as route (route.id)}
      <Route {route} cities={cityPositions} {playerFactions} {selectable} on:select={handleRouteSelect} />
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
    background: #0f172a;
  }

  .map-title {
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
