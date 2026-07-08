# Twinship - Epic Breakdown and Implementation Stories

Date: 2025-11-03
Author: Ashley
Project: TwinshipClean
Status: Active Development

---

## Epic 1: User Onboarding & Twin Pairing

**Epic Goal**: Enable users to create accounts, set up profiles, and successfully pair with their twin through a secure invitation system (aka "Twinvitation").

**Business Value**: This is the foundation - without successful pairing, users cannot access any twin-specific features. A smooth onboarding experience is critical for activation and retention.

**Dependencies**: None (foundational epic)

### Stories

#### Story 1.1: User Registration and Profile Creation (aka "Twinfo")
**As a** new user
**I want** to create my account and basic profile
**So that** I can start using Twinship with my twin

**Acceptance Criteria:**
- User can input name, email, birthdate, place of birth, time of birth
- User selects twin type (identical, fraternal, other)
- Form validation for all required fields
- Profile data saved to AsyncStorage
- Profile data synced to Zustand store

**Technical Notes:**
- Files: `src/screens/auth/RegisterScreen.tsx`, `src/state/twinStore.ts`
- Use existing `tempTwinStore` for profile storage
- Email validation using standard regex
- Age calculation from birthdate
- Zodiac Sign calculation from date and time of birth

**Dependencies**: None

**Estimated Effort**: Small (2-4 hours)

---

#### Story 1.2: Galaxy Theme Accent Color Selection
**As a** new user
**I want** to choose my personal accent color from galaxy-color options
**So that** I can personalize my app experience

**Acceptance Criteria:**
- Display 8 galaxy-color options with previews
- User can select one accent color
- Color choice saved to profile
- Live preview shows color applied to sample UI elements
- Selected color persists across app restart

**Technical Notes:**
- Files: `src/screens/onboarding/ColorSelectionScreen.tsx`, `src/state/twinStore.ts`
- Color palette: Galaxy-inspired neons (cosmic blue, nebula purple, stardust pink, etc.)
- Use NativeWind for styling
- Store color as hex value in profile

**Dependencies**: Story 1.1

**Estimated Effort**: Small (2-3 hours)

---

#### Story 1.3: Generate Twin Invitation Link
**As a** registered user
**I want** to generate a unique invitation link for my twin
**So that** I can invite them to pair with me securely

**Acceptance Criteria:**
- Generate unique invitation code (8 characters, alphanumeric)
- Create shareable invitation link
- Store invitation in `invitationStore`
- Display invitation code prominently
- Provide copy-to-clipboard functionality
- Support both email and SMS sharing

**Technical Notes:**
- Files: `src/services/invitationService.ts`, `src/state/invitationStore.ts`
- Use `nanoid` or similar for unique code generation
- Store invitation with timestamp and status
- Integration with React Native Share API

**Dependencies**: Story 1.1

**Estimated Effort**: Small (3-4 hours)

---

#### Story 1.4: Accept Twin Invitation and Pair
**As a** new user with an invitation code
**I want** to accept my twin's invitation
**So that** we can be paired and access twin features together

**Acceptance Criteria:**
- Input field for invitation code
- Validate invitation code exists
- Match twins in the system
- Update both profiles with twin connection
- Show celebration/success animation
- Navigate to main app upon successful pairing

**Technical Notes:**
- Files: `src/screens/PairScreen.tsx`, `src/services/invitationService.ts`
- Validate code against stored invitations
- Update `twinStore` with twin connection
- Mark invitation as "accepted" in store
- Auto-navigation to TwinTalk after 1.5s delay

**Dependencies**: Story 1.3

**Estimated Effort**: Medium (4-6 hours)

---

#### Story 1.5: Onboarding Tutorial Walkthrough
**As a** newly paired user
**I want** to see a quick tutorial of key features
**So that** I understand how to use Twinship effectively

**Acceptance Criteria:**
- 4-5 screen tutorial highlighting key features
- Swipeable carousel interface
- Skip option available
- Completion tracked in user profile
- Only shown once per user

**Technical Notes:**
- Files: `src/screens/onboarding/TutorialScreen.tsx`
- Use React Native Reanimated for smooth transitions
- Tutorial screens: Games, Twintuition, Stories, Research
- Store completion flag in AsyncStorage

**Dependencies**: Story 1.4

**Estimated Effort**: Medium (4-5 hours)

---

## Epic 1 Summary
- **Total Stories**: 5
- **Parallel Opportunities**: Stories 1.2 can be developed in parallel with 1.3
- **Critical Path**: 1.1 → 1.4 (must be sequential)
- **Estimated Total Effort**: 2-3 days for single developer

---

## Epic 2: Twin Connection Games Laboratory

**Epic Goal**: Implement four sophisticated psychological games that measure different aspects of twin synchronicity and generate meaningful insights.

**Business Value**: The games are the core differentiator of Twinship - they transform abstract twin connection into measurable data and create engaging daily content that drives retention.

**Dependencies**: Epic 1 (users must be paired to play games together)

### Stories

#### Story 2.1: Psychic Games Hub Screen
**As a** paired user
**I want** to see all available games in one place
**So that** I can choose which game to play

**Acceptance Criteria:**
- Display 4 game cards with titles, descriptions, and icons
- Show completion status for each game
- Visual indication of which games have been played
- Tap on game card navigates to game intro screen
- Galaxy-themed UI consistent with app design

**Technical Notes:**
- Files: `src/screens/games/PsychicGamesHub.tsx`
- Game cards: Cognitive Synchrony Maze, Emotional Resonance, Temporal Decision, Iconic Duo
- Use existing game screen structure
- Integration with `assessmentStore` for completion tracking

**Dependencies**: Epic 1 completion

**Estimated Effort**: Small (2-3 hours)

---

#### Story 2.2: Cognitive Synchrony Maze - Game Mechanics
**As a** user playing the maze game
**I want** to navigate through a maze and record my decisions
**So that** my problem-solving patterns can be analyzed

**Acceptance Criteria:**
- Display interactive maze grid (10x10 or similar)
- User can swipe/tap to move through maze
- Record each directional choice (left/right/up/down)
- Track errors and correction patterns
- Record completion time
- Prevent cheating (no backtracking visualization)

**Technical Notes:**
- Files: `src/screens/games/CognitiveSynchronyMaze.tsx`
- Use React Native Gesture Handler for swipe detection
- Store move history: [{direction, timestamp, wasError}]
- Maze generation algorithm: simple random or predefined paths

**Dependencies**: Story 2.1

**Estimated Effort**: Medium (6-8 hours)

---

#### Story 2.3: Cognitive Synchrony Maze - Insight Generation
**As a** user who completed the maze game
**I want** to see insights comparing my patterns with my twin
**So that** I understand our cognitive synchronicity

**Acceptance Criteria:**
- Calculate directional preference percentages
- Compare error correction styles between twins
- Generate insight statements (e.g., "You both favor right turns 73% of the time")
- Display results in visually appealing format
- Store insights in assessment results

**Technical Notes:**
- Files: `src/services/games/mazeAnalysis.ts`, `src/screens/games/MazeResults.tsx`
- Analysis metrics: direction preference, error rate, decision speed
- Comparison logic: calculate overlap percentages
- Visual: Charts/graphs showing comparison

**Dependencies**: Story 2.2

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 2.4: Emotional Resonance Mapping - Abstract Image Selection
**As a** user playing the emotional resonance game
**I want** to choose abstract images that represent emotions
**So that** my emotional vocabulary can be mapped

**Acceptance Criteria:**
- Display 10-15 abstract images (colors, shapes, patterns)
- Present 8-10 emotion words one at a time
- User selects image(s) that match each emotion
- Allow multiple selections per emotion
- Record image-emotion associations
- Smooth animations between emotion prompts

