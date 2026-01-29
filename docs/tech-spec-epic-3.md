# Epic Technical Specification: Twintuition Real-Time System

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 implements Twintuition, a real-time alert system that enables twins to instantly notify each other when they're thinking of one another. This feature creates magical moments of synchronicity by detecting simultaneous alerts, tracking emotional patterns, and providing insights into twin connection rhythms throughout the day.

Twintuition is the daily engagement driver for Twinship - the feature that brings users back throughout the day to share moments of connection. With emotion recognition, pattern analysis, and celebration of synchronicity, Twintuition transforms abstract feelings into tangible shared experiences.

This specification covers the client-side implementation using React Native, Expo, TypeScript, and Zustand state management with mock real-time messaging for development. Epic 7 will replace the mock WebSocket with production Firebase real-time infrastructure.

## Objectives and Scope

**In Scope:**
- Three alert types (Feeling, Thought, Action) with quick-send UI
- Emotion recognition with 8-emotion palette and intensity slider
- Send alerts with optional message (max 100 characters)
- Receive alerts with push notifications and in-app banners
- Alert history and timeline with filtering
- Simultaneous alert detection (within 5-minute window)
- Synchronicity celebration animations and scoring
- Pattern analysis dashboard (time-of-day heatmaps, emotion frequency)
- Quick-access floating button from any screen
- Mock WebSocket for real-time messaging (development)
- Local persistence of alert history

**Out of Scope:**
- Production real-time infrastructure (Epic 7 - Firebase/WebSocket)
- Voice or video calls
- Group alerts (more than 2 people)
- Alert scheduling or reminders
- Advanced AI emotion analysis from text
- Location-based alert triggers
- Wearable device integration (Apple Watch alerts)
- Premium alert customization features

**Success Criteria:**
- Alerts send and receive within 2 seconds (mock environment)
- Synchronicity detection accurate within 5-minute window
- Alert history loads in under 500ms
- Pattern analysis dashboard renders in under 1 second
- Users send at least 5 alerts per week on average
- Synchronicity moments detected and celebrated correctly
- 60 FPS animations for celebration moments

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Navigation Layer** (`src/navigation/AppNavigator.tsx`):
   - TwintuitionScreen accessible from Twindex
   - TwintuitionHistory screen for alert timeline
   - TwintuitionInsights dashboard for pattern analysis
   - Quick-access floating button overlays main screens

2. **State Management** (`src/state/`):
   - `twintuitionStore.ts`: Alert data, synchronicity events, pattern metrics
   - `twinStore.ts`: Twin connection info for alert routing
   - `chatStore.ts`: Integration for quick-reply functionality

3. **Services Layer** (`src/services/`):
   - `twintuitionService.ts`: Alert sending, receiving, synchronicity detection
   - `chatService.ts`: Mock WebSocket for real-time alert delivery
   - `storageService.ts`: AsyncStorage persistence for alert history
   - `notificationService.ts`: Push notification handling (mock for now)

4. **UI Components** (`src/components/twintuition/`):
   - `TwintuitionQuickSend.tsx`: Floating quick-send button
   - `TwintuitionAlertComposer.tsx`: Alert creation UI with emotion selector
   - `TwintuitionNotification.tsx`: In-app banner for incoming alerts
   - `SynchronicityMoment.tsx`: Celebration animation for simultaneous alerts
   - `EmotionPalette.tsx`: 8-emotion selection grid
   - `AlertCard.tsx`: Individual alert display in history

**Design System Integration:**
- Galaxy-themed color palette with emotion-specific accent colors
- NativeWind/Tailwind CSS for consistent styling
- React Native Reanimated for smooth notification slides and celebration animations
- Expo Haptics for tactile feedback on send/receive
- React Native Chart Kit for pattern analysis visualizations

**Existing Patterns:**
- Uses existing `galaxybackground.png` for cosmic aesthetic
- Integrates with mock WebSocket from chat service (EventEmitter-based)
- Follows established AsyncStorage persistence patterns
- Maintains consistent form and input validation

**Real-Time Architecture (Development):**
```
User A sends alert
  ↓
twintuitionService.sendAlert()
  ↓
Save to local store + AsyncStorage
  ↓
Mock WebSocket emit (chatService)
  ↓
[Simulated network delay 100-500ms]
  ↓
User B's WebSocket listener receives
  ↓
twintuitionStore.addIncomingAlert()
  ↓
Notification triggers (push + in-app banner)
  ↓
Check for synchronicity (both sent within 5 min)
  ↓
[If synchronous] → SynchronicityMoment animation
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `TwintuitionScreen.tsx` | Main alert sending UI with emotion selection | User input | Alert object | Story 3.1, 3.2 |
| `TwintuitionQuickSend.tsx` | Floating quick-access button | Screen context | Navigation to composer | Story 3.1 |
| `twintuitionService.ts` | Send alerts, detect synchronicity | Alert data, twin alerts | Alert objects, sync events | Stories 3.2, 3.5 |
| `TwintuitionNotification.tsx` | Display incoming alerts | Alert object | Notification UI, user actions | Story 3.3 |
| `TwintuitionHistory.tsx` | Alert timeline with filters | Filter criteria | Paginated alert list | Story 3.4 |
| `SynchronicityMoment.tsx` | Celebration animation for sync events | Sync event data | Animation, haptics | Story 3.5 |
| `TwintuitionInsights.tsx` | Pattern analysis dashboard | Alert history | Charts, heatmaps, trends | Story 3.6 |
| `twintuitionStore.ts` | Persist alerts, sync events, metrics | Alert data, actions | Store state, selectors | Stories 3.1-3.6 |
| `notificationService.ts` | Push notification handling | Alert object | Push notification, badge | Story 3.3 |
| `EmotionPalette.tsx` | 8-emotion selection grid | None | Selected emotion | Story 3.2 |

**Module Dependencies:**
- All screens depend on `react-native-gesture-handler` for gestures
- Charts depend on `react-native-chart-kit` or `react-native-svg` + `d3`
- Push notifications depend on `expo-notifications`
- All stores depend on `zustand` and `AsyncStorage` persistence middleware
- Mock real-time depends on existing `chatService.ts` EventEmitter

### Data Models and Contracts

**TwintuitionAlert Interface:**
```typescript
interface TwintuitionAlert {
  id: string;                      // UUID v4
  type: 'feeling' | 'thought' | 'action';
  emotion: EmotionType;            // Primary emotion
  intensity: number;               // 1-10 scale
  message?: string;                // Optional, max 100 characters
  senderId: string;                // User ID who sent
  receiverId: string;              // Twin's user ID
  sentAt: string;                  // ISO 8601 timestamp
  receivedAt?: string;             // ISO 8601 timestamp (null if not yet received)
  seenAt?: string;                 // ISO 8601 timestamp (null if not seen)
  repliedTo?: string;              // Alert ID if this is a reply
  isSynchronous: boolean;          // Whether part of synchronicity event
  synchronicityEventId?: string;   // If part of sync event
}
```

**EmotionType Enum:**
```typescript
type EmotionType =
  | 'joy'          // Happy, excited, delighted
  | 'sadness'      // Sad, down, melancholy
  | 'anger'        // Frustrated, annoyed, upset
  | 'fear'         // Anxious, worried, scared
  | 'surprise'     // Shocked, amazed, astonished
  | 'disgust'      // Repulsed, uncomfortable
  | 'trust'        // Safe, confident, secure
  | 'anticipation'; // Eager, hopeful, looking forward

