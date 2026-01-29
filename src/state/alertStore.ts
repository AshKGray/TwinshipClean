/**
 * Alert Store - Zustand state management for Twintuition alerts
 *
 * Manages local state for alerts, sync moments, and statistics.
 * Story: Epic 3 - Twintuition Alert System
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  TwintuitionAlert,
  CosmicSyncMoment,
  AlertStats,
  TwintuitionAlertType,
  AlertPatternInsight,
} from '../types/alert';

interface AlertState {
  // Alert data
  alerts: TwintuitionAlert[];
  syncMoments: CosmicSyncMoment[];
  unreadCount: number;

  // UI state
  showingAlert: TwintuitionAlert | null;
  lastAlertSentAt: string | null;

  // Statistics cache
  statsCache: AlertStats | null;
  statsCacheTimestamp: string | null;

  // Actions - Alerts
  addAlert: (alert: TwintuitionAlert) => void;
  updateAlert: (id: string, updates: Partial<TwintuitionAlert>) => void;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: () => void;
  deleteAlert: (id: string) => void;
  setAlerts: (alerts: TwintuitionAlert[]) => void;

  // Actions - Sync Moments
  addSyncMoment: (moment: CosmicSyncMoment) => void;
  markSyncMomentCelebrated: (id: string) => void;
  setSyncMoments: (moments: CosmicSyncMoment[]) => void;

  // Actions - UI
  setShowingAlert: (alert: TwintuitionAlert | null) => void;
  setLastAlertSentAt: (timestamp: string) => void;

  // Actions - Stats
  updateStatsCache: (stats: AlertStats) => void;
  clearStatsCache: () => void;

  // Utility actions
  clearAllData: () => void;
}

const INITIAL_STATE = {
  alerts: [],
  syncMoments: [],
  unreadCount: 0,
  showingAlert: null,
  lastAlertSentAt: null,
  statsCache: null,
  statsCacheTimestamp: null,
};

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Alert actions
      addAlert: (alert) =>
        set((state) => {
          const newAlerts = [alert, ...state.alerts];
          const unreadCount = newAlerts.filter(a => !a.isRead).length;

          return {
            alerts: newAlerts,
            unreadCount,
          };
        }),

      updateAlert: (id, updates) =>
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === id ? { ...alert, ...updates } : alert
          ),
        })),

      markAlertAsRead: (id) =>
        set((state) => {
          const alerts = state.alerts.map(alert =>
            alert.id === id
              ? { ...alert, isRead: true, readAt: new Date().toISOString() }
              : alert
          );
          const unreadCount = alerts.filter(a => !a.isRead).length;

          return { alerts, unreadCount };
        }),

      markAllAlertsAsRead: () =>
        set((state) => ({
          alerts: state.alerts.map(alert => ({
            ...alert,
            isRead: true,
            readAt: alert.readAt || new Date().toISOString(),
          })),
          unreadCount: 0,
        })),

      deleteAlert: (id) =>
        set((state) => {
          const alerts = state.alerts.filter(alert => alert.id !== id);
          const unreadCount = alerts.filter(a => !a.isRead).length;

          return { alerts, unreadCount };
        }),

      setAlerts: (alerts) =>
        set({
          alerts,
          unreadCount: alerts.filter(a => !a.isRead).length,
        }),

      // Sync moment actions
      addSyncMoment: (moment) =>
        set((state) => ({
          syncMoments: [moment, ...state.syncMoments],
        })),

      markSyncMomentCelebrated: (id) =>
        set((state) => ({
          syncMoments: state.syncMoments.map(moment =>
            moment.id === id ? { ...moment, celebrated: true } : moment
          ),
        })),

      setSyncMoments: (moments) =>
        set({ syncMoments: moments }),

      // UI actions
      setShowingAlert: (alert) =>
        set({ showingAlert: alert }),

      setLastAlertSentAt: (timestamp) =>
        set({ lastAlertSentAt: timestamp }),

      // Stats actions
      updateStatsCache: (stats) =>
        set({
          statsCache: stats,
          statsCacheTimestamp: new Date().toISOString(),
        }),

      clearStatsCache: () =>
        set({
          statsCache: null,
          statsCacheTimestamp: null,
        }),

      // Utility
      clearAllData: () =>
        set(INITIAL_STATE),
    }),
    {
      name: 'alert-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alerts: state.alerts.slice(0, 100), // Keep last 100 alerts
        syncMoments: state.syncMoments.slice(0, 50), // Keep last 50 sync moments
        unreadCount: state.unreadCount,
        lastAlertSentAt: state.lastAlertSentAt,
        statsCache: state.statsCache,
        statsCacheTimestamp: state.statsCacheTimestamp,
      }),
    }
  )
);

// Selectors
export const useAlertSelectors = () => {
  const store = useAlertStore();

  return {
    // Get alerts by type
    getAlertsByType: (type: TwintuitionAlertType) =>
      store.alerts.filter(alert => alert.type === type),

    // Get sent alerts
    getSentAlerts: (userId: string) =>
      store.alerts.filter(alert => alert.senderId === userId),

    // Get received alerts
    getReceivedAlerts: (userId: string) =>
      store.alerts.filter(alert => alert.receiverId === userId),

    // Get unread alerts
    getUnreadAlerts: () =>
      store.alerts.filter(alert => !alert.isRead),

    // Get recent alerts
    getRecentAlerts: (limit: number = 10) =>
      store.alerts.slice(0, limit),

    // Get alerts in date range
    getAlertsInRange: (startDate: Date, endDate: Date) =>
      store.alerts.filter(alert => {
        const alertDate = new Date(alert.timestamp);
        return alertDate >= startDate && alertDate <= endDate;
      }),

    // Get uncelebrated sync moments
    getUncelebratedSyncMoments: () =>
      store.syncMoments.filter(moment => !moment.celebrated),

    // Check if can send alert (throttling)
    canSendAlert: (cooldownMinutes: number = 5) => {
      if (!store.lastAlertSentAt) return true;

      const lastSent = new Date(store.lastAlertSentAt);
      const now = new Date();
      const minutesSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60);

      return minutesSinceLastSent >= cooldownMinutes;
    },

    // Get next available send time
    getNextAvailableSendTime: (cooldownMinutes: number = 5): Date | null => {
      if (!store.lastAlertSentAt) return null;

      const lastSent = new Date(store.lastAlertSentAt);
      const nextAvailable = new Date(lastSent.getTime() + cooldownMinutes * 60 * 1000);

      return nextAvailable > new Date() ? nextAvailable : null;
    },
  };
};
