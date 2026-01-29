# Epic Technical Specification: Twincidences - Automated Synchronicity Logging

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 4
Status: Draft

---

## Overview

Epic 4 implements Twinship's revolutionary feature: Twincidences, an automated and manual synchronicity logging system that transforms abstract twin connection into documented, quantifiable moments. This epic replaces the previous "Story Vault" feature with a comprehensive system that combines AI-driven automatic detection of synchronicities (Twintuition sync, biometric patterns, location coincidences) with user-driven manual entry capabilities.

Twincidences is the core differentiator that keeps users engaged daily by revealing hidden patterns in twin connection that users might never notice on their own. By automatically detecting and logging moments of synchronicity while allowing twins to document subjective experiences, the app creates a comprehensive view of twin connection that drives retention, research value, and user satisfaction.

This specification covers the client-side implementation using React Native, Expo, TypeScript, Zustand state management, HealthKit integration (iOS), location services, and privacy-first design patterns. The epic consists of 13 stories covering data models, UI/UX, automatic detection systems, privacy controls, analytics, and data migration.

## Objectives and Scope

**In Scope:**
- Core Twincidences data model and AsyncStorage persistence
- Timeline view with chronological feed and filtering
- Manual twincidence creation with rich media support (photos, videos, voice notes)
- Detailed twincidence view with full metadata display
- Automatic Twintuition sync detection (simultaneous button presses within 30s)
- Privacy and permissions management dashboard
- HealthKit integration for biometric sync detection (heart rate, sleep, activity)
- Location-based coincidence detection (same place visits, proximity alerts)
- Insights and analytics dashboard with trend visualization
- Search and filter functionality across all twincidences
- Collaborative editing and annotation between twins
- Twincidence sharing and export (image cards, JSON, CSV)
- Migration from Story Vault data (if applicable)

**Out of Scope:**
- Backend API implementation (handled separately in Epic 7)
- Real-time synchronization infrastructure (Epic 7)
- Digital behavior tracking (app usage patterns, music coincidences) - Phase 2
- Environmental matching (weather, temperature sensors) - Phase 2
- Photo-based clothing/environment matching - Phase 2
- AI-powered twincidence prediction - Phase 2
- Twin meetup event coordination - Phase 2
- Android Health Connect integration (iOS HealthKit only in MVP)

**Success Criteria:**
- Users can view all twincidences in unified timeline
- Automatic detection systems work without draining battery excessively
- Privacy controls are granular and transparent
- Manual entry is quick and intuitive (< 2 minutes to create)
- Insights dashboard reveals meaningful patterns
- HealthKit and location permissions meet iOS App Store requirements
- Data migration preserves all Story Vault content
- Users create at least 2 manual twincidences in first week
- Automated detection generates at least 1 twincidence per week per enabled category

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Navigation Layer** (`src/navigation/AppNavigator.tsx`):
   - TwincidencesScreen as main tab (replaces StoryVault)
   - Timeline, Analytics, and Settings tabs within Twincidences
   - CreateTwincidence modal screen
   - TwincidenceDetail full-screen view
   - Privacy settings accessible from app settings

2. **State Management** (`src/state/`):
   - `twincidencesStore.ts`: All twincidence data, CRUD operations, filtering
   - `twinStore.ts`: Twin profiles for detection algorithms
   - `twintuitionStore.ts`: Integration with Twintuition button events
   - `permissionsStore.ts`: User privacy preferences and OS permission status

3. **Services Layer** (`src/services/`):
   - `detection/twintuitionDetection.ts`: Simultaneous button press detection
   - `detection/biometricDetection.ts`: HealthKit data analysis
   - `detection/locationDetection.ts`: Location pattern analysis
   - `healthkit/healthKitService.ts`: HealthKit API wrapper
   - `location/locationService.ts`: Expo Location API wrapper
   - `permissions/permissionManager.ts`: Unified permission handling
   - `analytics/twincidenceAnalytics.ts`: Insights and trend calculations
   - `migration/storyVaultMigration.ts`: Data migration from old Story Vault
   - `export/twincidenceExport.ts`: Export to JSON, CSV, image cards

4. **UI Components** (`src/components/twincidences/`):
   - `TwincidenceCard.tsx`: Timeline item display
   - `TwincidenceDetail.tsx`: Full detail view
   - `MediaPicker.tsx`: Photo/video/voice note picker
   - `BiometricChart.tsx`: Chart for biometric sync data
   - `AnalyticsDashboard.tsx`: Insights visualization
   - `SearchBar.tsx`: Search and filter controls
   - `ShareCard.tsx`: Social media share card generator

**Design System Integration:**
- Galaxy-themed color palette with category-specific accent colors
- NativeWind/Tailwind CSS for consistent styling
- React Native Reanimated for smooth list animations
- React Native Chart Kit for analytics visualizations
- Expo Haptics for tactile feedback on detection events
- React Native Image Viewing for photo gallery

**Existing Patterns:**
- Uses existing `galaxybackground.png` for cosmic aesthetic
- Follows established AsyncStorage persistence patterns
- Integrates with existing Twintuition button from Epic 2
- Maintains consistent navigation and form patterns
- Builds on existing media handling patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `Twincidence.ts` | Data model interface and types | N/A | TypeScript interfaces | Story 4.1 |
| `twincidencesStore.ts` | State management and CRUD operations | User actions, twincidence data | Store state, selectors | Story 4.1 |
| `twincidenceStorage.ts` | AsyncStorage persistence layer | Twincidence objects | Stored data, retrieval results | Story 4.1 |
| `TwincidencesScreen.tsx` | Main timeline view UI | Twincidence list | User interactions | Story 4.2 |
| `TwincidenceCard.tsx` | Individual timeline item | Twincidence object | Rendered card component | Story 4.2 |
| `CreateTwincidenceScreen.tsx` | Manual entry UI | User input, media | New twincidence object | Story 4.3 |
| `MediaPicker.tsx` | Photo/video/voice picker | User selection | Media URIs | Story 4.3 |
| `TwincidenceDetailScreen.tsx` | Full detail view | Twincidence ID | Detailed display | Story 4.4 |
| `BiometricChart.tsx` | Biometric data visualization | Sync data | Chart component | Story 4.4 |
| `twintuitionDetection.ts` | Simultaneous press detection | Button press events | Twincidence creation | Story 4.5 |
| `TwincidencePrivacyScreen.tsx` | Privacy controls UI | User preferences | Permission updates | Story 4.6 |
| `permissionManager.ts` | iOS permission handling | Permission requests | Grant/deny status | Story 4.6 |
| `healthKitService.ts` | HealthKit API wrapper | Data queries | Health data | Story 4.7 |
| `biometricDetection.ts` | Biometric sync analysis | Health data from both twins | Sync events | Story 4.7 |
| `locationService.ts` | Location tracking wrapper | Location requests | Coordinates, place data | Story 4.8 |
| `locationDetection.ts` | Location pattern analysis | Location history | Coincidence events | Story 4.8 |
| `AnalyticsScreen.tsx` | Insights dashboard UI | All twincidence data | Visualizations | Story 4.9 |
| `twincidenceAnalytics.ts` | Analytics calculations | Twincidence history | Insights, trends | Story 4.9 |
| `SearchBar.tsx` | Search and filter UI | User query | Filtered results | Story 4.10 |
| `EditTwincidenceScreen.tsx` | Collaborative editing UI | Twincidence ID, edits | Updated twincidence | Story 4.11 |
| `ShareCard.tsx` | Social share card generator | Twincidence data | Image card | Story 4.12 |
| `twincidenceExport.ts` | Export to JSON/CSV | Twincidence list | Export files | Story 4.12 |
| `storyVaultMigration.ts` | Data migration service | Old Story Vault data | Migrated twincidences | Story 4.13 |