// Same 8 emotions from Emotional Resonance Mapping game
```

**SynchronicityEvent Interface:**
```typescript
interface SynchronicityEvent {
  id: string;                      // UUID v4
  alert1Id: string;                // First alert ID
  alert2Id: string;                // Second alert ID
  timeDifference: number;          // Milliseconds between alerts
  detectedAt: string;              // ISO 8601 timestamp
  emotionMatch: boolean;           // Whether emotions matched
  typeMatch: boolean;              // Whether alert types matched
  score: number;                   // 0-100 synchronicity strength score
  celebrated: boolean;             // Whether celebration shown to users
}
```

**AlertPattern Interface:**
```typescript
interface AlertPattern {
  userId: string;
  twinId: string;
  timeWindow: {
    start: string;                 // ISO 8601 date
    end: string;                   // ISO 8601 date
  };
  metrics: {
    totalAlerts: number;
    sentAlerts: number;
    receivedAlerts: number;
    averageResponseTime: number;   // Milliseconds
    synchronicityRate: number;     // Percentage
    mostCommonEmotion: EmotionType;
    mostActiveHour: number;        // 0-23 (hour of day)
    mostActiveDay: number;         // 0-6 (day of week)
  };
  emotionFrequency: {
    [key in EmotionType]: number;  // Count per emotion
  };
  hourlyDistribution: number[];    // 24-element array (0-23 hours)
  weeklyDistribution: number[];    // 7-element array (0-6 days)
}
```

**Alert Validation Schema:**
```typescript
const alertSchema = {
  type: {
    required: true,
    enum: ['feeling', 'thought', 'action']
  },
  emotion: {
    required: true,
    enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation']
  },
  intensity: {
    required: true,
    min: 1,
    max: 10,
    type: 'number'
  },
  message: {
    required: false,
    maxLength: 100,
    sanitize: true  // Remove XSS, trim whitespace
  },
  receiverId: {
    required: true,
    type: 'uuid',
    mustBePairedTwin: true
  }
};
```

### APIs and Interfaces

**Zustand Store Actions:**

```typescript
// twintuitionStore actions
interface TwintuitionStoreActions {
  // Alert management
  sendAlert: (alert: Omit<TwintuitionAlert, 'id' | 'sentAt'>) => Promise<TwintuitionAlert>;
  receiveAlert: (alert: TwintuitionAlert) => void;
  markAlertSeen: (alertId: string) => void;
  replyToAlert: (alertId: string, reply: Partial<TwintuitionAlert>) => Promise<TwintuitionAlert>;

  // Synchronicity detection
  checkSynchronicity: (newAlert: TwintuitionAlert) => SynchronicityEvent | null;
  celebrateSynchronicity: (eventId: string) => void;

  // Queries
  getAlertHistory: (filters?: AlertFilters) => TwintuitionAlert[];
  getSynchronicityEvents: () => SynchronicityEvent[];
  getPatternAnalysis: (timeWindow: { start: string; end: string }) => AlertPattern;

  // Computed
  getUnseenCount: () => number;
  getSynchronicityScore: (timeWindow?: { start: string; end: string }) => number;
  getMostCommonEmotion: () => EmotionType;
}

interface AlertFilters {
  type?: 'feeling' | 'thought' | 'action';
  startDate?: string;
  endDate?: string;
  emotion?: EmotionType;
  onlySynchronous?: boolean;
}
```

**Service Method Signatures:**

```typescript
// twintuitionService.ts
class TwintuitionService {
  async sendAlert(alert: Omit<TwintuitionAlert, 'id' | 'sentAt'>): Promise<TwintuitionAlert>;
  // Validates, creates alert, sends via mock WebSocket, saves locally

  async receiveAlert(alert: TwintuitionAlert): Promise<void>;
  // Stores incoming alert, triggers notification, checks synchronicity

  detectSynchronicity(alert1: TwintuitionAlert, alert2: TwintuitionAlert): SynchronicityEvent | null;
  // Returns SynchronicityEvent if alerts within 5-minute window

  calculateSynchronicityScore(event: SynchronicityEvent): number;
  // Score based on time difference, emotion match, type match (0-100)

  async generatePatternAnalysis(userId: string, twinId: string, timeWindow: TimeWindow): Promise<AlertPattern>;
  // Aggregates alert history for insights dashboard

  getMockAlerts(count: number): TwintuitionAlert[];
  // Development helper for testing with mock data
}

// notificationService.ts
class NotificationService {
  async scheduleAlert(alert: TwintuitionAlert): Promise<string>;
  // Schedules push notification (mock for now, Epic 7 for real)

  async cancelAlert(notificationId: string): Promise<void>;
  // Cancels scheduled notification

  async setBadgeCount(count: number): Promise<void>;
  // Updates app badge with unseen alert count

  async requestPermissions(): Promise<boolean>;
  // Requests push notification permissions from OS
}
```

**React Navigation Type Definitions:**

```typescript
type TwintuitionStackParamList = {
  Twintuition: undefined;
  TwintuitionHistory: { filters?: AlertFilters };
  TwintuitionInsights: { timeWindow?: { start: string; end: string } };
  AlertComposer: { replyTo?: string };
  SynchronicityDetail: { eventId: string };
};

// Navigation prop type
type TwintuitionScreenNavigationProp = StackNavigationProp<TwintuitionStackParamList, 'Twintuition'>;
```

### Workflows and Sequencing

**Send Alert Flow (Stories 3.1, 3.2):**
```
User taps quick-send floating button
  ↓
Navigate to TwintuitionScreen (AlertComposer)
  ↓
Display three alert types: Feeling, Thought, Action
  ↓
User selects alert type (tap with haptic feedback)
  ↓
Display EmotionPalette (8 emotions in grid)
  ↓
User selects primary emotion
  ↓
Display intensity slider (1-10)
  ↓
User adjusts intensity
  ↓
Display optional message input (max 100 chars)
  ↓
User enters message (optional)
  ↓
Preview alert card
  ↓
User taps "Send"
  ↓
Validate alert data:
  - Type is valid enum
  - Emotion is valid enum
  - Intensity 1-10
  - Message ≤ 100 chars (if provided)
  - Twin is paired and active
  ↓
[If valid] → Create TwintuitionAlert object
  ↓
twintuitionService.sendAlert(alert)
  ↓
Save to twintuitionStore + AsyncStorage
  ↓
