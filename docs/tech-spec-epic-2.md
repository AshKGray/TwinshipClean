# Epic Technical Specification: Twin Connection Games Laboratory

Date: 2025-11-18
Author: Claude (BMAD Method)
Epic ID: 2
Status: Draft

---

## Overview

Epic 2 implements the core differentiator of Twinship: four sophisticated psychological games that transform abstract twin connection into measurable, scientific data. These games (Cognitive Synchrony Maze, Emotional Resonance Mapping, Temporal Decision Synchrony, and Iconic Duo Quiz) measure different aspects of twin synchronicity through engaging gameplay mechanics and generate personalized insights comparing twin responses.

This specification covers the client-side implementation using React Native, Expo, TypeScript, and Zustand state management with local persistence. The epic provides a central games hub and implements each game with both gameplay mechanics and insight generation, culminating in a comprehensive results dashboard for tracking synchronicity trends over time.

## Objectives and Scope

**In Scope:**
- Psychic Games Hub screen with 4 game cards and completion tracking
- Cognitive Synchrony Maze: Interactive maze navigation with directional pattern analysis
- Emotional Resonance Mapping: Abstract image-emotion association with vocabulary overlap scoring
- Temporal Decision Synchrony: Rapid-fire decision scenarios with value alignment analysis
- Iconic Duo Quiz: Personality assessment with duo matching and shareable results
- Game results analysis algorithms (synchronicity scoring, pattern detection)
- Results history dashboard with trend visualization
- Local storage of game sessions and results
- Shareable result cards for social media

**Out of Scope:**
- Real-time multiplayer gameplay (twins play asynchronously)
- Backend API implementation (handled separately in Epic 7)
- AI-generated personalized insights (Phase 2 enhancement)
- Leaderboards or competitive features
- In-app purchases for premium games
- Video/voice recording during gameplay
- Advanced biometric integration (heart rate, etc.)

**Success Criteria:**
- Games are engaging and maintain 60 FPS performance
- Synchronicity algorithms produce meaningful, accurate insights
- Game sessions persist locally for offline access
- Results are visually appealing and shareable
- Users complete at least 2 games within first week of pairing
- Insight generation completes in under 2 seconds

## System Architecture Alignment

**React Native Mobile App Architecture:**

This epic integrates with the existing Twinship mobile architecture as follows:

1. **Navigation Layer** (`src/navigation/AppNavigator.tsx`):
   - PsychicGamesHub as main entry point from Twindex
   - Individual game screens in games stack
   - Results screens for each game
   - ResultsDashboard accessible from hub and profile

2. **State Management** (`src/state/`):
   - `assessmentStore.ts`: Game sessions, results, completion tracking
   - `twinStore.ts`: Twin profiles for comparison logic
   - Game-specific stores if needed for complex state

3. **Services Layer** (`src/services/games/`):
   - `mazeAnalysis.ts`: Cognitive synchrony calculations
   - `emotionAnalysis.ts`: Emotional vocabulary overlap algorithms
   - `decisionAnalysis.ts`: Value alignment and stress response metrics
   - `duoMatching.ts`: Iconic duo matching algorithm
   - `syncScoring.ts`: Unified synchronicity scoring system

4. **UI Components** (`src/components/games/`):
   - `GameCard.tsx`: Reusable game card component for hub
   - `ResultCard.tsx`: Shareable result visualization
   - `InsightDisplay.tsx`: Formatted insight statement component
   - `ProgressTracker.tsx`: Game completion indicators

**Design System Integration:**
- Galaxy-themed color palette with neon accents
- NativeWind/Tailwind CSS for consistent styling
- React Native Reanimated for smooth game animations
- React Native Gesture Handler for swipe controls
- Expo Haptics for tactile feedback during games

