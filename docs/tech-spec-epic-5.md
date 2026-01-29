# Epic Technical Specification: Research & Analytics Infrastructure

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 5
Status: Draft

---

## Overview

Epic 5 implements the research participation infrastructure that enables optional contribution to twin studies while maintaining strict privacy controls and providing valuable population-level insights back to users. This epic establishes Twinship as scientifically credible through transparent data contribution, ethical consent management, and meaningful analytics that compare individual twin pairs to broader population data.

This specification covers the client-side implementation using React Native, Expo, TypeScript, and Zustand state management with local data anonymization and submission queuing. The epic provides consent management, contribution tracking, data anonymization pipelines, population insights dashboard, and optional leaderboard features to encourage research participation.

## Objectives and Scope

**In Scope:**
- Research consent flow with explicit opt-in/opt-out controls
- Granular consent levels (none, anonymous, aggregate, full)
- Data contribution tracking dashboard showing what data was shared
- Anonymization pipeline stripping PII before submission
- Encrypted data transmission to research API endpoints
- Population insights dashboard comparing user to aggregate statistics
- Optional contribution leaderboard with privacy controls
- GDPR-compliant data export functionality
- Pause/resume contribution controls
- Annual consent review reminders

**Out of Scope:**
- Backend research API implementation (separate backend epic)
- Academic research platform integration (Phase 2)
- Advanced statistical analysis (Phase 2 - AI enhancement)
- Research study recruitment (Phase 2)
- DNA/biometric integration (Phase 2)
- Published research reports (Phase 2)
- Real-time population statistics (MVP uses mock/cached data)

**Success Criteria:**
- Research opt-in rate > 40% of paired users
- Users understand what data is being contributed (measured via survey)
- Zero PII leakage in submitted research data
- Population insights update monthly
- Contribution tracking is transparent and accurate
- Users can revoke consent and delete data at any time
- GDPR export completes in under 10 seconds

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Navigation Layer** (`src/navigation/AppNavigator.tsx`):
   - ConsentScreen presented during onboarding (optional)
   - Research section accessible from Settings
   - ContributionDashboard accessible from profile
   - PopulationInsights accessible from games results

2. **State Management** (`src/state/`):
   - `researchStore.ts`: Consent status, contribution tracking, submission logs
   - `telemetryStore.ts`: Analytics and metrics (existing)
   - Integration with `assessmentStore` for game data contribution

3. **Services Layer** (`src/services/research/`):
   - `consentService.ts`: Consent management and tracking
   - `dataAnonymization.ts`: PII stripping and anonymization
   - `submissionService.ts`: Queue and submit research data
   - `populationStatsService.ts`: Fetch and cache population insights

4. **UI Components** (`src/components/research/`):
   - `ConsentCard.tsx`: Consent level selection component
   - `ContributionMetric.tsx`: Displays contribution statistics
   - `PopulationChart.tsx`: Visualizes population comparison
   - `LeaderboardEntry.tsx`: Anonymous leaderboard item

**Design System Integration:**
- Galaxy-themed color palette with neon accents
- NativeWind/Tailwind CSS for consistent styling
- React Native Chart Kit for population insights visualizations
- Expo Haptics for tactile feedback on consent actions

**Existing Patterns:**
- Uses existing `galaxybackground.png` for cosmic aesthetic
- Follows established settings screen patterns
- Integrates with existing game data from Epic 2
- Maintains consistent dashboard layout from Epic 2.10

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `ConsentScreen.tsx` | Research consent opt-in UI | User choices | Consent status | Story 5.1 |
| `consentService.ts` | Manage consent levels and timestamps | Consent actions | Consent state | Story 5.1 |
| `ContributionDashboard.tsx` | Display contributed data overview | Contribution logs | Dashboard UI | Story 5.2 |
| `contributionTracker.ts` | Track what data was contributed | Submission events | Contribution metrics | Story 5.2 |
| `dataAnonymization.ts` | Strip PII from research data | Game sessions, user data | Anonymized payload | Story 5.3 |
| `submissionService.ts` | Queue and submit to research API | Anonymized data | Submission logs | Story 5.3 |
| `PopulationInsights.tsx` | Display aggregate population stats | User results, population data | Comparison UI | Story 5.4 |
| `populationStatsService.ts` | Fetch and cache population statistics | API calls | Population metrics | Story 5.4 |
| `Leaderboard.tsx` | Display contribution rankings | Leaderboard data | Leaderboard UI | Story 5.5 |
| `researchStore.ts` | Persist consent and contribution state | Actions, submissions | Store state | Stories 5.1-5.5 |

**Module Dependencies:**
- All services depend on `zustand` and `AsyncStorage` persistence
- Anonymization depends on crypto utilities for hashing
- Submission service depends on HTTPS client for API calls
- Charts depend on `react-native-chart-kit` for visualizations

### Data Models and Contracts

