import { logger } from '../utils/logger';

interface TypingState {
  userId: string;
  userName: string;
  startedAt: number;
  lastActivity: number;
  debounceTimer?: NodeJS.Timeout;
  inactivityTimer?: NodeJS.Timeout;
}

/**
 * Service for managing typing indicators with debouncing and automatic cleanup
 */
export class TypingIndicatorService {
  // Room-based typing states: roomId -> userId -> TypingState
  private typingStates = new Map<string, Map<string, TypingState>>();

  // Configuration
  private readonly DEBOUNCE_DELAY = 300; // 300ms debouncing
  private readonly INACTIVITY_TIMEOUT = 5000; // 5 seconds until auto-stop
  private readonly CLEANUP_INTERVAL = 30000; // Clean up stale states every 30s

  // Cleanup timer
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleStates();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Handle typing start event with debouncing
   */
  handleTypingStart(
    roomId: string,
    userId: string,
    userName: string,
    onEmit: (event: string, data: any) => void
  ): { debounced: boolean; shouldEmit: boolean } {
    // Get or create room typing states
    if (!this.typingStates.has(roomId)) {
      this.typingStates.set(roomId, new Map());
    }

    const roomStates = this.typingStates.get(roomId)!;
    const existingState = roomStates.get(userId);
    const now = Date.now();

    // If user is already typing, check if we should debounce
    if (existingState) {
      // Clear existing timers
      if (existingState.debounceTimer) {
        clearTimeout(existingState.debounceTimer);
      }
      if (existingState.inactivityTimer) {
        clearTimeout(existingState.inactivityTimer);
      }

      // Check if we're within debounce window
      const timeSinceLastActivity = now - existingState.lastActivity;
      const shouldDebounce = timeSinceLastActivity < this.DEBOUNCE_DELAY;

      // Update activity time
      existingState.lastActivity = now;

      // Set new inactivity timer
      existingState.inactivityTimer = setTimeout(() => {
        this.handleTypingStop(roomId, userId, onEmit);
      }, this.INACTIVITY_TIMEOUT);

      if (shouldDebounce) {
        // We're debouncing - set timer to emit later if no more updates
        existingState.debounceTimer = setTimeout(() => {
          onEmit('typing_indicator', {
            roomId,
            userId,
            userName,
            isTyping: true,
            timestamp: new Date().toISOString(),
          });
        }, this.DEBOUNCE_DELAY);

        return { debounced: true, shouldEmit: false };
      }

      // Not debouncing, emit immediately
      return { debounced: false, shouldEmit: true };
    }

    // New typing session
    const newState: TypingState = {
      userId,
      userName,
      startedAt: now,
      lastActivity: now,
    };

    // Set inactivity timer
    newState.inactivityTimer = setTimeout(() => {
      this.handleTypingStop(roomId, userId, onEmit);
    }, this.INACTIVITY_TIMEOUT);

    // Store state
    roomStates.set(userId, newState);

    // Emit typing indicator
    onEmit('typing_indicator', {
      roomId,
      userId,
      userName,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Typing started: room=${roomId}, user=${userId}`);

    return { debounced: false, shouldEmit: true };
  }

  /**
   * Handle typing stop event
   */
  handleTypingStop(
    roomId: string,
    userId: string,
    onEmit: (event: string, data: any) => void
  ): boolean {
    const roomStates = this.typingStates.get(roomId);
    if (!roomStates) return false;

    const state = roomStates.get(userId);
    if (!state) return false;

    // Clear timers
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    if (state.inactivityTimer) {
      clearTimeout(state.inactivityTimer);
    }

    // Remove state
    roomStates.delete(userId);

    // Clean up room if empty
    if (roomStates.size === 0) {
      this.typingStates.delete(roomId);
    }

    // Emit stop typing indicator
    onEmit('typing_indicator', {
      roomId,
      userId,
      isTyping: false,
      timestamp: new Date().toISOString(),
    });

    logger.debug(`Typing stopped: room=${roomId}, user=${userId}`);

    return true;
  }

  /**
   * Get current typing users in a room
   */
  getTypingUsers(roomId: string): Array<{ userId: string; userName: string; duration: number }> {
    const roomStates = this.typingStates.get(roomId);
    if (!roomStates) return [];

    const now = Date.now();
    const typingUsers: Array<{ userId: string; userName: string; duration: number }> = [];

    for (const [userId, state] of roomStates) {
      // Check if still within activity window
      if (now - state.lastActivity <= this.INACTIVITY_TIMEOUT) {
        typingUsers.push({
          userId,
          userName: state.userName,
          duration: now - state.startedAt,
        });
      }
    }

    return typingUsers;
  }

  /**
   * Clear all typing states for a user (e.g., on disconnect)
   */
  clearUserFromAllRooms(
    userId: string,
    onEmit: (roomId: string, event: string, data: any) => void
  ) {
    for (const [roomId, roomStates] of this.typingStates) {
      if (roomStates.has(userId)) {
        const state = roomStates.get(userId)!;

        // Clear timers
        if (state.debounceTimer) {
          clearTimeout(state.debounceTimer);
        }
        if (state.inactivityTimer) {
          clearTimeout(state.inactivityTimer);
        }

        // Remove state
        roomStates.delete(userId);

        // Clean up room if empty
        if (roomStates.size === 0) {
          this.typingStates.delete(roomId);
        }

        // Emit stop typing to room
        onEmit(roomId, 'typing_indicator', {
          roomId,
          userId,
          isTyping: false,
          timestamp: new Date().toISOString(),
        });
      }
    }

    logger.debug(`Cleared typing states for user ${userId} from all rooms`);
  }

  /**
   * Clean up stale typing states
   */
  private cleanupStaleStates() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [roomId, roomStates] of this.typingStates) {
      const staleUsers: string[] = [];

      for (const [userId, state] of roomStates) {
        // Check if state is stale (no activity for 2x inactivity timeout)
        if (now - state.lastActivity > this.INACTIVITY_TIMEOUT * 2) {
          staleUsers.push(userId);

          // Clear timers
          if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
          }
          if (state.inactivityTimer) {
            clearTimeout(state.inactivityTimer);
          }
        }
      }

      // Remove stale users
      for (const userId of staleUsers) {
        roomStates.delete(userId);
        cleanedCount++;
      }

      // Clean up room if empty
      if (roomStates.size === 0) {
        this.typingStates.delete(roomId);
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} stale typing states`);
    }
  }

  /**
   * Get statistics about typing indicators
   */
  getStats() {
    let totalUsers = 0;
    let totalRooms = this.typingStates.size;

    for (const roomStates of this.typingStates.values()) {
      totalUsers += roomStates.size;
    }

    return {
      activeRooms: totalRooms,
      activeTypingUsers: totalUsers,
      averageUsersPerRoom: totalRooms > 0 ? totalUsers / totalRooms : 0,
    };
  }

  /**
   * Shutdown service and clear all timers
   */
  shutdown() {
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Clear all typing state timers
    for (const roomStates of this.typingStates.values()) {
      for (const state of roomStates.values()) {
        if (state.debounceTimer) {
          clearTimeout(state.debounceTimer);
        }
        if (state.inactivityTimer) {
          clearTimeout(state.inactivityTimer);
        }
      }
    }

    // Clear all states
    this.typingStates.clear();

    logger.info('Typing indicator service shut down');
  }
}

// Export singleton instance
export const typingIndicatorService = new TypingIndicatorService();