Send via mock WebSocket (chatService.sendMessage)
  ↓
Confirmation animation (success message, haptic)
  ↓
Navigate back to previous screen
```

**Receive Alert Flow (Story 3.3):**
```
Mock WebSocket receives alert
  ↓
chatService emits 'twintuition:incoming' event
  ↓
twintuitionStore listener catches event
  ↓
twintuitionService.receiveAlert(alert)
  ↓
Validate alert structure
  ↓
Save to store + AsyncStorage
  ↓
Update receivedAt timestamp
  ↓
Check synchronicity:
  - Query alerts sent in last 5 minutes
  - Compare with incoming alert
  - If match → Create SynchronicityEvent
  ↓
[If app in foreground] → Display in-app banner
  ↓
TwintuitionNotification component animates in:
  - Slide from top
  - Show: alert type icon, emotion, message preview
  - Auto-dismiss after 10 seconds
  - User can tap to view full alert
  ↓
[If app in background] → Trigger push notification
  ↓
notificationService.scheduleAlert(alert)
  ↓
Update badge count with unseen alerts
  ↓
[If synchronicity detected] → Trigger celebration
  ↓
SynchronicityMoment animation plays:
  - Particle effects (cosmic theme)
  - Haptic feedback (success pattern)
  - Display "Synchronicity Moment!" message
  - Show time difference and matching details
```

**Synchronicity Detection Logic (Story 3.5):**
```
New alert received (or sent)
  ↓
twintuitionService.checkSynchronicity(newAlert)
  ↓
Query alerts from last 5 minutes:
  - If newAlert is incoming: Check sent alerts in window
  - If newAlert is outgoing: Check received alerts in window
  ↓
For each alert in window:
  ↓
  Calculate time difference (abs(alert.sentAt - newAlert.sentAt))
  ↓
  [If ≤ 5 minutes] → Potential synchronicity
    ↓
    Create SynchronicityEvent:
      - alert1Id: earlier alert
      - alert2Id: later alert
      - timeDifference: milliseconds
      - emotionMatch: alert1.emotion === alert2.emotion
      - typeMatch: alert1.type === alert2.type
      - score: calculateSynchronicityScore()
    ↓
    Save SynchronicityEvent to store
    ↓
    Mark both alerts as isSynchronous: true
    ↓
    Update synchronicityEventId on both alerts
    ↓
    Return SynchronicityEvent
  ↓
[If SynchronicityEvent created] → Trigger celebration
  ↓
twintuitionStore.celebrateSynchronicity(eventId)
  ↓
Display SynchronicityMoment component
  ↓
Update user's synchronicity score metrics
```

**Synchronicity Score Calculation:**
```typescript
function calculateSynchronicityScore(event: SynchronicityEvent): number {
  const maxTime = 5 * 60 * 1000; // 5 minutes in ms
  const timeFactor = 1 - (event.timeDifference / maxTime); // 1.0 = simultaneous, 0.0 = 5min apart

  let score = timeFactor * 60; // Base score: 0-60 points

  if (event.emotionMatch) score += 20; // +20 for matching emotion
  if (event.typeMatch) score += 20;    // +20 for matching type

  return Math.round(score); // 0-100 range
}
```

**Alert History Flow (Story 3.4):**
```
User navigates to TwintuitionHistory
  ↓
Load all alerts from twintuitionStore
  ↓
Display filters:
  - Alert type (All, Feeling, Thought, Action)
  - Date range (Last day, week, month, all time)
  - Emotion (All, or specific emotion)
  - Synchronous only (toggle)
  ↓
User applies filters
  ↓
twintuitionStore.getAlertHistory(filters)
  ↓
Filter alerts based on criteria
  ↓
Sort by sentAt descending (newest first)
  ↓
Group synchronous alerts together
  ↓
Display in FlatList with pagination (20 per page)
  ↓
Each alert shows:
  - Alert type icon
  - Emotion icon and name
  - Message preview (if exists)
  - Timestamp (relative: "2 hours ago")
  - Synchronicity badge (if isSynchronous)
  ↓
User taps alert
  ↓
Navigate to detail view with full alert data
  ↓
[If alert has reply] → Show reply thread
```

**Pattern Analysis Dashboard Flow (Story 3.6):**
```
User navigates to TwintuitionInsights
  ↓
Display time window selector (Last week, month, 3 months, all time)
  ↓
User selects time window
  ↓
twintuitionService.generatePatternAnalysis(userId, twinId, timeWindow)
  ↓
Query alerts within time window
  ↓
Aggregate metrics:
  - Total alerts (sent + received)
  - Synchronicity rate (% of alerts that were synchronous)
  - Average response time (time between twin's alert and user's reply)
  - Most common emotion (frequency count)
  - Hourly distribution (count per hour 0-23)
  - Weekly distribution (count per day 0-6)
  ↓
Display visualizations:
  1. Synchronicity Score Trend (line chart over time)
  2. Emotion Frequency (bar chart or pie chart)
  3. Time of Day Heatmap (24-hour gradient)
  4. Day of Week Bar Chart
  5. Response Time Average (single metric)
  6. Top Insight Cards:
     - "You both send most alerts at 8 PM"
     - "Joy is your most shared emotion (42%)"
     - "You have 23% synchronicity rate"
  ↓
User can:
  - Change time window
  - Tap chart to see details
  - Share insights (screenshot or share card)
```

**Error Handling Sequences:**

*Alert Send Failure:*
```
User sends alert → Validate → [Invalid]
  ↓
Display validation error:
  - "Message too long (max 100 characters)"
  - "Please select an emotion"
  - "Intensity must be between 1-10"
  ↓
Highlight invalid field
  ↓
Allow user to correct and retry
```

*Network Unavailable (Mock):*
```
User sends alert → Mock WebSocket unavailable
  ↓
Save alert locally with status: 'pending'
  ↓
Display toast: "Alert will send when connection restored"
  ↓
Queue alert for retry
  ↓
[When mock WebSocket reconnects] → Retry send
  ↓
Update alert status: 'sent'
```

*Twin Not Paired:*
```
User opens Twintuition → Check pairing status
  ↓
[If not paired] → Display message:
  "Pair with your twin to send Twintuition alerts"
  ↓
Show "Pair Now" button
  ↓
Navigate to PairScreen
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Alert Send Time**: < 500ms from tap to confirmation (mock environment)
- **Alert Receive Time**: < 2 seconds from send to notification (mock WebSocket)
- **Synchronicity Detection**: < 100ms after alert received
- **History Load Time**: < 500ms for 100 alerts
- **Pattern Analysis**: < 1 second to generate dashboard
- **Animation Frame Rate**: 60 FPS for celebration and notifications
- **Memory Usage**: < 120MB during alert interactions
- **AsyncStorage**: < 50ms for save/retrieve operations

