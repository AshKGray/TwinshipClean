/**
 * Alert Service - Business logic for Twintuition alerts
 *
 * Handles sending, receiving, and analyzing alerts with Firebase integration.
 * Stories: 3-2, 3-3, 3-4, 3-5, 3-6
 */

import * as Notifications from 'expo-notifications';
import { firestoreService } from './firebase/firestore';
import { EncryptionService } from './encryptionService';
import { useAlertStore } from '../state/alertStore';
import { useTwinStore } from '../state/twinStore';
import type {
  TwintuitionAlert,
  TwintuitionAlertType,
  EncryptedAlert,
  CosmicSyncMoment,
  AlertStats,
  AlertPatternInsight,
} from '../types/alert';
import type { Unsubscribe } from 'firebase/firestore';
import { where, orderBy, limit } from 'firebase/firestore';

// Collection names
const ALERTS_COLLECTION = 'twintuition_alerts';
const SYNC_MOMENTS_COLLECTION = 'cosmic_sync_moments';

// Sync detection window (60 seconds)
const SYNC_WINDOW_SECONDS = 60;

class AlertServiceClass {
  private alertListener: Unsubscribe | null = null;
  private syncMomentListener: Unsubscribe | null = null;

  /**
   * Send a twintuition alert
   * Story: 3-2 Send Twintuition Alert
   */
  async sendAlert(
    type: TwintuitionAlertType,
    receiverId: string,
    options?: {
      message?: string;
      emotion?: string;
    }
  ): Promise<TwintuitionAlert> {
    try {
      const twinStore = useTwinStore.getState();
      const userProfile = twinStore.userProfile;

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Generate alert ID
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Create alert object
      let alert: TwintuitionAlert = {
        id: alertId,
        type,
        senderId: userProfile.id,
        senderName: userProfile.name,
        receiverId,
        timestamp,
        isRead: false,
      };

      // Add optional fields
      if (options?.emotion) {
        alert.emotion = options.emotion;
      }

      // Encrypt message if provided
      if (options?.message) {
        const encryptedMessage = await EncryptionService.encrypt(options.message);
        const encryptedAlert: EncryptedAlert = {
          ...alert,
          encryptedMessage,
        };

        // Save to Firebase with encrypted message
        await firestoreService.createDocument(ALERTS_COLLECTION, alertId, encryptedAlert);
      } else {
        // Save to Firebase without message
        await firestoreService.createDocument(ALERTS_COLLECTION, alertId, alert);
      }

      // Update local state
      useAlertStore.getState().addAlert(alert);
      useAlertStore.getState().setLastAlertSentAt(timestamp);

      // Check for simultaneous alert (cosmic sync moment)
      await this.checkForSimultaneousAlert(alert);

      console.log(`✅ Alert sent: ${type} to ${receiverId}`);
      return alert;
    } catch (error) {
      console.error('❌ Error sending alert:', error);
      throw error;
    }
  }

