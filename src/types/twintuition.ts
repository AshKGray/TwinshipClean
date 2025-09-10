export interface BehaviorEvent {
  id: string;
  userId: string;
  twinId?: string;
  timestamp: string;
  type: 'app_interaction' | 'communication' | 'mood_update' | 'location_update' | 'game_action';
  action: string;
  context: {
    [key: string]: any;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface SyncEvent {
  type: 'simultaneous_action' | 'mood_synchronization' | 'app_synchronization' | 'location_synchronization' | 'temporal_pattern';
  confidence: number; // 0-1
  description: string;
  involvedEvents: BehaviorEvent[];
  detectedAt: string;
}

export interface TwintuitionConfig {
  sensitivity: number; // 0-1, higher means more sensitive to patterns
  timeWindowMinutes: number; // How many minutes to look back for synchronicity
  enableLocationSync: boolean;
  enableMoodSync: boolean;
  enableActionSync: boolean;
  minConfidenceThreshold: number; // Minimum confidence to trigger alert
}

export interface SyncPattern {
  type: SyncEvent['type'];
  confidence: number;
  description: string;
  events: BehaviorEvent[];
  detectedFeatures: string[];
}

export interface TwintuitionAnalytics {
  totalSyncEvents: number;
  syncEventsByType: Record<string, number>;
  averageConfidence: number;
  strongestSyncTime: string; // Hour of day when sync is strongest
  syncStreak: number; // Days with at least one sync event
  lastSyncEvent: string;
}

export interface TwinConnectionMetrics {
  syncScore: number; // 0-100
  connectionStrength: 'Building' | 'Moderate' | 'Strong' | 'Extraordinary';
  dailyAverageSync: number;
  topSyncTypes: Array<{
    type: string;
    count: number;
    averageConfidence: number;
  }>;
  recentTrends: {
    increasing: boolean;
    changePercent: number;
    timeframe: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  quietHours: {
    start: string; // HH:mm format
    end: string;
  };
  minimumConfidence: number;
  allowedTypes: SyncEvent['type'][];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface LocationSyncData {
  distance: number; // meters
  similarity: number; // 0-1
  type: 'same_location' | 'nearby' | 'similar_type' | 'synchronized_movement';
  confidence: number;
}

export interface EmotionalSyncData {
  emotion1: string;
  emotion2: string;
  similarity: number; // 0-1
  intensity1: number;
  intensity2: number;
  confidence: number;
}

export interface TemporalSyncData {
  pattern: 'daily_routine' | 'sleep_pattern' | 'activity_timing' | 'communication_rhythm';
  correlation: number; // -1 to 1
  phase: 'in_sync' | 'opposite' | 'delayed';
  confidence: number;
}