**Technical Notes:**
- Files: `src/screens/games/EmotionalResonanceGame.tsx`
- Images: Abstract art assets in `/assets/emotions/`
- Emotions: Joy, Sadness, Anger, Fear, Surprise, Disgust, Trust, Anticipation
- Store: [{emotion: string, selectedImages: number[]}]

**Dependencies**: Story 2.1

**Estimated Effort**: Medium (5-7 hours)

---

#### Story 2.5: Emotional Resonance Mapping - Vocabulary Overlap Analysis
**As a** user who completed emotional resonance
**I want** to see how my emotional vocabulary overlaps with my twin
**So that** I understand our emotional synchronicity

**Acceptance Criteria:**
- Calculate percentage overlap in image-emotion associations
- Identify shared emotional patterns
- Generate insights (e.g., "Your emotional vocabularies overlap by 67%")
- Visualize shared vs unique associations
- Highlight strongest commonalities

**Technical Notes:**
- Files: `src/services/games/emotionAnalysis.ts`, `src/screens/games/EmotionResults.tsx`
- Overlap calculation: Jaccard similarity or similar algorithm
- Visual: Venn diagram or overlap visualization
- Store results in `assessmentStore`

**Dependencies**: Story 2.4

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 2.6: Temporal Decision Synchrony - Rapid-Fire Scenarios
**As a** user playing the decision game
**I want** to make quick decisions on various scenarios
**So that** my decision patterns under pressure can be analyzed

**Acceptance Criteria:**
- Present 20-25 decision scenarios one at a time
- 5-second timer per decision
- Binary or multiple choice options
- Record decision and response time
- Track decision changes if user switches choice
- Pressure increases as timer runs down (visual feedback)

**Technical Notes:**
- Files: `src/screens/games/TemporalDecisionGame.tsx`
- Scenarios: Moral dilemmas, practical choices, risk scenarios
- Data storage: [{scenario: string, choice: number, responseTime: number}]
- Use countdown timer with visual urgency cues

**Dependencies**: Story 2.1

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 2.7: Temporal Decision Synchrony - Value Alignment Analysis
**As a** user who completed the decision game
**I want** to see how my values and stress responses align with my twin
**So that** I understand our decision-making synchronicity

**Acceptance Criteria:**
- Calculate value alignment percentage
- Analyze risk tolerance similarities
- Measure stress response patterns (speed changes)
- Generate insights (e.g., "You both become 40% more pragmatic under pressure")
- Visualize decision alignment across categories

**Technical Notes:**
- Files: `src/services/games/decisionAnalysis.ts`, `src/screens/games/DecisionResults.tsx`
- Categories: Risk, Ethics, Practicality, Emotion-driven
- Analysis: Compare choice overlap and response time patterns
- Visual: Category-based alignment charts

**Dependencies**: Story 2.6

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 2.8: Iconic Duo Quiz - Personality Assessment
**As a** user taking the duo quiz
**I want** to answer personality questions about myself and my twin
**So that** I can discover which iconic duo we resemble

**Acceptance Criteria:**
- Present 15-20 personality questions
- Questions cover: relationship style, communication, humor, conflict resolution
- Multiple choice answers (4-5 options per question)
- Answer both "for yourself" and "for your twin"
- Track self-perception vs twin-perception differences
- Fun, engaging copy and visuals

**Technical Notes:**
- Files: `src/screens/games/IconicDuoQuiz.tsx`
- Question bank with iconic duo mapping logic
- Possible duos: Fred & George Weasley, Mario & Luigi, etc.
- Store: [{question: string, selfAnswer: number, twinAnswer: number}]

**Dependencies**: Story 2.1

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 2.9: Iconic Duo Quiz - Result Matching and Display
**As a** user who completed the duo quiz
**I want** to see which iconic duo we are and why
**So that** I get a fun, shareable result about our relationship

**Acceptance Criteria:**
- Match answers to iconic duo archetypes
- Display matched duo with image/description
- Show key traits that led to the match
- Compare self vs twin perception differences
- Shareable result card for social media
- Store result in assessment history

**Technical Notes:**
- Files: `src/services/games/duoMatching.ts`, `src/screens/games/DuoResults.tsx`
- Matching algorithm: Weighted scoring per duo type
- Duo database: 8-10 famous twin/duo pairs with trait profiles
- Visual: Result card with duo image and description

**Dependencies**: Story 2.8

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 2.10: Game Results History and Comparison Dashboard
**As a** paired user
**I want** to view all my game results in one place
**So that** I can track our synchronicity over time

**Acceptance Criteria:**
- Display all completed games with dates
- Show synchronicity scores for each game
- Visualize trends over multiple play sessions
- Compare current vs previous results
- Access detailed insights for each game
- Filter by game type or date range

**Technical Notes:**
- Files: `src/screens/games/ResultsDashboard.tsx`, `src/state/assessmentStore.ts`
- Integration with `assessmentStore` for historical data
- Charts: Line graphs for trends, bar charts for comparisons
- Use React Native Chart library

**Dependencies**: Stories 2.3, 2.5, 2.7, 2.9

**Estimated Effort**: Medium (6-7 hours)

---

## Epic 2 Summary
- **Total Stories**: 10
- **Parallel Opportunities**: All game development (2.2-2.9) can run in parallel after 2.1 is complete
- **Critical Path**: 2.1 → [Games in parallel] → 2.10
- **Estimated Total Effort**: 5-7 days for single developer, 2-3 days with parallel development

---

## Epic 3: Twintuition Real-Time System

**Epic Goal**: Enable twins to send real-time connection alerts when thinking of each other, with emotion recognition and pattern tracking.

**Business Value**: Twintuition creates magical moments of connection and drives daily engagement. It's the feature that keeps users opening the app throughout the day.

**Dependencies**: Epic 1 (twin pairing required), Epic 7 (real-time infrastructure)

### Stories

#### Story 3.1: Twintuition Alert Types and UI
**As a** paired user
**I want** to send different types of Twintuition alerts to my twin
**So that** I can share what I'm experiencing in the moment

**Acceptance Criteria:**
- Three alert types: Feeling, Thought, Action
- Quick-send interface with one-tap buttons
- Visual design for each alert type (icons, colors)
- Haptic feedback on send
- Confirmation animation when sent
- Navigate from any screen via quick-access button

**Technical Notes:**
- Files: `src/screens/TwintuitionScreen.tsx`, `src/components/TwintuitionQuickSend.tsx`
- Alert types stored in `twintuitionStore`
- Quick-access floating button on main screens
- Use React Native Reanimated for animations

**Dependencies**: Epic 1 completion

**Estimated Effort**: Small (3-4 hours)

---

#### Story 3.2: Send Twintuition Alert as notification to Twin
**As a** user sending a Twintuition alert
**I want** to alert my twin that i'm thinking of them in the moment
**So that** my twin knows i'm thinking of them

**Acceptance Criteria:**
- Select primary emotion from 8 options (joy, sadness, anger, etc.)
- Optional emotion intensity slider (1-10)
- Optional short message (max 100 characters)
- Preview before sending
- Store emotion metadata with alert
- Send alert to twin's device

**Technical Notes:**
- Files: `src/services/twintuitionService.ts`, `src/state/twintuitionStore.ts`
- Emotion palette: Same 8 emotions from game
- Store: {type, emotion, intensity, message, timestamp}
- Integration with mock WebSocket for now

**Dependencies**: Story 3.1

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 3.3: Receive and Display Twintuition Alerts
**As a** user receiving a Twintuition alert
**I want** to see my twin's alert immediately
**So that** I feel connected in real-time

**Acceptance Criteria:**
- Push notification for incoming alert
- In-app banner notification
- Alert displays: type, emotion, timestamp, optional message
- Mark alert as "seen"
- Quick-reply option
- Store alert history

