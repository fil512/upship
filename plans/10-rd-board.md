# Phase 10: R&D Board and Technology Market

## Overview
Enhance the R&D Board with proper research mechanics and technology acquisition.

## Goals
- [x] Add research tracking per player
- [x] Implement technology acquisition with research cost
- [x] Add specialization discounts
- [x] Track and display Progress Track
- [x] Implement technology bag system
- [x] Enhance R&D board display in UI

## Implementation

### Research Tracking
- Research tokens saved between rounds
- Budget = Engineers + Card bonuses
- Specialization discount: 3-4 techs = -1 Research, 5+ = -2

### Technology Acquisition
- ACQUIRE_TECHNOLOGY_RESEARCH action (uses research instead of cash)
- Progress Track advances on each acquisition
- Remove from R&D board, refill from bag

### Progress Track
- Triggers Age transitions at thresholds
- 2P: Age I ends at 6, Age II at 12, Game at 18
- 3P: Age I ends at 8, Age II at 16, Game at 24
- 4P: Age I ends at 10, Age II at 20, Game at 30

### Technology Bag
- Contains Age-appropriate tiles
- New tiles added at Age transitions
- Random draw to refill R&D board

## Next Steps
- Phase 11: Map Boards