**Module Dependencies:**
- Detection services depend on Epic 2 (Twintuition button events)
- Detection services depend on Epic 7 (real-time data sync)
- HealthKit integration requires `react-native-health` or `expo-health-connect`
- Location services require `expo-location` and `expo-task-manager`
- Charts require `react-native-chart-kit` or `react-native-svg-charts`
- Media handling requires `expo-image-picker`, `expo-av`, `expo-media-library`
- Sharing requires `react-native-share`, `react-native-view-shot`

### Data Models and Contracts

**Twincidence Interface:**
```typescript
interface Twincidence {
  id: string;                           // UUID v4
  timestamp: Date;                      // When event occurred
  category: TwincidenceCategory;        // Type of sync
  detectionType: 'automatic' | 'manual';
  title: string;                        // Short description
  description?: string;                 // Full details (manual entries)

  metadata: TwincidenceMetadata;        // Category-specific data

  media?: {
    photos?: MediaItem[];
    videos?: MediaItem[];
    voiceNotes?: MediaItem[];
  };

  tags: string[];                       // User-defined tags
  isSharedWithResearch: boolean;        // Research participation opt-in

  createdBy?: string;                   // Twin ID (manual entries)
  editedAt?: Date;                      // Last edit timestamp
  editedBy?: string;                    // Twin ID who last edited

  annotations?: Annotation[];           // Twin comments/additions
  versionHistory?: TwincidenceVersion[];
}

enum TwincidenceCategory {
  TWINTUITION_SYNC = 'twintuition_sync',
  BIOMETRIC_SYNC = 'biometric_sync',
  LOCATION_COINCIDENCE = 'location_coincidence',
  DIGITAL_BEHAVIOR = 'digital_behavior',         // Phase 2
  COMMUNICATION_PATTERN = 'communication_pattern', // Phase 2
  MANUAL_ESP = 'manual_esp',
  MANUAL_DREAM = 'manual_dream',
  MANUAL_TWIN_TALK = 'manual_twin_talk',
  MANUAL_OTHER = 'manual_other'
}

interface TwincidenceMetadata {
  // Twintuition sync
  twin1PressTime?: string;              // ISO 8601
  twin2PressTime?: string;              // ISO 8601
  timeDelta?: number;                   // Seconds between presses
  confidenceScore?: number;             // 0-1 (1 - delta/30)

  // Biometric sync
  biometricData?: BiometricSyncData;

  // Location
  locationData?: LocationData;

  // Generic
  rawData?: any;                        // Original detection data
}

interface BiometricSyncData {
  type: 'heart_rate' | 'sleep' | 'activity';
  twin1Value: number | SleepData | ActivityData;
  twin2Value: number | SleepData | ActivityData;
  syncWindow: {
    start: string;                      // ISO 8601
    end: string;                        // ISO 8601
  };
  synchronization: {
    pattern: string;                    // Description of sync pattern
    strength: number;                   // 0-1 confidence
  };
}

interface SleepData {
  startTime: string;                    // ISO 8601
  endTime: string;                      // ISO 8601
  duration: number;                     // Minutes
  stages?: {
    deep: number;
    light: number;
    rem: number;
  };
}

interface ActivityData {
  type: 'workout' | 'steps' | 'active_energy';
  value: number;
  startTime: string;                    // ISO 8601
  endTime?: string;                     // ISO 8601
}

interface LocationData {
  twin1Location?: PlaceVisit;
  twin2Location?: PlaceVisit;
  distance?: number;                    // Meters between locations
  coincidenceType: 'simultaneous' | 'sequential' | 'proximity';
  timeWindow?: {
    start: string;                      // ISO 8601
    end: string;                        // ISO 8601
  };
}

interface PlaceVisit {
  placeType: string;                    // "restaurant", "gym", etc.
  latitude: number;                     // Hashed for privacy
  longitude: number;                    // Hashed for privacy
  timestamp: string;                    // ISO 8601
  accuracy: number;                     // Meters
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'voice';
  uri: string;                          // Local or remote URI
  thumbnailUri?: string;
  duration?: number;                    // For video/voice (seconds)
  createdAt: string;                    // ISO 8601
}

interface Annotation {
  id: string;
  twinId: string;                       // Who added it
  text: string;
  createdAt: string;                    // ISO 8601
}

interface TwincidenceVersion {
  versionId: string;
  timestamp: string;                    // ISO 8601
  changedBy: string;                    // Twin ID
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

**Permission Preferences:**
```typescript
interface PermissionPreferences {
  twintuitionSync: boolean;             // Always enabled (core feature)
  biometricSync: {
    enabled: boolean;
    heartRate: boolean;
    sleep: boolean;
    activity: boolean;
  };
  locationTracking: {
    enabled: boolean;
    level: 'never' | 'while_using' | 'always';
    proximityAlerts: boolean;
  };
  digitalBehavior: boolean;             // Phase 2

  // iOS permission status (read-only)
  osPermissions: {
    healthKit: 'authorized' | 'denied' | 'not_requested';
    location: 'authorized_always' | 'authorized_when_in_use' | 'denied' | 'not_requested';
  };

  lastConsentReview?: string;           // ISO 8601
  annualReminderDue?: string;           // ISO 8601
}
```

**Analytics Data:**
```typescript
interface TwincidenceAnalytics {
  totalCount: number;
  categoryBreakdown: { [key in TwincidenceCategory]: number };
  manualVsAutomatic: {
    manual: number;
    automatic: number;
  };

  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };

  heatmap: {
    dayOfWeek: number[];                // [Mon, Tue, Wed, ...]
    hourOfDay: number[];                // [0-23]
  };

  synchronicityScore: {
    current: number;                    // 0-100
    trend: 'increasing' | 'stable' | 'decreasing';
    history: { timestamp: string; score: number }[];
  };

  streaks: {
    current: number;                    // Days with at least 1 twincidence
    longest: number;
  };

  topCategories: {
    category: TwincidenceCategory;
    count: number;
    percentage: number;
  }[];

  topTags: {
    tag: string;
    count: number;
  }[];
}