**Technical Notes:**
- Files: `src/components/TwintuitionNotification.tsx`, `src/state/twintuitionStore.ts`
- Mock push notifications for development
- Real-time listener on twintuition store
- Auto-dismiss after 10 seconds or user interaction

**Dependencies**: Story 3.2

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 3.4: Twintuition Alert History and Timeline
**As a** paired user
**I want** to view all past Twintuition alerts
**So that** I can see our connection patterns over time

**Acceptance Criteria:**
- Chronological list of all sent/received alerts
- Filter by type (Feeling/Thought/Action)
- Filter by date range
- Display emotion and message for each
- Visual indicator of simultaneous alerts (within 5 min)
- Infinite scroll for older alerts

**Technical Notes:**
- Files: `src/screens/TwintuitionHistory.tsx`, `src/state/twintuitionStore.ts`
- Load alerts from AsyncStorage
- Grouping logic for simultaneous alerts
- Use FlatList with pagination

**Dependencies**: Story 3.3

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 3.5: Simultaneous Alert Detection and Celebration
**As a** paired user
**I want** to be notified when we both sent alerts at the same time
**So that** I can celebrate our synchronicity

**Acceptance Criteria:**
- Detect alerts sent within 5 minutes of each other
- Special celebration animation/sound
- "Synchronicity Moment" badge on timeline
- Track synchronicity score over time
- Display synchronicity statistics

**Technical Notes:**
- Files: `src/services/twintuitionService.ts`, `src/components/SynchronicityMoment.tsx`
- Time window: 5 minutes (configurable)
- Special animation: Particle effects or cosmic theme
- Store synchronicity events separately
- Calculate synchronicity rate

**Dependencies**: Story 3.4

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 3.6: Twintuition Pattern Analysis Dashboard
**As a** paired user
**I want** to see patterns in when and how we send alerts
**So that** I can understand our connection rhythms

**Acceptance Criteria:**
- Heatmap of alert frequency by time of day
- Most common emotion types chart
- Average response time
- Synchronicity score trend
- Weekly/monthly pattern comparison

**Technical Notes:**
- Files: `src/screens/TwintuitionInsights.tsx`
- Data aggregation from alert history
- Charts: Heatmap, pie chart, line graph
- Use React Native Chart Kit or Victory Native
- Calculate metrics: avg response time, peak hours, emotion distribution

**Dependencies**: Story 3.5

**Estimated Effort**: Medium (6-7 hours)

---

## Epic 3 Summary
- **Total Stories**: 6
- **Parallel Opportunities**: Stories 3.5 and 3.6 can be developed in parallel with 3.4
- **Critical Path**: 3.1 → 3.2 → 3.3 → 3.4
- **Estimated Total Effort**: 3-4 days for single developer

---

## Epic 4: Twincidences

**Epic Goal**: Create an automated and manual synchronicity logging system where twins can view, track, and celebrate moments of connection through both AI-detected patterns and user-documented experiences.

**Business Value**: The Twincidences feature is the core differentiator of Twinship, transforming abstract twin connection into quantifiable data. By automatically detecting synchronicities that twins might not notice on their own, the app provides unique value that keeps users engaged daily. Manual logging capabilities ensure twins can document subjective experiences while automated detection reveals hidden patterns, creating a comprehensive view of twin connection that drives retention and research value.

**Dependencies**: Epic 1 (twin pairing required), Epic 2 (Twintuition button for automatic logging), Epic 7 (data sync for real-time detection)

**Migration Note**: This epic replaces the previous "Story Vault" feature. Existing story data should be migrated to twincidence format where applicable, or archived for user export.

---

### Stories

#### Story 4.1: Core Twincidences Data Model & Storage
**As a** developer
**I want** a robust data model for twincidences
**So that** both automated and manual entries can be consistently stored and queried

**Acceptance Criteria:**
- Define TypeScript interfaces for twincidence types
- Implement AsyncStorage schema for twincidences
- Support both automated and manual entry types
- Store metadata: timestamp, category, detection method, twin participation
- Unique ID generation for each twincidence
- Version the schema for future updates
- Implement data migration from old Story Vault if exists

**Twincidence Data Structure:**
```typescript
interface Twincidence {
  id: string;
  timestamp: Date;
  category: TwincidenceCategory;
  detectionType: 'automatic' | 'manual';
  title: string;
  description?: string;
  metadata: {
    twin1Data?: any;
    twin2Data?: any;
    confidenceScore?: number; // for automated detection
    biometricData?: BiometricSyncData;
    locationData?: LocationData;
  };
  media?: {
    photos?: string[];
    videos?: string[];
    voiceNotes?: string[];
  };
  tags: string[];
  isSharedWithResearch: boolean;
  createdBy?: string; // twin ID for manual entries
  editedAt?: Date;
  editedBy?: string;
}

enum TwincidenceCategory {
  TWINTUITION_SYNC = 'twintuition_sync',
  BIOMETRIC_SYNC = 'biometric_sync',
  LOCATION_COINCIDENCE = 'location_coincidence',
  DIGITAL_BEHAVIOR = 'digital_behavior',
  COMMUNICATION_PATTERN = 'communication_pattern',
  MANUAL_ESP = 'manual_esp',
  MANUAL_DREAM = 'manual_dream',
  MANUAL_TWIN_TALK = 'manual_twin_talk',
  MANUAL_OTHER = 'manual_other'
}
```

**Technical Notes:**
- Files: `src/models/Twincidence.ts`, `src/state/twincidencesStore.ts`, `src/services/storage/twincidenceStorage.ts`
- Use Zustand for state management
- AsyncStorage for persistence with JSON serialization
- Implement CRUD operations: create, read, update, delete, query
- Index by timestamp and category for efficient querying

**Dependencies**: None (foundation story)

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 4.2: Twincidences Timeline View
**As a** paired user
**I want** to view all twincidences in a chronological timeline
**So that** I can see our connection patterns over time

**Acceptance Criteria:**
- Main Twincidences screen with tab navigation
- Timeline tab showing reverse chronological feed (newest first)
- Twincidence cards display: icon, category, timestamp, title, excerpt
- Visual distinction between automated and manual entries
- Different icons/colors for each category
- Tap card to view full details
- Infinite scroll for older twincidences
- Month/year section headers
- Pull-to-refresh for new detections
- Empty state with encouragement to enable features or add manual entry

**Technical Notes:**
- Files: `src/screens/twincidences/TwincidencesScreen.tsx`, `src/components/twincidences/TwincidenceCard.tsx`
- Use FlatList with optimized rendering (getItemLayout)
- Load from `twincidencesStore` with pagination (load 20 at a time)
- Section headers: Group by month using `sectionListGetItemLayout`
- Category icons: Use lucide-react-native icon set
- Loading states and error handling

**Dependencies**: Story 4.1

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 4.3: Manual Twincidence Creation
**As a** paired user
**I want** to manually create and edit twincidences
**So that** I can document moments the app didn't automatically detect

**Acceptance Criteria:**
- Floating action button (FAB) on Twincidences screen
- Create new twincidence modal/screen
- Select category from predefined list (ESP, Dream, Twin-Talk, Other)
- Title field (required, max 100 characters)
- Description field (optional, rich text, max 2000 characters)
- Add photos (up to 10) from camera or gallery
- Add videos (up to 3, max 60 seconds each)
- Record voice note (max 3 minutes)
- Date/time picker (defaults to now, can edit for past events)
- Custom tags input (comma-separated)
- Save as draft or publish immediately
- Edit existing manual twincidences
- Delete twincidences (with confirmation)

**Technical Notes:**
- Files: `src/screens/twincidences/CreateTwincidenceScreen.tsx`, `src/components/twincidences/MediaPicker.tsx`
- Use React Native Image Picker for photos/videos
- Use Expo AV for voice recording
- Rich text: Basic markdown support or simple formatting toolbar
- Draft storage: Separate AsyncStorage key for drafts
- Validation: Ensure required fields before saving

