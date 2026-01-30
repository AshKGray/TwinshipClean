/**
 * Twincidences Type Definitions
 *
 * Types for documenting synchronicities and shared experiences between twins.
 * Story: Epic 4 - Twincidences System
 */

/**
 * Category of twincidence (type of synchronicity)
 */
export enum TwincidenceCategory {
  // Automated Detection Categories
  TWINTUITION_SYNC = 'twintuition_sync',
  BIOMETRIC_SYNC = 'biometric_sync',
  LOCATION_COINCIDENCE = 'location_coincidence',
  DIGITAL_BEHAVIOR = 'digital_behavior',
  COMMUNICATION_PATTERN = 'communication_pattern',
  ENVIRONMENTAL_MATCHING = 'environmental_matching',

  // Manual Entry Categories
  MANUAL_ESP = 'manual_esp',
  MANUAL_DREAM = 'manual_dream',
  MANUAL_TWIN_TALK = 'manual_twin_talk',
  MANUAL_PARALLEL_EXPERIENCE = 'manual_parallel_experience',
  MANUAL_OTHER = 'manual_other',
}

/**
 * How the twincidence was detected/created
 */
export type DetectionType = 'automatic' | 'manual';

/**
 * Privacy level for twincidence sharing
 */
export type PrivacyLevel = 'private' | 'twin_only' | 'public';

/**
 * Media attachment for a twincidence
 */
export interface TwincidenceMedia {
  photos?: MediaItem[];
  videos?: MediaItem[];
  voiceNotes?: MediaItem[];
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'voice';
  uri: string;
  size: number;
  mimeType: string;
  timestamp: string;
  cloudUrl?: string; // Cloud storage URL after upload
}

/**
 * Annotation/comment on a twincidence
 */
export interface TwincidenceAnnotation {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  isEdited?: boolean;
}

/**
 * View tracking
 */
export interface TwincidenceView {
  userId: string;
  timestamp: string;
}

/**
 * Biometric sync data (when available)
 */
export interface BiometricSyncData {
  type: 'heartrate' | 'sleep' | 'activity' | 'steps';
  twin1Value: number;
  twin2Value: number;
  similarityScore: number; // 0-1
  timestamp: string;
}

/**
 * Location coincidence data
 */
export interface LocationCoincidenceData {
  twin1Location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  twin2Location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  distance: number; // meters
  timestamp: string;
}

/**
 * Twintuition sync data (linked alerts)
 */
export interface TwintuitionSyncData {
  alert1Id: string;
  alert2Id: string;
  deltaSeconds: number; // Time difference between alerts
  emotionMatch: boolean;
  typeMatch: boolean;
}

/**
 * Complete Twincidence record
 */
export interface Twincidence {
  id: string;
  category: TwincidenceCategory;
  detectionType: DetectionType;
  title: string;
  description?: string;
  timestamp: string; // When detected/created
  editedAt?: string;

  // Metadata based on category
  metadata: {
    eventDate?: string; // For manual entries
    confidenceScore?: number; // For automated (0-1)
    biometricData?: BiometricSyncData;
    locationData?: LocationCoincidenceData;
    twintuitionData?: TwintuitionSyncData;
    [key: string]: any; // Additional metadata
  };

  // Media attachments
  media?: TwincidenceMedia;

  // Tagging and organization
  tags: string[];

  // Privacy and sharing
  privacyLevel: PrivacyLevel;
  isSharedWithResearch: boolean;
  createdBy?: string; // User ID (for manual entries)

  // Engagement
  views: TwincidenceView[];
  favorites: string[]; // User IDs who favorited
  annotations: TwincidenceAnnotation[];
}

/**
 * Draft twincidence (saved but not published)
 */
export interface TwincidenceDraft {
  id: string;
  category: TwincidenceCategory;
  title: string;
  description?: string;
  eventDate: string;
  media?: TwincidenceMedia;
  tags: string[];
  lastSaved: string;
  autoSaved: boolean;
}

/**
 * Filter options for searching twincidences
 */
export interface TwincidenceFilter {
  categories?: TwincidenceCategory[];
  detectionTypes?: DetectionType[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  hasMedia?: boolean;
  minConfidence?: number;
  privacyLevels?: PrivacyLevel[];
}

/**
 * Statistics about twincidences
 */
export interface TwincidenceStats {
  totalTwincidences: number;
  twincidencesThisMonth: number;
  twincidencesThisWeek: number;
  categoryCounts: Record<TwincidenceCategory, number>;
  automatedCount: number;
  manualCount: number;
  averageConfidenceScore: number;
  longestStreak: number;
  currentStreak: number;
  synchronicityScore: number; // 0-100
  topCategories: Array<{ category: TwincidenceCategory; count: number }>;
}

/**
 * Timeline grouping of twincidences
 */
export interface TwincidenceTimelineGroup {
  date: string; // ISO date string (YYYY-MM-DD)
  twincidences: Twincidence[];
  dayStats: {
    total: number;
    automated: number;
    manual: number;
    topCategory: TwincidenceCategory;
  };
}

/**
 * Permissions for automated detection
 */
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
  nextReviewDate: string; // When to re-prompt for consent
}

/**
 * Export/share format
 */
export interface TwincidenceExport {
  version: string;
  exportDate: string;
  twincidences: Twincidence[];
  metadata: {
    totalCount: number;
    categories: Record<TwincidenceCategory, number>;
  };
}

/**
 * Insight/pattern detection result
 */
export interface TwincidenceInsight {
  id: string;
  type: 'pattern' | 'milestone' | 'trend';
  title: string;
  description: string;
  timestamp: string;
  relatedTwincidences: string[]; // IDs
  significance: 'low' | 'medium' | 'high';
}
