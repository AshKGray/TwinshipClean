import {
  analyzePatterns,
  detectSynchronicity,
  calculateSyncScore,
} from '../behaviorAnalytics';
import { BehaviorEvent, TwintuitionConfig } from '../../types/twintuition';

describe('behaviorAnalytics', () => {
  const defaultConfig: TwintuitionConfig = {
    sensitivity: 0.7,
    timeWindowMinutes: 15,
    enableLocationSync: true,
    enableMoodSync: true,
    enableActionSync: true,
    minConfidenceThreshold: 0.6,
  };

  const createMockEvent = (overrides: Partial<BehaviorEvent> = {}): BehaviorEvent => ({
    id: 'test-id',
    userId: 'user1',
    twinId: 'twin1',
    timestamp: new Date().toISOString(),
    type: 'app_interaction',
    action: 'open_app',
    context: {},
    ...overrides,
  });

  describe('analyzePatterns', () => {
    it('should return empty array for insufficient events', async () => {
      const events = [createMockEvent()];
      const patterns = await analyzePatterns(events, defaultConfig);
      expect(patterns).toHaveLength(0);
    });

    it('should detect simultaneous actions', async () => {
      const now = new Date();
      const events = [
        createMockEvent({
          userId: 'twin1',
          twinId: 'twin2',
          timestamp: now.toISOString(),
          action: 'open_app',
        }),
        createMockEvent({
          userId: 'twin2',
          twinId: 'twin1',
          timestamp: new Date(now.getTime() + 5 * 60 * 1000).toISOString(), // 5 minutes later
          action: 'open_app',
        }),
      ];

      const patterns = await analyzePatterns(events, defaultConfig);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].type).toBe('simultaneous_action');
    });

    it('should detect mood synchronization', async () => {
      const now = new Date();
      const events = [
        createMockEvent({
          userId: 'twin1',
          twinId: 'twin2',
          type: 'mood_update',
          action: 'set_mood',
          context: { mood: 'happy' },
          timestamp: now.toISOString(),
        }),
        createMockEvent({
          userId: 'twin2',
          twinId: 'twin1',
          type: 'mood_update',
          action: 'set_mood',
          context: { mood: 'excited' }, // Similar emotion
          timestamp: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        }),
      ];

      const patterns = await analyzePatterns(events, defaultConfig);
      const moodPattern = patterns.find(p => p.type === 'mood_synchronization');
      expect(moodPattern).toBeDefined();
      expect(moodPattern?.confidence).toBeGreaterThan(0.5);
    });

    it('should detect location synchronization', async () => {
      const now = new Date();
      const location1 = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
      const location2 = { latitude: 37.7849, longitude: -122.4094 }; // Very close to SF

      const events = [
        createMockEvent({
          userId: 'twin1',
          twinId: 'twin2',
          location: location1,
          timestamp: now.toISOString(),
        }),
        createMockEvent({
          userId: 'twin2',
          twinId: 'twin1',
          location: location2,
          timestamp: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        }),
      ];

      const patterns = await analyzePatterns(events, defaultConfig);
      const locationPattern = patterns.find(p => p.type === 'location_synchronization');
      expect(locationPattern).toBeDefined();
    });

    it('should filter patterns by confidence threshold', async () => {
      const highThresholdConfig = { ...defaultConfig, minConfidenceThreshold: 0.9 };
      const events = [
        createMockEvent({ userId: 'twin1', timestamp: new Date().toISOString() }),
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
        }),
      ];

      const patterns = await analyzePatterns(events, highThresholdConfig);
      // Should filter out low-confidence patterns
      expect(patterns.every(p => p.confidence >= 0.9)).toBe(true);
    });
  });

  describe('detectSynchronicity', () => {
    it('should return null for events without twin events', async () => {
      const newEvent = createMockEvent({ twinId: undefined });
      const recentEvents: BehaviorEvent[] = [];
      
      const syncEvent = await detectSynchronicity(newEvent, recentEvents, defaultConfig);
      expect(syncEvent).toBeNull();
    });

    it('should detect immediate synchronicity for similar actions', async () => {
      const newEvent = createMockEvent({
        userId: 'twin1',
        twinId: 'twin2',
        action: 'send_message',
        timestamp: new Date().toISOString(),
      });

      const recentEvents = [
        createMockEvent({
          userId: 'twin2',
          twinId: 'twin1',
          action: 'send_message',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        }),
      ];

      const syncEvent = await detectSynchronicity(newEvent, recentEvents, defaultConfig);
      expect(syncEvent).toBeDefined();
      expect(syncEvent?.type).toBe('app_synchronization');
      expect(syncEvent?.confidence).toBeGreaterThan(0.6);
    });

    it('should boost confidence for location similarity', async () => {
      const location = { latitude: 37.7749, longitude: -122.4194 };
      const newEvent = createMockEvent({
        userId: 'twin1',
        location,
        timestamp: new Date().toISOString(),
      });

      const recentEvents = [
        createMockEvent({
          userId: 'twin2',
          location,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        }),
      ];

      const syncEvent = await detectSynchronicity(newEvent, recentEvents, defaultConfig);
      expect(syncEvent?.confidence).toBeGreaterThan(0.7); // Should be boosted
    });

    it('should boost confidence for emotional similarity', async () => {
      const newEvent = createMockEvent({
        userId: 'twin1',
        context: { emotion: 'happy' },
        timestamp: new Date().toISOString(),
      });

      const recentEvents = [
        createMockEvent({
          userId: 'twin2',
          context: { emotion: 'happy' },
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        }),
      ];

      const syncEvent = await detectSynchronicity(newEvent, recentEvents, defaultConfig);
      expect(syncEvent?.confidence).toBeGreaterThan(0.6);
    });

    it('should respect time window limitations', async () => {
      const shortWindowConfig = { ...defaultConfig, timeWindowMinutes: 5 };
      const newEvent = createMockEvent({
        timestamp: new Date().toISOString(),
      });

      const recentEvents = [
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        }),
      ];

      const syncEvent = await detectSynchronicity(newEvent, recentEvents, shortWindowConfig);
      expect(syncEvent).toBeNull(); // Outside time window
    });
  });

  describe('calculateSyncScore', () => {
    it('should return 0 for insufficient events', () => {
      const events = [createMockEvent()];
      const score = calculateSyncScore(events);
      expect(score).toBe(0);
    });

    it('should calculate score based on various factors', () => {
      const now = new Date();
      const events = [
        createMockEvent({
          userId: 'twin1',
          timestamp: now.toISOString(),
          action: 'open_app',
        }),
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
          action: 'open_app', // Same action
        }),
        createMockEvent({
          userId: 'twin1',
          timestamp: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
          context: { emotion: 'happy' },
        }),
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          context: { emotion: 'happy' }, // Same emotion
        }),
      ];

      const score = calculateSyncScore(events);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores for more synchronized events', () => {
      const now = new Date();
      
      // Low sync events
      const lowSyncEvents = [
        createMockEvent({ userId: 'twin1', timestamp: now.toISOString() }),
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(now.getTime() + 45 * 60 * 1000).toISOString(), // 45 min later
        }),
      ];

      // High sync events
      const highSyncEvents = [
        createMockEvent({
          userId: 'twin1',
          timestamp: now.toISOString(),
          action: 'send_message',
          context: { emotion: 'excited' },
        }),
        createMockEvent({
          userId: 'twin2',
          timestamp: new Date(now.getTime() + 2 * 60 * 1000).toISOString(), // 2 min later
          action: 'send_message', // Same action
          context: { emotion: 'excited' }, // Same emotion
        }),
      ];

      const lowScore = calculateSyncScore(lowSyncEvents);
      const highScore = calculateSyncScore(highSyncEvents);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('edge cases', () => {
    it('should handle events with missing data gracefully', async () => {
      const events = [
        createMockEvent({ context: undefined }),
        createMockEvent({ location: undefined }),
        createMockEvent({ twinId: undefined }),
      ];

      expect(() => analyzePatterns(events, defaultConfig)).not.toThrow();
    });

    it('should handle invalid timestamps', async () => {
      const events = [
        createMockEvent({ timestamp: 'invalid-timestamp' }),
        createMockEvent({ timestamp: '' }),
      ];

      expect(() => analyzePatterns(events, defaultConfig)).not.toThrow();
    });

    it('should handle extreme coordinate values', async () => {
      const events = [
        createMockEvent({
          location: { latitude: 91, longitude: 181 }, // Invalid coordinates
        }),
        createMockEvent({
          location: { latitude: -91, longitude: -181 },
        }),
      ];

      expect(() => analyzePatterns(events, defaultConfig)).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      const events = Array.from({ length: 1000 }, (_, i) =>
        createMockEvent({
          id: `event-${i}`,
          userId: i % 2 === 0 ? 'twin1' : 'twin2',
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
        })
      );

      const startTime = Date.now();
      await analyzePatterns(events, defaultConfig);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});