**Dependencies**: Story 4.1

**Estimated Effort**: Large (8-9 hours)

---

#### Story 4.4: Twincidence Detail View
**As a** paired user
**I want** to view full details of any twincidence
**So that** I can see all associated data and context

**Acceptance Criteria:**
- Full-screen detail view for selected twincidence
- Show all metadata: category, timestamp, detection type
- Display full description with formatting
- Photo gallery (swipeable)
- Video playback inline
- Voice note playback with waveform visualization
- For automated detections: show confidence score and what was detected
- For biometric sync: display graphs/charts of synchronized data
- Show both twins' data when available
- Share button (export as image or text)
- Edit button (manual entries only)
- Delete button (manual entries only, with confirmation)

**Technical Notes:**
- Files: `src/screens/twincidences/TwincidenceDetailScreen.tsx`, `src/components/twincidences/BiometricChart.tsx`
- Use React Native Video for video playback
- Use react-native-chart-kit for biometric visualization
- Image gallery: react-native-image-viewing for full-screen swipe
- Audio: Expo AV with custom waveform using react-native-svg
- Share: react-native-share with formatted text or screenshot

**Dependencies**: Story 4.2, Story 4.3

**Estimated Effort**: Large (8-9 hours)

---

#### Story 4.5: Automatic Twintuition Sync Detection
**As the** system
**I want** to detect when both twins press the Twintuition button simultaneously
**So that** mutual synchronicity can be automatically logged

**Acceptance Criteria:**
- Listen for Twintuition button presses from both twins
- Define "simultaneous" as within 30 seconds of each other
- Create twincidence entry automatically when detected
- Include both press timestamps in metadata
- Calculate time delta between presses
- Display special "mutual twintuition" badge in timeline
- Send push notification to both twins when detected
- Higher confidence score for closer time deltas (<5 seconds)

**Technical Notes:**
- Files: `src/services/detection/twintuitionDetection.ts`, `src/services/notifications/twincidenceNotifications.ts`
- Hook into existing Twintuition button service
- Real-time sync required: Use Firebase Realtime Database for button press events
- Algorithm: Compare timestamps, create twincidence if Δt < 30s
- Confidence score: `confidence = 1 - (deltaSeconds / 30)`
- Store both twins' timestamps in metadata

**Dependencies**: Epic 2 (Twintuition button), Story 4.1, Epic 7 (real-time sync)

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 4.6: Privacy & Permissions Management
**As a** paired user
**I want** to control what types of twincidences are automatically detected
**So that** I maintain privacy and only enable features I'm comfortable with

**Acceptance Criteria:**
- Privacy settings screen within Twincidences section
- Toggle switches for each detection category
- Clear explanations of what each category tracks
- Examples of what will be logged
- Battery impact indicators for background features
- One-tap "Enable All" and "Disable All" buttons
- Granular controls: Location (never/while using/always), HealthKit, etc.
- Show current permission status (granted/denied/not requested)
- Link to iOS Settings for app permissions
- Confirmation dialog before enabling sensitive features
- Annual consent review reminder

**Technical Notes:**
- Files: `src/screens/settings/TwincidencePrivacyScreen.tsx`, `src/services/permissions/permissionManager.ts`
- Store permission preferences in AsyncStorage
- Integration with iOS permission APIs (HealthKit, Location, etc.)
- Check actual device permissions vs app preferences
- Handle permission denial gracefully with explanation
- Use expo-permissions for permission requests

**Dependencies**: Story 4.1

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 4.7: HealthKit Integration for Biometric Sync Detection
**As the** system
**I want** to access HealthKit data (heart rate, sleep, activity)
**So that** biometric synchronizations can be automatically detected

**Acceptance Criteria:**
- Request HealthKit permission during onboarding (optional)
- Access heart rate data from both twins
- Detect simultaneous heart rate spikes (>20 bpm increase within 5 min window)
- Access sleep data: start/end times, sleep stages
- Detect synchronized sleep patterns (within 30 min window)
- Access activity data: steps, workouts
- Detect simultaneous workout starts (same workout type within 15 min)
- Create twincidence entry for detected synchronizations
- Include biometric charts in twincidence detail view
- Process data on-device for privacy
- Configurable sensitivity thresholds in settings
- Battery optimization: Check data every 15-30 minutes

**Technical Notes:**
- Files: `src/services/detection/biometricDetection.ts`, `src/services/healthkit/healthKitService.ts`
- Use react-native-health or expo-health-connect for HealthKit access
- Background tasks: Use expo-task-manager for periodic checks
- Data processing: Compare both twins' data in sliding time windows
- Thresholds: Heart rate spike >20 bpm, sleep within 30 min, workouts within 15 min
- Privacy: Don't transmit raw health data; only sync events
- Store sync events with anonymized aggregates if shared with research

**iOS Compliance:**
- HealthKit usage description in Info.plist clearly states research purpose
- No selling or sharing of health data with third parties
- User can revoke permission anytime
- Data deleted if user deletes account

**Dependencies**: Story 4.1, Story 4.6, Epic 7 (sync mechanism)

**Estimated Effort**: Large (10-12 hours)

---

#### Story 4.8: Location-Based Coincidence Detection
**As the** system
**I want** to track location patterns
**So that** location coincidences can be automatically detected