interface TrendPoint {
  timestamp: string;                    // ISO 8601
  count: number;
  categories: { [key in TwincidenceCategory]?: number };
}
```

### APIs and Interfaces

**Zustand Store Actions:**

```typescript
// twincidencesStore actions
interface TwincidencesStoreActions {
  // CRUD operations
  createTwincidence: (data: Partial<Twincidence>) => Promise<Twincidence>;
  updateTwincidence: (id: string, updates: Partial<Twincidence>) => Promise<void>;
  deleteTwincidence: (id: string) => Promise<void>;
  getTwincidence: (id: string) => Twincidence | null;

  // Querying
  getAllTwincidences: () => Twincidence[];
  getTwincidencesByCategory: (category: TwincidenceCategory) => Twincidence[];
  getTwincidencesByDateRange: (start: Date, end: Date) => Twincidence[];
  searchTwincidences: (query: string) => Twincidence[];
  filterTwincidences: (filters: TwincidenceFilters) => Twincidence[];

  // Analytics
  getAnalytics: (dateRange?: { start: Date; end: Date }) => TwincidenceAnalytics;
  getSynchronicityTrend: () => number[];
  getTopCategories: (limit: number) => { category: TwincidenceCategory; count: number }[];

  // Collaboration
  addAnnotation: (twincidenceId: string, text: string) => Promise<void>;
  lockForEditing: (twincidenceId: string, userId: string) => Promise<boolean>;
  unlockAfterEditing: (twincidenceId: string) => void;

  // Export
  exportToJSON: (filter?: TwincidenceFilters) => Promise<string>;
  exportToCSV: (filter?: TwincidenceFilters) => Promise<string>;
}

interface TwincidenceFilters {
  categories?: TwincidenceCategory[];
  detectionTypes?: ('automatic' | 'manual')[];
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  searchQuery?: string;
}

// permissionsStore actions
interface PermissionsStoreActions {
  getPreferences: () => PermissionPreferences;
  updatePreferences: (updates: Partial<PermissionPreferences>) => void;

  requestHealthKitPermission: () => Promise<boolean>;
  requestLocationPermission: (level: 'whenInUse' | 'always') => Promise<boolean>;

  checkOSPermissionStatus: (type: 'healthKit' | 'location') => Promise<string>;
  openAppSettings: () => void;

  scheduleConsentReview: () => void;
}
```

**Service Method Signatures:**

```typescript
// twintuitionDetection.ts
class TwintuitionDetectionService {
  async detectSimultaneousPress(event1: TwintuitionEvent, event2: TwintuitionEvent): Promise<Twincidence | null>;
  // Checks if two events are within 30s, creates twincidence if true

  calculateConfidenceScore(deltaSeconds: number): number;
  // confidence = 1 - (deltaSeconds / 30)

  subscribeToPressEvents(callback: (twincidence: Twincidence) => void): () => void;
  // Real-time listener for automatic detection
}

// biometricDetection.ts
class BiometricDetectionService {
  async detectHeartRateSync(twin1Data: HeartRateData[], twin2Data: HeartRateData[]): Promise<BiometricSyncData[]>;
  // Sliding window analysis for simultaneous spikes >20 bpm

  async detectSleepSync(twin1Sleep: SleepData, twin2Sleep: SleepData): Promise<BiometricSyncData | null>;
  // Sleep start/end within 30 min window

  async detectActivitySync(twin1Activity: ActivityData, twin2Activity: ActivityData): Promise<BiometricSyncData | null>;
  // Same workout type within 15 min

  startBackgroundMonitoring(): void;
  // Periodic checks every 15-30 min

  stopBackgroundMonitoring(): void;
}

// locationDetection.ts
class LocationDetectionService {
  async trackSignificantLocationChange(location: LocationData): Promise<void>;
  // iOS significant location change API

  async detectProximity(twin1Location: LocationData, twin2Location: LocationData): Promise<number>;
  // Haversine formula for distance calculation

  async detectPlaceVisitCoincidence(twin1Visits: PlaceVisit[], twin2Visits: PlaceVisit[]): Promise<Twincidence[]>;
  // Same place within 100m, simultaneous (4 hours) or sequential

  async createGeofence(location: LocationData, radius: number): Promise<string>;
  // Create geofence for proximity alerts

  reverseGeocode(latitude: number, longitude: number): Promise<string>;
  // Get place type from coordinates
}

// healthKitService.ts (iOS wrapper)
class HealthKitService {
  async requestAuthorization(types: HealthDataType[]): Promise<boolean>;
  // Request HealthKit permissions

  async queryHeartRate(startDate: Date, endDate: Date): Promise<HeartRateData[]>;
  // Fetch heart rate samples

  async querySleep(startDate: Date, endDate: Date): Promise<SleepData[]>;
  // Fetch sleep analysis

  async queryWorkouts(startDate: Date, endDate: Date): Promise<ActivityData[]>;
  // Fetch workout sessions

  async subscribeToUpdates(type: HealthDataType, callback: (data: any) => void): () => void;
  // Real-time updates via observer queries
}

// permissionManager.ts
class PermissionManager {
  async requestPermission(type: 'healthKit' | 'location', options?: any): Promise<PermissionStatus>;
  // Unified permission request

  async checkPermissionStatus(type: string): Promise<PermissionStatus>;
  // Check current OS permission status

  openAppSettings(): void;
  // Deep link to iOS Settings app

  shouldShowRationale(type: string): boolean;
  // Check if should show permission explanation
}

// twincidenceAnalytics.ts
class TwincidenceAnalyticsService {
  calculateSynchronicityScore(twincidences: Twincidence[], dateRange: DateRange): number;
  // Weighted score based on frequency and variety

  generateHeatmap(twincidences: Twincidence[]): { dayOfWeek: number[]; hourOfDay: number[] };
  // Frequency distribution

  calculateStreaks(twincidences: Twincidence[]): { current: number; longest: number };
  // Daily twincidence streaks

  getTrendData(twincidences: Twincidence[], granularity: 'daily' | 'weekly' | 'monthly'): TrendPoint[];
  // Historical trend analysis

  generateMonthlyReport(month: Date): TwincidenceReport;
  // Comprehensive monthly summary
}

// storyVaultMigration.ts
class StoryVaultMigrationService {
  async detectStoryVaultData(): Promise<boolean>;
  // Check AsyncStorage for old data

  async migrateStories(stories: OldStory[]): Promise<Twincidence[]>;
  // Convert old format to new

  async runMigration(onProgress: (percent: number) => void): Promise<MigrationResult>;
  // Execute full migration with progress

  async archiveOriginalData(): Promise<void>;
  // Backup old data for export
}

// twincidenceExport.ts
class TwincidenceExportService {
  async generateShareCard(twincidence: Twincidence): Promise<{ uri: string; text: string }>;
  // Create beautiful image card using react-native-view-shot

  async exportToJSON(twincidences: Twincidence[]): Promise<string>;
  // Full data structure export

  async exportToCSV(twincidences: Twincidence[]): Promise<string>;
  // Flattened CSV export

