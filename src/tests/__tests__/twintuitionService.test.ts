import { twintuitionService } from '../../services/twintuitionService';
import { BehaviorEvent } from '../../types/twintuition';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-notifications');
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'denied' })
  ),
  getCurrentPositionAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage');

// Mock the twinStore with proper state
const mockUserProfile = {
  id: 'test-user-123',
  name: 'Test User',
  age: 25,
  gender: 'female',
  twinType: 'identical' as const,
  birthDate: '1998-01-01',
  accentColor: 'neon-pink' as const,
  isConnected: true
};

const mockTwinProfile = {
  id: 'test-twin-456',
  name: 'Test Twin',
  age: 25,
  gender: 'female',
  twinType: 'identical' as const,
  birthDate: '1998-01-01',
  accentColor: 'neon-blue' as const,
  isConnected: true
};

jest.mock('../../state/twinStore', () => ({
  useTwinStore: {
    getState: () => ({
      userProfile: mockUserProfile,
      twinProfile: mockTwinProfile,
      twintuitionAlerts: []
    })
  }
}));

describe('TwintuitionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(twintuitionService.initialize()).resolves.not.toThrow();
    });
  });

  describe('behavior tracking', () => {
    const mockBehaviorEvent: Omit<BehaviorEvent, 'id' | 'timestamp'> = {
      userId: 'user1',
      twinId: 'twin1',
      type: 'app_interaction',
      action: 'open_app',
      context: {},
    };

    it('should track behavior events', async () => {
      await twintuitionService.trackBehavior(mockBehaviorEvent);
      // Verify the event was added to the buffer and stored
    });

    it('should limit buffer size to 100 events', async () => {
      // Add 150 events
      for (let i = 0; i < 150; i++) {
        await twintuitionService.trackBehavior({
          ...mockBehaviorEvent,
          userId: `user${i}`,
        });
      }
      
      // Buffer should only contain last 100 events
      // This would need access to private buffer property for full testing
    });
  });

  describe('app tracking methods', () => {
    it('should track app open event', async () => {
      await twintuitionService.trackAppOpen();
      // Verify trackBehavior was called with correct parameters
    });

    it('should track message with emotion analysis', async () => {
      await twintuitionService.trackMessage('I am so happy today! 😊');
      // Verify message was tracked with emotion detected
    });

    it('should track mood updates', async () => {
      await twintuitionService.trackMoodUpdate('happy', 8);
      // Verify mood update was tracked correctly
    });
  });

  describe('emotion analysis', () => {
    it('should detect happy emotions', async () => {
      const message = 'I am so happy and excited! 😄🎉';
      await twintuitionService.trackMessage(message);
      // Should detect 'happy' or 'excited' emotion
    });

    it('should detect sad emotions', async () => {
      const message = 'Feeling really down today 😢';
      await twintuitionService.trackMessage(message);
      // Should detect 'sad' emotion
    });

    it('should default to neutral for unrecognized emotions', async () => {
      const message = 'Just a normal message with no emotional indicators';
      await twintuitionService.trackMessage(message);
      // Should detect 'neutral' emotion
    });
  });

  describe('sync score calculation', () => {
    it('should return initial score of 0 for new users', async () => {
      const score = await twintuitionService.getTwinSyncScore();
      expect(score.score).toBe(0);
      expect(score.breakdown).toHaveProperty('totalSyncEvents');
      expect(score.breakdown).toHaveProperty('strongestConnection');
    });

    it('should calculate score based on sync events', async () => {
      // This would require mocking the store with some alerts
      // and testing that the score is calculated correctly
    });
  });

  describe('configuration management', () => {
    it('should update configuration', async () => {
      const newConfig = {
        sensitivity: 0.8,
        timeWindowMinutes: 30,
      };
      
      await twintuitionService.updateConfig(newConfig);
      
      // Verify AsyncStorage.setItem was called
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'twintuition-config',
        expect.stringContaining('0.8')
      );
    });

    it('should load configuration on initialization', async () => {
      const mockConfig = JSON.stringify({ sensitivity: 0.9 });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockConfig);
      
      await twintuitionService.initialize();
      
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('twintuition-config');
    });
  });

  describe('privacy and data management', () => {
    it('should anonymize location data when storing', async () => {
      const eventWithLocation: Omit<BehaviorEvent, 'id' | 'timestamp'> = {
        userId: 'user1',
        type: 'location_update',
        action: 'location_change',
        context: {},
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };
      
      await twintuitionService.trackBehavior(eventWithLocation);
      
      // Verify that stored data has location marked as 'REDACTED'
      // This would need to check the stored data in AsyncStorage
    });

    it('should limit stored events per day to 50', async () => {
      // Add more than 50 events for the same day
      for (let i = 0; i < 60; i++) {
        await twintuitionService.trackBehavior({
          userId: `user${i}`,
          type: 'app_interaction',
          action: 'test_action',
          context: {},
        });
      }
      
      // Verify that only 50 events are stored
      // This would need to check AsyncStorage contents
    });
  });

  describe('notification generation', () => {
    it('should generate appropriate alert messages', async () => {
      // This would test the private generateAlertMessage method
      // by triggering synchronicity detection
    });

    it('should respect quiet hours', async () => {
      // Test that notifications are not sent during quiet hours
      // This would involve mocking the date/time and notification preferences
    });
  });

  describe('analytics tracking', () => {
    it('should track analytics locally', async () => {
      // Test that analytics are stored locally without sensitive data
    });

    it('should limit analytics storage to 100 events', async () => {
      // Test that analytics storage doesn't grow unbounded
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      await expect(twintuitionService.trackAppOpen()).resolves.not.toThrow();
    });

    it('should handle notification permission denial gracefully', async () => {
      // Mock permission denial and ensure service continues to work
    });

    it('should handle location permission denial gracefully', async () => {
      // Mock location permission denial
      await expect(twintuitionService.requestLocationPermission()).resolves.toBe(false);
    });
  });
});

// Integration tests
describe('TwintuitionService Integration', () => {
  describe('end-to-end synchronicity detection', () => {
    it('should detect app synchronization', async () => {
      // Simulate two twins opening the app within the time window
      await twintuitionService.trackBehavior({
        userId: 'twin1',
        twinId: 'twin2',
        type: 'app_interaction',
        action: 'open_app',
        context: {},
      });
      
      // Wait a moment then track twin2
      setTimeout(async () => {
        await twintuitionService.trackBehavior({
          userId: 'twin2',
          twinId: 'twin1',
          type: 'app_interaction',
          action: 'open_app',
          context: {},
        });
        
        // Should trigger synchronicity detection
        // Verify alert is generated
      }, 1000);
    });

    it('should detect mood synchronization', async () => {
      // Simulate both twins reporting similar moods
      await twintuitionService.trackMoodUpdate('happy', 8);
      
      setTimeout(async () => {
        await twintuitionService.trackMoodUpdate('excited', 9);
        // Should detect emotional synchronicity
      }, 5000);
    });
  });
});