**ResearchConsent Interface:**
```typescript
interface ResearchConsent {
  userId: string;                    // User who gave consent
  consentLevel: ConsentLevel;
  consentDate: string;               // ISO 8601 timestamp
  lastUpdated: string;               // ISO 8601 timestamp
  policyVersion: string;             // Privacy policy version accepted
  annualReviewDue?: string;          // Next review reminder date
  revokedDate?: string;              // If consent was revoked
}

enum ConsentLevel {
  NONE = 'none',                     // No data contribution
  ANONYMOUS = 'anonymous',           // Fully anonymized data only
  AGGREGATE = 'aggregate',           // Aggregate stats contribution
  FULL = 'full'                      // Identified data (future use)
}
```

**ContributionRecord Interface:**
```typescript
interface ContributionRecord {
  id: string;                        // UUID v4
  userId: string;
  contributionType: ContributionType;
  dataType: 'game_session' | 'assessment' | 'demographic';
  timestamp: string;                 // ISO 8601
  dataPointCount: number;            // Number of data points contributed
  anonymizationMethod: string;       // Hash algorithm used
  submissionStatus: 'pending' | 'submitted' | 'failed';
  submissionId?: string;             // Backend confirmation ID
}

enum ContributionType {
  GAME_MAZE = 'game_maze',
  GAME_EMOTION = 'game_emotion',
  GAME_DECISION = 'game_decision',
  GAME_DUO = 'game_duo',
  DEMOGRAPHIC = 'demographic',
  TWINCIDENCE = 'twincidence'
}
```

**AnonymizedData Interface:**
```typescript
interface AnonymizedData {
  anonymousId: string;               // Hashed user ID
  twinPairId: string;                // Hashed twin pair ID
  dataType: string;
  timestamp: string;
  payload: Record<string, any>;      // Anonymized data
  metadata: {
    appVersion: string;
    platform: 'ios' | 'android';
    consentLevel: ConsentLevel;
    anonymizationVersion: string;
  };
}
```

**PopulationStatistics Interface:**
```typescript
interface PopulationStatistics {
  totalPairs: number;
  sampleSize: number;
  lastUpdated: string;               // ISO 8601
  twinTypeBreakdown: {
    identical: number;               // Percentage
    fraternal: number;
    other: number;
  };
  gameStats: {
    [gameType: string]: {
      averageSynchronicity: number;
      standardDeviation: number;
      percentiles: {
        p25: number;
        p50: number;                 // Median
        p75: number;
        p90: number;
      };
    };
  };
  interestingFindings: InsightStatement[];
}

interface InsightStatement {
  category: string;
  statement: string;
  significance: 'high' | 'medium' | 'low';
}
```

**LeaderboardEntry Interface:**
```typescript
interface LeaderboardEntry {
  rank: number;
  anonymousName: string;             // "Twin Pair #1234"
  contributionScore: number;
  badges: Badge[];
  period: 'weekly' | 'monthly' | 'all-time';
}

interface Badge {
  id: string;
  name: string;
  icon: string;                      // Asset path
  description: string;
  earnedDate: string;
}
```

### APIs and Interfaces

**Zustand Store Actions:**

```typescript
// researchStore actions
interface ResearchStoreActions {
  // Consent management
  setConsent: (userId: string, level: ConsentLevel) => void;
  updateConsent: (userId: string, level: ConsentLevel) => void;
  revokeConsent: (userId: string) => void;
  getConsent: (userId: string) => ResearchConsent | null;
  needsAnnualReview: (userId: string) => boolean;

  // Contribution tracking
  logContribution: (record: ContributionRecord) => void;
  getContributions: (userId: string) => ContributionRecord[];
  getContributionCount: (userId: string, type?: ContributionType) => number;
  getTotalDataPoints: (userId: string) => number;

  // Submission management
  queueSubmission: (data: AnonymizedData) => void;
  getSubmissionQueue: () => AnonymizedData[];
  markSubmitted: (submissionId: string) => void;
  retryFailed: () => Promise<void>;

  // Population stats (cached)
  setPopulationStats: (stats: PopulationStatistics) => void;
  getPopulationStats: () => PopulationStatistics | null;
  getCachedAge: () => number; // Age in hours

  // Leaderboard
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  getLeaderboard: (period: 'weekly' | 'monthly' | 'all-time') => LeaderboardEntry[];
}
```

**Service Method Signatures:**

