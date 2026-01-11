<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import MissionCard from './MissionCard.svelte';
  import type { Mission } from '$lib/types/game';

  export let missions: Mission[] = [];
  export let selectable: boolean = false;

  const dispatch = createEventDispatcher<{ select: { mission: Mission } }>();

  // Split missions into available and completed
  $: availableMissions = missions.filter((m) => !m.completedBy);
  $: completedMissions = missions.filter((m) => m.completedBy);

  function handleMissionSelect(event: CustomEvent<{ mission: Mission }>) {
    dispatch('select', event.detail);
  }
</script>

<div class="mission-view">
  <div class="mission-header">
    <h3>Combat Missions</h3>
    <span class="mission-count">{availableMissions.length} available</span>
  </div>

  {#if availableMissions.length === 0}
    <div class="empty-state">
      <p>No missions available. The war is over!</p>
    </div>
  {:else}
    <div class="mission-row">
      {#each availableMissions as mission (mission.id)}
        <MissionCard {mission} {selectable} on:select={handleMissionSelect} />
      {/each}
    </div>
  {/if}

  {#if completedMissions.length > 0}
    <div class="completed-section">
      <h4>Completed Missions</h4>
      <div class="completed-row">
        {#each completedMissions as mission (mission.id)}
          <MissionCard {mission} completed={true} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .mission-view {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
    /* Wartime atmosphere background */
    background: linear-gradient(180deg, #1a1916 0%, #242220 100%);
    border-radius: var(--radius-md);
    min-height: 400px;
    flex: 1;
    height: 100%;
    border: 1px solid #3a3830;
  }

  .mission-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid #4a473d;
  }

  .mission-header h3 {
    margin: 0;
    font-size: 1.1rem;
    /* Military gold/brass color */
    color: #c9a227;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .mission-count {
    font-size: 0.85rem;
    color: #8a8070;
  }

  .mission-row {
    display: flex;
    gap: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #6a6050;
    font-style: italic;
  }

  .completed-section {
    margin-top: auto;
    padding-top: var(--space-md);
    border-top: 1px solid #4a473d;
  }

  .completed-section h4 {
    margin: 0 0 var(--space-sm) 0;
    font-size: 0.9rem;
    color: #8a8070;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .completed-row {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
    opacity: 0.7;
  }

  .completed-row :global(.mission-card) {
    transform: scale(0.85);
  }
</style>
