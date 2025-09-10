import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BehaviorEvent,
  SyncEvent,
  TwintuitionConfig,
  TwintuitionAnalytics,
  TwinConnectionMetrics,
  NotificationPreferences,
} from '../types/twintuition';
import { TwintuitionAlert } from '../state/twinStore';

interface TwintuitionState {
  // Configuration
  config: TwintuitionConfig;
  notificationPrefs: NotificationPreferences;
  
  // Data
  syncEvents: SyncEvent[];
  behaviorHistory: BehaviorEvent[];
  currentAlert: TwintuitionAlert | null;
  
  // Analytics
  analytics: TwintuitionAnalytics | null;
  connectionMetrics: TwinConnectionMetrics | null;
  
  // UI State
  showingAlert: boolean;
  syncScore: number;
  lastAnalysisTime: string | null;
  
  // Actions
  updateConfig: (config: Partial<TwintuitionConfig>) => void;
  updateNotificationPrefs: (prefs: Partial<NotificationPreferences>) => void;
  addSyncEvent: (event: SyncEvent) => void;
  addBehaviorEvent: (event: BehaviorEvent) => void;
  setCurrentAlert: (alert: TwintuitionAlert | null) => void;
  setShowingAlert: (showing: boolean) => void;
  updateAnalytics: (analytics: TwintuitionAnalytics) => void;
  updateConnectionMetrics: (metrics: TwinConnectionMetrics) => void;
  updateSyncScore: (score: number) => void;
  clearOldData: (daysToKeep?: number) => void;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
}

const defaultConfig: TwintuitionConfig = {
  sensitivity: 0.7,
  timeWindowMinutes: 15,
  enableLocationSync: false,
  enableMoodSync: true,
  enableActionSync: true,
  minConfidenceThreshold: 0.6,
};

const defaultNotificationPrefs: NotificationPreferences = {
  enabled: true,
  quietHours: {
    start: '22:00',
    end: '08:00',
  },
  minimumConfidence: 0.6,
  allowedTypes: ['simultaneous_action', 'mood_synchronization', 'app_synchronization'],
  soundEnabled: true,
  vibrationEnabled: true,
};

export const useTwintuitionStore = create<TwintuitionState>()(persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      notificationPrefs: defaultNotificationPrefs,
      syncEvents: [],
      behaviorHistory: [],
      currentAlert: null,
      analytics: null,
      connectionMetrics: null,
      showingAlert: false,
      syncScore: 0,
      lastAnalysisTime: null,

      // Actions
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      updateNotificationPrefs: (newPrefs) =>
        set((state) => ({
          notificationPrefs: { ...state.notificationPrefs, ...newPrefs },
        })),

      addSyncEvent: (event) =>
        set((state) => ({
          syncEvents: [event, ...state.syncEvents].slice(0, 100), // Keep last 100
        })),

      addBehaviorEvent: (event) =>
        set((state) => ({
          behaviorHistory: [event, ...state.behaviorHistory].slice(0, 200), // Keep last 200
        })),

      setCurrentAlert: (alert) => set({ currentAlert: alert }),

      setShowingAlert: (showing) => set({ showingAlert: showing }),

      updateAnalytics: (analytics) => set({ analytics }),

      updateConnectionMetrics: (metrics) => set({ connectionMetrics }),

      updateSyncScore: (score) => set({ syncScore }),

      clearOldData: (daysToKeep = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTime = cutoffDate.toISOString();

        set((state) => ({
          syncEvents: state.syncEvents.filter(
            (event) => event.detectedAt >= cutoffTime
          ),
          behaviorHistory: state.behaviorHistory.filter(
            (event) => event.timestamp >= cutoffTime
          ),
        }));
      },

      exportData: async () => {
        const state = get();
        const exportData = {
          syncEvents: state.syncEvents,
          analytics: state.analytics,
          connectionMetrics: state.connectionMetrics,
          config: state.config,
          exportedAt: new Date().toISOString(),
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: async (data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.syncEvents && Array.isArray(parsed.syncEvents)) {
            set((state) => ({
              syncEvents: [...parsed.syncEvents, ...state.syncEvents].slice(0, 100),
              analytics: parsed.analytics || state.analytics,
              connectionMetrics: parsed.connectionMetrics || state.connectionMetrics,
              config: { ...state.config, ...(parsed.config || {}) },
            }));
          }
        } catch (error) {
          console.error('Failed to import data:', error);
          throw new Error('Invalid data format');
        }
      },
    }),
    {
      name: 'twintuition-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        config: state.config,
        notificationPrefs: state.notificationPrefs,
        syncEvents: state.syncEvents.slice(0, 50), // Only persist recent events
        analytics: state.analytics,
        connectionMetrics: state.connectionMetrics,
        syncScore: state.syncScore,
        lastAnalysisTime: state.lastAnalysisTime,
      }),
    }
  )
);

// Computed selectors
export const useTwintuitionSelectors = () => {
  const store = useTwintuitionStore();
  
  return {
    // Get sync events by type
    getSyncEventsByType: (type: SyncEvent['type']) =>
      store.syncEvents.filter((event) => event.type === type),
    
    // Get recent high-confidence events
    getHighConfidenceEvents: (minConfidence = 0.8) =>
      store.syncEvents.filter((event) => event.confidence >= minConfidence),
    
    // Get sync events for date range
    getSyncEventsInRange: (startDate: Date, endDate: Date) =>
      store.syncEvents.filter((event) => {
        const eventDate = new Date(event.detectedAt);
        return eventDate >= startDate && eventDate <= endDate;
      }),
    
    // Get behavior events by type
    getBehaviorEventsByType: (type: BehaviorEvent['type']) =>
      store.behaviorHistory.filter((event) => event.type === type),
    
    // Calculate streak days
    getCurrentSyncStreak: () => {
      const events = store.syncEvents.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const event of events) {
        const eventDate = new Date(event.detectedAt);
        eventDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor(
          (currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff === streak) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      return streak;
    },
    
    // Get most active sync times
    getMostActiveSyncTimes: () => {
      const hourCounts = new Map<number, number>();
      
      store.syncEvents.forEach((event) => {
        const hour = new Date(event.detectedAt).getHours();
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      });
      
      return Array.from(hourCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour, count }));
    },
  };
};

// Helper function to check if notifications should be shown
export const shouldShowNotification = (state: TwintuitionState): boolean => {
  if (!state.notificationPrefs.enabled) return false;
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const quietStart = state.notificationPrefs.quietHours.start;
  const quietEnd = state.notificationPrefs.quietHours.end;
  
  // Check if current time is in quiet hours
  if (quietStart <= quietEnd) {
    // Same day range (e.g., 14:00 to 18:00)
    if (currentTime >= quietStart && currentTime <= quietEnd) {
      return false;
    }
  } else {
    // Overnight range (e.g., 22:00 to 08:00)
    if (currentTime >= quietStart || currentTime <= quietEnd) {
      return false;
    }
  }
  
  return true;
};