```typescript
// consentService.ts
class ConsentService {
  async grantConsent(userId: string, level: ConsentLevel): Promise<void>;
  // Saves consent with timestamp and policy version

  async updateConsentLevel(userId: string, level: ConsentLevel): Promise<void>;
  // Updates existing consent level

  async revokeConsent(userId: string): Promise<void>;
  // Marks consent as revoked, stops future submissions

  isConsentValid(userId: string): boolean;
  // Checks if consent exists and not revoked

  needsAnnualReview(userId: string): boolean;
  // Checks if 1 year has passed since last consent

  exportConsentHistory(userId: string): Promise<ConsentHistory>;
  // GDPR-compliant consent history export
}

// dataAnonymization.ts
class DataAnonymizationService {
  anonymizeGameSession(session: GameSession): AnonymizedData;
  // Strips PII, hashes IDs, removes timestamps precision

  anonymizeUserProfile(profile: UserProfile): AnonymizedData;
  // Removes name, email, exact birthdate, photos

  hashUserId(userId: string): string;
  // Consistent hash for anonymous ID

  stripMetadata(data: any): any;
  // Removes sensitive metadata fields

  validateAnonymization(data: AnonymizedData): boolean;
  // Checks for PII leakage before submission
}

// submissionService.ts
class SubmissionService {
  async submitData(data: AnonymizedData): Promise<{ success: boolean; submissionId?: string; error?: string }>;
  // Encrypts and submits to research API

  async submitBatch(dataArray: AnonymizedData[]): Promise<BatchSubmissionResult>;
  // Batch submission for efficiency

  queueForRetry(data: AnonymizedData): void;
  // Adds to retry queue if submission fails

  async processQueue(): Promise<void>;
  // Process queued submissions

  encryptPayload(data: AnonymizedData): string;
  // Encrypts data before transmission
}

// populationStatsService.ts
class PopulationStatsService {
  async fetchPopulationStats(): Promise<PopulationStatistics>;
  // Fetches latest aggregate statistics from API

  getCachedStats(): PopulationStatistics | null;
  // Returns cached stats if fresh (< 7 days)

  async refreshStats(): Promise<void>;
  // Force refresh population statistics

  compareToPopulation(userScore: number, gameType: string): {
    percentile: number;
    aboveAverage: boolean;
    zScore: number;
  };
  // Compares user score to population distribution
}

// contributionTracker.ts
class ContributionTracker {
  trackContribution(type: ContributionType, dataPointCount: number): void;
  // Logs a contribution event

  getContributionSummary(userId: string): {
    totalContributions: number;
    totalDataPoints: number;
    byType: { [key: string]: number };
    firstContribution: string;
    lastContribution: string;
  };
  // Summary statistics for dashboard

  calculateContributionScore(userId: string): number;
  // Score for leaderboard (games + days active + data completeness)

  awardBadge(userId: string, badgeId: string): void;
  // Awards achievement badge
}
```

**React Navigation Type Definitions:**

```typescript
type ResearchStackParamList = {
  ConsentScreen: { fromOnboarding?: boolean };
  ContributionDashboard: undefined;
  PopulationInsights: { gameType?: string };
  Leaderboard: { period?: 'weekly' | 'monthly' | 'all-time' };
  ResearchSettings: undefined;
  DataExport: undefined;
};
```

### Workflows and Sequencing

**Consent Flow (Story 5.1):**
```
User navigates to ConsentScreen (onboarding or settings)
  ↓
Display research participation explanation:
  - What data is collected
  - How it's anonymized
  - What it's used for
  - Who has access
  ↓
Present consent level options:
  - None: Don't participate
  - Anonymous: Fully anonymized data only
  - Aggregate: Include in aggregate statistics
  - Full: Identified data (future research)
  ↓
User selects consent level
  ↓
Display privacy policy and data usage terms
  ↓
User confirms consent
  ↓
consentService.grantConsent(userId, level)
  ↓
Save to researchStore + AsyncStorage
  ↓
Set annual review reminder (1 year from now)
  ↓
If level != NONE:
  ↓
  Show "Thank you" confirmation
  ↓
  Explain contribution tracking dashboard
  ↓
Navigate forward (or back to settings)
```

**Data Contribution Flow (Story 5.2, 5.3):**
```
User completes game session
  ↓
Check: Is research consent granted?
  ↓
[If NONE] → Skip contribution
  ↓
[If ANONYMOUS or higher]:
  ↓
  Retrieve game session data
  ↓
  dataAnonymization.anonymizeGameSession(session)
  ↓
  Validate anonymization (no PII check)
  ↓
  Create AnonymizedData payload
  ↓
  Track contribution:
    contributionTracker.trackContribution(type, dataPointCount)
  ↓
  Queue for submission:
    submissionService.queueForRetry(anonymizedData)
  ↓
  Check network connectivity
  ↓
  [If online] → Submit immediately
    ↓
    submissionService.submitData(anonymizedData)
    ↓
    [Success] → Mark as submitted, log submissionId
    ↓
    [Failure] → Keep in queue, retry later
  ↓
  [If offline] → Keep in queue
  ↓
Update contribution count in dashboard
```

**Contribution Dashboard Flow (Story 5.2):**
```
User navigates to ContributionDashboard
  ↓
Query researchStore for contributions
  ↓
Display summary:
  - Total contributions count
  - Total data points contributed
  - Breakdown by type (pie chart)
  - Timeline of contributions
  ↓
Show recent contributions (last 10):
  - Game type
  - Date
  - Data points
  - Anonymization indicator
  ↓
Display controls:
  - Pause/Resume contributions
  - View contribution details
  - Export all data (GDPR)
  - Revoke consent
  ↓
User taps "Pause contributions"
  ↓
Confirm action
  ↓
Update consent to NONE temporarily
  ↓
Stop future submissions
  ↓
User taps "Export my data"
  ↓
Generate GDPR export (JSON format)
  ↓
Include: consent history, contribution log, all game data
  ↓
Save to device or share
```

