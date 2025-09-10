import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTwinStore } from '../state/twinStore';
import { useTwintuitionStore, shouldShowNotification } from '../state/twintuitionStore';
import { twintuitionService } from '../services/twintuitionService';
import { TwintuitionAlert } from '../components/TwintuitionAlert';

interface UseTwintuitionOptions {
  enableAutoTracking?: boolean;
  trackAppStateChanges?: boolean;
  enableNotifications?: boolean;
}

export const useTwintuition = (options: UseTwintuitionOptions = {}) => {
  const {
    enableAutoTracking = true,
    trackAppStateChanges = true,
    enableNotifications = true,
  } = options;

  const twinStore = useTwinStore();
  const twintuitionStore = useTwintuitionStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const appState = useRef(AppState.currentState);
  const lastActiveTime = useRef(Date.now());

  // Initialize the service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await twintuitionService.initialize();
        setIsInitialized(true);
        
        // Track initial app open if auto-tracking is enabled
        if (enableAutoTracking && twinStore.paired) {
          await twintuitionService.trackAppOpen();
        }
      } catch (error) {
        console.error('Failed to initialize twintuition service:', error);
      }
    };

    initializeService();
  }, [enableAutoTracking, twinStore.paired]);

  // Handle app state changes
  useEffect(() => {
    if (!trackAppStateChanges || !isInitialized) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        const timeDifference = Date.now() - lastActiveTime.current;
        
        // If app was in background for more than 5 minutes, track as new session
        if (timeDifference > 5 * 60 * 1000 && twinStore.paired) {
          await twintuitionService.trackAppOpen();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        lastActiveTime.current = Date.now();
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, [trackAppStateChanges, isInitialized, twinStore.paired]);

  // Listen for new twintuition alerts
  useEffect(() => {
    if (!enableNotifications || !isInitialized) return;

    const checkForNewAlerts = () => {
      const unreadAlerts = twinStore.twintuitionAlerts.filter(alert => !alert.isRead);
      if (unreadAlerts.length > 0 && shouldShowNotification(twintuitionStore)) {
        const latestAlert = unreadAlerts[0];
        setCurrentAlert(latestAlert);
        setShowAlert(true);
      }
    };

    // Check immediately
    checkForNewAlerts();

    // Set up periodic check (every 30 seconds)
    const interval = setInterval(checkForNewAlerts, 30000);

    return () => clearInterval(interval);
  }, [twinStore.twintuitionAlerts, enableNotifications, isInitialized, twintuitionStore]);

  // Listen for notification responses
  useEffect(() => {
    if (!enableNotifications) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionIdentifier = response.actionIdentifier;
      const notificationData = response.notification.request.content.data;

      if (notificationData.type === 'twintuition') {
        if (actionIdentifier === 'view') {
          // Handle view action - could navigate to history screen
          console.log('User wants to view twintuition details');
        }
        // Dismiss action is handled automatically
      }
    });

    return () => subscription.remove();
  }, [enableNotifications]);

  // Tracking functions
  const trackMessage = useCallback(async (message: string) => {
    if (!isInitialized || !twinStore.paired) return;
    
    try {
      await twintuitionService.trackMessage(message);
    } catch (error) {
      console.error('Failed to track message:', error);
    }
  }, [isInitialized, twinStore.paired]);

  const trackMoodUpdate = useCallback(async (mood: string, intensity: number = 5) => {
    if (!isInitialized || !twinStore.paired) return;
    
    try {
      await twintuitionService.trackMoodUpdate(mood, intensity);
    } catch (error) {
      console.error('Failed to track mood update:', error);
    }
  }, [isInitialized, twinStore.paired]);

  const trackGameAction = useCallback(async (gameType: string, action: string, context: any = {}) => {
    if (!isInitialized || !twinStore.paired) return;
    
    try {
      await twintuitionService.trackBehavior({
        type: 'game_action',
        action: `${gameType}_${action}`,
        context: {
          gameType,
          ...context,
        },
        userId: twinStore.userProfile?.id || 'anonymous',
        twinId: twinStore.twinProfile?.id,
      });
    } catch (error) {
      console.error('Failed to track game action:', error);
    }
  }, [isInitialized, twinStore.paired, twinStore.userProfile, twinStore.twinProfile]);

  const trackCustomEvent = useCallback(async (eventType: string, action: string, context: any = {}) => {
    if (!isInitialized || !twinStore.paired) return;
    
    try {
      await twintuitionService.trackBehavior({
        type: eventType as any,
        action,
        context,
        userId: twinStore.userProfile?.id || 'anonymous',
        twinId: twinStore.twinProfile?.id,
      });
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }, [isInitialized, twinStore.paired, twinStore.userProfile, twinStore.twinProfile]);

  // Configuration functions
  const updateSensitivity = useCallback(async (sensitivity: number) => {
    await twintuitionService.updateConfig({ sensitivity });
    twintuitionStore.updateConfig({ sensitivity });
  }, [twintuitionStore]);

  const updateTimeWindow = useCallback(async (timeWindowMinutes: number) => {
    await twintuitionService.updateConfig({ timeWindowMinutes });
    twintuitionStore.updateConfig({ timeWindowMinutes });
  }, [twintuitionStore]);

  const enableLocationSync = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await twintuitionService.requestLocationPermission();
      if (!hasPermission) {
        console.warn('Location permission denied');
        return false;
      }
    }
    
    await twintuitionService.updateConfig({ enableLocationSync: enabled });
    twintuitionStore.updateConfig({ enableLocationSync: enabled });
    return true;
  }, [twintuitionStore]);

  // Analytics functions
  const getSyncHistory = useCallback(async (days: number = 7) => {
    try {
      return await twintuitionService.getSyncHistory(days);
    } catch (error) {
      console.error('Failed to get sync history:', error);
      return [];
    }
  }, []);

  const getSyncScore = useCallback(async () => {
    try {
      const score = await twintuitionService.getTwinSyncScore();
      twintuitionStore.updateSyncScore(score.score);
      return score;
    } catch (error) {
      console.error('Failed to get sync score:', error);
      return { score: 0, breakdown: {} };
    }
  }, [twintuitionStore]);

  // Alert management
  const dismissAlert = useCallback(() => {
    setShowAlert(false);
    setCurrentAlert(null);
  }, []);

  const markAllAlertsAsRead = useCallback(() => {
    twinStore.twintuitionAlerts.forEach(alert => {
      if (!alert.isRead) {
        twinStore.markAlertAsRead(alert.id);
      }
    });
  }, [twinStore]);

  return {
    // State
    isInitialized,
    currentAlert,
    showAlert,
    syncScore: twintuitionStore.syncScore,
    config: twintuitionStore.config,
    
    // Tracking functions
    trackMessage,
    trackMoodUpdate,
    trackGameAction,
    trackCustomEvent,
    
    // Configuration functions
    updateSensitivity,
    updateTimeWindow,
    enableLocationSync,
    
    // Analytics functions
    getSyncHistory,
    getSyncScore,
    
    // Alert management
    dismissAlert,
    markAllAlertsAsRead,
    
    // Components
    TwintuitionAlertComponent: () => {
      return (
        <TwintuitionAlert
          alert={currentAlert}
          visible={showAlert}
          onDismiss={dismissAlert}
          onViewDetails={() => {
            // Navigate to history screen
            console.log('Navigate to twintuition history');
          }}
        />
      );
    }
  };
};

