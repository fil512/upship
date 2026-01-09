/**
 * Combat Missions Data - Age II
 * Per Appendix G: 20 Combat Mission cards for The Great War
 */

import type { GameState, PlayerState } from '@upship/api';

export type CombatMissionType =
  | 'bombing_run'
  | 'reconnaissance'
  | 'resupply'
  | 'naval_patrol'
  | 'artillery_observation';

export interface SpecialBonus {
  income?: number;
  vp?: number;
  range?: number;
  description: string;
}

export interface CombatMission {
  id: string;
  name: string;
  type: CombatMissionType;
  range: number;       // Prerequisite: ship Range must meet or exceed
  speed?: number;      // Prerequisite: ship Speed must meet or exceed (if specified)
  ceiling?: number;    // Prerequisite: ship Ceiling must meet or exceed (if specified)
  difficulty?: number; // Added to hazard check difficulty; offset by ship Reliability
  income: number;
  vp: number;
  bonusVp?: number;
  special: string | null;
  specialBonus?: SpecialBonus;
}

/* eslint-disable sonarjs/pseudo-random */

/**
 * All 20 Combat Mission cards per Appendix G
 */
export const COMBAT_MISSIONS: CombatMission[] = [
  // Bombing Runs (6 cards)
  {
    id: 'railway_bombardment',
    name: 'Railway Bombardment',
    type: 'bombing_run',
    range: 2,
    ceiling: 1,
    difficulty: 2,
    income: 6,
    vp: 1,
    special: null
  },
  {
    id: 'factory_strike',
    name: 'Factory Strike',
    type: 'bombing_run',
    range: 3,
    ceiling: 2,
    difficulty: 2,
    income: 8,
    vp: 2,
    special: null
  },
  {
    id: 'port_assault',
    name: 'Port Assault',
    type: 'bombing_run',
    range: 3,
    ceiling: 1,
    difficulty: 3,
    income: 8,
    vp: 2,
    special: null
  },
  {
    id: 'deep_strike_mission',
    name: 'Deep Strike Mission',
    type: 'bombing_run',
    range: 4,
    ceiling: 2,
    difficulty: 2,
    income: 10,
    vp: 3,
    special: 'bombing_equipment_bonus',
    specialBonus: { income: 2, description: '+£2 with Bombing Equipment' }
  },
  {
    id: 'strategic_bombardment',
    name: 'Strategic Bombardment',
    type: 'bombing_run',
    range: 4,
    ceiling: 2,
    difficulty: 3,
    income: 11,
    vp: 4,
    special: 'bombing_equipment_bonus',
    specialBonus: { income: 3, description: '+£3 with Bombing Equipment' }
  },
  {
    id: 'capital_raid',
    name: 'Capital Raid',
    type: 'bombing_run',
    range: 5,
    ceiling: 3,
    difficulty: 3,
    income: 14,
    vp: 5,
    bonusVp: 1,
    special: 'prestige',
    specialBonus: { vp: 1, description: 'Prestige: +1 bonus VP' }
  },

  // Reconnaissance (5 cards)
  {
    id: 'front_line_survey',
    name: 'Front Line Survey',
    type: 'reconnaissance',
    range: 2,
    speed: 2,
    ceiling: 1,
    income: 5,
    vp: 1,
    special: null
  },
  {
    id: 'artillery_spotting',
    name: 'Artillery Spotting',
    type: 'reconnaissance',
    range: 2,
    speed: 1,
    ceiling: 2,
    income: 5,
    vp: 1,
    special: null
  },
  {
    id: 'enemy_position_mapping',
    name: 'Enemy Position Mapping',
    type: 'reconnaissance',
    range: 3,
    speed: 2,
    ceiling: 2,
    income: 7,
    vp: 2,
    special: null
  },
  {
    id: 'strategic_photography',
    name: 'Strategic Photography',
    type: 'reconnaissance',
    range: 4,
    speed: 2,
    ceiling: 3,
    income: 9,
    vp: 3,
    bonusVp: 1,
    special: 'bonus_vp'
  },
  {
    id: 'deep_reconnaissance',
    name: 'Deep Reconnaissance',
    type: 'reconnaissance',
    range: 4,
    speed: 3,
    ceiling: 2,
    income: 10,
    vp: 3,
    special: 'draw_two_hazards',
    specialBonus: { description: 'Draw 2 Hazard cards, choose 1' }
  },

  // Resupply Missions (5 cards)
  {
    id: 'field_hospital_supply',
    name: 'Field Hospital Supply',
    type: 'resupply',
    range: 2,
    speed: 1,
    difficulty: 2,
    income: 5,
    vp: 1,
    special: null
  },
  {
    id: 'ammunition_delivery',
    name: 'Ammunition Delivery',
    type: 'resupply',
    range: 3,
    speed: 2,
    difficulty: 2,
    income: 7,
    vp: 2,
    special: null
  },
  {
    id: 'forward_base_resupply',
    name: 'Forward Base Resupply',
    type: 'resupply',
    range: 3,
    speed: 1,
    difficulty: 3,
    income: 7,
    vp: 2,
    special: null
  },
  {
    id: 'emergency_provisions',
    name: 'Emergency Provisions',
    type: 'resupply',
    range: 4,
    speed: 3,
    difficulty: 2,
    income: 9,
    vp: 3,
    special: null
  },
  {
    id: 'siege_relief',
    name: 'Siege Relief',
    type: 'resupply',
    range: 4,
    speed: 2,
    difficulty: 3,
    income: 10,
    vp: 3,
    bonusVp: 1,
    special: 'bonus_vp'
  },

  // Naval Patrols (2 cards)
  {
    id: 'coastal_patrol',
    name: 'Coastal Patrol',
    type: 'naval_patrol',
    range: 3,
    speed: 2,
    difficulty: 2,
    income: 6,
    vp: 1,
    special: 'ignore_weather',
    specialBonus: { description: 'Ignore 1 Weather hazard' }
  },
  {
    id: 'submarine_hunter',
    name: 'Submarine Hunter',
    type: 'naval_patrol',
    range: 4,
    speed: 2,
    difficulty: 3,
    income: 9,
    vp: 3,
    special: 'communications_bonus',
    specialBonus: { income: 2, description: '+£2 with Communications Suite' }
  },

  // Artillery Observation (2 cards)
  {
    id: 'battery_direction',
    name: 'Battery Direction',
    type: 'artillery_observation',
    range: 2,
    ceiling: 2,
    difficulty: 2,
    income: 6,
    vp: 1,
    special: null
  },
  {
    id: 'long_range_observation',
    name: 'Long-Range Observation',
    type: 'artillery_observation',
    range: 3,
    ceiling: 3,
    difficulty: 2,
    income: 8,
    vp: 2,
    special: 'spotter_gondola_bonus',
    specialBonus: { range: 1, description: '+1 Range with Spotter Gondola' }
  }
];