**Existing Patterns:**
- Uses existing `galaxybackground.png` for cosmic aesthetic
- Integrates with existing assessment screen patterns
- Follows established navigation flow with back navigation
- Maintains consistent form and input patterns

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|---------------|--------|---------|-------|
| `PsychicGamesHub.tsx` | Display available games, track completion | Game completion status | Game navigation | Story 2.1 |
| `CognitiveSynchronyMaze.tsx` | Maze navigation gameplay | User swipes/taps | Move history, completion data | Story 2.2 |
| `mazeAnalysis.ts` | Analyze maze patterns and generate insights | Twin maze sessions | Synchronicity scores, insights | Story 2.3 |
| `EmotionalResonanceGame.tsx` | Abstract image-emotion association | User selections | Image-emotion mappings | Story 2.4 |
| `emotionAnalysis.ts` | Calculate emotional vocabulary overlap | Twin emotion sessions | Overlap scores, insights | Story 2.5 |
| `TemporalDecisionGame.tsx` | Rapid decision scenario gameplay | User choices, response times | Decision history | Story 2.6 |
| `decisionAnalysis.ts` | Analyze value alignment and stress responses | Twin decision sessions | Alignment scores, insights | Story 2.7 |
| `IconicDuoQuiz.tsx` | Personality quiz gameplay | Quiz answers | Self/twin perception data | Story 2.8 |
| `duoMatching.ts` | Match quiz results to iconic duos | Quiz scores | Duo match, trait analysis | Story 2.9 |
| `ResultsDashboard.tsx` | Historical results and trend tracking | All game sessions | Trend visualizations | Story 2.10 |
| `assessmentStore.ts` | Persist game sessions and results | Game data, actions | Store state, selectors | Stories 2.1-2.10 |

**Module Dependencies:**
- All game screens depend on `react-native-gesture-handler` for interactions
- Analysis services depend on statistical calculation utilities
- Charts depend on `react-native-chart-kit` or similar library
- All stores depend on `zustand` and `AsyncStorage` persistence middleware

### Data Models and Contracts

**GameSession Interface:**
```typescript
interface GameSession {
  id: string;                    // UUID v4
  gameType: 'maze' | 'emotion' | 'decision' | 'duo';
  userId: string;                // User who played
  twinId?: string;               // Twin's user ID (for comparison)
  startedAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp (null if incomplete)
  rawData: MazeData | EmotionData | DecisionData | DuoData;
  result?: GameResult;           // Calculated after both twins complete
  status: 'in_progress' | 'completed' | 'analyzed';
}
```

**Maze-Specific Data:**
```typescript
interface MazeData {
  moves: MazeMove[];
  completionTime: number;        // Milliseconds
  errorCount: number;
  correctionsCount: number;
  mazeId: string;                // Identifier for specific maze layout
}

interface MazeMove {
  direction: 'up' | 'down' | 'left' | 'right';
  timestamp: number;             // Relative to start time (ms)
  wasError: boolean;             // Hit wall or dead end
  corrected: boolean;            // Backtracked to fix error
}

interface MazeResult extends GameResult {
  directionPreferences: {        // Percentage breakdown
    up: number;
    down: number;
    left: number;
    right: number;
  };
  errorRate: number;             // Errors per minute
  synchronicity: {
    directionAlignment: number;  // 0-100 score
    errorStyleMatch: number;     // 0-100 score
    overallScore: number;        // Weighted average
  };
  insights: string[];            // Generated insight statements
}
```

**Emotion-Specific Data:**
```typescript
interface EmotionData {
  associations: EmotionAssociation[];
  images: AbstractImage[];       // Available images shown
}

interface EmotionAssociation {
  emotion: EmotionWord;
  selectedImages: number[];      // Image IDs selected
  selectionOrder: number[];      // Order of selection
  responseTime: number;          // Time to make selections (ms)
}

type EmotionWord = 'joy' | 'sadness' | 'anger' | 'fear' |
                   'surprise' | 'disgust' | 'trust' | 'anticipation';

interface AbstractImage {
  id: number;
  url: string;                   // Asset path
  dominantColors: string[];      // Hex colors
  pattern: 'geometric' | 'organic' | 'abstract';
}

interface EmotionResult extends GameResult {
  vocabularyOverlap: number;     // 0-100 percentage
  sharedAssociations: {
    emotion: EmotionWord;
    images: number[];
    confidence: number;
  }[];
  uniquePatterns: {
    user: string;
    uniqueAssociations: number;
  }[];
  synchronicity: {
    overallScore: number;        // 0-100 weighted score
  };
  insights: string[];
}
```

