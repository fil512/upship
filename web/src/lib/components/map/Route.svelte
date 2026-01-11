<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FACTION_COLORS } from '$lib/data/mapConfig';
  import type { CityPosition } from '$lib/data/cityCoordinates';
  import type { Route } from '$lib/types/game';

  export let route: Route;
  export let cities: Record<string, CityPosition>;
  export let playerFactions: Record<string, string> = {};
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{ select: { route: Route } }>();

  $: from = cities[route.from || ''];
  $: to = cities[route.to || ''];
  $: isValid = from && to;

  // Calculate perpendicular offset for double tracks
  // track=1: offset to one side, track=2: offset to other side, undefined: centered
  $: trackOffset = isValid ? calculateTrackOffset(from, to, route.track) : { x: 0, y: 0 };

  function calculateTrackOffset(fromPos: CityPosition, toPos: CityPosition, track?: number): { x: number; y: number } {
    if (!track) return { x: 0, y: 0 }; // Single track, no offset

    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { x: 0, y: 0 };

    // Perpendicular direction (rotate 90 degrees)
    const perpX = -dy / distance;
    const perpY = dx / distance;

    // Offset: track 1 goes one way, track 2 goes the other
    const offsetDistance = 6; // pixels apart
    const direction = track === 1 ? -1 : 1;

    return { x: perpX * offsetDistance * direction, y: perpY * offsetDistance * direction };
  }

  // Apply track offset to city positions
  $: offsetFrom = isValid ? { x: from.x + trackOffset.x, y: from.y + trackOffset.y } : from;
  $: offsetTo = isValid ? { x: to.x + trackOffset.x, y: to.y + trackOffset.y } : to;

  // Straight line path (with track offset applied)
  $: path = isValid ? `M ${offsetFrom.x} ${offsetFrom.y} L ${offsetTo.x} ${offsetTo.y}` : '';

  // Shortened path for highlight (stops 15px before each city)
  $: shortenedPath = isValid ? calculateShortenedPath(offsetFrom, offsetTo, 15) : '';

  function calculateShortenedPath(fromPos: { x: number; y: number }, toPos: { x: number; y: number }, inset: number): string {
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

  // Midpoint for label positioning (use offset positions for double tracks)
  $: midX = isValid ? (offsetFrom.x + offsetTo.x) / 2 : 0;
  $: midY = isValid ? (offsetFrom.y + offsetTo.y) / 2 : 0;

  // Calculate angle of the route line in degrees
  $: lineAngle = isValid ? calculateLineAngle(offsetFrom, offsetTo) : 0;

  function calculateLineAngle(fromPos: { x: number; y: number }, toPos: { x: number; y: number }): number {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Keep text readable: flip if angle would make text upside down
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;

    return angle;
  }

  // Calculate perpendicular offsets for labels (one on each side of the line)
  $: labelOffsets = isValid ? calculateLabelOffsets(offsetFrom, offsetTo) : { above: { x: 0, y: 0 }, below: { x: 0, y: 0 } };

  function calculateLabelOffsets(fromPos: { x: number; y: number }, toPos: { x: number; y: number }): { above: { x: number; y: number }; below: { x: number; y: number } } {
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return { above: { x: 0, y: 0 }, below: { x: 0, y: 0 } };

    // Perpendicular direction (rotate 90 degrees)
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const offset = 12;

    return {
      above: { x: perpX * offset, y: perpY * offset },
      below: { x: -perpX * offset, y: -perpY * offset }
    };
  }

  // Only show labels on single tracks or track 1 of double tracks (avoid duplicate labels)
  $: showLabels = !route.track || route.track === 1;

  // For double tracks, add extra offset to move labels away from both lines
  $: doubleTrackExtraOffset = route.track === 1 ? 10 : 0;

  // Determine stroke color based on claim status
  // route.claimed is a playerId, so look up their faction
  $: claimedFaction = route.claimed ? playerFactions[route.claimed] : null;
  $: strokeColor = claimedFaction
    ? FACTION_COLORS[claimedFaction] || '#888'
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

    <!-- Labels on opposite sides of the line (only for unclaimed routes, and only on track 1 for double routes) -->
    {#if !route.claimed && showLabels}
      <!-- Requirements above the line (extra offset for double tracks) -->
      <g transform="translate({midX + labelOffsets.above.x * (1 + doubleTrackExtraOffset / 12)}, {midY + labelOffsets.above.y * (1 + doubleTrackExtraOffset / 12)}) rotate({lineAngle})">
        <text
          class="route-label"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="12"
          font-weight="600"
          fill="#94a3b8"
        >
          {requirements}
        </text>
      </g>
      <!-- Income below the line (extra offset for double tracks) -->
      <g transform="translate({midX + labelOffsets.below.x * (1 + doubleTrackExtraOffset / 12)}, {midY + labelOffsets.below.y * (1 + doubleTrackExtraOffset / 12)}) rotate({lineAngle})">
        <text
          class="route-label"
          text-anchor="middle"
          dominant-baseline="central"
          font-size="12"
          font-weight="600"
          fill="#4ade80"
        >
          +£{route.income}
        </text>
      </g>
    {/if}
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
</style>