  /**
   * Mark alert as read
   * Story: 3-3 Receive and Display Alerts
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    try {
      const readAt = new Date().toISOString();

      await firestoreService.updateDocument(ALERTS_COLLECTION, alertId, {
        isRead: true,
        readAt,
      });

      useAlertStore.getState().markAlertAsRead(alertId);

      console.log(`✅ Alert marked as read: ${alertId}`);
    } catch (error) {
      console.error('❌ Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Start listening for incoming alerts
   * Story: 3-3 Receive and Display Alerts
   */
  startAlertListener(userId: string): void {
    if (this.alertListener) {
      console.log('⚠️  Alert listener already active');
      return;
    }

    console.log(`👂 Starting alert listener for user: ${userId}`);

    this.alertListener = firestoreService.onCollectionSnapshotSimple<EncryptedAlert>(
      ALERTS_COLLECTION,
      [
        { field: 'receiverId', operator: '==', value: userId },
      ],
      { field: 'timestamp', direction: 'desc' },
      100,
      async (alerts) => {
        console.log(`📬 Received ${alerts.length} alerts`);

        // Decrypt messages and convert to TwintuitionAlert
        const decryptedAlerts: TwintuitionAlert[] = await Promise.all(
          alerts.map(async (alert) => {
            if (alert.encryptedMessage) {
              try {
                const message = await EncryptionService.decrypt(alert.encryptedMessage);
                return { ...alert, message } as TwintuitionAlert;
              } catch (error) {
                console.error('Failed to decrypt alert message:', error);
                return alert as TwintuitionAlert;
              }
            }
            return alert as TwintuitionAlert;
          })
        );

        // Update local store
        useAlertStore.getState().setAlerts(decryptedAlerts);

        // Show notification for new unread alerts
        const unreadAlerts = decryptedAlerts.filter(a => !a.isRead);
        if (unreadAlerts.length > 0) {
          await this.showAlertNotification(unreadAlerts[0]);
        }
      },
      (error) => {
        console.error('❌ Error in alert listener:', error);
      }
    );
  }

  /**
   * Stop listening for alerts
   */
  stopAlertListener(): void {
    if (this.alertListener) {
      this.alertListener();
      this.alertListener = null;
      console.log('🔇 Alert listener stopped');
    }
  }

  /**
   * Start listening for sync moments
   * Story: 3-5 Simultaneous Alert Detection
   */
  startSyncMomentListener(userId: string): void {
    if (this.syncMomentListener) {
      console.log('⚠️  Sync moment listener already active');
      return;
    }

    console.log(`👂 Starting sync moment listener for user: ${userId}`);

    this.syncMomentListener = firestoreService.onCollectionSnapshotSimple<CosmicSyncMoment>(
      SYNC_MOMENTS_COLLECTION,
      [
        { field: 'user1Id', operator: '==', value: userId },
      ],
      { field: 'detectedAt', direction: 'desc' },
      50,
      (moments) => {
        console.log(`✨ Received ${moments.length} sync moments`);
        useAlertStore.getState().setSyncMoments(moments);

        // Show celebration for new uncelebrated moments
        const uncelebrated = moments.filter(m => !m.celebrated);
        if (uncelebrated.length > 0) {
          this.celebrateSyncMoment(uncelebrated[0]);
        }
      },
      (error) => {
        console.error('❌ Error in sync moment listener:', error);
      }
    );
  }

  /**
   * Stop listening for sync moments
   */
  stopSyncMomentListener(): void {
    if (this.syncMomentListener) {
      this.syncMomentListener();
      this.syncMomentListener = null;
      console.log('🔇 Sync moment listener stopped');
    }
  }