**Decision-Specific Data:**
```typescript
interface DecisionData {
  scenarios: DecisionScenario[];
  averageResponseTime: number;
  changeCount: number;           // How many times user changed answer
}

interface DecisionScenario {
  id: string;
  category: 'risk' | 'ethics' | 'practical' | 'emotional';
  question: string;
  options: string[];
  selectedOption: number;
  responseTime: number;          // Milliseconds
  changed: boolean;              // Whether user changed their answer
  timerPressure: number;         // 0-100, how close to timeout
}

interface DecisionResult extends GameResult {
  valueAlignment: number;        // 0-100 percentage
  categoryBreakdown: {
    risk: number;
    ethics: number;
    practical: number;
    emotional: number;
  };
  stressResponsePattern: {
    becomesMorePragmatic: boolean;
    speedChange: number;         // Percentage faster/slower under pressure
    changeFrequency: number;     // How often answers changed
  };
  synchronicity: {
    overallScore: number;        // 0-100 weighted score
  };
  insights: string[];
}
```

**Duo Quiz Data:**
```typescript
interface DuoData {
  questions: DuoQuestion[];
}

interface DuoQuestion {
  id: string;
  category: 'relationship' | 'communication' | 'humor' | 'conflict';
  question: string;
  options: string[];
  selfAnswer: number;            // Answer about self
  twinAnswer: number;            // Answer about twin
}

interface DuoResult extends GameResult {
  matchedDuo: IconicDuo;
  perceptionGap: number;         // 0-100, self vs twin perception difference
  keyTraits: string[];           // Traits that led to match
  selfAwareness: number;         // How well answers aligned with twin's view
  synchronicity: {
    overallScore: number;        // Fun score, not scientific
  };
  insights: string[];
}

interface IconicDuo {
  id: string;
  name: string;                  // "Fred & George Weasley"
  description: string;
  image: string;                 // Asset path
  traits: string[];
  archetype: string;             // "Synchronized Mischief"
}
```

**Base GameResult:**
```typescript
interface GameResult {
  gameType: string;
  completedAt: string;           // ISO 8601 timestamp
  synchronicity: {
    overallScore: number;        // 0-100 universal score for comparisons
  };
  insights: string[];            // Array of insight statements
  shareable: boolean;            // Whether result can be shared
  shareCard?: {                  // Generated share image
    imageUrl: string;
    text: string;
  };
}
```

### APIs and Interfaces

**Zustand Store Actions:**

```typescript
// assessmentStore actions
interface AssessmentStoreActions {
  startGameSession: (gameType: GameType, userId: string) => GameSession;
  updateGameSession: (sessionId: string, updates: Partial<GameSession>) => void;
  completeGameSession: (sessionId: string, rawData: any) => void;
  calculateResult: (session1: GameSession, session2: GameSession) => GameResult;

  // Queries
  getCompletedGames: (userId: string) => GameSession[];
  getGamesByType: (gameType: GameType) => GameSession[];
  getTwinComparison: (gameType: GameType, userId: string, twinId: string) => GameResult | null;
  getLatestResults: (limit: number) => GameResult[];

  // Computed
  getSynchronicityTrend: (gameType?: GameType) => number[]; // Over time
  getCompletionRate: () => { [key in GameType]: boolean };
}
```

**Service Method Signatures:**

