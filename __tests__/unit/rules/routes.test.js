/**
 * Rules Compliance Tests - Routes and City Bonuses
 * Tests for correct implementation of Section 10.4 (City Bonuses)
 */

const { createTestGameState } = require('../../fixtures/testData');
const { CITY_BONUSES } = require('../../../server/data/cities');

describe('Rules Compliance - Routes and City Bonuses', () => {

  describe('GAP-022: City Bonuses data per Section 10.4', () => {
    it('should have London bonus of +£3', () => {
      expect(CITY_BONUSES.London).toBeDefined();
      expect(CITY_BONUSES.London.cash).toBe(3);
    });

    it('should have Paris bonus of +1 Influence', () => {
      expect(CITY_BONUSES.Paris).toBeDefined();
      expect(CITY_BONUSES.Paris.influence).toBe(1);
    });

    it('should have Berlin bonus of +1 Research', () => {
      expect(CITY_BONUSES.Berlin).toBeDefined();
      expect(CITY_BONUSES.Berlin.research).toBe(1);
    });

    it('should have Frankfurt bonus of +£2', () => {
      expect(CITY_BONUSES.Frankfurt).toBeDefined();
      expect(CITY_BONUSES.Frankfurt.cash).toBe(2);
    });

    it('should have Hamburg bonus of +1 Hydrogen cube', () => {
      expect(CITY_BONUSES.Hamburg).toBeDefined();
      expect(CITY_BONUSES.Hamburg.hydrogen).toBe(1);
    });

    it('should have Brussels bonus of +1 Officer', () => {
      expect(CITY_BONUSES.Brussels).toBeDefined();
      expect(CITY_BONUSES.Brussels.officers).toBe(1);
    });

    it('should have Age II cities defined', () => {
      expect(CITY_BONUSES.Friedrichshafen).toBeDefined();
      expect(CITY_BONUSES.Cardington).toBeDefined();
      expect(CITY_BONUSES.Rome).toBeDefined();
      expect(CITY_BONUSES.Moscow).toBeDefined();
      expect(CITY_BONUSES.Cairo).toBeDefined();
      expect(CITY_BONUSES['Scapa Flow']).toBeDefined();
    });

    it('should have Age III cities defined', () => {
      expect(CITY_BONUSES['New York']).toBeDefined();
      expect(CITY_BONUSES.Lakehurst).toBeDefined();
      expect(CITY_BONUSES['Rio de Janeiro']).toBeDefined();
      expect(CITY_BONUSES.Recife).toBeDefined();
      expect(CITY_BONUSES.Seville).toBeDefined();
      expect(CITY_BONUSES.Bombay).toBeDefined();
    });

    it('should have Bombay with both cash and influence per Section 10.4', () => {
      expect(CITY_BONUSES.Bombay.cash).toBe(3);
      expect(CITY_BONUSES.Bombay.influence).toBe(1);
    });
  });
});
