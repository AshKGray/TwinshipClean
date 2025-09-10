/**
 * Telemetry Store - Privacy-First State Management for Assessment Analytics
 * Manages telemetry configuration, consent, and real-time monitoring
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  TelemetryConfig, 
  TelemetryAlert, 
  TelemetryDashboardData,
  NormingStatistics,
  ItemAnalysis,
  AnonymousSession,
  TelemetryPrivacyLevel
} from '../types/telemetry';

interface TelemetryState {
  // Configuration & Consent
  config: TelemetryConfig;
  userConsent: boolean;
  consentTimestamp?: string;
  consentVersion: string;

  // Session Management
  currentSession: AnonymousSession | null;
  sessionHistory: Partial<AnonymousSession>[];
  
  // Real-time Monitoring
  alerts: TelemetryAlert[];
  isMonitoring: boolean;
  lastAlertCheck: string;
  
  // Analytics Data
  dashboardData: TelemetryDashboardData | null;
  normingStatistics: Map<string, NormingStatistics>;
  itemAnalyses: Map<string, ItemAnalysis>;
  
  // Performance Metrics
  performanceMetrics: {
    averageResponseTime: number;
    dataQualityScore: number;
    anomalyRate: number;
    systemLoad: number;
    lastUpdated: string;
  };

  // Queue Management
  eventQueueSize: number;
  batchesProcessed: number;
  failedBatches: number;
  lastBatchTimestamp?: string;
}

interface TelemetryActions {
  // Configuration
  updateConfig: (config: Partial<TelemetryConfig>) => void;
  updateConsent: (consent: boolean) => Promise<void>;
  resetConfiguration: () => void;

  // Session Management
  setCurrentSession: (session: AnonymousSession | null) => void;
  addToSessionHistory: (session: Partial<AnonymousSession>) => void;
  clearSessionHistory: () => void;

  // Alert Management
  addAlert: (alert: Omit<TelemetryAlert, 'id'>) => void;
  resolveAlert: (alertId: string) => void;
  clearAlerts: () => void;
  markAlertAsRead: (alertId: string) => void;

  // Analytics
  updateDashboardData: (data: TelemetryDashboardData) => void;
  addNormingStatistics: (questionId: string, stats: NormingStatistics) => void;
  addItemAnalysis: (questionId: string, analysis: ItemAnalysis) => void;
  clearAnalyticsData: () => void;

  // Performance
  updatePerformanceMetrics: (metrics: Partial<TelemetryState['performanceMetrics']>) => void;
  incrementEventQueue: () => void;
  decrementEventQueue: () => void;
  incrementBatchesProcessed: () => void;
  incrementFailedBatches: () => void;

  // Utilities
  getPrivacyCompliantData: () => Partial<TelemetryState>;
  exportData: () => string;
  importData: (data: string) => void;
  getTelemetryStatus: () => 'disabled' | 'enabled' | 'consent_required' | 'error';
}

const initialConfig: TelemetryConfig = {
  enabled: false,
  privacyLevel: 'anonymous',
  collectPerformanceMetrics: true,
  collectAnomalyData: true,
  collectNormingData: true,
  batchSize: 50,
  maxRetries: 3,
  retentionDays: 90,
  encryptionEnabled: true,
  consentRequired: true,
  anonymizationDelay: 300000, // 5 minutes
};

const initialPerformanceMetrics = {
  averageResponseTime: 0,
  dataQualityScore: 1.0,
  anomalyRate: 0,
  systemLoad: 0,
  lastUpdated: new Date().toISOString(),
};

export const useTelemetryStore = create<TelemetryState & TelemetryActions>()(
  persist(
    (set, get) => ({
      // Initial State
      config: initialConfig,
      userConsent: false,
      consentVersion: '1.0.0',
      currentSession: null,
      sessionHistory: [],
      alerts: [],
      isMonitoring: false,
      lastAlertCheck: new Date().toISOString(),
      dashboardData: null,
      normingStatistics: new Map(),
      itemAnalyses: new Map(),
      performanceMetrics: initialPerformanceMetrics,
      eventQueueSize: 0,
      batchesProcessed: 0,
      failedBatches: 0,

      // Configuration Actions
      updateConfig: (newConfig) => 
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      resetConfiguration: () =>
        set(() => ({
          config: initialConfig,
          userConsent: false,
          consentTimestamp: undefined,
        })),

      updateConsent: async (consent: boolean) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          userConsent: consent,
          consentTimestamp: timestamp,
          config: { ...state.config, enabled: consent },
        }));

        // Clear sensitive data if consent withdrawn
        if (!consent) {
          set((state) => ({
            currentSession: null,
            sessionHistory: [],
            alerts: state.alerts.filter(alert => alert.type !== 'data_concern'),
            dashboardData: null,
            normingStatistics: new Map(),
            itemAnalyses: new Map(),
          }));
        }
      },

      // Session Management
      setCurrentSession: (session) =>
        set(() => ({ currentSession: session })),

      addToSessionHistory: (session) =>
        set((state) => ({
          sessionHistory: [
            ...state.sessionHistory.slice(-19), // Keep last 20 sessions
            session,
          ],
        })),

      clearSessionHistory: () =>
        set(() => ({ sessionHistory: [] })),

      // Alert Management
      addAlert: (alertData) => {
        const alert: TelemetryAlert = {
          ...alertData,
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          resolved: false,
        };

        set((state) => ({
          alerts: [alert, ...state.alerts.slice(0, 49)], // Keep last 50 alerts
        }));

        // Auto-resolve low-priority info alerts after 5 minutes
        if (alert.severity === 'info') {
          setTimeout(() => {
            get().resolveAlert(alert.id);
          }, 300000);
        }
      },

      resolveAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? { ...alert, resolved: true, resolvedAt: new Date().toISOString() }
              : alert
          ),
        })),

      markAlertAsRead: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === alertId
              ? { ...alert, context: { ...alert.context, read: true } }
              : alert
          ),
        })),

      clearAlerts: () =>
        set(() => ({ alerts: [] })),

      // Analytics Actions
      updateDashboardData: (data) =>
        set(() => ({ 
          dashboardData: data,
          performanceMetrics: {
            ...get().performanceMetrics,
            lastUpdated: new Date().toISOString(),
          },
        })),

      addNormingStatistics: (questionId, stats) =>
        set((state) => {
          const newMap = new Map(state.normingStatistics);
          newMap.set(questionId, stats);
          return { normingStatistics: newMap };
        }),

      addItemAnalysis: (questionId, analysis) =>
        set((state) => {
          const newMap = new Map(state.itemAnalyses);
          newMap.set(questionId, analysis);
          return { itemAnalyses: newMap };
        }),

      clearAnalyticsData: () =>
        set(() => ({
          dashboardData: null,
          normingStatistics: new Map(),
          itemAnalyses: new Map(),
        })),

      // Performance Actions
      updatePerformanceMetrics: (metrics) =>
        set((state) => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            ...metrics,
            lastUpdated: new Date().toISOString(),
          },
        })),

      incrementEventQueue: () =>
        set((state) => ({ eventQueueSize: state.eventQueueSize + 1 })),

      decrementEventQueue: () =>
        set((state) => ({ 
          eventQueueSize: Math.max(0, state.eventQueueSize - 1) 
        })),

      incrementBatchesProcessed: () =>
        set((state) => ({
          batchesProcessed: state.batchesProcessed + 1,
          lastBatchTimestamp: new Date().toISOString(),
        })),

      incrementFailedBatches: () =>
        set((state) => ({ failedBatches: state.failedBatches + 1 })),

      // Utility Actions
      getPrivacyCompliantData: () => {
        const state = get();
        
        // Return only non-sensitive data based on privacy level
        const baseData = {
          config: {
            ...state.config,
            // Remove any potentially sensitive config
          },
          userConsent: state.userConsent,
          consentVersion: state.consentVersion,
          performanceMetrics: state.performanceMetrics,
          eventQueueSize: state.eventQueueSize,
          batchesProcessed: state.batchesProcessed,
          isMonitoring: state.isMonitoring,
        };

        if (state.config.privacyLevel === 'anonymous') {
          return baseData;
        }

        // Add more data for higher privacy levels if consented
        if (state.userConsent && state.config.privacyLevel === 'pseudonymous') {
          return {
            ...baseData,
            sessionHistory: state.sessionHistory.map(session => ({
              sessionId: session.sessionId,
              startTime: session.startTime,
              endTime: session.endTime,
              dataQualityScore: session.dataQualityScore,
              flagged: session.flagged,
            })),
            alerts: state.alerts.filter(alert => 
              alert.type !== 'data_concern' && !alert.resolved
            ),
          };
        }

        return baseData;
      },

      exportData: () => {
        const privacyCompliantData = get().getPrivacyCompliantData();
        return JSON.stringify(privacyCompliantData, null, 2);
      },

      importData: (data: string) => {
        try {
          const importedData = JSON.parse(data);
          
          // Validate and safely merge imported data
          set((state) => ({
            ...state,
            config: { ...state.config, ...importedData.config },
            performanceMetrics: { 
              ...state.performanceMetrics, 
              ...importedData.performanceMetrics 
            },
            // Only import non-sensitive data
            userConsent: importedData.userConsent || false,
            consentVersion: importedData.consentVersion || state.consentVersion,
          }));
        } catch (error) {
          console.error('Failed to import telemetry data:', error);
          get().addAlert({
            type: 'system_error',
            severity: 'error',
            message: 'Failed to import telemetry configuration',
            context: { error: error instanceof Error ? error.message : 'Unknown error' },
          });
        }
      },

      getTelemetryStatus: () => {
        const state = get();
        
        if (!state.config.enabled) return 'disabled';
        if (state.config.consentRequired && !state.userConsent) return 'consent_required';
        if (state.failedBatches > state.batchesProcessed * 0.5) return 'error';
        return 'enabled';
      },
    }),
    {
      name: 'telemetry-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // Serialize Map objects and exclude sensitive data from persistence
      serialize: (state) => {
        const serializedState = {
          ...state.state,
          normingStatistics: Array.from(state.state.normingStatistics.entries()),
          itemAnalyses: Array.from(state.state.itemAnalyses.entries()),
        };
        
        // Remove sensitive data from persistence
        delete serializedState.currentSession;
        delete serializedState.dashboardData;
        
        // Only keep recent alerts
        serializedState.alerts = serializedState.alerts
          .slice(0, 10)
          .filter((alert: TelemetryAlert) => !alert.resolved);
        
        // Only keep recent session history
        serializedState.sessionHistory = serializedState.sessionHistory.slice(-5);
        
        return JSON.stringify(serializedState);
      },
      
      // Deserialize Map objects
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          normingStatistics: new Map(parsed.normingStatistics || []),
          itemAnalyses: new Map(parsed.itemAnalyses || []),
        };
      },

      // Partial persistence - only persist essential data
      partialize: (state) => ({
        config: state.config,
        userConsent: state.userConsent,
        consentTimestamp: state.consentTimestamp,
        consentVersion: state.consentVersion,
        performanceMetrics: state.performanceMetrics,
        batchesProcessed: state.batchesProcessed,
        failedBatches: state.failedBatches,
        lastBatchTimestamp: state.lastBatchTimestamp,
        // Exclude sensitive runtime data
      }),
    }
  )
);

// Selectors for commonly used data
export const selectTelemetryConfig = () => useTelemetryStore((state) => state.config);
export const selectUserConsent = () => useTelemetryStore((state) => state.userConsent);
export const selectCurrentSession = () => useTelemetryStore((state) => state.currentSession);
export const selectActiveAlerts = () => useTelemetryStore((state) => 
  state.alerts.filter(alert => !alert.resolved)
);
export const selectCriticalAlerts = () => useTelemetryStore((state) => 
  state.alerts.filter(alert => !alert.resolved && alert.severity === 'critical')
);
export const selectPerformanceMetrics = () => useTelemetryStore((state) => state.performanceMetrics);
export const selectTelemetryStatus = () => useTelemetryStore((state) => state.getTelemetryStatus());
export const selectDashboardData = () => useTelemetryStore((state) => state.dashboardData);

// Privacy-safe data access
export const selectAnonymizedMetrics = () => useTelemetryStore((state) => {
  const status = state.getTelemetryStatus();
  const metrics = state.performanceMetrics;
  
  return {
    status,
    isEnabled: status === 'enabled',
    dataQuality: metrics.dataQualityScore,
    systemHealth: metrics.systemLoad,
    lastUpdated: metrics.lastUpdated,
    queueSize: state.eventQueueSize,
    batchesProcessed: state.batchesProcessed,
  };
});

// Computed values
export const selectQualityIndicators = () => useTelemetryStore((state) => {
  const alerts = state.alerts.filter(alert => !alert.resolved);
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const errorCount = alerts.filter(alert => alert.severity === 'error').length;
  const warningCount = alerts.filter(alert => alert.severity === 'warning').length;
  
  return {
    overall: state.performanceMetrics.dataQualityScore,
    alerts: {
      critical: criticalCount,
      error: errorCount,
      warning: warningCount,
      total: alerts.length,
    },
    system: {
      queueHealth: state.eventQueueSize < state.config.batchSize,
      batchHealth: state.failedBatches === 0 || state.batchesProcessed / Math.max(1, state.failedBatches) > 10,
      consentStatus: state.userConsent,
    },
  };
});

export default useTelemetryStore;