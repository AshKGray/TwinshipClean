import { logger } from '../utils/logger';

/**
 * Token bucket configuration for different event types
 */
interface TokenBucketConfig {
  capacity: number;      // Max tokens in bucket
  refillRate: number;    // Tokens per second
  refillAmount: number;  // Number of tokens to add per refill
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig) {
    this.config = config;
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens from the bucket
   */
  consume(amount: number = 1): boolean {
    this.refill();

    if (this.tokens >= amount) {
      this.tokens -= amount;
      return true;
    }

    return false;
  }

  /**
   * Refill the bucket based on time elapsed
   */
  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = Math.floor(timePassed * this.config.refillRate) * this.config.refillAmount;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.tokens + tokensToAdd, this.config.capacity);
      this.lastRefill = now;
    }
  }

  /**
   * Get current bucket state
   */
  getState() {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.config.capacity,
      percentFull: (this.tokens / this.config.capacity) * 100,
    };
  }

  /**
   * Reset the bucket to full capacity
   */
  reset() {
    this.tokens = this.config.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Rate limiter with different limits for different event types
 */
export class RateLimiter {
  private userBuckets: Map<string, Map<string, TokenBucket>> = new Map();
  private violationCounts: Map<string, number> = new Map();
  private backoffEndTimes: Map<string, number> = new Map();

  // Configuration for different event types
  private readonly configs: Record<string, TokenBucketConfig> = {
    // Messages: 100 per minute (1.67 per second)
    message: {
      capacity: 100,
      refillRate: 1.67,
      refillAmount: 1,
    },
    // Typing events: 10 per minute (0.17 per second)
    typing: {
      capacity: 10,
      refillRate: 0.17,
      refillAmount: 1,
    },
    // Reactions: 30 per minute (0.5 per second)
    reaction: {
      capacity: 30,
      refillRate: 0.5,
      refillAmount: 1,
    },
    // Presence updates: 60 per minute (1 per second)
    presence: {
      capacity: 60,
      refillRate: 1,
      refillAmount: 1,
    },
    // General events: 200 per minute (3.33 per second)
    general: {
      capacity: 200,
      refillRate: 3.33,
      refillAmount: 1,
    },
  };

  /**
   * Check if a user action is allowed
   */
  checkLimit(userId: string, eventType: string, amount: number = 1): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
    backoffTime?: number;
  } {
    // Check if user is in backoff period
    const backoffEnd = this.backoffEndTimes.get(userId);
    if (backoffEnd && backoffEnd > Date.now()) {
      const backoffRemaining = Math.ceil((backoffEnd - Date.now()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetIn: backoffRemaining,
        backoffTime: backoffRemaining,
      };
    }

    // Get or create user's buckets
    if (!this.userBuckets.has(userId)) {
      this.userBuckets.set(userId, new Map());
    }

    const userBuckets = this.userBuckets.get(userId)!;

    // Get or create bucket for this event type
    const config = this.configs[eventType] || this.configs.general;
    if (!userBuckets.has(eventType)) {
      userBuckets.set(eventType, new TokenBucket(config));
    }

    const bucket = userBuckets.get(eventType)!;
    const allowed = bucket.consume(amount);
    const state = bucket.getState();

    // Calculate reset time (when bucket will be full)
    const tokensNeeded = config.capacity - state.tokens;
    const resetIn = Math.ceil(tokensNeeded / config.refillRate);

    // Handle violations
    if (!allowed) {
      this.handleViolation(userId);
    } else {
      // Reset violation count on successful request
      this.violationCounts.delete(userId);
    }

    return {
      allowed,
      remaining: state.tokens,
      resetIn,
    };
  }

  /**
   * Handle rate limit violations with exponential backoff
   */
  private handleViolation(userId: string) {
    const violations = (this.violationCounts.get(userId) || 0) + 1;
    this.violationCounts.set(userId, violations);

    // Apply exponential backoff after repeated violations
    if (violations >= 3) {
      // Backoff time: 2^(violations-2) seconds, max 5 minutes
      const backoffSeconds = Math.min(Math.pow(2, violations - 2), 300);
      const backoffEnd = Date.now() + (backoffSeconds * 1000);

      this.backoffEndTimes.set(userId, backoffEnd);

      logger.warn(`Rate limit backoff applied for user ${userId}: ${backoffSeconds}s (${violations} violations)`);

      // Schedule cleanup
      setTimeout(() => {
        this.backoffEndTimes.delete(userId);
        this.violationCounts.delete(userId);
      }, backoffSeconds * 1000);
    }
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(userId: string, eventType: string): Record<string, string> {
    const bucket = this.getUserBucket(userId, eventType);
    if (!bucket) {
      return {};
    }

    const state = bucket.getState();
    const config = this.configs[eventType] || this.configs.general;
    const resetTime = Math.ceil(Date.now() / 1000) + Math.ceil((config.capacity - state.tokens) / config.refillRate);

    return {
      'X-RateLimit-Limit': config.capacity.toString(),
      'X-RateLimit-Remaining': Math.floor(state.tokens).toString(),
      'X-RateLimit-Reset': resetTime.toString(),
      'X-RateLimit-Bucket': eventType,
    };
  }

  /**
   * Get user's bucket for a specific event type
   */
  private getUserBucket(userId: string, eventType: string): TokenBucket | null {
    const userBuckets = this.userBuckets.get(userId);
    if (!userBuckets) return null;

    return userBuckets.get(eventType) || null;
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  resetUser(userId: string) {
    this.userBuckets.delete(userId);
    this.violationCounts.delete(userId);
    this.backoffEndTimes.delete(userId);

    logger.info(`Rate limits reset for user ${userId}`);
  }

  /**
   * Get rate limit statistics for monitoring
   */
  getStats() {
    const stats: any = {
      totalUsers: this.userBuckets.size,
      usersInBackoff: this.backoffEndTimes.size,
      usersWithViolations: this.violationCounts.size,
      eventTypes: {},
    };

    // Aggregate stats by event type
    for (const [userId, buckets] of this.userBuckets) {
      for (const [eventType, bucket] of buckets) {
        if (!stats.eventTypes[eventType]) {
          stats.eventTypes[eventType] = {
            users: 0,
            avgTokensUsed: 0,
            totalTokensUsed: 0,
          };
        }

        const state = bucket.getState();
        const config = this.configs[eventType] || this.configs.general;
        const tokensUsed = config.capacity - state.tokens;

        stats.eventTypes[eventType].users++;
        stats.eventTypes[eventType].totalTokensUsed += tokensUsed;
        stats.eventTypes[eventType].avgTokensUsed =
          stats.eventTypes[eventType].totalTokensUsed / stats.eventTypes[eventType].users;
      }
    }

    return stats;
  }

  /**
   * Cleanup old buckets (call periodically)
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    // Clean up expired backoff times
    for (const [userId, endTime] of this.backoffEndTimes) {
      if (endTime < now) {
        this.backoffEndTimes.delete(userId);
        this.violationCounts.delete(userId);
      }
    }

    // Note: In production, you'd also want to clean up inactive user buckets
    // based on last activity time to prevent memory leaks

    logger.debug(`Rate limiter cleanup completed. Active users: ${this.userBuckets.size}`);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Set up periodic cleanup
setInterval(() => {
  rateLimiter.cleanup();
}, 300000); // Every 5 minutes