# Phase 12: Technologies and Drawing Office

## Overview
Complete the technology system with Drawing Office mechanics and technology VP tracking.

## Goals
- [x] Technology acquisition (cash) - Already implemented
- [x] Technology acquisition (research) - Already implemented
- [x] Specialization discounts - Already implemented
- [x] Technology display in player state
- [ ] Drawing Office mechanic (private tech storage) - Future enhancement
- [ ] Technology VP tracking at game end - Future enhancement
- [ ] Technology effects/abilities - Future enhancement

## Implementation

### Drawing Office Mechanic
- Acquired technologies go to Drawing Office first (private)
- Can move from Drawing Office to Active on your turn
- Active techs enable upgrades
- Some techs may have VP only when in Drawing Office

### Technology VP Tracking
- Each technology has VP value
- Sum of tech VPs contributes to final score
- Displayed in player score summary

### Technology Effects
- Some technologies grant ongoing abilities
- Track active effects in player state
- Apply effects during relevant game phases

## Already Implemented
- Technology bag with Age I, II, III tiles
- R&D Board with 4 available technologies
- ACQUIRE_TECHNOLOGY action (cash)
- ACQUIRE_TECHNOLOGY_RESEARCH action (research)
- Specialization discounts (3-4 techs = -1, 5+ = -2)
- Progress Track advancement on acquisition

## Next Steps
- Phase 13: Upgrades