/**
 * Create a shuffled combat mission deck
 * @returns Shuffled array of mission cards
 */
export function createCombatMissionDeck(): CombatMission[] {
  const deck = [...COMBAT_MISSIONS];
  // Fisher-Yates shuffle (Math.random() is appropriate for game card shuffling)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Set up the Mission Row for Age II
 * Per Appendix G: "deal 6 missions face-up to form the Mission Row"
 * @returns { missionRow, missionDeck }
 */
export function setupMissionRow(): { missionRow: CombatMission[]; missionDeck: CombatMission[] } {
  const deck = createCombatMissionDeck();
  const missionRow = deck.splice(0, 6);
  return {
    missionRow,
    missionDeck: deck
  };
}

interface GameStateWithMissions extends GameState {
  missionRow: CombatMission[];
  missionDeck: CombatMission[];
}

interface PlayerStateWithMissions extends PlayerState {
  completedMissions?: CombatMission[];
}

/**
 * Refill the Mission Row to 6 cards
 * Per Appendix G: "After each successful mission, refill to 6 cards"
 * @param state - Game state with missionRow and missionDeck
 */
export function refillMissionRow(state: GameStateWithMissions): void {
  while (state.missionRow.length < 6 && state.missionDeck.length > 0) {
    const mission = state.missionDeck.shift();
    if (mission) {
      state.missionRow.push(mission);
    }
  }

  // If deck is empty and we still need cards, shuffle completed missions
  if (state.missionRow.length < 6) {
    // Gather all completed missions from all players
    const completedMissions: CombatMission[] = [];
    for (const playerId of Object.keys(state.players)) {
      const player = state.players[playerId] as PlayerStateWithMissions;
      if (player.completedMissions) {
        completedMissions.push(...player.completedMissions.map(m => ({ ...m })));
      }
    }

    if (completedMissions.length > 0) {
      // Shuffle completed missions
      for (let i = completedMissions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [completedMissions[i], completedMissions[j]] = [completedMissions[j], completedMissions[i]];
      }
      state.missionDeck = completedMissions;

      // Continue refilling
      while (state.missionRow.length < 6 && state.missionDeck.length > 0) {
        const mission = state.missionDeck.shift();
        if (mission) {
          state.missionRow.push(mission);
        }
      }
    }
  }
}

// CommonJS compatibility
module.exports = {
  COMBAT_MISSIONS,
  createCombatMissionDeck,
  setupMissionRow,
  refillMissionRow
};
