import { RateLimiter } from '../services/rateLimitService';

describe('Rate Limiting Service', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  describe('Token Bucket Algorithm', () => {
    test('should allow requests within rate limit', () => {
      const userId = 'test-user-1';

      // Message rate limit is 100 per minute
      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.checkLimit(userId, 'message', 1);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThan(0);
      }
    });

    test('should deny requests exceeding rate limit', () => {
      const userId = 'test-user-2';

      // Typing rate limit is 10 per minute
      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }

      // This should be denied
      const result = rateLimiter.checkLimit(userId, 'typing', 1);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetIn).toBeGreaterThan(0);
    });

    test('should apply different limits for different event types', () => {
      const userId = 'test-user-3';

      // Check different event types have different limits
      const messageResult = rateLimiter.checkLimit(userId, 'message', 1);
      const typingResult = rateLimiter.checkLimit(userId, 'typing', 1);
      const reactionResult = rateLimiter.checkLimit(userId, 'reaction', 1);

      expect(messageResult.allowed).toBe(true);
      expect(typingResult.allowed).toBe(true);
      expect(reactionResult.allowed).toBe(true);

      // Message bucket should have more capacity than typing
      expect(messageResult.remaining).toBeGreaterThan(typingResult.remaining);
    });
  });

  describe('Exponential Backoff', () => {
    test('should apply exponential backoff after repeated violations', () => {
      const userId = 'test-user-4';

      // Consume all typing tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }

      // Generate 3 violations to trigger backoff
      for (let i = 0; i < 3; i++) {
        const result = rateLimiter.checkLimit(userId, 'typing', 1);
        expect(result.allowed).toBe(false);
      }

      // Next request should have backoff time
      const result = rateLimiter.checkLimit(userId, 'typing', 1);
      expect(result.allowed).toBe(false);
      expect(result.backoffTime).toBeDefined();
      expect(result.backoffTime).toBeGreaterThan(0);
    });

    test('should increase backoff time exponentially', () => {
      const userId = 'test-user-5';

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }

      // Generate multiple violations
      const backoffTimes: number[] = [];

      for (let violations = 3; violations <= 5; violations++) {
        // Create new user for each test to avoid interference
        const testUserId = `${userId}-${violations}`;
        const limiter = new RateLimiter();

        // Consume all tokens for this user
        for (let i = 0; i < 10; i++) {
          limiter.checkLimit(testUserId, 'typing', 1);
        }

        // Generate violations
        for (let i = 0; i < violations; i++) {
          limiter.checkLimit(testUserId, 'typing', 1);
        }

        const result = limiter.checkLimit(testUserId, 'typing', 1);
        if (result.backoffTime) {
          backoffTimes.push(result.backoffTime);
        }
      }

      // Verify exponential increase
      for (let i = 1; i < backoffTimes.length; i++) {
        expect(backoffTimes[i]).toBeGreaterThan(backoffTimes[i - 1]);
      }
    });
  });

  describe('Rate Limit Headers', () => {
    test('should generate correct rate limit headers', () => {
      const userId = 'test-user-6';

      // Make a request to initialize bucket
      rateLimiter.checkLimit(userId, 'message', 1);

      const headers = rateLimiter.getRateLimitHeaders(userId, 'message');

      expect(headers['X-RateLimit-Limit']).toBeDefined();
      expect(headers['X-RateLimit-Remaining']).toBeDefined();
      expect(headers['X-RateLimit-Reset']).toBeDefined();
      expect(headers['X-RateLimit-Bucket']).toBe('message');

      expect(parseInt(headers['X-RateLimit-Limit'])).toBe(100); // Message limit
      expect(parseInt(headers['X-RateLimit-Remaining'])).toBeLessThan(100);
    });

    test('should update headers after consuming tokens', () => {
      const userId = 'test-user-7';

      // Initial request
      rateLimiter.checkLimit(userId, 'reaction', 5);
      const headers1 = rateLimiter.getRateLimitHeaders(userId, 'reaction');
      const remaining1 = parseInt(headers1['X-RateLimit-Remaining']);

      // Consume more tokens
      rateLimiter.checkLimit(userId, 'reaction', 5);
      const headers2 = rateLimiter.getRateLimitHeaders(userId, 'reaction');
      const remaining2 = parseInt(headers2['X-RateLimit-Remaining']);

      expect(remaining2).toBeLessThan(remaining1);
      expect(remaining2).toBe(remaining1 - 5);
    });
  });

  describe('User Management', () => {
    test('should reset user rate limits', () => {
      const userId = 'test-user-8';

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }

      // Should be denied
      let result = rateLimiter.checkLimit(userId, 'typing', 1);
      expect(result.allowed).toBe(false);

      // Reset user
      rateLimiter.resetUser(userId);

      // Should be allowed after reset
      result = rateLimiter.checkLimit(userId, 'typing', 1);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9); // 10 - 1
    });

    test('should track statistics correctly', () => {
      // Create some activity
      rateLimiter.checkLimit('user-1', 'message', 5);
      rateLimiter.checkLimit('user-2', 'typing', 3);
      rateLimiter.checkLimit('user-3', 'reaction', 2);

      const stats = rateLimiter.getStats();

      expect(stats.totalUsers).toBeGreaterThanOrEqual(3);
      expect(stats.eventTypes).toBeDefined();
      expect(stats.eventTypes.message).toBeDefined();
      expect(stats.eventTypes.typing).toBeDefined();
      expect(stats.eventTypes.reaction).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    test('should cleanup expired backoff times', () => {
      const userId = 'test-user-cleanup';

      // Generate a violation with backoff
      for (let i = 0; i < 10; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }
      for (let i = 0; i < 3; i++) {
        rateLimiter.checkLimit(userId, 'typing', 1);
      }

      const statsBeforeCleanup = rateLimiter.getStats();
      const usersInBackoffBefore = statsBeforeCleanup.usersInBackoff || 0;

      // Run cleanup
      rateLimiter.cleanup();

      const statsAfterCleanup = rateLimiter.getStats();

      // Since backoff hasn't expired yet, count should be the same or higher
      expect(statsAfterCleanup.usersInBackoff).toBeGreaterThanOrEqual(usersInBackoffBefore);
    });
  });
});