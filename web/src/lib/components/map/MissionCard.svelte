<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Mission } from '$lib/types/game';
  import { FACTION_COLORS } from '$lib/data/mapConfig';

  export let mission: Mission;
  export let selectable: boolean = false;
  export let completed: boolean = false;

  const dispatch = createEventDispatcher<{ select: { mission: Mission } }>();

  $: isClaimed = !!mission.claimed;
  $: claimedColor = mission.claimed ? FACTION_COLORS[mission.claimed] : null;

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
      default:
        return type;
    }
  }

  function getMissionTypeIcon(type: string): string {
    switch (type) {
      case 'bombing_run':
        return '💣';
      case 'reconnaissance':
        return '🔭';
      case 'transport':
        return '📦';
      case 'patrol':
        return '🛡️';
      default:
        return '✈️';
    }
  }

  function handleClick() {
    if (selectable && !isClaimed && !completed) {
      dispatch('select', { mission });
    }
  }
</script>

<button
  class="mission-card"
  class:selectable={selectable && !isClaimed && !completed}
  class:claimed={isClaimed}
  class:completed
  class:bombing={mission.type === 'bombing_run'}
  class:recon={mission.type === 'reconnaissance'}
  class:transport={mission.type === 'transport'}
  class:patrol={mission.type === 'patrol'}
  style:--claimed-color={claimedColor}
  on:click={handleClick}
  disabled={!selectable || isClaimed || completed}
>
  <div class="mission-header">
    <span class="mission-icon">{getMissionTypeIcon(mission.type)}</span>
    <span class="mission-type">{getMissionTypeLabel(mission.type)}</span>
    <span class="mission-vp">{mission.vp} VP</span>
  </div>

  <h4 class="mission-name">{mission.name}</h4>

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

  <div class="mission-reward">
    <span class="income">+£{mission.income}</span>
  </div>

  {#if mission.specialBonus}
    <div class="mission-special">
      {mission.specialBonus.description}
    </div>
  {/if}

  {#if isClaimed}
    <div class="claimed-badge">Assigned</div>
  {/if}

  {#if completed}
    <div class="completed-badge">Completed</div>
  {/if}
</button>

<style>
  .mission-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: var(--space-sm);
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    min-width: 160px;
    max-width: 200px;
    text-align: left;
    cursor: default;
    transition: all 0.2s ease;
    position: relative;
  }

  .mission-card.selectable {
    cursor: pointer;
    border-color: var(--color-accent-gold);
  }

  .mission-card.selectable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: var(--color-accent-gold);
  }

  .mission-card.claimed {
    opacity: 0.7;
    border-color: var(--claimed-color, var(--color-success));
  }

  .mission-card.completed {
    opacity: 0.5;
    border-color: var(--color-success);
  }

  .mission-header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.75rem;
  }

  .mission-icon {
    font-size: 1rem;
  }

  .mission-type {
    color: var(--color-text-muted);
    text-transform: uppercase;
    font-weight: 500;
    flex: 1;
  }

  .mission-vp {
    color: var(--color-accent-gold);
    font-weight: 600;
  }

  .mission-name {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .mission-requirements {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .req {
    background: var(--color-bg-tertiary);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    font-size: 0.7rem;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
  }

  .mission-reward {
    margin-top: auto;
  }

  .income {
    color: var(--color-success);
    font-weight: 600;
    font-size: 0.85rem;
  }

  .mission-special {
    font-size: 0.7rem;
    font-style: italic;
    color: var(--color-accent-gold);
    padding-top: var(--space-xs);
    border-top: 1px solid var(--color-border);
  }

  .claimed-badge,
  .completed-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .claimed-badge {
    background: var(--claimed-color, var(--color-warning));
    color: white;
  }

  .completed-badge {
    background: var(--color-success);
    color: white;
  }

  /* Mission type accent colors */
  .bombing {
    border-left: 3px solid #ef4444;
  }

  .recon {
    border-left: 3px solid #3b82f6;
  }

  .transport {
    border-left: 3px solid #22c55e;
  }

  .patrol {
    border-left: 3px solid #f59e0b;
  }
</style>