```typescript
// mazeAnalysis.ts
class MazeAnalysisService {
  calculateDirectionPreferences(moves: MazeMove[]): DirectionPreferences;
  // Analyzes move history, returns percentage breakdown

  analyzeErrorPatterns(moves: MazeMove[]): ErrorMetrics;
  // Calculates error rate, correction style

  compareTwinSessions(session1: MazeData, session2: MazeData): MazeResult;
  // Generates synchronicity scores and insights

  generateInsights(result: MazeResult): string[];
  // Creates human-readable insight statements
}

// emotionAnalysis.ts
class EmotionAnalysisService {
  calculateVocabularyOverlap(data1: EmotionData, data2: EmotionData): number;
  // Jaccard similarity or similar algorithm

  findSharedAssociations(data1: EmotionData, data2: EmotionData): SharedAssociation[];
  // Identifies common image-emotion mappings

  compareEmotionalProfiles(data1: EmotionData, data2: EmotionData): EmotionResult;
  // Generates complete comparison result

  generateInsights(result: EmotionResult): string[];
  // Creates insight statements from overlap data
}

// decisionAnalysis.ts
class DecisionAnalysisService {
  calculateValueAlignment(data1: DecisionData, data2: DecisionData): number;
  // Percentage of matching choices

  analyzeCategoryAlignment(data1: DecisionData, data2: DecisionData): CategoryBreakdown;
  // Breakdown by decision category

  analyzeStressResponse(data: DecisionData): StressResponsePattern;
  // Analyzes behavior under time pressure

  compareDecisionProfiles(data1: DecisionData, data2: DecisionData): DecisionResult;
  // Generates complete comparison result

  generateInsights(result: DecisionResult): string[];
  // Creates insight statements
}

// duoMatching.ts
class DuoMatchingService {
  scoreDuos(data: DuoData): Map<string, number>;
  // Scores user against all iconic duo archetypes

  selectBestMatch(scores: Map<string, number>): IconicDuo;
  // Returns highest-scoring duo

  analyzePerceptionGap(data: DuoData): number;
  // Self vs twin perception difference

  generateDuoResult(data: DuoData): DuoResult;
  // Complete quiz result with match and insights

  generateShareCard(result: DuoResult): ShareCard;
  // Creates social media share image
}

// syncScoring.ts (unified scoring system)
class SyncScoringService {
  normalizeScore(gameType: GameType, rawScore: number): number;
  // Converts game-specific scores to 0-100 scale

  calculateWeightedAverage(results: GameResult[]): number;
  // Overall synchronicity across all games

  getTrendData(sessions: GameSession[]): TrendPoint[];
  // Historical trend data for charting
}
```

**React Navigation Type Definitions:**

```typescript
type GamesStackParamList = {
  PsychicGamesHub: undefined;
  MazeGame: { sessionId: string };
  MazeResults: { sessionId: string; resultId: string };
  EmotionGame: { sessionId: string };
  EmotionResults: { sessionId: string; resultId: string };
  DecisionGame: { sessionId: string };
  DecisionResults: { sessionId: string; resultId: string };
  DuoQuiz: { sessionId: string };
  DuoResults: { sessionId: string; resultId: string };
  ResultsDashboard: undefined;
};
```

### Workflows and Sequencing

**Game Hub Flow:**
```
User navigates to Psychic Games Hub
  ↓
Display 4 game cards with completion status
  ↓
User taps game card
  ↓
Check if twin has completed this game
  ↓
Navigate to game intro/gameplay
```

**Maze Game Flow (Story 2.2 → 2.3):**
```
Start Maze Game
  ↓
Create GameSession (status: in_progress)
  ↓
Display 10x10 maze grid
  ↓
User swipes to navigate (up/down/left/right)
  ↓
Record each move: {direction, timestamp, wasError}
  ↓
Track completion time
  ↓
User reaches maze end
  ↓
Save MazeData to GameSession
  ↓
Update status: completed
  ↓
Check: Has twin completed maze?
  ↓
[If yes] → Run mazeAnalysis.compareTwinSessions()
  ↓
Generate MazeResult with insights
  ↓
Navigate to MazeResults screen
  ↓
Display:
  - Synchronicity score
  - Direction preferences (both twins)
  - Error pattern comparison
  - Generated insights
  ↓
Option to share results
```