  /**
   * Check for simultaneous alert (cosmic sync)
   * Story: 3-5 Simultaneous Alert Detection
   */
  private async checkForSimultaneousAlert(alert: TwintuitionAlert): Promise<void> {
    try {
      const recentAlerts = await firestoreService.queryCollectionSimple<TwintuitionAlert>(
        ALERTS_COLLECTION,
        [
          { field: 'senderId', operator: '==', value: alert.receiverId },
          { field: 'receiverId', operator: '==', value: alert.senderId },
        ],
        { field: 'timestamp', direction: 'desc' },
        10
      );

      const alertTime = new Date(alert.timestamp);

      for (const otherAlert of recentAlerts) {
        const otherTime = new Date(otherAlert.timestamp);
        const timeDiff = Math.abs((alertTime.getTime() - otherTime.getTime()) / 1000);

        if (timeDiff <= SYNC_WINDOW_SECONDS) {
          // Cosmic sync detected!
          await this.createSyncMoment(alert, otherAlert, timeDiff);
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error checking for simultaneous alert:', error);
    }
  }

  /**
   * Create cosmic sync moment
   */
  private async createSyncMoment(
    alert1: TwintuitionAlert,
    alert2: TwintuitionAlert,
    timeDiff: number
  ): Promise<void> {
    try {
      const momentId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const syncMoment: CosmicSyncMoment = {
        id: momentId,
        alert1Id: alert1.id,
        alert2Id: alert2.id,
        user1Id: alert1.senderId,
        user2Id: alert2.senderId,
        timeDifferenceSeconds: timeDiff,
        detectedAt: new Date().toISOString(),
        celebrated: false,
      };

      await firestoreService.createDocument(SYNC_MOMENTS_COLLECTION, momentId, syncMoment);
      useAlertStore.getState().addSyncMoment(syncMoment);

      console.log(`✨ Cosmic sync moment created! Time diff: ${timeDiff}s`);
    } catch (error) {
      console.error('❌ Error creating sync moment:', error);
    }
  }

  /**
   * Celebrate cosmic sync moment
   */
  private async celebrateSyncMoment(moment: CosmicSyncMoment): Promise<void> {
    try {
      // Show notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Cosmic Sync Moment! ✨',
          body: `You and your twin sent alerts at the same time! (${moment.timeDifferenceSeconds}s apart)`,
          data: { type: 'cosmic_sync', momentId: moment.id },
          sound: 'default',
        },
        trigger: null,
      });

      // Mark as celebrated
      await firestoreService.updateDocument(SYNC_MOMENTS_COLLECTION, moment.id, {
        celebrated: true,
      });

      useAlertStore.getState().markSyncMomentCelebrated(moment.id);
    } catch (error) {
      console.error('❌ Error celebrating sync moment:', error);
    }
  }

  /**
   * Show push notification for alert
   */
  private async showAlertNotification(alert: TwintuitionAlert): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${alert.senderName} sent you an alert`,
          body: alert.message || 'Tap to view',
          data: { type: 'twintuition_alert', alertId: alert.id },
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error showing alert notification:', error);
    }
  }

  /**
   * Get alert statistics
   * Story: 3-6 Pattern Analysis
   */
  async getAlertStats(userId: string, days: number = 30): Promise<AlertStats> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const alerts = await firestoreService.queryCollectionSimple<TwintuitionAlert>(
        ALERTS_COLLECTION,
        [
          { field: 'timestamp', operator: '>=', value: cutoffDate.toISOString() },
        ],
        { field: 'timestamp', direction: 'desc' }
      );

      const userAlerts = alerts.filter(
        a => a.senderId === userId || a.receiverId === userId
      );

      const sent = userAlerts.filter(a => a.senderId === userId);
      const received = userAlerts.filter(a => a.receiverId === userId);

      // Count by type
      const alertsByType: Record<string, number> = {};
      userAlerts.forEach(alert => {
        alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      });

      // Count by hour
      const alertsByHour: Record<number, number> = {};
      userAlerts.forEach(alert => {
        const hour = new Date(alert.timestamp).getHours();
        alertsByHour[hour] = (alertsByHour[hour] || 0) + 1;
      });

      // Count by day of week
      const alertsByDayOfWeek: Record<number, number> = {};
      userAlerts.forEach(alert => {
        const day = new Date(alert.timestamp).getDay();
        alertsByDayOfWeek[day] = (alertsByDayOfWeek[day] || 0) + 1;
      });

      // Most common type
      let mostCommonType: TwintuitionAlertType | null = null;
      let maxCount = 0;
      Object.entries(alertsByType).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonType = type as TwintuitionAlertType;
        }
      });

      // Average response time
      const responseTimes: number[] = [];
      received.forEach(alert => {
        if (alert.readAt) {
          const sent = new Date(alert.timestamp);
          const read = new Date(alert.readAt);
          const diff = (read.getTime() - sent.getTime()) / (1000 * 60); // minutes
          responseTimes.push(diff);
        }
      });
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Get sync moments
      const syncMoments = await firestoreService.queryCollectionSimple<CosmicSyncMoment>(
        SYNC_MOMENTS_COLLECTION,
        [
          { field: 'user1Id', operator: '==', value: userId },
        ],
        { field: 'detectedAt', direction: 'desc' },
        10
      );

      const stats: AlertStats = {
        totalSent: sent.length,
        totalReceived: received.length,
        totalSyncMoments: syncMoments.length,
        mostCommonType,
        averageResponseTimeMinutes: Math.round(avgResponseTime),
        alertsByType: alertsByType as any,
        alertsByHour: alertsByHour as any,
        alertsByDayOfWeek: alertsByDayOfWeek as any,
        recentAlerts: userAlerts.slice(0, 20),
        recentSyncMoments: syncMoments,
      };

      // Cache stats
      useAlertStore.getState().updateStatsCache(stats);

      return stats;
    } catch (error) {
      console.error('❌ Error getting alert stats:', error);
      throw error;
    }
  }

  /**
   * Generate pattern insights
   * Story: 3-6 Pattern Analysis
   */
  async generatePatternInsights(stats: AlertStats): Promise<AlertPatternInsight[]> {
    const insights: AlertPatternInsight[] = [];

    // Frequency insight
    const totalAlerts = stats.totalSent + stats.totalReceived;
    const avgPerDay = totalAlerts / 30;
    if (avgPerDay > 2) {
      insights.push({
        type: 'frequency',
        title: 'Highly Connected',
        description: `You exchange ${avgPerDay.toFixed(1)} alerts per day on average`,
        data: { avgPerDay },
        confidence: 0.9,
      });
    }

    // Timing insight
    const hourCounts = Object.entries(stats.alertsByHour)
      .sort(([, a], [, b]) => b - a);

    if (hourCounts.length > 0) {
      const peakHour = parseInt(hourCounts[0][0]);
      const timeOfDay = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';

      insights.push({
        type: 'timing',
        title: `Peak Connection: ${timeOfDay}`,
        description: `Most alerts sent around ${peakHour}:00`,
        data: { peakHour, timeOfDay },
        confidence: 0.85,
      });
    }

    // Reciprocity insight
    const reciprocityRatio = stats.totalReceived > 0
      ? stats.totalSent / stats.totalReceived
      : stats.totalSent;

    if (reciprocityRatio > 0.8 && reciprocityRatio < 1.2) {
      insights.push({
        type: 'reciprocity',
        title: 'Balanced Connection',
        description: 'You both reach out equally',
        data: { ratio: reciprocityRatio },
        confidence: 0.9,
      });
    }

    // Sync rate insight
    if (stats.totalSyncMoments > 0 && totalAlerts > 0) {
      const syncRate = (stats.totalSyncMoments / totalAlerts) * 100;

      insights.push({
        type: 'sync_rate',
        title: 'Cosmic Synchronicity',
        description: `${syncRate.toFixed(1)}% of alerts create sync moments`,
        data: { syncRate, totalSyncMoments: stats.totalSyncMoments },
        confidence: 0.95,
      });
    }

    return insights;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      await firestoreService.deleteDocument(ALERTS_COLLECTION, alertId);
      useAlertStore.getState().deleteAlert(alertId);
      console.log(`✅ Alert deleted: ${alertId}`);
    } catch (error) {
      console.error('❌ Error deleting alert:', error);
      throw error;
    }
  }

  /**
   * Initialize alert service
   */
  async initialize(userId: string): Promise<void> {
    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️  Notification permissions not granted');
      }

      // Start listeners
      this.startAlertListener(userId);
      this.startSyncMomentListener(userId);

      console.log('✅ Alert service initialized');
    } catch (error) {
      console.error('❌ Error initializing alert service:', error);
      throw error;
    }
  }

  /**
   * Cleanup alert service
   */
  cleanup(): void {
    this.stopAlertListener();
    this.stopSyncMomentListener();
    console.log('✅ Alert service cleanup complete');
  }
}

// Export singleton instance
export const alertService = new AlertServiceClass();