**Performance Requirements:**
1. **Smooth Animations**: All notification slides and celebrations maintain 60 FPS
2. **Instant Feedback**: Send button provides immediate visual/haptic response (< 50ms)
3. **Efficient Queries**: Filter and search operations on alert history are fast (< 300ms)
4. **Lazy Loading**: History timeline uses pagination to avoid loading all alerts
5. **Optimized Charts**: Pattern analysis uses lightweight SVG or Canvas rendering

**Performance Optimizations:**
- Memoize pattern analysis calculations (cache results for 1 hour)
- Use FlatList with `getItemLayout` for alert history
- Debounce filter changes (300ms) to reduce re-renders
- Preload emotion icons during app startup
- Batch AsyncStorage writes (save alerts in groups, not individually)
- Use React.memo for AlertCard components

**Linked PRD/Architecture Sections:**
- PRD: "Twintuition Button" - Real-time alert requirements
- Architecture: "Mobile-Specific UI Patterns" - Performance considerations

### Security

**Data Protection:**
- Alert data encrypted in AsyncStorage (iOS Keychain, Android EncryptedSharedPreferences)
- No PII in logs or crash reports (alerts may contain sensitive emotions/messages)
- Alerts are twin-private (not shared publicly without explicit consent)

**Input Validation:**
- Message field sanitized to prevent XSS (trim, escape HTML entities)
- Emotion and type validated against enum (reject invalid values)
- Intensity clamped to 1-10 range
- Twin ID validated to ensure pairing before sending

**Threat Mitigation:**
- Rate limiting: Max 50 alerts per user per day (prevent spam)
- Message length limit: 100 characters (prevent abuse)
- No executable code in messages (sanitized before display)
- Mock WebSocket validation: Ensure alerts come from paired twin only

**Privacy:**
- Alerts stored locally until Epic 7 (Firebase sync)
- No third-party analytics on alert content
- Clear privacy policy on what alert data is collected

**Linked PRD/Architecture Sections:**
- PRD: "Data & Privacy" - Encryption and consent requirements
- Architecture: "Security Implementation" - Input sanitization patterns

### Reliability/Availability

**Error Handling:**
- **Graceful Degradation**: App functions offline (alerts queued for later)
- **Validation Errors**: Clear, actionable error messages for all validation failures
- **Network Errors**: Retry logic with exponential backoff (3 attempts, 1s, 2s, 4s delays)
- **Storage Errors**: Fallback to in-memory state if AsyncStorage fails
- **Crash Recovery**: Auto-restore unsent alerts from AsyncStorage on app restart

**Data Persistence:**
- **Auto-Save**: Alerts automatically saved after send/receive
- **Offline Queue**: Unsent alerts persist across app restarts
- **Backup Strategy**: AsyncStorage mirrored to iCloud/Google Drive (Epic 7)
- **Data Integrity**: Atomic writes (all-or-nothing for alert saves)

**Availability Targets:**
- **Local Operations**: 99.9% availability (only fails if device storage full)
- **Mock Real-Time**: 95% simulated delivery success (for testing resilience)
- **Recovery Time**: < 1 second to restore state from AsyncStorage

**Resilience Patterns:**
- **Retry Logic**: Auto-retry failed sends (3 attempts, exponential backoff)
- **Circuit Breaker**: Disable sending if mock WebSocket fails repeatedly (5 consecutive failures)
- **Fallback Values**: Default emotion to 'joy' if selection corrupted
- **State Rollback**: Revert to previous state if operation fails

**Data Integrity:**
- **Duplicate Prevention**: UUID v4 ensures unique alert IDs
- **Timestamp Validation**: Reject alerts with future timestamps
- **Referential Integrity**: Alerts reference valid user IDs and twin IDs
- **Synchronicity Validation**: Ensure synchronicity events reference valid alert IDs

**Linked PRD/Architecture Sections:**
- Architecture: "State Management" - Zustand persistence middleware
- Architecture: "Error Handling Strategy" - Global error handlers

### Observability

**Logging:**
- **Info Level**: User actions (alert sent, alert received, synchronicity detected)
- **Debug Level**: Filter changes, notification triggers, pattern analysis generation
- **Error Level**: Send failures, validation errors, AsyncStorage failures
- **No PII**: Never log alert messages or emotion details (only metadata)

**Metrics Tracking:**
- **Alert Funnel**: Track completion rate at each step (composer open → type selected → emotion selected → send)
- **Synchronicity Rate**: Track percentage of alerts that become synchronous
- **Response Time**: Track average time between receiving alert and sending reply
- **Emotion Distribution**: Track frequency of each emotion type
- **Time-of-Day Patterns**: Track hourly distribution of alert sends

**Monitoring:**
- **Performance Monitoring**: Track alert send/receive latency
- **Crash Reporting**: Integrate with Sentry or Crashlytics
- **User Engagement**: Track daily active users sending/receiving alerts
- **AsyncStorage Health**: Monitor storage quota and operation success rate

**Debugging Support:**
- **Development Mode**: Enable verbose logging in __DEV__
- **Mock Alerts**: Generate test alerts with `twintuitionService.getMockAlerts()`
- **State Inspector**: Redux DevTools compatible Zustand inspector
- **Network Inspector**: Flipper integration for mock WebSocket debugging

**Telemetry:**
- **Anonymous Usage Stats**: Opt-in telemetry for alert frequency and patterns
- **Performance Telemetry**: Alert latency, animation FPS
- **Error Telemetry**: Crash reports, exception tracking
- **Feature Adoption**: Track users who enable Twintuition vs never use it

**Linked PRD/Architecture Sections:**
- PRD: "Success Metrics" - User engagement and retention tracking
- Architecture: "Development Workflow" - Monitoring with DataDog/LogRocket

## Dependencies and Integrations

### NPM Dependencies

**Core Framework:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `expo` | 53.0.22 | React Native framework | Core platform |
| `react` | 19.0.0 | UI library | All screens |
| `react-native` | 0.79.5 | Mobile platform | All screens |
| `typescript` | 5.8.3 | Type safety | All code |

**Navigation:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `@react-navigation/native` | 7.1.6 | Navigation library | Screen routing |
| `@react-navigation/native-stack` | 7.3.2 | Stack navigator | Twintuition flow |

**State Management:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `zustand` | 5.0.4 | State management | twintuitionStore |
| `@react-native-async-storage/async-storage` | 2.1.2 | Local persistence | Alert history storage |

**UI & Styling:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `nativewind` | 4.1.23 | Tailwind CSS for RN | All styling |
| `react-native-reanimated` | 3.17.4 | Animations | Notification slides, celebrations |
| `expo-haptics` | 14.1.4 | Haptic feedback | Send/receive feedback |
| `react-native-svg` | 15.10.0 | SVG rendering | Charts, icons |

**Charts & Visualization:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `react-native-chart-kit` | 6.12.0 | Charts library | Pattern analysis dashboard |
| `react-native-calendars` | 1.1309.0 | Calendar heatmap | Time-of-day patterns (optional) |