**Population Insights Flow (Story 5.4):**
```
User navigates to PopulationInsights
  ↓
Check cache age
  ↓
[If cache > 7 days old] → Fetch new data
  ↓
populationStatsService.fetchPopulationStats()
  ↓
Cache results in researchStore
  ↓
Display:
  - Total twin pairs in study
  - Your synchronicity scores vs average
  - Percentile rankings (25th, 50th, 75th, 90th)
  - Bell curve visualization with user's position
  - Twin type breakdown
  - Interesting population findings
  ↓
Filter by game type (optional)
  ↓
Compare user's specific game score:
  - Your score: 78/100
  - Average: 65/100
  - You're in the 82nd percentile
  ↓
Display insights:
  - "Identical twins score 12% higher on average"
  - "Geographically separated twins show similar synchronicity"
  ↓
Option to share anonymously on leaderboard
```

**Leaderboard Flow (Story 5.5):**
```
User navigates to Leaderboard
  ↓
Check: Is user opted into leaderboard?
  ↓
[If no] → Show opt-in prompt
  ↓
User opts in
  ↓
Calculate contribution score:
  Score = (games completed * 10) + (days active * 5) + (data completeness * 20)
  ↓
Fetch leaderboard data (weekly/monthly/all-time)
  ↓
Display top 100 contributors:
  - Rank
  - Anonymous name ("Twin Pair #1234")
  - Contribution score
  - Badges earned
  ↓
Highlight user's position
  ↓
Show user's badges:
  - "100 Games" badge
  - "1000 Data Points" badge
  - "Top 10%" badge
  ↓
User taps badge to view details
  ↓
Show badge description and how to earn
```