  async shareViaOS(uri: string, message: string): Promise<void>;
  // Native share dialog
}
```

**React Navigation Type Definitions:**

```typescript
type TwincidencesStackParamList = {
  Twincidences: undefined;
  CreateTwincidence: { editMode?: boolean; twincidenceId?: string };
  TwincidenceDetail: { twincidenceId: string };
  TwincidencePrivacy: undefined;
  Analytics: undefined;
  Search: { initialQuery?: string };
};
```

### Workflows and Sequencing

**Manual Twincidence Creation Flow:**
```
User taps FAB on Twincidences screen
  ↓
Navigate to CreateTwincidence modal
  ↓
User selects category (ESP, Dream, Twin-Talk, Other)
  ↓
User enters title (required, max 100 chars)
  ↓
User enters description (optional, rich text, max 2000 chars)
  ↓
User optionally adds media:
  - Photos (up to 10): Camera or gallery
  - Videos (up to 3, max 60s each): Camera or gallery
  - Voice note (max 3 min): Record in-app
  ↓
User sets date/time (defaults to now, can edit for past)
  ↓
User adds custom tags (comma-separated)
  ↓
User taps "Save" or "Save as Draft"
  ↓
Validate: Title required, media within limits
  ↓
Create Twincidence object:
  - id: UUID v4
  - timestamp: selected date/time
  - category: selected category
  - detectionType: 'manual'
  - createdBy: current user ID
  ↓
Save to twincidencesStore
  ↓
Persist to AsyncStorage
  ↓
Navigate back to timeline
  ↓
Scroll to new entry with animation
```

**Automatic Twintuition Sync Detection Flow:**
```
Epic 2: Twintuition button pressed by Twin 1
  ↓
Event logged: { userId: twin1.id, timestamp: T1 }
  ↓
Synced to Firebase Realtime Database (Epic 7)
  ↓
Twin 2 presses Twintuition button
  ↓
Event logged: { userId: twin2.id, timestamp: T2 }
  ↓
Detection service listens to both events
  ↓
Calculate delta: Δt = |T2 - T1|
  ↓
Check: Δt < 30 seconds?
  ↓
[If yes] → Mutual Twintuition detected!
  ↓
Calculate confidence: confidence = 1 - (Δt / 30)
  ↓
Create Twincidence automatically:
  - category: TWINTUITION_SYNC
  - detectionType: 'automatic'
  - metadata: { twin1PressTime, twin2PressTime, timeDelta, confidenceScore }
  - title: "Mutual Twintuition Moment"
  - description: "You both felt it at the same time!"
  ↓
Save to twincidencesStore
  ↓
Send push notification to both twins:
  "🌟 Twintuition Alert! You and [Twin Name] just thought of each other at the same time (Δt seconds apart)"
  ↓
Display special badge in timeline
  ↓
Haptic feedback (success pattern)
```

**Biometric Sync Detection Flow (Background Task):**
```
Background task triggers every 15 minutes (expo-task-manager)
  ↓
Check: Biometric sync enabled in preferences?
  ↓
[If no] → Exit
  ↓
[If yes] → Query HealthKit for recent data:
  - Heart rate (last 1 hour)
  - Sleep (last night)
  - Workouts (last 24 hours)
  ↓
Retrieve twin's data from Firebase (Epic 7)
  ↓
Run detection algorithms:

  Heart Rate Sync:
    - Sliding window analysis (5 min windows)
    - Detect simultaneous spikes >20 bpm
    - Within 5 min window

  Sleep Sync:
    - Compare sleep start times
    - Within 30 min window

  Activity Sync:
    - Compare workout start times
    - Same workout type
    - Within 15 min window
  ↓
[If sync detected] → Create Twincidence:
  - category: BIOMETRIC_SYNC
  - detectionType: 'automatic'
  - metadata: { biometricData: { type, twin1Value, twin2Value, syncWindow } }
  - title: Auto-generated based on type
  ↓
Save to twincidencesStore
  ↓
Send push notification (if enabled)
  ↓
Store sync event for analytics
```

**Location Coincidence Detection Flow:**
```
iOS significant location change event fires
  ↓
Check: Location tracking enabled?
  ↓
[If no] → Exit
  ↓
[If yes] → Get current location
  ↓
Reverse geocode to get place type (restaurant, gym, etc.)
  ↓
Create PlaceVisit record:
  - placeType: from geocoding
  - latitude/longitude: hashed for privacy
  - timestamp: now
  ↓
Store in location history (local and Firebase)
  ↓
Query twin's location history
  ↓
Compare for coincidences:

  Simultaneous Visit:
    - Same place (within 100m radius)
    - Within 4 hour window

  Sequential Visit:
    - Same place (within 100m radius)
    - Different days

  Proximity Alert:
    - Currently within 1km of each other
  ↓
[If coincidence detected] → Create Twincidence:
  - category: LOCATION_COINCIDENCE
  - detectionType: 'automatic'
  - metadata: { locationData: { coincidenceType, twin1Location, twin2Location, distance } }
  - title: Auto-generated based on coincidence type
  ↓
Save to twincidencesStore
  ↓
[If proximity] → Send immediate notification with map
```

**Privacy Permission Request Flow:**
```
User navigates to Twincidence Privacy Settings
  ↓
Display all detection categories with toggle switches
  ↓
User taps toggle for HealthKit biometric sync
  ↓
Check: HealthKit permission already granted?
  ↓
[If no] → Show explanation dialog:
  "Twinship uses HealthKit to detect when you and your twin experience synchronized heart rate spikes, sleep patterns, or workouts. This helps reveal hidden connections. Your health data is processed on-device and never sold or shared."
  ↓
User taps "Allow Access"
  ↓
Call healthKitService.requestAuthorization([heartRate, sleep, workouts])
  ↓
iOS shows native HealthKit permission dialog
  ↓
User grants or denies permission
  ↓
Update permissionsStore with OS permission status
  ↓
[If granted] → Enable biometric sync in preferences
  ↓
[If denied] → Show guidance:
  "To enable biometric sync, go to Settings > Privacy > Health > Twinship and allow access"
  ↓
Start background monitoring if enabled
  ↓
Similar flow for Location permission (always/when in use)
```

**Analytics Dashboard Flow:**
```
User navigates to Analytics tab
  ↓
Query all twincidences from store
  ↓
Calculate analytics on-device:
  - Total count
  - Category breakdown (pie chart)
  - Manual vs automatic ratio
  - Synchronicity score trend (line chart)
  - Heatmap (days with most twincidences)
  - Time-of-day patterns
  - Current streak, longest streak
  ↓
Display visualizations:
  - Overview cards (total, trend, streak)
  - Pie chart: Category breakdown
  - Line chart: Synchronicity over time
  - Heatmap: Days of week
  - Bar chart: Time of day
  ↓
User applies date range filter
  ↓
Recalculate analytics for filtered range
  ↓
Update charts with animation
  ↓
User taps "Export Report"
  ↓
Generate PDF with all analytics
  ↓
Share via OS share dialog
```

**Collaborative Editing Flow:**
```
Twin 1 opens Twincidence detail view
  ↓
Taps "Add Your Perspective" button
  ↓
Check: Is twincidence locked by Twin 2?
  ↓
[If yes] → Show "Your twin is currently editing this"
  ↓
