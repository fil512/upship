# Phase 18: Pilots, Engineers, and Crew Management

## Overview
Crew management system for pilots and engineers.

## Goals
- [x] Crew tracking in player state - Already implemented
- [x] RECRUIT_CREW action - Already implemented (Phase 09)
- [x] Crew income upgrades - Already implemented (Phase 09)
- [x] Crew display in UI - Already implemented
- [x] Pilots provide safety bonus - Implemented in hazard checks
- [x] Engineers provide research budget - Implemented in research system

## Implementation
Core crew management was implemented in earlier phases:
- Phase 09: Recruit crew, upgrade income
- Phase 16: Pilots add to safety rating
- Phase 10: Engineers provide research points

## Already Implemented
- createPlayerState() includes pilots, engineers, income tracks
- RECRUIT_CREW action (pilots £2, engineers £4)
- UPGRADE_PILOT_INCOME and UPGRADE_ENGINEER_INCOME actions
- Pilot count added to safety rating for hazard checks
- Engineer count added to research budget

## Next Steps
- Phase 19: Rounds