**Notifications:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `expo-notifications` | 0.30.5 | Push notifications | Alert notifications (mock for now) |
| `expo-device` | 7.1.5 | Device info | Notification permissions |

**Utilities:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `uuid` | 11.1.0 | UUID generation | Alert IDs, synchronicity event IDs |
| `date-fns` | 4.1.0 | Date manipulation | Timestamp formatting, relative times |

**Testing:**
| Package | Version | Purpose | Epic 3 Usage |
|---------|---------|---------|--------------|
| `jest` | 29.7.0 | Test framework | Unit tests |
| `@testing-library/react-native` | 13.3.3 | Component testing | Screen tests |

### External Integrations

**Phase 1 (Epic 3 - Mock Environment):**
- Mock WebSocket via existing `chatService.ts` EventEmitter
- Mock push notifications via `expo-notifications` (local only)
- No external API integrations
- All data stored locally in AsyncStorage

**Phase 2 (Epic 7 - Production Backend):**
- Firebase Cloud Messaging for push notifications
- Firebase Realtime Database or Firestore for alert synchronization
- Cloud Functions for synchronicity detection (server-side)
- Firebase Analytics for pattern tracking

### Internal Module Dependencies

**Epic 3 depends on:**
- **Epic 1** (User Onboarding & Twin Pairing): Requires paired twins to send alerts
  - `twinStore.ts` for user and twin profile data
  - Twin pairing validation before sending alerts
- **Epic 7** (Backend Sync): Will replace mock WebSocket with Firebase
  - Existing `chatService.ts` mock WebSocket for development
  - AsyncStorage patterns from Epic 1

**Epic 3 provides foundation for:**
- **Epic 4** (Twincidences): Twintuition synchronicity events auto-logged to Twincidences
  - SynchronicityEvent data structure reused
  - Alert patterns inform twincidence detection
- **Epic 5** (Research): Alert patterns contribute to twin research data
  - Anonymous alert frequency and emotion data
  - Synchronicity metrics for research insights

### Version Constraints

**Minimum Supported Versions:**
- iOS: 13.4+ (Expo SDK 53 requirement)
- Android: API 23+ (Android 6.0+)
- Node.js: 18+ (for development)

**Known Issues & Patches:**
- `react-native@0.79.2.patch`: Custom modifications (see patches/ directory)
- `expo-notifications` requires manual permissions setup on iOS

### Breaking Changes & Migration

**If upgrading dependencies:**
1. **React Native 0.79.5 → 0.80+**: Check notification API changes
2. **Expo Notifications**: Monitor API changes in v1.0
3. **Zustand 5.0.4**: Middleware API stable, monitor v6
4. **React Native Reanimated**: Check v4 migration guide when released

**Schema Migration Strategy:**
- AsyncStorage keys versioned: `twinship:v1:twintuition:alerts`
- Migration function runs on app startup to update schemas
- Fallback to defaults if migration fails

## Acceptance Criteria (Authoritative)

### AC-3.1: Twintuition Alert Types and UI
1. Display three alert type options: Feeling, Thought, Action
2. Each alert type has distinct icon and color
3. One-tap selection with haptic feedback
4. Floating quick-access button visible on Twindex and TwinTalk screens
5. Quick-access button navigates to AlertComposer
6. Smooth animation when opening composer (slide up)
7. Galaxy background consistent with app theme
8. Back button to cancel and return to previous screen

### AC-3.2: Send Twintuition Alert with Emotion Recognition
1. EmotionPalette displays 8 emotions in grid layout
2. Each emotion shows icon, name, and color
3. User can select one primary emotion (tap to select)
4. Intensity slider ranges from 1-10 with clear labels
5. Optional message input with 100-character limit and counter
6. Real-time character count displays remaining characters
7. Preview card shows alert before sending
8. Send button triggers validation and sends alert
9. Confirmation animation and haptic feedback on successful send
10. Alert saved to twintuitionStore and AsyncStorage
11. Alert sent via mock WebSocket to twin
12. Error handling for validation failures with clear messages

### AC-3.3: Receive and Display Twintuition Alerts
1. Incoming alerts trigger in-app banner notification (if app in foreground)
2. In-app banner slides from top with smooth animation
3. Banner displays: alert type icon, emotion, sender name, message preview
4. Banner auto-dismisses after 10 seconds
5. User can tap banner to view full alert details
6. User can swipe banner to dismiss manually
7. Push notification sent if app in background
8. Push notification displays alert preview and sender name
9. Alert marked with receivedAt timestamp upon delivery
10. Alert stored in twintuitionStore and AsyncStorage
11. "Mark as Seen" action updates seenAt timestamp
12. Quick-reply option from notification (navigate to AlertComposer with replyTo)

### AC-3.4: Twintuition Alert History and Timeline
1. Chronological list of all sent and received alerts (newest first)
2. Filter by alert type (All, Feeling, Thought, Action)
3. Filter by date range (Last day, week, month, all time, custom)
4. Filter by emotion (All, or specific emotion)
5. Filter for synchronous alerts only (toggle switch)
6. Each alert card displays: type icon, emotion, message, timestamp
7. Relative timestamps ("2 hours ago", "Yesterday", "March 15")
8. Visual badge for synchronous alerts ("Sync Moment" icon)
9. FlatList with pagination (20 alerts per page)
10. Infinite scroll loads older alerts as user scrolls
11. Tap alert to view full details
12. Empty state message if no alerts match filters

### AC-3.5: Simultaneous Alert Detection and Celebration
1. Synchronicity detected when alerts sent within 5-minute window
2. SynchronicityEvent created with both alert IDs and metadata
3. Both alerts marked as isSynchronous: true
4. Synchronicity score calculated (0-100 based on time, emotion, type)
5. Special celebration animation plays for both users
6. Celebration includes: particle effects, haptic feedback, success sound
7. "Synchronicity Moment!" message displays with details:
   - Time difference (e.g., "Both sent within 2 minutes!")
   - Emotion match status
   - Alert type match status
8. Synchronicity badge appears on both alerts in history
9. Synchronicity event stored separately for tracking
10. User's synchronicity score metric updated

### AC-3.6: Twintuition Pattern Analysis Dashboard
1. Time window selector: Last week, month, 3 months, all time
2. Synchronicity Score Trend line chart (score over time)
3. Emotion Frequency bar chart or pie chart
4. Time-of-Day Heatmap showing 24-hour distribution
5. Day-of-Week bar chart showing weekly patterns
6. Top insight cards with auto-generated statements:
   - Most common emotion and percentage
   - Most active hour and day
   - Overall synchronicity rate
   - Average response time
7. Total alerts metric (sent + received)
8. Charts render in under 1 second
9. Tap chart to see detailed data
10. Share insights option (screenshot or share card)
11. Charts use galaxy theme colors for consistency

