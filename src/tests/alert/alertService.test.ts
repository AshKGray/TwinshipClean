/**
 * Alert Service Tests
 *
 * Tests for core alert functionality.
 */

import { alertService } from '../../services/alertService';
import { useAlertStore } from '../../state/alertStore';
import { useTwinStore } from '../../state/twinStore';

// Mock dependencies
jest.mock('../../services/firebase/firestore');
jest.mock('../../services/encryptionService');
jest.mock('expo-notifications');

describe('AlertService', () => {
  const mockUserId = 'user123';
  const mockTwinId = 'twin456';

  beforeEach(() => {
    // Reset stores
    useAlertStore.getState().clearAllData();

    // Set up mock user profile
    useTwinStore.setState({
      userProfile: {
        id: mockUserId,
        name: 'Test User',
        age: 25,
        gender: 'male',
        twinType: 'identical',
        birthDate: '1999-01-01',
        accentColor: 'stellar-blue',
        isConnected: true,
      },
      twinProfile: {
        id: mockTwinId,
        name: 'Test Twin',
        age: 25,
        gender: 'male',
        twinType: 'identical',
        birthDate: '1999-01-01',
        accentColor: 'nebula-rose',
        isConnected: true,
      },
    });
  });

  describe('sendAlert', () => {
    it('should send an alert successfully', async () => {
      const alert = await alertService.sendAlert('thinking_of_you', mockTwinId);

      expect(alert).toBeDefined();
      expect(alert.type).toBe('thinking_of_you');
      expect(alert.senderId).toBe(mockUserId);
      expect(alert.receiverId).toBe(mockTwinId);
    });

    it('should send an alert with message and emotion', async () => {
      const alert = await alertService.sendAlert('need_support', mockTwinId, {
        message: 'Thinking of you!',
        emotion: 'happy',
      });

      expect(alert).toBeDefined();
      expect(alert.emotion).toBe('happy');
    });

    it('should update local store after sending', async () => {
      await alertService.sendAlert('sharing_joy', mockTwinId);

      const alerts = useAlertStore.getState().alerts;
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('markAlertAsRead', () => {
    it('should mark an alert as read', async () => {
      const alert = await alertService.sendAlert('random_check_in', mockTwinId);

      await alertService.markAlertAsRead(alert.id);

      const alerts = useAlertStore.getState().alerts;
      const updatedAlert = alerts.find(a => a.id === alert.id);

      expect(updatedAlert?.isRead).toBe(true);
      expect(updatedAlert?.readAt).toBeDefined();
    });
  });

  describe('getAlertStats', () => {
    it('should return alert statistics', async () => {
      // Send a few alerts
      await alertService.sendAlert('thinking_of_you', mockTwinId);
      await alertService.sendAlert('sharing_joy', mockTwinId);

      const stats = await alertService.getAlertStats(mockUserId, 30);

      expect(stats).toBeDefined();
      expect(stats.totalSent).toBeGreaterThan(0);
      expect(stats.alertsByType).toBeDefined();
    });
  });

  describe('generatePatternInsights', () => {
    it('should generate insights from stats', async () => {
      const mockStats = {
        totalSent: 10,
        totalReceived: 8,
        totalSyncMoments: 2,
        mostCommonType: 'thinking_of_you' as const,
        averageResponseTimeMinutes: 15,
        alertsByType: {
          thinking_of_you: 5,
          sharing_joy: 3,
          need_support: 2,
        },
        alertsByHour: {
          9: 3,
          14: 4,
          20: 3,
        },
        alertsByDayOfWeek: {
          1: 2,
          3: 4,
          5: 4,
        },
        recentAlerts: [],
        recentSyncMoments: [],
      };

      const insights = await alertService.generatePatternInsights(mockStats);

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });
  });
});

describe('AlertStore', () => {
  beforeEach(() => {
    useAlertStore.getState().clearAllData();
  });

  it('should add an alert', () => {
    const alert = {
      id: 'alert1',
      type: 'thinking_of_you' as const,
      senderId: 'user1',
      senderName: 'User 1',
      receiverId: 'user2',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    useAlertStore.getState().addAlert(alert);

    const alerts = useAlertStore.getState().alerts;
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toEqual(alert);
  });

  it('should mark alert as read', () => {
    const alert = {
      id: 'alert1',
      type: 'thinking_of_you' as const,
      senderId: 'user1',
      senderName: 'User 1',
      receiverId: 'user2',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    useAlertStore.getState().addAlert(alert);
    useAlertStore.getState().markAlertAsRead('alert1');

    const alerts = useAlertStore.getState().alerts;
    expect(alerts[0].isRead).toBe(true);
    expect(alerts[0].readAt).toBeDefined();
  });

  it('should update unread count', () => {
    const alert1 = {
      id: 'alert1',
      type: 'thinking_of_you' as const,
      senderId: 'user1',
      senderName: 'User 1',
      receiverId: 'user2',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const alert2 = {
      id: 'alert2',
      type: 'sharing_joy' as const,
      senderId: 'user1',
      senderName: 'User 1',
      receiverId: 'user2',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    useAlertStore.getState().addAlert(alert1);
    useAlertStore.getState().addAlert(alert2);

    expect(useAlertStore.getState().unreadCount).toBe(2);

    useAlertStore.getState().markAlertAsRead('alert1');

    expect(useAlertStore.getState().unreadCount).toBe(1);
  });

  it('should add sync moment', () => {
    const moment = {
      id: 'sync1',
      alert1Id: 'alert1',
      alert2Id: 'alert2',
      user1Id: 'user1',
      user2Id: 'user2',
      timeDifferenceSeconds: 5,
      detectedAt: new Date().toISOString(),
      celebrated: false,
    };

    useAlertStore.getState().addSyncMoment(moment);

    const moments = useAlertStore.getState().syncMoments;
    expect(moments).toHaveLength(1);
    expect(moments[0]).toEqual(moment);
  });
});
