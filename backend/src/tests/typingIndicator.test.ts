import { TypingIndicatorService } from '../services/typingIndicatorService';

describe('Typing Indicator Service', () => {
  let service: TypingIndicatorService;
  let emittedEvents: Array<{ event: string; data: any }> = [];

  const mockEmit = (event: string, data: any) => {
    emittedEvents.push({ event, data });
  };

  beforeEach(() => {
    service = new TypingIndicatorService();
    emittedEvents = [];
  });

  afterEach(() => {
    service.shutdown();
  });

  describe('Typing Start', () => {
    test('should emit typing indicator on first typing event', () => {
      const result = service.handleTypingStart(
        'room-1',
        'user-1',
        'John Doe',
        mockEmit
      );

      expect(result.debounced).toBe(false);
      expect(result.shouldEmit).toBe(true);
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].event).toBe('typing_indicator');
      expect(emittedEvents[0].data.isTyping).toBe(true);
      expect(emittedEvents[0].data.userId).toBe('user-1');
      expect(emittedEvents[0].data.userName).toBe('John Doe');
    });

    test('should debounce rapid typing events', (done) => {
      // First typing event
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      expect(emittedEvents).toHaveLength(1);

      // Rapid successive typing events within 300ms
      setTimeout(() => {
        const result = service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
        expect(result.debounced).toBe(true);
        expect(result.shouldEmit).toBe(false);
        expect(emittedEvents).toHaveLength(1); // No new event
      }, 100);

      setTimeout(() => {
        const result = service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
        expect(result.debounced).toBe(true);
        expect(result.shouldEmit).toBe(false);
        expect(emittedEvents).toHaveLength(1); // Still no new event
      }, 200);

      // After debounce period
      setTimeout(() => {
        const result = service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
        expect(result.debounced).toBe(false);
        expect(result.shouldEmit).toBe(true);
        expect(emittedEvents).toHaveLength(2); // New event emitted
        done();
      }, 400);
    });

    test('should handle multiple users typing in same room', () => {
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-1', 'user-2', 'Jane Smith', mockEmit);

      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[0].data.userId).toBe('user-1');
      expect(emittedEvents[1].data.userId).toBe('user-2');

      const typingUsers = service.getTypingUsers('room-1');
      expect(typingUsers).toHaveLength(2);
    });

    test('should handle users in different rooms independently', () => {
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-2', 'user-1', 'John Doe', mockEmit);

      expect(emittedEvents).toHaveLength(2);
      expect(service.getTypingUsers('room-1')).toHaveLength(1);
      expect(service.getTypingUsers('room-2')).toHaveLength(1);
    });
  });

  describe('Typing Stop', () => {
    test('should emit stop typing indicator', () => {
      // Start typing first
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      emittedEvents = []; // Clear events

      // Stop typing
      const stopped = service.handleTypingStop('room-1', 'user-1', mockEmit);

      expect(stopped).toBe(true);
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].event).toBe('typing_indicator');
      expect(emittedEvents[0].data.isTyping).toBe(false);
      expect(emittedEvents[0].data.userId).toBe('user-1');
    });

    test('should handle stop for non-existent user gracefully', () => {
      const stopped = service.handleTypingStop('room-1', 'non-existent', mockEmit);

      expect(stopped).toBe(false);
      expect(emittedEvents).toHaveLength(0);
    });
  });

  describe('Auto-stop on Inactivity', () => {
    test('should auto-stop typing after 5 seconds of inactivity', (done) => {
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].data.isTyping).toBe(true);

      // Wait for inactivity timeout (5 seconds)
      setTimeout(() => {
        // Should have received stop typing event
        const stopEvents = emittedEvents.filter(e =>
          e.data.isTyping === false && e.data.userId === 'user-1'
        );
        expect(stopEvents).toHaveLength(1);

        // User should no longer be in typing users list
        const typingUsers = service.getTypingUsers('room-1');
        expect(typingUsers).toHaveLength(0);
        done();
      }, 5500);
    }, 10000); // Increase Jest timeout for this test

    test('should reset inactivity timer on new typing activity', (done) => {
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);

      // Activity after 3 seconds (before timeout)
      setTimeout(() => {
        service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);

        // Check user is still typing after original 5 seconds
        setTimeout(() => {
          const typingUsers = service.getTypingUsers('room-1');
          expect(typingUsers).toHaveLength(1);
          expect(typingUsers[0].userId).toBe('user-1');
        }, 2500);

        // But should stop after new 5 second period
        setTimeout(() => {
          const typingUsers = service.getTypingUsers('room-1');
          expect(typingUsers).toHaveLength(0);
          done();
        }, 5500);
      }, 3000);
    }, 15000); // Increase Jest timeout for this test
  });

  describe('Get Typing Users', () => {
    test('should return current typing users with duration', (done) => {
      const startTime = Date.now();
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);

      setTimeout(() => {
        const typingUsers = service.getTypingUsers('room-1');
        expect(typingUsers).toHaveLength(1);
        expect(typingUsers[0].userId).toBe('user-1');
        expect(typingUsers[0].userName).toBe('John Doe');
        expect(typingUsers[0].duration).toBeGreaterThanOrEqual(900);
        expect(typingUsers[0].duration).toBeLessThan(1100);
        done();
      }, 1000);
    });

    test('should return empty array for non-existent room', () => {
      const typingUsers = service.getTypingUsers('non-existent-room');
      expect(typingUsers).toEqual([]);
    });
  });

  describe('Clear User From All Rooms', () => {
    test('should clear user from all rooms on disconnect', () => {
      const roomEmits: Array<{ roomId: string; event: string; data: any }> = [];
      const mockRoomEmit = (roomId: string, event: string, data: any) => {
        roomEmits.push({ roomId, event, data });
      };

      // User typing in multiple rooms
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-2', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-3', 'user-1', 'John Doe', mockEmit);

      // Clear user from all rooms
      service.clearUserFromAllRooms('user-1', mockRoomEmit);

      // Should emit stop typing to all rooms
      expect(roomEmits).toHaveLength(3);
      expect(roomEmits.every(e => e.data.isTyping === false)).toBe(true);
      expect(roomEmits.map(e => e.roomId).sort()).toEqual(['room-1', 'room-2', 'room-3']);

      // User should not be in any room
      expect(service.getTypingUsers('room-1')).toHaveLength(0);
      expect(service.getTypingUsers('room-2')).toHaveLength(0);
      expect(service.getTypingUsers('room-3')).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    test('should provide accurate statistics', () => {
      // Create typing activity
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-1', 'user-2', 'Jane Smith', mockEmit);
      service.handleTypingStart('room-2', 'user-3', 'Bob Jones', mockEmit);

      const stats = service.getStats();

      expect(stats.activeRooms).toBe(2);
      expect(stats.activeTypingUsers).toBe(3);
      expect(stats.averageUsersPerRoom).toBe(1.5);
    });

    test('should handle empty state correctly', () => {
      const stats = service.getStats();

      expect(stats.activeRooms).toBe(0);
      expect(stats.activeTypingUsers).toBe(0);
      expect(stats.averageUsersPerRoom).toBe(0);
    });
  });

  describe('Service Shutdown', () => {
    test('should clear all state on shutdown', () => {
      // Create some activity
      service.handleTypingStart('room-1', 'user-1', 'John Doe', mockEmit);
      service.handleTypingStart('room-2', 'user-2', 'Jane Smith', mockEmit);

      // Shutdown service
      service.shutdown();

      // All state should be cleared
      const stats = service.getStats();
      expect(stats.activeRooms).toBe(0);
      expect(stats.activeTypingUsers).toBe(0);
    });
  });
});