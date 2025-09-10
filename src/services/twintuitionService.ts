import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { useTwinStore, TwintuitionAlert } from '../state/twinStore';
import { BehaviorEvent, SyncEvent, TwintuitionConfig } from '../types/twintuition';
import { analyzePatterns, detectSynchronicity } from '../utils/behaviorAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class TwintuitionService {
  private static instance: TwintuitionService;
  private behaviorBuffer: BehaviorEvent[] = [];
  private isInitialized = false;
  private config: TwintuitionConfig = {
    sensitivity: 0.7,
    timeWindowMinutes: 15,
    enableLocationSync: false,
    enableMoodSync: true,
    enableActionSync: true,
    minConfidenceThreshold: 0.6,
  };

  static getInstance(): TwintuitionService {
    if (!TwintuitionService.instance) {
      TwintuitionService.instance = new TwintuitionService();
    }
    return TwintuitionService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request notification permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }

      // Load configuration
      await this.loadConfig();

      // Set up background task for behavior analysis
      this.setupBackgroundProcessing();

      // Register notification categories
      await this.setupNotificationCategories();

      this.isInitialized = true;
      console.log('TwintuitionService initialized');
    } catch (error) {
      console.error('Failed to initialize TwintuitionService:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const storedConfig = await AsyncStorage.getItem('twintuition-config');
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async updateConfig(newConfig: Partial<TwintuitionConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    try {
      await AsyncStorage.setItem('twintuition-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('twintuition', [
      {
        identifier: 'view',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { opensAppToForeground: false },
      },
    ]);
  }

  private setupBackgroundProcessing(): void {
    // Process behavior buffer every 30 seconds
    setInterval(() => {
      this.processBehaviorBuffer();
    }, 30000);
  }

  async trackBehavior(event: Omit<BehaviorEvent, 'id' | 'timestamp'>): Promise<void> {
    const behaviorEvent: BehaviorEvent = {
      ...event,
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.behaviorBuffer.push(behaviorEvent);

    // Keep buffer size manageable
    if (this.behaviorBuffer.length > 100) {
      this.behaviorBuffer = this.behaviorBuffer.slice(-100);
    }

    // Store behavior data locally with privacy protection
    await this.storeBehaviorEvent(behaviorEvent);

    // Check for immediate synchronicity if we have twin behavior
    if (behaviorEvent.twinId) {
      await this.checkImmediateSynchronicity(behaviorEvent);
    }
  }

  private async storeBehaviorEvent(event: BehaviorEvent): Promise<void> {
    try {
      const key = `behavior_${new Date().toISOString().split('T')[0]}`;
      const existingData = await AsyncStorage.getItem(key);
      const events = existingData ? JSON.parse(existingData) : [];
      
      events.push({
        ...event,
        // Remove sensitive data for storage
        location: event.location ? 'REDACTED' : undefined,
      });
      
      // Keep only last 50 events per day
      if (events.length > 50) {
        events.splice(0, events.length - 50);
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store behavior event:', error);
    }
  }

  private async checkImmediateSynchronicity(event: BehaviorEvent): Promise<void> {
    const recentEvents = this.behaviorBuffer.filter(
      e => {
        const timeDiff = new Date().getTime() - new Date(e.timestamp).getTime();
        return timeDiff <= this.config.timeWindowMinutes * 60 * 1000;
      }
    );

    const syncEvent = await detectSynchronicity(event, recentEvents, this.config);
    if (syncEvent) {
      await this.triggerTwintuitionAlert(syncEvent);
    }
  }

  private async processBehaviorBuffer(): Promise<void> {
    if (this.behaviorBuffer.length < 2) return;

    try {
      const patterns = await analyzePatterns(this.behaviorBuffer, this.config);
      
      for (const pattern of patterns) {
        if (pattern.confidence >= this.config.minConfidenceThreshold) {
          await this.triggerTwintuitionAlert({
            type: pattern.type,
            confidence: pattern.confidence,
            description: pattern.description,
            involvedEvents: pattern.events,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error processing behavior buffer:', error);
    }
  }

  private async triggerTwintuitionAlert(syncEvent: SyncEvent): Promise<void> {
    const store = useTwinStore.getState();
    if (!store.notificationsEnabled || !store.paired) return;

    const alertMessage = this.generateAlertMessage(syncEvent);
    const alertType = this.mapSyncTypeToAlertType(syncEvent.type);

    // Add to store
    store.addTwintuitionAlert({
      message: alertMessage,
      type: alertType,
      isRead: false,
    });

    // Send push notification
    await this.sendPushNotification({
      title: '✨ Twintuition Alert',
      body: alertMessage,
      data: {
        type: 'twintuition',
        syncType: syncEvent.type,
        confidence: syncEvent.confidence.toString(),
      },
    });

    // Track analytics (anonymized)
    await this.trackAnalytics({
      event: 'twintuition_alert_triggered',
      properties: {
        syncType: syncEvent.type,
        confidence: Math.round(syncEvent.confidence * 100),
        timeOfDay: new Date().getHours(),
      },
    });
  }

  private generateAlertMessage(syncEvent: SyncEvent): string {
    const messages = {
      simultaneous_action: [
        "Your twin just performed the same action as you!",
        "Psychic sync detected - you're both doing the same thing!",
        "Twin connection alert: simultaneous behavior detected!",
      ],
      mood_synchronization: [
        "You and your twin are feeling the same emotions right now",
        "Emotional sync detected - your twin is vibing with you!",
        "Your twin's mood matches yours perfectly",
      ],
      app_synchronization: [
        "Your twin opened the app at the same time as you!",
        "Psychic connection: you both reached for the app simultaneously",
        "Twin telepathy moment - you're both here!",
      ],
      location_synchronization: [
        "You and your twin are in similar locations",
        "Geographic sync detected with your twin",
        "Location connection: you're both nearby!",
      ],
      temporal_pattern: [
        "You and your twin have matching daily patterns",
        "Synchronized life rhythms detected",
        "Your twin is living in sync with you!",
      ],
    };

    const typeMessages = messages[syncEvent.type] || ["Something magical happened with your twin!"];
    const randomMessage = typeMessages[Math.floor(Math.random() * typeMessages.length)];
    
    return `${randomMessage} (${Math.round(syncEvent.confidence * 100)}% confidence)`;
  }

  private mapSyncTypeToAlertType(syncType: string): 'feeling' | 'thought' | 'action' {
    switch (syncType) {
      case 'mood_synchronization':
        return 'feeling';
      case 'app_synchronization':
      case 'temporal_pattern':
        return 'thought';
      default:
        return 'action';
    }
  }

  private async sendPushNotification(notification: {
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          categoryIdentifier: 'twintuition',
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private async trackAnalytics(event: { event: string; properties: any }): Promise<void> {
    try {
      // Store analytics locally for privacy
      const analyticsData = await AsyncStorage.getItem('twintuition-analytics') || '[]';
      const analytics = JSON.parse(analyticsData);
      
      analytics.push({
        ...event,
        timestamp: new Date().toISOString(),
      });
      
      // Keep only last 100 events
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100);
      }
      
      await AsyncStorage.setItem('twintuition-analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }

  // Public API methods
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async trackAppOpen(): Promise<void> {
    const location = this.config.enableLocationSync 
      ? await this.getCurrentLocation() 
      : undefined;

    await this.trackBehavior({
      type: 'app_interaction',
      action: 'open_app',
      context: {},
      location,
      userId: useTwinStore.getState().userProfile?.id || 'anonymous',
      twinId: useTwinStore.getState().twinProfile?.id,
    });
  }

  async trackMessage(message: string): Promise<void> {
    const emotion = await this.analyzeMessageEmotion(message);
    
    await this.trackBehavior({
      type: 'communication',
      action: 'send_message',
      context: {
        messageLength: message.length,
        emotion,
        hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message),
      },
      userId: useTwinStore.getState().userProfile?.id || 'anonymous',
      twinId: useTwinStore.getState().twinProfile?.id,
    });
  }

  async trackMoodUpdate(mood: string, intensity: number): Promise<void> {
    await this.trackBehavior({
      type: 'mood_update',
      action: 'set_mood',
      context: {
        mood,
        intensity,
      },
      userId: useTwinStore.getState().userProfile?.id || 'anonymous',
      twinId: useTwinStore.getState().twinProfile?.id,
    });
  }

  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | undefined> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      return undefined;
    }
  }

  private async analyzeMessageEmotion(message: string): Promise<string> {
    // Simple emotion analysis based on keywords and emojis
    const emotions = {
      happy: ['😊', '😄', '😃', '🥰', '😍', 'happy', 'joy', 'great', 'awesome', 'love'],
      sad: ['😢', '😭', '☹️', '😞', 'sad', 'down', 'upset', 'hurt', 'crying'],
      excited: ['🤩', '🎉', '🥳', '✨', 'excited', 'amazing', 'incredible', 'wow'],
      anxious: ['😰', '😟', '😥', 'worried', 'anxious', 'nervous', 'stress'],
      angry: ['😠', '😡', '🤬', 'angry', 'mad', 'furious', 'annoyed'],
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          return emotion;
        }
      }
    }

    return 'neutral';
  }

  // Method to get synchronicity history for analytics
  async getSyncHistory(days: number = 7): Promise<TwintuitionAlert[]> {
    const store = useTwinStore.getState();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return store.twintuitionAlerts.filter(
      alert => new Date(alert.timestamp) >= cutoffDate
    );
  }

  // Method to calculate twin sync score
  async getTwinSyncScore(): Promise<{ score: number; breakdown: any }> {
    const history = await this.getSyncHistory(30);
    const totalAlerts = history.length;
    const highConfidenceAlerts = history.filter(
      alert => alert.message.includes('90%') || alert.message.includes('95%') || alert.message.includes('100%')
    ).length;

    const score = Math.min(100, (totalAlerts * 2) + (highConfidenceAlerts * 5));
    
    return {
      score,
      breakdown: {
        totalSyncEvents: totalAlerts,
        highConfidenceEvents: highConfidenceAlerts,
        averagePerWeek: Math.round(totalAlerts / 4.33),
        strongestConnection: history.length > 0 ? 'Active' : 'Building',
      },
    };
  }
}

export default TwintuitionService;
export const twintuitionService = TwintuitionService.getInstance();