**Emotion Game Flow (Story 2.4 → 2.5):**
```
Start Emotional Resonance Game
  ↓
Create GameSession
  ↓
Display 12 abstract images (grid layout)
  ↓
Loop through 8 emotions:
  ↓
  Show emotion word (e.g., "Joy")
  ↓
  User selects images that match emotion
  ↓
  Record: {emotion, selectedImages, responseTime}
  ↓
  Animate to next emotion
  ↓
Complete all emotions
  ↓
Save EmotionData to GameSession
  ↓
Check: Has twin completed?
  ↓
[If yes] → Run emotionAnalysis.compareEmotionalProfiles()
  ↓
Generate EmotionResult with vocabulary overlap
  ↓
Display results with Venn diagram visualization
```

**Decision Game Flow (Story 2.6 → 2.7):**
```
Start Temporal Decision Game
  ↓
Create GameSession
  ↓
Loop through 20 scenarios:
  ↓
  Display scenario with 3-4 options
  ↓
  Start 5-second countdown timer
  ↓
  User selects option
  ↓
  Record: {choice, responseTime, changed, timerPressure}
  ↓
  Advance to next scenario
  ↓
Complete all scenarios
  ↓
Calculate average response time
  ↓
Save DecisionData
  ↓
Check: Has twin completed?
  ↓
[If yes] → Run decisionAnalysis.compareDecisionProfiles()
  ↓
Generate DecisionResult with value alignment
  ↓
Display results with category breakdown charts
```

**Duo Quiz Flow (Story 2.8 → 2.9):**
```
Start Iconic Duo Quiz
  ↓
Create GameSession
  ↓
Loop through 15 questions:
  ↓
  Display question
  ↓
  User answers "About You"
  ↓
  User answers "About Your Twin"
  ↓
  Record both answers
  ↓
Complete all questions
  ↓
Save DuoData
  ↓
Run duoMatching.generateDuoResult()
  ↓
Score against all iconic duos
  ↓
Select best match
  ↓
Generate share card
  ↓
Display:
  - Matched duo with image
  - Key traits
  - Perception gap analysis
  - Shareable result card
```

**Results Dashboard Flow (Story 2.10):**
```
User navigates to Results Dashboard
  ↓
Query all completed GameSessions
  ↓
Display:
  - Recent results (last 5 games)
  - Synchronicity trend chart
  - Game completion breakdown
  - Filter options (game type, date range)
  ↓
User taps result card
  ↓
Navigate to detailed result screen for that game
  ↓
User applies filter
  ↓
Update displayed results
```

## Non-Functional Requirements

### Performance

**Target Metrics:**
- **Screen Load Time**: < 500ms for all game screens
- **Game Frame Rate**: 60 FPS for maze navigation and animations
- **Analysis Time**: < 2 seconds to generate insights after both twins complete
- **Chart Rendering**: < 1 second for results dashboard
- **Memory Usage**: < 150MB during gameplay
- **AsyncStorage**: < 100ms for saving game sessions

**Performance Requirements:**
1. **Smooth Gameplay**: All game interactions maintain 60 FPS using React Native Reanimated
2. **Responsive Controls**: Input latency < 100ms for swipes, taps, selections
3. **Efficient Calculations**: Analysis algorithms complete synchronously without blocking UI
4. **Lazy Loading**: Images loaded on-demand, not all upfront
5. **Optimized Charts**: Use lightweight charting library or custom SVG

**Performance Optimizations:**
- Memoize expensive calculations (synchronicity scoring)
- Use FlatList for scrollable game lists
- Debounce rapid user inputs (maze swipes)
- Preload next emotion image while user is selecting
- Cache analysis results to avoid recalculation

### Security