### AC-3.7: Cross-Cutting Requirements
1. All screens use `galaxybackground.png` for consistency
2. All animations maintain 60 FPS
3. All buttons provide haptic feedback on press
4. All screens respect safe area insets
5. All forms show validation errors clearly
6. All AsyncStorage operations handle errors gracefully
7. All screens support both iOS and Android
8. Mock WebSocket simulates realistic network delays (100-500ms)

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-3.1: Alert Types and UI** | | | |
| AC-3.1.1: Three alert types | Data Models: TwintuitionAlert.type | TwintuitionScreen.tsx | Unit test: Enum validation |
| AC-3.1.2: Distinct icons/colors | UI: Design system integration | AlertTypeSelector component | Visual test: Icons render |
| AC-3.1.3: One-tap selection | Workflows: Send Alert Flow | Button onPress + haptics | UI test: Tap triggers selection |
| AC-3.1.4: Floating button | Services: TwintuitionQuickSend.tsx | FloatingActionButton component | UI test: Button visible on screens |
| AC-3.1.5: Navigate to composer | Workflows: Send Alert Flow | React Navigation | E2E test: Navigation works |
| AC-3.1.6: Slide animation | Performance: 60 FPS requirement | React Native Reanimated | Integration test: Animation smooth |
| AC-3.1.7: Galaxy background | Services: Design system | GalaxyBackground component | Visual test: Background consistent |
| AC-3.1.8: Back button | UI: Navigation patterns | Navigation header | UI test: Back navigation works |
| **AC-3.2: Send with Emotion** | | | |
| AC-3.2.1: 8 emotions grid | Data Models: EmotionType | EmotionPalette.tsx | UI test: 8 emotions render |
| AC-3.2.2: Emotion display | Services: Emotion icons | Emotion icon assets | Visual test: Icons display correctly |
| AC-3.2.3: Emotion selection | Workflows: Send Alert Flow | Tap handler + state update | UI test: Selection updates state |
| AC-3.2.4: Intensity slider | Data Models: intensity 1-10 | Slider component | UI test: Slider ranges 1-10 |
| AC-3.2.5: Message input | Data Models: message max 100 | TextInput with validation | Unit test: Length validation |
| AC-3.2.6: Character count | Workflows: Send Alert Flow | Character counter component | UI test: Counter updates |
| AC-3.2.7: Preview card | Services: AlertPreview.tsx | Preview component | Integration test: Preview shows data |
| AC-3.2.8: Send validation | APIs: twintuitionService.sendAlert() | Validation logic | Unit test: Validation catches errors |
| AC-3.2.9: Confirmation animation | Workflows: Send Alert Flow | Reanimated + Haptics | Integration test: Animation plays |
| AC-3.2.10: Store save | APIs: twintuitionStore.sendAlert() | Zustand action + AsyncStorage | Integration test: Alert saved |
| AC-3.2.11: WebSocket send | Services: chatService mock | Mock WebSocket emit | Integration test: Alert emitted |
| AC-3.2.12: Error handling | Non-Functional: Reliability | Error message component | E2E test: Errors display clearly |
| **AC-3.3: Receive Alerts** | | | |
| AC-3.3.1: In-app banner | Services: TwintuitionNotification.tsx | Notification banner component | UI test: Banner appears |
| AC-3.3.2: Banner animation | Performance: 60 FPS | React Native Reanimated | Integration test: Smooth slide |
| AC-3.3.3: Banner content | Data Models: TwintuitionAlert | Alert display logic | UI test: Content displays correctly |
| AC-3.3.4: Auto-dismiss | Workflows: Receive Alert Flow | setTimeout auto-dismiss | Integration test: Dismisses after 10s |
| AC-3.3.5: Tap to view | Workflows: Receive Alert Flow | Navigation on tap | UI test: Tap navigates to detail |
| AC-3.3.6: Swipe dismiss | Services: Gesture handler | PanGestureHandler | UI test: Swipe dismisses banner |
| AC-3.3.7: Push notification | Services: notificationService.ts | expo-notifications | Integration test: Push sent (mock) |
| AC-3.3.8: Push content | Data Models: Alert preview | Notification payload | Unit test: Payload correct |
| AC-3.3.9: receivedAt timestamp | APIs: twintuitionStore.receiveAlert() | Store action | Unit test: Timestamp set |
| AC-3.3.10: AsyncStorage save | Services: storageService.ts | AsyncStorage persistence | Integration test: Alert persists |
| AC-3.3.11: Mark seen | APIs: twintuitionStore.markAlertSeen() | Store action | Unit test: seenAt updated |
| AC-3.3.12: Quick-reply | Workflows: Receive Alert Flow | Navigation with params | E2E test: Reply flow works |
| **AC-3.4: Alert History** | | | |
| AC-3.4.1: Chronological list | APIs: twintuitionStore.getAlertHistory() | FlatList with sorted data | Integration test: Sorting correct |
| AC-3.4.2-5: Filters | Data Models: AlertFilters | Filter logic | Unit test: Filters work correctly |
| AC-3.4.6: Alert card display | Services: AlertCard.tsx | Card component | UI test: Card renders data |
| AC-3.4.7: Relative timestamps | Services: date-fns | Timestamp formatting | Unit test: Relative times correct |
| AC-3.4.8: Sync badge | Data Models: isSynchronous | Badge component | UI test: Badge shows for sync alerts |
| AC-3.4.9: Pagination | Performance: Lazy loading | FlatList pagination | Integration test: Loads 20 per page |
| AC-3.4.10: Infinite scroll | Performance: Lazy loading | onEndReached handler | Integration test: Loads more on scroll |
| AC-3.4.11: Tap for details | Workflows: Alert History Flow | Navigation on tap | E2E test: Detail view loads |
| AC-3.4.12: Empty state | UI: Empty states | Empty state component | UI test: Message displays if no alerts |
| **AC-3.5: Synchronicity** | | | |
| AC-3.5.1: 5-minute window | APIs: twintuitionService.detectSynchronicity() | Time comparison logic | Unit test: Window detection correct |
| AC-3.5.2: SynchronicityEvent | Data Models: SynchronicityEvent | Event creation | Unit test: Event structure correct |
| AC-3.5.3: Mark synchronous | Workflows: Synchronicity Detection | Alert update logic | Integration test: Alerts marked |
| AC-3.5.4: Score calculation | APIs: calculateSynchronicityScore() | Score algorithm | Unit test: Score 0-100 range |
| AC-3.5.5: Celebration animation | Services: SynchronicityMoment.tsx | Animation component | Visual test: Animation plays |
| AC-3.5.6: Celebration elements | Workflows: Synchronicity Flow | Particles + haptics + sound | Integration test: All elements trigger |
| AC-3.5.7: Message display | Services: SynchronicityMoment.tsx | Message component | UI test: Message displays details |
| AC-3.5.8: Badge in history | Services: AlertCard.tsx | Badge rendering logic | UI test: Badge visible |
| AC-3.5.9: Event storage | APIs: twintuitionStore | Store action | Integration test: Event saved |
| AC-3.5.10: Score update | APIs: Computed metrics | Store selector | Unit test: Score updates correctly |
| **AC-3.6: Pattern Analysis** | | | |
| AC-3.6.1: Time window selector | UI: TwintuitionInsights.tsx | Dropdown/picker component | UI test: Selector works |
| AC-3.6.2-6: Charts | Services: generatePatternAnalysis() | react-native-chart-kit | Visual test: Charts render |
| AC-3.6.7: Total alerts metric | APIs: AlertPattern.metrics | Aggregation logic | Unit test: Count correct |
| AC-3.6.8: Render speed | Performance: < 1 second | Chart rendering optimization | Performance test: < 1s load |
| AC-3.6.9: Tap chart details | UI: Chart interactions | Chart onPress handler | UI test: Tap shows detail |
| AC-3.6.10: Share insights | Services: Share API | expo-sharing | Integration test: Share dialog opens |
| AC-3.6.11: Galaxy colors | Design: Theme integration | Chart color configuration | Visual test: Colors match theme |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-3.1 | Mock WebSocket doesn't accurately simulate production real-time behavior | Medium | Medium | Test extensively, plan for Epic 7 migration early | Story 3.2, 3.3 |
| R-3.2 | Synchronicity detection inaccurate due to time sync issues | Low | High | Use server timestamps in Epic 7, allow manual sync adjustment | Story 3.5 |
| R-3.3 | Users overwhelmed by too many alerts (alert fatigue) | Medium | Medium | Implement smart notification grouping, quiet hours feature (Phase 2) | Stories 3.3, 3.4 |
| R-3.4 | Performance degradation with large alert history (1000+ alerts) | Medium | Medium | Implement aggressive pagination, archive old alerts (Phase 2) | Story 3.4 |
| R-3.5 | Push notifications don't work reliably on all devices | Medium | High | Fallback to in-app notifications only, clear user messaging | Story 3.3 |
| R-3.6 | Users share sensitive alert content publicly by mistake | Low | High | Add privacy warnings, require confirmation before sharing | Stories 3.2, 3.6 |
| R-3.7 | Pattern analysis dashboard too complex for users to understand | Low | Low | Simplify insights, use plain language, add onboarding tooltips | Story 3.6 |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-3.1 | Users want real-time alerts (not scheduled/batched) | User research, beta testing | May need to add "quiet hours" or batching options |
| A-3.2 | 5-minute window is appropriate for synchronicity detection | User feedback, data analysis | May need to make window configurable (1-10 minutes) |
| A-3.3 | 8 emotions are sufficient for expressing feelings | User testing, emotion research | May need to expand palette or add custom emotions |
| A-3.4 | 100-character message limit is adequate | User feedback, usage data | May need to increase limit or add voice message option |
| A-3.5 | Users understand alert type distinctions (Feeling vs Thought vs Action) | User testing, onboarding | May need clearer definitions or merge types |
| A-3.6 | Users will check pattern analysis dashboard regularly | Analytics tracking | May need to push insights via notifications if low engagement |
| A-3.7 | Mock WebSocket latency (100-500ms) is realistic | Production benchmarks in Epic 7 | May need to adjust mock timing or add jitter |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-3.1 | Should users be able to schedule alerts for future delivery? | Low | Phase 2 | **Decision**: Not in MVP, add in Phase 2 if requested |
| Q-3.2 | How to handle alerts when twin is offline for extended period? | Medium | Story 3.3 | **Decision**: Queue locally, deliver when twin comes online |
| Q-3.3 | Should synchronicity window be configurable by users? | Low | Story 3.5 | **Decision**: Fixed 5 minutes in MVP, consider customization in Phase 2 |
| Q-3.4 | What happens to alerts after 1 year? Auto-archive? | Low | Phase 2 | **Decision**: Keep all alerts in MVP, add archiving in Phase 2 |
| Q-3.5 | Should alerts have read receipts (like iMessage)? | Medium | Story 3.3 | **Decision**: Yes, use seenAt timestamp to show "Seen" status |
| Q-3.6 | How many alerts per day is "too many"? Need rate limiting? | Medium | Story 3.2 | **Decision**: Soft limit 50/day with warning, hard limit 100/day |
| Q-3.7 | Should pattern analysis include predictions ("You usually send alerts at 8 PM")? | Low | Phase 2 | **Decision**: Not in MVP, requires ML model in Phase 2 |
| Q-3.8 | What if user wants to delete sent alert before twin sees it? | Medium | Phase 2 | **Decision**: Not supported in MVP, add "unsend" in Phase 2 |

