<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FACTION_COLORS } from '$lib/data/mapConfig';
  import { CITY_BONUSES, type CityPosition, type CityBonus } from '$lib/data/cityCoordinates';
  import Icon from '$lib/components/ui/Icon.svelte';
  import type { IconName } from '$lib/icons';

  export let name: string;
  export let position: CityPosition;
  export let type: 'major' | 'minor' = 'minor';
  export let homeBase: string | null = null;

  const dispatch = createEventDispatcher<{ click: { name: string } }>();

  // Get bonus for this city
  $: bonus = CITY_BONUSES[name] as CityBonus | undefined;

  // Sizes for markers - larger if showing bonus (doubled for visibility)
  $: size = bonus ? 40 : (type === 'major' ? 28 : 20);
  $: homeBaseColor = homeBase ? FACTION_COLORS[homeBase] : null;

  // Label offset based on position preference
  $: labelOffset = getLabelOffset(position.labelPosition, size);

  // Map bonus type to icon name (null means use text instead)
  function getBonusIconName(b: CityBonus): IconName | null {
    switch (b.type) {
      case 'officer':
        return 'officers';
      case 'engineer':
        return 'engineers';
      case 'research':
        return 'research';
      case 'influence':
        return 'influence';
      case 'gas':
        return 'gas';
      default:
        return null; // money, card, swap use text
    }
  }

  // Get text display for non-icon bonuses
  function getBonusText(b: CityBonus): { text: string; color: string } {
    switch (b.type) {
      case 'money':
        return { text: b.value.toString(), color: '#fbbf24' };
      case 'card':
        return { text: '📋', color: '#f8fafc' };
      case 'swap':
        return { text: '⇄', color: '#10b981' };
      default:
        return { text: '?', color: '#94a3b8' };
    }
  }

  function getLabelOffset(labelPos: string, markerSize: number): { x: number; y: number; anchor: string } {
    const offset = markerSize / 2 + 6; // 6px gap from marker edge
    switch (labelPos) {
      case 'left':
        return { x: -offset, y: 4, anchor: 'end' };
      case 'right':
        return { x: offset, y: 4, anchor: 'start' };
      case 'top':
        return { x: 0, y: -offset, anchor: 'middle' };
      case 'bottom':
        return { x: 0, y: offset + 8, anchor: 'middle' };
      default:
        return { x: offset, y: 4, anchor: 'start' };
    }
  }

  function handleClick() {
    dispatch('click', { name });
  }
</script>

<g
  class="city"
  class:major={type === 'major'}
  class:has-bonus={!!bonus}
  transform="translate({position.x}, {position.y})"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={(e) => e.key === 'Enter' && handleClick()}
>
  <!-- Home base ring (if applicable) -->
  {#if homeBase}
    <circle
      class="home-base-ring"
      r={size / 2 + 5}
      fill="none"
      stroke={homeBaseColor}
      stroke-width="2.5"
      opacity="0.8"
    />
  {/if}

  <!-- City marker with bonus or plain -->
  {#if bonus}
    <!-- Bonus city: grey circle background with bonus symbol -->
    <circle
      class="city-marker bonus-marker"
      r={size / 2}
      fill="#475569"
      stroke="#64748b"
      stroke-width="1.5"
    />
    {#if getBonusIconName(bonus)}
      <!-- Use SVG Icon for officer, engineer, research, influence, gas -->
      <foreignObject
        x={-size / 2 + 4}
        y={-size / 2 + 4}
        width={size - 8}
        height={size - 8}
      >
        <div class="icon-container">
          <Icon name={getBonusIconName(bonus)} size={size - 12} />
        </div>
      </foreignObject>
    {:else}
      <!-- Use text for money, card, swap -->
      <text
        class="bonus-icon"
        text-anchor="middle"
        dominant-baseline="central"
        font-size={bonus.type === 'money' ? '22' : '20'}
        font-weight="700"
        fill={getBonusText(bonus).color}
      >
        {getBonusText(bonus).text}
      </text>
    {/if}
  {:else}
    <!-- Regular city marker -->
    <circle
      class="city-marker"
      r={size / 2}
      fill={type === 'major' ? '#fbbf24' : '#64748b'}
    />
  {/if}

  <!-- City name label -->
  <text
    class="city-label"
    x={labelOffset.x}
    y={labelOffset.y}
    text-anchor={labelOffset.anchor}
    font-size={type === 'major' ? '13' : '11'}
    font-weight={type === 'major' ? '600' : '400'}
    fill="#e2e8f0"
  >
    {name}
  </text>
</g>

<style>
  .city {
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .city:hover {
    transform: scale(1.1);
  }

  .city:hover .city-marker {
    filter: brightness(1.2);
  }

  .city-marker {
    transition: filter 0.15s ease;
  }

  .bonus-marker {
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }

  .bonus-icon {
    font-family: var(--font-sans);
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .home-base-ring {
    stroke-dasharray: 4 2;
    animation: rotate 20s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .city-label {
    font-family: var(--font-sans);
    font-weight: 500;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    pointer-events: none;
  }

  .major .city-label {
    font-weight: 600;
  }

  .has-bonus .city-label {
    font-weight: 500;
  }
</style>
