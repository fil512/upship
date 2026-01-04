/**
 * Rules Compliance Tests - Deck Building
 * Tests for correct implementation of Section 11 (Starter Deck and Market)
 */

describe('Rules Compliance - Deck Building', () => {

  describe('GAP-003: Starter Deck Composition', () => {
    // Import directly inside describe to avoid module resolution issues
    const { createStarterDeck } = (() => {
      // We'll need to expose or duplicate this function
      // For now, we test the result from gameStateService
      return { createStarterDeck: null };
    })();

    it('should have exactly 10 cards per Section 11.3', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../../../server/services/gameStateService.ts'),
        'utf8'
      );

      // The starter deck should contain exactly 10 cards
      // We check if the createStarterDeck function returns 10 cards
      // Match both JS `function createStarterDeck() {` and TS `function createStarterDeck(): Type {`
      const deckMatch = content.match(/function createStarterDeck\(\)[^{]*\{[\s\S]*?return\s*\[([\s\S]*?)\];/);
      expect(deckMatch).toBeTruthy();

      // Count the number of objects in the array (by counting 'id:')
      const cardsMatch = deckMatch[1].match(/\{\s*id:/g);
      expect(cardsMatch.length).toBe(10);
    });

    it('should have distribution: 3 Wrench, 3 Coin, 3 Propeller, 1 Any per Section 11.3', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../../../server/services/gameStateService.ts'),
        'utf8'
      );

      // Count symbols in the starter deck
      const wrenchCount = (content.match(/symbol:\s*['"]wrench['"]/g) || []).length;
      const coinCount = (content.match(/symbol:\s*['"]coin['"]/g) || []).length;
      const propellerCount = (content.match(/symbol:\s*['"]propeller['"]/g) || []).length;
      const anyCount = (content.match(/symbol:\s*['"]any['"]/g) || []).length;

      expect(wrenchCount).toBe(3);
      expect(coinCount).toBe(3);
      expect(propellerCount).toBe(3);
      expect(anyCount).toBe(1);
    });

    it('should include all 10 named cards from Section 11.3', () => {
      const fs = require('fs');
      const path = require('path');
      const content = fs.readFileSync(
        path.join(__dirname, '../../../server/services/gameStateService.ts'),
        'utf8'
      );

      // All card names that should be present (per Section 11.3)
      const expectedCards = [
        'Apprentice',  // 1 Any
        'Mechanic',    // Wrench
        'Draftsman',   // Wrench
        'Rigger',      // Wrench
        'Purser',      // Coin
        'Clerk',       // Coin
        'Investor',    // Coin
        'Researcher',  // Propeller
        'Helmsman',    // Propeller
        'Navigator'    // Propeller
      ];

      for (const cardName of expectedCards) {
        const regex = new RegExp(`name:\\s*['"]${cardName}['"]`);
        expect(content).toMatch(regex);
      }
    });
  });
});