### Technical Debt

| Item | Description | Impact | Remediation Plan |
|------|-------------|--------|------------------|
| TD-3.1 | Mock WebSocket doesn't support offline queuing | Medium | Replace with Firebase in Epic 7 |
| TD-3.2 | Synchronicity detection done client-side (not authoritative) | Medium | Move to server-side in Epic 7 for accuracy |
| TD-3.3 | Pattern analysis calculations not optimized for large datasets | Low | Add caching, background workers in Phase 2 |
| TD-3.4 | No alert encryption beyond AsyncStorage | Medium | Add end-to-end encryption in Epic 7 |
| TD-3.5 | Push notifications are mock (local only) | High | Implement Firebase Cloud Messaging in Epic 7 |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Validation Logic** (Story 3.2):
   - Alert type enum: Valid values, invalid values
   - Emotion enum: All 8 emotions accepted, invalid rejected
   - Intensity validation: Boundary testing (0, 1, 10, 11)
   - Message length: Valid (0-100 chars), invalid (101+ chars)
   - Sanitization: XSS prevention, trim whitespace

2. **Synchronicity Detection** (Story 3.5):
   - Time window: Alerts within 5 minutes detected, outside rejected
   - Score calculation: Edge cases (simultaneous, 5 min apart, emotion match, type match)
   - Event creation: Correct alert IDs, metadata populated
   - Duplicate prevention: Same alert pair doesn't create multiple events

3. **Pattern Analysis** (Story 3.6):
   - Metric calculations: Total alerts, synchronicity rate, average response time
   - Hourly distribution: Correct hourly buckets (0-23)
   - Weekly distribution: Correct day buckets (0-6)
   - Emotion frequency: Accurate counts per emotion
   - Edge cases: Empty dataset, single alert, all synchronous

4. **Store Actions** (Stories 3.1-3.6):
   - sendAlert: Creates alert, saves to store, returns object
   - receiveAlert: Updates store, triggers notification
   - markAlertSeen: Updates seenAt timestamp
   - getAlertHistory: Filters work correctly, sorting accurate
   - getSynchronicityScore: Calculated correctly over time window

5. **Utility Functions**:
   - Timestamp formatting: Relative times ("2 hours ago", "Yesterday")
   - Date range filtering: Correctly filters alerts by date
   - Alert sanitization: Message sanitized properly

### Integration Tests

**Target**: All user flows end-to-end