[If no] → Lock twincidence (optimistic UI)
  ↓
Navigate to edit screen
  ↓
Display original content (read-only)
  ↓
Show annotation text area
  ↓
Twin 1 adds comment: "I was thinking of you because..."
  ↓
Twin 1 taps "Save Annotation"
  ↓
Create Annotation object:
  - id: UUID
  - twinId: twin1.id
  - text: annotation text
  - createdAt: now
  ↓
Add to twincidence.annotations array
  ↓
Update version history:
  - versionId: UUID
  - changedBy: twin1.id
  - changes: [{ field: 'annotations', oldValue: [], newValue: [annotation] }]
  ↓
Unlock twincidence
  ↓
Sync to Firebase (Epic 7)
  ↓
Send notification to Twin 2:
  "[Twin 1] added their perspective to a twincidence"
  ↓
Twin 2 views updated twincidence with both perspectives
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Timeline Load**: < 500ms for initial 20 twincidences
- **Infinite Scroll**: < 200ms to load next batch
- **Detection Processing**: < 2 seconds to create automatic twincidence
- **Analytics Calculation**: < 3 seconds for full dashboard
- **Image/Video Loading**: < 1 second with progressive loading
- **Background Tasks**: < 30 seconds per cycle, max 15% battery impact per day
- **Search/Filter**: < 300ms for results on 1000+ twincidences

**Performance Requirements:**
1. **Smooth Scrolling**: FlatList maintains 60 FPS with optimized rendering
2. **Lazy Loading**: Images loaded on-demand with placeholder thumbnails
3. **Efficient Detection**: Biometric/location checks batched to minimize battery drain
4. **Cached Analytics**: Calculations cached and incrementally updated
5. **Optimized Storage**: AsyncStorage operations batched and debounced

**Performance Optimizations:**
- Use FlatList with `getItemLayout` for known heights
- Implement windowing for large datasets (react-native-largelist)
- Debounce search input (300ms)
- Memoize expensive calculations (React.memo, useMemo)
- Compress images before storage (expo-image-manipulator)
- Use background fetch for detection tasks (expo-background-fetch)
- Limit HealthKit queries to necessary date ranges
- Cache reverse geocoding results

### Security

**Data Protection:**
- All twincidence data encrypted in AsyncStorage (iOS Keychain)
- Health data processed on-device when possible
- Location coordinates hashed before storage
- No exact addresses stored, only place types
- Media files stored in secure app container

**Privacy Compliance:**
- **iOS App Store Requirements**:
  - HealthKit usage description clearly states research purpose
  - Location usage description explains synchronicity detection
  - No selling or sharing of health data with third parties
  - User can revoke permissions anytime
  - Data deleted if user deletes account
- **HIPAA Considerations**: Health data handled with HIPAA-level security (encryption, access controls)
- **GDPR Compliance**: Right to export, right to delete, transparent data usage

**Input Validation:**
- Sanitize all user text input (title, description, annotations)
- Validate media file types and sizes before upload
- Prevent XSS in rich text descriptions
- Validate twincidence schema before save

### Reliability/Availability

**Error Handling:**
- Graceful handling of HealthKit permission denial
- Fallback to manual entry if automatic detection fails
- Clear error messages for location service issues
- Retry logic for failed background tasks
- Automatic recovery from incomplete manual entries (drafts)

**Offline Support:**
- All twincidences viewable offline
- Manual entry works offline, syncs when online
- Analytics calculated from local data
- Detection tasks queue when offline, process when online

**Data Integrity:**
- Atomic twincidence creation (all-or-nothing)
- Version conflict resolution for collaborative edits (last write wins with notification)
- Duplicate detection prevention for automatic events
- Data backup before migration

### Observability

**Logging:**
- Info: Twincidence created, detection events, permission changes
- Debug: Detection algorithm decisions, filter operations
- Error: HealthKit failures, location errors, storage issues
- No PII: Never log health data, exact locations, or personal details

**Metrics Tracking:**
- Detection success rates per category
- Permission grant/deny rates
- Manual entry completion rate
- Analytics dashboard usage
- Export feature usage
- Migration success rate

**Monitoring:**
- Background task execution frequency
- Battery impact of detection services
- AsyncStorage quota usage
- Crash reports for detection failures

## Dependencies and Integrations

### NPM Dependencies

**Core Dependencies:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `expo` | 53.0.22 | Platform | All features |
| `react-native` | 0.79.5 | Mobile platform | All UI |
| `zustand` | 5.0.4 | State management | twincidencesStore, permissionsStore |
| `@react-native-async-storage/async-storage` | 2.1.2 | Persistence | Twincidence storage |

**Health & Location:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `expo-location` | 18.1.6 | Location services | Story 4.8 |
| `expo-task-manager` | 12.1.5 | Background tasks | Story 4.7, 4.8 |
| `react-native-health` | 1.19.0 | HealthKit (iOS) | Story 4.7 |
| `expo-sensors` | 14.1.5 | Device sensors | Future enhancement |

**Media Handling:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `expo-image-picker` | 16.1.7 | Photo/video picker | Story 4.3 |
| `expo-media-library` | 17.1.6 | Media storage | Story 4.3 |
| `expo-av` | 15.1.6 | Audio/video playback | Story 4.3, 4.4 |
| `expo-image-manipulator` | 13.1.5 | Image compression | Story 4.3 |

**Charts & Visualization:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `react-native-chart-kit` | 6.12.0 | Charts | Story 4.9 |
| `react-native-svg` | 15.14.0 | SVG rendering | Chart dependencies |

**Sharing & Export:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `react-native-share` | 12.1.1 | Native share dialog | Story 4.12 |
| `react-native-view-shot` | 4.1.1 | Screenshot capture | Story 4.12 |
| `react-native-html-to-pdf` | 0.12.0 | PDF export | Story 4.9 |

**UI Components:**
| Package | Version | Purpose | Epic 4 Usage |
|---------|---------|---------|--------------|
| `react-native-image-viewing` | 0.2.2 | Photo gallery | Story 4.4 |
| `react-native-gesture-handler` | 2.24.0 | Swipe gestures | Story 4.2 |

### External Integrations

**Phase 1 (Epic 4 - Local Detection):**
- iOS HealthKit (via react-native-health)
- iOS Location Services (via expo-location)
- Expo Notifications (for detection alerts)
- Local AsyncStorage for all data

**Phase 2 (Epic 7 - Backend Integration):**
- Firebase Realtime Database for Twintuition events
- Firestore for twincidence sync
- Cloud Functions for server-side detection
- Firebase Cloud Messaging for push notifications

### Internal Module Dependencies

**Epic 4 depends on:**
- **Epic 1** (Pairing): Twin connection required for comparison
- **Epic 2** (Twintuition Button): Button press events for automatic detection
- **Epic 7** (Backend Sync): Real-time data sync for twin comparison

**Epic 4 provides foundation for:**
- **Epic 5** (Research): Twincidence data can be shared with research
- Future AI-powered prediction features

### iOS Compliance Requirements

