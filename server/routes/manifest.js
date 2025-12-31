/**
 * Manifest Routes
 * Provides static game data (upgrades, technologies, locations, constants)
 * Clients should fetch this once on startup and cache it.
 */

const express = require('express');
const router = express.Router();

const { UPGRADES, TECHNOLOGIES } = require('../data/upgrades');
const {
  GROUND_BOARD_LOCATIONS,
  SYMBOL_ICONS,
  SYMBOL_COLORS
} = require('../data/groundBoard');
const {
  HYDROGEN_PRICE,
  HELIUM_PRICE_TRACK,
  MAX_LOANS,
  LOAN_AMOUNT,
  LOAN_INCOME_PENALTY,
  TURNS_PER_AGE,
  HAND_SIZE,
  INITIAL_AGENTS,
  RD_BOARD_SIZE,
  MARKET_ROW_SIZE,
  OFFICER_RECRUIT_COST,
  ENGINEER_RECRUIT_COST,
  FLIGHT_SCHOOL_COST,
  TECHNICAL_INSTITUTE_COST,
  WEATHER_BUREAU_COST,
  RESEARCH_INSTITUTE_COST,
  MAX_INSURANCE_POLICIES,
  PROGRESS_THRESHOLDS,
  PHASES,
  FACTIONS,
  STARTING_CASH,
  STARTING_INCOME,
  STARTING_OFFICER_INCOME,
  STARTING_ENGINEER_INCOME,
  STARTING_OFFICERS,
  STARTING_ENGINEERS,
  STARTING_HYDROGEN,
  STARTING_HELIUM,
  STARTING_RESEARCH,
  STARTING_INFLUENCE,
  AGE_BASELINES,
  TECHNOLOGY_BAG
} = require('../config/constants');

/**
 * GET /api/manifest
 * Returns all static game data for client caching
 */
router.get('/', (req, res) => {
  res.json({
    // Version for cache invalidation
    version: '1.0.0',

    // Upgrades and Technologies
    upgrades: UPGRADES,
    technologies: TECHNOLOGIES,
    technologyBag: TECHNOLOGY_BAG,

    // Ground Board
    locations: GROUND_BOARD_LOCATIONS,
    symbols: {
      icons: SYMBOL_ICONS,
      colors: SYMBOL_COLORS
    },

    // Constants
    constants: {
      // Gas Market
      hydrogenPrice: HYDROGEN_PRICE,
      heliumPriceTrack: HELIUM_PRICE_TRACK,

      // Loans
      maxLoans: MAX_LOANS,
      loanAmount: LOAN_AMOUNT,
      loanIncomePenalty: LOAN_INCOME_PENALTY,

      // Game Progression
      turnsPerAge: TURNS_PER_AGE,
      handSize: HAND_SIZE,
      initialAgents: INITIAL_AGENTS,

      // Board sizes
      rdBoardSize: RD_BOARD_SIZE,
      marketRowSize: MARKET_ROW_SIZE,

      // Crew Costs
      officerRecruitCost: OFFICER_RECRUIT_COST,
      engineerRecruitCost: ENGINEER_RECRUIT_COST,
      flightSchoolCost: FLIGHT_SCHOOL_COST,
      technicalInstituteCost: TECHNICAL_INSTITUTE_COST,
      weatherBureauCost: WEATHER_BUREAU_COST,
      researchInstituteCost: RESEARCH_INSTITUTE_COST,

      // Insurance
      maxInsurancePolicies: MAX_INSURANCE_POLICIES,

      // Progress Track
      progressThresholds: PROGRESS_THRESHOLDS,

      // Game State
      phases: PHASES,
      factions: FACTIONS,

      // Starting Resources
      startingCash: STARTING_CASH,
      startingIncome: STARTING_INCOME,
      startingOfficerIncome: STARTING_OFFICER_INCOME,
      startingEngineerIncome: STARTING_ENGINEER_INCOME,
      startingOfficers: STARTING_OFFICERS,
      startingEngineers: STARTING_ENGINEERS,
      startingHydrogen: STARTING_HYDROGEN,
      startingHelium: STARTING_HELIUM,
      startingResearch: STARTING_RESEARCH,
      startingInfluence: STARTING_INFLUENCE,

      // Ship Stats
      ageBaselines: AGE_BASELINES
    }
  });
});

module.exports = router;