**Data Protection:**
- Game session data encrypted in AsyncStorage
- No PII leaked in logs or error reports
- Results are twin-private (not shared publicly without consent)

**Input Validation:**
- Validate game data before saving (schema checks)
- Sanitize user inputs in quiz questions
- Prevent tampering with game sessions (checksum validation)

### Reliability/Availability

**Error Handling:**
- Graceful handling of incomplete game sessions
- Auto-save progress every 10 moves/selections
- Recovery from app crash mid-game
- Clear error messages if twin data unavailable

**Offline Support:**
- All games playable offline
- Results calculated locally
- Sync to backend when available (Epic 7)

### Usability

**Accessibility:**
- Color-blind friendly visualizations
- Screen reader support for insights
- Haptic feedback for game interactions
- Clear instructions before each game

**User Experience:**
- Fun, engaging gameplay mechanics
- Clear progress indicators
- Meaningful, non-judgmental insights
- Shareable results for social engagement

## Test Strategy Summary

### Unit Tests
- Analysis algorithm correctness (direction preferences, overlap calculations)
- Edge cases (both twins pick same options, complete opposites)
- Score normalization (0-100 range enforcement)
- Insight generation (template rendering)

### Integration Tests
- Complete game flow (start → play → complete → analyze → display)
- Twin comparison when both complete
- Results persistence and retrieval
- Dashboard data aggregation

### E2E Tests
- Play full game and verify result
- Share result card generation
- Navigate between games
- Filter dashboard results

**Coverage Target**: 80%

## References

- [Source: docs/epics.md#Epic-2] Epic 2 story definitions and effort estimates
- [Source: docs/Twinship PRD.md#Twin-Connection-Games-Laboratory] Game design requirements
- [Source: docs/Twinship PRD.md#Key-Features] Core value propositions
- [Source: docs/tech-spec-epic-1.md] Architecture patterns from Epic 1
- [Source: docs/ui-component-architecture.md] Component design patterns
- [Source: docs/performance-optimization-plan.md] Performance best practices

## Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-11-18 | Claude (BMAD) | Initial draft created following Epic 1 format |

## Appendix

### Game Scenario Examples

**Maze Example:**
```
START → → ↓ → → ↓ ← ← ↓ → → END
Errors: 3 (hit walls going ← twice, wrong turn once)
Time: 45 seconds
Direction breakdown: Right 40%, Down 35%, Left 15%, Up 10%
```

**Emotion Example:**
```
Emotion: "Joy"
Selected Images: #3 (yellow circles), #7 (bright swirls), #11 (radiating lines)
Response time: 4.2 seconds
```

**Decision Example:**
```
Scenario: "Your friend asks to borrow $500. You know they're bad with money."
Options: [Lend it, Refuse, Offer smaller amount, Suggest alternatives]
Selected: "Offer smaller amount"
Response time: 3.1 seconds
Timer pressure: 45% (2.25s remaining when answered)
```

**Duo Example:**
```
Question: "How do you typically resolve disagreements?"
About You: "Talk it out calmly"
About Twin: "Avoid conflict initially, then discuss"
Matches duo trait: "Complementary conflict styles"
```

### Iconic Duo Database

Suggested iconic duos for matching:
1. **Fred & George Weasley** - Synchronized Mischief (pranksters, finish each other's sentences)
2. **Mario & Luigi** - Complementary Strengths (one leads, one supports)
3. **Sherlock & Mycroft Holmes** - Competitive Intelligence (push each other, rivalry)
4. **Zack & Cody** - Opposite Personalities (polar opposites, balance each other)
5. **Mary-Kate & Ashley Olsen** - Business Partners (collaborative, share vision)
6. **Hikaru & Kaoru Hitachiin** - Inseparable Unit (same interests, hard to tell apart)
7. **Phoebe & Ursula Buffay** - Distant Connection (independent lives, still connected)
8. **Tweedledee & Tweedledum** - Mirror Images (identical in every way)
