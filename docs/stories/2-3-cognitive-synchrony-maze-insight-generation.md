# Story 2.3: Cognitive Synchrony Maze - Insight Generation

Status: drafted

## Story

As a **user who completed the Cognitive Synchrony Maze**,
I want **to see insights comparing my problem-solving patterns with my twin**,
so that **I understand how synchronized our cognitive approaches are**.

## Acceptance Criteria

1. Calculate directional preference percentages for both twins
2. Compare error correction styles between twins
3. Generate insight statements based on pattern analysis
4. Display synchronicity score (0-100)
5. Show visual comparison (charts/graphs)
6. Store insights in assessment results
7. Make results shareable (export/screenshot)
8. Handle case where twin hasn't completed yet (show waiting state)

## Tasks / Subtasks

- [ ] **Task 1**: Implement directional analysis (AC: 1)
  - [ ] Create `src/services/games/mazeAnalysis.ts`
  - [ ] Implement `calculateDirectionPreferences()`:
    ```typescript
    function calculateDirectionPreferences(moves: MazeMove[]): {
      up: number;
      down: number;
      left: number;
      right: number;
    }
    ```
  - [ ] Count moves in each direction
  - [ ] Calculate percentages
  - [ ] Return breakdown object

- [ ] **Task 2**: Implement error pattern analysis (AC: 2)
  - [ ] Implement `analyzeErrorPatterns()`:
    ```typescript
    function analyzeErrorPatterns(moves: MazeMove[]): {
      errorRate: number; // errors per minute
      correctionStyle: 'immediate' | 'delayed' | 'persistent';
      errorTypes: Map<string, number>;
    }
    ```
  - [ ] Calculate error rate
  - [ ] Analyze correction timing
  - [ ] Categorize error types

- [ ] **Task 3**: Implement twin comparison (AC: 1-4)
  - [ ] Implement `compareTwinSessions()`:
    ```typescript
    function compareTwinSessions(
      session1: MazeData,
      session2: MazeData
    ): MazeResult
    ```
  - [ ] Compare directional preferences (calculate overlap)
  - [ ] Compare error correction styles
  - [ ] Calculate synchronicity score:
    - Direction alignment: 40% weight
    - Error style match: 30% weight
    - Completion time similarity: 30% weight
  - [ ] Generate MazeResult object

- [ ] **Task 4**: Implement insight generation (AC: 3)
  - [ ] Implement `generateInsights()`:
    ```typescript
    function generateInsights(result: MazeResult): string[]
    ```
  - [ ] Create insight templates:
    - "You both favor [direction] turns [X]% of the time"
    - "Your error correction styles are [similar/different]"
    - "You completed the maze [faster/slower] than your twin by [X] seconds"
    - "Your problem-solving synchronicity: [score]/100"
  - [ ] Populate templates with actual data
  - [ ] Return array of insight strings

- [ ] **Task 5**: Implement MazeResults UI (AC: 5, 7)
  - [ ] Create `src/screens/games/MazeResults.tsx`
  - [ ] Display synchronicity score prominently
  - [ ] Show directional preference comparison:
    - Side-by-side bar charts for each twin
    - Highlight matching preferences
  - [ ] Show error pattern comparison
  - [ ] Display completion time comparison
  - [ ] List generated insights
  - [ ] Add share button (screenshot or export)
  - [ ] Apply galaxy theme styling

- [ ] **Task 6**: Handle twin pending state (AC: 8)
  - [ ] Check if twin has completed maze
  - [ ] If not: Show "Waiting for [twin name]" state
  - [ ] Display user's own stats (solo view)
  - [ ] Add "Remind Twin" button (optional)
  - [ ] Poll or check for twin completion

- [ ] **Task 7**: Implement data persistence (AC: 6)
  - [ ] Save MazeResult to assessmentStore
  - [ ] Link result to both twin sessions
  - [ ] Mark sessions as 'analyzed'
  - [ ] Persist to AsyncStorage

