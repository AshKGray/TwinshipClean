# Story 2.10: Game Results History and Comparison Dashboard

Status: drafted

## Story

As a **paired user**,
I want **to view all my game results in one centralized dashboard**,
so that **I can track our twin synchronicity over time and revisit past insights**.

## Acceptance Criteria

1. Display all completed games with completion dates
2. Show synchronicity scores for each game
3. Visualize trends over multiple play sessions
4. Compare current vs previous results
5. Access detailed insights for each game by tapping result card
6. Filter results by game type or date range
7. Overall synchronicity score (average across all games)
8. Empty state for users with no completed games yet

## Tasks / Subtasks

- [ ] **Task 1**: Implement ResultsDashboard UI (AC: 1-2, 7-8)
  - [ ] Create `src/screens/games/ResultsDashboard.tsx`
  - [ ] Display overall synchronicity score at top
  - [ ] List all completed game results:
    - Game name and icon
    - Completion date
    - Synchronicity score
    - "View Details" button
  - [ ] Show empty state if no games completed:
    - "Play games to see your twin synchronicity!"
    - Navigate to PsychicGamesHub button

- [ ] **Task 2**: Implement data queries (AC: 1-2)
  - [ ] Query all GameSessions from assessmentStore
  - [ ] Filter for completed and analyzed sessions
  - [ ] Sort by completion date (most recent first)
  - [ ] Extract synchronicity scores
  - [ ] Group by game type if needed

- [ ] **Task 3**: Implement overall score calculation (AC: 7)
  - [ ] Calculate average synchronicity across all games:
    ```typescript
    function calculateOverallScore(results: GameResult[]): number {
      const sum = results.reduce((acc, r) => acc + r.synchronicity.overallScore, 0);
      return sum / results.length;
    }
    ```
  - [ ] Display prominently at top
  - [ ] Update dynamically as new games completed

- [ ] **Task 4**: Implement trend visualization (AC: 3)
  - [ ] Create line chart showing synchronicity over time
  - [ ] X-axis: Time (dates)
  - [ ] Y-axis: Synchronicity score (0-100)
  - [ ] Different lines/colors for each game type
  - [ ] Use React Native Chart Kit or SVG
  - [ ] Make chart interactive (tap to see details)

- [ ] **Task 5**: Implement comparison feature (AC: 4)
  - [ ] For games played multiple times:
    - Show current score vs previous scores
    - Calculate improvement or change percentage
    - Highlight if score increased/decreased
  - [ ] Display comparison in result cards

- [ ] **Task 6**: Implement result detail navigation (AC: 5)
  - [ ] Make each result card tappable
  - [ ] Navigate to detailed result screen for that game:
    - MazeResults for maze games
    - EmotionResults for emotion games
    - DecisionResults for decision games
    - DuoResults for duo quiz
  - [ ] Pass result ID or session ID

- [ ] **Task 7**: Implement filtering (AC: 6)
  - [ ] Add filter controls:
    - Filter by game type (All, Maze, Emotion, Decision, Duo)
    - Filter by date range (Last week, Last month, All time)
  - [ ] Update displayed results based on filters
  - [ ] Persist filter selections in local state

- [ ] **Task 8**: Add UI enhancements
  - [ ] Pull-to-refresh to reload results
  - [ ] Smooth animations for result cards
  - [ ] Loading states while fetching data
  - [ ] Galaxy-themed design

- [ ] **Task 9**: Write unit tests
  - [ ] Test overall score calculation
  - [ ] Test result sorting
  - [ ] Test filtering logic
  - [ ] Test empty state handling

- [ ] **Task 10**: Write integration tests
  - [ ] Test complete dashboard flow
  - [ ] Test navigation to detail screens
  - [ ] Test filtering updates display

## Dev Notes

### Architecture Patterns and Constraints

**Data Source:**
- Query from assessmentStore
- Read-only view (no mutations)
- Use Zustand selectors for efficient queries

**Performance:**
- Cache dashboard data for quick loading
- Lazy load charts (only when scrolled into view)
- Optimize re-renders with memoization

**Navigation Flow:**
```
PsychicGamesHub or Twindex
  → ResultsDashboard (Story 2.10) ← YOU ARE HERE
  → [Individual game result screens]
```

### Source Tree Components

**Files to Create:**
- `src/screens/games/ResultsDashboard.tsx` - Main dashboard screen
- `src/components/games/ResultCard.tsx` - Individual result card
- `src/components/games/SynchronicityTrendChart.tsx` - Trend visualization
- `src/components/games/ResultsFilter.tsx` - Filter controls

**Files to Modify:**
- `src/state/assessmentStore.ts` - May need dashboard query selectors
- `src/navigation/AppNavigator.tsx` - Add ResultsDashboard route

**Design System Components:**
- Galaxy background
- NativeWind styling
- React Native Chart Kit (charts)
- FlatList for result cards
- Pull-to-refresh component

**Chart Library Options:**
- react-native-chart-kit (easy to use)
- react-native-svg-charts (more customizable)
- Victory Native (feature-rich)

### Testing Standards Summary

**Unit Test Coverage Target:** 80%

**Key Test Files:**
- `__tests__/screens/games/ResultsDashboard.test.tsx`
- `__tests__/components/games/SynchronicityTrendChart.test.tsx`
- `__tests__/components/games/ResultCard.test.tsx`

**Testing Framework:**
- Jest + React Native Testing Library
- Mock assessmentStore with sample data
- Mock chart library
- Test with various data scenarios (0 results, 1 result, many results)

### Project Structure Notes

**Result Card Layout:**
```
┌─────────────────────────────┐
│ [Icon]  Cognitive Maze      │
│         Played: Oct 15      │
│         Score: 87/100       │
│         [View Details →]    │
└─────────────────────────────┘
```

**Overall Score Display:**
```
┌─────────────────────────────┐
│   Twin Synchronicity        │
│         83/100              │
│   ████████████████░░░       │
│   Based on 4 games          │
└─────────────────────────────┘
```

**Filter UI:**
```
Game Type: [All ▼] [Maze] [Emotion] [Decision] [Duo]
Date Range: [All Time ▼] [Last Week] [Last Month]
```

**Dashboard Query:**
```typescript
function getDashboardData(): DashboardData {
  const sessions = assessmentStore.getCompletedGames();
  const results = sessions
    .filter(s => s.status === 'analyzed' && s.result)
    .map(s => s.result!)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  return {
    overallScore: calculateOverallScore(results),
    results,
    trendData: generateTrendData(results),
    completionCount: results.length
  };
}
```

**No Detected Conflicts**

### References

- [Source: docs/tech-spec-epic-2.md#Data-Models-and-Contracts] GameResult interface
- [Source: docs/tech-spec-epic-2.md#APIs-and-Interfaces] AssessmentStore actions
- [Source: docs/tech-spec-epic-2.md#Workflows-and-Sequencing] Dashboard flow
- [Source: docs/epics.md#Story-2.10] Epic story definition
- [Source: docs/Twinship PRD.md] Results tracking requirements

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