**Acceptance Criteria:**
- Request location permission (always) with clear justification
- Track significant location visits (using iOS significant location change API)
- Detect when both twins visit same place (within 100m radius)
- Time windows: simultaneous (within 4 hours) or sequential (different days)
- Create twincidence for both simultaneous and sequential visits
- Privacy: Store only place categories (restaurant, gym, etc.), not exact addresses
- Battery optimization: Use significant location API, not continuous tracking
- Proximity alerts: Notify twins if they're near each other
- Visited places log (opt-in): See where twin has been (with twin's consent)

**Technical Notes:**
- Files: `src/services/detection/locationDetection.ts`, `src/services/location/locationService.ts`
- Use expo-location with background location permissions
- Geofencing: Create geofences around significant locations
- Place identification: Use reverse geocoding to get place type
- Compare locations: Haversine formula for distance calculation
- Store: { placeType, latitude, longitude, timestamp, twin_id }
- Privacy: Hash exact coordinates, store only place categories for twincidences

**iOS Compliance:**
- Location usage description clearly explains twin synchronicity detection
- User can choose: never, while using, or always
- Show blue location bar when tracking in background
- Provide value: Show twincidences detected to justify "always" permission

**Dependencies**: Story 4.1, Story 4.6

**Estimated Effort**: Large (9-10 hours)

---

#### Story 4.9: Insights and Analytics Dashboard
**As a** paired user
**I want** to see patterns and insights from our twincidences
**So that** I can understand our connection better

**Acceptance Criteria:**
- Analytics tab within Twincidences screen
- Total twincidence count with trend (up/down from last period)
- Category breakdown pie chart
- Heatmap: Days with most twincidences
- Time-of-day patterns: When synchronicities occur most
- Synchronicity score over time (line chart)
- Most common categories
- Longest streak of daily twincidences
- Comparison: Manual vs automated detection ratio
- Monthly/yearly summary reports
- Export analytics as PDF

**Technical Notes:**
- Files: `src/screens/twincidences/AnalyticsScreen.tsx`, `src/services/analytics/twincidenceAnalytics.ts`
- Use react-native-chart-kit for visualizations
- Compute statistics on-device from local data
- Cache computed stats to avoid recalculation
- Date range filters: Last week, month, year, all time
- PDF export: Use react-native-html-to-pdf

**Dependencies**: Story 4.2 (need data to analyze)

**Estimated Effort**: Large (8-9 hours)

---

#### Story 4.10: Search and Filter Functionality
**As a** paired user
**I want** to search and filter twincidences
**So that** I can find specific moments easily

**Acceptance Criteria:**
- Search bar at top of timeline
- Search by: title, description, tags
- Filter by: category, date range, detection type
- Multiple filters can be combined
- Results update in real-time as typing
- Show result count
- Clear filters button
- Save custom filters (e.g., "All manual dreams")
- Sort options: Newest first, oldest first, most recent edited

**Technical Notes:**
- Files: `src/components/twincidences/SearchBar.tsx`, `src/components/twincidences/FilterModal.tsx`
- Use local state for search/filter parameters
- Filter algorithm: Array.filter() with multiple predicates
- Debounce search input (300ms) to avoid excessive filtering
- Store saved filters in AsyncStorage

**Dependencies**: Story 4.2

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 4.11: Collaborative Editing and Annotation
**As a** paired user
**I want** to add my perspective to any twincidence
**So that** both twins can contribute to the memory

**Acceptance Criteria:**
- Both twins can edit any twincidence (manual or auto-detected)
- Add comments/annotations without overwriting original
- Show who added what content (color-coded or labeled)
- Edit history tracking with timestamps
- Notification when twin adds to a twincidence
- Lock mechanism to prevent simultaneous edits
- Merge conflict resolution: Last write wins with conflict notification

**Technical Notes:**
- Files: `src/screens/twincidences/EditTwincidenceScreen.tsx`, `src/services/collaboration/twincidenceCollaboration.ts`
- Store edit metadata: `{ editedBy: twinId, editedAt: timestamp, changes: [] }`
- Version history: Store previous versions in array
- Real-time sync: Use Firebase for live edit indicators
- Annotations stored separately from original content
- Display: Original content + annotations in different visual style

**Dependencies**: Story 4.3, Story 4.4, Epic 7 (real-time sync)

**Estimated Effort**: Large (8-9 hours)

---

#### Story 4.12: Twincidence Sharing and Export
**As a** paired user
**I want** to share twincidences outside the app
**So that** I can show friends and family our connection

**Acceptance Criteria:**
- Share individual twincidence as image or text
- Generate beautiful card design for sharing
- Include: Category icon, title, timestamp, key details
- Exclude sensitive data: biometric values, exact locations
- Share to: Social media, messaging apps, email
- Export all twincidences as JSON or CSV
- Export filtered twincidences (e.g., only manual entries)
- Generate monthly/yearly summary image for social sharing

**Technical Notes:**
- Files: `src/components/twincidences/ShareCard.tsx`, `src/services/export/twincidenceExport.ts`
- Use react-native-view-shot to capture card as image
- Use react-native-share for sharing functionality
- Card design: Use galaxy theme, include both twins' avatars
- CSV export: Include all metadata fields
- JSON export: Full data structure for backup

**Dependencies**: Story 4.4

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 4.13: Migration from Story Vault (If Applicable)
**As a** developer
**I want** to migrate existing Story Vault data to Twincidences
**So that** users don't lose their previous content

**Acceptance Criteria:**
- Detect if Story Vault data exists in AsyncStorage
- Convert stories to manual twincidence format
- Map story metadata to twincidence schema
- Preserve: photos, text, timestamps, authors
- Set category as "MANUAL_OTHER" by default
- Allow users to recategorize migrated content
- Archive original story data for user export
- Show migration progress dialog
- Handle migration errors gracefully

**Technical Notes:**
- Files: `src/services/migration/storyVaultMigration.ts`
- Run migration on app startup (check flag in AsyncStorage)
- One-time process: Set migration complete flag after success
- Transformation: Story → Twincidence mapping function
- Preserve IDs where possible to maintain references
- Log migration results for debugging

**Dependencies**: Story 4.1, Story 4.3

**Estimated Effort**: Medium (5-6 hours)

---

## Epic 4 Summary
- **Total Stories**: 13
- **Parallel Opportunities**: 
  - Stories 4.6, 4.7, 4.8 (detection features) can be developed in parallel after 4.1, 4.5
  - Stories 4.9, 4.10, 4.11, 4.12 (enhancement features) can be developed in parallel after 4.2, 4.3, 4.4
- **Critical Path**: 4.1 → 4.2 → 4.3 → 4.4 (foundational UI)
- **Detection Path**: 4.1 → 4.5 → 4.6 → 4.7, 4.8 (automated features)
- **Estimated Total Effort**: 12-15 days for single developer, 6-8 days with two developers working in parallel

---

## Privacy & Compliance Checklist

Before submitting to App Store, ensure:
- [ ] All permission requests have clear, benefit-focused descriptions
- [ ] Privacy Nutrition Labels accurately reflect data collection
- [ ] HealthKit data use complies with medical/research guidelines
- [ ] Location "always" permission justified with clear user value
- [ ] Users can easily revoke any permission
- [ ] No third-party data sharing without explicit consent
- [ ] Annual privacy consent review implemented
- [ ] Data deletion on account removal
- [ ] Transparent data usage policy in app and privacy policy

---

## Future Enhancements (Post-MVP)

### Phase 2 Detection Features
- **Photo/Image Analysis**: Detect similar clothing, environments using on-device ML
- **Music Listening Patterns**: Integrate with Spotify/Apple Music APIs
- **App Usage Patterns**: Detect similar app usage (requires Screen Time API permissions)
- **Weather-Mood Correlation**: Track mood changes with weather patterns
- **Dream Journal Integration**: Analyze dream similarity using NLP
- **Voice Pattern Analysis**: Detect similar speech patterns or accents (ethical considerations required)
- **Predictive Detection**: ML model to predict future synchronicities

### Phase 2 UI/UX Enhancements
- **AR Visualization**: View twincidence timeline in augmented reality
- **Voice Commands**: "Hey Twinship, log a twincidence"
- **Widget**: iOS home screen widget showing latest twincidence
- **Watch App**: Apple Watch complications for quick logging
- **Desktop Web View**: View analytics on larger screen

### Research Integration
- Contribute anonymized twincidence patterns to twin research
- Receive personalized reports comparing to twin population data
- Opt-in for specific research studies
- Citations when research uses app data

## Epic 5: Research & Analytics Infrastructure

**Epic Goal**: Enable optional research participation with data contribution tracking, consent management, and insights dashboard.

**Business Value**: Positions Twinship as scientifically credible, creates research partnerships, and provides users with insights from broader twin population data.

**Dependencies**: Epic 1 (twin pairing), Epic 2 (game data to contribute)

### Stories

#### Story 5.1: Research Consent and Opt-In Flow
**As a** paired user
**I want** to choose whether to participate in research
**So that** I control how my data is used

**Acceptance Criteria:**
- Clear explanation of research participation
- Explicit consent checkbox with details
- Option to opt-in or decline
- Ability to change decision later in settings
- Store consent status with timestamp
- Different consent levels (anonymous, identifiable, etc.)

**Technical Notes:**
- Files: `src/screens/research/ConsentScreen.tsx`, `src/state/researchStore.ts`
- Consent levels: None, Anonymous, Aggregate, Full
- Store: {consentLevel, consentDate, lastUpdated}
- Display privacy policy and data usage terms

**Dependencies**: Epic 1 completion

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 5.2: Research Data Contribution Tracking
**As a** research participant
**I want** to see what data I've contributed
**So that** I understand my research impact

**Acceptance Criteria:**
- Dashboard showing contributed data types
- Count of game sessions contributed
- Anonymization indicator
- Data contribution timeline
- Pause/resume contribution option
- Export personal data (GDPR compliance)

**Technical Notes:**
- Files: `src/screens/research/ContributionDashboard.tsx`, `src/services/researchService.ts`
- Track: {gameType, sessionCount, dataPoints, timestamp}
- Store contribution metadata in `researchStore`
- GDPR export: JSON format with all personal data

**Dependencies**: Story 5.1

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 5.3: Anonymized Data Submission Pipeline
**As a** system
**I want** to anonymize and submit research data
**So that** user privacy is protected

**Acceptance Criteria:**
- Strip all personally identifiable information
- Generate anonymous user IDs
- Batch data submissions (not real-time)
- Encrypt data before transmission
- Store submission logs
- Retry failed submissions

**Technical Notes:**
- Files: `src/services/research/dataAnonymization.ts`, `src/services/research/submission.ts`
- Anonymization: Remove names, emails, photos
- Anonymous ID: Hash of twin pair ID
- Submission: HTTPS POST to research API endpoint
- Queue failed submissions for retry

**Dependencies**: Story 5.2

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 5.4: Population Insights Dashboard
**As a** research participant
**I want** to see insights from broader twin population
**So that** I can compare our connection to others

**Acceptance Criteria:**
- Display aggregate statistics from all participants
- Compare personal scores to population averages
- Show percentile rankings
- Interesting population-level findings
- Updated monthly with new data
- Filter by twin type (identical vs fraternal)

**Technical Notes:**
- Files: `src/screens/research/PopulationInsights.tsx`
- API endpoint for population stats (mock for MVP)
- Metrics: Avg synchronicity, emotion overlap, decision alignment
- Charts: Bell curves, percentile indicators
- Cache population data (refresh weekly)

**Dependencies**: Story 5.3, backend API

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 5.5: Research Contribution Leaderboard (Optional)
**As a** competitive research participant
**I want** to see my rank among contributors
**So that** I feel motivated to contribute more

**Acceptance Criteria:**
- Anonymous leaderboard of top contributors
- Contribution score based on data points
- Weekly/monthly/all-time rankings
- Badges for milestones (100 games, 1000 data points)
- Opt-in to appear on leaderboard
- Privacy-preserving (no personal info)

**Technical Notes:**
- Files: `src/screens/research/Leaderboard.tsx`, `src/services/researchService.ts`
- Score calculation: Games + days active + data completeness
- Badges: Achievement system with icons
- Display: Anonymous usernames or "Twin Pair #1234"
- Opt-in flag in research settings

**Dependencies**: Story 5.2

**Estimated Effort**: Medium (5-6 hours)

---

## Epic 5 Summary
- **Total Stories**: 5
- **Parallel Opportunities**: Stories 5.4 and 5.5 can be developed in parallel with 5.3
- **Critical Path**: 5.1 → 5.2 → 5.3
- **Estimated Total Effort**: 3-4 days for single developer

---

## Epic 6: Galaxy Visual Design System

**Epic Goal**: Implement a cohesive cosmic-themed UI with neon accents, smooth animations, haptics, and responsive design components.

**Business Value**: A distinctive, beautiful design creates brand recognition and enhances user experience, making the app feel premium and polished.

**Dependencies**: None (can be developed in parallel with other epics)

### Stories

#### Story 6.1: Galaxy Theme Color System and Variables
**As a** developer
**I want** a centralized color system
**So that** the app has consistent theming

**Acceptance Criteria:**
- Define 8 galaxy-themed accent colors
- Create color variables/constants file
- Dark theme base colors (backgrounds, text)
- Gradient definitions for cosmic effects
- Accessibility compliance (WCAG AA)
- Export for use across all screens

**Technical Notes:**
- Files: `src/theme/colors.ts`, `src/theme/gradients.ts`
- Colors: Cosmic Blue, Nebula Purple, Stardust Pink, Galaxy Gold, etc.
- Use HSL for programmatic color variations
- NativeWind integration with custom colors
- Test color contrast ratios

**Dependencies**: None

**Estimated Effort**: Small (2-3 hours)

---

#### Story 6.2: Galaxy Background Component
**As a** user
**I want** a consistent cosmic background across all screens
**So that** the app feels cohesive

**Acceptance Criteria:**
- Reusable galaxy background component
- Animated stars/particles (subtle)
- Performance-optimized rendering
- Works with scrollable content
- Configurable intensity (subtle, normal, vibrant)
- Use existing `galaxybackground.png` asset

**Technical Notes:**
- Files: `src/components/common/GalaxyBackground.tsx`
- Use existing `assets/galaxybackground.png`
- Optional: Add subtle parallax effect
- Ensure no performance impact on scrolling
- Memoize component for efficiency

**Dependencies**: Story 6.1

**Estimated Effort**: Small (3-4 hours)

---

#### Story 6.3: Neon Glow Button Component
**As a** user
**I want** interactive buttons with neon glow effects
**So that** the UI feels magical and responsive

**Acceptance Criteria:**
- Neon-styled button component
- Glow effect intensifies on press
- Haptic feedback on tap
- Support different sizes and variants
- Loading state with animation
- Disabled state with reduced opacity

**Technical Notes:**
- Files: `src/components/common/NeonButton.tsx`
- Use shadow/glow CSS effects
- React Native Reanimated for press animation
- Haptics: Expo Haptics feedback
- Variants: Primary, secondary, outline, text

**Dependencies**: Story 6.1

**Estimated Effort**: Small (3-4 hours)

---

#### Story 6.4: Cosmic Card Component
**As a** developer
**I want** a reusable card component with galaxy styling
**So that** content is consistently presented

**Acceptance Criteria:**
- Translucent card with subtle glow border
- Backdrop blur effect
- Support for header, content, footer sections
- Pressable variant for navigation
- Shadow/elevation levels
- Nested card support

**Technical Notes:**
- Files: `src/components/common/CosmicCard.tsx`
- Use React Native's blur component
- Border: Gradient outline or neon accent
- Support children components
- Elevation: 1-3 levels with shadow intensity

**Dependencies**: Story 6.1

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 6.5: Smooth Page Transitions and Animations
**As a** user
**I want** smooth transitions between screens
**So that** navigation feels fluid

**Acceptance Criteria:**
- Custom screen transition animations
- Fade, slide, and scale effects
- Shared element transitions for images
- Respect system animation preferences
- 60 FPS performance target
- Configurable animation duration

**Technical Notes:**
- Files: `src/navigation/transitions.ts`
- React Navigation custom transitions
- React Native Reanimated for performance
- Test on low-end devices
- Default: 300ms slide transition

**Dependencies**: Story 6.1

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 6.6: Loading States and Skeleton Screens
**As a** user
**I want** to see elegant loading states
**So that** wait times feel shorter

**Acceptance Criteria:**
- Shimmer effect for loading content
- Skeleton screens matching content layout
- Cosmic-themed loading spinner
- Timeout handling (show error after 10s)
- Smooth transition from skeleton to content
- Reusable skeleton components

**Technical Notes:**
- Files: `src/components/common/SkeletonLoader.tsx`, `src/components/common/CosmicSpinner.tsx`
- Shimmer: Animated gradient sweep
- Spinner: Rotating galaxy/star animation
- Use React Native Reanimated for smoothness
- Component library: Card, List, Image skeletons

**Dependencies**: Story 6.1

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 6.7: Haptic Feedback System
**As a** user
**I want** tactile feedback for interactions
**So that** the app feels responsive

**Acceptance Criteria:**
- Haptic patterns for different interactions
- Light tap for button press
- Medium for success actions
- Heavy for errors/warnings
- Notification for alerts
- System-wide haptic utility

**Technical Notes:**
- Files: `src/utils/haptics.ts`
- Use Expo Haptics Feedback
- Patterns: Light, Medium, Heavy, Success, Warning, Error
- Check device support before triggering
- Respect system haptic settings

**Dependencies**: None

**Estimated Effort**: Small (2-3 hours)

---

## Epic 6 Summary
- **Total Stories**: 7
- **Parallel Opportunities**: All stories can be developed in parallel after 6.1
- **Critical Path**: 6.1 → [All others in parallel]
- **Estimated Total Effort**: 2-3 days for single developer

---

## Epic 7: Data Synchronization & Backend

**Epic Goal**: Implement Firebase/iCloud integration for real-time data sync, encryption, and persistent storage across devices.

**Business Value**: Real-time sync enables true twin collaboration. Without this, twins can't share stories, see each other's game results, or receive instant Twintuition alerts.

**Dependencies**: None (infrastructure epic)

### Stories

#### Story 7.1: Firebase Project Setup and Configuration
**As a** developer
**I want** Firebase integrated into the app
**So that** we have real-time database and authentication

**Acceptance Criteria:**
- Create Firebase project
- Install Firebase SDK dependencies
- Configure for iOS and Android
- Set up Firebase Authentication
- Initialize Firestore database
- Configure security rules
- Add Firebase config to app

**Technical Notes:**
- Files: `firebase.config.ts`, `src/services/firebase/index.ts`
- Use Firebase SDK v10+
- Auth providers: Email/password, phone
- Firestore collections: users, twins, stories, games
- Security rules: User can only access their twin pair data
- Environment variables for API keys

**Dependencies**: None

**Estimated Effort**: Medium (4-5 hours)

---

#### Story 7.2: User Authentication with Firebase
**As a** user
**I want** secure authentication
**So that** my data is protected

**Acceptance Criteria:**
- Email/password registration
- Email verification flow
- Password reset via email
- Phone number authentication (optional)
- Store user auth state
- Auto-logout after inactivity (optional)
- Sync auth state with local stores

**Technical Notes:**
- Files: `src/services/firebase/auth.ts`, `src/state/authStore.ts`
- Firebase Authentication methods
- Link Firebase auth with `twinStore` user profile
- Handle auth state changes
- Secure token storage with expo-secure-store

**Dependencies**: Story 7.1

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 7.3: Firestore Data Models and Schema
**As a** developer
**I want** well-structured data models
**So that** data is organized and queryable

**Acceptance Criteria:**
- Define Firestore collections structure
- User profile document schema
- Twin pair document schema
- Stories collection schema
- Games/assessments collection schema
- Twintuition alerts collection schema
- Indexed fields for efficient queries

**Technical Notes:**
- Files: `src/services/firebase/models.ts`
- Collections: users/{userId}, twinPairs/{pairId}, stories/{storyId}
- Subcollections: games, alerts within pair documents
- Use timestamps for sorting
- Composite indexes for complex queries
- Document size limits: Keep under 1MB

**Dependencies**: Story 7.1

**Estimated Effort**: Small (3-4 hours)

---

#### Story 7.4: Real-Time Story Synchronization
**As a** paired user
**I want** stories to sync in real-time
**So that** I see my twin's edits immediately

**Acceptance Criteria:**
- Create story syncs to Firestore
- Edit story syncs to Firestore
- Delete story syncs to Firestore
- Real-time listener for twin's changes
- Conflict resolution (last-write-wins)
- Offline support with queue
- Optimistic UI updates

**Technical Notes:**
- Files: `src/services/firebase/storiesSync.ts`
- Firestore onSnapshot for real-time updates
- Batch writes for multiple changes
- Handle network errors gracefully
- Update local `storiesStore` from Firestore
- Queue offline writes

**Dependencies**: Stories 7.3, 4.1

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 7.5: Real-Time Twintuition Alert Delivery
**As a** user
**I want** instant Twintuition alerts
**So that** I feel connected in real-time

**Acceptance Criteria:**
- Send alert writes to Firestore
- Real-time listener for incoming alerts
- Push notification trigger
- Alert delivery confirmation
- Handle offline scenarios
- Alert expiration (24 hours)

**Technical Notes:**
- Files: `src/services/firebase/twintuitionSync.ts`
- Firestore collection: twinPairs/{pairId}/alerts
- Cloud Functions for push notifications (Phase 2)
- For MVP: In-app real-time only
- Update `twintuitionStore` from Firestore
- Delete old alerts automatically

**Dependencies**: Stories 7.3, 3.2

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 7.6: Game Results Synchronization
**As a** user
**I want** my game results to sync
**So that** we can compare our twin data

**Acceptance Criteria:**
- Upload game results after completion
- Download twin's results for comparison
- Real-time listener for twin completing games
- Support all game types
- Handle large result datasets
- Offline queue for uploads

**Technical Notes:**
- Files: `src/services/firebase/gamesSync.ts`
- Firestore subcollection: twinPairs/{pairId}/games/{gameId}
- Compress large result data (JSON stringify)
- Index by game type and timestamp
- Update `assessmentStore` from Firestore

**Dependencies**: Stories 7.3, Epic 2

**Estimated Effort**: Medium (5-6 hours)

---

#### Story 7.7: Offline Support and Sync Queue
**As a** user
**I want** the app to work offline
**So that** I'm not blocked by connectivity

**Acceptance Criteria:**
- Queue all writes when offline
- Sync queue when back online
- Visual indicator of sync status
- Retry failed syncs
- Conflict detection on sync
- User notification of sync issues

**Technical Notes:**
- Files: `src/services/firebase/offlineQueue.ts`, `src/state/syncStore.ts`
- Use AsyncStorage for queue persistence
- Network state detection: NetInfo
- Sync status: Syncing, Synced, Failed
- Display sync indicator in header
- Exponential backoff for retries

**Dependencies**: Stories 7.4, 7.5, 7.6

**Estimated Effort**: Medium (6-7 hours)

---

#### Story 7.8: Data Encryption for Sensitive Content
**As a** user
**I want** my personal data encrypted
**So that** my privacy is protected

**Acceptance Criteria:**
- Encrypt stories before upload
- Encrypt personal profile data
- Encrypt chat messages (if implemented)
- Decrypt on retrieval
- Key management with Expo SecureStore
- End-to-end encryption for twin pair

**Technical Notes:**
- Files: `src/services/encryption/encryption.ts`
- Use crypto-js or expo-crypto
- AES-256 encryption
- Key derivation from user credentials
- Store encryption keys securely
- Transparent encryption/decryption layer

**Dependencies**: Story 7.1

**Estimated Effort**: Medium (6-7 hours)

---

## Epic 7 Summary
- **Total Stories**: 8
- **Parallel Opportunities**: Stories 7.4, 7.5, 7.6, 7.8 can be developed in parallel after 7.3
- **Critical Path**: 7.1 → 7.2 → 7.3 → [Sync stories in parallel] → 7.7
- **Estimated Total Effort**: 5-6 days for single developer

---

## Implementation Sequence & Development Phases

### Phase 1 - Foundation (Week 1-2)
**Goal**: Establish core infrastructure and enable basic twin pairing

**Stories (Can start immediately):**
- **Epic 1**: All stories (1.1 → 1.5) - Sequential, critical path
- **Epic 6**: Story 6.1, 6.7 - Design system foundation and haptics
- **Epic 7**: Stories 7.1, 7.2, 7.3 - Backend infrastructure setup

**Parallel Development Opportunities:**
- Team A: Epic 1 (onboarding flow)
- Team B: Epic 6.1 (design system) + Epic 7 (Firebase setup)
- Team C: Epic 6.7 (haptics utility)

**Milestone**: Users can register, pair with twins, and app has design foundation

---

### Phase 2 - Core Features (Week 3-4)
**Goal**: Implement the main value propositions - games and real-time connection

**Stories:**
- **Epic 2**: All game stories (2.1 → 2.10) - Massive parallelization opportunity!
- **Epic 3**: Stories 3.1 → 3.4 - Twintuition core features
- **Epic 6**: Stories 6.2 → 6.6 - UI components and animations
- **Epic 7**: Stories 7.4, 7.5, 7.6 - Real-time sync

**Parallel Development Opportunities:**
- Team A: Epic 2, Stories 2.2-2.3 (Maze game)
- Team B: Epic 2, Stories 2.4-2.5 (Emotion game)
- Team C: Epic 2, Stories 2.6-2.7 (Decision game)
- Team D: Epic 2, Stories 2.8-2.9 (Duo quiz)
- Team E: Epic 3 (Twintuition)
- Team F: Epic 6 (UI components)
- Team G: Epic 7 (Real-time sync)

**Milestone**: Users can play all 4 games, send Twintuition alerts, and data syncs in real-time

---

### Phase 3 - Collaboration & Enrichment (Week 5-6)
**Goal**: Add Story Vault and enhance user engagement

**Stories:**
- **Epic 4**: All stories (4.1 → 4.7) - Story creation and collaboration
- **Epic 3**: Stories 3.5, 3.6 - Advanced Twintuition features
- **Epic 2**: Story 2.10 - Results dashboard
- **Epic 7**: Stories 7.7, 7.8 - Offline support and encryption

**Parallel Development Opportunities:**
- Team A: Epic 4 core (4.1 → 4.3)
- Team B: Epic 4 enhancements (4.4, 4.5, 4.6, 4.7)
- Team C: Epic 3 (pattern analysis)
- Team D: Epic 2.10 + Epic 7.7 (dashboards and offline)

**Milestone**: Twins can create shared stories with multimedia, app works offline

---

### Phase 4 - Research & Polish (Week 7-8)
**Goal**: Add research participation and final polish

**Stories:**
- **Epic 5**: All stories (5.1 → 5.5) - Research infrastructure
- Final testing and bug fixes
- Performance optimization
- App Store preparation

**Parallel Development Opportunities:**
- Team A: Epic 5 (research features)
- Team B: End-to-end testing and bug fixes
- Team C: Performance optimization
- Team D: App Store assets and submission

**Milestone**: MVP ready for App Store submission

---

## Dependency Graph & Critical Paths

### Critical Dependency Chains:

**Chain 1 - User Foundation:**
```
1.1 (Register) → 1.4 (Pair) → All other features
```
*Nothing works without user pairing - this is THE critical path*

**Chain 2 - Backend Infrastructure:**
```
7.1 (Firebase setup) → 7.2 (Auth) → 7.3 (Data models) → 7.4/7.5/7.6 (Sync)
```
*Real-time features depend on this foundation*

**Chain 3 - Design System:**
```
6.1 (Color system) → All UI components
```
*Consistent theming requires colors defined first*

**Chain 4 - Game Foundation:**
```
2.1 (Games hub) → Individual games (2.2-2.9)
```
*Games need the hub for navigation*

### Parallel Development Windows:

**After Epic 1 completion, these can ALL run in parallel:**
- Epic 2 (all 4 games independently)
- Epic 3 (Twintuition)
- Epic 4 (Stories)
- Epic 5 (Research)
- Epic 6 (UI components after 6.1)
- Epic 7 (Sync features after 7.3)

**Maximum Parallelization**: With sufficient team size, **up to 7 agents** can work simultaneously after Phase 1 is complete.

---

## Development Guidance

### Getting Started

**First Steps:**
1. Start with Epic 1 (onboarding) - This is sequential and blocking
2. While Epic 1 is in progress, set up Epic 6.1 (colors) and Epic 7.1-7.3 (Firebase)
3. Once Epic 1 is done, unleash parallel development on all other epics

**Recommended Agent Allocation:**
- **Solo developer**: Follow phases sequentially (8 weeks)
- **Small team (2-3 devs)**: One on Epic 1, others on Epic 6/7 foundation, then parallelize games
- **Full team (5+ devs)**: Epic 1 + 7 foundation, then massively parallel on games and features (4-5 weeks)

### Key Architecture Decisions Needed:

**Before Epic 2 (Games):**
- Game result data structure format
- How to handle game replay/retake scenarios
- Scoring/comparison algorithm approach

**Before Epic 4 (Stories):**
- Media storage solution (Firebase Storage vs S3 vs local)
- Maximum story size limits
- Rich text format (markdown vs HTML vs plain)

**Before Epic 7 (Backend):**
- Firebase vs Supabase vs custom backend decision
- Real-time sync strategy (optimistic vs pessimistic)
- Conflict resolution approach

### Technical Notes:

**Performance Considerations:**
- Games must run at 60 FPS (use React Native Reanimated)
- Story photos should be compressed before upload
- Implement pagination for all lists (games, stories, alerts)
- Use FlatList optimizations for long scrolling lists

**Testing Strategy:**
- Unit tests for all game analysis algorithms
- Integration tests for Firebase sync
- E2E tests for critical user flows (register → pair → play game)
- Manual testing on both iOS and Android
- Test with real twin pairs for UX validation

**Risk Mitigation:**

**Risk 1: Firebase costs escalate**
- *Mitigation*: Implement request batching, cache aggressively, use free tier limits wisely

**Risk 2: Game algorithms too complex**
- *Mitigation*: Start with simple comparison logic, iterate based on user feedback

**Risk 3: Real-time sync conflicts**
- *Mitigation*: Use last-write-wins for MVP, add CRDT in Phase 2 if needed

**Risk 4: Offline support is buggy**
- *Mitigation*: Extensive offline testing, clear UI indicators of sync status

### Success Metrics

**Phase 1 Complete When:**
- ✅ Users can register and pair with twins
- ✅ Design system is implemented
- ✅ Firebase is configured and working

**Phase 2 Complete When:**
- ✅ All 4 games are playable and generate insights
- ✅ Twintuition alerts work in real-time
- ✅ UI feels polished and smooth
- ✅ Data syncs between twin devices

**Phase 3 Complete When:**
- ✅ Twins can create and edit shared stories
- ✅ Multimedia (photos, videos, voice) works
- ✅ App works offline and syncs when back online
- ✅ All major features are integrated

**Phase 4 Complete When:**
- ✅ Research participation is functional
- ✅ All bugs are fixed
- ✅ Performance is optimized
- ✅ App Store submission is ready

---

## Final Summary

### Epic Breakdown Complete! 🎉

**Total Project Stats:**
- **7 Epics**: Onboarding, Games, Twintuition, Stories, Research, Design, Backend
- **50 Total Stories**: All sized for 200k context window agents
- **4 Development Phases**: Foundation → Core → Enrichment → Polish
- **Estimated Timeline**: 8 weeks solo, 4-5 weeks with full team

**Parallel Development Opportunities:**
- **Phase 1**: 3 parallel tracks
- **Phase 2**: Up to 7 parallel tracks (games especially!)
- **Phase 3**: 4 parallel tracks
- **Phase 4**: 4 parallel tracks

**Key Success Factors:**
1. Complete Epic 1 first (critical blocker)
2. Set up Epic 6.1 and Epic 7.1-7.3 early (enables parallelization)
3. Games (Epic 2) have massive parallel potential - distribute to multiple agents
4. Test with real twin pairs early and often
5. Maintain design consistency across all features

**Next Steps:**
1. ✅ Epic breakdown complete - save this file as `/docs/epics.md`
2. Run `sprint-planning` workflow to generate sprint-status.yaml
3. Run `tech-spec` workflow for Epic 1 to create detailed technical context
4. Begin Phase 1 implementation with Story 1.1

**Story Naming Convention:**
- Epic.Story format: `1.1`, `2.3`, `5.2`
- Kebab-case keys in sprint system: `1-1-user-registration`, `2-3-maze-insight-generation`

This epic breakdown provides a clear roadmap for transforming Twinship from PRD to working MVP, with every story carefully sized for autonomous development by limited-context agents. 🚀

