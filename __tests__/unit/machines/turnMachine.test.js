/**
 * Turn State Machine Tests
 */

const { turnMachine, getAllowedEvents, isEventAllowed, initialContext } = require('../../../server/machines/turnMachine');
const { createActor } = require('xstate');

describe('Turn State Machine', () => {
  let actor;

  beforeEach(() => {
    actor = createActor(turnMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('Initial state', () => {
    it('should start in idle state', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
    });

    it('should have initial context', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.context).toEqual(initialContext);
    });
  });

  describe('ACTIVATE_TURN transition', () => {
    it('should transition from idle to awaiting_action', () => {
      actor.send({ type: 'ACTIVATE_TURN', playerId: 'player1' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('awaiting_action');
    });
  });

  describe('Weather Bureau flow', () => {
    beforeEach(() => {
      actor.send({ type: 'ACTIVATE_TURN', playerId: 'player1' });
    });

    it('should transition to at_weather_bureau on PLACE_AGENT(weather-bureau)', () => {
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'weather-bureau',
        hazard: { type: 'engine_fire', difficulty: 3 }
      });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('at_weather_bureau');
      expect(snapshot.context.peekedHazard).toEqual({ type: 'engine_fire', difficulty: 3 });
    });

    it('should transition to idle on KEEP_HAZARD', () => {
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'weather-bureau',
        hazard: { type: 'engine_fire', difficulty: 3 }
      });
      actor.send({ type: 'KEEP_HAZARD' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.peekedHazard).toBeNull();
    });

    it('should transition to idle on DISCARD_HAZARD', () => {
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'weather-bureau',
        hazard: { type: 'engine_fire', difficulty: 3 }
      });
      actor.send({ type: 'DISCARD_HAZARD' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.peekedHazard).toBeNull();
    });
  });

  describe('Ministry flow', () => {
    beforeEach(() => {
      actor.send({ type: 'ACTIVATE_TURN', playerId: 'player1' });
    });

    it('should transition to at_ministry on PLACE_AGENT(ministry)', () => {
      const cards = [{ name: 'Card1' }, { name: 'Card2' }];
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'ministry',
        cards
      });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('at_ministry');
      expect(snapshot.context.drawnCards).toEqual(cards);
    });

    it('should transition to idle on DISCARD_MINISTRY_CARD with valid cardIndex', () => {
      const cards = [{ name: 'Card1' }, { name: 'Card2' }];
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'ministry',
        cards
      });
      actor.send({ type: 'DISCARD_MINISTRY_CARD', cardIndex: 0 });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.drawnCards).toEqual([]);
    });

    it('should NOT transition on DISCARD_MINISTRY_CARD with invalid cardIndex', () => {
      const cards = [{ name: 'Card1' }, { name: 'Card2' }];
      actor.send({
        type: 'PLACE_AGENT',
        locationId: 'ministry',
        cards
      });
      actor.send({ type: 'DISCARD_MINISTRY_CARD', cardIndex: 5 });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('at_ministry'); // Should NOT transition
    });
  });

  describe('Launchpad flow', () => {
    beforeEach(() => {
      actor.send({ type: 'ACTIVATE_TURN', playerId: 'player1' });
    });

    it('should transition to at_launchpad on PLACE_AGENT(launchpad)', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'launchpad' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('at_launchpad');
      expect(snapshot.context.launchpadActive).toBe(true);
    });

    it('should transition to awaiting_hazard on LAUNCH_SHIP', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'launchpad' });
      actor.send({
        type: 'LAUNCH_SHIP',
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen',
        hazard: { type: 'storm', difficulty: 2 }
      });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('awaiting_hazard');
      expect(snapshot.context.pendingLaunch).toMatchObject({
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen'
      });
    });

    it('should return to at_launchpad after RESPOND_TO_HAZARD', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'launchpad' });
      actor.send({
        type: 'LAUNCH_SHIP',
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen',
        hazard: { type: 'storm', difficulty: 2 }
      });
      actor.send({ type: 'RESPOND_TO_HAZARD' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('at_launchpad');
      expect(snapshot.context.pendingLaunch).toBeNull();
    });

    it('should transition to idle on NO_MORE_LAUNCHES', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'launchpad' });
      actor.send({ type: 'NO_MORE_LAUNCHES' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
      expect(snapshot.context.launchpadActive).toBe(false);
    });

    it('should allow multiple launches before NO_MORE_LAUNCHES', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'launchpad' });

      // First launch
      actor.send({
        type: 'LAUNCH_SHIP',
        shipId: 'ship1',
        routeId: 'route1',
        gasType: 'hydrogen'
      });
      actor.send({ type: 'RESPOND_TO_HAZARD' });

      // Second launch
      actor.send({
        type: 'LAUNCH_SHIP',
        shipId: 'ship2',
        routeId: 'route2',
        gasType: 'helium'
      });
      actor.send({ type: 'RESPOND_TO_HAZARD' });

      // End launchpad
      actor.send({ type: 'NO_MORE_LAUNCHES' });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
    });
  });

  describe('Other locations', () => {
    beforeEach(() => {
      actor.send({ type: 'ACTIVATE_TURN', playerId: 'player1' });
    });

    it('should transition directly to idle for non-multi-step locations', () => {
      actor.send({ type: 'PLACE_AGENT', locationId: 'construction_hall' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
    });

    it('should transition to idle on REVEAL', () => {
      actor.send({ type: 'REVEAL' });
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe('idle');
    });
  });
});

describe('getAllowedEvents helper', () => {
  it('should return correct events for idle state', () => {
    expect(getAllowedEvents('idle')).toEqual(['ACTIVATE_TURN']);
  });

  it('should return correct events for awaiting_action state', () => {
    expect(getAllowedEvents('awaiting_action')).toEqual(['PLACE_AGENT', 'REVEAL']);
  });

  it('should return correct events for at_weather_bureau state', () => {
    expect(getAllowedEvents('at_weather_bureau')).toEqual(['KEEP_HAZARD', 'DISCARD_HAZARD']);
  });

  it('should return correct events for at_ministry state', () => {
    expect(getAllowedEvents('at_ministry')).toEqual(['DISCARD_MINISTRY_CARD']);
  });

  it('should return correct events for at_launchpad state', () => {
    expect(getAllowedEvents('at_launchpad')).toEqual(['LAUNCH_SHIP', 'NO_MORE_LAUNCHES']);
  });

  it('should return correct events for awaiting_hazard state', () => {
    expect(getAllowedEvents('awaiting_hazard')).toEqual(['RESPOND_TO_HAZARD']);
  });
});

describe('isEventAllowed helper', () => {
  it('should return true for valid events', () => {
    expect(isEventAllowed('idle', 'ACTIVATE_TURN')).toBe(true);
    expect(isEventAllowed('awaiting_action', 'PLACE_AGENT')).toBe(true);
    expect(isEventAllowed('at_weather_bureau', 'KEEP_HAZARD')).toBe(true);
  });

  it('should return false for invalid events', () => {
    expect(isEventAllowed('idle', 'PLACE_AGENT')).toBe(false);
    expect(isEventAllowed('at_weather_bureau', 'LAUNCH_SHIP')).toBe(false);
    expect(isEventAllowed('at_launchpad', 'DISCARD_HAZARD')).toBe(false);
  });
});