**HealthKit Integration:**
- `NSHealthShareUsageDescription` in Info.plist: "Twinship analyzes your health data to detect synchronized patterns with your twin, such as simultaneous heart rate changes, sleep patterns, and activity levels. This data is processed on your device and used solely for enhancing your twin connection insights."
- `NSHealthUpdateUsageDescription` in Info.plist: "Twinship does not write any data to HealthKit."
- No selling or sharing of health data
- User can revoke permission anytime via iOS Settings
- Health data deleted when account deleted

**Location Services:**
- `NSLocationAlwaysAndWhenInUseUsageDescription` in Info.plist: "Twinship uses your location to detect when you and your twin visit the same places or are near each other. Location data is hashed for privacy and used only to enhance your twin connection insights."
- `NSLocationWhenInUseUsageDescription` in Info.plist: "Twinship uses your location to detect when you and your twin visit the same places."
- `UIBackgroundModes`: Add `location` for background tracking
- Clear value proposition for "always" permission
- Battery optimization with significant location change API
- User can change to "while using" anytime

**Privacy Nutrition Labels:**
- Health Data: Tracked, linked to user
- Location Data: Tracked, linked to user
- User Content: Photos, videos, voice notes
- Purpose: App functionality, analytics (not advertising)

## Acceptance Criteria (Authoritative)

### AC-4.1: Core Twincidences Data Model & Storage
1. Twincidence TypeScript interface defined with all required fields
2. TwincidenceCategory enum includes all automatic and manual types
3. AsyncStorage schema supports twincidence persistence
4. Unique ID generation (UUID v4) for each twincidence
5. Metadata structure supports all detection types (Twintuition, biometric, location)
6. Media array supports photos, videos, voice notes with size limits
7. Version history tracks all edits with timestamps and authors
8. Data model versioned for future schema updates (v1 key prefix)
9. CRUD operations implemented in twincidencesStore
10. Data persists across app restarts

### AC-4.2: Twincidences Timeline View
1. Main Twincidences screen with tab navigation (Timeline, Analytics, Settings)
2. Reverse chronological feed (newest first) using FlatList
3. Twincidence cards display: category icon, timestamp, title, excerpt
4. Visual distinction between automatic (badge) and manual (icon) entries
5. Category-specific accent colors and icons
6. Tap card navigates to detail view
7. Infinite scroll loads 20 items at a time
8. Month/year section headers for organization
9. Pull-to-refresh triggers detection check and reloads list
10. Empty state with encouragement and "Add Manual Entry" button
11. Maintains 60 FPS scrolling performance

### AC-4.3: Manual Twincidence Creation
1. Floating action button (FAB) on timeline opens creation modal
2. Category selection: ESP, Dream, Twin-Talk, Other
3. Title field (required, max 100 characters, real-time character count)
4. Description field (optional, rich text or markdown, max 2000 characters)
5. Photo picker: Up to 10 photos from camera or gallery
6. Video picker: Up to 3 videos, max 60 seconds each
7. Voice note recorder: Max 3 minutes with waveform visualization
8. Date/time picker defaults to now, editable for past events
9. Custom tags input (comma-separated, auto-suggest from existing)
10. "Save as Draft" and "Publish" buttons
11. Form validation prevents invalid submissions
12. Draft auto-saved every 30 seconds
13. Navigate back to timeline with new entry highlighted

### AC-4.4: Twincidence Detail View
1. Full-screen detail view for selected twincidence
2. Display all metadata: category, timestamp, detection type, confidence score
3. Full description with formatting preserved
4. Photo gallery (swipeable, pinch-to-zoom)
5. Video playback inline with controls
6. Voice note playback with waveform and progress indicator
7. For automatic detections: Display detection method and data visualization
8. For biometric sync: Charts showing synchronized data for both twins
9. Show both twins' data side-by-side when available
10. Share button (exports as image card or text)
11. Edit button (manual entries only, opens edit modal)
12. Delete button (manual entries only, with confirmation dialog)
13. Annotation section showing twin perspectives

### AC-4.5: Automatic Twintuition Sync Detection
1. Listens for Twintuition button presses from both twins via Firebase
2. "Simultaneous" defined as within 30 seconds
3. Creates twincidence automatically when detected
4. Metadata includes both timestamps and time delta
5. Confidence score calculated: 1 - (deltaSeconds / 30)
6. Higher confidence (<5 seconds) displays special "strong sync" badge
7. Push notification sent to both twins upon detection
8. Notification includes delta time and motivational message
9. Timeline shows mutual twintuition with unique icon and glow effect
10. Haptic feedback (success pattern) on detection

### AC-4.6: Privacy & Permissions Management
1. Privacy settings screen within Twincidences section
2. Toggle switches for each detection category
3. Clear explanations of what each category tracks with examples
4. Battery impact indicators for background features
5. "Enable All" and "Disable All" quick action buttons
6. Granular controls: HealthKit (heart rate, sleep, activity), Location (never/while using/always)
7. Display current OS permission status (granted/denied/not requested)
8. "Open Settings" button links to iOS app settings
9. Confirmation dialog before enabling sensitive features
10. Annual consent review reminder scheduled
11. Permission preferences persist across app restarts

### AC-4.7: HealthKit Integration for Biometric Sync Detection
1. Request HealthKit permission during onboarding or on first enable
2. Access heart rate data: Detect simultaneous spikes >20 bpm within 5 min
3. Access sleep data: Detect start/end times within 30 min window
4. Access activity data: Detect same workout type within 15 min
5. Create twincidence for detected synchronizations
6. Biometric charts display in detail view (line charts for heart rate, bar charts for activity)
7. Data processed on-device for privacy
8. Background task runs every 15-30 minutes (configurable)
9. Battery optimization: Sleep data checked once daily, workouts once every 6 hours
10. Configurable sensitivity thresholds in settings
11. iOS compliance: HealthKit usage descriptions in Info.plist
12. No raw health data transmitted; only sync events

### AC-4.8: Location-Based Coincidence Detection
1. Request location permission with clear justification
2. Track significant location changes using iOS API (battery optimized)
3. Detect simultaneous visit: Same place within 100m, within 4 hours
4. Detect sequential visit: Same place within 100m, different days
5. Proximity alerts: Notify if twins within 1km of each other
6. Privacy: Store place categories (restaurant, gym), not exact addresses
7. Reverse geocoding to identify place type
8. Create twincidences for all coincidence types
9. Geofencing for proximity alerts
10. Location history log (opt-in) shows twin's visited places with consent
11. iOS compliance: Location usage descriptions in Info.plist
12. User can downgrade to "while using" from "always" anytime

### AC-4.9: Insights and Analytics Dashboard
1. Analytics tab within Twincidences screen
2. Total twincidence count with trend indicator (up/down from last period)
3. Category breakdown pie chart
4. Heatmap: Days of week with most twincidences
5. Time-of-day patterns: Hourly bar chart
6. Synchronicity score over time (line chart)
7. Top categories list with counts
8. Longest streak of daily twincidences
9. Manual vs automatic detection ratio
10. Date range filters: Last week, month, year, all time
11. Export analytics as PDF with all charts
12. Charts render in under 1 second

