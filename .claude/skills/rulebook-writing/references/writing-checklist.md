# UP SHIP! Rulebook Writing Checklist

Validation checklist for ensuring rules are complete, clear, and consistent.

## Section Completeness Checklist

### Core Sections

- [ ] **Overview (§1)** - Victory condition stated, game end triggers listed, thematic context provided
- [ ] **Glossary** - All capitalized game terms defined with section references
- [ ] **Components (§2)** - All physical components listed with quantities
- [ ] **Player Board (§3)** - All zones described, Blueprint mechanics explained
- [ ] **Technology System (§4)** - Acquisition, tracks, discounts, and upgrade installation covered
- [ ] **Routes (§5)** - Route types, requirements, claiming procedure, Income explained
- [ ] **Game Loop (§6)** - All phases defined with clear start/end conditions
- [ ] **Building & Launching (§7)** - Physics Check, Hazard Check, Fire rules complete
- [ ] **Deck Building (§8)** - Starting deck, Market purchases, card anatomy explained
- [ ] **Age Transitions (§9)** - What persists, what resets, Blueprint swap procedure
- [ ] **Factions (§10)** - All four factions with unique abilities documented

### Appendices

- [ ] **Appendix A** - TODO/Design Notes (for development tracking)
- [ ] **Appendix B** - Quick Reference card content
- [ ] **Appendix C** - All Technology tiles listed with stats
- [ ] **Appendix D** - All Upgrade tiles listed with stats
- [ ] **Appendix E** - Hazard Deck composition and card effects
- [ ] **Appendix F** - Market Deck composition and card effects

---

## Terminology Consistency Checklist

### Primary Game Terms

Verify these terms are used consistently throughout:

| Correct Term | Check All Sections Use This |
|--------------|----------------------------|
| Agent | Never "worker" or "meeple" |
| Blueprint | Never "ship design" or "schematic" |
| Gas Cube | Never "gas token" or "lifting gas token" |
| Hazard Check | Never "danger roll" or "risk test" |
| Install | Never "attach" or "place" (for upgrades) |
| Claim (route) | Never "take" or "capture" |
| Acquire (technology) | Never "buy" or "purchase" |
| Launch | Never "deploy" or "send" |
| Physics Check | Never "lift check" or "weight check" |
| Drawing Office | Never "technology area" or "tech display" |
| Barracks | Never "crew area" or "personnel zone" |
| Hangar Bay | Never "ship area" |
| Gas Reserve | Never "gas storage" |

### Resource Terms

| Resource | Standard Phrasing |
|----------|-------------------|
| Research | "Spend X Research" not "pay X Research" |
| Cash (£) | "Pay £X" or "Costs £X" |
| Officers | "Spend X Officer(s)" |
| Engineers | "Spend X Engineer(s)" |

### Phase Names

| Phase | Capitalization |
|-------|----------------|
| Worker Placement | Both words capitalized |
| Reveal Phase | Both words capitalized |
| Income Phase | Both words capitalized |
| Cleanup Phase | Both words capitalized |

---

## Cross-Reference Verification

### Critical System Links

Verify these cross-references exist and are accurate:

- [ ] Blueprint (§3.2) references Technology (§4) and Launch (§7)
- [ ] Physics Check references Gas Cubes (§4.4) and Weight calculation
- [ ] Hazard Check (§7.3) references Ship Stats (§3.7) and Appendix E
- [ ] Successful launches reference Progress Track advancement (§1.3)
- [ ] Age Transitions (§9) references all systems that change
- [ ] Each appendix tile/card has stats matching in-section descriptions

### Forward Reference Warnings

Ensure any forward reference includes a brief explanation:

```markdown
# Bad
"Gas Cubes provide Lift (see §4.4)."

# Good
"Gas Cubes—tokens providing +5 Lift each—are explained in §4.4."
```

---

## Formatting Checklist

### Headers

- [ ] All main sections use `# N. TITLE` format
- [ ] Subsections use `## N.N Title` format
- [ ] Sub-subsections use `### N.N.N Title` format
- [ ] No skipped header levels (e.g., # then ### without ##)

### Bold Usage

- [ ] First mention of each defined term is **bold**
- [ ] Key points and warnings are **bold**
- [ ] Cross-references are bold: "See **Section 7.3**"
- [ ] Not overused (less than 10% of text)

### Tables

- [ ] Used for comparing options (costs, stats, effects)
- [ ] Headers are clear and consistent
- [ ] Alignment is consistent within tables
- [ ] All tables have at least 2 columns

### Lists

- [ ] Numbered lists for sequential procedures
- [ ] Bullet lists for unordered items
- [ ] Consistent punctuation (periods or no periods, not mixed)

### Examples

- [ ] Complex procedures have at least one example
- [ ] Examples use blockquote format (`>`)
- [ ] Examples use realistic player names (Anna, Maria, etc.)
- [ ] Examples demonstrate the rule, not just restate it

---

## Clarity Checklist

### Sentence Structure

- [ ] Instructions start with verbs ("Draw 2 cards" not "You draw 2 cards")
- [ ] Active voice preferred over passive
- [ ] Sentences are under 25 words where possible
- [ ] No ambiguous pronouns ("it", "they" without clear referent)

### Definitions Before Use

- [ ] Every capitalized term is defined before first use
- [ ] Or includes inline definition: "**Hazard Check**—a test against your ship stats"

### Edge Cases

- [ ] "What if" scenarios addressed for each major procedure
- [ ] Ties and simultaneous effects have resolution rules
- [ ] Empty/zero cases handled ("If you have no Officers...")
- [ ] Optional vs. mandatory clearly distinguished ("may" vs. "must")

---

## UP SHIP! Specific Checks

### Physics System

- [ ] Lift formula clearly stated (Gas Cubes × 5)
- [ ] Weight calculation explained (sum of Upgrade weights)
- [ ] Physics Check requirement explicit (Lift ≥ Weight)
- [ ] What happens on failure documented

### Three Ages

- [ ] Each Age's Blueprint stats documented
- [ ] Age transition procedure complete
- [ ] What carries over vs. resets is explicit
- [ ] Progress Track thresholds listed per player count

### Factions

- [ ] All four factions (Germany, Britain, USA, Italy) documented
- [ ] Unique abilities described with mechanical effects
- [ ] Any constraints or limitations noted
- [ ] Starting differences (if any) specified

### Hazard System

- [ ] Fire hazard rules complete (Hydrogen vulnerability)
- [ ] Helium immunity explicit
- [ ] Engineer reactive spending explained
- [ ] Crash conditions and effects documented

---

## Pre-Publication Checklist

### Final Review

- [ ] Spell check completed
- [ ] Section numbers are sequential (no gaps, no duplicates)
- [ ] All cross-references point to correct sections
- [ ] Table of contents matches actual sections
- [ ] Page numbers (if applicable) are accurate
- [ ] Quick reference matches main rules

### Playtest Validation

- [ ] Rules tested with players reading only the rulebook
- [ ] Common questions documented and answered in rules
- [ ] Confusing sections identified and rewritten
- [ ] Example scenarios validated against actual play

### Visual Elements

- [ ] Component images labeled
- [ ] Setup diagram included
- [ ] Player board zones illustrated
- [ ] Ground Board locations shown
- [ ] Icons match components

---

## Revision Tracking

When updating rules, document:

| Date | Section | Change | Reason |
|------|---------|--------|--------|
| YYYY-MM-DD | §X.X | [Description] | [Why changed] |