**Annual Consent Review Flow:**
```
1 year passes since consent granted
  ↓
App checks on startup:
  researchStore.needsAnnualReview(userId)
  ↓
[If true] → Show review reminder notification
  ↓
User taps notification
  ↓
Navigate to ConsentScreen (review mode)
  ↓
Display current consent level
  ↓
Show contribution summary from past year
  ↓
Ask: "Do you want to continue participating?"
  ↓
User confirms or updates consent level
  ↓
Update consent with new timestamp
  ↓
Set next annual review reminder
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Consent Screen Load**: < 300ms
- **Dashboard Load**: < 500ms
- **Anonymization Time**: < 100ms per game session
- **Data Export Time**: < 10 seconds for full export
- **Submission Queue Processing**: < 5 seconds for batch of 50 items
- **Population Stats Refresh**: < 3 seconds

**Performance Requirements:**
1. **Fast Anonymization**: PII stripping and hashing complete synchronously
2. **Efficient Caching**: Population stats cached for 7 days
3. **Background Submission**: Queue processing doesn't block UI
4. **Lazy Loading**: Dashboard data loaded on-demand

**Performance Optimizations:**
- Memoize anonymization functions (same input → cached hash)
- Batch submissions (send 50 at once instead of individual)
- Compress JSON payloads before transmission
- Use SQLite for contribution logs (if AsyncStorage becomes slow)

### Security

**Data Protection:**
- **Anonymization Validation**: Automated PII detection before submission
- **Encryption**: All research data encrypted in transit (HTTPS)
- **Hashing**: Consistent SHA-256 hashing for anonymous IDs
- **No Reversibility**: Hashes cannot be reversed to identify users

**Privacy Requirements:**
- **Explicit Consent**: No data contributed without user opt-in
- **Granular Controls**: User chooses exact consent level
- **Revocation**: User can revoke consent and delete data anytime
- **Transparency**: Clear disclosure of what data is collected

**PII Stripping Checklist:**
- ✅ Names removed
- ✅ Email addresses removed
- ✅ Exact birthdates (keep only age ranges: 18-25, 26-35, etc.)
- ✅ Photos removed
- ✅ Location data (keep only country-level, not city)
- ✅ Timestamps rounded to nearest hour
- ✅ User IDs hashed with salt

### Reliability/Availability

**Error Handling:**
- **Submission Failures**: Queue for retry with exponential backoff
- **Network Errors**: Graceful degradation, offline queue
- **API Errors**: Clear error messages, log for debugging
- **Cache Failures**: Fallback to older cached data

**Offline Support:**
- All contribution tracking works offline
- Submissions queued when offline
- Auto-submit when connection restored

**Data Integrity:**
- Validate anonymized data before submission (schema check)
- Prevent duplicate submissions (idempotency keys)
- Retry failed submissions (max 3 attempts)

### Compliance

**GDPR Compliance:**
- **Right to Access**: Data export functionality
- **Right to Deletion**: Revoke consent deletes all contributed data
- **Right to Rectification**: User can update consent level
- **Consent Management**: Explicit, informed, revocable consent
- **Data Minimization**: Only collect necessary data
- **Privacy by Design**: Anonymization happens client-side

**Privacy Requirements:**
- Clear, plain-language privacy policy
- Consent separate from terms of service
- Annual consent review
- Audit log of all submissions

### Observability

**Logging:**
- Info: Consent granted/updated/revoked, contributions logged, submissions sent
- Debug: Anonymization process, queue status
- Error: Submission failures, PII detection failures
- No PII in logs

**Metrics Tracking:**
- Consent opt-in rate by level
- Contribution frequency
- Submission success/failure rates
- Population stats cache hit rate
- Leaderboard engagement

**Monitoring:**
- Submission queue length (alert if > 500)
- Failed submission rate (alert if > 10%)
- Anonymization errors (alert immediately)

## Dependencies and Integrations

### NPM Dependencies

**Core Framework:** (inherited from Epic 1)
- `expo`, `react`, `react-native`, `typescript`

**State Management:**
- `zustand` 5.0.4 - researchStore
- `@react-native-async-storage/async-storage` 2.1.2 - Persistence

**Networking:**
| Package | Version | Purpose | Epic 5 Usage |
|---------|---------|---------|--------------|
| `axios` | 1.7.9 | HTTP client | API submissions |

**Crypto:**
| Package | Version | Purpose | Epic 5 Usage |
|---------|---------|---------|--------------|
| `expo-crypto` | 14.0.2 | Hashing | Anonymous ID generation |
| `crypto-js` | 4.2.0 | Encryption | Data encryption before submission |

**Charts:**
| Package | Version | Purpose | Epic 5 Usage |
|---------|---------|---------|--------------|
| `react-native-chart-kit` | 6.12.0 | Visualizations | Population insights charts |
| `react-native-svg` | 15.0.2 | SVG rendering | Chart dependency |

**Utilities:**
- `uuid` 11.1.0 - Contribution record IDs

### External Integrations

**Research API (Backend - Out of Scope for MVP):**
- `POST /research/submit` - Submit anonymized data
- `POST /research/submit/batch` - Batch submission
- `GET /research/population/stats` - Fetch population statistics
- `GET /research/leaderboard` - Fetch contribution rankings
- `DELETE /research/user/:anonymousId` - GDPR deletion

**Mock Data (MVP):**
- Mock population statistics for development
- Simulated leaderboard data
- Local-only submission queue

### Internal Module Dependencies

**Epic 5 depends on:**
- Epic 1: User profiles for anonymization
- Epic 2: Game sessions for contribution
- Existing `assessmentStore` for game data
- Existing `twinStore` for twin type

**Epic 5 provides foundation for:**
- Phase 2: Academic research partnerships
- Phase 2: Published research reports
- Phase 2: Advanced AI insights from population data

## Acceptance Criteria (Authoritative)

### AC-5.1: Research Consent and Opt-In Flow
1. User can access ConsentScreen from onboarding or settings
2. Clear explanation of research participation displayed
3. Four consent level options presented: None, Anonymous, Aggregate, Full
4. Each level has clear description of what data is collected
5. Privacy policy link accessible before consent
6. User can select consent level and confirm
7. Consent saved with timestamp and policy version
8. Annual review reminder set for 1 year from consent
9. User can change consent level later in settings
10. User can revoke consent completely
11. Consent status persists across app restarts

### AC-5.2: Research Data Contribution Tracking
1. Dashboard displays total contributions count
2. Dashboard shows total data points contributed
3. Breakdown by contribution type (pie chart)
4. Timeline of contributions visible
5. Recent contributions list (last 10) with details
6. Each contribution shows: type, date, data points, status
7. Anonymization indicator on each contribution
8. Pause/resume contribution controls work
9. GDPR export generates complete JSON file
10. Export includes: consent history, contributions, game data
11. Revoke consent stops future submissions
12. Contribution count updates in real-time after game completion

### AC-5.3: Anonymized Data Submission Pipeline
1. PII stripped from all game session data before submission
2. User IDs consistently hashed to anonymous IDs
3. Twin pair IDs hashed for linkage
4. Timestamps rounded to nearest hour
5. Exact birthdates converted to age ranges
6. Names, emails, photos removed
7. Automated PII validation before submission
8. Data encrypted before transmission (HTTPS)
9. Batch submissions supported (up to 50 items)
10. Failed submissions queued for retry
11. Exponential backoff on retries (3 max attempts)
12. Submission logs track status and errors
13. Offline queue processes when connection restored

### AC-5.4: Population Insights Dashboard
1. Display total twin pairs in research study
2. Show user's synchronicity scores vs population average
3. Percentile rankings displayed (25th, 50th, 75th, 90th)
4. Bell curve visualization with user's position
5. Twin type breakdown (identical, fraternal, other)
6. Interesting population findings displayed (3-5 insights)
7. Filter by game type to see specific comparisons
8. User can see "You're in the X percentile"
9. Population stats cached for 7 days
10. Refresh button fetches latest data
11. Comparison shows: user score, average, percentile
12. Option to share position on leaderboard

### AC-5.5: Research Contribution Leaderboard (Optional)
1. User can opt-in to appear on leaderboard
2. Leaderboard shows top 100 contributors
3. Each entry shows: rank, anonymous name, score, badges
4. Anonymous names format: "Twin Pair #1234"
5. Contribution score calculated from: games + days active + data completeness
6. User's position highlighted on leaderboard
7. Weekly, monthly, and all-time rankings available
8. Badges display for milestones (100 games, 1000 data points, etc.)
9. User can tap badge to view description
10. Opt-out removes user from leaderboard
11. Privacy-preserving (no personal info shown)
12. Leaderboard updates weekly

### AC-5.6: Cross-Cutting Requirements
1. All screens use galaxy background for consistency
2. All consent actions provide haptic feedback
3. All charts use galaxy color palette
4. All API calls handle errors gracefully
5. All data exports complete in under 10 seconds
6. All anonymization completes in under 100ms
7. All consent changes persist to AsyncStorage
8. All research features respect user's consent level

## Traceability Mapping

| Acceptance Criteria | Tech Spec Section(s) | Component(s)/API(s) | Test Strategy |
|---------------------|---------------------|---------------------|---------------|
| **AC-5.1: Consent Flow** | | | |
| AC-5.1.1-3: Consent UI | Detailed Design: ConsentScreen | ConsentScreen.tsx | UI test: All elements render |
| AC-5.1.4: Consent levels | Data Models: ConsentLevel enum | consentService.grantConsent() | Unit test: All levels save correctly |
| AC-5.1.5: Privacy policy | UI: ConsentScreen | Privacy policy link | Integration test: Link opens |
| AC-5.1.6-8: Consent save | APIs: consentService | researchStore.setConsent() | Unit test: Store updated, timestamp set |
| AC-5.1.9-10: Update/revoke | APIs: consentService | updateConsentLevel(), revokeConsent() | Integration test: Level changes work |
| AC-5.1.11: Persistence | Services: AsyncStorage | Zustand persist middleware | Integration test: Survives restart |
| **AC-5.2: Contribution Tracking** | | | |
| AC-5.2.1-6: Dashboard display | Detailed Design: ContributionDashboard | ContributionDashboard.tsx | UI test: All metrics display |
| AC-5.2.7: Anonymization indicator | UI: ContributionMetric | ContributionMetric.tsx | Visual test: Indicator shows |
| AC-5.2.8: Pause/resume | APIs: consentService | updateConsentLevel(NONE) | Integration test: Stops submissions |
| AC-5.2.9-10: GDPR export | Services: contributionTracker | exportConsentHistory() | Unit test: JSON structure correct<br>Performance test: < 10s |
| AC-5.2.11: Revoke effect | Workflows: Consent Flow | revokeConsent() | E2E test: No future submissions |
| AC-5.2.12: Real-time update | Services: contributionTracker | trackContribution() | Integration test: Count increments |
| **AC-5.3: Anonymization** | | | |
| AC-5.3.1-6: PII stripping | Services: dataAnonymization | anonymizeGameSession() | Unit test: No PII in output |
| AC-5.3.7: PII validation | Services: dataAnonymization | validateAnonymization() | Unit test: Detects PII leakage |
| AC-5.3.8: Encryption | Services: submissionService | encryptPayload() | Unit test: Encrypted payload |
| AC-5.3.9: Batch submission | APIs: submissionService | submitBatch() | Integration test: 50 items sent |
| AC-5.3.10-11: Retry logic | Workflows: Data Contribution | queueForRetry(), processQueue() | Unit test: Exponential backoff |
| AC-5.3.12: Submission logs | Data Models: ContributionRecord | researchStore.logContribution() | Unit test: Log created |
| AC-5.3.13: Offline queue | Services: submissionService | processQueue() | Integration test: Queue processes when online |
| **AC-5.4: Population Insights** | | | |
| AC-5.4.1-6: Dashboard display | Detailed Design: PopulationInsights | PopulationInsights.tsx | UI test: All stats display |
| AC-5.4.7: Game filter | UI: PopulationInsights | Filter dropdown | Integration test: Filters work |
| AC-5.4.8: Percentile display | Services: populationStatsService | compareToPopulation() | Unit test: Percentile calculation |
| AC-5.4.9: Cache duration | Services: populationStatsService | getCachedStats() | Unit test: Cache age check |
| AC-5.4.10: Refresh | Services: populationStatsService | refreshStats() | Integration test: Fetch new data |
| AC-5.4.11: Comparison display | UI: PopulationChart | Chart rendering | Visual test: Chart displays |
| AC-5.4.12: Share option | UI: PopulationInsights | Share button | Integration test: Navigate to leaderboard |
| **AC-5.5: Leaderboard** | | | |
| AC-5.5.1: Opt-in | Services: researchStore | Update leaderboard preference | Unit test: Preference saved |
| AC-5.5.2-4: Leaderboard display | Detailed Design: Leaderboard | Leaderboard.tsx | UI test: All entries render |
| AC-5.5.5: Score calculation | Services: contributionTracker | calculateContributionScore() | Unit test: Score formula correct |
| AC-5.5.6: User highlight | UI: Leaderboard | User position styling | Visual test: Highlighted correctly |
| AC-5.5.7: Period filter | UI: Leaderboard | Period tabs | Integration test: Filters work |
| AC-5.5.8-9: Badges | Data Models: Badge | Badge display component | UI test: Badges render |
| AC-5.5.10: Opt-out | Services: researchStore | Update leaderboard preference | Integration test: User removed |
| AC-5.5.11: Privacy | Data Models: LeaderboardEntry | Anonymous name generation | Unit test: No PII in names |
| AC-5.5.12: Update frequency | Services: leaderboardService | Weekly update logic | Integration test: Updates weekly |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID | Description | Probability | Impact | Mitigation Strategy | Owner |
|---------|-------------|-------------|--------|---------------------|-------|
| R-5.1 | PII accidentally leaked in anonymized data | Low | Critical | Automated PII detection, manual review, penetration testing | Story 5.3 |
| R-5.2 | Low opt-in rate (< 20%) | Medium | High | Clear value proposition, population insights incentive, gamification | Story 5.1 |
| R-5.3 | Backend API not ready for MVP | High | Medium | Use mock data, local-only queue for MVP | Stories 5.3, 5.4 |
| R-5.4 | Users don't understand consent levels | Medium | Medium | Clear UI copy, examples, help tooltips | Story 5.1 |
| R-5.5 | Submission queue grows too large | Low | Medium | Implement queue size limits, alert user if > 500 items | Story 5.3 |
| R-5.6 | Population stats become stale | Medium | Low | Monthly auto-refresh, clear "last updated" timestamp | Story 5.4 |
| R-5.7 | GDPR export fails for large datasets | Low | Medium | Streaming export, compression, 10s timeout | Story 5.2 |

### Assumptions

| Assumption ID | Description | Validation Method | Impact if Invalid |
|---------------|-------------|-------------------|-------------------|
| A-5.1 | Users value population insights enough to opt in | User research, A/B testing | Need alternative incentives |
| A-5.2 | Backend research API will be available in Phase 2 | Backend team confirmation | MVP limited to local queue |
| A-5.3 | 7-day cache is sufficient for population stats | User feedback | May need more frequent updates |
| A-5.4 | SHA-256 hashing is sufficient for anonymization | Security review | May need stronger hashing |
| A-5.5 | Users trust Twinship with research data | Privacy audit, user surveys | Need transparency improvements |
| A-5.6 | Leaderboard gamification increases engagement | Analytics tracking | May remove if no engagement |
| A-5.7 | Annual consent review is acceptable UX | User testing | May need more frequent reviews |

### Open Questions

| Question ID | Description | Importance | Resolution Needed By | Proposed Resolution |
|-------------|-------------|------------|---------------------|---------------------|
| Q-5.1 | Should consent be required during onboarding? | High | Story 5.1 | **Decision**: Optional during onboarding, can skip and enable later |
| Q-5.2 | What happens to queued data if user revokes consent? | High | Story 5.3 | **Decision**: Delete all queued submissions immediately |
| Q-5.3 | Should we show population stats to non-participants? | Medium | Story 5.4 | **Decision**: Yes, as incentive to opt in |
| Q-5.4 | How to handle users under 18 for research consent? | High | Story 5.1 | **Decision**: Require parental consent (Phase 2) |
| Q-5.5 | Should contribution score be public or private? | Low | Story 5.5 | **Decision**: Private unless user opts into leaderboard |
| Q-5.6 | What if backend rejects anonymized data? | Medium | Story 5.3 | **Decision**: Log error, don't retry, notify user |
| Q-5.7 | Should we support partial consent (e.g., only maze data)? | Low | Phase 2 | **Decision**: Not in MVP, all-or-nothing per game type |
| Q-5.8 | How to handle timezone differences in contribution timestamps? | Low | Story 5.3 | **Decision**: Use UTC timestamps consistently |

### Technical Debt

| Item | Description | Impact | Remediation Plan |
|------|-------------|--------|------------------|
| TD-5.1 | Mock population statistics (no real backend) | Medium | Replace with real API in Phase 2 (Epic 7 extension) |
| TD-5.2 | No encryption of queued data at rest | Low | Add encryption in Epic 7 |
| TD-5.3 | Manual badge awarding (no automation) | Low | Automate badge checks in Phase 2 |
| TD-5.4 | Limited error handling for API failures | Medium | Add comprehensive error recovery in Phase 2 |
| TD-5.5 | No streaming for large GDPR exports | Low | Implement streaming if exports exceed 10MB |

## Test Strategy Summary

### Unit Tests

**Target Coverage**: 80% minimum

**Key Test Areas:**
1. **Consent Management** (Story 5.1):
   - Consent level validation (enum values)
   - Consent timestamp generation
   - Annual review calculation (1 year from consent)
   - Revocation logic

2. **Anonymization** (Story 5.3):
   - PII stripping (name, email, exact birthdate removed)
   - User ID hashing (consistent hashes for same input)
   - Timestamp rounding (nearest hour)
   - Validation (detect PII leakage)

3. **Contribution Tracking** (Story 5.2):
   - Score calculation (games + days + completeness)
   - Data point counting
   - Contribution log creation
   - Badge awarding logic

4. **Population Stats** (Story 5.4):
   - Percentile calculation
   - Z-score calculation
   - Cache age calculation
   - Comparison logic

5. **Submission Service** (Story 5.3):
   - Queue management (add, remove, process)
   - Retry logic (exponential backoff)
   - Batch submission (50 items)
   - Encryption

### Integration Tests

**Key Integration Scenarios:**
1. **Complete Consent Flow** (Story 5.1):
   - Grant consent → Save to store → Set reminder
   - Update consent level → Store updated
   - Revoke consent → Queue cleared

2. **Data Contribution Pipeline** (Stories 5.2, 5.3):
   - Complete game → Anonymize → Queue → Submit
   - Failed submission → Retry → Success
   - Offline queue → Come online → Process

3. **Dashboard Display** (Story 5.2):
   - Load contributions → Display metrics → Export data
   - Pause contributions → Stop future submissions

4. **Population Insights** (Story 5.4):
   - Fetch stats → Cache → Display → Refresh
   - Compare user score → Calculate percentile → Display

5. **Leaderboard** (Story 5.5):
   - Opt in → Calculate score → Display rank
   - Award badge → Display on profile

### E2E Tests

**Key E2E Scenarios:**
1. **Happy Path - Opt In**:
   - Navigate to consent → Select anonymous → Confirm → See confirmation
   - Expected: Consent saved, contributions enabled

2. **Happy Path - Contribution**:
   - Complete game → Verify contribution logged → Check dashboard
   - Expected: Contribution count incremented

3. **Happy Path - Population Insights**:
   - Navigate to insights → View comparison → See percentile
   - Expected: User score compared to population

4. **Error Path - Revoke Consent**:
   - Opt in → Contribute data → Revoke → Verify queue cleared
   - Expected: No future contributions

5. **Error Path - Submission Failure**:
   - Complete game → Simulate network error → Verify queued
   - Expected: Queued for retry

### Performance Tests

**Target Metrics:**
- Consent screen load: < 300ms
- Dashboard load: < 500ms
- Anonymization: < 100ms per session
- GDPR export: < 10 seconds
- Queue processing: < 5 seconds for 50 items

**Key Performance Tests:**
1. Dashboard load time with 1000 contributions
2. Anonymization speed for large game sessions
3. GDPR export for user with 500 games
4. Batch submission of 50 items
5. Population stats chart rendering

### Security Tests

**Key Security Tests:**
1. PII detection in anonymized data (no false negatives)
2. Hash consistency (same input → same hash)
3. Encryption validation (payload encrypted)
4. GDPR export completeness (all data included)
5. Consent validation (no submissions without consent)

### Regression Test Suite

**Automated regression tests run on every PR:**
1. All unit tests
2. Critical integration tests (consent flow, contribution pipeline)
3. Core E2E happy paths
4. Security smoke tests

**Pre-release full regression:**
1. All unit tests
2. All integration tests
3. All E2E tests
4. Full performance suite
5. Security audit

### Definition of Done (DoD)

A story is complete when:
1. ✅ All acceptance criteria met
2. ✅ Unit tests written and passing (80%+ coverage)
3. ✅ Integration tests written and passing
4. ✅ UI tests written and passing
5. ✅ E2E tests written and passing for critical paths
6. ✅ Performance tests passing (meet target metrics)
7. ✅ Security tests passing (no PII leakage)
8. ✅ Code reviewed and approved
9. ✅ Manual testing on iOS and Android
10. ✅ No high-severity bugs
11. ✅ Documentation updated
12. ✅ Sprint status updated to "done"

---

## Epic 5 Tech Spec Complete ✅

**Document Status**: Draft → Ready for Review
**Next Steps**:
1. Draft all 5 Epic 5 stories in `/docs/stories/`
2. Update sprint-status.yaml: `epic-5: backlog` → `epic-5: contexted`
3. Begin Story 5.1 implementation after approval

**Document Approvers**:
- [ ] Product Manager (Ashley)
- [ ] Tech Lead
- [ ] Privacy/Legal Lead (for consent and GDPR compliance)

**Last Updated**: 2025-11-18