- [ ] **Task 8**: Write unit tests
  - [ ] Test directional preference calculation
  - [ ] Test error pattern analysis
  - [ ] Test synchronicity score calculation
  - [ ] Test insight generation with various inputs
  - [ ] Test edge cases (all same direction, zero errors, etc.)

- [ ] **Task 9**: Write integration tests
  - [ ] Test complete analysis flow
  - [ ] Test result persistence
  - [ ] Test waiting state when twin not done
  - [ ] Test result display with real data

## Dev Notes

### Architecture Patterns and Constraints

**Analysis Algorithm:**
- Runs client-side (no backend needed)
- Must complete in < 2 seconds
- Deterministic (same inputs = same outputs)

**Synchronicity Scoring:**
- Normalized to 0-100 scale
- Weighted average of multiple factors
- Higher score = more synchronized

**State Management:**
- Read from assessmentStore
- Write result back to store
- No local state needed for calculations

**Navigation Flow:**
```
CognitiveSynchronyMaze (Story 2.2)
  → MazeResults (Story 2.3) ← YOU ARE HERE
  → [Can navigate to other games or dashboard]
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/MazeResults.tsx` - Results display UI
- `src/services/games/mazeAnalysis.ts` - Analysis algorithms
- `src/components/games/DirectionChart.tsx` - Direction comparison chart
- `src/components/games/ResultCard.tsx` - Shareable result card

**Files to Modify:**
- `src/state/assessmentStore.ts` - Add result storage actions
- `src/navigation/AppNavigator.tsx` - Add MazeResults route

**Design System Components:**
- Galaxy background
- NativeWind for styling
- Chart library: react-native-chart-kit or react-native-svg-charts
- Share: React Native Share or ViewShot for screenshot

**Visualization Options:**
- Bar chart for direction preferences
- Pie chart for error types
- Progress circle for synchronicity score
- Side-by-side comparison layout

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/services/games/mazeAnalysis.test.ts`
- `__tests__/screens/games/MazeResults.test.tsx`
- `__tests__/components/games/DirectionChart.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock assessmentStore
- Mock chart library
- Test with various maze session data

### Project Structure Notes

**Synchronicity Score Formula:**
```typescript
function calculateSynchronicityScore(
  session1: MazeData,
  session2: MazeData
): number {
  const directionScore = calculateDirectionAlignment(session1, session2);
  const errorScore = calculateErrorStyleMatch(session1, session2);
  const timeScore = calculateTimeProximity(session1, session2);

  return (
    directionScore * 0.4 +
    errorScore * 0.3 +
    timeScore * 0.3
  );
}
```

**Direction Alignment:**
```typescript
function calculateDirectionAlignment(
  prefs1: DirectionPreferences,
  prefs2: DirectionPreferences
): number {
  // Calculate similarity of percentage distributions
  const diff = Math.abs(prefs1.up - prefs2.up) +
               Math.abs(prefs1.down - prefs2.down) +
               Math.abs(prefs1.left - prefs2.left) +
               Math.abs(prefs1.right - prefs2.right);

  // Convert difference to similarity score (0-100)
  return 100 - (diff / 4);
}
```

**Insight Templates:**
```typescript
const INSIGHT_TEMPLATES = {
  directionMatch: {
    high: "You're remarkably in sync! You both favor {direction} turns {percentage}% of the time.",
    medium: "You show some similar preferences, both choosing {direction} turns {percentage}% of the time.",
    low: "You have different navigational styles, but that's what makes you unique!"
  },
  errorStyle: {
    similar: "You both handle mistakes similarly, {style} correcting your errors.",
    different: "You have complementary error-handling styles: you're more {style1}, your twin is more {style2}."
  }
  // ... more templates
};
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] MazeResult interface
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces] MazeAnalysisService methods
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Maze result flow
- [Source: docs/epics.md#Story-2.3] Epic story definition
- [Source: docs/Twinship PRD.md#Cognitive-Synchrony-Maze] Insights description

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by story-context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

<!-- Links to debug logs will be added during implementation -->

### Completion Notes List

<!-- Implementation notes will be added here by dev agent -->

### File List

<!-- Files created/modified will be listed here by dev agent -->
