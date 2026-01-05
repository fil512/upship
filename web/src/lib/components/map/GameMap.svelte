<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import City from './City.svelte';
  import Route from './Route.svelte';
  import MapShip from './MapShip.svelte';
  import { getCityCoordinates } from '$lib/data/cityCoordinates';
  import { MAP_DIMENSIONS, FACTION_HOME_BASES } from '$lib/data/mapConfig';
  import type { Route as RouteType, Ship } from '$lib/types/game';

  export let age: number;
  export let routes: RouteType[] = [];
  export let cities: Record<string, { type: string; homeBase: string | null }> = {};
  export let ships: Ship[] = [];
  export let allPlayerShips: { ship: Ship; faction: string }[] = [];
  export let playerFactions: Record<string, string> = {};
  export let myFaction: string | undefined = undefined;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{
    selectRoute: { route: RouteType };
    selectCity: { name: string };
  }>();

  $: dimensions = MAP_DIMENSIONS[age] || MAP_DIMENSIONS[1];
  $: cityPositions = getCityCoordinates(age);

  // Memoized ship positions - only recalculates when dependencies change
  $: shipPositions = computeShipPositions(allPlayerShips, ships, routes, cityPositions, dimensions, age);

  /**
   * Pre-compute all ship positions at once for better performance.
   * This avoids recalculating positions on each render iteration.
   */
  function computeShipPositions(
    allShips: { ship: Ship; faction: string }[],
    myShips: Ship[],
    gameRoutes: RouteType[],
    cityPos: Record<string, { x: number; y: number }>,
    dims: { width: number; height: number },
    currentAge: number
  ): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();

    for (const { ship, faction } of allShips) {
      positions.set(ship.id, getShipPosition(ship, faction, myShips, gameRoutes, cityPos, dims, currentAge, allShips));
    }

    return positions;
  }

  // Get ship position on the map (pure function for memoization)
  function getShipPosition(
    ship: Ship,
    faction: string,
    myShips: Ship[],
    gameRoutes: RouteType[],
    cityPos: Record<string, { x: number; y: number }>,
    dims: { width: number; height: number },
    currentAge: number,
    allShips: { ship: Ship; faction: string }[]
  ): { x: number; y: number } {
    // Ships in hangar go near home base
    if (ship.status === 'hangar') {
      const homeBase = FACTION_HOME_BASES[faction]?.[currentAge];
      if (homeBase && cityPos[homeBase]) {
        const city = cityPos[homeBase];
        // Get all hangar ships from the same faction to calculate position offset
        const factionHangarShips = allShips
          .filter((s) => s.faction === faction && s.ship.status === 'hangar')
          .map((s) => s.ship);
        const index = factionHangarShips.findIndex((s) => s.id === ship.id);
        const safeIndex = index >= 0 ? index : 0;
        return { x: city.x + (safeIndex % 3) * 25 - 25, y: city.y + 30 + Math.floor(safeIndex / 3) * 18 };
      }
      // Fallback for hangar ships without valid home base
      return { x: 50, y: dims.height - 50 };
    }

    // Ships with a routeId (on_route, awaiting_hazard, crashed, destroyed, damaged)
    // go to route midpoint - this keeps crashed ships visible where they crashed
    if (ship.routeId) {
      const route = gameRoutes.find((r) => r.id === ship.routeId);
      if (route && route.from && route.to) {
        const from = cityPos[route.from];
        const to = cityPos[route.to];
        if (from && to) {
          // Midpoint of straight line
          const x = (from.x + to.x) / 2;
          const y = (from.y + to.y) / 2;

          // Offset for multiple ships on same route
          const shipsOnRoute = allShips.filter(
            (s) => s.ship.routeId === ship.routeId && s.ship.status !== 'hangar'
          );
          const shipIndex = shipsOnRoute.findIndex((s) => s.ship.id === ship.id);
          const yOffset = shipIndex * 16;

          return { x, y: y + yOffset - 15 };
        }
      }
    }

    // Ships without routeId and not in hangar go to home base as fallback
    const homeBase = FACTION_HOME_BASES[faction]?.[currentAge];
    if (homeBase && cityPos[homeBase]) {
      const city = cityPos[homeBase];
      return { x: city.x, y: city.y + 50 };
    }

    // Ultimate fallback (should rarely happen)
    return { x: 50, y: dims.height - 50 };
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
          homeBase={data.homeBase}
          on:click={handleCityClick}
        />
      {/if}
    {/each}
  </g>

  <!-- Ships layer (top) - only show ships actively on route -->
  <g class="ships-layer">
    {#each allPlayerShips.filter(({ ship }) =>
      ship.status === 'on_route' ||
      ship.status === 'awaiting_hazard'
    ) as { ship, faction } (ship.id)}
      <MapShip {ship} {faction} position={shipPositions.get(ship.id) || { x: 50, y: dimensions.height - 50 }} />
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
    height: auto;
    min-height: 400px;
    border-radius: var(--radius-md);
    background: #0f172a;
  }

  .map-title {
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
</style>