// Hook for getting twintuition statistics
export const useTwintuitionStats = () => {
  const twinStore = useTwinStore();
  const [stats, setStats] = useState({
    totalAlerts: 0,
    todayAlerts: 0,
    weekAlerts: 0,
    mostCommonType: 'action' as 'feeling' | 'thought' | 'action',
    streak: 0,
  });

  useEffect(() => {
    const calculateStats = () => {
      const alerts = twinStore.twintuitionAlerts;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todayAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) >= today
      ).length;

      const weekAlerts = alerts.filter(alert => 
        new Date(alert.timestamp) >= weekAgo
      ).length;

      // Find most common type
      const typeCounts = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonType = Object.entries(typeCounts).reduce((max, [type, count]) => 
        count > max.count ? { type, count } : max,
        { type: 'action', count: 0 }
      ).type as 'feeling' | 'thought' | 'action';

      // Calculate streak (consecutive days with alerts)
      let streak = 0;
      const sortedDates = [...new Set(alerts.map(alert => 
        new Date(alert.timestamp).toDateString()
      ))].sort().reverse();

      let currentDate = new Date();
      for (const dateStr of sortedDates) {
        const alertDate = new Date(dateStr);
        const daysDiff = Math.floor((currentDate.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
          currentDate = alertDate;
        } else {
          break;
        }
      }

      setStats({
        totalAlerts: alerts.length,
        todayAlerts,
        weekAlerts,
        mostCommonType,
        streak,
      });
    };

    calculateStats();
  }, [twinStore.twintuitionAlerts]);

  return stats;
};