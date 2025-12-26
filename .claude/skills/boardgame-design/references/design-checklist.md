# Board Game Design Validation Checklist

Use this checklist to validate game designs at various stages of development.

---

## 1. Core Mechanics Validation

### Game Loop
- [ ] Core loop is clearly defined (what players do on their turn)
- [ ] Turn/phase structure is unambiguous
- [ ] The most repeated action is simple, fun, and has depth
- [ ] Game flow feels natural without constant rule lookups
- [ ] Downtime between player turns is acceptable

### Core Constraint
- [ ] A central constraint drives meaningful decisions
- [ ] The constraint creates tension throughout the game
- [ ] Players can strategize around the constraint
- [ ] The constraint is thematically appropriate

### Win Conditions
- [ ] Victory conditions are clear and unambiguous
- [ ] Multiple paths to victory exist (no dominant strategy)
- [ ] Players can assess their progress toward victory
- [ ] Endgame trigger is predictable (no indefinite games)

---

## 2. Player Experience

### Engagement
- [ ] Every turn presents meaningful choices
- [ ] Choices have trade-offs (no obvious optimal plays)
- [ ] Players remain engaged when it's not their turn
- [ ] Game creates memorable moments
- [ ] Steady pacing with no "grinding" phases

### Interaction
- [ ] Opponent actions affect your strategy
- [ ] Players can respond to each other's moves
- [ ] Appropriate level of interaction for target audience
- [ ] No "multiplayer solitaire" unless intended

### Fun Factor
- [ ] Players want to play again after finishing
- [ ] Players talk about the game after playing
- [ ] Close games feel exciting, not frustrating
- [ ] Losing players still had fun

---

## 3. Resource Economy

### Resource Flow
- [ ] All resources have clear acquisition methods
- [ ] Resources have meaningful expenditure sinks
- [ ] Scarcity creates interesting decisions
- [ ] Income and costs are balanced throughout game length
- [ ] No resource becomes irrelevant mid-game

### Action Economy
- [ ] Every action feels valuable
- [ ] Opportunity costs are meaningful
- [ ] Players never feel like they're wasting turns
- [ ] Action scarcity creates prioritization tension

### Progression
- [ ] Resources scale appropriately with game progression
- [ ] Early game decisions impact late game options
- [ ] No runaway economies that become uncontrollable
- [ ] Engine building (if present) is rewarding but bounded

---

## 4. Balance

### Option Balance
- [ ] All starting positions/factions are viable
- [ ] Similar-cost options provide similar value
- [ ] No strictly dominant choices exist
- [ ] Trade-offs are clear and meaningful

### Player Balance
- [ ] First-player advantage is mitigated
- [ ] Trailing players have catch-up potential
- [ ] No player elimination (or it happens late)
- [ ] Game doesn't punish mistakes excessively

### Asymmetry Balance (if applicable)
- [ ] Each faction has multiple viable strategies
- [ ] Faction strengths/weaknesses are balanced
- [ ] Theme justifies mechanical differences
- [ ] Win rates are roughly equal across factions

### Runaway Leader Prevention
- [ ] Leaders face increasing resistance
- [ ] Catch-up mechanisms exist and function
- [ ] Early leads don't guarantee victory
- [ ] Game remains competitive until the end

---

## 5. Rules & Clarity

### Documentation
- [ ] Rules are organized by play order
- [ ] Key terms are defined before use
- [ ] Examples illustrate complex rules
- [ ] Quick reference exists for experienced players

### Edge Cases
- [ ] Timing conflicts have clear resolution
- [ ] Unusual situations are addressed
- [ ] Priority/tiebreakers are defined
- [ ] FAQs answer common questions

### Learnability
- [ ] Rules can be taught in reasonable time
- [ ] First game is playable without constant reference
- [ ] Complexity matches target audience
- [ ] Rulebook has been tested with blind readers

---

## 6. Components & Presentation

### Information Design
- [ ] Game state is visually clear
- [ ] Hidden information is appropriately hidden
- [ ] Players can assess positions without calculation
- [ ] Iconography is consistent and intuitive

### Physical Usability
- [ ] Components are appropriately sized
- [ ] Setup time is reasonable
- [ ] Table space requirements are acceptable
- [ ] Components can be stored efficiently

### Theme Integration
- [ ] Theme enhances rather than confuses mechanics
- [ ] Thematic elements are consistent
- [ ] Art and components support immersion
- [ ] Theme helps players remember rules

---

## 7. Replayability

### Variability
- [ ] Setup variability provides different starting conditions
- [ ] Multiple viable strategies exist
- [ ] Random elements (if any) create interesting variance
- [ ] Games play differently with different player counts

### Depth
- [ ] Skilled players improve over time
- [ ] Strategic depth rewards repeated play
- [ ] Tactics discovered over multiple plays
- [ ] No "solved" state where optimal play is obvious

### Engagement Over Time
- [ ] Game remains interesting after 5+ plays
- [ ] Different player groups find it engaging
- [ ] Expansions (if planned) will add value
- [ ] Metagame can evolve as players improve

---

## 8. Playtesting Status

### Phase Completion
- [ ] Designer solo testing completed
- [ ] Guided playtesting with known groups completed
- [ ] Blind playtesting with external groups completed
- [ ] All feedback has been reviewed and addressed

### Data Collection
- [ ] Win rates tracked by faction/strategy
- [ ] Game length data collected and analyzed
- [ ] Player feedback forms reviewed
- [ ] Rules questions logged and addressed

### Iteration
- [ ] All major balance issues resolved
- [ ] Rules have been clarified based on feedback
- [ ] "Feel" issues (fun factor) have been addressed
- [ ] Final playtest confirms readiness

---

## 9. Scope & Polish

### Scope Check
- [ ] Game length matches target (and reality)
- [ ] Player count range is appropriate
- [ ] Complexity matches target audience
- [ ] No feature creep beyond core design

### Polish
- [ ] All rules exceptions are truly necessary
- [ ] Unnecessary complexity has been removed
- [ ] Mechanics serve multiple purposes where possible
- [ ] Design is as simple as it can be while meeting goals

### Production Readiness
- [ ] All components are specified
- [ ] Art requirements are documented
- [ ] Production costs are understood
- [ ] Rulebook is print-ready

---

## Red Flags to Watch For

### Immediate Concerns
- [ ] No dominant strategy observed (fix if found)
- [ ] No game-breaking combos discovered
- [ ] No situations where games stall indefinitely
- [ ] No player elimination before halfway point

### Common Pitfalls
- [ ] Not overcomplicating in pursuit of depth
- [ ] Not adding asymmetry just because it's trendy
- [ ] Not ignoring consistent player feedback
- [ ] Not assuming designers know better than playtesters

### Final Check
- [ ] Would YOU want to play this game with friends?
- [ ] Is the game distinctly better than similar games?
- [ ] Does the game deliver on its core promise?
- [ ] Are you proud of this design?

---

## Notes for UP SHIP! Specifically

Based on the UP SHIP! design (per CLAUDE.md), pay special attention to:

- [ ] Physics Check (Lift ≥ Weight) creates meaningful engineering decisions
- [ ] Engineer economy balances Research generation vs. emergency response
- [ ] Age transitions feel impactful without being punishing
- [ ] Faction asymmetry is balanced (Germany's Hindenburg risk vs. USA's helium safety)
- [ ] Progress Track creates appropriate game length pressure
- [ ] Deck-building dual-use cards create interesting placement vs. resource decisions
- [ ] Route network building rewards strategic planning
- [ ] Hazard Checks add tension without excessive randomness
