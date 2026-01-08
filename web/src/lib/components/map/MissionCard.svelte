<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Mission } from '$lib/types/game';
  import { FACTION_COLORS } from '$lib/data/mapConfig';
  import { getMissionImageFilename } from '$lib/utils/cardImages';
  import Icon from '$lib/components/ui/Icon.svelte';
  import type { IconName } from '$lib/icons/types';

  export let mission: Mission;
  export let selectable: boolean = false;
  export let completed: boolean = false;

  const dispatch = createEventDispatcher<{ select: { mission: Mission } }>();

  $: isClaimed = !!mission.claimed;
  $: claimedColor = mission.claimed ? FACTION_COLORS[mission.claimed] : null;
  $: imageFilename = getMissionImageFilename(mission.name);

  // Mission type colors for wartime theme
  const TYPE_COLORS: Record<string, string> = {
    bombing_run: '#8b2020',    // Dark red
    reconnaissance: '#2d4a6b', // Navy blue
    transport: '#3d5c3d',      // Military green
    patrol: '#5c4d2d',         // Khaki/brown
    resupply: '#3d5c3d'        // Military green
  };

  // Mission type to icon mapping (clear, colorful icons)
  const TYPE_ICONS: Record<string, IconName> = {
    bombing_run: 'bomb',
    reconnaissance: 'telescope',
    transport: 'parachute',
    patrol: 'patrol',
    resupply: 'parachute',
    naval_patrol: 'patrol',
    artillery_observation: 'telescope'
  };

  function getMissionTypeLabel(type: string): string {
    switch (type) {
      case 'bombing_run':
        return 'Bombing Run';
      case 'reconnaissance':
        return 'Recon';
      case 'transport':
        return 'Transport';
      case 'patrol':
        return 'Patrol';
      case 'resupply':
        return 'Resupply';
      default:
        return type;
    }
  }

  function handleClick() {
    if (selectable && !isClaimed && !completed) {
      dispatch('select', { mission });
    }
  }

  $: typeColor = TYPE_COLORS[mission.type] || '#4a4a4a';
  $: typeIcon = TYPE_ICONS[mission.type] || 'ship';
</script>

<button
  class="mission-card"
  class:selectable={selectable && !isClaimed && !completed}
  class:claimed={isClaimed}
  class:completed
  style:--type-color={typeColor}
  style:--claimed-color={claimedColor}
  on:click={handleClick}
  disabled={!selectable || isClaimed || completed}
>
  <!-- Header: Icon + Type (left) + VP (right) -->
  <div class="card-header">
    <span class="mission-icon">
      <Icon name={typeIcon} size={20} />
    </span>
    <span class="mission-type">{getMissionTypeLabel(mission.type)}</span>
    <span class="mission-vp">{mission.vp} VP</span>
  </div>

  <!-- Center: Image area for artwork -->
  <div class="card-image-area">
    <img
      src="/cards/mission/{imageFilename}.png"
      alt=""
      class="card-image"
      on:error={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'}
    />
  </div>

  <!-- Mission name -->
  <div class="mission-name">{mission.name}</div>

  <!-- Requirements row -->
  <div class="mission-requirements">
    {#if mission.range}
      <span class="req" title="Range">R{mission.range}</span>
    {/if}
    {#if mission.speed}
      <span class="req" title="Speed">S{mission.speed}</span>
    {/if}
    {#if mission.ceiling}
      <span class="req" title="Ceiling">C{mission.ceiling}</span>
    {/if}
    {#if mission.reliability}
      <span class="req" title="Reliability">Rel{mission.reliability}</span>
    {/if}
  </div>

  <!-- Reward section -->
  <div class="card-reward">
    <span class="income">+£{mission.income}</span>
    {#if mission.specialBonus}
      <span class="bonus">{mission.specialBonus.description}</span>
    {/if}
  </div>

  <!-- Status badges -->
  {#if isClaimed}
    <div class="status-badge claimed">Assigned</div>
  {/if}

  {#if completed}
    <div class="status-badge completed">Completed</div>
  {/if}
</button>

<style>
  .mission-card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 150px;
    max-width: 180px;
    min-height: 260px;
    padding: 0;
    margin: 0;
    /* Wartime khaki/olive base */
    background: #4a473d;
    border: 2px solid #5c584a;
    border-radius: var(--radius-md);
    cursor: default;
    transition: all var(--transition-fast);
    overflow: hidden;
  }

  .mission-card.selectable {
    cursor: pointer;
    border-color: #8b7355;
  }

  .mission-card.selectable:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(139, 32, 32, 0.4);
    border-color: #a08060;
  }

  .mission-card.claimed {
    opacity: 0.7;
    border-color: var(--claimed-color, #666);
  }

  .mission-card.completed {
    opacity: 0.5;
    border-color: #666;
  }

  .mission-card:disabled {
    cursor: not-allowed;
  }

  /* Header section */
  .card-header {
    display: flex;
    align-items: center;
    padding: 4px 6px;
    gap: 4px;
    /* Dark military header */
    background: #2d2b26;
    border-bottom: 1px solid #5c584a;
  }

  .mission-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .mission-type {
    flex: 1;
    font-size: 0.6rem;
    font-weight: 600;
    color: #a09080;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .mission-vp {
    font-size: 0.7rem;
    font-weight: 700;
    color: #c9a227;
    flex-shrink: 0;
  }

  /* Image area for artwork */
  .card-image-area {
    flex: 1;
    min-height: 110px;
    /* Tinted with mission type color */
    background: linear-gradient(135deg, var(--type-color) 0%, #3a3830 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Mission name */
  .mission-name {
    font-size: 0.65rem;
    font-weight: 600;
    color: #d4c8b0;
    text-align: center;
    padding: 4px 6px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid #5c584a;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    line-height: 1.2;
  }

  /* Requirements */
  .mission-requirements {
    display: flex;
    gap: 4px;
    padding: 4px 6px;
    justify-content: center;
    flex-wrap: wrap;
    background: #3a3830;
  }

  .req {
    background: #2d2b26;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.65rem;
    font-family: var(--font-mono);
    color: #b0a090;
    border: 1px solid #5c584a;
  }

  /* Reward section */
  .card-reward {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: #2d2b26;
    border-top: 1px solid #5c584a;
  }

  .income {
    color: #6b8e6b;
    font-weight: 700;
    font-size: 0.8rem;
  }

  .bonus {
    font-size: 0.55rem;
    font-style: italic;
    color: #c9a227;
    text-align: center;
    line-height: 1.2;
  }

  /* Status badges */
  .status-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .status-badge.claimed {
    background: var(--claimed-color, #8b6914);
    color: white;
  }

  .status-badge.completed {
    background: #4a7c4a;
    color: white;
  }
</style>