**Key Integration Scenarios:**
1. **Complete Send Flow** (Stories 3.1-3.2):
   - Open composer → Select type → Select emotion → Adjust intensity → Enter message → Preview → Send
   - Verify alert saved to store and AsyncStorage
   - Verify mock WebSocket emits alert
   - Verify confirmation animation plays

2. **Complete Receive Flow** (Story 3.3):
   - Mock WebSocket receives alert → Store updated → Notification triggers
   - Verify in-app banner displays (foreground)
   - Verify push notification sent (background)
   - Verify alert marked with receivedAt
   - Mark as seen → Verify seenAt updated

3. **Synchronicity Detection Flow** (Story 3.5):
   - User A sends alert → User B sends alert within 3 minutes
   - Verify SynchronicityEvent created
   - Verify both alerts marked isSynchronous
   - Verify celebration animation triggers for both users
   - Verify synchronicity score calculated

4. **Alert History and Filtering** (Story 3.4):
   - Create 30 mock alerts (mixed types, emotions, dates)
   - Apply type filter → Verify only matching alerts shown
   - Apply date range → Verify only alerts in range shown
   - Apply emotion filter → Verify only matching emotions shown
   - Toggle synchronous only → Verify only sync alerts shown

5. **Pattern Analysis Generation** (Story 3.6):
   - Create 100 mock alerts with varied times and emotions
   - Generate pattern analysis → Verify metrics correct
   - Verify hourly distribution matches alert times
   - Verify emotion frequency matches alert data
   - Verify synchronicity rate calculated correctly

### UI/Component Tests

**Target**: All screens and major components

**Testing Framework**: React Native Testing Library

**Key UI Tests:**
1. **TwintuitionScreen (AlertComposer)**:
   - All three alert type buttons render
   - EmotionPalette renders 8 emotions
   - Intensity slider renders with 1-10 range
   - Message input accepts text up to 100 characters
   - Character counter displays correctly
   - Preview card shows selected data
   - Send button enabled when valid, disabled when invalid

2. **TwintuitionNotification (Banner)**:
   - Banner slides in from top
   - Alert data displays correctly (type, emotion, message)
   - Tap navigates to detail view
   - Swipe dismisses banner
   - Auto-dismisses after 10 seconds

3. **TwintuitionHistory**:
   - Alert cards render with correct data
   - Filters render and are interactive
   - FlatList pagination works
   - Infinite scroll loads more alerts
   - Empty state displays if no alerts
   - Synchronicity badges show on sync alerts

4. **SynchronicityMoment**:
   - Celebration animation plays
   - Message displays time difference
   - Emotion match indicator shows
   - Type match indicator shows
   - Haptic feedback triggers

5. **TwintuitionInsights (Dashboard)**:
   - Time window selector renders
   - All charts render with data
   - Insight cards display metrics
   - Charts respond to tap interactions
   - Share button triggers share dialog

### E2E Tests

**Target**: Critical user journeys

**Testing Tool**: Detox or Maestro

**Key E2E Scenarios:**
1. **Happy Path - Send Alert**:
   - Open app → Tap Twintuition → Select Feeling → Select Joy → Send
   - Expected: Alert sent, confirmation shown, alert in history

2. **Happy Path - Receive Alert**:
   - Simulate incoming alert → Notification appears → Tap to view
   - Expected: Banner shows, tap navigates to detail, alert marked seen

3. **Happy Path - Synchronicity**:
   - User A sends alert → User B sends alert within 2 minutes
   - Expected: Both users see celebration animation, alerts marked synchronous

4. **Filter Path - History**:
   - Navigate to history → Apply emotion filter "Joy"
   - Expected: Only joy alerts displayed

5. **Pattern Path - Dashboard**:
   - Navigate to insights → Select "Last Month"
   - Expected: Charts render with last month's data

### Performance Tests

**Target Metrics:**
- Alert send: < 500ms from tap to confirmation
- Alert receive: < 2s from send to notification
- History load: < 500ms for 100 alerts
- Pattern analysis: < 1s to generate dashboard
- Animation frame rate: 60 FPS

**Key Performance Tests:**
1. Send latency measurement (mock WebSocket)
2. Receive latency measurement (mock WebSocket)
3. FlatList scroll performance with 1000 alerts
4. Chart rendering speed with large datasets
5. Animation frame rate monitoring (Reanimated FPS)

### Accessibility Tests

**Requirements:**
- Screen reader support on all screens
- Emotion icons have text alternatives
- Color contrast meets WCAG AA
- Haptic feedback where appropriate

**Key Accessibility Tests:**
1. VoiceOver/TalkBack navigation through alert composer
2. Color contrast validation for emotion palette
3. Touch target size validation (min 44x44)
4. Alert notification screen reader announcements

### Security Tests

**Key Security Tests:**
1. Message sanitization: XSS prevention, no script execution
2. Input validation: Reject invalid emotions, types, intensities
3. Rate limiting: Enforce 50 alerts/day soft limit, 100 hard limit
4. AsyncStorage encryption: Verify data encrypted at rest
5. PII in logs: Verify no alert messages in crash reports

### Regression Test Suite

**Automated regression tests run on every PR:**
1. All unit tests
2. Critical integration tests (send, receive, synchronicity)
3. Core E2E happy paths
4. Performance smoke tests

**Pre-release full regression:**
1. All unit tests
2. All integration tests
3. All E2E tests
4. Full performance suite
5. Platform-specific tests (iOS and Android)
6. Accessibility audit

### Test Data Strategy

**Mock Alerts:**
- Sample alerts with all 8 emotions
- Alerts with varying intensities (1-10)
- Alerts with and without messages
- Synchronous alert pairs (within 5 min)
- Non-synchronous alert pairs (> 5 min apart)
- Large dataset for pattern analysis (100+ alerts)

**Mock Synchronicity Events:**
- Perfect sync (0ms apart, emotion + type match)
- Near sync (4 min apart, no matches)
- Partial match (emotion match, type different)

**Test Environment:**
- Local AsyncStorage (cleared between test runs)
- Mocked time for synchronicity testing
- Mocked WebSocket with configurable latency
- Mocked notifications API

### Definition of Done (DoD)

A story is complete when:
1. ✅ All acceptance criteria met
2. ✅ Unit tests written and passing (80%+ coverage)
3. ✅ Integration tests written and passing
4. ✅ UI tests written and passing
5. ✅ E2E tests written and passing for critical paths
6. ✅ Performance tests passing (60 FPS, < 500ms loads)
7. ✅ Accessibility requirements met
8. ✅ Code reviewed and approved
9. ✅ Manual testing on iOS and Android
10. ✅ No high-severity bugs
11. ✅ Documentation updated
12. ✅ Sprint status updated to "done"

---

## Epic 3 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Update sprint-status.yaml: `epic-3: backlog` → `epic-3: contexted`
2. Draft all 6 story files in `/docs/stories/`
3. Begin Story 3.1 implementation after Epic 1 completion

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Tech Lead
- [ ] QA Lead

**Last Updated**: 2025-11-18
