<script lang="ts">
  import { SHIP_SIZE, FACTION_COLORS } from '$lib/data/mapConfig';
  import type { Ship } from '$lib/types/game';

  export let ship: Ship;
  export let faction: string;
  export let position: { x: number; y: number };

  $: fillColor = FACTION_COLORS[faction] || '#666';
  $: isHazard = ship.status === 'awaiting_hazard';
  $: isDestroyed = ship.status === 'destroyed' || ship.status === 'crashed';
</script>

<g
  class="map-ship"
  class:hazard={isHazard}
  class:destroyed={isDestroyed}
  transform="translate({position.x}, {position.y})"
>
  <!-- Ship silhouette (zeppelin shape) -->
  <g class="ship-body" transform="scale(0.8)">
    <!-- Main envelope -->
    <ellipse cx="0" cy="0" rx={SHIP_SIZE.width / 2} ry={SHIP_SIZE.height / 2} fill={fillColor} />

    <!-- Gondola -->
    <rect
      x={-SHIP_SIZE.width / 4}
      y={SHIP_SIZE.height / 2 - 2}
      width={SHIP_SIZE.width / 2}
      height="4"
      rx="1"
      fill={fillColor}
    />

    <!-- Tail fins -->
    <polygon
      points="{SHIP_SIZE.width / 2 - 4},-4 {SHIP_SIZE.width / 2 + 3},0 {SHIP_SIZE.width / 2 - 4},4"
      fill={fillColor}
    />

    <!-- Highlight stripe -->
    <ellipse
      cx="0"
      cy="-2"
      rx={SHIP_SIZE.width / 2 - 3}
      ry="2"
      fill="white"
      opacity="0.3"
    />
  </g>

  <!-- Status indicators -->
  {#if isHazard}
    <g transform="translate({SHIP_SIZE.width / 2 + 2}, {-SHIP_SIZE.height / 2 - 2})">
      <circle r="6" fill="var(--color-warning)" />
      <text
        text-anchor="middle"
        y="3"
        font-size="8"
        font-weight="bold"
        fill="black"
      >
        !
      </text>
    </g>
  {/if}

  <!-- Ship ID label (on hover this would show more details) -->
  <title>
    Ship {ship.id.slice(0, 4)} - {ship.status}
    {#if ship.gasType}({ship.gasType}){/if}
  </title>
</g>

<style>
  .map-ship {
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .map-ship:hover {
    transform: scale(1.15);
  }

  .map-ship.hazard .ship-body {
    animation: pulse 1s ease-in-out infinite;
  }

  .map-ship.destroyed {
    opacity: 0.4;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
</style>