### AC-4.10: Search and Filter Functionality
1. Search bar at top of timeline with magnifying glass icon
2. Search by: title, description, tags
3. Filter by: category (multi-select), date range, detection type
4. Filters can be combined (e.g., manual ESP dreams in last month)
5. Results update in real-time as typing (debounced 300ms)
6. Display result count
7. "Clear Filters" button resets all filters
8. Save custom filters with name (e.g., "My Dreams")
9. Sort options: Newest first, oldest first, most recently edited
10. Filter UI collapses/expands to save screen space

### AC-4.11: Collaborative Editing and Annotation
1. Both twins can add annotations to any twincidence
2. Annotations display separately from original content
3. Twin name and avatar shown with each annotation
4. Color-coded by twin (using accent colors)
5. Edit history tracking with timestamps and authors
6. Notification sent when twin adds annotation
7. Optimistic lock prevents simultaneous edits (temporary lock during editing)
8. Merge conflict notification if lock fails
9. Version history viewable in detail screen
10. Both twins can edit manual twincidences (with version tracking)

### AC-4.12: Twincidence Sharing and Export
1. Share individual twincidence as image card or text
2. Image card design: Galaxy theme, category icon, title, timestamp, key details
3. Exclude sensitive data: No exact biometric values or exact locations
4. Share to: Social media, messaging apps, email via native share dialog
5. Export all twincidences as JSON (full data structure)
6. Export filtered twincidences as CSV (flattened format)
7. Monthly/yearly summary image for social sharing
8. Share card generation completes in under 2 seconds
9. Text export includes markdown formatting

### AC-4.13: Migration from Story Vault (If Applicable)
1. Detect if Story Vault data exists in AsyncStorage on app startup
2. Prompt user to migrate with explanation dialog
3. Convert stories to twincidence format (category: MANUAL_OTHER)
4. Preserve: photos, text, timestamps, authors
5. Map story metadata to twincidence schema
6. Show migration progress dialog with percentage
7. Allow users to recategorize migrated content after migration
8. Archive original story data for user export (JSON backup)
9. Handle migration errors gracefully with retry option
10. Set migration complete flag to prevent re-running
11. Migration completes in under 30 seconds for 100 stories

## Traceability Mapping

*(Due to length, showing abbreviated version. Full mapping would include all 100+ acceptance criteria mapped to tech spec sections, components, and tests.)*

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-4.1: Data Model** | | | |
| AC-4.1.1: Interface defined | Data Models: Twincidence interface | src/models/Twincidence.ts | Unit test: Interface validation |
| AC-4.1.2: Enum defined | Data Models: TwincidenceCategory | src/models/Twincidence.ts | Unit test: Enum values |
| AC-4.1.9: CRUD operations | APIs: twincidencesStore | twincidencesStore.ts | Integration test: Create, read, update, delete |
| **AC-4.2: Timeline** | | | |
| AC-4.2.1: Main screen | Services: TwincidencesScreen.tsx | TwincidencesScreen.tsx | UI test: Screen renders |
| AC-4.2.3: Card display | Services: TwincidenceCard.tsx | TwincidenceCard.tsx | UI test: Card fields displayed |
| **AC-4.5: Twintuition Detection** | | | |
| AC-4.5.2: 30-second window | Workflows: Twintuition Detection Flow | twintuitionDetection.ts | Unit test: Delta calculation |
| AC-4.5.5: Confidence score | APIs: TwintuitionDetectionService.calculateConfidenceScore() | twintuitionDetection.ts | Unit test: Score formula (1 - delta/30) |
| **AC-4.7: HealthKit** | | | |
| AC-4.7.2: Heart rate detection | APIs: BiometricDetectionService.detectHeartRateSync() | biometricDetection.ts | Unit test: Spike detection algorithm |
| AC-4.7.11: iOS compliance | Dependencies: iOS Compliance Requirements | Info.plist | Manual test: App Store submission |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-4.1 | Battery drain from background detection tasks | High | High | Use iOS significant location API, limit HealthKit checks to 15-30 min intervals, provide battery impact indicators | Story 4.7, 4.8 |
| R-4.2 | Low HealthKit permission grant rate | Medium | High | Clear value proposition, show example insights before request, allow skip and re-enable later | Story 4.6 |
| R-4.3 | iOS App Store rejection for location "always" permission | Medium | High | Strong justification in description, provide "while using" option, demonstrate clear user value | Story 4.8 |
| R-4.4 | False positive detections (unrelated coincidences) | Medium | Medium | Tune detection thresholds, allow user to delete auto-detections, learn from user deletions | Stories 4.5, 4.7, 4.8 |
| R-4.5 | Privacy concerns with location tracking | High | High | Privacy-first design, hash coordinates, store categories not addresses, prominent controls | Story 4.8 |
| R-4.6 | AsyncStorage quota exceeded with large media | Medium | High | Compress images, limit video length, implement cleanup of old media, warn at 80% quota | Story 4.3 |
| R-4.7 | Complex collaborative editing conflicts | Low | Medium | Optimistic locking, last write wins with notification, version history | Story 4.11 |
| R-4.8 | Migration from Story Vault fails | Low | Medium | Comprehensive error handling, backup before migration, retry mechanism | Story 4.13 |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-4.1 | Users will grant HealthKit permission if value is clear | User testing, analytics tracking | Low detection rate, less engagement |
| A-4.2 | Significant location API is sufficient for detection | Testing in real-world scenarios | May need continuous tracking (battery impact) |
| A-4.3 | 30-second window for Twintuition is appropriate | User feedback, analytics | May need to adjust threshold |
| A-4.4 | Users want automatic detection (not just manual) | User research, competitive analysis | May need to deprioritize automatic features |
| A-4.5 | Biometric thresholds (20 bpm spike, 30 min sleep) are accurate | Pilot testing with real twins | May generate too many/too few detections |
| A-4.6 | Users will engage with analytics dashboard | Usage analytics | Feature may be underutilized |
| A-4.7 | Story Vault data exists in predictable AsyncStorage format | Code review of old implementation | Migration may fail if format differs |
| A-4.8 | Users understand twin can see their health/location patterns | User education, consent flow | Privacy backlash if not clear |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-4.1 | Should automatic detections be deletable by users? | High | Story 4.2 | **Decision: Yes** - Allow deletion with feedback collection |
| Q-4.2 | What happens if one twin disables detection and the other doesn't? | High | Story 4.6 | **Decision**: No detection for that category; show status to both twins |
| Q-4.3 | Should proximity alerts be opt-in separately from location tracking? | Medium | Story 4.8 | **Decision: Yes** - Separate toggle for real-time alerts |
| Q-4.4 | How to handle timezone differences in detection windows? | Medium | Stories 4.5, 4.7, 4.8 | **Decision**: Use UTC timestamps, convert to local for display |
| Q-4.5 | Should we show twin's exact location or just "nearby"? | High | Story 4.8 | **Decision**: Only "nearby" for privacy; exact location requires explicit share |
| Q-4.6 | Maximum age for twincidences before archiving/deletion? | Low | Phase 2 | **Decision**: No automatic deletion in MVP; add in Phase 2 |
| Q-4.7 | Should there be a limit on total twincidences stored? | Medium | Story 4.1 | **Decision**: No hard limit, but implement pagination and cleanup tools |
| Q-4.8 | Can users customize detection thresholds (e.g., heart rate spike threshold)? | Low | Phase 2 | **Decision**: Use fixed thresholds in MVP; add customization in Phase 2 |

