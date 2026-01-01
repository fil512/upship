/**
 * Unit tests for undo action module
 */

const {
  createsCommitPoint,
  isUndoable,
  NON_UNDOABLE_ACTIONS,
  COMMIT_POINT_ACTION_TYPES
} = require('../../../server/actions/undo');

describe('Undo Module', () => {
  describe('createsCommitPoint', () => {
    it('returns true for LAUNCH_SHIP (hazard draw)', () => {
      expect(createsCommitPoint('LAUNCH_SHIP', {})).toBe(true);
    });

    it('returns true for RESPOND_TO_HAZARD', () => {
      expect(createsCommitPoint('RESPOND_TO_HAZARD', {})).toBe(true);
    });

    it('returns true for PLACE_AGENT at weather-bureau', () => {
      expect(createsCommitPoint('PLACE_AGENT', { locationId: 'weather-bureau' })).toBe(true);
    });

    it('returns false for PLACE_AGENT at other locations', () => {
      expect(createsCommitPoint('PLACE_AGENT', { locationId: 'research-institute' })).toBe(false);
      expect(createsCommitPoint('PLACE_AGENT', { locationId: 'design-bureau' })).toBe(false);
      expect(createsCommitPoint('PLACE_AGENT', { locationId: 'academy' })).toBe(false);
    });

    it('returns true for DISCARD_HAZARD', () => {
      expect(createsCommitPoint('DISCARD_HAZARD', {})).toBe(true);
    });

    it('returns false for BUILD_SHIP', () => {
      expect(createsCommitPoint('BUILD_SHIP', {})).toBe(false);
    });

    it('returns false for BUY_GAS', () => {
      expect(createsCommitPoint('BUY_GAS', {})).toBe(false);
    });

    it('returns false for ACQUIRE_TECHNOLOGY', () => {
      expect(createsCommitPoint('ACQUIRE_TECHNOLOGY', {})).toBe(false);
    });

    it('returns false for INSTALL_UPGRADE', () => {
      expect(createsCommitPoint('INSTALL_UPGRADE', {})).toBe(false);
    });

    it('returns false for RECRUIT_CREW', () => {
      expect(createsCommitPoint('RECRUIT_CREW', {})).toBe(false);
    });
  });

  describe('isUndoable', () => {
    it('returns false for END_TURN', () => {
      expect(isUndoable('END_TURN')).toBe(false);
    });

    it('returns false for REVEAL', () => {
      expect(isUndoable('REVEAL')).toBe(false);
    });

    it('returns false for UNDO', () => {
      expect(isUndoable('UNDO')).toBe(false);
    });

    it('returns false for CALCULATE_SCORES', () => {
      expect(isUndoable('CALCULATE_SCORES')).toBe(false);
    });

    it('returns true for BUILD_SHIP', () => {
      expect(isUndoable('BUILD_SHIP')).toBe(true);
    });

    it('returns true for PLACE_AGENT', () => {
      expect(isUndoable('PLACE_AGENT')).toBe(true);
    });

    it('returns true for LAUNCH_SHIP', () => {
      expect(isUndoable('LAUNCH_SHIP')).toBe(true);
    });

    it('returns true for BUY_GAS', () => {
      expect(isUndoable('BUY_GAS')).toBe(true);
    });

    it('returns true for ACQUIRE_TECHNOLOGY', () => {
      expect(isUndoable('ACQUIRE_TECHNOLOGY')).toBe(true);
    });

    it('returns true for INSTALL_UPGRADE', () => {
      expect(isUndoable('INSTALL_UPGRADE')).toBe(true);
    });

    it('returns true for RECRUIT_CREW', () => {
      expect(isUndoable('RECRUIT_CREW')).toBe(true);
    });
  });

  describe('Exported constants', () => {
    it('NON_UNDOABLE_ACTIONS is a Set', () => {
      expect(NON_UNDOABLE_ACTIONS).toBeInstanceOf(Set);
    });

    it('NON_UNDOABLE_ACTIONS contains expected values', () => {
      expect(NON_UNDOABLE_ACTIONS.has('END_TURN')).toBe(true);
      expect(NON_UNDOABLE_ACTIONS.has('REVEAL')).toBe(true);
      expect(NON_UNDOABLE_ACTIONS.has('UNDO')).toBe(true);
      expect(NON_UNDOABLE_ACTIONS.has('CALCULATE_SCORES')).toBe(true);
    });

    it('COMMIT_POINT_ACTION_TYPES is a Set', () => {
      expect(COMMIT_POINT_ACTION_TYPES).toBeInstanceOf(Set);
    });

    it('COMMIT_POINT_ACTION_TYPES contains DISCARD_HAZARD', () => {
      expect(COMMIT_POINT_ACTION_TYPES.has('DISCARD_HAZARD')).toBe(true);
    });
  });
});
