<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FACTION_COLORS } from '$lib/data/mapConfig';
  import type { CityPosition } from '$lib/data/cityCoordinates';
  import type { Route } from '$lib/types/game';

  export let route: Route;
  export let cities: Record<string, CityPosition>;
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{ select: { route: Route } }>();

  $: from = cities[route.from || ''];
  $: to = cities[route.to || ''];
  $: isValid = from && to;

  // Straight line path
  $: path = isValid ? `M ${from.x} ${from.y} L ${to.x} ${to.y}` : '';

  // Shortened path for highlight (stops 15px before each city)
  $: shortenedPath = isValid ? calculateShortenedPath(from, to, 15) : '';

  function calculateShortenedPath(fromPos: CityPosition, toPos: CityPosition, inset: number): string {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= inset * 2) return ''; // Too short to shorten

    // Normalize direction
    const nx = dx / distance;
    const ny = dy / distance;

    // Inset start and end points
    const startX = fromPos.x + nx * inset;
    const startY = fromPos.y + ny * inset;
    const endX = toPos.x - nx * inset;
    const endY = toPos.y - ny * inset;

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  // Midpoint for label positioning
  $: midX = isValid ? (from.x + to.x) / 2 : 0;
  $: midY = isValid ? (from.y + to.y) / 2 : 0;

  // Calculate perpendicular offset for label (beside the line, not on it)
  $: labelOffset = isValid ? calculateLabelOffset(from, to) : { x: 0, y: 0 };

  function calculateLabelOffset(fromPos: CityPosition, toPos: CityPosition): { x: number; y: number } {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: 0, y: 0 };

    // Perpendicular direction (rotate 90 degrees), offset by 28px for larger labels
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const offset = 28;

    return { x: perpX * offset, y: perpY * offset };
  }

  // Determine stroke color based on claim status
  $: strokeColor = route.claimed
    ? FACTION_COLORS[route.claimed] || '#888'
    : '#64748b'; // Lighter slate gray for unclaimed (more visible)

  // Thicker lines: 8px claimed, 6px unclaimed
  $: strokeWidth = route.claimed ? 8 : 6;

  function handleClick() {
    if (selectable && !route.claimed) {
      dispatch('select', { route });
    }
  }

  // Build compact requirements display with letters: R2 S1 C1
  $: requirements = buildRequirementsString();

  function buildRequirementsString(): string {
    const parts: string[] = [];
    if (route.range) parts.push(`R${route.range}`);
    if (route.speed) parts.push(`S${route.speed}`);
    if (route.ceiling) parts.push(`C${route.ceiling}`);
    return parts.join(' ');
  }
</script>

{#if isValid}
  <g
    class="route"
    class:claimed={route.claimed}
    class:selectable={selectable && !route.claimed}
    role={selectable && !route.claimed ? 'button' : 'img'}
    tabindex={selectable && !route.claimed ? 0 : -1}
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick()}
  >
    <!-- Invisible hitbox for easier clicking -->
    <path
      d={path}
      class="route-hitbox"
      fill="none"
      stroke="transparent"
      stroke-width="28"
    />

    <!-- Highlight glow (shows on hover, stops before cities) -->
    {#if selectable && !route.claimed && shortenedPath}
      <path
        d={shortenedPath}
        class="route-highlight"
        fill="none"
        stroke="#fbbf24"
        stroke-width="16"
        stroke-linecap="round"
        opacity="0"
      />
    {/if}

    <!-- Visible route line -->
    <path
      d={shortenedPath || path}
      class="route-line"
      fill="none"
      stroke={strokeColor}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      opacity={route.claimed ? 1 : 0.8}
    />

    <!-- Label beside the line -->
    <g transform="translate({midX + labelOffset.x}, {midY + labelOffset.y})">
      {#if route.claimed}
        <!-- Claimed: show ship icon in faction color -->
        <text
          class="claimed-icon"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="20"
          fill={strokeColor}
        >
          ✈
        </text>
      {:else}
        <!-- Unclaimed: show requirements and income on one row -->
        <text
          class="route-label"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="13"
          font-weight="600"
        >
          <tspan fill="#94a3b8">{requirements}</tspan>
          <tspan fill="#4ade80"> +£{route.income}</tspan>
        </text>
      {/if}
    </g>
  </g>
{/if}

<style>
  .route {
    cursor: default;
  }

  .route.selectable {
    cursor: pointer;
  }

  /* Highlight glow appears on hover */
  .route-highlight {
    transition: opacity 0.15s ease;
    pointer-events: none;
  }

  .route.selectable:hover .route-highlight {
    opacity: 0.5;
  }

  .route.selectable:hover .route-line {
    stroke: #fbbf24;
    opacity: 1;
  }

  .route-line {
    transition: stroke 0.15s ease, opacity 0.15s ease;
  }

  .route-label {
    font-family: var(--font-mono);
    text-shadow:
      0 0 4px rgba(0, 0, 0, 1),
      0 1px 3px rgba(0, 0, 0, 0.9);
  }

  .claimed-icon {
    text-shadow:
      0 0 6px rgba(0, 0, 0, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.6);
  }
</style>
