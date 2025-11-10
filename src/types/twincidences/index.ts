/**
 * Twincidences - Twin Synchronicity Detection & Logging
 *
 * Type definitions for automated and manual twincidence tracking.
 * Replaces the Story Vault feature with advanced synchronicity detection.
 */

export enum TwincidenceCategory {
  // Automated detection categories
  TWINTUITION_SYNC = 'twintuition_sync',
  BIOMETRIC_SYNC = 'biometric_sync',
  LOCATION_COINCIDENCE = 'location_coincidence',
  DIGITAL_BEHAVIOR = 'digital_behavior',
  COMMUNICATION_PATTERN = 'communication_pattern',
  ENVIRONMENTAL_MATCHING = 'environmental_matching',

  // Manual entry categories
  MANUAL_ESP = 'manual_esp',
  MANUAL_DREAM = 'manual_dream',
  MANUAL_TWIN_TALK = 'manual_twin_talk',
  MANUAL_PARALLEL_EXPERIENCE = 'manual_parallel_experience',
  MANUAL_OTHER = 'manual_other'
}

export type DetectionType = 'automatic' | 'manual';

export type MediaType = 'photo' | 'video' | 'voice';

export interface TwincidenceMedia {
  id: string;
  type: MediaType;
  uri: string;
  thumbnail?: string;
  duration?: number; // for video/voice in seconds
  size: number;
  mimeType: string;
  caption?: string;
  timestamp: string; // when media was captured
}

export interface BiometricSyncData {
  type: 'heart_rate' | 'sleep' | 'activity' | 'workout';
  twin1Value?: number;
  twin2Value?: number;
  twin1Timestamp: string;
  twin2Timestamp: string;
  deltaSeconds: number; // time difference between events
  similarityScore: number; // 0-1, how similar the biometric data is
  details?: {
    heartRateSpike?: boolean;
    sleepPhase?: string;
    activityType?: string;
    workoutType?: string;
  };
}

export interface LocationData {
  placeType: string; // e.g., "restaurant", "gym", "park"
  latitude?: number; // optional for privacy
  longitude?: number; // optional for privacy
  twin1Timestamp: string;
  twin2Timestamp?: string; // undefined for sequential visits
  visitType: 'simultaneous' | 'sequential';
  distanceMeters?: number; // how close they were
  placeName?: string; // user-friendly name
}

export interface DigitalBehaviorData {
  behaviorType: 'app_usage' | 'music_listening' | 'screen_time';
  twin1Data: any;
  twin2Data: any;
  similarityScore: number; // 0-1
  timestamp: string;
}

export interface TwintuitionSyncData {
  twin1PressTime: string;
  twin2PressTime: string;
  deltaSeconds: number; // how close the button presses were
  twin1Emotion?: string;
  twin2Emotion?: string;
  emotionMatch: boolean;
}

export interface Twincidence {
  id: string;
  timestamp: string; // when the twincidence occurred/was logged
  category: TwincidenceCategory;
  detectionType: DetectionType;

  // Core content
  title: string; // auto-generated for automatic, user-provided for manual
  description?: string; // optional for automatic, rich text for manual

  // Metadata specific to detection type
  metadata: {
    // For automated detections
    twin1Data?: any;
    twin2Data?: any;
    confidenceScore?: number; // 0-1, how confident the detection is
    biometricData?: BiometricSyncData;
    locationData?: LocationData;
    digitalBehaviorData?: DigitalBehaviorData;
    twintuitionData?: TwintuitionSyncData;

    // For manual entries
    eventDate?: string; // when the twincidence actually happened (can be in past)
    customFields?: Record<string, any>;
  };

  // Media attachments (primarily for manual entries)
  media?: {
    photos?: TwincidenceMedia[];
    videos?: TwincidenceMedia[];
    voiceNotes?: TwincidenceMedia[];
  };

  // Organization
  tags: string[];

  // Privacy & Research
  isSharedWithResearch: boolean;
  privacyLevel: 'private' | 'twin_only' | 'research'; // future: 'public' for leaderboard

  // Collaboration (for manual entries)
  createdBy?: string; // twin ID who created manual entry
  editedAt?: string;
  editedBy?: string;
  annotations?: TwincidenceAnnotation[]; // collaborative notes

  // Engagement
  views: { userId: string; timestamp: string }[];
  favorites: string[]; // user IDs who favorited
}

export interface TwincidenceAnnotation {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  isEdited?: boolean;
}

export interface TwincidenceDraft {
  id: string;
  category: TwincidenceCategory;
  title: string;
  description?: string;
  media?: {
    photos?: TwincidenceMedia[];
    videos?: TwincidenceMedia[];
    voiceNotes?: TwincidenceMedia[];
  };
  tags: string[];
  eventDate?: string;
  lastSaved: string;
  autoSaved: boolean;
}

export interface TwincidenceFilter {
  categories?: TwincidenceCategory[];
  detectionTypes?: DetectionType[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  searchText?: string;
  hasMedia?: boolean;
  minConfidence?: number; // for automated detections
}

export interface TwincidenceStats {
  totalTwincidences: number;
  twincidencesThisMonth: number;
  twincidencesThisWeek: number;
  categoryCounts: Record<TwincidenceCategory, number>;
  automatedCount: number;
  manualCount: number;
  averageConfidenceScore: number;
  longestStreak: number; // days with at least one twincidence
  currentStreak: number;
  synchronicityScore: number; // overall score 0-100
  topCategories: { category: TwincidenceCategory; count: number }[];
}

export interface TwincidenceTimelineGroup {
  date: string; // YYYY-MM-DD
  twincidences: Twincidence[];
  dayStats: {
    total: number;
    automated: number;
    manual: number;
    topCategory: TwincidenceCategory;
  };
}

// Permission tracking for privacy compliance
export interface TwincidencePermissions {
  twintuitionSync: boolean;
  biometricTracking: boolean;
  locationTracking: boolean;
  digitalBehavior: boolean;
  communicationPattern: boolean;
  environmentalMatching: boolean;
  researchParticipation: boolean;
  lastUpdated: string;
  consentDate: string;
  nextReviewDate: string; // annual consent review
}