### Technical Debt

| Item | Description | Impact | Remediation Plan |
|------|-------------|--------|------------------|
| TD-4.1 | Local-only detection (no backend intelligence) | Medium | Migrate to server-side detection in Epic 7 for improved accuracy |
| TD-4.2 | No machine learning for pattern detection | Low | Add ML models in Phase 2 for predictive insights |
| TD-4.3 | Limited to iOS HealthKit (no Android Health Connect) | Medium | Add Android support in Phase 2 |
| TD-4.4 | Manual text-based tags (no smart suggestions) | Low | Add AI-powered tag suggestions based on content |
| TD-4.5 | Simple last-write-wins for conflicts | Low | Implement CRDT or operational transforms for better collaboration |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Data Model Validation** (Story 4.1):
   - Twincidence schema validation
   - Category enum validation
   - Metadata structure for each detection type
   - Media item validation (size, type, count limits)

2. **Detection Algorithms** (Stories 4.5, 4.7, 4.8):
   - Twintuition: Time delta calculation, confidence scoring
   - Biometric: Heart rate spike detection, sleep window matching, workout type matching
   - Location: Distance calculation (Haversine), place type matching, coincidence type determination

3. **Store Actions** (Story 4.1):
   - CRUD operations: create, read, update, delete
   - Query operations: filter by category, date range, search
   - Analytics calculations: synchronicity score, trend data, heatmap

4. **Utility Functions**:
   - Date/time utilities: timezone handling, window comparisons
   - Privacy utilities: coordinate hashing, data anonymization
   - Export utilities: JSON serialization, CSV flattening

### Integration Tests

**Target**: All user flows end-to-end

**Key Integration Scenarios:**
1. **Manual Entry Flow** (Story 4.3):
   - Create → Add media → Save → Verify in timeline
   - Test draft auto-save and recovery

2. **Automatic Detection Flow** (Stories 4.5, 4.7, 4.8):
   - Trigger event → Detection service → Twincidence created → Notification sent
   - Test permission denial handling

3. **Timeline and Detail Views** (Stories 4.2, 4.4):
   - Load timeline → Scroll → Tap card → View detail
   - Test infinite scroll performance

4. **Privacy Settings** (Story 4.6):
   - Change preference → Request OS permission → Update detection state
   - Test permission flow for HealthKit and Location

5. **Analytics Dashboard** (Story 4.9):
   - Load dashboard → Apply filters → Export report
   - Test calculation correctness

6. **Collaborative Editing** (Story 4.11):
   - Twin 1 edits → Twin 2 receives notification → Views changes
   - Test lock mechanism

7. **Data Migration** (Story 4.13):
   - Detect old data → Run migration → Verify conversion
   - Test rollback on error

### UI/Component Tests

**Target**: All screens and major components

**Testing Framework**: React Native Testing Library

**Key UI Tests:**
1. **TwincidencesScreen**:
   - Timeline renders with twincidences
   - Empty state displays when no data
   - Pull-to-refresh works
   - FAB opens creation modal

2. **CreateTwincidenceScreen**:
   - All form fields render
   - Validation works (required title, max lengths)
   - Media pickers open
   - Save button creates twincidence

3. **TwincidenceDetailScreen**:
   - All metadata displays
   - Media gallery works (swipe, zoom)
   - Video/audio playback works
   - Share button triggers share dialog

4. **TwincidencePrivacyScreen**:
   - All toggle switches render
   - Explanations display
   - OS permission status accurate
   - Settings link works

5. **AnalyticsScreen**:
   - All charts render
   - Filters update data
   - Export generates PDF

### E2E Tests

**Target**: Critical user journeys

**Testing Tool**: Detox or Maestro

**Key E2E Scenarios:**
1. **Happy Path - Manual Entry**:
   - Tap FAB → Fill form → Add photo → Save → See in timeline
   - Expected: Twincidence created and visible

2. **Happy Path - Automatic Detection**:
   - Both twins press Twintuition → Notification received → View in timeline
   - Expected: Mutual twintuition detected and logged

3. **Privacy Flow**:
   - Enable HealthKit → Grant permission → Background task runs → Detection occurs
   - Expected: Biometric sync detected

4. **Error Path - Permission Denied**:
   - Enable location → Deny permission → See guidance message
   - Expected: Clear instructions to enable in Settings

5. **Collaborative Editing**:
   - Twin 1 adds annotation → Twin 2 receives notification → Views annotation
   - Expected: Both perspectives visible

### Performance Tests

**Target Metrics:**
- Timeline load: < 500ms for 20 items
- Detection processing: < 2 seconds
- Analytics: < 3 seconds
- Background tasks: < 30 seconds per cycle

**Key Performance Tests:**
1. Timeline scrolling FPS (60 FPS target)
2. Image loading with lazy loading
3. Analytics calculation on large datasets (1000+ twincidences)
4. Background task battery impact (< 15% per day)
5. AsyncStorage operation latency

### Accessibility Tests

**Requirements:**
- Screen reader support for all screens
- Color contrast for text (WCAG AA)
- Touch targets min 44x44
- Haptic feedback for detections

**Key Accessibility Tests:**
1. VoiceOver navigation through timeline
2. Talkback support for all buttons
3. Color-blind friendly chart colors
4. Keyboard navigation (web fallback)

### Security & Privacy Tests

**Key Tests:**
1. HealthKit permission flow compliance
2. Location permission flow compliance
3. Data encryption in AsyncStorage
4. Coordinate hashing validation
5. No PII in logs or error reports
6. Privacy Nutrition Labels accuracy

### Definition of Done (DoD)

A story is complete when:
1. ✅ All acceptance criteria met
2. ✅ Unit tests written and passing (80%+ coverage)
3. ✅ Integration tests written and passing
4. ✅ UI tests written and passing
5. ✅ E2E tests written for critical paths
6. ✅ Performance tests passing (60 FPS, < 500ms loads)
7. ✅ Accessibility requirements met
8. ✅ Privacy compliance verified (iOS descriptions, permission flows)
9. ✅ Code reviewed and approved
10. ✅ Manual testing on iOS (Android future)
11. ✅ No high-severity bugs
12. ✅ Documentation updated
13. ✅ Sprint status updated to "done"

---

## Epic 4 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Update sprint-status.yaml: `epic-4: backlog` → `epic-4: contexted`
2. Draft all 13 Epic 4 stories in `/docs/stories/`
3. Begin Story 4.1 implementation after approval

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Tech Lead
- [ ] QA Lead

**Estimated Total Effort**: 12-15 days for single developer

**Last Updated**: 2025-11-18
