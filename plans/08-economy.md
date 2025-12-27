# Phase 08: Economy System

## Overview
Implement the economy system including income collection, loans, and economy tracks.

## Goals
- [x] Add income collection phase action
- [x] Implement crew income (Pilots, Engineers)
- [x] Add loan action at The Bank
- [x] Handle negative income and bankruptcy
- [x] Display economy status in UI
- [x] Add income from routes

## Implementation

### Economy Actions

**COLLECT_INCOME:**
- Collect cash equal to Income Track value
- Gain Pilots equal to Pilot Income Track
- Gain Engineers equal to Engineer Income Track
- Handle negative income (pay from cash, discard techs if bankrupt)

**TAKE_LOAN:**
- Gain £30 immediately
- Reduce Income Track by 3 (permanent)
- Minimum income is 0 (goes negative for debt)

### Route Income
When a route is claimed:
- Add route's income value to player's Income Track
- Route income = Range requirement + Age bonus + Luxury bonus

### Income Phase
At the end of each round:
- All players collect income simultaneously
- If income is negative, must pay from cash
- If cannot pay, must discard technologies

### Bankruptcy
If Income Track goes negative and cannot pay:
- Discard Technologies from Drawing Office
- Each Technology discarded reduces debt by its £ value

### UI Updates
- Show income track prominently
- Add loan button with warning
- Show income breakdown tooltip
- Highlight bankruptcy state

## Next Steps
- Phase 09: Ground Board (worker placement)
